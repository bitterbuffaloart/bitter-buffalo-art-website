"""Read-only derivatives of the Final 33. Originals are never written."""
import csv
import json
from pathlib import Path

from PIL import Image, ImageOps

Image.MAX_IMAGE_PIXELS = None

ROOT = Path(r"C:\Users\bitte\bitter-buffalo-website-etsy-update-2026-10-17")
MANIFEST_CSV = Path(r"C:\Users\bitte\OneDrive\Desktop\Portfolio for Etsy\Final_33_Manifest.csv")
UPLOAD = Path(r"C:\Users\bitte\OneDrive\Desktop\PHOTOGRAPHY_TO_UPLOAD")
COASTERS = Path(r"C:\Users\bitte\OneDrive\Desktop\COASTERS_TO_UPLOAD")
PORTFOLIO_JSON = ROOT / "working" / "final33-portfolio.json"
OUT = ROOT / "cloudflare-pages" / "assets" / "images" / "portfolio"
THUMBS = OUT / "thumbs"
LARGE = OUT / "large"
PRODUCTS = ROOT / "cloudflare-pages" / "assets" / "images" / "products"
REPORT = ROOT / "working" / "portfolio" / "photography-manifest.json"


def aspect(width, height):
    return width / height if height else 0


def close_enough(left, right):
    if not left or not right:
        return False
    return abs(left - right) / right <= 0.015


def prepare(image):
    image = ImageOps.exif_transpose(image)
    if image.mode != "RGB":
        image = image.convert("RGB")
    return image


def write_fit(image, path, edge, quality):
    copy = image.copy()
    before = aspect(copy.width, copy.height)
    copy.thumbnail((edge, edge), Image.Resampling.LANCZOS)
    after = aspect(copy.width, copy.height)
    if not close_enough(after, before):
        raise RuntimeError(f"aspect changed for {path.name}")
    path.parent.mkdir(parents=True, exist_ok=True)
    copy.save(path, "JPEG", quality=quality, optimize=True)
    return copy.width, copy.height


def open_rgb(path):
    with Image.open(path) as image:
        return prepare(image)


