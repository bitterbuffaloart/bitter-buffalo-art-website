# Domain cutover checklist — bitterbuffaloart.com
**Status:** PREPARED ONLY — do not execute until owner acceptance + explicit approval.  
**Deadline context:** permanent migration before 2026-10-21.

## Current production (leave alone until go)

| Item | Value |
|------|--------|
| Public site | https://bitterbuffaloart.com (Shopify) |
| Shopify theme MAIN | `155995406503` (keep until cutover verified) |
| Shopify PREVIEW2 | `157462167719` unpublished — do not publish |
| Cloudflare Pages preview | https://bitter-buffalo-art.pages.dev/ |
| Pages project | `bitter-buffalo-art` · account `f3ee68d66369fd4b2bc390d1dae218f6` |
| Custom domain on Pages | **none yet** |

## DNS inventory (rollback targets)

Documented from prior migration notes — **re-verify in registrar + Shopify admin before cutover**:

| Record | Host | Target / value | Notes |
|--------|------|----------------|-------|
| A | `@` | `23.227.38.65` | Shopify apex |
| AAAA | `@` | Shopify IPv6 (confirm live) | Keep for rollback |
| CNAME | `www` | `shops.myshopify.com` | Proxy off if copied to CF |
| MX / SPF / DKIM / DMARC | email | **MUST preserve** | Inventory from current DNS before any NS change |
| TXT | misc | verify | Include domain verification records |

**Do not change nameservers, MX, or email authentication records as part of the website cutover** unless email is confirmed to stay intact.

## Prepared Pages custom-domain steps (after acceptance)

1. Cloudflare Dashboard → Pages → `bitter-buffalo-art` → Custom domains.  
2. Add `bitterbuffaloart.com` and `www.bitterbuffaloart.com`.  
3. Follow Cloudflare’s DNS instructions for the zone that hosts the domain (likely already on Cloudflare).  
4. Keep Shopify store online; only point web A/CNAME for the marketing site.  
5. Verify HTTPS certificates issue.  
6. Spot-check Home, Photography, Shop, Contact, Etsy outbound links.  
7. Only then consider Shopify theme/plan changes — **do not cancel Shopify** until exports retained.

## Rollback

1. Restore apex A to Shopify `23.227.38.65` (and prior AAAA).  
2. Restore `www` CNAME to `shops.myshopify.com`.  
3. Remove or disable Pages custom domain if needed.  
4. Shopify MAIN theme remains the fallback storefront.  
5. Pages preview at `bitter-buffalo-art.pages.dev` stays available for debugging.

## Shopify data retention before cancel

- Orders, customers, gift cards, domain settings, theme ZIP export  
- Product CSVs / media if still needed for Etsy  
- Do **not** cancel Shopify in the same step as DNS cutover
