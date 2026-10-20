"""Verify portfolio exports and write the mapping, exceptions, and catalog columns.

Does not crop, overwrite originals, or write print masters.
"""
import csv
import json
import re
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "working" / "portfolio" / "photography-manifest.json"
PORTFOLIO = ROOT / "cloudflare-pages" / "assets" / "images" / "portfolio"
PRODUCTS = ROOT / "working" / "catalog" / "products.csv"
MAPPING = ROOT / "working" / "catalog" / "photography-mapping.json"
EXCEPTIONS = ROOT / "working" / "catalog" / "photography-mapping-exceptions.md"
SKU_MAPPING = Path(r"C:\Users\bitte\bitter-buffalo-etsy-launch\lumaprints-upload-return\sku-mapping.csv")
WORKSHEET = Path(r"C:\Users\bitte\bitter-buffalo-website-event-posters-881d\working\pricing\RETAIL_MATRIX_42_2026-10-19.csv")
PRICING_DIR = ROOT / "working" / "pricing"

PRINT_BLOCKED = {14, 18}


def jpeg_size(path):
    with path.open("rb") as handle:
        if handle.read(2) != b"\xff\xd8":
            return None
        sof = set(range(0xC0, 0xC4)) | set(range(0xC5, 0xC8)) | set(range(0xC9, 0xCC)) | set(range(0xCD, 0xD0))
        while True:
            marker = handle.read(1)
            if not marker:
                return None
            while marker != b"\xff":
                marker = handle.read(1)
                if not marker:
                    return None
            code = handle.read(1)
            if not code or code in {b"\xd8", b"\xd9", b"\x00", b"\x01"} or 0xD0 <= code[0] <= 0xD7:
                continue
            length = int.from_bytes(handle.read(2), "big")
            if code[0] in sof:
                handle.read(1)
                height = int.from_bytes(handle.read(2), "big")
                width = int.from_bytes(handle.read(2), "big")
                return width, height
            handle.seek(length - 2, 1)


def tiff_size(path):
    with path.open("rb") as handle:
        endian = handle.read(2)
        if endian == b"II":
            order = "<"
        elif endian == b"MM":
            order = ">"
        else:
            return None
        if struct.unpack(order + "H", handle.read(2))[0] != 42:
            return None
        handle.seek(struct.unpack(order + "I", handle.read(4))[0])
        count = struct.unpack(order + "H", handle.read(2))[0]
        width = height = None
        for _ in range(count):
            tag, kind, number = struct.unpack(order + "HHI", handle.read(8))
            raw = handle.read(4)
            if number != 1:
                continue
            if kind == 3:
                value = struct.unpack(order + "H", raw[:2])[0]
            elif kind == 4:
                value = struct.unpack(order + "I", raw)[0]
            else:
                continue
            if tag == 256:
                width = value
            elif tag == 257:
                height = value
        if width and height:
            return width, height
    return None


def image_size(path):
    if not path.is_file():
        return None
    suffix = path.suffix.lower()
    if suffix in {".jpg", ".jpeg"}:
        return jpeg_size(path)
    if suffix in {".tif", ".tiff"}:
        return tiff_size(path)
    return None


def frame_name(width, height):
    if not width or not height:
        return "unknown"
    ratio = max(width, height) / min(width, height)
    if abs(ratio - 1.5) / 1.5 <= 0.015:
        return "3:2"
    if abs(ratio - (16 / 9)) / (16 / 9) <= 0.015:
        return "16:9"
    if ratio >= 2:
        return "panoramic"
    return "other"


def ratios_close(left, right):
    if not left or not right:
        return False
    return abs(left - right) / right <= 0.015


def recorded_etsy_ids():
    found = {}
    if not SKU_MAPPING.is_file():
        return found
    with SKU_MAPPING.open(newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            listing = (row.get("etsy_listing_id") or "").strip()
            if not listing:
                continue
            found.setdefault(int(row["rank"]), set()).add(listing)
    return {rank: sorted(values) for rank, values in found.items()}


def quote_csv(row):
    return ",".join(f'"{value.replace(chr(34), chr(34)+chr(34))}"' if ("," in value or '"' in value) else value for value in row)


def extend_products(etsy_by_rank):
    with PRODUCTS.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    fields = [
        "id", "name", "category", "images", "description", "materials_and_sizes",
        "retail_price", "supplier_cost", "shipping_estimate", "availability",
        "inquiry_or_external_link", "status", "sku", "etsy_listing_id", "inventory",
        "production_cost", "shipping_cost", "fee_estimate", "price_approval",
        "variations", "lumaprints_confirmed",
    ]
    written = []
    for row in rows:
        number = None
        match = re.search(r"bb-photo-(\d+)", row["id"])
        if match:
            number = int(match.group(1))
        listing = ""
        if number and etsy_by_rank.get(number):
            listing = etsy_by_rank[number][0] if len(etsy_by_rank[number]) == 1 else ""
        described = re.search(r"listing (\d+)", row["description"])
        if described:
            listing = described.group(1)
        status = "blocked" if number in PRINT_BLOCKED else "active"
        availability = "on-hold" if number in PRINT_BLOCKED else row["availability"]
        variations = row.get("variations") or ""
        if number:
            variations = "12×18 price not published | 16×24 price not published | 20×30 on hold"
            if row["id"] == "bb-photo-01":
                variations = "12×18 price not published | 16×24 $199.33 owner-confirmed | 20×30 on hold"
        price_approval = "owner-confirmed" if row["retail_price"] == "199.33" and row["id"] == "bb-photo-01" else ""
        written.append({
            **{key: row.get(key, "") for key in fields},
            "availability": availability,
            "status": status,
            "sku": row["id"],
            "etsy_listing_id": listing,
            "inventory": "made-to-order" if number else "",
            "production_cost": "",
            "shipping_cost": "",
            "fee_estimate": "",
            "price_approval": price_approval,
            "variations": variations,
            "lumaprints_confirmed": "no",
        })
    with PRODUCTS.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, lineterminator="\n")
        writer.writeheader()
        writer.writerows(written)


