# Continue this website without Cursor

Branch: `cursor/website-completion-881d`.

Live production is Cloudflare Pages project `bitter-buffalo-art`, production branch `preview`, commit `cbcf655`. Do not push `preview` or `main` from this work. Do not deploy. Do not change DNS. Do not merge pull requests #5, #6, #7, or #9.

## Install and run

1. Install Node.js 22 and Python 3.12.
2. Clone `https://github.com/bitterbuffaloart/bitter-buffalo-art-website` and check out `cursor/website-completion-881d`.
3. From the repository root, import the catalog:

```
node working/catalog/import-products.mjs
```

That reads `working/catalog/products.csv` and `working/pricing/pricing-master.csv`, then writes:

- `cloudflare-pages/assets/data/catalog.json`
- `cloudflare-pages/assets/data/pricing-master.json`

4. Check the files:

```
node --test working/catalog/test-import.mjs
node --test working/test-print-storefront.mjs
python working/qa-site.py cloudflare-pages
```

5. Preview the static files from `cloudflare-pages` with any local static server. Open `/sandbox/`, `/photography/`, and `/photography/prints/grand-tetons/`. The sandbox is not in the public navigation.

## Change products without editing page HTML

Edit `working/catalog/products.csv`, then run the import again. Categories that the importer accepts are `photography prints`, `tie-dye`, `laser`, `custom art`, `coasters`, `shadowboxes`, and `lamps`.

Coasters stay `laser` so they remain on the laser page. Do not add a second public coaster category. Leave `shadowboxes` and `lamps` empty until a real product exists. Draft rows stay off the public grids. Blocked rows can show “Not available for print” and have no purchase link.

`lumaprints_confirmed` must stay `no`. The importer stops if it is `yes`. A variant is confirmed only after the LumaPrints API returns that configuration.

Calculated profit is retail minus production cost, shipping cost, and fee estimate, and only when all four cells are dollars. Blank cells stay blank.

## Prices

`working/pricing/RETAIL_MATRIX_42_2026-10-19.csv` is the saved 42-row worksheet. Rebuild the master with:

```
python working/pricing/build-pricing-master.py
```

The only owner-confirmed retail is `FRAMED-OPEN-16x24` at `199.33`. Other worksheet retails are unapproved. The named quotes `70.78`, `91.56`, and `120.68` are unresolved and are not assigned to a size. See `working/pricing/QUOTE_RECONCILIATION.md`.

The Grand Tetons page keeps `$199.33` as the fallback text. After import, the page script replaces the visible 16×24 price from `pricing-master.json`.

## Photography mapping

`working/catalog/photography-mapping.json` is the machine-readable map. `working/catalog/photography-mapping-exceptions.md` lists unresolved print holds. Do not crop the portfolio JPEGs and do not edit the original files.

#14 Horse portrait and #18 Shiprock star trails stay blocked. Their published files are watermarked, and a clean master was not cleared in this repository.

## Etsy and LumaPrints

Read `working/catalog/lumaprints-etsy-mapping.md`. Do not create duplicate Etsy listings. The only approved website Etsy link is `https://www.etsy.com/shop/BitterBuffaloArt`.

## Environment

Copy `.env.example` to `.env`. The example values for secrets are empty. `.env` is gitignored. Do not commit tokens.

Report these four names only as PRESENT, MISSING, or EMPTY:

- `LUMAPRINTS_API_KEY`
- `LUMAPRINTS_API_SECRET`
- `LUMAPRINTS_ENVIRONMENT`
- `LUMAPRINTS_ADMIN_TOKEN`

On 2026-10-19 they were MISSING from the process, user, and machine environment, MISSING from Pages Preview and Production, and not referenced by `.github/workflows/deploy-pages.yml`. `.env` was absent. Do not call LumaPrints or Square until replacement credentials exist.

## Build, deploy, and rollback

From a clean checkout, with no `.site-build` directory:

```
node working/stage-site.mjs
```

The script copies the public site, including `sandbox`, into `.site-build` and stops if that directory already exists. Do not upload `.site-build`.

GitHub Actions deploys only a push to `main`, and only the last step publishes branch `preview` when the repository variable `ENABLE_PREVIEW_PUBLISH` is true. This feature branch does not trigger that deploy.

Rollback, only if Clyde asks: redeploy the known-good production commit `cbcf655` to the Pages production branch `preview`. Do not change nameservers or custom-domain records.

## Still blocked outside this repository

- The four LumaPrints Pages bindings are MISSING, so no configuration can be confirmed.
- Etsy variant sync was not confirmed by the stores API document.
- Framed canvas subcategory, finish, frame choice, foamcore, backing, hardware, and wire are unresolved.
- 20×30 framed cost is blank, and the Grand Tetons file is about 191.5 ppi at that size.
- Clean masters for #14 and #18 are not in the repository.
- Individual Etsy listing URLs were not re-opened. Recorded ids stay unverified.
