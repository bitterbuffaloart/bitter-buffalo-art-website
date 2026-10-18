# Website migration — next action
Updated: 2026-10-17 (America/Denver)

## Immediate (this session / next agent)
1. Confirm GitHub push to `bitterbuffaloart/bitter-buffalo-art-website` succeeded.  
2. Connect Cloudflare Pages project `bitter-buffalo-art` → that repo  
   - Production branch: `main`  
   - Root directory: `cloudflare-pages`  
   - Empty build command (deploy committed static output)  
3. Push a tiny docs-only commit and verify a **github**-triggered deployment appears.  
4. Spot-check https://bitter-buffalo-art.pages.dev/ desktop + phone.  

## Before Oct 21, 2026
- Owner visual QA on Events, Contact, Photography (Final 33).  
- Confirm Etsy listing URLs in a logged-in browser when ready.  
- Follow `DOMAIN_CUTOVER_CHECKLIST.md` only after owner approval (DNS still blocked).  

## Do not
- Touch `bitterbuffaloart/BitterBuffaloArt` (Art Builder).  
- Change `bitterbuffaloart.com` DNS.  
- Publish Shopify theme or cancel Shopify.  
- Open Lightroom / Photo Culler for website assets.