def main():
    rows = list(csv.DictReader(MANIFEST_CSV.open(encoding="utf-8-sig", newline="")))
    portfolio = json.loads(PORTFOLIO_JSON.read_text(encoding="utf-8"))
    by_rank = {item["rank"]: item for item in portfolio["photos"]}
    records = []
    restored = 0
    for row in rows:
        rank = int(row["rank"])
        title = row["title"]
        source_w = int(row["width"])
        source_h = int(row["height"])
        source_ratio = aspect(source_w, source_h)
        existing = by_rank[rank]
        placeholder = existing.get("image_kind") == "placeholder_no_jpeg_export"
        upload = next(UPLOAD.glob(f"{rank:02d} *.jpg"), None)
        used = None
        error = ""
        image = None
        if placeholder and upload:
            candidate = open_rgb(upload)
            if close_enough(aspect(candidate.width, candidate.height), source_ratio):
                image = candidate
                used = upload
            else:
                error = "upload-aspect-mismatch"
                candidate.close()
        if placeholder and image is None:
            original = Path(row["copy_path"])
            if original.exists():
                image = open_rgb(original)
                if not close_enough(aspect(image.width, image.height), source_ratio):
                    error = (error + "; " if error else "") + "original-aspect-mismatch"
                used = original
            else:
                error = (error + "; " if error else "") + "original-missing"
        if placeholder and image is not None:
            display_w, display_h = write_fit(image, OUT / f"{rank:02d}.jpg", 1600, 86)
            thumb_w, thumb_h = write_fit(image, THUMBS / f"{rank:02d}.jpg", 480, 80)
            large_w, large_h = write_fit(image, LARGE / f"{rank:02d}.jpg", 2400, 88)
            existing["image_kind"] = "web_from_verified_original"
            existing["source"] = str(used)
            restored += 1
        else:
            current = open_rgb(OUT / f"{rank:02d}.jpg")
            display_w, display_h = current.width, current.height
            thumb_w, thumb_h = write_fit(current, THUMBS / f"{rank:02d}.jpg", 480, 80)
            large_path = LARGE / f"{rank:02d}.jpg"
            if upload and close_enough(aspect(open_rgb(upload).width, open_rgb(upload).height), source_ratio):
                source_image = open_rgb(upload)
                large_w, large_h = write_fit(source_image, large_path, 2400, 88)
                enlarged_from = str(upload)
            else:
                large_w, large_h = write_fit(current, large_path, 2400, 88)
                enlarged_from = str(OUT / f"{rank:02d}.jpg")
            existing["source"] = existing.get("source") or str(row["copy_path"])
            enlarged_note = enlarged_from
            records.append({
                "portfolioNumber": rank,
                "title": title,
                "sourcePath": existing["source"],
                "verifiedOriginal": row["copy_path"],
                "sourceWidth": source_w,
                "sourceHeight": source_h,
                "aspectClass": round(source_ratio, 4),
                "display": f"/assets/images/portfolio/{rank:02d}.jpg",
                "displayWidth": display_w,
                "displayHeight": display_h,
                "thumbnail": f"/assets/images/portfolio/thumbs/{rank:02d}.jpg",
                "thumbnailWidth": thumb_w,
                "thumbnailHeight": thumb_h,
                "enlarged": f"/assets/images/portfolio/large/{rank:02d}.jpg",
                "enlargedWidth": large_w,
                "enlargedHeight": large_h,
                "galleryReference": f"/photography/#portfolio-{rank:02d}",
                "imageKind": existing["image_kind"],
                "recoveredThisRun": False,
                "printHolds": row.get("print_holds") or "",
                "exportError": error,
                "enlargedFrom": enlarged_note,
            })
            continue
        records.append({
            "portfolioNumber": rank,
            "title": title,
            "sourcePath": str(used),
            "verifiedOriginal": row["copy_path"],
            "sourceWidth": source_w,
            "sourceHeight": source_h,
            "aspectClass": round(source_ratio, 4),
            "display": f"/assets/images/portfolio/{rank:02d}.jpg",
            "displayWidth": display_w,
            "displayHeight": display_h,
            "thumbnail": f"/assets/images/portfolio/thumbs/{rank:02d}.jpg",
            "thumbnailWidth": thumb_w,
            "thumbnailHeight": thumb_h,
            "enlarged": f"/assets/images/portfolio/large/{rank:02d}.jpg",
            "enlargedWidth": large_w,
            "enlargedHeight": large_h,
            "galleryReference": f"/photography/#portfolio-{rank:02d}",
            "imageKind": existing["image_kind"],
            "recoveredThisRun": True,
            "printHolds": row.get("print_holds") or "",
            "exportError": error,
        })
    portfolio["updated"] = "2026-10-19"
    portfolio["photos"] = [by_rank[item["portfolioNumber"]] for item in records]
    PORTFOLIO_JSON.write_text(json.dumps(portfolio, indent=2) + "\n", encoding="utf-8")
    coasters = []
    for folder in sorted(path for path in COASTERS.iterdir() if path.is_dir()):
        photo = next(iter(sorted(folder.glob("01-*.jpg"))), None)
        if not photo:
            continue
        code = folder.name.split(" listing ")[0]
        listing = folder.name.split(" listing ")[-1] if " listing " in folder.name else ""
        slug = code.lower().replace(" ", "-")
        image = open_rgb(photo)
        display = PRODUCTS / f"{slug}.jpg"
        thumb = PRODUCTS / "thumbs" / f"{slug}.jpg"
        display_w, display_h = write_fit(image, display, 1600, 86)
        thumb_w, thumb_h = write_fit(image, thumb, 480, 80)
        coasters.append({
            "folder": folder.name,
            "code": code,
            "listingIdFromFolder": listing,
            "source": str(photo),
            "display": f"/assets/images/products/{slug}.jpg",
            "displayWidth": display_w,
            "displayHeight": display_h,
            "thumbnail": f"/assets/images/products/thumbs/{slug}.jpg",
            "thumbnailWidth": thumb_w,
            "thumbnailHeight": thumb_h,
        })
    payload = {"restored": restored, "photographs": records, "coasters": coasters}
    REPORT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"restored={restored} photographs={len(records)} coasters={len(coasters)}")


if __name__ == "__main__":
    main()
