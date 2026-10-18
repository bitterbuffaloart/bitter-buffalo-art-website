# Contact email delivery verified — 2026-10-17 (America/Denver)

## Current outcome
- User selected **clyde@bitterbuffaloart.com** and confirmed receipt in chat.
- Existing Pages project `bitter-buffalo-art` now has `RESEND_API_KEY` stored as an encrypted secret, with `CONTACT_TO_EMAIL=clyde@bitterbuffaloart.com` and `CONTACT_FROM_EMAIL=Bitter Buffalo Art <onboarding@resend.dev>` in production and preview environments. No secret value is recorded here.
- Sending-only Resend key created for the website. Existing Free plan retained; paid overage remains disabled. No subscription or DNS change.
- Re-ran the previously successful workflow run **39095427361**; verify/deploy succeeded again. All candidate and working-preview checks passed. Active deployment at evidence capture: `51426674-8cf1-4965-801b-e85820c34965` (https://51426674.bitter-buffalo-art.pages.dev).
- Browser submissions for **general / custom-project / laser-intake all succeeded**. Each resulting email was independently found with an **INBOX** label in the selected Gmail account. All three had the expected To and Reply-To values, and SPF/DKIM/DMARC passed for the Resend sender.
- Custom-project details (category, size, colors, quantity, preferred contact) and required `project_contact_ack=yes` arrived intact. Laser surface, dimensions, quantity, date, notes, and all four required permissions arrived intact. Optional marketing permission remained unselected.
- Receipt evidence: `working/contact-delivery-evidence-2026-10-17.json`; general `1a14d47ba8e7c650`, custom `1a14d47fd25abcec`, laser `1a14d4852539b586`.
- Contact page notice corrected and published in source commit `c605b247a4e152499aa111396ec7a629167c05e7` to describe sending and the retained email-draft fallback. Current production deployment was read from the authenticated Pages dashboard; final Actions/HTTP verification is recorded below.

## Final release verification
- Source commit `c605b24` → Actions run **39097826959**, **SUCCESS**: https://github.com/bitterbuffaloart/bitter-buffalo-art-website/actions/runs/39097826959.
- Production deployment **51426674-8cf1-4965-801b-e85820c34965**; candidate **40436dba-e2f0-4174-97c1-399bbf41e8c9**.
- Final working-alias HTTP comparison: **9 pages / 55 resources / Final 33 / 0 errors**, including invalid contact JSON 400. Evidence: `working/qa-contact-delivery-release-2026-10-17.json`.
- Only the contact notice changed in the published site; photographs, layout, form logic, failure retention, and email-draft fallback were preserved.
- Local shell Git authentication helper was blocked. The connected GitHub tool published the verified one-line change; anonymous fetch and a normal merge preserved local checkpoint commit `dd91259` and the remote source commit. No history was rewritten.
- Local Cloudflare CLI authentication expired; dashboard verification was used instead. GitHub Actions credentials remain operational. No credentials were recreated for Actions.

## Limits and remaining cutover gates
- This is working, owner-approved **temporary test-sender delivery** to the Resend account inbox. It is not a verified custom-domain sender or unrestricted permanent delivery. A permanent branded sender remains pending separate DNS authorization.
- Existing public direct-email/reference-image links and error fallback remain `backcountrytiedye@gmail.com`. Automatic form submissions go to the newly selected Clyde inbox.
- Failure retention and email-draft fallback code preserved; existing mock regression suite passed. No new failure test sent real mail.
- Complete authoritative DNS/mail export, CAA/DKIM checks, and old indexed URL inventory; follow `DOMAIN_CUTOVER_CHECKLIST.md` only after explicit approval.
- No domain attached: bitter-buffalo-art.pages.dev. Shopify, Art Builder, Photo Culler, Lightroom, originals, and DNS remain unchanged.

---
# Continuation verification — 2026-10-17 (America/Denver)

## Current state and evidence
- Existing local and remote `main` both verified at documentation commit `505c6a12fedb4ba62bbd2e77282e765db2efa94d`; no merge, reset, rebuild, or deployment performed.
- GitHub API independently reconfirmed run **39095427361**, `completed / success`, source `958d7287a4b5bb941c1ce45ce6d4c3693fc9a04e`.
- Cloudflare API reconfirmed canonical deployment **d5b50282-1c7f-4df6-9d7a-ed1031020d32**, Pages production branch `preview`, only domain `bitter-buffalo-art.pages.dev`.
- Existing contact regression suite passed without sending real mail. HTTP comparison of 9 pages / 55 resources / Final 33 against the working preview returned **0 errors**, including invalid contact input returning JSON 400. Evidence: `working/qa-continuation-2026-10-17.json`.
- Local checkpoint tag `checkpoint-contact-delivery-2026-10-17` preserves `505c6a1` before documentation/configuration changes. Existing untracked `working/poll-actions.py` preserved.
- Direct Windows PowerShell 5.1 invocation of the existing Python QA script and Node contact suite **both passed**. A `.ps1` wrapper was blocked by the existing execution policy; the successful direct invocation changed no policy.
- No persisted `python -c` invocation was found in the maintained deployment/QA scripts. Use Python script files with a quoted executable path; do not reconstruct multiline Python inside PowerShell 5.1 `-c` arguments. Existing QA ran successfully as a script file.

## Contact delivery — requested, awaiting specific setup decision
- User explicitly requested actual contact-form email delivery in this continuation.
- Pages API shows no environment bindings in either production or preview. Missing runtime secrets remain `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`.
- Signed-in Resend team `bitterbuffaloart` has **no verified domains and no API keys**. Admin account inbox: `clyde@bitterbuffaloart.com`. Website public contact/fallback inbox: `backcountrytiedye@gmail.com`.
- Resend dashboard shows Free transactional plan, 3,000 monthly / 100 daily email allowance; paid overage disabled. No plan or billing setting changed.
- Resend's default sender is restricted to testing emails to the account's own inbox. It is not a verified permanent sender. Temporary delivery to the account inbox is a possible DNS-free test path, subject to explicit destination/key approval and successful receipt tests.
- Delivery to the public Gmail destination requires a verified sending domain, or a separately approved provider with equivalent capabilities. Existing instruction prohibits all bitterbuffaloart.com DNS changes; contact setup does not override it.
- A sending-only API key form is prepared but **not submitted**. No credentials created, secrets configured, mail sent, or contact copy changed. Awaiting user's destination/key decision; keep fallback copy truthful until receipt is proven.

## Next actions and protections
1. Resolve contact destination and permission to create/store a sending-only key; configure only the existing Pages project and correct production/preview environments.
2. Verify general/custom/laser receipt, Reply-To, details, and permissions; provider HTTP acceptance alone is not inbox receipt. Preserve fallback on failure.
3. Complete authoritative DNS/mail export and indexed URL inventory before scheduling domain cutover. See existing `DOMAIN_CUTOVER_CHECKLIST.md`.
4. Domain cutover still requires separate explicit approval. No DNS, live Shopify, Art Builder, Photo Culler, Lightroom, originals, or paid-service changes were made.

---
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
