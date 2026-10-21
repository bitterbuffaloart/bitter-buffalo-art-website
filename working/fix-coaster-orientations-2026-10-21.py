#!/usr/bin/env python3
"""Apply the artist's six one-time coaster orientation corrections.

Run from the website repository root. The original published bytes are
preserved under working/laser-art-originals and in Git history.
"""
import hashlib
import json
import shutil
from pathlib import Path
from tempfile import TemporaryDirectory
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "cloudflare-pages/assets/images/products"
CATALOG = ROOT / "cloudflare-pages/assets/data/catalog.json"
BACKUPS = ROOT / "working/laser-art-originals/coasters-before-owner-corrections-2026-10-21"
LEDGER = ROOT / "working/coaster-orientation-corrections-2026-10-21.json"
OPS = {
    "01-coaster-4pc-001.jpg": "left",
    "03-coaster-4pc-003.jpg": "right",
    "04-coaster-5pc-001.jpg": "right",
    "05-coaster-4pc-004.jpg": "left",
    "06-coaster-4pc-005.jpg": "flip_vertical",
    "07-coaster-4pc-006.jpg": "left",
}
ORIGINAL_BLOBS = {
    "01-coaster-4pc-001.jpg": ("9cfe32320f2959af3929b8f2f18552cb71ffc55c", "1c366a486116b025ed191ecfeae55109cc7049aa"),
    "03-coaster-4pc-003.jpg": ("2ac5b296d03ea2338b33d8c21b1074bf96d98ccb", "bce535500c68e0c8ab6407bb2691bd90df81f5b2"),
    "04-coaster-5pc-001.jpg": ("c6eb8c15f87d3bf92e7afc1ab3501af0a208bd49", "be84dd12c9ede5f0e8249489ae4b129a9cba699b"),
    "05-coaster-4pc-004.jpg": ("ff8e9c0877b5aacb1ad2ff92fd3e716660f15a38", "9b91cb03af5f3554111daa841be7ccbc14240a9e"),
    "06-coaster-4pc-005.jpg": ("21e003996ee5775426b34cd524120d3806f8fd7f", "4ee6591c8555346767bfd8e5ca91da3cea3a06b5"),
    "07-coaster-4pc-006.jpg": ("6d4f62380919bccbdad292685e4ce6196fac1267", "cb6d85dd1c1aa7f771cb84cd8580b3f8ec9a1dca"),
}
METHODS = {"left": Image.Transpose.ROTATE_90,
           "right": Image.Transpose.ROTATE_270,
           "flip_vertical": Image.Transpose.FLIP_TOP_BOTTOM}

def blobsha(data):
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()

def main():
    if LEDGER.exists():
        raise SystemExit("Owner corrections already applied; do NOT rotate again.")
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    original = {}
    for name in OPS:
        for i, sub in enumerate(("", "thumbs/")):
            source = ASSETS / (sub + name)
            data = source.read_bytes()
            actual = blobsha(data)
            if actual != ORIGINAL_BLOBS[name][i]:
                raise SystemExit(f"STOP: {source} changed; found blob {actual}, expected {ORIGINAL_BLOBS[name][i]}.")
            with Image.open(source) as im:
                if im.format != "JPEG" or im.getexif().get(274, 1) != 1:
                    raise SystemExit(f"STOP: unexpected JPEG orientation in {source}.")
                im.verify()
            original[sub + name] = data
    updates = {}
    with TemporaryDirectory(prefix="coaster-correction-") as scratch:
        scratch = Path(scratch)
        for name, operation in OPS.items():
            for sub in ("", "thumbs/"):
                relative = sub + name
                dst = scratch / relative
                dst.parent.mkdir(parents=True, exist_ok=True)
                with Image.open(ASSETS / relative) as im:
                    size_before = im.size
                    result = im.transpose(METHODS[operation])
                    exif = im.getexif()
                    exif.pop(274, None)
                    saveopts = dict(format="JPEG", quality=96, subsampling=0, optimize=True)
                    if len(exif): saveopts["exif"] = exif.tobytes()
                    if im.info.get("icc_profile"): saveopts["icc_profile"] = im.info["icc_profile"]
                    result.save(dst, **saveopts)
                    target_size = size_before[::-1] if operation in ("left", "right") else size_before
                    with Image.open(dst) as test:
                        test.load()
                        assert test.size == target_size
                        assert test.getexif().get(274, 1) == 1
                updates[relative] = {
                    "operation": operation,
                    "old_size": size_before,
                    "new_size": target_size,
                    "old_sha256": hashlib.sha256(original[relative]).hexdigest(),
                    "new_sha256": hashlib.sha256(dst.read_bytes()).hexdigest(),
                }
        updated_ids = []
        for product in catalog["products"]:
            for name, operation in OPS.items():
                if ("/products/" + name) in product.get("images", ""):
                    if operation in ("left", "right"):
                        product["display_width"], product["display_height"] = product["display_height"], product["display_width"]
                        product["thumb_width"], product["thumb_height"] = product["thumb_height"], product["thumb_width"]
                    updated_ids.append(product["id"])
        if len(updated_ids) != 6 or len(set(updated_ids)) != 6:
            raise SystemExit(f"STOP: expected six catalog records: {updated_ids}")
        for relative, data in original.items():
            backup = BACKUPS / relative
            backup.parent.mkdir(parents=True, exist_ok=True)
            if backup.exists(): raise SystemExit(f"STOP: existing backup {backup}")
            backup.write_bytes(data)
        for relative in updates:
            shutil.copy2(scratch / relative, ASSETS / relative)
    CATALOG.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    LEDGER.write_text(json.dumps({
        "instructions": "Owner-specified rotation of current published images once. 02 and 08 unchanged.",
        "note": "This changes only website images, thumbnails, and image dimensions. Etsy listing photos and dress sizes are not changed.",
        "files": updates, "catalog_ids": updated_ids,
    }, indent=2) + "\n", encoding="utf-8")
    print("Completed six original-preserving coaster image and thumbnail corrections.")

if __name__ == "__main__":
    main()