def copy_worksheet():
    PRICING_DIR.mkdir(exist_ok=True)
    if not WORKSHEET.is_file():
        return 0
    target = PRICING_DIR / "RETAIL_MATRIX_42_2026-10-19.csv"
    target.write_bytes(WORKSHEET.read_bytes())
    return sum(1 for _ in target.read_text(encoding="utf-8").splitlines()) - 1


def main():
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    etsy_by_rank = recorded_etsy_ids()
    photographs = []
    exceptions = []
    restored = 0
    for item in manifest["photographs"]:
        number = item["portfolioNumber"]
        display = PORTFOLIO / f"{number:02}.jpg"
        thumb = PORTFOLIO / "thumbs" / f"{number:02}.jpg"
        large = PORTFOLIO / "large" / f"{number:02}.jpg"
        display_size = jpeg_size(display) if display.is_file() else None
        thumb_size = jpeg_size(thumb) if thumb.is_file() else None
        large_size = jpeg_size(large) if large.is_file() else None
        original = Path(item.get("verifiedOriginal") or item.get("sourcePath") or "")
        original_exists = original.is_file()
        original_size = image_size(original) if original_exists else None
        source_ratio = None
        if item.get("sourceWidth") and item.get("sourceHeight"):
            source_ratio = item["sourceWidth"] / item["sourceHeight"]
        display_ratio = (display_size[0] / display_size[1]) if display_size else None
        frame = frame_name(*(display_size or (0, 0)))
        ratio_ok = ratios_close(display_ratio, source_ratio) if display_ratio and source_ratio else False
        if item.get("recoveredThisRun"):
            restored += 1
        reasons = []
        if not display_size or not thumb_size or not large_size:
            reasons.append("A display, thumbnail, or enlarged JPEG is missing.")
        elif not ratio_ok:
            reasons.append("The web export aspect does not match the recorded source aspect within 1.5 percent. It was not cropped to force a fit.")
        if not original_exists:
            reasons.append("The recorded original is not on this machine.")
        elif original_size and source_ratio and not ratios_close(original_size[0] / original_size[1], source_ratio):
            reasons.append("The file at the recorded original path does not match the recorded source aspect.")
        if number in PRINT_BLOCKED:
            reasons.append("Prints stay blocked. The published JPEG is watermarked and no clean master was cleared in the repository.")
        listing_ids = etsy_by_rank.get(number, [])
        if len(listing_ids) > 1:
            reasons.append("More than one Etsy listing id is recorded for this photograph. None was chosen.")
        verification = "verified-web-export"
        if number in PRINT_BLOCKED:
            verification = "blocked-watermark-no-clean-master"
        elif reasons:
            verification = "exception"
        record = {
            "portfolioNumber": number,
            "title": item["title"],
            "originalSource": item.get("verifiedOriginal") or "",
            "originalPresent": original_exists,
            "originalWidth": original_size[0] if original_size else None,
            "originalHeight": original_size[1] if original_size else None,
            "webExport": f"/assets/images/portfolio/{number:02}.jpg",
            "webWidth": display_size[0] if display_size else None,
            "webHeight": display_size[1] if display_size else None,
            "thumbnail": f"/assets/images/portfolio/thumbs/{number:02}.jpg",
            "enlarged": f"/assets/images/portfolio/large/{number:02}.jpg",
            "aspectRatio": round(display_ratio, 4) if display_ratio else None,
            "frame": frame,
            "galleryReference": item.get("galleryReference") or f"/photography/#bb-photo-{number:02}",
            "sku": f"bb-photo-{number:02}",
            "etsyListingIds": listing_ids,
            "etsyListingStatus": "recorded-not-reverified" if listing_ids else "no-listing-id-recorded",
            "lumaprintsProduct": "premium 1.5-inch floating-frame canvas",
            "lumaprintsSubcategoryId": None,
            "lumaprintsConfigurationConfirmed": False,
            "priorUnframedSubcategoryNotSelected": 101003,
            "verificationStatus": verification,
            "recoveredExport": bool(item.get("recoveredThisRun")),
        }
        photographs.append(record)
        if reasons:
            exceptions.append((record, reasons))
    MAPPING.write_text(json.dumps({
        "photographs": photographs,
        "recoveredExports": restored,
        "portfolioTotal": len(photographs),
        "lumaprintsVariantsConfirmed": 0,
    }, indent=2) + "\n", encoding="utf-8")
    lines = [
        "# Photography mapping exceptions",
        "",
        "Web exports were not cropped or replaced. Originals were not modified.",
        "",
    ]
    if not exceptions:
        lines.append("No exceptions.")
    for record, reasons in exceptions:
        lines.append(f"## #{record['portfolioNumber']:02} {record['title']}")
        lines.append("")
        for reason in reasons:
            lines.append(f"- {reason}")
        lines.append("")
    EXCEPTIONS.write_text("\n".join(lines), encoding="utf-8")
    extend_products(etsy_by_rank)
    worksheet_rows = copy_worksheet()
    print(f"mapped={len(photographs)} restored={restored} exceptions={len(exceptions)} worksheet_rows={worksheet_rows}")


if __name__ == "__main__":
    main()
