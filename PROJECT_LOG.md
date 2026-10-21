# Bitter Buffalo Art — Project Log

Read this file before starting website work and update it before ending a work session. Scheduled checks reconcile this record with repository and public-site evidence; they cannot observe unsaved Cursor work or local Windows files.

## Standing decisions

- Preserve the existing website and current work. No replacement site, competing branches, or automatic production deployments from log checks.
- Square and LumaPrints integration work is paused. Leave credentials, integration code, and settings untouched.
- Show approved website photography prices, or Contact for Pricing when absent. Unmatched photographs use Contact to Purchase with the artwork title in the inquiry.
- FAA links require verified exact artwork matches. Keep website prices distinct from FAA pricing and checkout.
- Tie-dye, laser, and Sketchbook purchase links use corresponding individual Etsy listings.
- Never store secrets, private customer data, or local private file inventories in this public repository.

## Last confirmed state — 2026-10-20 22:15 Mountain Time

- Website: https://bitterbuffaloart.com and https://www.bitterbuffaloart.com
- Working branch: cursor/photography-storefront-pilot-3433
- Site content commit: f3df65a. Purchase-guidance commit 64a827c and project-log commit 90560b6 are ancestors. Laser Art navigation commit 2910fe5 is an ancestor and was not itself a finished restoration.
- Production job for this correction: https://github.com/bitterbuffaloart/bitter-buffalo-art-website/actions/runs/39542726670. The publish-production job succeeded for f3df65a.
- Preview checked before production: https://cc2c606a.bitter-buffalo-art.pages.dev from run https://github.com/bitterbuffaloart/bitter-buffalo-art-website/actions/runs/39541245345.
- Laser Art now displays the buffalo aspen round, three other decorative engraved wood rounds, four engraved wood cutting boards, and eight coaster sets. `laser.png` and `custom.png` are no longer referenced by public pages. Those files remain in the repository.
- Coaster photographs 02 (Tree of Life) and 07 (Sri Yantra and Tree of Life) were rotated 90 degrees clockwise. The other six already read upright and were not rotated. JPEG rotation was a quality-95 re-encode because a lossless jpegtran tool was not available. Unrotated bytes are kept under `working/laser-art-originals/coasters-before-rotation/`. No EXIF orientation tag was written.
- Static Mischief thumb, display, and zoom remain the single 90-degree clockwise rotation made from commit 2f8c159. Desktop and mobile dialogs loaded the 1800×2400 image, fit the window, could scroll, and closed. It was not rotated again.
- No ornament photograph was recovered. The Laser Art page says so and does not show a substitute. No higher-resolution camera originals of the rounds or cutting boards were found. The displayed files are the previously published 800×800 photographs from origin/main.
- Production still has 53 photographs, 21 FAA links, 25 tie-dye listing links, and the Sky Within, Grit & Grin, and Static Mischief Etsy links. The other 32 photographs remain on hold. Square, LumaPrints, and DNS were not changed.
- The owner’s earlier finding still stands as the reason for this correction: before f3df65a, the live page showed coasters plus placeholder artwork and did not show the rounds or cutting boards.

## Open work

Laser Art restoration of the recovered photographs: implemented in f3df65a, tested on the preview, deployed, and verified live.

1. Recovered and displayed. Missing authentic photograph: an ornament. Leave that gap.
2. Orientation correction is verified on preview enlargements and on the live image bytes.
3. Static Mischief browser check passed. Do not rotate it again.
4. The sixteen laser Etsy URLs are the exact listings checked available on 2026-10-20. They were not opened again after this production deploy.
5. Verify exact counterparts or print masters for the remaining 32 FAA-unmatched photographs before adding links.
6. Pinterest account connection/domain claim and scheduling remain unconfirmed. Prepared Pin copy is not published content.

## Check procedure

- Fetch current branch state and read this log first. Determine whether a newer branch has explicitly superseded it; do not guess.
- Inspect changes since the prior check and available workflow/deployment evidence. Check relevant live pages where accessible.
- Separate planned, implemented, tested, deployed, and verified-live states. A commit or green build alone does not prove production publication.
- Update current status and append a short timestamped check entry, sources, changes, unresolved items, and next actions. Record no-change checks briefly.
- Preserve history and concurrent changes; update using the latest file SHA, retry after rereading if conflicted. Modify only this log during scheduled checks.
- If access is blocked, record what could not be verified and retain the last confirmed state. Never invent progress.

## Check history

- 2026-10-20: Log initialized from evidence collected in the current work session. Future checks must refresh repository and live evidence before advancing status.
- 2026-10-20 21:23 MT — Planned. Owner review of the live Laser Art page found the restoration incomplete: Aspen rounds missing, cutting board missing, placeholder or unrelated artwork on display, coaster orientations still wrong. No image, catalog, or page edit has been made for this correction yet. HEAD remains 90560b6. Next: recover authentic photographs, then correct orientations.
- 2026-10-20 21:51 MT — Implemented, then local tests passed. Recovered eight previously published laser photographs from origin/main. Removed laser.png and custom.png from public pages. Rotated coaster photographs 02 and 07 clockwise 90 degrees. qa-site.py reported 63 pages and no errors. test-contact, test-site-chrome, and test-print-inquiry passed. Not deployed. Not verified live.
- 2026-10-20 22:00 MT — Tested on preview https://cc2c606a.bitter-buffalo-art.pages.dev. Sixteen laser cards loaded. Enlarged views of all eight coasters, four rounds, and four boards fit and closed. Tree of Life and Sri Yantra/Tree of Life read upright. Static Mischief dialog checked on desktop and mobile. Not yet production.
- 2026-10-20 22:12 MT — Deployed. Production job 39542726670 publish-production succeeded for f3df65a.
- 2026-10-20 22:15 MT — Verified live. https://bitterbuffaloart.com/laser-art/ and the www host return the buffalo hero and do not reference laser.png or custom.png. The live catalog has 16 laser records. Every laser product image returned HTTP 200 at the expected pixel size with no EXIF orientation tag. SHA-256 of the buffalo round, Solar Summit board, and coasters 02 and 07 matched f3df65a. The production page rendered 16 cards, and the enlarged Tree of Life photograph was 1200×1600. Inventory: docs/laser-art-inventory.md.
- 2026-10-20 23:39 MT — Planned. Sitewide restoration of the existing live site. Laser Art at f3df65a stays the starting point and is not a rollback target. Next: re-inspect all eight coasters at full size, search again for an ornament photograph, then audit tie-dye, all 53 photographs, and every public page. Not implemented yet for this pass.
- 2026-10-20 23:48 MT — Implemented, not yet tested or deployed. Copied the Treetop Holiday Kickoff Market flyer byte for byte to cloudflare-pages/assets/images/events/treetop-holiday-kickoff-market-2026.jpg. SHA-256 850be805812324a1d5f95d001d0caff5a815273aacb37c56849ac8e5c489b2fc. Added it to the 2026 event cards in date order. The card does not say Bitter Buffalo Art attended or has a booth. Re-inspected coasters 01, 04, 06, and 08 at full size; they already read upright. Coasters 02 and 07 stay at the earlier clockwise rotation. No public image has an EXIF orientation other than none. No ornament photograph was found. Four photographs remain 16:9 and are not cropped to 3:2. Wildfire Bramble and Midnight Bramble size lines still conflict inside the Etsy listings themselves, so the website sizes were not guessed.
