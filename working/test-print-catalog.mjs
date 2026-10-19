import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const catalog = JSON.parse(readFileSync('cloudflare-pages/assets/photography/print-catalog.json', 'utf8'));
const priced = catalog.products.filter(product => product.id !== 'acrylic');
assert.equal(priced.length, 10);
assert.deepEqual(priced.map(product => product.sizes.length), Array(10).fill(3));
const sizeIds = ['12x18', '16x24', '20x30'];
for (const p of priced) {
  assert.equal(p.supplier, 'LumaPrints');
  assert.deepEqual(p.sizes.map(s => s.id), sizeIds);
  assert.equal(p.sizes.every(s => Number.isFinite(s.retailPrice) && s.retailPrice > 0), true);
  assert.equal(p.sizes.every(s => s.productionCost == null && s.shippingCost == null), true);
}
assert.equal(catalog.checkout, false);
assert.equal(catalog.ordersPlacedWithSupplier, false);
assert.equal(catalog.products.find(p => p.id === 'framed-canvas').sizes[1].retailPrice, 199.33);
assert.equal(catalog.products.find(p => p.id === 'acrylic').availability, 'special-request');
assert.deepEqual(catalog.photographsUnavailableForPrint.map(p => p.portfolio), ['#14', '#18', '#24']);

const home = readFileSync('cloudflare-pages/index.html', 'utf8');
assert.equal((home.match(/pillar--home/g) || []).length, 4);
assert.doesNotMatch(home, /secondary-links|brandstory|class="trust"/);
for (const href of ['/photography/', '/tie-dye/', '/laser-art/', '/sketchbook/']) assert.match(home, new RegExp(`href="${href}"`));

const photography = readFileSync('cloudflare-pages/photography/index.html', 'utf8');
// Every priced row is visible to customers for all three sizes.
assert.equal((photography.match(/<tr><th scope="row">/g) || []).length, 10);
for (const p of priced) for (const size of p.sizes) assert.ok(photography.includes('$' + size.retailPrice.toFixed(2)), p.name + ' ' + size.id + ' missing price');
assert.doesNotMatch(photography, /Other size — Request a Quote/);
for (const size of ['12x18', '16x24', '20x30']) assert.match(photography, new RegExp('option value="' + size + '"'));
assert.match(photography, /option value="stretched-canvas"/);
assert.doesNotMatch(photography, /Zno is under evaluation/);

assert.match(photography, /Real LumaPrints Product Examples/);
assert.equal((photography.match(/data-supplier-src=/g) || []).length, 16);
assert.match(photography, /The sample artwork in these manufacturer photographs is not Bitter Buffalo Art photography/);
assert.doesNotMatch(photography, /i\.etsystatic\.com|zno\.com/i);
assert.match(photography, /<option value="#14 · Horse portrait" disabled>/);
assert.match(photography, /<option value="#18 · Shiprock star trails" disabled>/);
assert.match(photography, /<option value="#24 · Aspen valley" disabled>/);
assert.equal((photography.match(/Not available for print until a clean original is reviewed/g) || []).length, 3);

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

console.log('PASS print catalog: 30 fixed-priced standard options, three print holds, four homepage cards, verified sketchbook titles, no invented coaster image.');
