"""Generate print inquiry pages from measured pixels and the workbook price table.

Publishes only open-edition retails whose size is on a supplier sheet.
Does not invent sizes, crops, or prices.
"""
import json
import re
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(r"C:\Users\bitte\bitter-buffalo-website-etsy-update-2026-10-17")
MANIFEST = ROOT / "working" / "portfolio" / "photography-manifest.json"
PUBLIC_JSON = ROOT / "cloudflare-pages" / "assets" / "data" / "print-inquiry.json"
SOURCE_JSON = ROOT / "working" / "prints" / "source-dimensions.json"
PAGES = ROOT / "cloudflare-pages" / "photography" / "prints"
SITEMAP = ROOT / "cloudflare-pages" / "sitemap.xml"

Image.MAX_IMAGE_PIXELS = None
CROP_LIMIT = 0.005
JS_PRICES = ROOT / "cloudflare-pages" / "assets" / "js" / "print-inquiry.js"
HELD_NUMBERS = set()
CANVAS_SIZES = (
    {"id": "12x18", "label": "12×18", "short": 12, "long": 18},
    {"id": "16x24", "label": "16×24", "short": 16, "long": 24},
    {"id": "20x30", "label": "20×30", "short": 20, "long": 30},
)
# kind, retail, minimum PPI. Only sizes present on the supplier sheets.
OFFERS = {
    "canvas-floating-15": {
        "12x18": ("workbook", "149.33", 200),
        "16x24": ("approved", "199.33", 200),
    },
    "canvas-15": {
        "12x18": ("workbook", "134.99", 200),
        "16x24": ("workbook", "224.99", 200),
    },
    "metal-aluminum": {
        "12x18": ("workbook", "179.99", 300),
        "16x24": ("workbook", "224.99", 300),
        "20x30": ("workbook", "359.99", 300),
    },
    "paper-archival": {
        "16x24": ("workbook", "129.99", 300),
    },
    "paper-semigloss": {
        "16x24": ("workbook", "109.99", 300),
    },
    "paper-somerset": {
        "16x24": ("workbook", "159.99", 300),
    },
}
PRODUCTS = (
    {
        "id": "canvas-floating-15",
        "name": "Premium 1.5-inch floating-frame canvas",
        "family": "framed canvas",
        "evidence": "Open-edition 1.5-inch framed canvas. 16×24 is the owner-approved retail. 12×18 is a workbook list price. 20×30 is not on the framed-canvas supplier sheet. Frame finish is not verified, so there is no finish dropdown.",
    },
    {
        "id": "canvas-15",
        "name": "1.5-inch stretched canvas",
        "family": "1.5-inch canvas",
        "evidence": "Open-edition 1.5-inch stretched canvas from the canvas supplier sheet. This is not the floating-frame product. 20×30 is not on that sheet.",
    },
    {
        "id": "metal-aluminum",
        "name": "Aluminum metal",
        "family": "aluminum metal",
        "evidence": "Open-edition aluminum from the metal supplier sheet. Finish and mounting are not verified, so there is no finish dropdown.",
    },
    {
        "id": "paper-archival",
        "name": "Archival matte paper",
        "family": "archival matte paper",
        "evidence": "Open-edition archival matte paper. Only 16×24 is on the fine-art paper supplier sheet.",
    },
    {
        "id": "paper-semigloss",
        "name": "Fine-art semi-gloss paper",
        "family": "fine-art semi-gloss paper",
        "evidence": "Open-edition fine-art semi-gloss paper. Only 16×24 is on the fine-art paper supplier sheet. This is not traditional photographic paper.",
    },
    {
        "id": "paper-somerset",
        "name": "Somerset Velvet",
        "family": "Somerset Velvet",
        "evidence": "Open-edition Somerset Velvet. Only 16×24 is on the fine-art paper supplier sheet.",
    },
)
OMITTED = (
    {"name": "Traditional photographic paper", "reason": "The workbook semi-gloss line is fine-art paper and is not confirmed as traditional photographic paper."},
    {"name": "Acrylic face-mount", "reason": "The workbook says acrylic retail targets must not be displayed."},
    {"name": "Framed paper", "reason": "No open-edition workbook retail. Framed canvas is a separate product."},
    {"name": "Collector edition", "reason": "No collector price is approved to publish."},
)


