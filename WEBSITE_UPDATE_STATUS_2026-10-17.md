# Bitter Buffalo Art website update — status
Date: 2026-10-17 (America/Denver) — **permanent migration in progress (preview live)**  
**NEXT_ACTION:** see `NEXT_ACTION.md` in this folder.  
**Master handoff:** Art Builder `project-record/BITTER_BUFFALO_MASTER_HANDOFF_2026-10-17.md`

## Live environment

| Item | Value |
|------|-------|
| Production domain | https://bitterbuffaloart.com (**still Shopify** — DNS unchanged) |
| Cloudflare Pages alias | https://bitter-buffalo-art.pages.dev/ |
| Pages project | `bitter-buffalo-art` |
| Account | `f3ee68d66369fd4b2bc390d1dae218f6` |
| Etsy (verified shop home) | https://www.etsy.com/shop/BitterBuffaloArt |
| PREVIEW2 Shopify theme | `157462167719` unpublished |
| Local source | `C:\Users\bitte\bitter-buffalo-website-etsy-update-2026-10-17\` |
| Website GitHub | https://github.com/bitterbuffaloart/bitter-buffalo-art-website |
| Art Builder GitHub | https://github.com/bitterbuffaloart/BitterBuffaloArt (**do not overwrite**) |

## Architecture (owner decision 2026-10-17 evening)
- Cloudflare Pages = permanent public website hosting  
- GitHub `bitter-buffalo-art-website` = website source of truth + auto deploy  
- Etsy = merchandise, payments, checkout  
- No Shopify cart/checkout on the static site  
- No new recurring host beyond Cloudflare (already in use)

## Completed
1. Recovered Phase 3 static site (branding, Laser Art, Events, Groundbuilder/giveaway removed).  
2. Final 33 photography portfolio; **#02 Maroon Bells Reflection** featured first.  
3. Print-format copy + collector rule (**66** signed prints per photograph).  
4. Etsy CTAs use verified **shop home** only (`working/etsy-verified-links.json`).  
5. `/shop/` trailhead → Photography / Tie-Dye / Laser → Etsy.  
6. `sitemap.xml` + `robots.txt`; Shopify path redirects.  
7. Events gallery restored with booth photographs (Shopify CDN recovery — not Lightroom).  
8. Hero headline panel + gradient for mountain artwork legibility.  
9. Contact / custom / laser intake forms with `/api/contact` → Shopify fallback.  
10. Independent GitHub repo created (empty → first website push this session).  
11. Photo Culler / Art Builder / Lightroom untouched. DNS unchanged.

## Remaining blockers
1. Cloudflare Pages **Git Provider** connection (needs Cloudflare GitHub App install on org `bitterbuffaloart` if API connect fails).  
2. Individual Etsy listing URLs (bot 403) before deep-linking products.  
3. Publish photography listings on Etsy before “Buy print” CTAs.  
4. MX/SPF/DKIM inventory before DNS cutover.  
5. Owner acceptance + explicit DNS cutover approval.  
6. Optional: Pages secrets `RESEND_API_KEY` + `CONTACT_TO_EMAIL` for Cloudflare-native email (no paid plan purchased by agent).  
7. Do not cancel Shopify until site live + data retained.

## Protections honored
No DNS/nameserver change · no Shopify cancel · PREVIEW2 unpublished · Art Builder repo not overwritten · Photo Culler not stopped · no invented Etsy product URLs · no payment cart on site · no paid subscriptions created by agent
