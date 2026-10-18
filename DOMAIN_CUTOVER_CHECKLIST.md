# Bitter Buffalo production cutover plan

Prepared October 17, 2026, America/Denver. **Not executed; explicit DNS approval still required.**

The permanent website remains in `bitterbuffaloart/bitter-buffalo-art-website`, separate
from Art Builder and Photo Culler. GitHub Actions deploys through the existing Pages
project `bitter-buffalo-art`. No new hosting project or paid subscription is needed.

## Continuation checkpoint — October 17, 2026

- Reconfirmed via service APIs: Actions run `39095427361` SUCCESS for `958d728`;
  documentation HEAD `505c6a1`; canonical Pages deployment
  `d5b50282-1c7f-4df6-9d7a-ed1031020d32`.
- Current deployment URL: https://d5b50282.bitter-buffalo-art.pages.dev/.
  Retain this as the current rollback candidate, subject to reconfirmation immediately
  before cutover. The older `cf69ac66` deployment below is historical only.
- Pages API still lists only `bitter-buffalo-art.pages.dev`; neither custom domain is attached.
- Automatic contact delivery remains unconfigured. The signed-in Resend account has
  no verified domains or keys. Its test sender can only target the account inbox;
  this is not proof of permanent contact readiness. Domain sender verification must
  not be bundled into this task's forbidden DNS changes.
- Before any approved switch, record TTL, proxy state, all record values, active redirect/
  origin rules, DNSSEC state, and the exact rollback procedure. Exporting DNS records
  alone does not capture every Cloudflare routing setting.
- Recheck CAA compatibility with Pages certificate issuance. If changes are needed,
  present exact changes for approval; do not remove CAA or weaken policy automatically.
- Treat `/products/*` and any additional indexed Shopify URLs as an outstanding
  inventory item; existing collection redirects do not cover individual product URLs.
- If launching with the fallback instead, test email-draft contents for all three forms
  and explicitly accept that visitors must send the draft themselves. The user has now
  requested actual delivery, so fallback-only launch is not the selected completion path.
- Obtain separate approval for any sender DNS changes, domain attachment, apex/www DNS
  replacement, or routing rules. Preparation and a green deployment are not approval.

## Contact update — October 17, 2026

Actual general/custom/laser delivery is now tested to `clyde@bitterbuffaloart.com`;
all three messages reached INBOX and the owner confirmed receipt. Both Pages
environments have the required configuration, with an encrypted sending-only key.
This supersedes earlier statements that contact secrets are absent. It uses Resend's
default **test sender**, restricted to the account owner inbox; a verified permanent
sender remains a cutover-readiness item requiring separately authorized DNS changes.
Neither temporary delivery nor sender verification authorizes domain cutover.
Keep the existing Gmail direct-contact and email-draft fallback available.

## Gates before scheduling the domain switch

1. Confirm the latest Actions run is green through both candidate verification and
   working-preview publication, and retain its commit/deployment URLs.
2. Finish standalone contact delivery using an owner-approved free provider allowance.
   Runtime secrets required by the existing implementation: `RESEND_API_KEY`,
   `CONTACT_TO_EMAIL`, and a verified `CONTACT_FROM_EMAIL`. Do not purchase a service.
   Any sender-verification DNS changes require separate authorization; none are made here.
3. Send an owner-approved real test of general, commission, and laser forms and verify
   receipt, reply-to, all project details, and consent fields. Mocked tests and HTTP 200
   do not establish inbox receipt. Alternatively obtain an explicit decision to launch
   with the tested email-draft workflow, which requires a visitor to send the draft.
4. Keep the 33 photographs as portfolio previews until individual photography listings
   and fulfillment are published and verified. Current shopping links all use the
   working Etsy shop home. No Etsy listing/checkout changes are needed for this migration.
5. Export the complete authoritative DNS zone, including DKIM selectors, MX, SPF,
   DMARC if present, CAA, domain verification, and web records. Public lookups below
   are a partial snapshot, not a substitute for an authoritative zone export.
