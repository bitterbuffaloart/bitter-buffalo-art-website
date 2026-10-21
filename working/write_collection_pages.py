"""Write photography and sketchbook collection pages. Does not rebuild the print catalog."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "cloudflare-pages"
PHOTO = PUBLIC / "photography" / "index.html"

PHOTO_SUBJECTS = [
    ("Featured", "/photography/", ""),
    ("All photographs", "/photography/all/", ""),
    ("Landscapes", "/photography/landscapes/", "Landscapes"),
    ("Wildlife", "/photography/wildlife/", "Wildlife"),
    ("Waterscapes", "/photography/waterscapes/", "Waterscapes"),
    ("Night Skies", "/photography/night-skies/", "Night Skies"),
    ("Historic/Rural", "/photography/historic-rural/", "Historic/Rural"),
    ("Desert/Rock", "/photography/desert-rock/", "Desert/Rock"),
]
SKETCH_SUBJECTS = [
    ("All artwork", "/sketchbook/", "all", "The Bitter Buffalo Sketchbook", "Paintings, drawings, and digital work from the studio."),
    ("Digital Art & Symmetry", "/sketchbook/digital-art/", "digital", "Digital Art & Symmetry", "Digital artwork and symmetry from the studio sketchbook."),
    ("Drawings", "/sketchbook/drawings/", "drawings", "Drawings", "Drawings from the studio sketchbook."),
    ("Paintings", "/sketchbook/paintings/", "paintings", "Paintings", "Paintings from the studio sketchbook."),
    ("Mixed Media", "/sketchbook/mixed-media/", "mixed", "Mixed Media", "Mixed-media artwork from the studio sketchbook."),
]


def nav(items, current):
    links = []
    for label, href, _subject in items:
        current_attr = ' aria-current="page"' if href == current else ""
        links.append(f'<a href="{href}"{current_attr}>{label.replace("&", "&amp;")}</a>')
    return '<nav class="collection-nav" aria-label="Photography subjects">' + "".join(links) + "</nav>"


def photo_page(title, description, canonical, current, subject, featured):
    attrs = 'data-catalog-grid data-category="photography prints"'
    if featured:
        attrs += " data-featured"
    if subject:
        attrs += f' data-subject="{subject}"'
    grid_label = title
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="icon" href="/favicon.ico" type="image/x-icon" />
  <link rel="icon" href="/assets/images/logo.png" type="image/png" />
  <title>{title} | Bitter Buffalo Art</title>
  <meta name="description" content="{description}" />
  <meta name="theme-color" content="#2D2418" />
  <link rel="canonical" href="{canonical}" />
  <meta property="og:site_name" content="Bitter Buffalo Art" />
  <meta property="og:title" content="{title} | Bitter Buffalo Art" />
  <meta property="og:description" content="{description}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="{canonical}" />
  <link rel="stylesheet" href="../../assets/css/site.css" />
  <meta property="og:image" content="https://bitterbuffaloart.com/assets/images/portfolio/02.jpg" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="https://bitterbuffaloart.com/assets/images/portfolio/02.jpg" />
</head>
<body class="western-page">
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="site-header__inner">
      <a class="brand" href="../../">
        <img src="../../assets/images/logo.png" alt="" width="400" height="400" />
        <span class="brand__stack">
          <span class="brand__text">Bitter Buffalo Art</span>
          <span class="brand__place">Breckenridge, Colorado</span>
        </span>
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
      <nav id="site-nav" class="site-nav" aria-label="Primary">
        <a href="/" class="nav-link">Home</a>
        <a href="/shop/" class="nav-link">Shop</a>
        <a href="/tie-dye/" class="nav-link">Tie-Dye</a>
        <a href="/photography/" class="nav-link is-active" aria-current="page">Photography</a>
        <a href="/sketchbook/" class="nav-link">Sketchbook</a>
        <a href="/laser-art/" class="nav-link">Laser Art</a>
        <a href="/custom/" class="nav-link">Custom Art</a>
        <a href="/events/" class="nav-link">Events</a>
        <a href="/about/" class="nav-link">About</a>
        <a href="/contact/" class="nav-link">Contact</a>
      </nav>
    </div>
  </header>
  <main id="main">
    <section class="page-hero">
      <p class="eyebrow"><span class="eyebrow__mark eyebrow__mark--ink">Fine Art Photography</span></p>
      <h1>{title}</h1>
      <p class="lede">{description} Checkout is not enabled.</p>
    </section>
    {nav(PHOTO_SUBJECTS, current)}
    <section class="page-section">
      <div class="gallery gallery--portfolio" {attrs} aria-label="{grid_label}"></div>
      <nav class="catalog-pager" data-catalog-pager aria-label="{title} pages">
        <button type="button" data-page="prev">Previous</button>
        <p data-page-status role="status"></p>
        <button type="button" data-page="next">Next</button>
      </nav>
    </section>
  </main>
  <footer class="site-footer">
    <p class="site-footer__note">Fine-art photography prints are offered on this website. This website does not take payment.</p>
  </footer>
  <script src="../../assets/js/site.js"></script>
  <script src="../../assets/js/price-eligibility.js"></script>
  <script src="../../assets/js/catalog.js"></script>
</body>
</html>
"""


