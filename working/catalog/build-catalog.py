"""Build the editable catalog from verified manifests. Does not invent prices."""
import csv
import json
import re
from pathlib import Path
from urllib.parse import quote

ROOT = Path(r"C:\Users\bitte\bitter-buffalo-website-etsy-update-2026-10-17")
PHOTO = json.loads((ROOT / "working" / "portfolio" / "photography-manifest.json").read_text(encoding="utf-8"))
OUT_JSON = ROOT / "cloudflare-pages" / "assets" / "data" / "catalog.json"
OUT_CSV = ROOT / "working" / "catalog" / "products.csv"

COLUMNS = [
    "id",
    "name",
    "category",
    "images",
    "description",
    "materials_and_sizes",
    "retail_price",
    "supplier_cost",
    "shipping_estimate",
    "availability",
    "inquiry_or_external_link",
]


def inquiry(piece):
    return "/contact/?topic=print&piece=" + quote(piece)


def print_slug(title, number):
    if number == 1:
        return "grand-tetons"
    text = title.lower().replace("'", "").replace("’", "")
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-")


def image_list(display, thumb, enlarged):
    return "|".join([thumb, display, enlarged])


def framed_16x24_ppi(item):
    width = item["sourceWidth"]
    height = item["sourceHeight"]
    long_side = max(width, height)
    short_side = min(width, height)
    if abs((long_side / short_side) - 1.5) / 1.5 > 0.005:
        return None
    print_width, print_height = (24, 16) if width >= height else (16, 24)
    return round(min(width / print_width, height / print_height) + 1e-9, 1)


def print_ready(item):
    ppi = framed_16x24_ppi(item)
    return ppi is not None and ppi >= 200


def photo_row(item):
    number = item["portfolioNumber"]
    name = item["title"]
    link = f"/photography/prints/{print_slug(name, number)}/"
    if print_ready(item):
        materials = "Approved price: 16×24 open-edition premium 1.5-inch framed canvas $199.33. Other sizes are pending or by inquiry. Checkout is not enabled."
        retail = "199.33"
        availability = "inquiry"
    else:
        materials = "No approved price is published. A listed size is omitted when it would crop the photograph or the file is below the PPI minimum. Checkout is not enabled."
        retail = ""
        availability = "inquiry"
    return {
        "id": item["permanentId"],
        "name": name,
        "category": "photography prints",
        "images": image_list(item["display"], item["thumbnail"], item["enlarged"]),
        "description": item["story"],
        "materials_and_sizes": materials,
        "retail_price": retail,
        "supplier_cost": "",
        "shipping_estimate": "",
        "availability": availability,
        "inquiry_or_external_link": link,
        "display_width": item["displayWidth"],
        "display_height": item["displayHeight"],
        "thumb_width": item["thumbnailWidth"],
        "thumb_height": item["thumbnailHeight"],
    }


def coaster_row(item):
    code = item["code"]
    pieces = "5-piece" if "5PC" in code else "4-piece"
    return {
        "id": "bb-" + code.lower().replace(" ", "-"),
        "name": f"Wood coaster set {code}",
        "category": "laser",
        "images": image_list(item["display"], item["thumbnail"], item["display"]),
        "description": f"Photographed {pieces} wood coaster set from the studio upload folder {item['folder']}.",
        "materials_and_sizes": "Wood coasters. Piece count is in the product code. Price is not published.",
        "retail_price": "",
        "supplier_cost": "",
        "shipping_estimate": "",
        "availability": "inquiry",
        "inquiry_or_external_link": "/contact/?topic=laser&piece=" + quote(code),
        "display_width": item["displayWidth"],
        "display_height": item["displayHeight"],
        "thumb_width": item["thumbnailWidth"],
        "thumb_height": item["thumbnailHeight"],
    }


def tiedye_row(item=None):
    if item is None:
        return {
            "id": "bb-tiedye-earth-tones",
            "name": "Backcountry earth tones",
            "category": "tie-dye",
            "images": "/assets/images/tie-dye.jpg|/assets/images/tie-dye.jpg|/assets/images/tie-dye.jpg",
            "description": "Hand-dyed shirt photographed for the tie-dye portfolio. Price is not published.",
            "materials_and_sizes": "Hand-dyed cloth. Size is not recorded in the catalog.",
            "retail_price": "",
            "supplier_cost": "",
            "shipping_estimate": "",
            "availability": "inquiry",
            "inquiry_or_external_link": "https://www.etsy.com/shop/BitterBuffaloArt",
            "display_width": 1000,
            "display_height": 1000,
            "thumb_width": 1000,
            "thumb_height": 1000,
        }
    return {
        "id": item["id"],
        "name": item["name"],
        "category": "tie-dye",
        "images": image_list(item["display"], item["thumbnail"], item["enlarged"]),
        "description": item["note"] + " Price is not published.",
        "materials_and_sizes": "Hand-dyed cloth. Size is not recorded in the catalog.",
        "retail_price": "",
        "supplier_cost": "",
        "shipping_estimate": "",
        "availability": "inquiry",
        "inquiry_or_external_link": "https://www.etsy.com/shop/BitterBuffaloArt",
        "display_width": item["displayWidth"],
        "display_height": item["displayHeight"],
        "thumb_width": item["thumbnailWidth"],
        "thumb_height": item["thumbnailHeight"],
    }


def sketch_row(item):
    return {
        "id": item["id"],
        "name": item["title"],
        "category": "sketchbook",
        "images": image_list(item["display"], item["thumbnail"], item["enlarged"]),
        "description": item["story"],
        "materials_and_sizes": "Digital artwork. Not a photography print. Price is not published.",
        "retail_price": "",
        "supplier_cost": "",
        "shipping_estimate": "",
        "availability": "inquiry",
        "inquiry_or_external_link": "/contact/?topic=custom&piece=" + quote(item["title"]),
        "display_width": item["displayWidth"],
        "display_height": item["displayHeight"],
        "thumb_width": item["thumbnailWidth"],
        "thumb_height": item["thumbnailHeight"],
    }


def products():
    rows = [photo_row(item) for item in PHOTO["photographs"]]
    rows.extend(coaster_row(item) for item in PHOTO["coasters"])
    rows.append(tiedye_row())
    rows.extend(tiedye_row(item) for item in PHOTO.get("tieDye", []))
    rows.extend(sketch_row(item) for item in PHOTO.get("sketchbook", []))
    return rows


def write_csv(path, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=COLUMNS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def main():
    rows = products()
    write_csv(OUT_CSV, rows)
    write_csv(ROOT / "working" / "catalog" / "import-template.csv", rows[:1])
    payload = {"products": rows}
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"products={len(rows)}")


if __name__ == "__main__":
    main()
