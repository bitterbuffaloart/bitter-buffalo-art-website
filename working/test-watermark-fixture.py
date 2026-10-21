"""Fixture: watermark a copy and leave the source bytes alone."""
import hashlib
import sys
import tempfile
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from watermark_public_previews import LOGO_PATH, apply_logo


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    logo = Image.open(LOGO_PATH)
    with tempfile.TemporaryDirectory() as folder:
        source = Path(folder) / "source.jpg"
        Image.new("RGB", (320, 200), (180, 170, 150)).save(source, format="JPEG", quality=90)
        before = sha(source)
        marked = apply_logo(Image.open(source), logo)
        changed = Path(folder) / "marked.jpg"
        marked.save(changed, format="JPEG", quality=92, subsampling=0)
        after = sha(source)
        if before != after:
            raise SystemExit("source changed")
        if sha(changed) == before:
            raise SystemExit("watermark did not change pixels")
        plain = list(Image.open(source).getdata())
        branded = list(Image.open(changed).getdata())
        if plain == branded:
            raise SystemExit("pixels match")
    print("source-unchanged")
    print("watermark-changed-pixels")


if __name__ == "__main__":
    main()
