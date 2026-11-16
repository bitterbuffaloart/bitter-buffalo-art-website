// Deterministic GA4 integration smoke test. No real tracking requests or customer data.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";

const root = resolve("cloudflare-pages");
const analytics = readFileSync(resolve(root, "assets/js/analytics.js"), "utf8");
const site = readFileSync(resolve(root, "assets/js/site.js"), "utf8");
const config = JSON.parse(readFileSync(resolve(root, "assets/data/analytics-config.json"), "utf8"));
assert.equal(config.measurementId, "G-QHL8LRGK9H");
assert.match(site, /data\.delivered/);
assert.match(site, /trackDeliveredContact\(form\)/);
assert.ok(site.indexOf("if (res.ok && data.ok && data.delivered)") < site.indexOf("trackDeliveredContact(form)"));
assert.equal((site.match(/analytics\.js\?v=20261116/g) || []).length, 1);

const listeners = {};
const scripts = [];
const document = {
  head: { append(element) { scripts.push(element); } },
  createElement() { return { dataset: {}, async: false, src: "" }; },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  addEventListener(type, fn) { (listeners[type] ||= []).push(fn); }
};
const win = {
  document, location: { pathname: "/photography/", origin: "https://bitterbuffaloart.com" },
  dataLayer: [], matchMedia: () => ({ matches: false }),
  fetch: async () => ({ json: async () => config })
};
runInNewContext(analytics, { window: win, Date, URL, Promise });
await new Promise((done) => setImmediate(done));

assert.equal(win.BBAnalytics.state.booted, true);
assert.equal(scripts.length, 1, "GA4 tag added only once");
assert.equal(scripts[0].src, "https://www.googletagmanager.com/gtag/js?id=G-QHL8LRGK9H");
const calls = () => win.dataLayer.map((args) => Array.from(args));
assert.equal(calls().filter((call) => call[0] === "config").length, 1);
assert.equal(calls().filter((call) => call[0] === "event" && call[1] === "page_view").length, 0,
  "page view comes from gtag config, not a duplicate event");
assert.equal(win.BBAnalytics.state.events.filter((e) => e.name === "gallery_view").length, 1);
win.BBAnalytics.boot(config);
assert.equal(scripts.length, 1, "repeated boot does not duplicate tag");

const privateParams = win.BBAnalytics.sanitize({
  email: "visitor@example.com", message: "private", phone: "555-0100",
  page_path: "/photography/", item_id: "01", destination: "mailto:visitor@example.com"
});
assert.equal(privateParams.email, undefined);
assert.equal(privateParams.message, undefined);
assert.equal(privateParams.phone, undefined);
assert.equal(privateParams.destination, undefined);
assert.equal(privateParams.item_id, "01");

const etsy = "https://www.etsy.com/listing/1234567/original-art";
assert.equal(win.BBAnalytics.classifyClick(etsy).name, "etsy_outbound_click");
for (const click of listeners.click || []) {
  click({ target: { closest(selector) { return selector === "a[href]" ? { href: etsy } : null; } } });
}
assert.equal(calls().filter((call) => call[0] === "event" && call[1] === "etsy_outbound_click").length, 1);

let valid = false;
const form = {
  id: "", querySelector() { return null; },
  checkValidity() { return valid; },
  hasAttribute(key) { return key === "data-bb-form"; },
  getAttribute() { return "general"; }
};
assert.equal(win.BBAnalytics.trackDeliveredContact(form), false, "invalid form does not count");
valid = true;
assert.equal(win.BBAnalytics.trackDeliveredContact(form), true, "confirmed delivery counts");
assert.equal(calls().filter((call) => call[0] === "event" && call[1] === "contact_inquiry").length, 1);
assert.equal((listeners.submit || []).length, 0, "form submit alone cannot count as lead");

const routes = ["", "about/", "contact/", "custom/", "events/", "laser-art/",
  "photography/", "shop/", "sketchbook/", "tie-dye/"];
const sitemap = readFileSync(resolve(root, "sitemap.xml"), "utf8");
const robots = readFileSync(resolve(root, "robots.txt"), "utf8");
assert.match(robots, /Sitemap:\s*https:\/\/bitterbuffaloart\.com\/sitemap\.xml/);
for (const route of routes) {
  const html = readFileSync(resolve(root, route, "index.html"), "utf8");
  assert.match(html, /assets\/js\/site\.js\?v=20261116/);
  assert.match(html, /rel="canonical"/);
  assert.ok(sitemap.includes("https://bitterbuffaloart.com/" + route), "sitemap missing " + route);
}
console.log("PASS: GA4 singleton, page-view deduplication, privacy, gallery, Etsy, successful leads, SEO route coverage");
