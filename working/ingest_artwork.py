"""Prepare a public derivative from a private original without modifying the original."""
import hashlib
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "cloudflare-pages"
sys.path.insert(0, str(ROOT / "working"))
from watermark_public_previews import LOGO_PATH, apply_logo  # noqa: E402


def prepare_public_derivative(source, destination_dir, stem):
    source = Path(source).resolve()
    destination_dir = Path(destination_dir).resolve()
    public_root = PUBLIC.resolve()
    if not str(destination_dir).startswith(str(public_root)):
        raise SystemExit("public derivatives must stay inside cloudflare-pages")
    before = hashlib.sha256(source.read_bytes()).hexdigest()
    logo = Image.open(LOGO_PATH)
    image = Image.open(source)
    width, height = image.size
    display = apply_logo(image, logo, 1400)
    thumb = apply_logo(image, logo, 480)
    large = apply_logo(image, logo, 1600)
    destination_dir.mkdir(parents=True, exist_ok=True)
    display_path = destination_dir / f"{stem}.jpg"
    thumb_path = destination_dir / "thumbs" / f"{stem}.jpg"
    large_path = destination_dir / "large" / f"{stem}.jpg"
    thumb_path.parent.mkdir(parents=True, exist_ok=True)
    large_path.parent.mkdir(parents=True, exist_ok=True)
    for path, picture in ((display_path, display), (thumb_path, thumb), (large_path, large)):
        picture.save(path, format="JPEG", quality=88, optimize=True, subsampling=0, exif=b"")
    after = hashlib.sha256(source.read_bytes()).hexdigest()
    if after != before:
        raise SystemExit("original bytes changed")
    return {
        "sourceUnchanged": True,
        "display": [display.width, display.height],
        "thumb": [thumb.width, thumb.height],
        "paths": [str(display_path), str(thumb_path), str(large_path)],
        "sourcePixels": [width, height],
    }


if __name__ == "__main__":
    if len(sys.argv) != 4:
        raise SystemExit("usage: ingest_artwork.py source destination_dir stem")
    print(json.dumps(prepare_public_derivative(sys.argv[1], sys.argv[2], sys.argv[3])))
