# Maintain the website

One catalog, one portfolio manifest, and one pricing master. Do not start a second site.

## Authoritative files

These are the only files to edit for the public homepage, Sketchbook, and catalog. Do not delete older assets that are no longer linked.

| Surface | Authoritative file | Published by |
| --- | --- | --- |
| Homepage | `cloudflare-pages/index.html` | that file itself |
| Header and footer | `working/site/shared_chrome.py` | `python working/site/shared_chrome.py` stamps every public page |
| Sketchbook | `cloudflare-pages/sketchbook/index.html` and `cloudflare-pages/assets/sketchbook/works.json` | those files |
| Catalog | `working/portfolio/photography-manifest.json` | `working/catalog/build-catalog.py` writes `cloudflare-pages/assets/data/catalog.json` |

`working/build-static-site.js` is the whole-site generator. It is a second writer: it rebuilds `cloudflare-pages/index.html` and an older header from strings inside that file. That is why a page can serve different navigation or homepage HTML from the rest of the site. Do not run it. The public header is the eight links in `working/site/shared_chrome.py`, in this order: Home, Shop, Tie-Dye, Photography, Sketchbook, Custom Art, Events, About. Laser Art stays on the homepage, the shop, and the footer. Contact stays in the footer and on the contact page. `working/test-site-chrome.mjs` fails when that order differs or a local asset path is missing. `working/portfolio/build-final-44.py` still expects 50 photographs and would rewrite the manifest. Do not run it over the current manifest.

The western page disappeared because the parchment, sandstone, topographic, buffalo-skull, and tumbleweed treatments, and the footer landscape, were committed on `5bc6785`, `9f2f142`, and `8bef79d`. That work is not an ancestor of the price-publish commit. The live CSS then painted the page with flat `--paper` and no longer pointed at the SVG files, so the deployed homepage had nothing to show. There is one homepage file. The generator is a second writer, and running it would remove the restored page again.

The homepage has four collection cards: Photography, Tie-Dye, Laser Art, and Sketchbook. Custom Art, Events, and About are in the header. Contact stays in the footer and on its own page. They are not homepage cards. The heading “Art Born in the High Country” stays on the homepage.

## Photographs

Titles and stories live in `working/portfolio/photography-manifest.json`. Permanent IDs stay stable. Position 14 is the bison calf, `bb-photo-45`. The horse file remains archived as `bb-photo-14` and must not be deleted. The displayed count is 53. Photographs 51–53 are `bb-photo-52`, `bb-photo-53`, and `bb-photo-54`. Their files are 2048-pixel web derivatives, not print masters, and they publish no price. Four frequency-separated files stay unpublished in `working/photography-staging/frequency-separated/`.

After a photograph change, edit the manifest, then from the repository root:

```
python working/catalog/build-catalog.py
python working/prints/build-print-inquiry.py
python working/site/shared_chrome.py
node --test working/test-print-inquiry.mjs working/test-print-storefront.mjs working/catalog/test-import.mjs working/test-contact.mjs working/test-site-chrome.mjs
python working/qa-site.py cloudflare-pages
```

The six print products have authorized starting selling prices in `working/prints/build-print-inquiry.py` and in `working/pricing/pricing-master.json`. Do not delete those rows. The public selectors offer only premium framed canvas, aluminum metal, and archival matte, at 12×18, 16×24, and 20×30, when the file is within 0.5 percent of 3:2 and meets the PPI minimum: canvas 200, metal and paper 300. Stretched canvas, semi-gloss, and Somerset Velvet stay in the pricing record and are not sale options. The catalog and price files do not name a separate five- or six-subject initial sale set. Do not invent one. The only named selected sale configuration in `docs/storefront/` is Grand Tetons 16×24 premium framed canvas at $199.33. Omit a size that would crop the photograph. Disable a size below the PPI minimum and say why. Photographs 34, 40, 46, and 49 stay gallery and inquiry only because they have no verified print master. Photographs 51–53 are web derivatives and publish no price. Do not block the other photographs for those four. #10 stays 16:9 with no invented price. Acrylic stays off. A print inquiry form is not a purchase link. Buy stays off until Square authenticates.

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

