# Storefront report — Grand Tetons pilot

Photography purchases are being prepared on this direct storefront. Handmade art stays on the Etsy shop `https://www.etsy.com/shop/BitterBuffaloArt`. Live payment collection is off. LumaPrints production fulfillment is off.

## Evidence labels

| Check | Result |
| --- | --- |
| Local preview opened and exercised | Verified |
| Automated tests | Verified, 14 passed / 0 failed |
| Static site QA | Verified, 10 pages, 57 resources, 0 errors |
| Live Cloudflare preview (`bitter-buffalo-art.pages.dev`) | Not verified. This branch does not deploy. |
| Live domains `bitterbuffaloart.com` / `www` | Not changed |
| Square sandbox payment link | Not created. Host probe returned 401 without a token. |
| LumaPrints sandbox order | Not submitted. No order number. |
| Webhooks against Square or LumaPrints | Not subscribed. Signature and auth behavior covered by unit tests only. |
| Order tracking against a real shipment | Not verified. |

CODE CHANGED. The local preview was opened and exercised. The live Cloudflare preview was not.

## Pilot

The requested pilot name is Stormborn Grand Tetons. The approved photograph title in the Final 33 records is **Grand Tetons**, portfolio #01, source `DSC_2626`. “Stormborn” does not appear in those records, so the public page does not use it as the artwork title.

- Page path: `/photography/prints/grand-tetons/`
- Canonical: `https://bitterbuffaloart.com/photography/prints/grand-tetons/`
- `noindex` until the sale is actually available
- One `h1`: Grand Tetons
- Local preview: `http://127.0.0.1:8765/photography/prints/grand-tetons/`
- Draft pull request (not merged): https://github.com/bitterbuffaloart/bitter-buffalo-art-website/pull/5
- Branch `cursor/photography-storefront-pilot-3433`, pilot commit `5b53547`

The source file on disk is `C:\Users\bitte\OneDrive\Desktop\Portfolio for Etsy\01 - DSC_2626-Edit-no water mark.jpg`, 5746×3831, ratio about 1.4996 (3:2). It is not in git. The page shows `assets/images/portfolio/01.jpg` (1400×933, about 260 KB) and says that JPEG is not the print file.

A separate artist statement has not been recorded. The page says that instead of inventing one.

## Sizes and price

Records in `13_PREMIUM_CANVAS_CONFIGURATION.md` and the Final 33 program allow three 3:2 canvas sizes: 12×18, 16×24, and 20×30. The page has one Size group and those three choices.

Landscape dimensions are what a LumaPrints order would send, so the file aspect is preserved: 18×12, 24×16, and 30×20. Customer labels stay 12×18, 16×24, and 20×30.

| Size | Retail on the page | Production base in the catalog | Sale |
| --- | --- | --- | --- |
| 12×18 | Price not verified | $26.49 before foamcore and hardware | Closed |
| 16×24 | $199.33 | $34.39 before foamcore and hardware | Closed |
| 20×30 | Price not verified | $50.37 before foamcore and hardware | Closed, and below 200 PPI |

$199.33 is the owner-confirmed 16×24 retail for this pilot. It is not a base to which upgrades are added. The $164.94 difference between $199.33 and the $34.39 base is not a margin. See `profitability.md`.

Mirror wrap is the preferred edge when the file allows it. Foamcore, backboard, and hanging hardware are listed as not included until their costs are verified. Metal, acrylic, giclée, and custom sizes link to the contact form.

## What was exercised

Preview server: `working/prints/preview-server.mjs` on port 8765. It serves `cloudflare-pages` and `POST /api/prints/checkout` with `SQUARE_ENVIRONMENT=sandbox` and no database.

Desktop 1280×900 and mobile 390×844:

- Image natural size 1400×933. Rendered ratio 1.4999. Not cropped to another shape.
- Selecting 12×18 set the price line to “12×18 · Price not verified”.
- Selecting 20×30 set it to “20×30 · Price not verified”.
- Selecting 16×24 set it to “16×24 · $199.33”.
- Buy on 16×24 stayed on the page and showed: “This size is not for sale until its costs, print file, and LumaPrints options are verified.”
- Console: one error, HTTP 409 from `POST /api/prints/checkout`. That 409 is the sale gate. No checkout URL was returned.

Screenshots:

- `C:\Users\bitte\AppData\Local\Cursor\AgentStores\cursor_agent_stores\bc-cebdd6d5-d7e5-43e1-8bac-8f1d128016e1\files\media\grand-tetons-desktop.png`
- `C:\Users\bitte\AppData\Local\Cursor\AgentStores\cursor_agent_stores\bc-cebdd6d5-d7e5-43e1-8bac-8f1d128016e1\files\media\grand-tetons-mobile.png`

