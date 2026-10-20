import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { inquiryDetails, quoteText } from "../cloudflare-pages/assets/js/print-inquiry.js";

const root = resolve(import.meta.dirname, "..");
const catalog = JSON.parse(readFileSync(resolve(root, "cloudflare-pages/assets/data/print-inquiry.json"), "utf8"));
const products = JSON.parse(readFileSync(resolve(root, "cloudflare-pages/assets/data/catalog.json"), "utf8"));
const contactFile = resolve(root, "cloudflare-pages/functions/api/contact.js");
const { onRequestPost } = await import("data:text/javascript;base64," + Buffer.from(readFileSync(contactFile)).toString("base64"));

const CROP_LIMIT = 0.005;
const HELD = new Set(["bb-photo-14", "bb-photo-18", "bb-photo-24"]);
const OFFERS = {
  "canvas-floating-15": {
    "12x18": { minimum: 200, retail: "149.33", text: "Workbook list price $149.33" },
    "16x24": { minimum: 200, retail: "199.33", text: "$199.33", approved: true },
  },
  "canvas-15": {
    "12x18": { minimum: 200, retail: "134.99", text: "Workbook list price $134.99" },
    "16x24": { minimum: 200, retail: "224.99", text: "Workbook list price $224.99" },
  },
  "metal-aluminum": {
    "12x18": { minimum: 300, retail: "179.99", text: "Workbook list price $179.99" },
    "16x24": { minimum: 300, retail: "224.99", text: "Workbook list price $224.99" },
    "20x30": { minimum: 300, retail: "359.99", text: "Workbook list price $359.99" },
  },
  "paper-archival": { "16x24": { minimum: 300, retail: "129.99", text: "Workbook list price $129.99" } },
  "paper-semigloss": { "16x24": { minimum: 300, retail: "109.99", text: "Workbook list price $109.99" } },
  "paper-somerset": { "16x24": { minimum: 300, retail: "159.99", text: "Workbook list price $159.99" } },
};
const SIZES = [
  { id: "12x18", short: 12, long: 18 },
  { id: "16x24", short: 16, long: 24 },
  { id: "20x30", short: 20, long: 30 },
];

function expected(photo, productId, size) {
  const offer = OFFERS[productId][size.id];
  if (!offer) return null;
  const longSide = Math.max(photo.sourceWidth, photo.sourceHeight);
  const shortSide = Math.min(photo.sourceWidth, photo.sourceHeight);
  if (Math.abs(longSide / shortSide - 1.5) / 1.5 > CROP_LIMIT) return { status: "unavailable" };
  const printWidth = photo.sourceWidth >= photo.sourceHeight ? size.long : size.short;
  const printHeight = photo.sourceWidth >= photo.sourceHeight ? size.short : size.long;
  const ppi = Math.round((Math.min(photo.sourceWidth / printWidth, photo.sourceHeight / printHeight) + 1e-9) * 10) / 10;
  if (HELD.has(photo.id) || ppi < offer.minimum) return { status: "hold", ppi };
  return { status: offer.approved ? "priced" : "workbook", ppi, retail: offer.retail, text: offer.text };
}

test("inquiry catalog publishes only workbook sizes that are on a supplier sheet", () => {
  assert.equal(catalog.photographs.length, 33);
  assert.deepEqual(catalog.products.map((product) => product.id), Object.keys(OFFERS));
  assert.deepEqual(catalog.omittedFamilies.map((family) => family.name), [
    "Traditional photographic paper",
    "Acrylic face-mount",
    "Framed paper",
    "Collector edition",
  ]);
  assert.equal(catalog.supplierExample, null);
  assert.equal(catalog.approvedRetail.text, "$199.33");
  assert.equal(catalog.approvedRetail.sizeId, "16x24");
});

