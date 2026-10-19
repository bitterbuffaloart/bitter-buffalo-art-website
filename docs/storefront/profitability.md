# Profitability — Grand Tetons canvas

Sandbox store returned by `GET /stores`: store id **90604**, name Bitter Buffalo Art. The response had no separate store-type field. No order was created.

Public title remains Grand Tetons. 16×24 retail stays **$199.33**. 20×30 stays unavailable at about 191.5 PPI. The master was not changed. Owner-reported **$90.13** is not an API cost.

## Configuration the sandbox catalog returned

Subcategory **101003**, name `1.50in Stretched Canvas`, category Canvas id 101, required DPI 200. Landscape inches sent: 18×12, 24×16, 30×20.

Options returned for that subcategory and used in the price request:

| Group | Option id | Name | Selected |
| --- | --- | --- | --- |
| Canvas Border | 2 | Mirror Wrap | Yes |
| Canvas Hanging Hardware | 7 | Black Backboard backing with hanging wire installed | Yes. This one option is both the black backboard and the installed wire. |
| Canvas Underlayer | 10 | Foamcore Underlayer | Yes |
| Canvas Finish | 212 Semi-Glossy (default), 213 Matte | Not confirmed. Sending either id did not add a finish line to the price response. |

Other hardware names exist and were not selected: sawtooth, wire only, backboard with sawtooth, loose wire, three-point security. Framed canvas is a different category. Its 1.50-inch subcategory is 102003 and was not priced.

## Sandbox product prices, 2026-10-19

`POST /pricing/products` returned HTTP 200. The `price` field matches the recorded stretch base. Option prices came back on separate lines. The API did not return a combined total.

| Size | API `price` (base) | Mirror Wrap | Black backboard with hanging wire | Foamcore | Sum of those returned lines |
| --- | --- | --- | --- | --- | --- |
| 12×18 | $26.49 | $0 | $9.08 | $4.92 | $40.49 |
| 16×24 | $34.39 | $0 | $9.08 | $7.04 | $50.51 |
| 20×30 | $50.37 | $0 | $9.08 | $9.76 | $69.21 |

$34.39 stays labeled base-only. $50.51 is the sum of the 16×24 lines above. It is not $90.13. The gap from $50.51 to $90.13 is $39.62 and is not explained by this response.

## Shipping quotes

Separate `POST /pricing/shipping` calls returned HTTP 200. Destination was the address in the LumaPrints shipping documentation sample, Anaheim, CA 92805. No Breckenridge street is on file, so this is not a Breckenridge quote.

| Size | Ground economy | USPS Ground Advantage | USPS Priority | FedEx/UPS/GLS ground | 2-day | Overnight | USPS Priority Express |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 12×18 | $10.42 | $8.65 | $9.86 | $13.94 | $35.47 | $45.29 | $25.41 |
| 16×24 | $10.42 | $13.53 | $15.64 | $13.94 | $35.47 | $45.29 | $31.62 |
| 20×30 | $20.70 | $14.62 | $17.45 | $13.94 | $35.47 | $45.29 | $41.16 |

No shipping method has been chosen.

## Unresolved price components

- Canvas finish, Semi-Glossy or Matte. Not present in the price lines.
- Why the owner-reported $90.13 differs from the $50.51 sum.
- A shipping quote to the real destination. The Anaheim figures are a documentation-sample quote.
- Square processing fee. Square was not called. Location id is unset.
- Tax.
- 12×18 and 20×30 retail.
- 20×30 remains unsellable on resolution, even though the sandbox returned a production price.

16×24 contribution is still blocked. Retail $199.33 minus the $50.51 sum is not a margin, because finish, destination shipping, fee, and tax are unresolved.