The production settings in `.env` are intentional. One read-only production GET /v2/locations on 2026-10-20 returned HTTP 401 AUTHENTICATION_ERROR / UNAUTHORIZED. That result stands. Do not call Square again, and do not paste a token into chat. Checkout stays off.

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

## OneDrive photographs and the catalog

The existing OneDrive folder is `C:\Users\bitte\OneDrive\Desktop\Portfolio for Etsy`. Do not create a second folder with that name. `Final_33_Manifest.csv` in that folder is the 33-photograph manifest. It is not the 33-piece tie-dye portfolio.

The permanent-ID catalog is `working/portfolio/photo-catalog.json`. It is keyed by `bb-photo-NN` and records the title, story, paths, pixels, aspect, format, print eligibility, publication, sale eligibility, Square status, and LumaPrints status. The public price rows stay in `working/pricing/pricing-master.json`. The 176 Square rows stay in `cloudflare-pages/assets/data/square-payment-links.json` with empty URLs until a real payment link is verified. A file copied into the OneDrive folder is a local copy. OneDrive running, or a file that can be read on this computer, does not prove the file has finished uploading.

## How to add a photograph

1. Put the finished master in `C:\Users\bitte\OneDrive\Desktop\Portfolio for Etsy` only when that destination file is absent. If the same name exists and the hash differs, keep both files under different names. Do not overwrite it, and do not delete the original.
2. Add one object to `working/portfolio/photography-manifest.json` with a new permanent ID. Do not renumber `bb-photo-01` through `bb-photo-54`. The archived horse remains `bb-photo-14`.
3. Run `python working/catalog/build-catalog.py`, then `python working/prints/build-print-inquiry.py`, then `python working/site/shared_chrome.py`.
4. Do not run `working/build-static-site.js` or `working/portfolio/build-final-44.py`.

## How to add or change a story

Edit the `story` field for that permanent ID in `working/portfolio/photography-manifest.json`. Then run `python working/catalog/build-catalog.py`. Do not change the photograph file, the price, or the Square URL as part of a story edit.

## How to add a price

A public price is allowed only for premium framed canvas (`canvas-floating-15`), aluminum metal (`metal-aluminum`), and archival paper (`paper-archival`), and only at 12×18, 16×24, or 20×30 when that file is already within 0.5 percent of 3:2 and meets the PPI minimum. Record it in `working/pricing/pricing-master.json` and the print-page builder. Do not invent a price. Do not price the 2048-pixel photographs `bb-photo-52`, `bb-photo-53`, and `bb-photo-54`. Leave the Square `url` null. Do not add a Buy button.

## How to add an Etsy link

Photography is not listed on Etsy from this site. A garment link belongs on `cloudflare-pages/tie-dye/index.html` only when the live listing page was opened and the photo, title, size, material, price, and listing URL were read from that page. Use the listing URL, not the shop home, as the buy link. Do not guess a size. The Wildfire Bramble and Midnight Bramble sizes stay as they were published.

## How to add an event

Add a card to `cloudflare-pages/events/index.html` only with a flyer file that is already on disk. Keep the flyer’s width and height. A past date is labeled “Past appearance.” Do not publish TreeTop or Wildoria attendance without a flyer and acceptance correspondence. An application that says it does not guarantee a space is not attendance.

## Deploy and rollback

GitHub Actions workflow `.github/workflows/deploy-pages.yml` publishes this branch. Production is a workflow dispatch with `publish_production` set to true. It deploys the existing Cloudflare Pages project `bitter-buffalo-art`. The `deploy` job on this branch stays skipped. Do not change DNS.

The rollback deployment is `dc5467d7-b576-4496-b6fa-44c71acedd4d`, at `https://dc5467d7.bitter-buffalo-art.pages.dev/`. Roll back in Cloudflare Pages to that deployment if a new production publish is wrong. Do not delete the newer deployment until the rollback URL has been opened and returns HTTP 200.

Do not put tokens, location ids, or API secrets in this file, in a page, or in a commit.
