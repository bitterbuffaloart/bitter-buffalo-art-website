# Bitter Buffalo Art — Project Log

Read this file before starting website work and update it before ending a work session. Scheduled checks reconcile this record with repository and public-site evidence; they cannot observe unsaved Cursor work or local Windows files.

## Standing decisions

- Preserve the existing website and current work. No replacement site, competing branches, or automatic production deployments from log checks.
- Square and LumaPrints integration work is paused. Leave credentials, integration code, and settings untouched.
- Show approved website photography prices, or Contact for Pricing when absent. Unmatched photographs use Contact to Purchase with the artwork title in the inquiry.
- FAA links require verified exact artwork matches. Keep website prices distinct from FAA pricing and checkout.
- Tie-dye, laser, and Sketchbook purchase links use corresponding individual Etsy listings.
- Never store secrets, private customer data, or local private file inventories in this public repository.

## Last confirmed state — 2026-10-20 21:23 Mountain Time

- Website: https://bitterbuffaloart.com
- Working branch: cursor/photography-storefront-pilot-3433
- Repository HEAD: 90560b6 (project log). Purchase-guidance commit 64a827c is its parent. Laser Art content commit 2910fe5 is an ancestor, not a finished restoration.
- Last production commit confirmed before this correction: 64a827cc72b8365bc928c267f4b5d5ba0d9c00b1.
- Successful production job before this correction: https://github.com/bitterbuffaloart/bitter-buffalo-art-website/actions/runs/39536774826
- Copy-only change clarified Sketchbook sales availability and replaced public Square/LumaPrints setup language with FAA/contact purchase guidance. Both changes were checked on production.
- Laser Art restoration is not complete. The owner checked the live page: only the coaster sets are properly represented. Engraved Aspen rounds and the cutting board are missing from display. Unrelated or placeholder artwork has been shown as the owner’s work. Coaster photograph orientations are still wrong.
- Commit 2910fe5 restored Laser Art and Contact navigation, added eight coaster listing records, displayed `laser.png` and `custom.png`, three Sketchbook Etsy links, and 21 FAA links. That commit is not a completed Laser Art restoration.
- All 21 catalog FAA links matched the supplied website-to-faa-53.json report exactly. Remaining 32 photographs are on hold for exact FAA linking.
- Local checks passed: 63 public pages, 53 photographs, contact validation, shared navigation/local assets, and print inquiry tests. GitHub verify job passed including staging.
- Browser checks confirmed desktop navigation, mobile Menu including Laser Art and Contact, Sketchbook Etsy links, and Contact inquiry title prefill. Full artwork enlargement verification remains incomplete.
- A full production byte comparison did not pass; do not represent it as passed or assume every mismatch is a regression without examining it.

## Open work

Laser Art restoration status: implemented. Local automated tests passed. Not deployed and not verified live.

1. Recovered the buffalo aspen round, three other engraved wood rounds, and four documented wood cutting boards from the photographs previously published on origin/main. Removed laser.png and custom.png from public pages. No ornament photograph was found.
2. Rotated Tree of Life (02) and Sri Yantra/Tree of Life (07) 90 degrees clockwise. The other six coaster photographs already read upright and were left unchanged. Desktop, mobile, and enlarged-view inspection is not done.
3. Static Mischief thumb, display, and zoom match one 90-degree clockwise rotation from commit 2f8c159 and were not rotated again. Card and dialog still need a browser check.
4. The eight coaster listings, four cutting-board listings, four round listings, and three Sketchbook listings returned HTTP 200 with Add to cart on 2026-10-20. Browser inspection of the website is still open.
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
