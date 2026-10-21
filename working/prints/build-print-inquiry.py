"""Generate print inquiry pages from measured pixels and the authorized prices.

Show an authorized price only when the file is 3:2 within 0.5 percent and meets
the PPI minimum for that product. Hide a crop. Disable a low-PPI size and say
why. Photographs 34, 40, 46, and 49 stay gallery and inquiry only.
"""
import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(r"C:\Users\bitte\bitter-buffalo-website-etsy-update-2026-10-17")
sys.path.insert(0, str(ROOT / "working" / "site"))
from shared_chrome import footer_html, nav_html
MANIFEST = ROOT / "working" / "portfolio" / "photography-manifest.json"
PUBLIC_JSON = ROOT / "cloudflare-pages" / "assets" / "data" / "print-inquiry.json"
SOURCE_JSON = ROOT / "working" / "prints" / "source-dimensions.json"
PAGES = ROOT / "cloudflare-pages" / "photography" / "prints"
SITEMAP = ROOT / "cloudflare-pages" / "sitemap.xml"

Image.MAX_IMAGE_PIXELS = None
CROP_LIMIT = 0.005
JS_PRICES = ROOT / "cloudflare-pages" / "assets" / "js" / "print-inquiry.js"
HELD_NUMBERS = set()
NO_MASTER_NUMBERS = {34, 40, 46, 49}
WEB_DERIVATIVE_NUMBERS = {51, 52, 53}
CANVAS_SIZES = (
    {"id": "12x18", "label": "12×18", "short": 12, "long": 18},
    {"id": "16x24", "label": "16×24", "short": 16, "long": 24},
    {"id": "20x30", "label": "20×30", "short": 20, "long": 30},
)
# retail, minimum PPI. Canvas 200. Metal and paper 300. Aspect is checked separately.
PRICES = {
    "canvas-floating-15": {
        "12x18": ("149.33", 200),
        "16x24": ("199.33", 200),
        "20x30": ("299.33", 200),
    },
    "canvas-15": {
        "12x18": ("134.99", 200),
        "16x24": ("224.99", 200),
        "20x30": ("314.99", 200),
    },
    "metal-aluminum": {
        "12x18": ("179.99", 300),
        "16x24": ("224.99", 300),
        "20x30": ("359.99", 300),
    },
    "paper-archival": {
        "12x18": ("89.99", 300),
        "16x24": ("129.99", 300),
        "20x30": ("199.99", 300),
    },
    "paper-semigloss": {
        "12x18": ("69.99", 300),
        "16x24": ("109.99", 300),
        "20x30": ("189.99", 300),
    },
    "paper-somerset": {
        "12x18": ("109.99", 300),
        "16x24": ("159.99", 300),
        "20x30": ("249.99", 300),
    },
}
# Flagged once. Do not change either price to remove the difference.
PRICE_FLAG = "Standard 1.5-inch stretched canvas at 16×24 is $224.99, which is higher than premium 1.5-inch framed canvas at 16×24 ($199.33). Those prices are unchanged."
PRODUCTS = (
    {
        "id": "canvas-floating-15",
        "name": "Premium 1.5-inch framed canvas",
        "family": "framed canvas",
        "evidence": "Authorized starting prices: 12×18 $149.33, 16×24 $199.33, 20×30 $299.33. This is not the stretched canvas. Frame finish, foamcore, hardware, shipping, and delivered cost are not verified, so checkout stays off.",
    },
    {
        "id": "canvas-15",
        "name": "Standard 1.5-inch stretched canvas",
        "family": "1.5-inch canvas",
        "evidence": "Authorized starting prices: 12×18 $134.99, 16×24 $224.99, 20×30 $314.99. This is not the framed canvas and is not LumaPrints subcategory 101003.",
    },
    {
        "id": "metal-aluminum",
        "name": "Aluminum metal",
        "family": "aluminum metal",
        "evidence": "Authorized starting prices: 12×18 $179.99, 16×24 $224.99, 20×30 $359.99. Finish and mounting are not verified, so checkout stays off.",
    },
    {
        "id": "paper-archival",
        "name": "Archival matte",
        "family": "archival matte paper",
        "evidence": "Authorized starting prices: 12×18 $89.99, 16×24 $129.99, 20×30 $199.99.",
    },
    {
        "id": "paper-semigloss",
        "name": "Semi-gloss",
        "family": "fine-art semi-gloss paper",
        "evidence": "Authorized starting prices: 12×18 $69.99, 16×24 $109.99, 20×30 $189.99. This is fine-art paper, not traditional photographic paper.",
    },
    {
        "id": "paper-somerset",
        "name": "Somerset Velvet",
        "family": "Somerset Velvet",
        "evidence": "Authorized starting prices: 12×18 $109.99, 16×24 $159.99, 20×30 $249.99.",
    },
)
# Public selectors. The other three families stay in the pricing master and are not sale options.
PUBLIC_SALE_IDS = ("canvas-floating-15", "metal-aluminum", "paper-archival")
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


