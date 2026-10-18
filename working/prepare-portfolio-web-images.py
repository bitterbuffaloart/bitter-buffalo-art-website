"""Prepare lightweight web previews for Final 33. JPGs only (+ Maroon working JPEG). No F export. No TIFF decode."""
from __future__ import annotations

import csv
import json
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

PORTFOLIO = Path(r"C:\Users\bitte\OneDrive\Desktop\Portfolio for Etsy")
DRAFTS = PORTFOLIO / "phase5-etsy-lumaprints" / "Etsy_Listing_Drafts_Final33.csv"
MAROON_JPG = (
    PORTFOLIO / "phase5-etsy-lumaprints" / "working" / "02_Maroon_Bells_DSC_7500-HDR.jpg"
)
OUT = Path(__file__).resolve().parent.parent / "cloudflare-pages" / "assets" / "images" / "portfolio"
OUT.mkdir(parents=True, exist_ok=True)
MAX_EDGE = 1400
QUALITY = 82


def clean_title(raw: str) -> str:
    t = (raw or "").split("—")[0].strip()
    for suffix in (" Fine Art Print", " (Open & Collector)"):
        if t.endswith(suffix):
            t = t[: -len(suffix)].strip()
    return t


def load_titles() -> dict[int, str]:
    titles: dict[int, str] = {}
    with DRAFTS.open(encoding="utf-8") as f:
        for row in csv.DictReader(f):
            titles[int(row["photo_rank"])] = clean_title(row["title"])
    return titles


def find_source(rank: int) -> Path | None:
    if rank == 2 and MAROON_JPG.exists():
        return MAROON_JPG
    matches = sorted(PORTFOLIO.glob(f"{rank:02d} - *"))
    for m in matches:
        if m.suffix.lower() in {".jpg", ".jpeg"}:
            return m
    return None


def save_jpeg(img: Image.Image, dest: Path) -> None:
    img = img.convert("RGB")
    img.thumbnail((MAX_EDGE, MAX_EDGE), Image.Resampling.LANCZOS)
    img.save(dest, "JPEG", quality=QUALITY, optimize=True)


def placeholder(title: str, rank: int, dest: Path) -> None:
    w, h = 1200, 800
    img = Image.new("RGB", (w, h), (45, 36, 24))
    draw = ImageDraw.Draw(img)
    draw.rectangle((40, 40, w - 40, h - 40), outline=(196, 163, 90), width=2)
    font = ImageFont.load_default()
    label = f"#{rank:02d}  {title}"
    draw.text((70, h // 2 - 20), label[:70], fill=(247, 244, 238), font=font)
    draw.text((70, h // 2 + 20), "Web preview pending — print master on file", fill=(196, 163, 90), font=font)
    img.save(dest, "JPEG", quality=QUALITY)


def main() -> None:
    titles = load_titles()
    manifest = []
    # Featured first: Maroon #02, then remaining ranks in order excluding 02
    order = [2] + [r for r in range(1, 34) if r != 2]
    for rank in order:
        title = titles.get(rank, f"Photograph {rank:02d}")
        dest = OUT / f"{rank:02d}.jpg"
        src = find_source(rank)
        if src and src.exists():
            with Image.open(src) as im:
                save_jpeg(im, dest)
            kind = "web_from_jpeg"
            source = str(src)
        else:
            placeholder(title, rank, dest)
            kind = "placeholder_no_jpeg_export"
            source = ""
        manifest.append(
            {
                "rank": rank,
                "title": title,
                "web_image": f"/assets/images/portfolio/{rank:02d}.jpg",
                "image_kind": kind,
                "source": source,
                "etsy_listing_url": "",
                "purchase_status": "UNPUBLISHED_PORTFOLIO_ONLY",
                "featured": rank == 2,
            }
        )
    out_json = Path(__file__).resolve().parent / "final33-portfolio.json"
    # Store display order with Maroon first
    payload = {
        "updated": "2026-10-17",
        "featured_rank": 2,
        "etsy_shop": "https://www.etsy.com/shop/BitterBuffaloArt",
        "collector_rule": "66 signed collector prints total per photograph across all materials and sizes",
        "photos": manifest,
    }
    out_json.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(json.dumps({"wrote": len(manifest), "out": str(OUT), "json": str(out_json)}, indent=2))


if __name__ == "__main__":
    main()
