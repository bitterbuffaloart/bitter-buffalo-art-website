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
const HELD = new Set();
const OFFERS = {
  "canvas-floating-15": {
    "12x18": { minimum: 200, listed: true },
    "16x24": { minimum: 200, listed: true, approved: true },
    "20x30": { minimum: 200, listed: false },
  },
  "canvas-15": {
    "12x18": { minimum: 200, listed: true },
    "16x24": { minimum: 200, listed: true },
    "20x30": { minimum: 200, listed: false },
  },
  "metal-aluminum": {
    "12x18": { minimum: 300, listed: true },
    "16x24": { minimum: 300, listed: true },
    "20x30": { minimum: 300, listed: true },
  },
  "paper-archival": {
    "12x18": { minimum: 300, listed: false },
    "16x24": { minimum: 300, listed: true },
    "20x30": { minimum: 300, listed: false },
  },
  "paper-semigloss": {
    "12x18": { minimum: 300, listed: false },
    "16x24": { minimum: 300, listed: true },
    "20x30": { minimum: 300, listed: false },
  },
  "paper-somerset": {
    "12x18": { minimum: 300, listed: false },
    "16x24": { minimum: 300, listed: true },
    "20x30": { minimum: 300, listed: false },
  },
};
const SIZES = [
  { id: "12x18", short: 12, long: 18 },
  { id: "16x24", short: 16, long: 24 },
  { id: "20x30", short: 20, long: 30 },
];

function expected(photo, productId, size) {
  const offer = OFFERS[productId][size.id];
  const longSide = Math.max(photo.sourceWidth, photo.sourceHeight);
  const shortSide = Math.min(photo.sourceWidth, photo.sourceHeight);
  if (Math.abs(longSide / shortSide - 1.5) / 1.5 > CROP_LIMIT) return { status: "unavailable" };
  const printWidth = photo.sourceWidth >= photo.sourceHeight ? size.long : size.short;
  const printHeight = photo.sourceWidth >= photo.sourceHeight ? size.short : size.long;
  const ppi = Math.round((Math.min(photo.sourceWidth / printWidth, photo.sourceHeight / printHeight) + 1e-9) * 10) / 10;
  if (HELD.has(photo.id) || ppi < offer.minimum) return { status: "hold", ppi };
  if (offer.approved) return { status: "priced", ppi, retail: "199.33", text: "$199.33 approved" };
  if (!offer.listed) return { status: "custom-quote", ppi, text: "Custom quote." };
  return { status: "pending", ppi, text: "Pending. Inquiry only." };
}

