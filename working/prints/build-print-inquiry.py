"""Generate print inquiry pages from measured pixels and verified canvas records.

Does not invent supplier families, sizes, crops, or retail prices.
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
PPI_MINIMUM = 200
CANVAS_SIZES = (
    {"id": "12x18", "label": "12×18", "short": 12, "long": 18},
    {"id": "16x24", "label": "16×24", "short": 16, "long": 24},
    {"id": "20x30", "label": "20×30", "short": 20, "long": 30},
)
PRODUCTS = (
    {
        "id": "canvas-floating-15",
        "name": "Premium 1.5-inch floating-frame canvas",
        "family": "framed canvas",
        "evidence": "Established sale configuration in the print catalog. Frame finish, frame choice, foamcore, backing, and wire are not verified, so this product has no finish dropdown.",
    },
    {
        "id": "canvas-15",
        "name": "1.5-inch canvas",
        "family": "1.5-inch canvas",
        "evidence": "Prior sandbox quote for unframed subcategory 101003, 1.50in Stretched Canvas. That quote is evidence for the family only. It is not a published price and it is not the floating-frame sale product.",
    },
)
OMITTED = (
    {"name": "Traditional photographic paper", "reason": "No verified supplier record in this repository."},
    {"name": "Archival giclée fine-art paper", "reason": "No verified supplier record in this repository."},
    {"name": "Aluminum metal", "reason": "No verified supplier record in this repository."},
    {"name": "Acrylic face-mount", "reason": "No verified supplier record in this repository."},
    {"name": "Framed paper", "reason": "No verified supplier record. Framed canvas is a separate family and is not framed paper."},
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


def size_record(width, height, size, product_id, number, holds):
    long_side = max(width, height)
    short_side = min(width, height)
    ratio = long_side / short_side
    if abs(ratio - 1.5) / 1.5 > CROP_LIMIT:
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
    }
    held = ppi < PPI_MINIMUM or (size["id"] == "20x30" and "HOLD_20x30" in holds)
    if held:
        base["status"] = "hold"
        base["reason"] = "Below 200 PPI." if ppi < PPI_MINIMUM else "Recorded 20×30 hold."
        return base
    if number == 1 and product_id == "canvas-floating-15" and size["id"] == "16x24":
        base["status"] = "priced"
        base["retail"] = "199.33"
        return base
    base["status"] = "quote"
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
    price_note = ""
    if photo["portfolioNumber"] == 1:
        price_note = (
            "<p>The only approved retail price is Grand Tetons, 16×24, premium 1.5-inch floating-frame canvas, "
            "at $199.33. Every other product and size on this page is a quote request. 20×30 stays on hold.</p>"
        )
    else:
        price_note = "<p>No retail price is published for this photograph. A valid selection says “Request a quote.”</p>"
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
      <p class="lede">Choose a print product and a size for this photograph. This page does not take payment.</p>
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
      <p>Source file {esc(photo["sourceName"])}, {photo["sourceWidth"]}×{photo["sourceHeight"]} pixels, {photo["orientation"]}, aspect {photo["aspectRatio"]:.4f}. The preview keeps that full composition. No crop is applied.</p>
      <p>Pixel proportion {esc(aspect)}. Canvas sizes that do not match this proportion are omitted.</p>
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


def update_sitemap(photographs):
    text = SITEMAP.read_text(encoding="utf-8")
    lines = []
    for photo in photographs:
        loc = f"https://bitterbuffaloart.com/photography/prints/{photo['slug']}/"
        snippet = f"  <url><loc>{loc}</loc><changefreq>weekly</changefreq></url>"
        if loc not in text:
            lines.append(snippet)
    if lines:
        text = text.replace("</urlset>", "\n".join(lines) + "\n</urlset>")
        SITEMAP.write_text(text, encoding="utf-8")


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
                sizes.append(size_record(width, height, canvas_size, product["id"], number, holds))
        photographs.append({
            "id": f"bb-photo-{number:02d}",
            "portfolioNumber": number,
            "title": item["title"],
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
    if len(photographs) != 33:
        raise SystemExit(f"expected 33 photographs, found {len(photographs)}")
    payload = {
        "products": list(PRODUCTS),
        "omittedFamilies": list(OMITTED),
        "supplierExample": None,
        "approvedRetail": {
            "photographId": "bb-photo-01",
            "productId": "canvas-floating-15",
            "sizeId": "16x24",
            "text": "$199.33",
        },
        "photographs": photographs,
    }
    PUBLIC_JSON.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    SOURCE_JSON.write_text(json.dumps(sources, indent=2) + "\n", encoding="utf-8")
    for photo in photographs:
        target = PAGES / photo["slug"] / "index.html"
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(page(photo), encoding="utf-8")
    update_sitemap(photographs)
    print(f"photographs={len(photographs)} pages={len(list(PAGES.glob('*/index.html')))}")


if __name__ == "__main__":
    main()
