import fs from "fs";
import vm from "vm";
import assert from "assert";

const source = fs.readFileSync(new URL("../../cloudflare-pages/assets/js/analytics.js", import.meta.url), "utf8");
const created = [];
const document = {
  readyState: "complete",
  head: { append(node) { created.push(node); } },
  addEventListener() {},
  createElement() {
    return { dataset: {} };
  },
  querySelector(selector) {
    return created.find((node) => selector.includes(node.dataset.bbGtag)) || null;
  },
};
const context = {
  URL,
  document,
  location: { pathname: "/photography/wildlife/" },
  matchMedia() { return { matches: false }; },
  fetch() {
    return new Promise(() => {});
  },
};
context.window = context;
vm.createContext(context);
vm.runInContext(source, context);

const analytics = context.BBAnalytics;
assert.equal(analytics.shouldLoadGoogle(""), false);
assert.equal(analytics.shouldLoadGoogle("UA-12345-1"), false);
assert.equal(analytics.shouldLoadGoogle("G-TEST123"), true);
assert.equal(analytics.googleTagUrl(""), "");

const gallery = analytics.collectPage("/photography/");
assert.equal(gallery.filter((event) => event.name === "page_view").length, 1);
assert.equal(gallery.filter((event) => event.name === "gallery_view").length, 1);
const artwork = analytics.collectPage("/photography/prints/stormborn/");
assert.equal(artwork.some((event) => event.name === "artwork_view" && event.params.item_id === "stormborn"), true);
assert.equal(artwork.some((event) => event.name === "gallery_view"), false);

const faa = analytics.classifyClick("https://fineartamerica.com/featured/example.html");
assert.equal(faa.name, "faa_purchase_link_click");
assert.equal(faa.params.outcome, "click");
const etsy = analytics.classifyClick("https://www.etsy.com/listing/4597094094/buffalo");
assert.equal(etsy.name, "etsy_outbound_click");
const square = analytics.classifyClick("https://square.link/u/example");
assert.equal(square.name, "gallery_print_link_click");
assert.equal(analytics.classifyClick("mailto:owner@example.com"), null);

const clean = analytics.sanitize({ email: "owner@example.com", page_path: "/photography/", note: "owner@example.com" });
assert.equal(Object.hasOwn(clean, "email"), false);
assert.equal(Object.hasOwn(clean, "note"), false);
assert.equal(clean.sale_completed, false);

const form = {
  hasAttribute(name) { return name === "data-print-inquiry"; },
  querySelector(selector) {
    if (selector === 'input[name="website"]') return { value: "" };
    if (selector === "#print-product") return { value: "paper-archival" };
    if (selector === "#print-size") return { value: "12x18" };
    if (selector === 'input[name="contact[catalog_id]"]') return { value: "bb-photo-01" };
    return null;
  },
  checkValidity() { return true; },
};
const inquiry = analytics.inquiryFromForm(form);
assert.equal(inquiry.name, "gallery_print_inquiry");
assert.equal(JSON.stringify(inquiry).includes("@"), false);
assert.equal(inquiry.params.product_code, "paper-archival");

analytics.boot({ measurementId: "" });
const names = analytics.state.events.map((event) => event.name);
assert.equal(names.filter((name) => name === "page_view").length, 1);
assert.equal(names.filter((name) => name === "gallery_view").length, 1);
assert.equal(created.length, 0);
analytics.state.booted = false;
analytics.state.seen.clear();
analytics.state.events.length = 0;
const config = JSON.parse(fs.readFileSync(new URL("../../cloudflare-pages/assets/data/analytics-config.json", import.meta.url), "utf8"));
assert.equal(config.measurementId, "G-QHL8LRGK9H");
assert.equal(config.propertyId, "551062294");
analytics.boot({ measurementId: config.measurementId });
assert.equal(analytics.state.events.filter((event) => event.name === "page_view").length, 1);
assert.equal(analytics.state.events.filter((event) => event.name === "gallery_view").length, 1);
assert.equal(created.length, 1);
assert.equal(created[0].src, "https://www.googletagmanager.com/gtag/js?id=G-QHL8LRGK9H");
analytics.loadGoogle(config.measurementId);
assert.equal(created.length, 1);
const commands = [...context.dataLayer].map((entry) => entry[0] + ":" + entry[1]);
assert.equal(commands.filter((command) => command === "config:G-QHL8LRGK9H").length, 1);
assert.equal(commands.filter((command) => command === "event:page_view").length, 0);
assert.equal(commands.filter((command) => command === "event:gallery_view").length, 1);

console.log("analytics tests passed");
