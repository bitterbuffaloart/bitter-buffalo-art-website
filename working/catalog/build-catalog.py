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


def photo_row(item):
    number = item["portfolioNumber"]
    name = item["title"]
    holds = item.get("printHolds") or ""
    if number == 1:
        materials = (
            "Premium 1.5-inch floating-frame canvas. "
            "12×18: price not published. "
            "16×24: $199.33. "
            "20×30: on hold, below 200 ppi."
        )
        retail = "199.33"
        availability = "inquiry"
        link = "/photography/prints/grand-tetons/"
        description = "Portfolio photograph #01, DSC_2626. Floating-frame canvas. Inquire to order. No checkout on this website."
    else:
        materials = "Premium 1.5-inch floating-frame canvas. Sizes and prices for this photograph are not published."
        if holds:
            materials += " Recorded hold: " + holds.replace("|", "; ") + "."
        retail = ""
        availability = "inquiry"
        link = f"/photography/prints/{print_slug(name, number)}/"
        description = f"Portfolio photograph #{number:02d}. Inquire to ask about a print. No checkout on this website."
    return {
        "id": f"bb-photo-{number:02d}",
        "name": name,
        "category": "photography prints",
        "images": image_list(item["display"], item["thumbnail"], item["enlarged"]),
        "description": description,
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


def tiedye_row():
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


def products():
    rows = [photo_row(item) for item in PHOTO["photographs"]]
    rows.extend(coaster_row(item) for item in PHOTO["coasters"])
    rows.append(tiedye_row())
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
