# Work log — original artworks, 2026-10-24

## Objective and deliverables

Publish six saleable originals on Etsy and bitterbuffaloart.com, plus a gallery-only private piece. Do not claim a product is live until that endpoint is verified. No invented listing IDs, materials, hardware, weight, year, or shipping size.

## Requirements and decisions

- Owner handoff dated 2026-10-24 is the source for titles, prices, dimensions, depth, layer counts, and quantity 1.
- Titles are working titles. The owner authorized naming. They are not individually ratified.
- The Anatomy of Unreason is private collection and not for sale.
- Website sales stay off Shopify. Until an Etsy URL is verified, the sale pieces use the contact inquiry.
- The engraved buffalo-skull board in the same photo group is not one of these six pieces.

## Approved references

- Phone originals: `C:\Users\bitte\CrossDevice\Clyde's S23 Ultra\storage\DCIM\Camera`
- Photo mapping and prices: `working/originals-2026-10-24/publication-record.json`
- Public images are watermarked derivatives. Originals are not overwritten.

## Current state

- The four sale paintings and The Anatomy of Unreason are in the Original Fine Art collection at `/original-fine-art/`. Their image files remain under `assets/sketchbook/`. They are not in the digital Sketchbook list.
- The two layered wood pieces are laser catalog inquiries. Pre-update catalog at git `801ca2b` had 16 laser products and 107 products. The working catalog has those same 16 plus exactly two new products, 109 total. None of the earlier products were removed.
- Existing Sketchbook entries, including The Color Between Worlds, The Sky Within, Grit & Grin, and Static Mischief, are still in `works.json`.
- Etsy listings were not created. Inquiry links are not listings. Listing IDs and URLs are null.
- Local QA passed, including the shared full-size viewer on desktop and a 390×844 viewport. Deployment through the Cloudflare Pages workflow is the next step. Production is not verified until https://bitterbuffaloart.com is checked after that workflow finishes.

## Photo mapping

- Mycelial Delirium: `20261023_163922.jpg`, rotated so the cap is up.
- Chromatic Rupture: `20261023_163743.jpg`.
- The Unquiet Interior: `20261023_163443.jpg`. This is the darker expressive canvas, not the simpler mushroom painting.
- Fragments of the Unconscious: `20261023_144135.jpg`, crop `(148, 1036, 3868, 2926)`. Public display is 1400×711. The poster and the furniture under the panel are outside the crop. The panel's outer edge is inside it.
- Resonance in Eight Dimensions: hero `20261021_170417.jpg`.
- Architecture of Infinity: hero `20261021_165923.jpg`.
- The Anatomy of Unreason: `20261023_164130.jpg`.

## Next actions

- Create the six Etsy drafts in the seller account, then record the real listing IDs and URLs.
- Replace each inquiry link with its verified Etsy URL and keep quantity at 1.
- Deploy the website only after that link check, or deploy the inquiry version first if the owner wants the gallery up before Etsy.

## Progress history

- 2026-10-24: Identified heroes from the uploaded photographs, built upright watermarked web images, added sketchbook and laser records, and left Etsy unpublished.
- 2026-10-24: Moved the five physical paintings into Original Fine Art, widened the panel crop to the wood edge, hash-checked the nine archived camera files without overwriting them, and left Etsy and the live site unpublished. Details are in `working/overnight-development-log.md`.
