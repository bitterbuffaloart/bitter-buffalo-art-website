# Deployment — existing Cloudflare Pages project

Project: bitter-buffalo-art. Account: f3ee68d66369fd4b2bc390d1dae218f6.
Working preview: https://bitter-buffalo-art.pages.dev/.
Its Pages production branch is named preview; main is the GitHub source branch.
Keep this mapping until a deliberate, verified change is made. Do not change DNS.

Proven Actions publication: run 39094227881 (commit e90c888) → working deploy ab4e5847.
Repository secrets CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID are configured;
ENABLE_PREVIEW_PUBLISH=true. Rotate the Pages-only token before 2027-01-15.

## GitHub Actions

Required repository secrets: CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID.
Token permission: account Cloudflare Pages Edit only. No DNS/Workers permissions.
The approved token expires January 15, 2027; rotate it in GitHub before expiry.
Never copy local broad Wrangler OAuth credentials into Actions.

The workflow on main first validates all nine pages, local links, Final 33, Events,
and mocked contact behavior. It stages only public files and the contact Function,
then uses Wrangler 4.151.1 from .site-build (Functions discovery root) to upload public/.
The branch qa-<full commit SHA> is isolated from the working preview.
It compares all public pages/assets by SHA-256 and checks invalid contact input returns
JSON 400 without sending email. A failure prevents working-preview publication.

ENABLE_PREVIEW_PUBLISH is now true after successful Actions run 39093752970 and
browser QA of https://e910e249.bitter-buffalo-art.pages.dev/ at 390 and 1280 pixels.
Subsequent main pushes publish to the preview branch only after candidate verification.
Set the variable to false to suspend working-preview publication. No DNS is changed by this workflow.
Do not enable it before checking the candidate, branch mapping, and rollback target.

## Manual isolated candidate

From a clean checkout at repository root, run node working/stage-site.mjs.
From .site-build, run:

    npx --yes wrangler@4.151.1 pages deploy public --project-name=bitter-buffalo-art --branch=qa-COMMIT

Use the actual commit SHA in place of COMMIT. Validate the exact returned deployment URL
with working/qa-site.py from the repository root, plus browser/mobile checks.
Do not use the legacy deploy-preview scripts: those directly update the working alias.
Do not create a replacement Pages project or attempt native Git conversion.
Direct Upload projects cannot be switched to Git integration in place:
https://developers.cloudflare.com/pages/get-started/direct-upload/

## Runtime contact configuration and cutover

Contact delivery is separate from deployment credentials. A verified sender/recipient
and owner receipt test are required before declaring contact delivery operational.
Current fallback is a user-triggered email draft; it does not depend on Shopify.
Follow ../DOMAIN_CUTOVER_CHECKLIST.md after explicit cutover approval.
