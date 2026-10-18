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
