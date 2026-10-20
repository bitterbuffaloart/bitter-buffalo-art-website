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
  "status",
  "sku",
  "etsy_listing_id",
  "inventory",
  "production_cost",
  "shipping_cost",
  "fee_estimate",
  "price_approval",
  "variations",
  "lumaprints_confirmed",
];

const allowed = new Set([
  "photography prints",
  "tie-dye",
  "laser",
  "custom art",
  "coasters",
  "shadowboxes",
  "lamps",
]);

const moneyNames = ["retail_price", "supplier_cost", "shipping_estimate", "production_cost", "shipping_cost", "fee_estimate"];

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

function moneyOrBlank(record, name) {
  const value = record[name];
  if (!value) return;
  if (!/^\d+\.\d{2}$/.test(value)) {
    throw new Error(`${name} for ${record.id} must be blank or dollars with cents.`);
  }
}

export function estimatedProfit(record) {
  const needed = ["retail_price", "production_cost", "shipping_cost", "fee_estimate"];
  if (needed.some((name) => !record[name])) return null;
  const [retail, production, shipping, fee] = needed.map((name) => Number(record[name]));
  const profit = retail - production - shipping - fee;
  return profit.toFixed(2);
}

export function isPublicProduct(record) {
  return record.status !== "draft";
}

export function canPurchase(record) {
  return record.status === "active"
    && record.availability !== "on-hold"
    && record.price_approval === "owner-confirmed"
    && record.lumaprints_confirmed === "yes"
    && Boolean(record.retail_price);
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
    if (!["inquiry", "on-hold", "external"].includes(record.availability)) {
      throw new Error(`Unsupported availability for ${record.id}`);
    }
    if (!["active", "draft", "blocked"].includes(record.status)) {
      throw new Error(`Unsupported status for ${record.id}`);
    }
    if (record.price_approval && !["owner-confirmed", "unapproved"].includes(record.price_approval)) {
      throw new Error(`Unsupported price approval for ${record.id}`);
    }
    if (!["yes", "no"].includes(record.lumaprints_confirmed)) {
      throw new Error(`LumaPrints confirmation for ${record.id} must be yes or no.`);
    }
    if (record.lumaprints_confirmed === "yes") {
      throw new Error(`Refusing ${record.id}: a variant is confirmed only after the LumaPrints API returns that configuration.`);
    }
    for (const name of moneyNames) moneyOrBlank(record, name);
    if (record.retail_price && record.price_approval !== "owner-confirmed" && record.price_approval !== "unapproved") {
      throw new Error(`Retail price for ${record.id} needs owner-confirmed or unapproved.`);
    }
    record.estimated_profit = estimatedProfit(record);
    record.purchasable = canPurchase(record);
    return record;
  });
}

export const pricingColumns = [
  "record_type",
  "sku",
  "material",
  "edition",
  "size_in",
  "known_supplier_base_usd",
  "upgrade_cost_usd",
  "shipping_estimate_usd",
  "fee_estimate_usd",
  "provisional_retail_usd",
  "confirmed_retail_usd",
  "price_approval",
  "recorded_pre_fulfillment_usd",
  "recorded_max_unknown_spend_at_35pct_margin_usd",
  "margin_usd",
  "base_status",
  "retail_status",
  "fulfillment_status",
  "public_visibility",
  "named_unresolved_quote_usd",
  "notes",
];

const pricingMoney = [
  "known_supplier_base_usd",
  "upgrade_cost_usd",
  "shipping_estimate_usd",
  "fee_estimate_usd",
  "provisional_retail_usd",
  "confirmed_retail_usd",
  "recorded_pre_fulfillment_usd",
  "recorded_max_unknown_spend_at_35pct_margin_usd",
  "margin_usd",
  "named_unresolved_quote_usd",
];

export function pricingFromCsv(text) {
  const table = parseCsv(text.replace(/^\uFEFF/, ""));
  const header = table.shift();
  if (!header || pricingColumns.some((name, index) => header[index] !== name)) {
    throw new Error("Pricing master header does not match.");
  }
  return table.map((values) => {
    const record = Object.fromEntries(pricingColumns.map((name, index) => [name, values[index] ?? ""]));
    if (!["worksheet", "unresolved-quote"].includes(record.record_type)) {
      throw new Error(`Unsupported pricing record ${record.sku}`);
    }
    if (!["owner-confirmed", "unapproved", "unresolved"].includes(record.price_approval)) {
      throw new Error(`Unsupported price approval for ${record.sku}`);
    }
    for (const name of pricingMoney) {
      if (record[name] && !/^\d+\.\d{2}$/.test(record[name])) {
        throw new Error(`${name} for ${record.sku} must be blank or dollars with cents.`);
      }
    }
    if (record.record_type === "unresolved-quote" && record.known_supplier_base_usd) {
      throw new Error(`Unresolved quote ${record.sku} cannot be stored as a supplier base.`);
    }
    return record;
  });
}

export function ownerConfirmedRetail(records) {
  const confirmed = records.filter((record) => record.price_approval === "owner-confirmed" && record.confirmed_retail_usd);
  if (confirmed.length !== 1 || confirmed[0].sku !== "FRAMED-OPEN-16x24" || confirmed[0].confirmed_retail_usd !== "199.33") {
    throw new Error("The only owner-confirmed retail is FRAMED-OPEN-16x24 at 199.33.");
  }
  return confirmed[0];
}

function writeCatalog(csvPath, jsonPath, pricingPath, pricingJsonPath) {
  const products = productsFromCsv(readFileSync(csvPath, "utf8"));
  const pricing = pricingFromCsv(readFileSync(pricingPath, "utf8"));
  const confirmed = ownerConfirmedRetail(pricing);
  const pilot = products.find((product) => product.id === "bb-photo-01");
  if (!pilot || pilot.retail_price !== confirmed.confirmed_retail_usd || pilot.price_approval !== "owner-confirmed") {
    throw new Error("bb-photo-01 retail must match the pricing master owner-confirmed row.");
  }
  mkdirSync(dirname(jsonPath), { recursive: true });
  writeFileSync(jsonPath, `${JSON.stringify({ products }, null, 2)}\n`);
  writeFileSync(pricingJsonPath, `${JSON.stringify({ records: pricing }, null, 2)}\n`);
  return { products, pricing };
}

if (process.argv[1] && process.argv[1].endsWith("import-products.mjs")) {
  const csvPath = resolve(process.argv[2] || "working/catalog/products.csv");
  const jsonPath = resolve(process.argv[3] || "cloudflare-pages/assets/data/catalog.json");
  const pricingPath = resolve(process.argv[4] || "working/pricing/pricing-master.csv");
  const pricingJsonPath = resolve(process.argv[5] || "cloudflare-pages/assets/data/pricing-master.json");
  const { products, pricing } = writeCatalog(csvPath, jsonPath, pricingPath, pricingJsonPath);
  const purchasable = products.filter((product) => product.purchasable).length;
  console.log(`imported=${products.length} purchasable=${purchasable} pricing=${pricing.length}`);
}
