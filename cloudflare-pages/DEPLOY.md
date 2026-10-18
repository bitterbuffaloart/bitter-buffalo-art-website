# Cloudflare Pages deployment — Bitter Buffalo Art

## What this is
Independent static website (no Shopify checkout, cart, or Liquid runtime).
Commerce CTAs open `https://www.etsy.com/shop/BitterBuffaloArt`.

## Source directory
Deploy **only** `cloudflare-pages/` (must contain `index.html` + `assets/`).

## GitHub (source of truth)
Repository: https://github.com/bitterbuffaloart/bitter-buffalo-art-website  
(Do **not** use `bitterbuffaloart/BitterBuffaloArt` — that is Art Builder.)

Cloudflare Pages Git settings (when connected):
- Production branch: `main`
- Root directory: `cloudflare-pages`
- Build command: *(empty — commit built static files)*
- Output directory: *(empty / `/`)*

## Preview deploy (no DNS change)
```bat
cd path\to\cloudflare-pages
deploy-preview.cmd
```

Or:
```powershell
$env:CLOUDFLARE_ACCOUNT_ID='f3ee68d66369fd4b2bc390d1dae218f6'
npx wrangler pages deploy . --project-name=bitter-buffalo-art --branch=main --commit-dirty=true
```

Project: `bitter-buffalo-art`  
Preview: https://bitter-buffalo-art.pages.dev/

## Production cutover (OWNER APPROVAL REQUIRED)
1. Confirm pages.dev preview on desktop + mobile.
2. Cloudflare Pages → Custom domains → add `bitterbuffaloart.com` and `www`.
3. Update DNS from Shopify A/CNAME to Pages targets.
4. Keep Shopify online until verified; do not cancel Shopify in the same step.
5. Do **not** delete existing Cloudflare Workers.

## Rollback
- DNS: apex A `23.227.38.65` / Shopify AAAA; `www` CNAME `shops.myshopify.com` (proxied: false).
- Shopify MAIN theme `155995406503` remains live until DNS moves.
- PREVIEW2 theme `157462167719` remains unpublished.
