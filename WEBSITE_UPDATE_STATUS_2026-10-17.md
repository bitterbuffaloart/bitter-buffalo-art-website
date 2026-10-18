# Current checkpoint — 2026-10-17, America/Denver

## Objective and boundaries
Continue the existing permanent website migration before October 21, 2026.
Independent repository: bitterbuffaloart/bitter-buffalo-art-website on main.
Confirmed starting local AND remote HEAD: 53aa53be9e17e7d51ae6d59ab56a148ac5cbd971.
Do not modify Art Builder, Photo Culler, live Shopify, DNS, Lightroom, or originals.
No paid service was purchased or subscribed to.

## Completed verification and fixes
- Working preview baseline: all 55 public pages/assets returned 200 and matched local SHA-256.
- Nine HTML pages pass local-link/fragment, title, description, viewport, canonical, active-nav,
  image-alt, Final 33 uniqueness, Events restoration, and Etsy URL checks.
- All nine pages checked in Chrome at 390 and 1280 widths: no horizontal overflow or broken eager images.
- Corrected confirmed mobile hero clipping using layout only; mountain artwork is unchanged.
- All 42 website image files remain byte-for-byte identical to starting source.
- Corrected intrinsic image dimensions from existing web derivatives; portfolio uses contain,
  preserving complete photographs rather than cropping them within cards.
- Contact failures retain entries, offer a user-triggered email draft, and never silently
  submit to Shopify. Required commission/laser consent, quantity, payload and email checks
  run server-side; consent details are retained in delivery text. Duplicate sends disabled.
- Mock contact tests pass; no real email sent and owner receipt is NOT proven.
- Contact tabs support arrow/Home/End keys; mobile menu supports Escape.
- Events keeps existing five appearances and two recovered booth photos; no new history invented.
- Website copy no longer exposes restoration implementation details.
- Deployment staging excludes maintenance documents, local scripts, and caches.
- Pages Functions build compiled successfully with Wrangler 4.151.1.

## Credential/deployment investigation
- Prior Actions run 39090256715 failed because CLOUDFLARE_API_TOKEN was absent.
- Repository admin access confirmed through existing GitHub authentication.
- Initially no repository Actions secrets or variables existed.
- User explicitly approved a 90-day token: account Cloudflare Pages Edit only, no DNS/Workers.
- Created “Bitter Buffalo website GitHub Actions (Pages only)”, expiry January 15, 2027.
- Encrypted token in memory using the repository public key; plaintext not saved or logged.
- CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID now configured as repository secrets.
- Existing local Wrangler OAuth is broad; it was NOT copied into GitHub Actions.
- Current Pages working production deployment remains cf69ac66 on branch named preview.
- New workflow: verify → isolated qa-<commit> deploy → complete HTTP comparison and invalid-input
  API check → optional working-preview publish gated by ENABLE_PREVIEW_PUBLISH=true.
- Gate initially unset; controlled push cannot update the existing working preview.
- Actions end-to-end verification is IN PROGRESS. Do not infer success from secret setup.
- Native Direct Upload → Git integration conversion is unsupported in place. Use Actions;
  do not create a replacement project or change production branch as a routine fix.

## Remaining cutover gates
1. Prove the new Actions run and isolated deployment, then browser-check candidate.
2. Configure owner-approved standalone email delivery on a free allowance and prove receipt,
   or explicitly accept the email-draft workflow. No new email service account created.
3. Verify shop-home availability in browser; individual listing links remain unpublished.
4. Export live DNS and mail records; approve exact web-only cutover and rollback later.
5. Keep Shopify available; no cancellation authorized.

## Next actions
Run controlled push on main with publication gate off; capture run and candidate URL.
Update this checkpoint with actual outcomes. See cloudflare-pages/DEPLOY.md.

---
## Earlier handoff (historical; superseded where contradicted above)

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

