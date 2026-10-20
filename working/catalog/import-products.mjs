import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const columns = [
  "id",
  "name",
  "category",
  "images",
  "description",
  "materials_and_sizes",
  "retail_price",
  "supplier_cost",
  "shipping_estimate",
  "availability",
  "inquiry_or_external_link",
];

const allowed = new Set(["photography prints", "tie-dye", "laser", "custom art"]);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted && char === '"' && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    if (row.some((value) => value !== "")) rows.push(row);
  }
  return rows;
}

export function productsFromCsv(text) {
  const table = parseCsv(text.replace(/^\uFEFF/, ""));
  const header = table.shift();
  if (!header || columns.some((name, index) => header[index] !== name)) {
    throw new Error("Catalog CSV header does not match the import template.");
  }
  return table.map((values) => {
    const record = Object.fromEntries(columns.map((name, index) => [name, values[index] ?? ""]));
    if (!allowed.has(record.category)) {
      throw new Error(`Unsupported category for ${record.id}: ${record.category}`);
    }
    if (record.availability !== "inquiry" && record.availability !== "on-hold" && record.availability !== "external") {
      throw new Error(`Unsupported availability for ${record.id}`);
    }
    if (record.retail_price && !/^\d+\.\d{2}$/.test(record.retail_price)) {
      throw new Error(`Retail price for ${record.id} must be blank or dollars with cents.`);
    }
    return record;
  });
}

function writeCatalog(csvPath, jsonPath) {
  const products = productsFromCsv(readFileSync(csvPath, "utf8"));
  mkdirSync(dirname(jsonPath), { recursive: true });
  writeFileSync(jsonPath, `${JSON.stringify({ products }, null, 2)}\n`);
  return products;
}

if (process.argv[1] && process.argv[1].endsWith("import-products.mjs")) {
  const csvPath = resolve(process.argv[2] || "working/catalog/products.csv");
  const jsonPath = resolve(process.argv[3] || "cloudflare-pages/assets/data/catalog.json");
  const products = writeCatalog(csvPath, jsonPath);
  console.log(`imported=${products.length}`);
}
