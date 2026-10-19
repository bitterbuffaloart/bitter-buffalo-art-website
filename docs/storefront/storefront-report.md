# Grand Tetons pilot

Sandbox `GET /stores` returned HTTP 200. Store id **90604**, name Bitter Buffalo Art. No order was created. No payment was taken. 16×24 retail stays **$199.33**. 20×30 stays unavailable at about 191.5 PPI. Owner-reported **$90.13** is not an API cost. The $34.39 figure is the API base only.

## Configuration

Subcategory **101003**, `1.50in Stretched Canvas`.

| Piece | Catalog result |
| --- | --- |
| 1.5-inch canvas | Confirmed. Subcategory 101003. |
| Mirror wrap | Confirmed. Canvas Border option 2. Price $0. |
| Foamcore | Confirmed. Canvas Underlayer option 10. |
| Backing and hanging hardware | Confirmed as one option, id 7: Black Backboard backing with hanging wire installed. The catalog does not sell backing and wire as two separate groups. |
| Canvas finish | Not confirmed. The group lists Semi-Glossy option 212 (default) and Matte option 213. Neither appeared in the price response. |

## Costs returned by the sandbox

| Size | Base `price` | Backboard and wire | Foamcore | Sum of returned lines | Sale |
| --- | --- | --- | --- | --- | --- |
| 12×18 | $26.49 | $9.08 | $4.92 | $40.49 | Closed. Retail not verified. |
| 16×24 | $34.39 | $9.08 | $7.04 | $50.51 | Closed. Retail $199.33. |
| 20×30 | $50.37 | $9.08 | $9.76 | $69.21 | Unavailable. About 191.5 PPI. |

## Shipping

Quoted separately to the LumaPrints documentation sample address in Anaheim, CA 92805, not to a Breckenridge address.

| Size | Lowest returned method | Ground economy | USPS Ground Advantage |
| --- | --- | --- | --- |
| 12×18 | USPS Ground Advantage $8.65 | $10.42 | $8.65 |
| 16×24 | Ground economy $10.42 | $10.42 | $13.53 |
| 20×30 | FedEx/UPS/GLS ground $13.94 | $20.70 | $14.62 |

16×24 also returned USPS Priority $15.64, 2-day $35.47, overnight $45.29, and USPS Priority Express $31.62. No method is selected.

## Unresolved

- Canvas finish price.
- The $39.62 difference between the 16×24 line sum of $50.51 and the owner-reported $90.13.
- Shipping to the real destination.
- Square fee and tax. Square was not called. `SQUARE_LOCATION_ID` is unset.
- 12×18 and 20×30 retail.

Detail is in `profitability.md`.
