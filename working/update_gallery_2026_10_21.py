"""One-time public gallery update. Does not rotate coasters or rebuild print-inquiry."""
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "cloudflare-pages" / "assets" / "data" / "catalog.json"
INQUIRY_PATH = ROOT / "cloudflare-pages" / "assets" / "data" / "print-inquiry.json"
SITEMAP_PATH = ROOT / "cloudflare-pages" / "sitemap.xml"
PHOTO_INDEX = ROOT / "cloudflare-pages" / "photography" / "index.html"

WITHHELD = {
    "bb-photo-66": "Green Light Over the Peak",
    "bb-photo-76": "Snow on the Near Bank",
    "bb-photo-77": "The Creek Under Bare Branches",
}
FEATURED = {
    "bb-photo-01",
    "bb-photo-02",
    "bb-photo-04",
    "bb-photo-09",
    "bb-photo-11",
    "bb-photo-16",
    "bb-photo-18",
}
SUBJECTS = {
    "bb-photo-01": ["Landscapes"],
    "bb-photo-02": ["Landscapes", "Waterscapes"],
    "bb-photo-03": ["Waterscapes", "Desert/Rock"],
    "bb-photo-04": ["Desert/Rock"],
    "bb-photo-05": ["Waterscapes", "Desert/Rock"],
    "bb-photo-06": ["Landscapes", "Waterscapes"],
    "bb-photo-07": ["Landscapes"],
    "bb-photo-08": ["Desert/Rock"],
    "bb-photo-09": ["Historic/Rural"],
    "bb-photo-10": ["Wildlife"],
    "bb-photo-11": ["Wildlife"],
    "bb-photo-12": ["Wildlife"],
    "bb-photo-13": ["Wildlife"],
    "bb-photo-45": ["Wildlife"],
    "bb-photo-15": ["Historic/Rural"],
    "bb-photo-16": ["Waterscapes"],
    "bb-photo-17": ["Night Skies", "Landscapes"],
    "bb-photo-18": ["Night Skies", "Desert/Rock"],
    "bb-photo-19": ["Historic/Rural"],
    "bb-photo-20": ["Historic/Rural"],
    "bb-photo-21": ["Wildlife"],
    "bb-photo-22": ["Waterscapes", "Historic/Rural"],
    "bb-photo-23": ["Historic/Rural"],
    "bb-photo-24": ["Landscapes", "Waterscapes"],
    "bb-photo-25": ["Historic/Rural", "Landscapes"],
    "bb-photo-26": ["Historic/Rural"],
    "bb-photo-27": ["Historic/Rural"],
    "bb-photo-28": ["Historic/Rural", "Landscapes"],
    "bb-photo-29": ["Historic/Rural"],
    "bb-photo-30": ["Landscapes"],
    "bb-photo-31": [],
    "bb-photo-32": ["Landscapes"],
    "bb-photo-33": ["Historic/Rural"],
    "bb-photo-34": ["Landscapes"],
    "bb-photo-35": ["Wildlife", "Waterscapes"],
    "bb-photo-36": ["Wildlife"],
    "bb-photo-37": ["Historic/Rural", "Landscapes"],
    "bb-photo-38": ["Landscapes"],
    "bb-photo-39": ["Historic/Rural"],
    "bb-photo-40": ["Desert/Rock"],
    "bb-photo-41": ["Historic/Rural", "Waterscapes"],
    "bb-photo-42": ["Night Skies", "Historic/Rural", "Waterscapes"],
    "bb-photo-43": ["Desert/Rock", "Landscapes"],
    "bb-photo-44": ["Historic/Rural"],
    "bb-photo-46": ["Landscapes"],
    "bb-photo-47": ["Waterscapes", "Desert/Rock", "Landscapes"],
    "bb-photo-48": ["Waterscapes", "Desert/Rock"],
    "bb-photo-49": ["Wildlife"],
    "bb-photo-50": ["Wildlife"],
    "bb-photo-51": ["Waterscapes", "Landscapes"],
    "bb-photo-52": ["Wildlife"],
    "bb-photo-53": ["Landscapes", "Waterscapes"],
    "bb-photo-54": ["Landscapes", "Waterscapes"],
    "bb-photo-55": ["Desert/Rock", "Historic/Rural"],
    "bb-photo-56": ["Landscapes"],
    "bb-photo-57": ["Landscapes", "Waterscapes"],
    "bb-photo-58": ["Historic/Rural", "Desert/Rock"],
    "bb-photo-59": ["Wildlife", "Desert/Rock"],
    "bb-photo-60": ["Waterscapes", "Landscapes"],
    "bb-photo-61": ["Historic/Rural"],
    "bb-photo-62": ["Historic/Rural", "Landscapes"],
    "bb-photo-63": ["Landscapes"],
    "bb-photo-64": ["Historic/Rural"],
    "bb-photo-65": ["Historic/Rural", "Night Skies"],
    "bb-photo-66": ["Night Skies", "Landscapes"],
    "bb-photo-67": ["Night Skies", "Desert/Rock"],
    "bb-photo-68": ["Landscapes"],
    "bb-photo-69": ["Landscapes"],
    "bb-photo-70": [],
    "bb-photo-71": ["Historic/Rural", "Landscapes"],
    "bb-photo-72": ["Historic/Rural", "Landscapes"],
    "bb-photo-73": ["Desert/Rock", "Landscapes"],
    "bb-photo-74": ["Historic/Rural", "Landscapes"],
    "bb-photo-75": ["Waterscapes", "Landscapes"],
    "bb-photo-76": ["Waterscapes"],
    "bb-photo-77": ["Waterscapes"],
    "bb-photo-78": ["Waterscapes", "Historic/Rural"],
    "bb-photo-79": ["Waterscapes"],
    "bb-photo-80": ["Historic/Rural"],
    "bb-photo-81": ["Historic/Rural"],
    "bb-photo-82": ["Historic/Rural"],
    "bb-photo-83": ["Landscapes"],
    "bb-photo-84": ["Landscapes"],
    "bb-photo-85": ["Waterscapes", "Landscapes"],
    "bb-photo-86": ["Landscapes"],
}
PUBLIC_IDS = ("canvas-floating-15", "metal-aluminum", "paper-archival")
RETIRED_SLUGS = (
    "green-light-over-the-peak",
    "snow-on-the-near-bank",
    "the-creek-under-bare-branches",
)


