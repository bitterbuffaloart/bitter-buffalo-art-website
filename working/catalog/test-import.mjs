import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { canPurchase, isPublicProduct, ownerConfirmedRetail, pricingFromCsv, productsFromCsv } from "./import-products.mjs";

const csv = readFileSync(new URL("./products.csv", import.meta.url), "utf8");

test("product import keeps 33 photographs and the one approved price", () => {
  const products = productsFromCsv(csv);
  const photos = products.filter((product) => product.category === "photography prints");
  assert.equal(photos.length, 33);
  assert.equal(products.filter((product) => product.category === "laser").length, 8);
  assert.equal(products.filter((product) => product.category === "tie-dye").length, 1);
  assert.equal(products.filter((product) => product.category === "shadowboxes" || product.category === "lamps").length, 0);
  assert.deepEqual(
    products.filter((product) => product.price_approval === "owner-confirmed").map((product) => [product.id, product.retail_price]),
    [["bb-photo-01", "199.33"]],
  );
  assert.equal(products.filter((product) => product.purchasable).length, 0);
  assert.deepEqual(
    photos.filter((product) => product.status === "blocked").map((product) => product.id),
    ["bb-photo-14", "bb-photo-18"],
  );
  assert.equal(photos.filter((product) => product.images.includes("/assets/images/portfolio/thumbs/")).length, 33);
  assert.equal(products.every((product) => product.lumaprints_confirmed === "no"), true);
  assert.equal(products.every((product) => product.estimated_profit === null), true);
});

test("draft rows stay off the public catalog and blocked rows cannot be purchased", () => {
  const header = csv.split(/\r?\n/, 1)[0];
  const draft = `${header}\nbb-lamp-draft,Lantern study,lamps,/assets/images/logo.png,A real lamp would replace this test row.,Wood,19.00,9.00,4.00,inquiry,/contact/,draft,bb-lamp-draft,,0,9.00,4.00,1.00,unapproved,one size,no\n`;
  const [row] = productsFromCsv(draft);
  assert.equal(isPublicProduct(row), false);
  assert.equal(canPurchase(row), false);
  assert.equal(row.estimated_profit, "5.00");
  const blocked = { ...row, status: "blocked", price_approval: "owner-confirmed", lumaprints_confirmed: "yes" };
  assert.equal(canPurchase(blocked), false);
  assert.throws(() => productsFromCsv(draft.replace(",no\n", ",yes\n")), /Refusing bb-lamp-draft/);
});

test("pricing master keeps one confirmed price and does not assign the named quotes", () => {
  const records = pricingFromCsv(readFileSync(new URL("../pricing/pricing-master.csv", import.meta.url), "utf8"));
  assert.equal(records.filter((record) => record.record_type === "worksheet").length, 42);
  assert.deepEqual(
    records.filter((record) => record.record_type === "unresolved-quote").map((record) => record.named_unresolved_quote_usd),
    ["70.78", "91.56", "120.68"],
  );
  assert.equal(records.every((record) => record.margin_usd === "" && record.shipping_estimate_usd === "" && record.upgrade_cost_usd === ""), true);
  assert.equal(records.filter((record) => record.record_type === "unresolved-quote").every((record) => record.known_supplier_base_usd === ""), true);
  assert.equal(ownerConfirmedRetail(records).confirmed_retail_usd, "199.33");
});