test("inquiry catalog publishes only workbook sizes that are on a supplier sheet", () => {
  assert.equal(catalog.photographs.length, 50);
  assert.deepEqual(catalog.products.map((product) => product.id), Object.keys(OFFERS));
  assert.deepEqual(catalog.omittedFamilies.map((family) => family.name), [
    "Traditional photographic paper",
    "Acrylic face-mount",
    "Framed paper",
    "Collector edition",
  ]);
  assert.equal(catalog.supplierExample, null);
  assert.equal(catalog.approvedRetail.text, "$199.33 approved");
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
    assert.doesNotMatch(html, /Workbook list price|\$149\.33|\$299\.33|\$134\.99|\$224\.99|\$314\.99|\$179\.99|\$359\.99|\$89\.99|\$129\.99|\$199\.99|\$69\.99|\$109\.99|\$189\.99|\$159\.99|\$249\.99|\$74\.01|\$90\.13|\$50\.51|\$34\.39/);
    let approved = 0;
    for (const productId of Object.keys(OFFERS)) {
      for (const size of SIZES) {
        const actual = photo.sizes.find((item) => item.productId === productId && item.sizeId === size.id);
        const want = expected(photo, productId, size);
        assert.equal(actual.status, want.status, `${photo.id} ${productId} ${size.id}`);
        if (want.ppi !== undefined) assert.equal(actual.ppi, want.ppi);
        if (want.text) {
          assert.equal(actual.priceText, want.text);
          assert.match(html, new RegExp(want.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
          if (want.status === "priced") {
            assert.equal(actual.retail, want.retail);
            approved += 1;
          } else {
            assert.equal(actual.retail, undefined);
          }
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
  const framedLarge = tetons.sizes.find((item) => item.productId === "canvas-floating-15" && item.sizeId === "20x30");
  assert.equal(framedLarge.status, "hold");
  assert.equal(framedLarge.ppi, 191.5);
  const metalHold = tetons.sizes.find((item) => item.productId === "metal-aluminum" && item.sizeId === "20x30");
  assert.equal(metalHold.status, "hold");
  assert.equal(metalHold.ppi, 191.5);
  assert.equal(quoteText("bb-photo-02", "metal-aluminum", "20x30"), "Pending. Inquiry only.");
  assert.equal(quoteText("bb-photo-10", "canvas-floating-15", "16x24"), "Request a quote.");
  const byNumber = (number) => catalog.photographs.find((photo) => photo.portfolioNumber === number);
  const framed = (number) => byNumber(number).sizes.find((item) => item.productId === "canvas-floating-15" && item.sizeId === "16x24");
  assert.equal(framed(10).status, "unavailable");
  assert.equal(byNumber(18).sourceWidth, 9601);
  assert.equal(byNumber(18).sourceHeight, 5400);
  assert.equal(framed(18).status, "unavailable");
  assert.equal(byNumber(24).sourceWidth, 9599);
  assert.equal(byNumber(24).sourceHeight, 5400);
  assert.equal(framed(24).status, "unavailable");
  assert.equal(byNumber(18).printHolds, "");
  assert.equal(byNumber(24).printHolds, "");
  assert.equal(framed(45).status, "priced");
  assert.equal(framed(46).status, "hold");
  assert.equal(framed(47).status, "priced");
  assert.equal(framed(48).status, "priced");
  assert.equal(framed(49).status, "hold");
  assert.equal(framed(50).status, "priced");
  assert.equal(byNumber(45).sizes.find((item) => item.productId === "paper-archival" && item.sizeId === "12x18").status, "custom-quote");
  assert.equal(byNumber(45).sizes.find((item) => item.productId === "canvas-15" && item.sizeId === "20x30").status, "custom-quote");
  assert.equal(catalog.photographs.find((photo) => photo.portfolioNumber === 1).title, "Stormborn Grand Tetons");
  assert.equal(catalog.photographs.find((photo) => photo.portfolioNumber === 14).id, "bb-photo-45");
  assert.equal(catalog.photographs.find((photo) => photo.portfolioNumber === 45).id, "bb-photo-46");
  assert.equal(catalog.photographs.find((photo) => photo.portfolioNumber === 45).title, "Where the Mountains Catch Fire");
  assert.equal(catalog.photographs.find((photo) => photo.portfolioNumber === 50).id, "bb-photo-51");
  assert.equal(catalog.photographs.find((photo) => photo.portfolioNumber === 50).title, "The Long Fall Home");
  assert.equal(catalog.photographs.find((photo) => photo.portfolioNumber === 51), undefined);
  assert.match(catalog.photographs.find((photo) => photo.portfolioNumber === 48).story, /the other's antlers/);
});

test("gallery links each photograph to its own inquiry page", () => {
  const photos = products.products.filter((product) => product.category === "photography prints");
  assert.equal(photos.length, 50);
  assert.deepEqual(
    photos.map((product) => product.inquiry_or_external_link),
    catalog.photographs.map((photo) => photo.url),
  );
});

test("contact accepts the inquiry fields and does not report success when send is unavailable", async () => {
  const details = inquiryDetails({
    photographId: "bb-photo-01",
    title: "Stormborn Grand Tetons",
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
  assert.match(sent.text, /Photograph: Stormborn Grand Tetons/);
  assert.match(sent.text, /Catalog ID: bb-photo-01/);
  assert.match(sent.text, /Product: Premium 1\.5-inch floating-frame canvas/);
  assert.match(sent.text, /Size: 16×24/);
  assert.match(sent.text, /Price: \$199\.33/);
  assert.match(sent.text, /Please quote shipping separately/);
});