def sketch_page(title, description, canonical, current, sketch_filter):
    links = []
    for label, href, _filt, _h1, _desc in SKETCH_SUBJECTS:
        current_attr = ' aria-current="page"' if href == current else ""
        links.append(f'<a href="{href}"{current_attr}>{label.replace("&", "&amp;")}</a>')
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="icon" href="/favicon.ico" type="image/x-icon" />
  <link rel="icon" href="/assets/images/logo.png" type="image/png" />
  <title>{title} | Bitter Buffalo Art</title>
  <meta name="description" content="{description}" />
  <meta name="theme-color" content="#2D2418" />
  <link rel="canonical" href="{canonical}" />
  <meta property="og:site_name" content="Bitter Buffalo Art" />
  <meta property="og:title" content="{title} | Bitter Buffalo Art" />
  <meta property="og:description" content="{description}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="{canonical}" />
  <link rel="stylesheet" href="../../assets/css/site.css" />
  <link rel="stylesheet" href="../../assets/css/sketchbook.css" />
  <meta property="og:image" content="https://bitterbuffaloart.com/assets/sketchbook/thumbs/frog-mushroom.jpg" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="https://bitterbuffaloart.com/assets/sketchbook/thumbs/frog-mushroom.jpg" />
</head>
<body class="western-page" data-asset-prefix="../.." data-sketch-filter="{sketch_filter}">
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="site-header__inner">
      <a class="brand" href="../../">
        <img src="../../assets/images/logo.png" alt="" width="400" height="400" />
        <span class="brand__stack">
          <span class="brand__text">Bitter Buffalo Art</span>
          <span class="brand__place">Breckenridge, Colorado</span>
        </span>
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
      <nav id="site-nav" class="site-nav" aria-label="Primary">
        <a href="/" class="nav-link">Home</a>
        <a href="/shop/" class="nav-link">Shop</a>
        <a href="/tie-dye/" class="nav-link">Tie-Dye</a>
        <a href="/photography/" class="nav-link">Photography</a>
        <a href="/sketchbook/" class="nav-link is-active" aria-current="page">Sketchbook</a>
        <a href="/laser-art/" class="nav-link">Laser Art</a>
        <a href="/custom/" class="nav-link">Custom Art</a>
        <a href="/events/" class="nav-link">Events</a>
        <a href="/about/" class="nav-link">About</a>
        <a href="/contact/" class="nav-link">Contact</a>
      </nav>
    </div>
  </header>
  <main id="main">
    <section class="page-hero">
      <p class="eyebrow"><span class="eyebrow__mark eyebrow__mark--ink">Studio drawings and paintings</span></p>
      <h1>{title}</h1>
      <p class="lede">{description} Contact us about pieces without a purchase link.</p>
    </section>
    <nav class="collection-nav" aria-label="Sketchbook collections">{"".join(links)}</nav>
    <p id="sketch-empty" class="sketch-empty" hidden>No pieces in this collection yet.</p>
    <div id="sketch-grid" class="sketch-grid" aria-live="polite"></div>
  </main>
  <footer class="site-footer">
    <p class="site-footer__note">This website does not take payment. Selected original artworks are available through their individual Etsy listings.</p>
  </footer>
  <dialog id="sketch-dialog" class="sketch-dialog" aria-labelledby="sketch-dialog-title">
    <div class="sketch-dialog__bar">
      <button type="button" id="sketch-zoom">View larger</button>
      <button type="button" id="sketch-close">Close</button>
    </div>
    <div class="sketch-dialog__stage" id="sketch-stage">
      <img id="sketch-full" alt="" />
    </div>
    <div class="sketch-dialog__copy">
      <h2 id="sketch-dialog-title"></h2>
      <p id="sketch-meta"></p>
      <p id="sketch-story"></p>
      <p><a id="sketch-buy" hidden target="_blank" rel="noopener noreferrer">Buy on Etsy</a></p>
      <p><a id="sketch-inquire" href="../../contact/">Inquire About This Artwork</a></p>
    </div>
  </dialog>
  <script src="../../assets/js/site.js"></script>
  <script src="../../assets/js/sketchbook.js"></script>
