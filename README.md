# Bitter Buffalo Art — Public Website

Independent Cloudflare Pages website for **Bitter Buffalo Art**.  
This is **not** the Art Builder application (`bitterbuffaloart/BitterBuffaloArt`).

| Item | Value |
|------|--------|
| Preview | https://bitter-buffalo-art.pages.dev/ |
| Pages project | `bitter-buffalo-art` |
| Etsy shop | https://www.etsy.com/shop/BitterBuffaloArt |
| Deployable directory | `cloudflare-pages/` |

## Develop
```bat
node working\build-static-site.js
cd cloudflare-pages
deploy-preview.cmd
```

Or push to `main` after Cloudflare Git is connected (root directory = `cloudflare-pages`).

## Rules
- No Shopify cart/checkout on this site — shop on Etsy.
- Do not invent Etsy listing URLs.
- Do not change production DNS without owner approval.
- Do not merge this repo into Art Builder.