def slug(title, number):
    if number == 1:
        return "grand-tetons"
    text = title.lower().replace("'", "").replace("’", "")
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-")


def esc(text):
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def one_decimal(value):
    return round(value + 1e-9, 1)


def measure(path):
    with Image.open(path) as image:
        oriented = ImageOps.exif_transpose(image)
        width, height = oriented.size
        return int(width), int(height)


def price_text(kind, retail):
    if kind == "approved":
        if retail != "199.33":
            raise SystemExit("approved retail is only 199.33")
        return "$199.33"
    return f"Workbook list price ${retail}"


def size_record(width, height, size, product_id, number):
    offer = OFFERS[product_id].get(size["id"])
    if offer is None:
        return None
    kind, retail, minimum = offer
    long_side = max(width, height)
    short_side = min(width, height)
    if abs((long_side / short_side) - 1.5) / 1.5 > CROP_LIMIT:
        return {
            "productId": product_id,
            "sizeId": size["id"],
            "label": size["label"],
            "status": "unavailable",
            "reason": "This size would crop the photograph.",
        }
    print_width, print_height = (size["long"], size["short"]) if width >= height else (size["short"], size["long"])
    ppi = one_decimal(min(width / print_width, height / print_height))
    base = {
        "productId": product_id,
        "sizeId": size["id"],
        "label": size["label"],
        "printWidthIn": print_width,
        "printHeightIn": print_height,
        "ppi": ppi,
        "minimumPpi": minimum,
    }
    if number in HELD_NUMBERS:
        base["status"] = "hold"
        base["reason"] = "Workbook hold."
        return base
    if ppi < minimum:
        base["status"] = "hold"
        base["reason"] = f"Below {minimum} PPI."
        return base
    base["status"] = "priced" if kind == "approved" else "workbook"
    base["retail"] = retail
    base["priceText"] = price_text(kind, retail)
    return base


def page(photo):
    options = ['<option value="">Select a product</option>']
    for product in PRODUCTS:
        options.append(f'<option value="{product["id"]}">{esc(product["name"])}</option>')
    sizes = ['<option value="">Select a size</option>']
    for item in photo["sizes"]:
        if item["status"] == "unavailable":
            continue
        disabled = " disabled" if item["status"] == "hold" else ""
        label = item["label"] + (" (on hold)" if item["status"] == "hold" else "")
        sizes.append(
            f'<option value="{item["productId"]}:{item["sizeId"]}" data-product="{item["productId"]}" '
            f'data-size="{item["sizeId"]}" data-label="{item["label"]}" data-status="{item["status"]}"{disabled}>'
            f'{esc(label)}</option>'
        )
    names = {product["id"]: product["name"] for product in PRODUCTS}
    listed = [item for item in photo["sizes"] if item["status"] in ("priced", "workbook")]
    if photo["portfolioNumber"] in HELD_NUMBERS:
        price_note = "<p>This photograph is on hold. No price is published.</p>"
    elif not listed:
        price_note = "<p>No price is published for this photograph.</p>"
    else:
        rows = []
        for item in listed:
            rows.append(f"<li>{esc(names[item['productId']])}, {esc(item['label'])}: {esc(item['priceText'])}</li>")
        price_note = '<ul class="print-prices">' + "".join(rows) + "</ul>"
    aspect = f'{photo["sourceWidth"]}:{photo["sourceHeight"]}'
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{esc(photo["title"])} print inquiry | Bitter Buffalo Art</title>
  <meta name="description" content="{esc(photo["title"])} print inquiry. Choose a verified product and size. This page does not take payment." />
  <meta name="robots" content="noindex" />
  <meta name="theme-color" content="#2D2418" />
  <link rel="canonical" href="https://bitterbuffaloart.com/photography/prints/{photo["slug"]}/" />
  <meta property="og:site_name" content="Bitter Buffalo Art" />
  <meta property="og:title" content="{esc(photo["title"])} print inquiry | Bitter Buffalo Art" />
  <meta property="og:description" content="{esc(photo["title"])} print inquiry. This page does not take payment." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://bitterbuffaloart.com/photography/prints/{photo["slug"]}/" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../../../assets/css/site.css" />
