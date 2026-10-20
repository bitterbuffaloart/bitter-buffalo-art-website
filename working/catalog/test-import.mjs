import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { productsFromCsv } from "./import-products.mjs";

test("product import keeps 33 photographs and the one approved price", () => {
  const products = productsFromCsv(readFileSync(new URL("./products.csv", import.meta.url), "utf8"));
  const photos = products.filter((product) => product.category === "photography prints");
  assert.equal(photos.length, 33);
  assert.equal(products.filter((product) => product.category === "laser").length, 8);
  assert.equal(products.filter((product) => product.category === "tie-dye").length, 1);
  assert.deepEqual(
    products.filter((product) => product.retail_price).map((product) => [product.id, product.retail_price]),
    ["01", "02", "04", "05", "06", "09", "11", "13", "15", "16", "17", "19", "20", "21", "22", "23", "25", "26", "31", "33"]
      .map((number) => [`bb-photo-${number}`, "199.33"]),
  );
  assert.equal(photos.filter((product) => product.images.includes("/assets/images/portfolio/thumbs/")).length, 33);
});
