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
