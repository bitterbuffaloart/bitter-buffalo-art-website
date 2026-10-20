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

function expected(photo, productId, size) {
  const longSide = Math.max(photo.sourceWidth, photo.sourceHeight);
  const shortSide = Math.min(photo.sourceWidth, photo.sourceHeight);
  if (Math.abs(longSide / shortSide - 1.5) / 1.5 > CROP_LIMIT) {
    return { status: "unavailable" };
  }
  const printWidth = photo.sourceWidth >= photo.sourceHeight ? size.long : size.short;
  const printHeight = photo.sourceWidth >= photo.sourceHeight ? size.short : size.long;
  const ppi = Math.round((Math.min(photo.sourceWidth / printWidth, photo.sourceHeight / printHeight) + 1e-9) * 10) / 10;
  const held = ppi < 200 || (size.id === "20x30" && photo.printHolds.includes("HOLD_20x30"));
  if (held) return { status: "hold", ppi };
  if (photo.id === "bb-photo-01" && productId === "canvas-floating-15" && size.id === "16x24") {
    return { status: "priced", ppi, retail: "199.33" };
  }
  return { status: "quote", ppi };
}

test("inquiry catalog has 33 photographs and only verified canvas families", () => {
  assert.equal(catalog.photographs.length, 33);
  assert.deepEqual(catalog.products.map((product) => product.id), ["canvas-floating-15", "canvas-15"]);
  assert.deepEqual(catalog.omittedFamilies.map((family) => family.name), [
    "Traditional photographic paper",
    "Archival giclée fine-art paper",
    "Aluminum metal",
    "Acrylic face-mount",
    "Framed paper",
  ]);
  assert.equal(catalog.supplierExample, null);
  assert.equal(catalog.approvedRetail.text, "$199.33");
});

test("every photograph keeps its measured sizes, price, and page", () => {
  const sizes = [
    { id: "12x18", short: 12, long: 18 },
    { id: "16x24", short: 16, long: 24 },
    { id: "20x30", short: 20, long: 30 },
  ];
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
    assert.doesNotMatch(html, /etsy\.com|Buy<\/button>|\/api\/prints\/checkout/);
    assert.equal((html.match(/\$199\.33/g) || []).length, photo.id === "bb-photo-01" ? 1 : 0);
    const page = resolve(root, "cloudflare-pages/photography/prints", photo.slug, "index.html");
    assert.equal(readdirSync(resolve(page, "..")).includes("index.html"), true);
    for (const productId of ["canvas-floating-15", "canvas-15"]) {
      for (const size of sizes) {
        const actual = photo.sizes.find((item) => item.productId === productId && item.sizeId === size.id);
        const want = expected(photo, productId, size);
        assert.equal(actual.status, want.status, `${photo.id} ${productId} ${size.id}`);
        if (want.ppi !== undefined) assert.equal(actual.ppi, want.ppi);
        if (want.status === "priced") assert.equal(actual.retail, "199.33");
        if (want.status !== "priced") assert.equal(actual.retail, undefined);
        if (want.status === "unavailable") assert.doesNotMatch(html, new RegExp(`data-product="${productId}" data-size="${size.id}"`));
      }
    }
  }
  const tetons = catalog.photographs[0];
  const hold = tetons.sizes.find((item) => item.productId === "canvas-floating-15" && item.sizeId === "20x30");
  assert.equal(hold.status, "hold");
  assert.equal(hold.ppi, 191.5);
  assert.equal(quoteText("bb-photo-01", "canvas-floating-15", "16x24"), "$199.33");
  assert.equal(quoteText("bb-photo-01", "canvas-15", "16x24"), "Request a quote.");
  assert.equal(quoteText("bb-photo-02", "canvas-floating-15", "16x24"), "Request a quote.");
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
