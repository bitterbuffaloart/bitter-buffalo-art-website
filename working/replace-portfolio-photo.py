"""Replace one Final 33 web preview without cropping or renaming the slot.

Usage:
  python working/replace-portfolio-photo.py 25 /path/to/master.jpg

The gallery filename stays NN.jpg. EXIF orientation is applied once.
Longest edge is 1400 pixels. JPEG quality is 82.
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageOps

MAX_EDGE = 1400
QUALITY = 82
OUT = Path(__file__).resolve().parent.parent / "cloudflare-pages" / "assets" / "images" / "portfolio"


def main() -> None:
    if len(sys.argv) != 3:
        print("usage: replace-portfolio-photo.py RANK SOURCE", file=sys.stderr)
        sys.exit(2)
    rank = int(sys.argv[1])
    if not 1 <= rank <= 33:
        print("rank must be 1..33", file=sys.stderr)
        sys.exit(2)
    source = Path(sys.argv[2])
    if not source.is_file():
        print("source image was not found", file=sys.stderr)
        sys.exit(1)
    dest = OUT / f"{rank:02d}.jpg"
    with Image.open(source) as im:
        im = ImageOps.exif_transpose(im).convert("RGB")
        im.thumbnail((MAX_EDGE, MAX_EDGE), Image.Resampling.LANCZOS)
        im.save(dest, "JPEG", quality=QUALITY, optimize=True)
        print(f"#{rank:02d} {im.size[0]}x{im.size[1]}")


if __name__ == "__main__":
    main()
