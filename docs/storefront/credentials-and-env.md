# Credentials and environment — photography storefront

Names only. No secret values belong in git, this note, the browser, or a handoff.

Set these on the Cloudflare Pages project `bitter-buffalo-art`, separately for Preview and Production, and in the local shell only when a sandbox test is actually being run. Do not put them in `cloudflare-pages/` source. There is no `.env` file in the website repo, and none was created.

Live payment collection and LumaPrints production fulfillment stay disabled. The code refuses the production hosts. There is no flag that turns those hosts on.

## Square (sandbox only)

| Name | Required for | Notes |
| --- | --- | --- |
| `SQUARE_ENVIRONMENT` | Any Square call | Must be exactly `sandbox`. Any other value throws `square_not_sandbox`. |
| `SQUARE_ACCESS_TOKEN` | Creating a payment link and reading a payment | Use the Square **sandbox** access token. A production token must not be placed here. |
| `SQUARE_LOCATION_ID` | Payment link | Sandbox location id. The link asks the buyer for a shipping address. |
| `SQUARE_API_BASE` | Optional | Default `https://connect.squareupsandbox.com`. Any other origin is refused. |
| `SQUARE_VERSION` | Optional | Default `2026-09-16`, the documented Square-Version used by the client. |
| `SQUARE_WEBHOOK_SIGNATURE_KEY` | `POST /api/prints/square-webhook` | Signature key from the sandbox webhook subscription. |
| `SQUARE_WEBHOOK_NOTIFICATION_URL` | Same webhook | Must be the exact notification URL Square signs. The check is HMAC-SHA256 of that URL plus the raw body, header `x-square-hmacsha256-signature`. |

The payment link host is `https://connect.squareupsandbox.com`. The client does not call `https://connect.squareup.com`.

An unauthenticated probe of `POST /v2/online-checkout/payment-links` returned 401. No sandbox token was available, so no payment link was created.

## LumaPrints (sandbox only)

| Name | Required for | Notes |
| --- | --- | --- |
| `LUMAPRINTS_API_KEY` | Catalog discovery, pricing, image check, and order submit | Sandbox key. |
| `LUMAPRINTS_API_SECRET` | Same | Sandbox secret. Sent only as HTTP Basic `key:secret`. |
| `LUMAPRINTS_API_BASE` | Optional | Default `https://us.api-sandbox.lumaprints.com/api/v1`. The origin `https://us.api.lumaprints.com` throws `production_lumaprints_blocked`. |
| `LUMAPRINTS_STORE_ID` | Order submit | Comes from `GET /stores` after a Standard Store exists in the sandbox account. Do not hardcode an example store id. |
| `LUMAPRINTS_WEBHOOK_USER` | `POST /api/prints/lumaprints-webhook` | Basic-auth user for shipping notifications. If either webhook value is missing, the route returns 503. |
| `LUMAPRINTS_WEBHOOK_PASSWORD` | Same | Basic-auth password. |
| `PRINT_FULFILLMENT_MODE` | Order submit | Leave unset. The only value that may submit is `sandbox-approved`, and that still posts only to the sandbox host. The current Grand Tetons catalog cannot pass the cost, mapping, and master gates, so the public Buy path never reaches submit. |

An unauthenticated `GET https://us.api-sandbox.lumaprints.com/api/v1/stores` returned 401. No order was submitted. Sandbox does not emit shipping lifecycle events; a shipping subscription still needs an HTTPS endpoint that returns 200. That subscription was not created.

## Storage

| Name | Where | Status |
| --- | --- | --- |
| `PRINTS_DB` | Cloudflare D1 binding on the Pages function | Not created. Schema draft: `working/prints/d1-prints.sql`. Webhooks return 503 until this binding exists. Checkout of an unsellable size returns 409 before it needs the database. |
| Print master storage | Intended as a protected bucket, not a public website JPEG | Not wired. `masterReady` is false. The file on disk is `01 - DSC_2626-Edit-no water mark.jpg` (5746×3831). It is not in git and must not be copied into `cloudflare-pages/assets`. |

No `wrangler.toml` was added, so this change does not alter the Pages deploy config.

## What was absent when this was tested

These names were not set in the process environment: `LUMAPRINTS_API_KEY`, `LUMAPRINTS_API_SECRET`, `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `SQUARE_WEBHOOK_SIGNATURE_KEY`, `PRINTS_DB`.

Existing Pages secrets for the contact form and the Cloudflare API token are unrelated. They were not read, rotated, or printed.