test("every photograph keeps its measured sizes, price, and page", () => {
  const slugs = new Set();
  for (const photo of catalog.photographs) {
    assert.equal(slugs.has(photo.slug), false);
    slugs.add(photo.slug);
    const html = readFileSync(resolve(root, "cloudflare-pages/photography/prints", photo.slug, "index.html"), "utf8");
    assert.equal(html.match(/<h1[ >]/g).length, 1);
    assert.match(html, new RegExp(`<h1>${photo.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</h1>`));
    assert.match(html, new RegExp(photo.display.replace(/^\//, "")));
    assert.match(html, new RegExp(`width="${photo.displayWidth}" height="${photo.displayHeight}"`));
    assert.match(html, /Select a product/);
    assert.doesNotMatch(html, /etsy\.com|Buy<\/button>|\/api\/prints\/checkout|acrylic/i);
    assert.doesNotMatch(html, /\$299\.33|\$314\.99|\$74\.01|\$34\.39|\$59\.04/);
    let approved = 0;
    for (const productId of Object.keys(OFFERS)) {
      for (const size of SIZES) {
        const actual = photo.sizes.find((item) => item.productId === productId && item.sizeId === size.id);
        const want = expected(photo, productId, size);
        if (!want) {
          assert.equal(actual, undefined, `${photo.id} ${productId} ${size.id}`);
          continue;
        }
        assert.equal(actual.status, want.status, `${photo.id} ${productId} ${size.id}`);
        if (want.ppi !== undefined) assert.equal(actual.ppi, want.ppi);
        if (want.retail) {
          assert.equal(actual.retail, want.retail);
          assert.equal(actual.priceText, want.text);
          assert.match(html, new RegExp(want.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
          approved += want.status === "priced" ? 1 : 0;
        } else {
          assert.equal(actual.retail, undefined);
          assert.equal(actual.priceText, undefined);
        }
        if (want.status === "unavailable") {
          assert.doesNotMatch(html, new RegExp(`data-product="${productId}" data-size="${size.id}"`));
        }
        assert.equal(quoteText(photo.id, productId, size.id), want.text || "Request a quote.");
      }
    }
    assert.equal((html.match(/\$199\.33/g) || []).length, approved);
  }
  const tetons = catalog.photographs[0];
  assert.equal(tetons.sizes.find((item) => item.productId === "canvas-floating-15" && item.sizeId === "20x30"), undefined);
  const metalHold = tetons.sizes.find((item) => item.productId === "metal-aluminum" && item.sizeId === "20x30");
  assert.equal(metalHold.status, "hold");
  assert.equal(metalHold.ppi, 191.5);
  assert.equal(quoteText("bb-photo-02", "metal-aluminum", "20x30"), "Workbook list price $359.99");
  assert.equal(quoteText("bb-photo-14", "canvas-floating-15", "16x24"), "Request a quote.");
});

test("gallery links each photograph to its own inquiry page", () => {
  const photos = products.products.filter((product) => product.category === "photography prints");
  assert.equal(photos.length, 33);
  assert.deepEqual(
    photos.map((product) => product.inquiry_or_external_link),
    catalog.photographs.map((photo) => photo.url),
  );
});

test("contact accepts the inquiry fields and does not report success when send is unavailable", async () => {
  const details = inquiryDetails({
    photographId: "bb-photo-01",
    title: "Grand Tetons",
    productName: "Premium 1.5-inch floating-frame canvas",
    sizeLabel: "16×24",
    productId: "canvas-floating-15",
    sizeId: "16x24",
    message: "Please quote shipping separately.",
  });
  const payload = {
    name: "QA",
    email: "qa@example.com",
    Subject: "Print inquiry",
    form_kind: "general",
    photograph_title: details.photographTitle,
    catalog_id: details.catalogId,
    print_product: details.product,
    print_size: details.size,
    price_or_quote: details.priceOrQuote,
    body: details.lines.join("\n"),
  };
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response("{}", { status: 200 });
  };
  const unavailable = await onRequestPost({
    request: new Request("https://example.com/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
    env: {},
  });
  const unavailableBody = await unavailable.json();
  assert.equal(unavailable.status, 503);
  assert.equal(unavailableBody.ok, false);
  assert.notEqual(unavailableBody.delivered, true);
  assert.equal(calls, 0);
  let sent;
  globalThis.fetch = async (_url, options) => {
    sent = JSON.parse(options.body);
    return new Response("{}", { status: 200 });
  };
  const delivered = await onRequestPost({
    request: new Request("https://example.com/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
    env: { RESEND_API_KEY: "test-only", CONTACT_TO_EMAIL: "owner@example.com", CONTACT_FROM_EMAIL: "sender@example.com" },
  });
  assert.equal(delivered.status, 200);
  assert.match(sent.text, /Photograph: Grand Tetons/);
  assert.match(sent.text, /Catalog ID: bb-photo-01/);
  assert.match(sent.text, /Product: Premium 1\.5-inch floating-frame canvas/);
  assert.match(sent.text, /Size: 16×24/);
  assert.match(sent.text, /Price: \$199\.33/);
  assert.match(sent.text, /Please quote shipping separately/);
});
