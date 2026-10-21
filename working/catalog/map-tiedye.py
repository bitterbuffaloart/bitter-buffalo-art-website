"""Map two photographed tie-dye garments. Does not invent prices or extra products."""
import json
from pathlib import Path

from PIL import Image, ImageOps

Image.MAX_IMAGE_PIXELS = None

ROOT = Path(r"C:\Users\bitte\bitter-buffalo-website-etsy-update-2026-10-17")
MANIFEST = ROOT / "working" / "portfolio" / "photography-manifest.json"
OUT = ROOT / "cloudflare-pages" / "assets" / "images" / "tie-dye"
FOLDER = Path(r"C:\Users\bitte\OneDrive\Desktop\New folder")

GARMENTS = [
    {
        "id": "bb-tiedye-overalls",
        "name": "Hand-dyed overalls",
        "source": FOLDER / "20260630_124345_edited.jpg",
        "related": ["20260630_125013.jpg"],
        "note": "Front of one pair, from the edited original that removes the floor and feet. The purple and green view in the same folder is the reverse of this garment, not a second product.",
        "stem": "overalls",
    },
    {
        "id": "bb-tiedye-lace-top",
        "name": "Hand-dyed lace top",
        "source": FOLDER / "20260630_125720.jpg",
        "related": ["20260630_130013.jpg"],
        "note": "Front of one top. The spiral view in the same folder is the back of this garment, not a second product.",
        "stem": "lace-top",
    },
]


def write_fit(image, path, edge, quality):
    copy = image.copy()
    before = copy.width / copy.height
    copy.thumbnail((edge, edge), Image.Resampling.LANCZOS)
    after = copy.width / copy.height
    if abs(after - before) / before > 0.015:
        raise SystemExit(f"aspect changed for {path.name}")
    if copy.width > image.width or copy.height > image.height:
        raise SystemExit(f"upscale refused for {path.name}")
    path.parent.mkdir(parents=True, exist_ok=True)
    copy.save(path, "JPEG", quality=quality, optimize=True)
    return copy.size


def measure(path):
    with Image.open(path) as image:
        oriented = ImageOps.exif_transpose(image)
        if oriented.mode != "RGB":
            oriented = oriented.convert("RGB")
        return oriented


def main():
    records = []
    for item in GARMENTS:
        if not item["source"].is_file():
            raise SystemExit(f"missing tie-dye source {item['source']}")
        image = measure(item["source"])
        display_w, display_h = write_fit(image, OUT / f"{item['stem']}-display.jpg", 1600, 86)
        thumb_w, thumb_h = write_fit(image, OUT / f"{item['stem']}-thumb.jpg", 480, 80)
        large_w, large_h = write_fit(image, OUT / f"{item['stem']}-large.jpg", 2400, 88)
        for related in item["related"]:
            if not (FOLDER / related).is_file():
                raise SystemExit(f"missing related view {related}")
        records.append({
            "id": item["id"],
            "name": item["name"],
            "sourcePath": str(item["source"]),
            "sourceFilename": item["source"].name,
            "sourceWidth": image.width,
            "sourceHeight": image.height,
            "relatedViews": item["related"],
            "note": item["note"],
            "display": f"/assets/images/tie-dye/{item['stem']}-display.jpg",
            "displayWidth": display_w,
            "displayHeight": display_h,
            "thumbnail": f"/assets/images/tie-dye/{item['stem']}-thumb.jpg",
            "thumbnailWidth": thumb_w,
            "thumbnailHeight": thumb_h,
            "enlarged": f"/assets/images/tie-dye/{item['stem']}-large.jpg",
            "enlargedWidth": large_w,
            "enlargedHeight": large_h,
            "pricePublished": False,
        })
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    manifest["tieDye"] = records
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"tieDye={len(records)}")


if __name__ == "__main__":
    main()
