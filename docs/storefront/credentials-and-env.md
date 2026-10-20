# Credentials and environment

Names only. No values are stored in git. None of these names were set in the process, user, or machine environment on 2026-10-19. There is no `.env` or `.dev.vars` in the website repo.

Local file: copy `.env.example` to `.env` in `C:\Users\bitte\bitter-buffalo-website-etsy-update-2026-10-17`. `.env` is gitignored. Windows user environment is the other local place. Do not put values in chat, logs, or these reports.

Cloudflare Pages project: `bitter-buffalo-art`. Set secrets on Preview and Production separately, and only after Clyde approves that environment. Sandbox hosts stay sandbox. There is no flag that allows `https://us.api.lumaprints.com` or `https://connect.squareup.com`.

| Name | Where | Purpose |
| --- | --- | --- |
| `SQUARE_ENVIRONMENT` | Local `.env` and Pages | Must be exactly `sandbox`. |
| `SQUARE_ACCESS_TOKEN` | Same | Square sandbox access token. |
| `SQUARE_LOCATION_ID` | Same | Sandbox location. |
| `SQUARE_API_BASE` | Optional | Default `https://connect.squareupsandbox.com`. |
| `SQUARE_VERSION` | Optional | Default `2026-09-16`. |
| `SQUARE_WEBHOOK_SIGNATURE_KEY` | Same | Sandbox webhook signature key. |
| `SQUARE_WEBHOOK_NOTIFICATION_URL` | Same | Exact URL Square signs. |
| `LUMAPRINTS_API_KEY` | Same | Sandbox API key. |
| `LUMAPRINTS_API_SECRET` | Same | Sandbox API secret. |
| `LUMAPRINTS_ENVIRONMENT` | Same | Empty until Clyde names the sandbox or production host. |
| `LUMAPRINTS_ADMIN_TOKEN` | Same | Empty until a replacement admin token exists. |
| `LUMAPRINTS_API_BASE` | Optional | Default `https://us.api-sandbox.lumaprints.com/api/v1`. |
| `LUMAPRINTS_STORE_ID` | Same | From sandbox `GET /stores` after a Standard Store exists. |
| `LUMAPRINTS_WEBHOOK_USER` | Same | Basic auth user for the shipping webhook. |
| `LUMAPRINTS_WEBHOOK_PASSWORD` | Same | Basic auth password. |
| `PRINT_FULFILLMENT_MODE` | Same | Leave empty. `sandbox-approved` is the only submit mode, and it still cannot pass the current cost gate. |
| `PRINT_MASTER_URL_SECRET` | Same | HMAC secret for a fulfillment URL that expires within 15 minutes. |
| `PRINTS_DB` | Pages D1 binding | Not a shell variable. Database not created. |
| `PRINT_MASTERS` | Pages R2 binding | Not a shell variable. Private bucket not created. |

Cloudflare CLI on this machine: `npx wrangler whoami` returned not logged in. The saved token could not be refreshed, and the session is non-interactive. `CLOUDFLARE_API_TOKEN` is unset. D1 and R2 were not created.

Missing remote steps, not run:

1. `npx wrangler login` in an interactive terminal, or set `CLOUDFLARE_API_TOKEN` with D1 and R2 edit permission for account `f3ee68d66369fd4b2bc390d1dae218f6`.
2. Create D1 database `bitter-buffalo-prints`, apply `working/prints/d1-prints.sql`, and bind it as `PRINTS_DB`.
3. Create private R2 bucket `bitter-buffalo-print-masters` and bind it as `PRINT_MASTERS`.
4. Upload the local master to object key `bb-photo-01-dsc-2626`. The file is on disk and is not in git.

The current GitHub deploy does not read `working/prints/pages-bindings.example.toml`. Do not add a `wrangler.toml` with an empty database id to the Pages deploy.
