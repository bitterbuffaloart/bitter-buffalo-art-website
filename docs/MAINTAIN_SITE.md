# Maintain the website

One catalog, one portfolio manifest, and one pricing master. Do not start a second site.

## Photographs

Titles and stories live in `working/portfolio/build-final-44.py`. The manifest is `working/portfolio/photography-manifest.json`. Permanent IDs stay stable. Position 14 is the bison calf, `bb-photo-45`. The horse file remains archived as `bb-photo-14` and must not be deleted.

After a photograph change, from the repository root:

```
python working/portfolio/build-final-44.py
python working/catalog/build-catalog.py
python working/prints/build-print-inquiry.py
node --test working/test-print-inquiry.mjs working/test-print-storefront.mjs working/catalog/test-import.mjs working/test-contact.mjs
python working/qa-site.py cloudflare-pages
```

The six print products have authorized starting selling prices in `working/prints/build-print-inquiry.py`. Show a price only when that file is 3:2 within 0.5 percent and meets the PPI minimum: canvas 200, metal and paper 300. Omit a size that would crop the photograph. Disable a size below the PPI minimum and say why. Photographs 34, 40, 46, and 49 stay gallery and inquiry only because they have no verified print master. Do not block the other photographs for those four. #10 stays 16:9 with no invented price. Acrylic stays off.

Standard 1.5-inch stretched canvas at 16×24 is $224.99, which is higher than premium 1.5-inch framed canvas at 16×24 ($199.33). Do not change either price to remove that difference. Framed canvas and stretched canvas stay separate products. Do not map the framed product to unframed stretch subcategory 101003.

$74.01 is the 16×24 framed-canvas supplier base only. It does not include the floating frame, foamcore, hardware, shipping, or delivered cost. Do not treat $90.13 or $50.51 as a verified framed cost. Unknown costs stay unknown, not zero.

## How to turn on payment for one price

1. Confirm the complete production cost, frame, foamcore, hardware, shipping, tax, and a protected print master. A supplier base is not the delivered cost. An authorized starting price is not permission to take payment.
2. Leave checkout disabled until the checks in `cloudflare-pages/functions/prints/profit.mjs` all pass for that one configuration.
3. Do not enable checkout for every product at once. Do not add a Buy button while any of those checks is open.

## Checkout

Reuse these files only. Do not add a second Square stack.

- `cloudflare-pages/functions/prints/square.mjs`
- `cloudflare-pages/functions/prints/orders.mjs`
- `cloudflare-pages/functions/prints/profit.mjs`
- `cloudflare-pages/functions/api/prints/checkout.js`
- `cloudflare-pages/functions/api/prints/square-webhook.js`

`square.mjs` accepts only `SQUARE_ENVIRONMENT=sandbox` and only `https://connect.squareupsandbox.com`. It refuses `https://connect.squareup.com`. The client needs `SQUARE_ACCESS_TOKEN` and `SQUARE_LOCATION_ID`. The webhook check needs `SQUARE_WEBHOOK_SIGNATURE_KEY` and `SQUARE_WEBHOOK_NOTIFICATION_URL`. None of those values belong in git, public JavaScript, or a handoff.

The `.env` file on 2026-10-20 is older than the sandbox locations 401, so Square was not called. The one credential action is to save a new sandbox access token and sandbox location id in that gitignored `.env` as `SQUARE_ACCESS_TOKEN` and `SQUARE_LOCATION_ID`. Do not paste them into chat.

`POST /api/prints/checkout` compares any browser-supplied `retailCents` with the server configuration and returns HTTP 400 when they differ. It returns HTTP 409 before any Square call while cost, print file, or LumaPrints options are unverified. The public pages have no buy button. A sandbox test fixture in `working/test-print-storefront.mjs` is not wired to the public site.

`PRINT_FULFILLMENT_MODE` stays empty. No automatic LumaPrints order is placed from the public site. Secrets stay in the gitignored `.env` or in Pages secrets.

## Order lifecycle

1. Checkout creates a local order only after the profit check says the configuration is sellable. Today that check fails, so the lifecycle stops at HTTP 409 and no Square payment link is created.
2. When a future verified checkout does run, Square returns a sandbox payment link. The order is stored as `paymentStatus=link_created` and `fulfillmentStatus=not_submitted`.
3. The webhook ignores a notification until its signature matches. A repeated event id is stored once and is not processed again.
4. A payment that is not `COMPLETED` stays `payment_failed` and `not_submitted`.
5. A completed payment whose amount or currency does not match the server price becomes `needs_manual_intervention`. The browser price is never trusted.
6. A completed payment for an unverified cost or an unready print master becomes `blocked_unverified_costs` or `awaiting_owner_approval`. `PRINT_FULFILLMENT_MODE` must be exactly `sandbox-approved` before a sandbox LumaPrints submission is even considered, and the public path still forces the print mapping to stay unready.
7. A refund event is recorded as needing manual intervention. It does not cancel or reorder by itself.

## How to recover a failed order

1. Read the order record and its audit row. Use the fulfillment status above to see which check stopped it.
2. Do not submit the same LumaPrints order again if `lumaprintsOrderNumber` is already stored.
3. Fix the missing cost, master, or signature problem in the configuration. Do not paste a Square token into chat or into a source file.
4. Leave `PRINT_FULFILLMENT_MODE` empty until the owner has approved a sandbox submission for that exact order. A failed public checkout is recovered by inquiry, not by turning the buy path on.

## Deploy and rollback

GitHub Actions workflow `Deploy Cloudflare Pages` publishes an isolated `qa-<sha>` preview from this branch. Production publish is a separate workflow dispatch input and deploys the existing Cloudflare Pages project. Do not change DNS unless that project cannot publish the domain. Keep the previous production deployment id and roll back in Cloudflare Pages if the new deployment is wrong.
