# Add a photograph, product, or price

The public pages read `cloudflare-pages/assets/data/catalog.json`. Edit `working/catalog/products.csv`, then import. Do not put a price in a page component.

## Photographs

1. Keep the original file where it is. Do not overwrite Photo Culler or the Portfolio for Etsy originals.
2. Add a display JPEG, a thumbnail, and a large view under `cloudflare-pages/assets/images/portfolio/`, `thumbs/`, and `large/`. Fit inside the long edge. Do not crop to a new aspect ratio.
3. Add a row to `working/catalog/products.csv`.
4. Run `node working/catalog/import-products.mjs`.

A photograph row uses category `photography prints`. Leave `retail_price` blank unless Clyde has approved that exact price. The only approved public price in this catalog is Grand Tetons 16×24 at `199.33`. 20×30 stays on hold in the materials text, with no second price.

## Other products

Categories are `photography prints`, `tie-dye`, `laser`, and `custom art`.

Required columns:

`id,name,category,images,description,materials_and_sizes,retail_price,supplier_cost,shipping_estimate,availability,inquiry_or_external_link`

`images` is thumbnail, display, and enlarged paths separated by `|`. `availability` is `inquiry`, `on-hold`, or `external`. A blank retail price stays unpublished. `working/catalog/import-template.csv` is the header plus the Grand Tetons example.

## Deploy and rollback

Do not deploy this feature branch. Cloudflare Pages project `bitter-buffalo-art` publishes only from `main`, and only when `ENABLE_PREVIEW_PUBLISH` is true. Pull requests run the page check and do not publish.

From a clean checkout, `node working/stage-site.mjs` writes `.site-build`. The script stops if `.site-build` already exists, so a release build uses a clean worktree and does not delete the working tree.

Rollback without a DNS change: redeploy the last known-good commit to the Pages preview branch, or set `ENABLE_PREVIEW_PUBLISH` to false so later main pushes do not replace the working preview. The current public alias stays `https://bitter-buffalo-art.pages.dev/` until that preview branch is replaced. Do not change nameservers or custom-domain records from this work.

Environment names live in `.env.example`. Copy that file to `.env` for local names. `.env` is gitignored. Do not commit values.
