# Bitter Buffalo Art — LumaPrints example image import and Etsy coaster draft handoff

**Review branch only:** `review/consolidated-website-catalog-parchment-20261019`, draft PR #8. Do not merge or publish without owner approval.

## A. Install the 16 real LumaPrints product example images

- The owner supplied the images in ChatGPT. The prepared ZIP is named `Bitter_Buffalo_LumaPrints_Product_Examples_Assets.zip`, available from the ChatGPT conversation; once downloaded in Chrome it should be in the owner's Downloads folder. **Do not claim it already exists on the Windows machine without verifying.**
- Its interior tree is `cloudflare-pages/assets/images/lumaprints/{metal,paper,canvas,framed}/...`; extract this tree into the existing website checkout.
- The print page `cloudflare-pages/photography/index.html` already has supplier gallery markup with 16 local image references. The CSS is already added to `cloudflare-pages/assets/css/site.css`.
- Current preview uses limited fallback supplier-hosted paper/canvas imagery until the local image assets are copied. Metal images require the local bundle.
- Verify every one of the 16 paths exists and opens, visually verify image dimensions and captions, verify no broken or duplicate asset, and check mobile 390px and desktop.
- The example photos are supplier-product construction references, not owner photographs, and must remain clearly attributed. Never treat them as photo masters or imply sample image rights/ownership.
- Run `python working/qa-site.py cloudflare-pages`, `node working/test-print-catalog.mjs`, `node working/test-contact.mjs`. Fix actual test failures. Preserve existing retail matrix, checkout state and #14/#18/#24 print holds.
- Commit the image files **only to the existing review branch** after checking git status and unrelated changes, and request preview QA. Do not merge or trigger live deployment without owner approval.

## B. Etsy coaster listings: three confirmed sets

The October 18 coaster photography was previously inventoried into:
- `COASTER-4PC-001` geometric deer, set of four.
- `COASTER-4PC-002` Tree of Life, set of four.
- `COASTER-5PC-001` bison skull, set of five; group shot `20261018_085503.jpg`.

The prepared listing copy and verified/unknown information are in `working/etsy/coaster-set-draft-batch-2026-10-19.json`. The four-piece sets have the owner's earlier 4-for-$33.33 market baseline; confirm whether that rate applies online. Five-piece online price has **not** been approved. Keep these uncertainties explicit.

- Inspect the actual October 18 original coaster photo shoot in the authorized local Etsy launch workspace, image groups and available inventory before making listings.
- Check Etsy's existing active and draft listings first to avoid duplicates; if any matching SKU already exists, update it rather than creating another.
- Create **unpublished drafts** through a supported authenticated seller interface, if one is available. Do not bypass security or tamper with browser credentials/cookies to obtain access.
- Match each draft with its actual complete-set photos and any authorized detail photos. Do not invent wood species, sizes, finish, inventory, weights, shipping, or per-piece prices.
- Confirm Etsy categories, fulfillment/shipping profile, quantity, tags, and handmade/laser process claims before owner reviews the drafts.
- Save actual draft IDs and URLs only after Etsy confirms they exist. Do not publish any coaster listing or charge listing fees without owner approval.
- The owner's larger ~50-coaster photography session is **not** fully sorted into sellable SKU groups yet; continue inventory without inventing additional products.

## Boundaries

Do not touch Photo Culler, source photo masters, Lightroom, Cloudflare DNS or Shopify. Do not publish print catalog changes, products or Etsy listings without approval. Commit locally or to the named website review PR only as relevant and leave a concise verification report.

## Current live website corrections, October 19 (later)

- The supplier image gallery now renders 15 **real** downloaded LumaPrints examples using plain HTML `<img src>`. The previously hidden lazy-load loop was removed. The Cloudflare Pages production deployment and direct custom-domain check passed.
- The three original paintings have direct Etsy URLs stored in `cloudflare-pages/assets/sketchbook/works.json` and are linked from both sketchbook cards and lightbox views.
- Laser Art now shows three *clearly labeled text-only* coaster SKU cards, not fake product photography or Etsy buy links. The real coaster photos and Etsy listings are still **not completed**; do not report them as done.

### Finish the missing coaster job on the Windows machine

1. Locate the October 18 S23 Ultra coaster photo shoot through existing local photo folders and coaster project inventory. The owner photographed approximately 50 coasters, but DO NOT assume that means 50 distinct SKUs or ready-to-sell sets.
2. Reconcile every actual coaster design, individual and group image. Known sets: `COASTER-4PC-001` geometric deer (4); `COASTER-4PC-002` Tree of Life (4); `COASTER-5PC-001` bison skull (5). `20261018_085503.jpg` is the reported complete five-piece bison group photograph.
3. Export complete-set and detail **copies** (never move or modify phone originals) to `cloudflare-pages/assets/images/coasters/`, with an explicit SKU-to-photo manifest. Validate the count visible in each primary image is exactly the item count in the listing. Use at least front/full-set, close-up, size reference and reverse/side views when available. If uncertain, mark BLOCKED; do not use unrelated coasters.
4. Add the real images to the existing `id="coaster-sets"` Laser Art cards. Keep current SKU and wording, improve as accurate physical observations become available. Never imply images or a design not actually in hand. Check desktop and 390px mobile.
5. Inspect signed-in Etsy seller listings and drafts **before** creating anything; prevent duplicate SKUs. Use the verified draft specs in `working/etsy/coaster-set-draft-batch-2026-10-19.json`. Assemble unpublished Etsy drafts with actual photographs, size/material/finish/weight/available set counts, and applicable shipping. The old $33.33 bundle is a pricing baseline, not newly approved online pricing; five-piece price remains unapproved. Preserve Etsy Creativity Standards and record process as laser engraving.
6. Confirm actual Etsy draft IDs and URLs saved in the seller account; do not publish automatically. Only replace website generic shop links with direct listing URLs when each corresponding listing is verified live.
7. Report source directories, each image filename/SKU match, all distinct coaster designs found, real image assets displayed on the website, draft IDs, and any missing approval. Scope only website/Etsy launch; do not touch Photo Culler, F: or Lightroom. No DNS changes.