def price_row(product_id, size_id):
    retail, minimum = PRICES[product_id][size_id]
    return retail, minimum


def size_record(width, height, size, product_id, number):
    retail, minimum = price_row(product_id, size["id"])
    long_side = max(width, height)
    short_side = min(width, height)
    crop = abs((long_side / short_side) - 1.5) / 1.5 > CROP_LIMIT
    internal = {
        "productId": product_id,
        "sizeId": size["id"],
        "label": size["label"],
        "authorizedRetail": retail,
    }
    if crop:
        internal["status"] = "unavailable"
        internal["reason"] = "This size would crop the photograph."
        internal["publicOffer"] = "omitted"
        return internal
    print_width, print_height = (size["long"], size["short"]) if width >= height else (size["short"], size["long"])
    ppi = one_decimal(min(width / print_width, height / print_height))
    internal.update({
        "printWidthIn": print_width,
        "printHeightIn": print_height,
        "ppi": ppi,
        "minimumPpi": minimum,
    })
    if number in WEB_DERIVATIVE_NUMBERS:
        internal["status"] = "hold"
        internal["publicOffer"] = "inquiry-only"
        internal["reason"] = "2048-pixel web derivative. No verified print master."
        return internal
    if number in NO_MASTER_NUMBERS:
        internal["status"] = "hold"
        internal["publicOffer"] = "inquiry-only"
        internal["reason"] = "No verified print master. Gallery and inquiry only."
        return internal
    if number in HELD_NUMBERS or ppi < minimum:
        internal["status"] = "hold"
        internal["publicOffer"] = "hold"
        internal["reason"] = f"Below {minimum} PPI."
        return internal
    internal["status"] = "priced"
    internal["publicOffer"] = "authorized"
    internal["retail"] = retail
    internal["priceText"] = f"${retail}"
    internal["reason"] = "Authorized starting price. Checkout stays off until cost, shipping, tax, and a protected print master are verified."
    return internal


def page(photo):
    sale_products = [product for product in PRODUCTS if product["id"] in PUBLIC_SALE_IDS]
    options = ['<option value="">Select a product</option>']
    for product in sale_products:
        options.append(f'<option value="{product["id"]}">{esc(product["name"])}</option>')
    sizes = ['<option value="">Select a size</option>']
    for item in photo["sizes"]:
        if item["productId"] not in PUBLIC_SALE_IDS or item["status"] == "unavailable":
            continue
        disabled = " disabled" if item["status"] == "hold" else ""
        suffix = ""
        if item["status"] == "hold":
            if photo["portfolioNumber"] in WEB_DERIVATIVE_NUMBERS:
                suffix = " (web derivative, no print price)"
            elif photo["portfolioNumber"] in NO_MASTER_NUMBERS:
                suffix = " (no verified print master)"
            else:
                suffix = f" (below {item['minimumPpi']} PPI)"
        label = item["label"] + suffix
        sizes.append(
            f'<option value="{item["productId"]}:{item["sizeId"]}" data-product="{item["productId"]}" '
            f'data-size="{item["sizeId"]}" data-label="{item["label"]}" data-status="{item["status"]}"{disabled}>'
            f'{esc(label)}</option>'
        )
    names = {product["id"]: product["name"] for product in sale_products}
    listed = [item for item in photo["sizes"] if item["status"] == "priced" and item["productId"] in PUBLIC_SALE_IDS]
    if photo["portfolioNumber"] in WEB_DERIVATIVE_NUMBERS:
        price_note = "<p>No print price is published. This file is a 2048-pixel web derivative, not a print master.</p>"
    elif photo["portfolioNumber"] in NO_MASTER_NUMBERS:
        price_note = "<p>No print price is published. The verified print master is missing, so this photograph stays gallery and inquiry only.</p>"
    elif not listed:
        price_note = "<p>No print price is published for this photograph.</p>"
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
      {nav_html("Photography")}
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
        <p>Stretched canvas, semi-gloss, and Somerset Velvet remain in the pricing record and are not sale options. This form sends an inquiry. It does not take payment.</p>
        <p>For photographs linked to Fine Art America, purchase prints directly through that artwork listing. For other photographs, contact us to confirm your print options and purchase details.</p>
        <p data-square-slot></p>
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
      <p>Pixel proportion {esc(aspect)}. A size that would crop this photograph is omitted. A size below the PPI minimum is disabled. Authorized prices are starting selling prices. This page does not take payment.</p>
      <p><a href="../../">Back to the portfolio</a></p>
    </section>
  </main>
  {footer_html()}
  <script type="module" src="../../../assets/js/print-inquiry.js"></script>
  <script type="module" src="../../../assets/js/square-payment-link.js"></script>
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


def master_status(item):
    if item["status"] == "priced":
        return "priced"
    if item["status"] == "unavailable":
        return "unavailable"
    return "hold"


