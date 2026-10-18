# Verified current state — 2026-10-17 late evening (America/Denver)

## Outcome (this session)
- Checkpoint tag: `checkpoint-pre-finish-2026-10-17` (pre-push baseline).
- Controlled push **958d728** → GitHub Actions run
  https://github.com/bitterbuffaloart/bitter-buffalo-art-website/actions/runs/39095427361
  completed **SUCCESS** (verify + deploy).
- Isolated candidate: https://7839d7ec.bitter-buffalo-art.pages.dev/
- Working production deployment: https://d5b50282.bitter-buffalo-art.pages.dev/ (commit `958d728`)
- Working preview alias: https://bitter-buffalo-art.pages.dev/ — independent QA: 9 pages, 55 resources, Final 33, Etsy shop-home only, **0 errors**.
- Secrets present (names only): `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
- Variable: `ENABLE_PREVIEW_PUBLISH=true`.
- GitHub source `main` → Pages production branch named `preview` (unchanged by design).
- Contact page now states honestly that automatic inbox delivery is not configured; browser test of general form retained entries and offered a mailto draft after API **503**. Live API: invalid → **400**, configured probe → **503** (no silent “sent” claim). Mock suite passes; no real owner email sent.
- Events booth photos and five past-event records remain. Photography Final 33 + edition-of-66 copy preserved. No DNS / Shopify / Art Builder / Photo Culler / Lightroom changes.

## Remaining blockers and next actions
1. Owner-approved free email delivery (Pages secrets `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`) + prove receipt for general / custom / laser — **or** launch with the tested email-draft workflow.
2. Export complete DNS/mail (DKIM/CAA); public snapshot: Shopify A/AAAA/www, Cloudflare NS, Google MX/SPF; no DMARC TXT seen.
3. Explicit domain cutover later per `DOMAIN_CUTOVER_CHECKLIST.md`. No domain attached to Pages.
4. Publish/verify photography Etsy listings separately; site CTAs stay on shop home until then.
5. Rotate Actions Pages-only token before **2027-01-15**.

## Protections
No DNS write, live Shopify theme publish/cancellation, Art Builder or Photo Culler changes,
Lightroom/original-photo edits, paid services, invented artwork/event history, or force-push.
Shopify remains on the live domain.

---
# Prior verified state — 2026-10-17 (superseded where contradicted above)

## Outcome
- Independent website repo: https://github.com/bitterbuffaloart/bitter-buffalo-art-website.
- Starting HEAD 53aa53b confirmed locally and remotely. Preserved subsequent remote audit
  commits 0441d15 and b25be63 with a normal merge; no force push or rewritten history.
- Published website commit: e90c8887190dcd7b176afbd93064450cfd761d2a.
- Full automatic publication run SUCCESS:
  https://github.com/bitterbuffaloart/bitter-buffalo-art-website/actions/runs/39094227881.
- Candidate: https://57214fe3.bitter-buffalo-art.pages.dev/.
- Working production then: https://ab4e5847.bitter-buffalo-art.pages.dev/.
- Contact provider delivery was unconfigured; email-draft fallback used.
- Older historical sections below retained for audit trail.
