from pathlib import Path

path = Path("cloudflare-pages/photography/index.html")
text = path.read_text(encoding="utf-8")
start = text.index('<section class="prose formats-block">')
end = text.index("  </main>")
replacement = """<section class="prose formats-block" id="print-pricing">
      <h2>Print pricing</h2>
      <ul class="checklist">
        <li><strong>Premium 1.5-inch floating-frame canvas</strong> is the print product.</li>
        <li>Grand Tetons, 16×24: <strong>$199.33</strong>. Ordering is by inquiry. This page does not take payment.</li>
        <li>20×30 stays on hold.</li>
        <li>Other sizes and the other 32 photographs do not have a published price.</li>
      </ul>
      <p><a href="../contact/?topic=print&amp;piece=Photography%20portfolio">Send a print inquiry</a>. Handmade tie-dye and laser work remain separate from these photographs.</p>
    </section>
    <section class="gallery gallery--portfolio" id="portfolio-gallery" data-catalog-grid data-category="photography prints" aria-label="Final 33 portfolio"></section>
"""
text = text[:start] + replacement + text[end:]
text = text.replace(
    '<p class="site-footer__note">Purchases are fulfilled through our <a href="https://www.etsy.com/shop/BitterBuffaloArt" target="_blank" rel="noopener noreferrer">Etsy shop</a>. This website does not process checkout.</p>',
    '<p class="site-footer__note">Photography prints are inquiry only. This page does not take payment.</p>',
)
text = text.replace(
    '<li><a href="https://www.etsy.com/shop/BitterBuffaloArt" target="_blank" rel="noopener noreferrer">Shop on Etsy</a></li>',
    '<li><a href="../contact/?topic=print&amp;piece=Photography%20portfolio">Print inquiry</a></li>',
)
text = text.replace(
    '<li><a href="../photography/">Photography</a></li>',
    '<li><a href="../photography/">Photography</a></li>\n          <li><a href="../sketchbook/">Sketchbook</a></li>',
)
if "catalog.js" not in text:
    text = text.replace(
        '<script src="../assets/js/site.js"></script>',
        '<script src="../assets/js/site.js"></script>\n  <script src="../assets/js/catalog.js"></script>',
    )
path.write_text(text, encoding="utf-8")
print("photography updated", "etsy" in text.lower())