</body>
</html>
"""


def patch_photo_index():
    text = PHOTO.read_text(encoding="utf-8")
    if 'aria-label="Photography subjects"' not in text:
        text = text.replace(
            '    <section class="portfolio-feature"',
            "    " + nav(PHOTO_SUBJECTS, "/photography/") + "\n    <section class=\"portfolio-feature\"",
            1,
        )
    text = re.sub(
        r'<section class="gallery gallery--portfolio" id="portfolio-gallery"[^>]*></section>',
        '<section class="page-section" aria-labelledby="featured-photography-title"><h2 id="featured-photography-title">Featured Photography</h2><div class="gallery gallery--portfolio" id="portfolio-gallery" data-catalog-grid data-featured data-category="photography prints" aria-label="Featured photography"></div><nav class="catalog-pager" data-catalog-pager aria-label="Featured pages"><button type="button" data-page="prev">Previous</button><p data-page-status role="status"></p><button type="button" data-page="next">Next</button></nav></section>',
        text,
        count=1,
    )
    text = text.replace(
        '  <script src="../assets/js/catalog.js"></script>',
        '  <script src="../assets/js/price-eligibility.js"></script>\n  <script src="../assets/js/catalog.js"></script>',
    )
    PHOTO.write_text(text, encoding="utf-8")


def main():
    catalog = json.loads((PUBLIC / "assets" / "data" / "catalog.json").read_text(encoding="utf-8"))
    public = [item for item in catalog["products"] if item.get("category") == "photography prints" and item.get("availability") != "withheld"]
    count = len(public)
    pages = {
        "all": ("All Photographs", f"All {count} public photographs in the portfolio. A photograph keeps one record even when it fits more than one subject.", False, ""),
        "landscapes": ("Landscapes", "Landscapes from the photography portfolio.", False, "Landscapes"),
        "wildlife": ("Wildlife", "Wildlife from the photography portfolio.", False, "Wildlife"),
        "waterscapes": ("Waterscapes", "Rivers, lakes, and waterfalls from the photography portfolio.", False, "Waterscapes"),
        "night-skies": ("Night Skies", "Night skies from the photography portfolio.", False, "Night Skies"),
        "historic-rural": ("Historic/Rural", "Historic and rural places from the photography portfolio.", False, "Historic/Rural"),
        "desert-rock": ("Desert/Rock", "Desert and rock formations from the photography portfolio.", False, "Desert/Rock"),
    }
    for slug, (title, description, featured, subject) in pages.items():
        folder = PUBLIC / "photography" / slug
        folder.mkdir(parents=True, exist_ok=True)
        canonical = f"https://bitterbuffaloart.com/photography/{slug}/"
        (folder / "index.html").write_text(photo_page(title, description, canonical, canonical.replace("https://bitterbuffaloart.com", ""), subject, featured), encoding="utf-8")
    for _label, href, sketch_filter, title, description in SKETCH_SUBJECTS:
        if href == "/sketchbook/":
            continue
        slug = href.strip("/").split("/")[-1]
        folder = PUBLIC / "sketchbook" / slug
        folder.mkdir(parents=True, exist_ok=True)
        canonical = f"https://bitterbuffaloart.com{href}"
        (folder / "index.html").write_text(sketch_page(title, description, canonical, href, sketch_filter), encoding="utf-8")
    patch_photo_index()
    print("public photographs", count)


if __name__ == "__main__":
    main()
