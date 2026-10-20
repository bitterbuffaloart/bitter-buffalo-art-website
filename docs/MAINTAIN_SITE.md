# Maintain the website

One catalog, one portfolio manifest, and one pricing master. Do not start a second site.

## Photographs

Titles and stories live in `working/portfolio/build-final-44.py`. The manifest is `working/portfolio/photography-manifest.json`. Permanent IDs stay stable. Position 14 is the bison calf, `bb-photo-45`. The horse file remains archived as `bb-photo-14` and must not be deleted.

After a photograph change, from the repository root:

```
python working/portfolio/build-final-44.py
python working/catalog/build-catalog.py
python working/prints/build-print-inquiry.py
node --test working/test-print-inquiry.mjs working/test-print-storefront.mjs working/catalog/test-import.mjs working/test-contact.mjs
python working/qa-site.py cloudflare-pages
```

The approved retail is $199.33 for a 16×24 premium 1.5-inch framed canvas when the measured file is 3:2 within 0.5 percent and at least 200 PPI. Other workbook amounts are drafts. Acrylic stays off. #10 stays 16:9 with no price.

## Checkout

Reuse `cloudflare-pages/functions/prints/`. Do not bypass the profit and print-master checks. Checkout stays disabled until approved retail, complete cost, print master, shipping, tax, and fulfillment are all verified. `PRINT_FULFILLMENT_MODE` stays empty. Secrets stay in the gitignored `.env` or in Pages secrets, never in git.

## Deploy and rollback

GitHub Actions workflow `Deploy Cloudflare Pages` publishes an isolated `qa-<sha>` preview from this branch. Production publish is a separate workflow dispatch input and deploys the existing Cloudflare Pages project. Do not change DNS unless that project cannot publish the domain. Keep the previous production deployment id and roll back in Cloudflare Pages if the new deployment is wrong.
