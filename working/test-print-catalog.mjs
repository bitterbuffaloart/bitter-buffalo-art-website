import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const catalog = JSON.parse(readFileSync('cloudflare-pages/assets/photography/print-catalog.json', 'utf8'));
const prices = [];
const walk = (value) => {
  if (typeof value === 'number') prices.push(value);
  else if (Array.isArray(value)) value.forEach(walk);
  else if (value && typeof value === 'object') Object.values(value).forEach(walk);
};
walk(catalog);
assert.deepEqual(prices, [199.33]);
assert.equal(catalog.checkout, false);
assert.equal(catalog.ordersPlacedWithSupplier, false);
assert.deepEqual(catalog.products.map((product) => product.id), ['framed-canvas', 'metal', 'giclee', 'acrylic', 'traditional']);
assert.equal(catalog.products.every((product) => product.productionCost == null && product.inquiry === true), true);
assert.equal(catalog.products[0].sizes[0].productionCost, null);
assert.equal(catalog.products[0].sizes[0].shippingCost, null);
assert.deepEqual(catalog.photographsUnavailableForPrint.map((item) => item.portfolio), ['#14', '#18']);
assert.equal(catalog.photographsUnavailableForPrint.every((item) => item.replacement === null), true);

const home = readFileSync('cloudflare-pages/index.html', 'utf8');
assert.equal((home.match(/pillar--home/g) || []).length, 4);
assert.doesNotMatch(home, /secondary-links|brandstory|class="trust"/);
for (const href of ['/photography/', '/tie-dye/', '/laser-art/', '/sketchbook/']) assert.match(home, new RegExp(`href="${href}"`));

const photography = readFileSync('cloudflare-pages/photography/index.html', 'utf8');
assert.deepEqual(photography.match(/\$\d+(?:\.\d+)?/g), ['$199.33', '$199.33', '$199.33']);
assert.match(photography, /Request a Quote/);
assert.match(photography, /illustrative/i);
assert.doesNotMatch(photography, /i\.etsystatic\.com|zno\.com|lumaprints\.com\/.*\.(jpg|png|webp)/i);
assert.match(photography, /<option value="#14 · Horse portrait" disabled>/);
assert.match(photography, /<option value="#18 · Shiprock star trails" disabled>/);
assert.equal((photography.match(/Not available for print until a clean original is reviewed/g) || []).length, 2);

const works = JSON.parse(readFileSync('cloudflare-pages/assets/sketchbook/works.json', 'utf8'));
const titles = Object.fromEntries(works.works.map((work) => [work.id, work.title]));
assert.equal(titles['red-field'], 'The Amanita Paradox');
assert.equal(titles['fox-geometry'], 'The Fox & the Sacred Pattern');
assert.equal(titles['frog-mushroom'], 'The Fifth Dimension');
assert.equal(titles['sky-within'], 'The Sky Within');
assert.equal(titles['grit-grin'], 'Grit & Grin');
assert.equal(titles['static-mischief'], 'Static Mischief');
assert.equal(works.works.some((work) => /Whispers of the Hidden Forest|mystical forest/i.test(`${work.id} ${work.title}`)), false);

const laser = readFileSync('cloudflare-pages/laser-art/index.html', 'utf8');
assert.match(laser, /https:\/\/www\.etsy\.com\/shop\/BitterBuffaloArt/);
assert.match(laser, /complete sets together/);
assert.doesNotMatch(laser.slice(laser.indexOf('id="coaster-sets"'), laser.indexOf('id="engraved-wood"')), /<img/);

console.log('PASS print catalog: one confirmed price, five inquiry formats, four homepage cards, verified sketchbook titles, no invented coaster image.');
