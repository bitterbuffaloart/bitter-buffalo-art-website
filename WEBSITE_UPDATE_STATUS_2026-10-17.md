# Bitter Buffalo Art website update — status
Date: 2026-10-17 (America/Denver) — **permanent migration in progress (preview live)**  
**NEXT_ACTION:** see `NEXT_ACTION.md` in this folder.  
**Master handoff:** Art Builder `project-record/BITTER_BUFFALO_MASTER_HANDOFF_2026-10-17.md`

## Live environment

| Item | Value |
|------|-------|
| Production domain | https://bitterbuffaloart.com (**still Shopify** — DNS unchanged) |
| Cloudflare Pages alias | https://bitter-buffalo-art.pages.dev/ |
| Latest production deploy | https://cf69ac66.bitter-buffalo-art.pages.dev (`preview` branch, Direct Upload) |
| Also available | https://main.bitter-buffalo-art.pages.dev / https://484a3aaf.bitter-buffalo-art.pages.dev |
| Pages project | `bitter-buffalo-art` |
| Account | `f3ee68d66369fd4b2bc390d1dae218f6` |
| Etsy (verified shop home) | https://www.etsy.com/shop/BitterBuffaloArt |
| Website GitHub | https://github.com/bitterbuffaloart/bitter-buffalo-art-website |
| Latest Git commit | `c6918e0` on `main` |
| Art Builder GitHub | https://github.com/bitterbuffaloart/BitterBuffaloArt (**do not overwrite**) |

## Architecture
- Cloudflare Pages = permanent public website hosting (Direct Upload today)  
- GitHub `bitter-buffalo-art-website` = website source of truth  
- Auto-deploy path A: GitHub Actions → Wrangler Direct Upload (workflow committed; needs repo secrets)  
- Auto-deploy path B: Native Pages↔Git (blocked until Cloudflare GitHub App is installed on org + project converted/connected in dashboard)  
- Etsy = merchandise, payments, checkout  
- No Shopify cart on the static site  

## Completed this session
1. Confirmed independent repo `bitterbuffaloart/bitter-buffalo-art-website` (empty → pushed website history).  
2. Pushed commits `8a103bc` + `c6918e0` (events booth photos, hero legibility, contact `/api/contact` fallback, Actions workflow, verify script).  
3. Redeployed complete site to Pages production alias (`cf69ac66`, branch `preview`).  
4. HTTP verify: all key routes **200**; Events booth images live; Final 33 portfolio refs present; Etsy shop-home links on pages.  
5. Contact / custom / laser forms complete with Pages Function + Shopify browser fallback.  
6. DNS / Shopify / Art Builder / Photo Culler / Lightroom untouched.

## Verified URLs (2026-10-17 evening)
| URL | Result |
|-----|--------|
| https://bitter-buffalo-art.pages.dev/ | 200, hero panel, Etsy |
| https://bitter-buffalo-art.pages.dev/events/ | 200, booth-market + booth-tiedye |
| https://bitter-buffalo-art.pages.dev/contact/ | 200, intake forms |
| https://bitter-buffalo-art.pages.dev/photography/ | 200, Final 33 |
| https://bitter-buffalo-art.pages.dev/shop/ | 200 |
| https://bitter-buffalo-art.pages.dev/assets/images/portfolio/02.jpg | 200 |
| https://www.etsy.com/shop/BitterBuffaloArt | bot GET 403 — shop home still the only linked URL (owner-known) |

## Remaining blockers
1. **GitHub Actions secrets** (owner, free): add `CLOUDFLARE_API_TOKEN` (Pages Edit) + `CLOUDFLARE_ACCOUNT_ID`=`f3ee68d66369fd4b2bc390d1dae218f6` so push→deploy works.  
2. **Optional native Git connect:** Cloudflare dashboard → Workers & Pages → install “Cloudflare Workers and Pages” app on org `bitterbuffaloart` → grant `bitter-buffalo-art-website`. Note: existing project is Direct Upload; connecting Git may require a new Pages project or dashboard-managed conversion — do not guess.  
3. Switch Pages `production_branch` from `preview` → `main` in dashboard when ready (API patch returned auth error from MCP).  
4. Individual Etsy listing URLs (bot 403) before deep-linking.  
5. MX/SPF/DKIM inventory + owner DNS cutover approval (`DOMAIN_CUTOVER_CHECKLIST.md`).  
6. Optional Resend secrets for Cloudflare-native contact email (no paid plan purchased by agent).  
7. Do not cancel Shopify until cutover verified.

## Protections honored
No DNS change · no Shopify cancel/theme publish · Art Builder repo not overwritten · Photo Culler/Lightroom untouched · no invented Etsy listing URLs · no paid subscriptions created

## Independent verification addendum — 2026-10-17 evening

- Verified GitHub repository ownership and `main` HEAD `53aa53b` through the connected GitHub account.
- **GitHub Actions deployment is FAILED, not green.** Workflow run [39090256715](https://github.com/bitterbuffaloart/bitter-buffalo-art-website/actions/runs/39090256715) failed in Wrangler with missing `CLOUDFLARE_API_TOKEN`. Checkout, Node setup, and static root verification passed. A later successful run has not been evidenced.
- Inspected `cloudflare-pages/functions/api/contact.js` and `cloudflare-pages/assets/js/site.js`. Without Cloudflare-native email credentials, the Function returns 503 and the browser submits to Shopify. Thus delivery from the site after a DNS migration **is NOT VERIFIED and blocks cutover**. All three form types must pass a real recipient-delivery test before the domain switch.
- The existing Pages deployment and new-route HTTP 200 evidence are reported in this status from the local worker. This independent GitHub audit did not create a new Cloudflare deployment or independently execute the published URLs (Pages host inaccessible through its external fetch environment).
- No source code, DNS, Shopify themes, original photographs, Art Builder, Photo Culler, or Lightroom were modified by this audit.

