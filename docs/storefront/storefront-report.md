# Grand Tetons pilot

The selected sale configuration is the premium 1.5-inch floating-frame canvas. A buyer sees floating frame, not stretched canvas. 16×24 retail stays **$199.33**. 20×30 stays unavailable at about 191.5 PPI. Every size stays unsellable. No order was created. No payment was taken.

Framed production cost, finishes, frame choices, foamcore, backing, wire, and shipping are unverified. No framed subcategory id or framed option id is stored. Worksheet base **$74.01**, and **$74.01 + $9.08 + $7.04 = $90.13**, are not API quotes. The floating-frame sandbox quote is waiting on replacement credentials.

## Prior unframed quote

Subcategory **101003**, `1.50in Stretched Canvas`, is the prior unframed quote. It is not the selected product.

| Size | Stretch base `price` | Backboard and wire | Foamcore | Sum of returned lines | Sale |
| --- | --- | --- | --- | --- | --- |
| 12×18 | $26.49 | $9.08 | $4.92 | $40.49 | Closed. Retail not verified. |
| 16×24 | $34.39 | $9.08 | $7.04 | $50.51 | Closed. Retail $199.33. |
| 20×30 | $50.37 | $9.08 | $9.76 | $69.21 | Unavailable. About 191.5 PPI. |

Those option ids, 2, 7, and 10, belong to the prior unframed quote only.

## Shipping

The Anaheim, CA 92805 figures are a sample quote for that prior unframed configuration. They are not a Breckenridge quote and not a floating-frame shipping quote. No method is selected.

| Size | Lowest returned method | Ground economy | USPS Ground Advantage |
| --- | --- | --- | --- |
| 12×18 | USPS Ground Advantage $8.65 | $10.42 | $8.65 |
| 16×24 | Ground economy $10.42 | $10.42 | $13.53 |
| 20×30 | FedEx/UPS/GLS ground $13.94 | $20.70 | $14.62 |

16×24 also returned USPS Priority $15.64, 2-day $35.47, overnight $45.29, and USPS Priority Express $31.62.

## Unverified until replacement credentials

- Floating-frame subcategory id.
- Frame finish, frame choice, foamcore, backing, and wire option ids.
- Floating-frame production cost.
- Floating-frame shipping.
- Square fee and tax. Square was not called. `SQUARE_LOCATION_ID` is unset.
- 12×18 and 20×30 retail.

Sandbox `GET /stores` previously returned HTTP 200. Store id **90604**, name Bitter Buffalo Art. Detail is in `profitability.md`.