6. Review old Shopify URLs and preserve redirects for important indexed pages. Existing
   site redirects cover `/pages/about`, `/pages/contact`, `/pages/events`,
   `/pages/custom-art`, `/collections/*`, `/cart`, `/account`, and legacy laser routes.
   Inventory any additional indexed product/page URLs before retiring Shopify.
7. Obtain approval naming the exact apex/`www` web-record changes and rollback snapshot.

## Read-only DNS evidence from this session

| Record | Observed value |
|---|---|
| Apex A | `23.227.38.65` (Shopify) |
| Apex AAAA | `2620:127:f00f:5::` (Shopify) |
| `www` CNAME | `shops.myshopify.com` |
| Nameservers | `burt.ns.cloudflare.com`, `melina.ns.cloudflare.com` |
| MX | Priority 1, `smtp.google.com` |
| SPF | `v=spf1 include:_spf.google.com ~all` |
| Other apex TXT | Domain verification present; preserve exactly |
| `_dmarc` lookup | No TXT returned; SOA response observed. Recheck in zone export. |
| DKIM / CAA | Not inventoried; inspect authoritative zone before any change. |

No DNS record was modified. Nameservers already point to Cloudflare; no nameserver
migration is proposed. Verify the zone belongs to the same Cloudflare account as Pages.

## Exact sequence after separate cutover approval

1. Save the complete zone export, Shopify configuration/export, current Pages production
   deployment ID, and a rollback copy of the approved website commit. Keep Shopify online.
2. In the existing Pages project, Custom domains, associate `bitterbuffaloart.com` and
   `www.bitterbuffaloart.com`. **This can change web DNS automatically in a Cloudflare
   zone; perform this step only within the approved cutover window.** Do not add them now.
3. Replace the Shopify apex A and AAAA web records with the Pages-managed apex CNAME
   to `bitter-buffalo-art.pages.dev`, using Cloudflare flattening. Replace `www` CNAME
   with `bitter-buffalo-art.pages.dev`. Follow the actual dashboard-issued records;
   never retain conflicting Shopify A/AAAA at the apex. Preserve all mail/TXT/DKIM records.
4. Wait for both Pages custom domains to report Active and valid HTTPS. Check apex and
   `www` from independent networks. Choose one canonical host; website canonical URLs
   already use apex HTTPS. Configure the `www` redirect only within approved DNS/routing scope.
5. Verify all nine routes, redirects, CSS/JS/images, all 33 portfolio assets, event photos,
   Etsy destination, and all three real contact-delivery flows on the custom domain.
   Recheck inbound/outbound domain email and email authentication.
6. Monitor errors and contact delivery through the transition. Keep the Pages preview
   available for comparison. Do not cancel Shopify during this work.

## Rollback

- Disable `ENABLE_PREVIEW_PUBLISH` if an application regression is under investigation.
- To restore the preview website, use Pages Deployments → the saved successful production
  deployment → Rollback. The pre-session deployment is
  `cf69ac66-8b2f-4bdf-b107-bc921afaa06e`.
- For a domain cutover failure, restore the exported web records exactly: apex A
  `23.227.38.65`, apex AAAA `2620:127:f00f:5::`, `www` CNAME `shops.myshopify.com`,
  plus their saved proxy/TTL settings. Preserve mail records and nameservers.
- Check Shopify HTTPS and key routes before ending rollback. Leave the existing store
  and live theme available; cancellation requires a separate future instruction.

## Maintenance

Rotate the Pages-only Actions token before **January 15, 2027**. It is scoped to Pages
in this account, not project-isolated; its permission grants no DNS or Workers access.
No token value belongs in a status file, report, command argument, or chat.

References: [Cloudflare custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/),
[Pages rollbacks](https://developers.cloudflare.com/pages/configuration/rollbacks/),
[Direct Upload CI](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/).