</head>
<body data-photograph-id="{photo["id"]}" data-photograph-title="{esc(photo["title"])}">
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="site-header__inner">
      <a class="brand" href="../../../">
        <img src="../../../assets/images/logo.png" alt="" width="400" height="400" />
        <span class="brand__stack">
          <span class="brand__text">Bitter Buffalo Art</span>
          <span class="brand__place">Breckenridge, Colorado</span>
        </span>
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
      <nav id="site-nav" class="site-nav" aria-label="Primary">
        <a href="../../../" class="nav-link">Home</a>
        <a href="../../" class="nav-link is-active" aria-current="page">Photography</a>
        <a href="../../../sketchbook/" class="nav-link">Sketchbook</a>
        <a href="../../../shop/" class="nav-link">Shop</a>
        <a href="../../../tie-dye/" class="nav-link">Tie-Dye</a>
        <a href="../../../laser-art/" class="nav-link">Laser Art</a>
        <a href="../../../custom/" class="nav-link">Custom Art</a>
        <a href="../../../events/" class="nav-link">Events</a>
        <a href="../../../about/" class="nav-link">About</a>
        <a href="../../../contact/" class="nav-link">Contact</a>
      </nav>
    </div>
  </header>
  <main id="main">
    <section class="page-hero">
      <p class="eyebrow"><span class="eyebrow__mark eyebrow__mark--ink">Fine Art Photography · #{photo["portfolioNumber"]:02d}</span></p>
      <h1>{esc(photo["title"])}</h1>
      <p class="lede">{esc(photo["story"])}</p>
      <p>Choose a print product and a size for this photograph. This page does not take payment.</p>
    </section>
    <section class="print-inquiry">
      <figure class="print-inquiry__photo">
        <img src="../../../{photo["display"].lstrip("/")}" alt="{esc(photo["title"])}" width="{photo["displayWidth"]}" height="{photo["displayHeight"]}" />
        <figcaption>Website preview of {esc(photo["title"])}. This JPEG is not the print file.</figcaption>
      </figure>
      <form id="print-inquiry" class="bb-form print-inquiry__form" data-bb-form="general" data-print-inquiry method="post" action="/api/contact" accept-charset="UTF-8" novalidate>
        <input type="hidden" name="form_kind" value="general" />
        <input type="hidden" name="contact[Subject]" value="Print inquiry" />
        <input type="hidden" name="contact[photograph_title]" value="" />
        <input type="hidden" name="contact[catalog_id]" value="" />
        <input type="hidden" name="contact[print_product]" value="" />
        <input type="hidden" name="contact[print_size]" value="" />
        <input type="hidden" name="contact[price_or_quote]" value="" />
        <input type="hidden" name="contact[body]" value="" />
        <label class="hp" aria-hidden="true">Company website<input type="text" name="website" tabindex="-1" autocomplete="off" /></label>
        <label for="print-product">Print product</label>
        <select id="print-product" name="print-product" required>
          {"".join(options)}
        </select>
        <label for="print-size">Size</label>
        <select id="print-size" name="print-size" required disabled>
          {"".join(sizes)}
        </select>
        <p id="print-price" class="print-price" aria-live="polite"></p>
        {price_note}
        <label for="print-name">Full name</label>
        <input id="print-name" name="contact[name]" required autocomplete="name" />
        <label for="print-email">Email address</label>
        <input id="print-email" type="email" name="contact[email]" required autocomplete="email" />
        <label for="print-message">Message</label>
        <textarea id="print-message" name="contact[visitor_message]" rows="5" required></textarea>
        <button class="btn btn--solid-ink" type="submit">Send print inquiry</button>
        <p data-bb-form-status role="status" hidden></p>
        <noscript><p>Nothing has been sent. JavaScript is required to choose a product and size before an inquiry can be sent.</p></noscript>
      </form>
    </section>
    <section class="prose formats-block">
      <h2>About this photograph</h2>
      {photo["extra"]}
      <p>Source file {esc(photo["sourceName"])}, {photo["sourceWidth"]}×{photo["sourceHeight"]} pixels, {photo["orientation"]}, aspect {photo["aspectRatio"]:.4f}. The preview keeps that full composition. No crop is applied.</p>
      <p>Pixel proportion {esc(aspect)}. A size that would crop this photograph, or that is missing from the supplier sheet, is omitted. Draft amounts are workbook list prices.</p>
      <p><a href="../../">Back to the portfolio</a></p>
    </section>
  </main>
  <footer class="site-footer">
    <div class="site-footer__grid">
      <div>
        <h2>Bitter Buffalo Art</h2>
        <p>Original art from the Colorado High Country—fine-art photography, hand-dyed textiles, laser woodwork, and custom commissions from Breckenridge.</p>
      </div>
      <div>
        <h3>Explore</h3>
        <ul>
          <li><a href="../../">Photography</a></li>
          <li><a href="../../../sketchbook/">Sketchbook</a></li>
          <li><a href="../../../shop/">Shop</a></li>
          <li><a href="../../../tie-dye/">Tie-Dye</a></li>
          <li><a href="../../../laser-art/">Laser Art</a></li>
          <li><a href="../../../events/">Events</a></li>
          <li><a href="../../../about/">About</a></li>
        </ul>
      </div>
      <div>
        <h3>Work With Us</h3>
        <ul>
          <li><a href="../../../custom/">Custom Art</a></li>
          <li><a href="../../../contact/">Contact</a></li>
        </ul>
      </div>
    </div>
    <p class="site-footer__note">This page does not take payment. Photographs are not sold on Etsy.</p>
  </footer>
  <script type="module" src="../../../assets/js/print-inquiry.js"></script>
  <script src="../../../assets/js/site.js"></script>
