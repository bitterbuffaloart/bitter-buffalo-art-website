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
});

test("near-duplicate pairs are not adjacent when another photograph is present", () => {
  const samples = [
    { name: "Still Standing, Still Flowing" },
    { name: "The Night Keeps Watch" },
    { name: "Where the Fence Meets the Trees" },
  ];
  const separated = prices.separatePairs(samples);
  assert.notEqual(Math.abs(separated.findIndex((item) => item.name === "Still Standing, Still Flowing") - separated.findIndex((item) => item.name === "The Night Keeps Watch")), 1);
});

test("a public original without a watermark record fails, and watermarking does not change the source", () => {
  const ledger = JSON.parse(readFileSync(resolve(root, "working/public-watermark-ledger-2026-10-21.json"), "utf8"));
  assert.equal(Object.hasOwn(ledger.files, "cloudflare-pages/assets/images/portfolio/25.jpg"), true);
  assert.equal(Object.hasOwn(ledger.files, "cloudflare-pages/assets/images/portfolio/not-watermarked.jpg"), false);
  const output = execFileSync("python", ["working/test-watermark-fixture.py"], { cwd: root, encoding: "utf8" });
  assert.match(output, /source-unchanged/);
  assert.match(output, /watermark-changed-pixels/);
});
