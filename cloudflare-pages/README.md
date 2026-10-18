# Bitter Buffalo Art website

Independent repository: https://github.com/bitterbuffaloart/bitter-buffalo-art-website
Source: this cloudflare-pages directory. Preserve Art Builder and Photo Culler.

The committed HTML/CSS/JS and existing image derivatives are authoritative.
Do not run working/build-static-site.js: it is a legacy Shopify extraction generator
and does not include the subsequent hand-edited website fixes.

From the repository root:
- Validate: python working/qa-site.py cloudflare-pages
- Contact checks (mock delivery): node working/test-contact.mjs
- Package from a clean checkout: node working/stage-site.mjs
- Deployment: see DEPLOY.md and the GitHub Actions workflow.
