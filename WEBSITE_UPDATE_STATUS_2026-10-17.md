# Verified current state — 2026-10-17, America/Denver

## Outcome
- Independent website repo: https://github.com/bitterbuffaloart/bitter-buffalo-art-website.
- Starting HEAD 53aa53b confirmed locally and remotely. Preserved subsequent remote audit
  commits 0441d15 and b25be63 with a normal merge; no force push or rewritten history.
- Published website commit: e90c8887190dcd7b176afbd93064450cfd761d2a.
- Full automatic publication run SUCCESS:
  https://github.com/bitterbuffaloart/bitter-buffalo-art-website/actions/runs/39094227881.
- That push ran validation, candidate upload, 55-resource and contact checks, working-preview
  publication, and working-preview checks. Every step passed.
- Candidate from that run: https://57214fe3.bitter-buffalo-art.pages.dev/.
- Working production deployment: https://ab4e5847.bitter-buffalo-art.pages.dev/.
- Working preview alias: https://bitter-buffalo-art.pages.dev/.
- GitHub source branch main → Pages production branch named preview. This mapping is
  deliberately preserved; ENABLE_PREVIEW_PUBLISH=true. Candidate verification always precedes publication.
- A separate independent HTTP check of the working alias passed all 55 resources and
  JSON 400 invalid contact input after publication. Text comparisons normalize only
  platform line endings; binary image comparisons remain exact.

## Website and credentials
- Fixed clipped mobile headline without changing approved mountain artwork.
- All 42 existing image files unchanged byte for byte; Final 33 portfolio maintained.
- Existing five event-history entries and two booth photos preserved and rendered.
- All nine deployed pages browser-checked at actual 390 and 1280 pixel widths, with no
  horizontal overflow or broken eager images; mobile menu and keyboard tabs checked.
- Contact failures retain entries and offer an email draft; no Shopify-domain fallback.
  Server validation and mocked delivery checks pass. Production Pages runtime has NO secrets;
  automatic inbox delivery is NOT configured or proven. No real test message sent.
- Etsy shop home verified in Chrome (31 items visible). Every existing purchase CTA uses
  that exact URL. No individual photography listings asserted to be published.
- Account Pages-Edit-only token approved by user, encrypted into repository Actions
  secrets, expires January 15, 2027. No DNS or Workers permission; no OAuth token reused.
- Deployment notes updated to this independent repo; legacy extraction generator must
  not be run over the hand-edited static site. Packaged assets exclude docs/scripts/caches.

## Remaining blockers and next actions
1. Choose/configure owner-approved free email delivery and verify receipt for all three
   form types, or explicitly choose to launch with the tested manual email-draft workflow.
2. Export complete DNS/mail records, including DKIM/CAA; public read-only snapshot confirms
   Shopify A/AAAA/www, Cloudflare nameservers, Google MX and SPF. No DMARC TXT returned.
3. Approve exact domain cutover later. Follow DOMAIN_CUTOVER_CHECKLIST.md, including HTTPS,
   mail preservation, redirect inventory, and rollback. No domain has been attached to Pages.
4. Publish and verify photography Etsy listings separately when ready; portfolio is functional.
5. Rotate Actions deployment token before January 15, 2027.

## Protections
No DNS write, live Shopify theme publish/cancellation, Art Builder or Photo Culler changes,
Lightroom/original-photo access or edits, paid services, or invented artwork/event history.
Shopify remains on the live domain. Older state entries below are historical and superseded.

---
# Latest deployment checkpoint — 2026-10-17, America/Denver

- Controlled push aa4e0e7aefb3b47e3c58aeca8da5962164cbb533 → Actions run
  https://github.com/bitterbuffaloart/bitter-buffalo-art-website/actions/runs/39093752970
  completed SUCCESS. Verification and deploy jobs both passed.
- Isolated deployment: https://e910e249.bitter-buffalo-art.pages.dev/.
- All 55 public resources and invalid contact input passed the deployed smoke check.
- Browser verification of all 9 deployed pages at actual 390 and 1280 pixel widths passed:
  no overflow or broken eager images. Mobile menu open/Escape behavior passed.
- ENABLE_PREVIEW_PUBLISH now true following successful candidate verification. Next push
  will verify a fresh isolated candidate before updating the working pages.dev alias.
- Working-preview publication is IN PROGRESS until its own Actions run and HTTP check pass.
- Contact provider delivery is still unconfigured/unproven. Email-draft fallback works;
  no test email was sent. Contact receipt remains a cutover gate.
- Original cf69ac66 deployment retained for rollback. No DNS, Shopify, Art Builder,
  Photo Culler, Lightroom, original-photo, or paid-service changes.

---
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

## Controlled push checkpoint
- Pushed merge commit 0ed86b50ec4aaefde9a9e75504857a9ad89c373e, preserving remote audit
  commits 0441d15 and b25be63. No history overwritten.
- Actions run 39092650707 passed source validation, mock contact tests, packaging,
  credential checks, and actual Pages upload. Candidate: https://ba725c9f.bitter-buffalo-art.pages.dev/.
- Its final smoke check blocked publication: Python's default User-Agent received Cloudflare
  403/1010 on the invalid contact request. Static assets all passed in CI.
- Fixed the smoke request to use the same explicit QA User-Agent as asset requests.
  Independent recheck: all 55 public resources pass; contact invalid-input returns JSON 400.
- Added text line-ending normalization for independent Windows-vs-Linux comparisons.
  Binary image checks remain exact. This does not loosen content checks or suppress errors.
- Working preview stayed on cf69ac66; no production update was attempted.
- Etsy shop opened successfully in authenticated Chrome, showing BitterBuffaloArt and 31 items.
  Every existing website shopping link resolves to this exact shop URL. No unverified listing
  links were added, and the 33 portfolio photographs are still not asserted to be listed.

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