## Tests

`node --test working/test-print-storefront.mjs` — 14 passed, 0 failed (Node v24).

Covered without calling Square or LumaPrints:

- One photograph, three sizes, page contains $199.33 and does not contain the old provisional Etsy prices.
- Landscape 3:2 match.
- Mapping fixture selects one 1.5-inch stretch subcategory and the unique mirror option. Ambiguous mirror fails closed. Example catalog IDs are not hardcoded.
- Production LumaPrints and Square hosts throw.
- Payment-link body uses 19933 cents, USD, and asks for a shipping address.
- Checkout of every current size returns 409 and does not call Square. A tampered client price returns 400.
- A completed sandbox payment is recorded as blocked and does not submit. Duplicate events and duplicate payment ids do not resubmit. Failed payment, amount mismatch, bad signature (401), and refund do not submit.
- Sandbox submit requires `PRINT_FULFILLMENT_MODE=sandbox-approved`, sends width 24 and height 16 with the mapped option, is idempotent, and records a retryable failure on HTTP 502. Production base is rejected before the order object is used.
- Shipping webhook requires Basic auth and ignores a duplicate event.

`python working/qa-site.py cloudflare-pages` — pages 10, resources 57, portfolio count left at 33, Etsy links only the shop home, errors empty. This was a local file check, not a request to the live site.

## Square, LumaPrints, webhooks, tracking

| Step | What happened |
| --- | --- |
| Square checkout | Local Buy returned 409. Unauthenticated sandbox `POST /v2/online-checkout/payment-links` returned 401. No link, no charge. |
| LumaPrints mapping | Unit-tested against a fixture. Live `GET /stores` returned 401. Subcategory and option ids are unresolved, so `readyToSubmit` stays false. |
| Square webhook | Unit-tested: bad signature 401, amount must match 19933 USD, payment status must be COMPLETED, refunds go to manual review. Not registered in the Square dashboard. |
| LumaPrints shipping webhook | Unit-tested: missing auth 503, bad auth 401, duplicate event ignored, a valid event would store carrier and tracking. Not subscribed. Sandbox does not emit those shipping events. |
| Order tracking | No order exists to track. |

The webhook path does not call LumaPrints for this catalog. Even a verified payment would set fulfillment to `blocked_unverified_costs`.

## Files changed (website repo)

- `cloudflare-pages/photography/prints/grand-tetons/index.html` — pilot page
- `cloudflare-pages/photography/index.html` — “Canvas print pilot” link on #01 only
- `cloudflare-pages/assets/js/print-product.js` — size price line and checkout post
- `cloudflare-pages/assets/css/site.css` — print layout, `align-items: start`
- `cloudflare-pages/sitemap.xml` — pilot URL
- `cloudflare-pages/functions/prints/` — catalog, profit, Square, LumaPrints, orders, store
- `cloudflare-pages/functions/api/prints/` — checkout, Square webhook, LumaPrints webhook
- `working/test-print-storefront.mjs`
- `working/prints/preview-server.mjs`
- `working/prints/d1-prints.sql` — schema not applied
- `docs/storefront/` — copies of this report, credentials, and profitability

The shop page was not rewritten. The other 32 photographs were not published. `working/build-static-site.js` was not run. DNS was not touched.

## Blockers Clyde has to resolve

1. Square sandbox access token, location id, and webhook signature key.
2. LumaPrints sandbox API key and secret, a Standard Store id from `GET /stores`, and a sandbox billing method.
3. Create the D1 database, apply `working/prints/d1-prints.sql`, and bind it as `PRINTS_DB`.
4. Put the 5746×3831 master in protected storage and give LumaPrints a fulfillment URL that is not the public website JPEG.
5. Discover the 1.5-inch stretch subcategory and mirror-wrap option from the sandbox. Leave every other option group unresolved until it is chosen on purpose.
6. Verify foamcore, hardware, shipping, processing fee, and tax. Until then every size stays unsellable.
7. Confirm retail for 12×18 and 20×30, or leave those sizes unpublished.
8. Decide the 20×30 resolution hold (local minimum about 191.5 PPI).
9. Say whether the public title should stay Grand Tetons. Stormborn is not in the approved records.
10. Record an artist statement if one should appear on the page.

## Not in this change

Restoring the farmer-and-plow illustration, tumbleweeds, or Western typography was not done. Existing artwork and assets were left as they are.
