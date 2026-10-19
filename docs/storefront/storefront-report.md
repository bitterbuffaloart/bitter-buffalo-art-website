# Grand Tetons pilot

Public title: Grand Tetons, photograph #01, DSC_2626. 20×30 stays unavailable.

## Verified costs

| Size | Retail | Stretch base, before foamcore and hardware | Full production | Shipping |
| --- | --- | --- | --- | --- |
| 12×18 | Not verified | $26.49 | Not recorded | Not a calculator quote |
| 16×24 | $199.33 | $34.39 | Not recorded | Not a calculator quote |
| 20×30 | Not verified | $50.37 | Not recorded | Not a calculator quote |

`13_PREMIUM_CANVAS_CONFIGURATION.md` and `14_LUMAPRINTS_PRICING_VERIFICATION.md` record the 1.5-inch mirror-wrap stretch base only. Foamcore, black backboard, and installed wire are the selected upgrades, and their dollar amounts are blank (`TBD_CART` / `INCLUDED_OR_TBD`). The cart-quote table is empty. No record states a fully upgraded 16×24 total near $90–$92. The worksheet’s $22 customer-shipping figure for 16×24 is marked `ESTIMATED_NOT_CALCULATOR`. The 1.5-inch floating-frame base of $74.01 is a different SKU and is still before foamcore.

Detail: `profitability.md`.

## Real integration results

- LumaPrints sandbox catalog and `POST /pricing/products` were not called. `LUMAPRINTS_API_KEY` and `LUMAPRINTS_API_SECRET` are unset in the process, user, and machine environment, and no `.env` file exists.
- Square sandbox was not called. `SQUARE_ACCESS_TOKEN` and `SQUARE_LOCATION_ID` are unset. No payment link was created.
- `node --test working/test-print-storefront.mjs`: 15 passed, 0 failed. These are local unit tests, not sandbox orders or payments.
- `npx wrangler whoami` (wrangler 4.151.1): not logged in. The saved auth token has expired and could not be refreshed. The session is non-interactive. `CLOUDFLARE_API_TOKEN` is unset. D1 database `bitter-buffalo-prints` and R2 bucket `bitter-buffalo-print-masters` were not created. Bindings `PRINTS_DB` and `PRINT_MASTERS` are not on the Pages project.
- The print master is on disk (`01 - DSC_2626-Edit-no water mark.jpg`, 14,172,423 bytes). It was not uploaded and it is not in git.
- `GET /api/prints/master` can serve that object only with an HMAC token that expires within 15 minutes, and only after `PRINT_MASTERS` exists. That route is not deployed. No fulfillment URL was issued to LumaPrints.
- Customer checkout remains refused. No production order was submitted.

## Current blockers

- LumaPrints sandbox API key and secret are missing, so the full production cost is still unknown.
- Square sandbox access token, location id, and webhook signature key are missing.
- Cloudflare auth is expired, so D1 and the private master bucket were not created.
- Foamcore, hardware, and shipping have no verified dollar amounts.
- 12×18 and 20×30 retail are not verified.
- 20×30 remains below 200 PPI.
- Purchases and production submission stay off until pricing, private master storage, and an authenticated sandbox test have passed.

## Next action

Set `LUMAPRINTS_API_KEY` and `LUMAPRINTS_API_SECRET` in the Windows user environment or in the gitignored website `.env`, using the sandbox key pair only, and do not commit the values.