def write_pricing_master(photographs):
    rows = []
    for photo in photographs:
        for item in photo["sizes"]:
            approved = item["status"] == "priced"
            rows.append({
                "permanentId": photo["id"],
                "portfolioNumber": photo["portfolioNumber"],
                "title": photo["title"],
                "productId": item["productId"],
                "sizeId": item["sizeId"],
                "status": master_status(item),
                "publicOffer": item.get("publicOffer"),
                "ppi": item.get("ppi"),
                "minimumPpi": item.get("minimumPpi"),
                "authorizedRetail": f"${item['retail']}" if approved else None,
                "draftRetail": None,
                "supplierBase": "74.01" if item["productId"] == "canvas-floating-15" and item["sizeId"] == "16x24" else None,
                "supplierCost": "unknown",
                "shipping": "unknown",
                "squareFee": "unknown",
                "tax": "unknown",
                "profit": "unknown",
                "availability": "inquiry" if item["status"] != "unavailable" else "unavailable",
                "checkout": "disabled",
                "reason": item.get("reason") or "Authorized starting price. Complete production cost, shipping, tax, and a protected print master are unverified, so checkout stays disabled.",
            })
    target = ROOT / "working" / "pricing" / "pricing-master.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps({
        "source": "Authorized starting selling prices, 2026-10-20. Checkout stays disabled.",
        "priceFlag": PRICE_FLAG,
        "acrylic": "excluded",
        "supplierBase": {
            "productId": "canvas-floating-15",
            "sizeId": "16x24",
            "amount": "74.01",
            "meaning": "16x24 framed-canvas supplier base only",
            "doesNotInclude": ["floating frame", "foamcore", "hardware", "shipping", "delivered cost"],
            "notAVerifiedFramedCost": ["90.13", "50.51"],
        },
        "supplierCost": "unknown",
        "checkout": "disabled",
        "records": rows,
    }, indent=2) + "\n", encoding="utf-8")


def public_size(item):
    kept = {
        "productId": item["productId"],
        "sizeId": item["sizeId"],
        "label": item["label"],
        "status": item["status"],
        "publicOffer": item.get("publicOffer"),
    }
    if item.get("reason"):
        kept["reason"] = item["reason"]
    for key in ("printWidthIn", "printHeightIn", "ppi", "minimumPpi", "priceText"):
        if key in item:
            kept[key] = item[key]
    if item["status"] == "priced":
        kept["retail"] = item["retail"]
    return kept


def public_photo(photo):
    shown = dict(photo)
    shown["sizes"] = [public_size(item) for item in photo["sizes"]]
    return shown


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
        if not (item.get("story") or "").strip():
            extra.append("<p>No previously written story is on file for this photograph.</p>")
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
    if len(photographs) != 53:
        raise SystemExit(f"expected 53 photographs, found {len(photographs)}")
    write_pricing_master(photographs)
    public_photographs = [public_photo(photo) for photo in photographs]
    payload = {
        "products": list(PRODUCTS),
        "omittedFamilies": list(OMITTED),
        "supplierExample": None,
        "approvedRetail": {
            "productId": "canvas-floating-15",
            "sizeId": "16x24",
            "text": "$199.33",
            "appliesTo": "a photograph with a verified print master, 3:2 within 0.5 percent, and at least 200 PPI",
        },
        "photographs": public_photographs,
    }
    PUBLIC_JSON.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    write_price_map(public_photographs)
    SOURCE_JSON.write_text(json.dumps(sources, indent=2) + "\n", encoding="utf-8")
    for photo in photographs:
        target = PAGES / photo["slug"] / "index.html"
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(page(photo), encoding="utf-8")
    update_sitemap(photographs)
    public_text = PUBLIC_JSON.read_text(encoding="utf-8") + JS_PRICES.read_text(encoding="utf-8")
    for folder in PAGES.glob("*/index.html"):
        public_text += folder.read_text(encoding="utf-8")
    for token in ("$74.01", "$90.13", "$50.51", "Workbook list price", "Pending. Inquiry only.", 'id="print-buy"'):
        if token in public_text:
            raise SystemExit(f"unpublished cost or draft wording leaked: {token}")
    for photo in photographs:
        if photo["portfolioNumber"] not in NO_MASTER_NUMBERS and photo["portfolioNumber"] not in WEB_DERIVATIVE_NUMBERS:
            continue
        html = (PAGES / photo["slug"] / "index.html").read_text(encoding="utf-8")
        if "$" in html:
            raise SystemExit(f"print price leaked onto photograph {photo['portfolioNumber']}")
    current_slugs = {photo["slug"] for photo in photographs}
    for folder in PAGES.iterdir():
        if folder.is_dir() and folder.name not in current_slugs:
            for child in folder.glob("*"):
                child.unlink()
            folder.rmdir()
    print(f"photographs={len(photographs)} pages={len(list(PAGES.glob('*/index.html')))}")


if __name__ == "__main__":
    main()
