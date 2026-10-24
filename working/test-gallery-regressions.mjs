import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const require = createRequire(import.meta.url);
const prices = require("../cloudflare-pages/assets/js/price-eligibility.js");
const root = resolve(import.meta.dirname, "..");
const inquiry = JSON.parse(readFileSync(resolve(root, "cloudflare-pages/assets/data/print-inquiry.json"), "utf8"));
const catalog = JSON.parse(readFileSync(resolve(root, "cloudflare-pages/assets/data/catalog.json"), "utf8"));

function photo(id) {
  return inquiry.photographs.find((item) => item.id === id);
}

test("missing authorized price stays a quote instead of an invented price", () => {
  const born = prices.pricedPublicOffers(photo("bb-photo-45"));
  const watcher = prices.pricedPublicOffers(photo("bb-photo-59"));
  assert.deepEqual(born.map((offer) => offer.label), ["12\u00d718 framed canvas $149.33"]);
  assert.deepEqual(watcher.map((offer) => offer.label), ["12\u00d718 framed canvas $149.33"]);
  assert.deepEqual(prices.pricedPublicOffers(photo("bb-photo-10")), []);
  assert.deepEqual(prices.pricedPublicOffers({ sizes: [{ productId: "canvas-floating-15", sizeId: "16x24", status: "hold", publicOffer: "hold" }] }), []);
});

test("a broken category name is rejected and the public pages exist", () => {
  assert.deepEqual(prices.unknownSubjects(["Landscapes", "Not a subject"]), ["Not a subject"]);
  const index = readFileSync(resolve(root, "cloudflare-pages/photography/index.html"), "utf8");
  for (const subject of prices.SUBJECTS) {
    assert.match(index, new RegExp(`/photography/${subject.slug}/`));
    assert.equal(readFileSync(resolve(root, "cloudflare-pages/photography", subject.slug, "index.html"), "utf8").includes(`data-subject="${subject.name}"`), true);
  }
  const publicPhotos = catalog.products.filter((product) => product.category === "photography prints" && product.availability !== "withheld");
  for (const product of publicPhotos) assert.deepEqual(prices.unknownSubjects(product.subjects || []), []);
  const css = readFileSync(resolve(root, "cloudflare-pages/assets/css/site.css"), "utf8");
  assert.match(css, /\.collection-nav a \{[^}]*display:\s*inline-flex/);
  const navPages = [
    "cloudflare-pages/photography/index.html",
    "cloudflare-pages/photography/all/index.html",
    "cloudflare-pages/sketchbook/index.html",
    "cloudflare-pages/sketchbook/digital-art/index.html",
    "cloudflare-pages/sketchbook/drawings/index.html",
    "cloudflare-pages/sketchbook/paintings/index.html",
    "cloudflare-pages/sketchbook/mixed-media/index.html",
    ...prices.SUBJECTS.map((subject) => `cloudflare-pages/photography/${subject.slug}/index.html`),
  ];
  for (const page of navPages) {
    const html = readFileSync(resolve(root, page), "utf8");
    const start = html.indexOf('<nav class="collection-nav"');
    const nav = html.slice(start, html.indexOf("</nav>", start));
    assert.equal(nav.includes("</a><a"), false, page);
  }
  const missing = readFileSync(resolve(root, "cloudflare-pages/404.html"), "utf8");
  assert.match(missing, /class="site-header"/);
  assert.match(missing, /href="\/photography\/">Return to the photography portfolio/);
});

