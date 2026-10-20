# Supplier quote reconciliation

This note records figures that are already in `RETAIL_MATRIX_42_2026-10-19.csv` or that were named for reconciliation. It does not add a new measured cost.

## $39.62 difference

The framed 16×24 worksheet base is $74.01. The earlier unframed 16×24 stretch quote used subcategory 101003, “1.50in Stretched Canvas,” with a base of $34.39.

74.01 − 34.39 = 39.62.

Those are different products. The difference is not a penny error on one quote. The unframed option lines (mirror wrap $0, black backboard with hanging wire $9.08, foamcore) are not framed-canvas options and are not copied into the framed rows.

Unframed option-line sums from that earlier quote, not selected for sale:

| Size | Stretch base | Foamcore | Line sum |
| --- | ---: | ---: | ---: |
| 12×18 | 26.49 | 4.92 | 40.49 |
| 16×24 | 34.39 | 7.04 | 50.51 |
| 20×30 | 50.37 | 9.76 | 69.21 |

Each line sum also includes the $9.08 hardware line. None of those sums is $70.78, $91.56, or $120.68.

## Named quotes $70.78, $91.56, and $120.68

These three amounts are not in the 42-row worksheet. They are stored on `pricing-master.csv` as `unresolved-quote` rows with a blank supplier base, a blank size, and `price_approval` `unresolved`. They are not retail prices and they are not assigned to 12×18, 16×24, or 20×30.

If a later review treats them as framed-canvas bases, they still do not match the worksheet:

- 70.78 − 59.04 = 11.74 against the framed 12×18 base of $59.04.
- 91.56 − 74.01 = 17.55 against the framed 16×24 base of $74.01.
- 120.68 has no framed 20×30 base to compare. That worksheet cell is blank and marked `exact-size-quote-needed`.

20×30 framed canvas stays on hold until a framed cost is verified. The provisional retail $299.33 is unapproved.

## What is confirmed

The only owner-confirmed retail is Grand Tetons, premium 1.5-inch framed canvas, 16×24, at $199.33 (`FRAMED-OPEN-16x24`). Shipping, upgrades, fees, and a calculated margin are blank because those figures are not in the worksheet.
