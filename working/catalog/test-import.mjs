import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { productsFromCsv } from "./import-products.mjs";

test("product import keeps 44 photographs and the one approved price", () => {
  const products = productsFromCsv(readFileSync(new URL("./products.csv", import.meta.url), "utf8"));
  const inquiry = JSON.parse(readFileSync(new URL("../../cloudflare-pages/assets/data/print-inquiry.json", import.meta.url), "utf8"));
  const photos = products.filter((product) => product.category === "photography prints");
  const priced = inquiry.photographs
    .filter((photo) => photo.sizes.some((size) => size.productId === "canvas-floating-15" && size.sizeId === "16x24" && size.status === "priced"))
    .map((photo) => [photo.id, "199.33"]);
  assert.equal(photos.length, 44);
  assert.equal(products.filter((product) => product.category === "laser").length, 8);
  assert.equal(products.filter((product) => product.category === "tie-dye").length, 3);
  assert.deepEqual(
    products.filter((product) => product.category === "tie-dye").map((product) => product.id),
    ["bb-tiedye-earth-tones", "bb-tiedye-overalls", "bb-tiedye-lace-top"],
  );
  assert.deepEqual(
    products.filter((product) => product.retail_price).map((product) => [product.id, product.retail_price]),
    priced,
  );
  assert.equal(photos.filter((product) => product.images.includes("/assets/images/portfolio/thumbs/")).length, 44);
  assert.equal(priced.some((row) => row[0] === "bb-photo-14"), false);
  assert.equal(priced.every((row) => row[1] === "199.33"), true);
});
