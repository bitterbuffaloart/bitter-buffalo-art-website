# Profitability — Grand Tetons floating-frame canvas

The selected sale configuration is the premium 1.5-inch floating-frame canvas. Public title remains Grand Tetons. 16×24 retail stays **$199.33**. 20×30 stays unavailable at about 191.5 PPI. Every size stays unsellable. The master was not changed. No order was created. No payment was taken.

Framed production cost, finishes, frame choices, foamcore, backing, wire, and shipping are unverified. No framed subcategory id or framed option id is stored. The worksheet base **$74.01**, and the arithmetic **$74.01 + $9.08 + $7.04 = $90.13**, are not API quotes. The floating-frame sandbox quote is waiting on replacement credentials.

## Prior unframed quote

This is the earlier sandbox quote for subcategory **101003**, `1.50in Stretched Canvas`. It is not the selected product. Category Canvas id 101, required DPI 200. Landscape inches sent: 18×12, 24×16, 30×20.

Options returned for that subcategory and used in that price request:

| Group | Option id | Name | Used on the prior quote |
| --- | --- | --- | --- |
| Canvas Border | 2 | Mirror Wrap | Yes, on the prior unframed quote only |
| Canvas Hanging Hardware | 7 | Black Backboard backing with hanging wire installed | Yes, on the prior unframed quote only. This one option is both the black backboard and the installed wire. |
| Canvas Underlayer | 10 | Foamcore Underlayer | Yes, on the prior unframed quote only |
| Canvas Finish | 212 Semi-Glossy (default), 213 Matte | Not confirmed. Sending either id did not add a finish line to the price response. |

`POST /pricing/products` returned HTTP 200 for that unframed subcategory. The `price` field is the stretch base. Option prices came back on separate lines. The API did not return a combined total.

| Size | API `price` (stretch base) | Mirror Wrap | Black backboard with hanging wire | Foamcore | Sum of those returned lines |
| --- | --- | --- | --- | --- | --- |
| 12×18 | $26.49 | $0 | $9.08 | $4.92 | $40.49 |
| 16×24 | $34.39 | $0 | $9.08 | $7.04 | $50.51 |
| 20×30 | $50.37 | $0 | $9.08 | $9.76 | $69.21 |

$34.39 stays the prior unframed base only. $50.51 is the sum of the 16×24 lines above. Neither figure is the floating-frame production cost.

Sandbox store returned earlier by `GET /stores`: store id **90604**, name Bitter Buffalo Art. The response had no separate store-type field.

## Shipping sample for the prior unframed quote

Separate `POST /pricing/shipping` calls returned HTTP 200 for that unframed configuration. Destination was the address in the LumaPrints shipping documentation sample, Anaheim, CA 92805. No Breckenridge street is on file. These figures are a sample quote only. They are not a framed-canvas shipping quote, and no method has been chosen.

| Size | Ground economy | USPS Ground Advantage | USPS Priority | FedEx/UPS/GLS ground | 2-day | Overnight | USPS Priority Express |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 12×18 | $10.42 | $8.65 | $9.86 | $13.94 | $35.47 | $45.29 | $25.41 |
| 16×24 | $10.42 | $13.53 | $15.64 | $13.94 | $35.47 | $45.29 | $31.62 |
| 20×30 | $20.70 | $14.62 | $17.45 | $13.94 | $35.47 | $45.29 | $41.16 |

## Still unverified

- Floating-frame subcategory id and option ids.
- Frame finish and frame choice.
- Foamcore, backing, and hanging wire for the floating frame.
- Floating-frame production cost and shipping.
- Square processing fee. Square was not called. Location id is unset.
- Tax.
- 12×18 and 20×30 retail.
- 20×30 remains unavailable at about 191.5 PPI.

16×24 contribution stays blocked. Retail $199.33 is not reduced by the prior unframed sum, because the selected product has no verified production cost.
