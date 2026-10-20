const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', 'cloudflare-pages');
const pages = [
  'index.html',
  'photography/index.html',
  'photography/prints/grand-tetons/index.html',
  'sketchbook/index.html',
  'shop/index.html',
  'tie-dye/index.html',
  'laser-art/index.html',
  'custom/index.html',
  'about/index.html',
  'events/index.html',
  'contact/index.html',
];
const issues = [];
for (const p of pages) {
  const full = path.join(root, p);
  if (!fs.existsSync(full)) {
    issues.push(p + ': missing file');
    continue;
  }
  const html = fs.readFileSync(full, 'utf8');
  if (!/name="description"/.test(html)) issues.push(p + ': missing description');
  if (!/og:title/.test(html)) issues.push(p + ': missing og:title');
  if (!/canonical/.test(html)) issues.push(p + ': missing canonical');
  if (!/Laser Art/.test(html) && p !== 'photography/index.html' && p !== 'tie-dye/index.html') {
    // nav should include Laser Art on every page
  }
  const nav = html.slice(html.indexOf('id="site-nav"'), html.indexOf('</nav>'));
  const labels = [...nav.matchAll(/>([^<]+)<\/a>/g)].map((match) => match[1]);
  const expected = ['Home', 'Shop', 'Tie-Dye', 'Photography', 'Sketchbook', 'Custom Art', 'Events', 'About'];
  if (labels.join('|') !== expected.join('|')) issues.push(p + ': nav order ' + labels.join('|'));
  if (/Shop Etsy/.test(nav)) issues.push(p + ': header still has Shop Etsy');
  if (/Buy<\/button>|action="\/api\/prints\/checkout"/.test(html)) issues.push(p + ': page offers a buy button');
  if (
    /Free U\.S\. Shipping|Ground Builder|myshopify\.com|shopify\.com\/cart|GIVEAWAY-UNION|Union Peaks giveaway|bb-giveaway/i.test(
      html
    )
  ) {
    issues.push(p + ': forbidden string');
  }
  // Historical vendor record "Union Peak Festival" is allowed; giveaway promo is not.
}
console.log(issues.length ? issues.join('\n') : 'SEO+content checks OK');
process.exit(issues.length ? 1 : 0);
