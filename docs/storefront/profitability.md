# Profitability — Grand Tetons canvas pilot

Sale stays closed on every size. A size is sellable only when retail, full production, shipping, processing fee, and tax are all known, contribution is greater than zero, resolution is accepted, the LumaPrints mapping is ready, and the print master is in protected storage. None of those conditions are met.

The production figures below are base canvas prices from the existing LumaPrints records (`13_PREMIUM_CANVAS_CONFIGURATION.md` and `14_LUMAPRINTS_PRICING_VERIFICATION.md`, captured 2026-10-17). They are the 1.5-inch stretch canvas before foamcore, backboard, and hanging hardware. They are not a full production cost and they are not a retail price.

The only confirmed retail is the owner-set 16×24 price of $199.33. That price is not in the LumaPrints worksheets. Older provisional Etsy amounts are not used.

| Size | Customer label | Landscape inches sent to LumaPrints | Local minimum PPI | Resolution | Retail | Production base | Known gap | Contribution | Sale |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 12×18 | 12×18 | 18 × 12 | 319.2 | OK through 12×18 in the Final 33 record. Not marked accepted for sale. | Blocked. Retail not verified. | $26.49 | Blocked. No retail. | Blocked | Closed |
| 16×24 | 16×24 | 24 × 16 | 239.4 | Local PPI is above 200. LumaPrints `checkImageConfig` was not run. | $199.33 (19933 cents) | $34.39 | $164.94 | Blocked | Closed |
| 20×30 | 20×30 | 30 × 20 | 191.5 | Hold. Below 200 PPI on this 5746×3831 file. | Blocked. Retail not verified. | $50.37 | Blocked. No retail. | Blocked | Closed |

## How the 16×24 gap is calculated

19933 − 3439 = 16494 cents, which is $164.94.

That gap is retail minus the recorded base canvas price. It is not profit. It does not subtract foamcore, hanging hardware, shipping, the Square processing fee, or tax, because those amounts are not verified. No 2.9% + $0.30 fee was assumed.

Contribution stays null until this formula can be filled with verified numbers:

`retail − full production − shipping − processing fee − tax`

and the result is greater than zero.

## Shared blockers

- LumaPrints subcategory and option IDs were not discovered from the sandbox catalog.
- Shipping cost is not verified.
- Square processing fee for this account is not verified.
- Colorado destination sales tax is not recorded. The code does not assume Square covers every tax obligation.
- Foamcore, backboard, and hanging hardware costs are not verified. They are not treated as $0.
- The print master is not in protected storage. The website JPEG is display-only.

12×18 and 20×30 also lack a verified retail. 20×30 also stays on the resolution hold.

## What would have to change before a margin can be published

1. Cart-verify foamcore and the chosen hanging hardware for each size, then store the full production cost.
2. Record a sandbox shipping quote for a real destination, not a guessed amount.
3. Record the Square fee that applies to this sandbox location.
4. Record the tax treatment for Colorado destination sales.
5. Confirm or replace 12×18 and 20×30 retail. Leave them unpublished until then.
6. Resolve the 20×30 resolution hold, or keep that size off sale.
7. Discover the 1.5-inch stretch subcategory and mirror-wrap option from the sandbox API. Do not type in example IDs.