</body>
</html>
"""


def write_price_map(photographs):
    mapping = {}
    for photo in photographs:
        for item in photo["sizes"]:
            if "priceText" in item:
                mapping[f"{photo['id']}|{item['productId']}|{item['sizeId']}"] = item["priceText"]
    text = JS_PRICES.read_text(encoding="utf-8")
    block = "export const PUBLISHED_PRICES = " + json.dumps(mapping, indent=2) + ";"
    updated, count = re.subn(r"export const PUBLISHED_PRICES = \{.*?\};", block, text, count=1, flags=re.S)
    if count != 1:
        raise SystemExit("price map marker missing from print-inquiry.js")
    JS_PRICES.write_text(updated, encoding="utf-8")


def update_sitemap(photographs):
    current = {f"https://bitterbuffaloart.com/photography/prints/{photo['slug']}/" for photo in photographs}
    kept = []
    seen = set()
    for line in SITEMAP.read_text(encoding="utf-8").splitlines():
        if "/photography/prints/" in line and "<loc>" in line:
            continue
        kept.append(line)
    block = [
        f"  <url><loc>{loc}</loc><changefreq>weekly</changefreq></url>"
        for loc in sorted(current)
    ]
    text = "\n".join(kept)
    text = text.replace("</urlset>", "\n".join(block) + "\n</urlset>")
    if text.count("</urlset>") != 1:
        raise SystemExit("sitemap urlset marker missing")
    SITEMAP.write_text(text if text.endswith("\n") else text + "\n", encoding="utf-8")
    seen.add(len(current))


def write_pricing_master(photographs):
    rows = []
    for photo in photographs:
        for item in photo["sizes"]:
            if item["status"] == "unavailable":
                continue
            approved = item.get("priceText") == "$199.33"
            rows.append({
                "permanentId": photo["id"],
                "title": photo["title"],
                "productId": item["productId"],
                "sizeId": item["sizeId"],
                "status": item["status"],
                "approvedRetail": item.get("priceText") if approved else None,
                "draftRetail": None if approved or item["status"] != "workbook" else item.get("priceText"),
                "supplierCost": "unknown",
                "shipping": "unknown",
                "squareFee": "unknown",
                "tax": "unknown",
                "profit": "unknown",
                "availability": "inquiry",
                "checkout": "disabled",
                "reason": "Approved retail, complete production cost, print master, shipping, tax, and fulfillment are not all verified." if not approved else "Approved retail only. Complete production cost, shipping, tax, and fulfillment are unverified, so checkout stays disabled.",
            })
    target = ROOT / "working" / "pricing" / "pricing-master.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps({
        "source": "2026-10-19 LumaPrints workbook open-edition retails. Approved retail is only 16x24 premium 1.5-inch framed canvas at $199.33.",
        "acrylic": "excluded",
        "records": rows,
    }, indent=2) + "\n", encoding="utf-8")


def main():
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    photographs = []
    sources = []
    slugs = set()
    for item in manifest["photographs"]:
        number = item["portfolioNumber"]
        path = Path(item["sourcePath"])
        width, height = measure(path)
        record = {
            "portfolioNumber": number,
            "sourcePath": str(path),
            "sourceName": path.name,
            "manifestWidth": item["sourceWidth"],
            "manifestHeight": item["sourceHeight"],
            "sourceWidth": width,
            "sourceHeight": height,
            "matchesManifest": width == item["sourceWidth"] and height == item["sourceHeight"],
        }
        sources.append(record)
        if not record["matchesManifest"]:
            raise SystemExit(f"source pixels differ from manifest for #{number}: {width}x{height}")
        photo_slug = slug(item["title"], number)
        if photo_slug in slugs:
            raise SystemExit(f"duplicate slug {photo_slug}")
        slugs.add(photo_slug)
        holds = item.get("printHolds") or ""
        sizes = []
        for product in PRODUCTS:
            for canvas_size in CANVAS_SIZES:
                record = size_record(width, height, canvas_size, product["id"], number)
                if record:
                    sizes.append(record)
        extra = []
        if item.get("location"):
            extra.append(f"<p>Location: {esc(item['location'])}</p>")
        if number == 10:
            extra.append("<p>This photograph stays 16:9. It is not cropped to 3:2. No price is published. It needs its own compatible custom print size.</p>")
        if item.get("highResolutionMaster") == "missing":
            extra.append("<p>The high-resolution print master is missing. The file on this page is the gallery source and is not marked print-ready.</p>")
        if number == 26 and item.get("alternate", {}).get("present"):
            extra.append("<p>The color image is the photograph on this page. The black-and-white export is an alternate, not a separate photograph.</p>")
        photographs.append({
            "id": item["permanentId"],
            "portfolioNumber": number,
            "title": item["title"],
            "story": item["story"],
            "extra": "".join(extra),
            "slug": photo_slug,
            "url": f"/photography/prints/{photo_slug}/",
            "sourceName": path.name,
            "sourceWidth": width,
            "sourceHeight": height,
            "aspectRatio": round(width / height, 4),
            "orientation": "landscape" if width > height else "portrait" if height > width else "square",
            "display": item["display"],
            "displayWidth": item["displayWidth"],
            "displayHeight": item["displayHeight"],
            "printHolds": holds,
            "sizes": sizes,
        })
    if len(photographs) != 44:
        raise SystemExit(f"expected 44 photographs, found {len(photographs)}")
    payload = {
        "products": list(PRODUCTS),
        "omittedFamilies": list(OMITTED),
        "supplierExample": None,
        "approvedRetail": {
            "productId": "canvas-floating-15",
            "sizeId": "16x24",
            "text": "$199.33",
            "appliesTo": "every print-ready 3:2 photograph",
        },
        "photographs": photographs,
    }
    PUBLIC_JSON.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    write_price_map(photographs)
    SOURCE_JSON.write_text(json.dumps(sources, indent=2) + "\n", encoding="utf-8")
    for photo in photographs:
        target = PAGES / photo["slug"] / "index.html"
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(page(photo), encoding="utf-8")
    update_sitemap(photographs)
    write_pricing_master(photographs)
    current_slugs = {photo["slug"] for photo in photographs}
    for folder in PAGES.iterdir():
        if folder.is_dir() and folder.name not in current_slugs:
            for child in folder.glob("*"):
                child.unlink()
            folder.rmdir()
    print(f"photographs={len(photographs)} pages={len(list(PAGES.glob('*/index.html')))}")


if __name__ == "__main__":
    main()