test("a laser page without a pager keeps every catalog card", () => {
  const script = readFileSync(resolve(root, "cloudflare-pages/assets/js/catalog.js"), "utf8");
  assert.match(script, /const slice = pager \? items\.slice\(\(safePage - 1\) \* pageSize, safePage \* pageSize\) : items/);
  const laser = catalog.products.filter((product) => product.category === "laser");
  const baselineLaser = [
    "bb-aspen-round-buffalo",
    "bb-wood-round-fox",
    "bb-wood-round-elk-trail",
    "bb-wood-round-cracked-elk",
    "bb-cutting-board-solar-summit",
    "bb-cutting-board-moonrise-ridge",
    "bb-cutting-board-celestial-trail",
    "bb-cutting-board-alpine-orbit",
    "bb-01-coaster-4pc-001",
    "bb-02-coaster-4pc-002",
    "bb-03-coaster-4pc-003",
    "bb-04-coaster-5pc-001",
    "bb-05-coaster-4pc-004",
    "bb-06-coaster-4pc-005",
    "bb-07-coaster-4pc-006",
    "bb-08-coaster-4pc-007",
  ];
  const addedLaser = ["bb-architecture-of-infinity", "bb-resonance-in-eight-dimensions"];
  for (const id of baselineLaser) {
    assert.ok(laser.some((item) => item.id === id), id);
  }
  assert.deepEqual(
    laser.filter((item) => !baselineLaser.includes(item.id)).map((item) => item.id).sort(),
    addedLaser,
  );
  assert.equal(laser.length, baselineLaser.length + addedLaser.length);
  const page = readFileSync(resolve(root, "cloudflare-pages/laser-art/index.html"), "utf8");
  assert.equal(page.includes("data-catalog-pager"), false);
  assert.equal((page.match(/data-catalog-grid/g) || []).length, 1);
  for (const id of ["bb-05-coaster-4pc-004", "bb-06-coaster-4pc-005", "bb-07-coaster-4pc-006", "bb-08-coaster-4pc-007"]) {
    const product = laser.find((item) => item.id === id);
    assert.equal(product.retail_price, "33.33");
    assert.match(product.images, /\/assets\/images\/products\//);
    assert.match(product.inquiry_or_external_link, /^https:\/\/www\.etsy\.com\/listing\/\d+\//);
  }
  const resonance = laser.find((item) => item.id === "bb-resonance-in-eight-dimensions");
  const mandala = laser.find((item) => item.id === "bb-architecture-of-infinity");
  assert.equal(resonance.retail_price, "166.66");
  assert.equal(mandala.retail_price, "199.99");
  assert.equal(resonance.availability, "inquiry");
  assert.equal(mandala.availability, "inquiry");
  assert.equal(resonance.inquiry_or_external_link.includes("etsy.com"), false);
  assert.deepEqual(resonance.detail_images, ["/assets/images/products/details/resonance-in-eight-dimensions-corrected.jpg"]);
  assert.equal(resonance.images.includes("resonance-in-eight-dimensions-corrected.jpg"), true);
  assert.deepEqual(mandala.detail_images, ["/assets/images/products/details/architecture-of-infinity.jpg"]);
  const viewer = readFileSync(resolve(root, "cloudflare-pages/assets/js/site.js"), "utf8");
  assert.equal(viewer.includes("BBOrientImage"), false);
  assert.match(viewer, /window\.BBLightbox/);
  assert.match(viewer, /data-zoom-in/);
  const tieDye = readFileSync(resolve(root, "cloudflare-pages/tie-dye/index.html"), "utf8");
  assert.equal(/href="https:\/\/www\.etsy\.com\/listing\/[^"]+"[^>]*>\s*<img/.test(tieDye), false);
  assert.equal(mandala.inquiry_or_external_link.includes("etsy.com"), false);
  const sketchWorks = JSON.parse(readFileSync(resolve(root, "cloudflare-pages/assets/sketchbook/works.json"), "utf8")).works;
  for (const id of ["the-color-between-worlds", "sky-within", "grit-grin", "static-mischief"]) {
    assert.ok(sketchWorks.some((work) => work.id === id), id);
  }
  const physicalIds = ["mycelial-delirium", "chromatic-rupture", "the-unquiet-interior", "fragments-of-the-unconscious", "anatomy-of-unreason"];
  for (const id of physicalIds) {
    assert.equal(sketchWorks.some((work) => work.id === id), false, id);
  }
  const works = JSON.parse(readFileSync(resolve(root, "cloudflare-pages/assets/original-fine-art/works.json"), "utf8")).works;
  assert.deepEqual(works.map((work) => work.id), physicalIds);
  const anatomy = works.find((work) => work.id === "anatomy-of-unreason");
  assert.equal(anatomy.saleable, false);
  assert.equal(anatomy.sku, null);
  assert.equal(anatomy.availability, "Private collection — not for sale");
  assert.equal(Object.hasOwn(anatomy, "etsyUrl"), false);
  const prices = {
    "mycelial-delirium": "One available · $93.33",
    "chromatic-rupture": "One available · $133.33",
    "the-unquiet-interior": "One available · $166.66",
    "fragments-of-the-unconscious": "One available · $166.66",
  };
  for (const [id, availability] of Object.entries(prices)) {
    const work = works.find((item) => item.id === id);
    assert.equal(work.saleable, true);
    assert.equal(work.availability, availability);
    assert.equal(Object.hasOwn(work, "etsyUrl"), false);
    assert.match(work.display, /^\/assets\/sketchbook\/display\//);
  }
});

test("near-duplicate pairs are not adjacent when another photograph is present", () => {
  const samples = [
    { name: "Still Standing, Still Flowing" },
    { name: "The Night Keeps Watch" },
    { name: "Where the Fence Meets the Trees" },
  ];
  const separated = prices.separatePairs(samples);
  assert.notEqual(Math.abs(separated.findIndex((item) => item.name === "Still Standing, Still Flowing") - separated.findIndex((item) => item.name === "The Night Keeps Watch")), 1);
  const photos = catalog.products.filter((product) => product.category === "photography prints" && product.availability !== "withheld");
  const landscapes = photos.filter((product) => Array.isArray(product.subjects) && product.subjects.includes("Landscapes"));
  for (const items of [photos, landscapes]) {
    const order = prices.separatePairs(items);
    const peak = order.findIndex((item) => item.name === "The Peak Behind the Yellow Trees");
    const sun = order.findIndex((item) => item.name === "The Sun Breaks Over the Peak");
    assert.notEqual(Math.abs(peak - sun), 1);
  }
});

test("a public original without a watermark record fails, and watermarking does not change the source", () => {
  const ledger = JSON.parse(readFileSync(resolve(root, "working/public-watermark-ledger-2026-10-21.json"), "utf8"));
  assert.equal(Object.hasOwn(ledger.files, "cloudflare-pages/assets/images/portfolio/25.jpg"), true);
  assert.equal(Object.hasOwn(ledger.files, "cloudflare-pages/assets/images/portfolio/not-watermarked.jpg"), false);
  const output = execFileSync("python", ["working/test-watermark-fixture.py"], { cwd: root, encoding: "utf8" });
  assert.match(output, /source-unchanged/);
  assert.match(output, /watermark-changed-pixels/);
});
