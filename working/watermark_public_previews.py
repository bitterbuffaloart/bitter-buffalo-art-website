"""Embed the exact supplied logo into public viewing copies.

Never writes outside cloudflare-pages. Never reads or writes F: or C: masters.
A second run skips files whose bytes are already the recorded watermarked output.
"""
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "cloudflare-pages"
LOGO_PATH = ROOT / "working" / "Exact_Bitter_Buffalo_Logo_Transparent.png"
LEDGER_PATH = ROOT / "working" / "public-watermark-ledger-2026-10-21.json"
TARGETS = [
    PUBLIC / "assets" / "images" / "portfolio",
    PUBLIC / "assets" / "images" / "sketchbook",
    PUBLIC / "assets" / "sketchbook",
]
EXTRA = [PUBLIC / "assets" / "images" / "photography.jpg"]
OPACITY = 0.24
WIDTH_FRACTION = 0.44
JPEG_QUALITY = 88


def sha256(path):
    digest = hashlib.sha256()
    digest.update(path.read_bytes())
    return digest.hexdigest()


def load_ledger():
    if not LEDGER_PATH.exists():
        return {
            "logo": LOGO_PATH.name,
            "opacity": OPACITY,
            "widthFraction": WIDTH_FRACTION,
            "placement": "center",
            "files": {},
        }
    return json.loads(LEDGER_PATH.read_text(encoding="utf-8"))


def save_ledger(ledger):
    LEDGER_PATH.write_text(json.dumps(ledger, indent=2) + "\n", encoding="utf-8")


def load_logo():
    if not LOGO_PATH.is_file():
        raise SystemExit("exact supplied logo is missing")
    logo = Image.open(LOGO_PATH).convert("RGBA")
    if logo.getchannel("A").getextrema() == (255, 255):
        raise SystemExit("exact logo is not transparent")
    if logo.width < 300 or logo.height < 200:
        raise SystemExit("exact logo is not the full-resolution file")
    return logo


def max_edge_for(path):
    if "thumbs" in path.parts:
        return 480
    return 1600


def targets():
    files = []
    for folder in TARGETS:
        if folder.exists():
            files.extend(path for path in folder.rglob("*.jpg") if path.is_file())
    for path in EXTRA:
        if path.is_file():
            files.append(path)
    unique = []
    seen = set()
    public_root = str(PUBLIC.resolve())
    for path in files:
        key = path.resolve()
        if key in seen:
            continue
        if not str(key).startswith(public_root):
            raise SystemExit(f"refusing to watermark outside the public site: {path}")
        seen.add(key)
        unique.append(path)
    return unique


def apply_logo(image, logo, max_edge=None):
    """Center the whole supplied logo. Resize the photo before the logo so the mark stays 44% of that preview."""
    image = ImageOps.exif_transpose(image).convert("RGB")
    if max_edge and max(image.size) > max_edge:
        image.thumbnail((max_edge, max_edge), Image.Resampling.LANCZOS)
    base = image.convert("RGBA")
    max_width = max(1, int(base.width * WIDTH_FRACTION))
    max_height = max(1, int(base.height * 0.48))
    factor = min(max_width / logo.width, max_height / logo.height)
    width = max(1, round(logo.width * factor))
    height = max(1, round(logo.height * factor))
    mark = logo.resize((width, height), Image.Resampling.LANCZOS).convert("RGBA")
    mark.putalpha(mark.getchannel("A").point(lambda value: round(value * OPACITY)))
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    layer.alpha_composite(mark, ((base.width - width) // 2, (base.height - height) // 2))
    return Image.alpha_composite(base, layer).convert("RGB")


def main():
    logo = load_logo()
    ledger = load_ledger()
    done = set(ledger.get("files", {}).values())
    changed = 0
    skipped = 0
    for path in targets():
        before = sha256(path)
        if before in done:
            skipped += 1
            continue
        relative = path.relative_to(ROOT).as_posix()
        marked = apply_logo(Image.open(path), logo, max_edge_for(path))
        marked.save(path, format="JPEG", quality=JPEG_QUALITY, optimize=True, subsampling=0, exif=b"")
        after = sha256(path)
        ledger.setdefault("files", {})[relative] = after
        done.add(after)
        changed += 1
        if changed % 25 == 0:
            save_ledger(ledger)
            print(f"watermarked {changed}")
    ledger["logoSha256"] = sha256(LOGO_PATH)
    ledger["opacity"] = OPACITY
    ledger["widthFraction"] = WIDTH_FRACTION
    ledger["placement"] = "center"
    save_ledger(ledger)
    print(json.dumps({"changed": changed, "skipped": skipped, "recorded": len(ledger["files"])}))


if __name__ == "__main__":
    main()
