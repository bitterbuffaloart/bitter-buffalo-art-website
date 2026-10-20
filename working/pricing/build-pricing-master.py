"""Build pricing-master.csv from the saved 42-row worksheet.

Does not invent supplier bases, upgrades, shipping, fees, or margins.
The three named quotes stay on their own rows and are not assigned to a size.
"""
import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "RETAIL_MATRIX_42_2026-10-19.csv"
TARGET = ROOT / "pricing-master.csv"

FIELDNAMES = [
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
]

NAMED_QUOTES = ("70.78", "91.56", "120.68")


def worksheet_row(source):
    approval = "owner-confirmed" if source["retail_status"] == "owner-confirmed" else "unapproved"
    notes = ""
    if source["sku"] == "FRAMED-OPEN-16x24":
        notes = (
            "Owner-confirmed retail is 199.33. "
            "Framed worksheet base 74.01 minus the prior unframed 16x24 stretch base 34.39 equals 39.62. "
            "Those are different products. Shipping, upgrades, and fees are blank on this row."
        )
    elif source["sku"] == "FRAMED-OPEN-20x30":
        notes = "20x30 framed canvas stays on hold. No framed supplier base is recorded. Provisional retail is unapproved."
    return {
        "record_type": "worksheet",
        "sku": source["sku"],
        "material": source["material"],
        "edition": source["edition"],
        "size_in": source["size_in"],
        "known_supplier_base_usd": source["lumaprints_listed_base_usd"],
        "upgrade_cost_usd": "",
        "shipping_estimate_usd": "",
        "fee_estimate_usd": "",
        "provisional_retail_usd": source["provisional_retail_usd"],
        "confirmed_retail_usd": source["confirmed_retail_usd"],
        "price_approval": approval,
        "recorded_pre_fulfillment_usd": source["pre_fulfillment_usd"],
        "recorded_max_unknown_spend_at_35pct_margin_usd": source["max_unknown_spend_at_35pct_margin_usd"],
        "margin_usd": "",
        "base_status": source["base_status"],
        "retail_status": source["retail_status"],
        "fulfillment_status": source["fulfillment_status"],
        "public_visibility": source["public_visibility"],
        "named_unresolved_quote_usd": "",
        "notes": notes,
    }


def quote_row(amount):
    return {
        "record_type": "unresolved-quote",
        "sku": f"QUOTE-NAMED-{amount}",
        "material": "",
        "edition": "",
        "size_in": "",
        "known_supplier_base_usd": "",
        "upgrade_cost_usd": "",
        "shipping_estimate_usd": "",
        "fee_estimate_usd": "",
        "provisional_retail_usd": "",
        "confirmed_retail_usd": "",
        "price_approval": "unresolved",
        "recorded_pre_fulfillment_usd": "",
        "recorded_max_unknown_spend_at_35pct_margin_usd": "",
        "margin_usd": "",
        "base_status": "unresolved-not-assigned",
        "retail_status": "unresolved",
        "fulfillment_status": "unresolved",
        "public_visibility": "not-a-price",
        "named_unresolved_quote_usd": amount,
        "notes": "Named supplier quote. It is not in the 42-row worksheet and is not assigned to a size.",
    }


def main():
    with SOURCE.open(encoding="utf-8", newline="") as handle:
        source_rows = list(csv.DictReader(handle))
    if len(source_rows) != 42:
        raise SystemExit(f"expected 42 worksheet rows, found {len(source_rows)}")
    rows = [worksheet_row(row) for row in source_rows]
    rows.extend(quote_row(amount) for amount in NAMED_QUOTES)
    with TARGET.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDNAMES, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)
    print(f"worksheet={len(source_rows)} unresolved_quotes={len(NAMED_QUOTES)} master={TARGET.name}")


if __name__ == "__main__":
    main()