def dump(value):
    return json.dumps(value, indent=2, ensure_ascii=True) + "\n"


def move_after(products, moving_id, after_id):
    moving = next(item for item in products if item["id"] == moving_id)
    products.remove(moving)
    index = next(i for i, item in enumerate(products) if item["id"] == after_id)
    products.insert(index + 1, moving)


def offers(photo):
    found = []
    for product_id in PUBLIC_IDS:
        for size in photo["sizes"]:
            if size.get("productId") == product_id and size.get("status") == "priced" and size.get("publicOffer") != "omitted":
                found.append(size)
    return found


def words(count):
    ones = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"]
    tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]
    if count < 20:
        text = ones[count]
    else:
        ten, rest = divmod(count, 10)
        text = tens[ten] + ("" if rest == 0 else "-" + ones[rest])
    return text[:1].upper() + text[1:]


def main():
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    inquiry = json.loads(INQUIRY_PATH.read_text(encoding="utf-8"))
    by_id = {photo["id"]: photo for photo in inquiry["photographs"]}
    photos = [item for item in catalog["products"] if item.get("category") == "photography prints"]
    if len(photos) != 85:
        raise SystemExit(f"expected 85 photography records before withholding, found {len(photos)}")
    missing = [item["id"] for item in photos if item["id"] not in SUBJECTS]
    if missing:
        raise SystemExit(f"missing subject decision: {missing}")
    titled = {item["id"]: item["name"] for item in photos}
    for product_id, name in WITHHELD.items():
        if titled.get(product_id) != name:
            raise SystemExit(f"refusing to withhold {product_id}; it is {titled.get(product_id)}")

    for product in photos:
        product["subjects"] = SUBJECTS[product["id"]]
        if product["id"] in FEATURED:
            product["featured"] = True
        elif "featured" in product:
            del product["featured"]
        if product["id"] in WITHHELD:
            product["availability"] = "withheld"
        photo = by_id[product["id"]]
        priced = offers(photo)
        if product["id"] in {"bb-photo-45", "bb-photo-59"}:
            if not priced or priced[0].get("priceText") != "$149.33" or priced[0].get("sizeId") != "12x18":
                raise SystemExit(f"{product['id']} does not have the recorded 12x18 offer")
            product["retail_price"] = "149.33"
            product["materials_and_sizes"] = "12\u00d718 premium 1.5-inch framed canvas: $149.33. Larger sizes of this file stay below the PPI minimum. Checkout is not enabled."

    move_after(catalog["products"], "bb-photo-42", "bb-photo-51")
    move_after(catalog["products"], "bb-photo-63", "bb-photo-73")
    CATALOG_PATH.write_text(dump(catalog), encoding="utf-8")

    for slug in RETIRED_SLUGS:
        page = ROOT / "cloudflare-pages" / "photography" / "prints" / slug
        if page.exists():
            shutil.rmtree(page)
    sitemap = SITEMAP_PATH.read_text(encoding="utf-8")
    for slug in RETIRED_SLUGS:
        line = f"  <url><loc>https://bitterbuffaloart.com/photography/prints/{slug}/</loc><changefreq>weekly</changefreq></url>\n"
        if line not in sitemap:
            raise SystemExit(f"sitemap missing {slug}")
        sitemap = sitemap.replace(line, "")
    additions = [
        "https://bitterbuffaloart.com/photography/all/",
        "https://bitterbuffaloart.com/photography/landscapes/",
        "https://bitterbuffaloart.com/photography/wildlife/",
        "https://bitterbuffaloart.com/photography/waterscapes/",
        "https://bitterbuffaloart.com/photography/night-skies/",
        "https://bitterbuffaloart.com/photography/historic-rural/",
        "https://bitterbuffaloart.com/photography/desert-rock/",
        "https://bitterbuffaloart.com/sketchbook/digital-art/",
        "https://bitterbuffaloart.com/sketchbook/drawings/",
        "https://bitterbuffaloart.com/sketchbook/paintings/",
        "https://bitterbuffaloart.com/sketchbook/mixed-media/",
    ]
    block = "".join(f"  <url><loc>{url}</loc><changefreq>weekly</changefreq></url>\n" for url in additions)
    marker = "  <url><loc>https://bitterbuffaloart.com/photography/</loc><changefreq>weekly</changefreq></url>\n"
    if marker not in sitemap:
        raise SystemExit("photography sitemap marker missing")
    if additions[0] not in sitemap:
        sitemap = sitemap.replace(marker, marker + block, 1)
    SITEMAP_PATH.write_text(sitemap, encoding="utf-8")

    public = [item for item in catalog["products"] if item.get("category") == "photography prints" and item.get("availability") != "withheld"]
    priced_ids = [photo["id"] for photo in inquiry["photographs"] if offers(photo)]
    public_ids = {item["id"] for item in public}
    report = {
        "baseline": {
            "photographs": len(inquiry["photographs"]),
            "withAuthorizedOffer": len(priced_ids),
            "withoutAuthorizedOffer": len(inquiry["photographs"]) - len(priced_ids),
        },
        "public": {
            "photographs": len(public),
            "withAuthorizedOffer": len([item for item in public if item["id"] in set(priced_ids)]),
            "withoutAuthorizedOffer": len([item for item in public if item["id"] not in set(priced_ids)]),
        },
        "withheld": [{"id": key, "title": WITHHELD[key]} for key in WITHHELD],
        "note": "Baseline is the print-inquiry archive. Public counts exclude withheld titles and are calculated from catalog.json.",
    }
    (ROOT / "working" / "price-coverage-2026-10-21.json").write_text(dump(report), encoding="utf-8")
    queue = []
    for photo in inquiry["photographs"]:
        gaps = []
        for size in photo["sizes"]:
            if size.get("productId") not in PUBLIC_IDS:
                continue
            if size.get("status") == "priced" and size.get("publicOffer") != "omitted":
                continue
            gaps.append({
                "productId": size.get("productId"),
                "sizeId": size.get("sizeId"),
                "status": size.get("status"),
                "reason": size.get("reason", ""),
            })
        if gaps:
            queue.append({
                "id": photo["id"],
                "title": photo["title"],
                "public": photo["id"] in public_ids,
                "needsAuthorization": gaps,
            })
    (ROOT / "working" / "price-review-queue-2026-10-21.json").write_text(dump(queue), encoding="utf-8")

    text = PHOTO_INDEX.read_text(encoding="utf-8")
    count = len(public)
    text = text.replace("Explore 85 original landscapes", f"Explore {count} original landscapes")
    text = text.replace("Eighty-five photographs", f"{words(count)} photographs")
    text = text.replace('aria-label="85 photograph portfolio"', 'aria-label="Featured photography"')
    PHOTO_INDEX.write_text(text, encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
