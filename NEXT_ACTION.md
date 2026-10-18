# Next action — 2026-10-17

Read the current top section of WEBSITE_UPDATE_STATUS_2026-10-17.md.
Credentials are now configured. Do not recreate tokens or copy broad OAuth to Actions.
Validate the controlled Actions candidate deployment before enabling ENABLE_PREVIEW_PUBLISH.
Existing production branch is preview; main is the GitHub source branch.
Contact delivery remains a separate cutover gate; no real owner receipt is yet proven.
Only work in the independent website repository. Never touch DNS/Shopify/originals.

---
## Previous remote handoff, retained as history (superseded above)

# Website migration — next action
Updated: 2026-10-17 (America/Denver)

## Owner (5–10 minutes) — unlock auto-deploy
1. GitHub → `bitterbuffaloart/bitter-buffalo-art-website` → Settings → Secrets and variables → Actions  
   - `CLOUDFLARE_API_TOKEN` = API token with **Account → Cloudflare Pages → Edit**  
   - `CLOUDFLARE_ACCOUNT_ID` = `f3ee68d66369fd4b2bc390d1dae218f6`  
2. Actions → **Deploy Cloudflare Pages** → Run workflow (or push a tiny change).  
3. Confirm a new successful deploy and https://bitter-buffalo-art.pages.dev/ updates.  

## Optional (dashboard)
- Install Cloudflare Workers & Pages GitHub App on org `bitterbuffaloart` for native Git builds.  
- When ready, set production branch to `main` (today production_branch is still `preview`).  

## Before Oct 21, 2026
- Phone QA: nav, Events gallery, Contact tabs, Photography Final 33.  
- Follow `DOMAIN_CUTOVER_CHECKLIST.md` only after explicit DNS approval.  

## Do not
- Touch `bitterbuffaloart/BitterBuffaloArt`.  
- Change `bitterbuffaloart.com` DNS.  
- Publish Shopify theme or cancel Shopify.

## Independent GitHub QA — 2026-10-17 evening

**Automatic deploy is BLOCKED (verified):** GitHub Actions run [39090256715](https://github.com/bitterbuffaloart/bitter-buffalo-art-website/actions/runs/39090256715) checked out the repo and verified `cloudflare-pages/index.html`, then failed in `cloudflare/wrangler-action@v3`. Wrangler explicitly reported missing `CLOUDFLARE_API_TOKEN` in its non-interactive environment. Configure `CLOUDFLARE_API_TOKEN` in **this website repo's** Actions secrets; also configure `CLOUDFLARE_ACCOUNT_ID` as documented above. Never commit or paste the token into source or chat. Re-run Actions, and only mark GitHub push-to-Cloudflare deployment VERIFIED after a successful run and a new published preview is independently checked.

**Contact delivery is a cutover blocker (source verified, delivery NOT TESTED):** `cloudflare-pages/functions/api/contact.js` currently returns HTTP 503 unless `RESEND_API_KEY` is configured. `cloudflare-pages/assets/js/site.js` then falls back to a browser POST at `https://bitterbuffaloart.com/contact`, which currently relies on Shopify. Once the domain moves to Cloudflare that fallback cannot be assumed to deliver. Configure a verified Cloudflare-native message delivery method, conduct a real owner-approved test of all three form types, and verify the messages arrive before moving DNS. If a Pages Function test fails, preserve a clearly visible email contact route rather than implying successful delivery.

**Production cutover remains UNAUTHORIZED.** Do not alter live Shopify, Cloudflare custom-domain DNS, Art Builder, Photo Culler, or Lightroom. The existing Pages Direct Upload deployment can remain as-is until auto-deploy and contact delivery are proven.

