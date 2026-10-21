# Bitter Buffalo Art — Project Log

Read this file before starting website work and update it before ending a work session. Scheduled checks reconcile this record with repository and public-site evidence; they cannot observe unsaved Cursor work or local Windows files.

## Standing decisions

- Preserve the existing website and current work. No replacement site, competing branches, or automatic production deployments from log checks.
- Square and LumaPrints integration work is paused. Leave credentials, integration code, and settings untouched.
- Show approved website photography prices, or Contact for Pricing when absent. Unmatched photographs use Contact to Purchase with the artwork title in the inquiry.
- FAA links require verified exact artwork matches. Keep website prices distinct from FAA pricing and checkout.
- Tie-dye, laser, and Sketchbook purchase links use corresponding individual Etsy listings.
- Never store secrets, private customer data, or local private file inventories in this public repository.

## Last confirmed state — 2026-10-20, Mountain Time

- Website: https://bitterbuffaloart.com
- Working branch: cursor/photography-storefront-pilot-3433
- Last production commit confirmed in this conversation: 64a827cc72b8365bc928c267f4b5d5ba0d9c00b1.
- Successful production job: https://github.com/bitterbuffaloart/bitter-buffalo-art-website/actions/runs/39536774826
- Copy-only change clarified Sketchbook sales availability and replaced public Square/LumaPrints setup language with FAA/contact purchase guidance. Both changes were checked on production.
- Existing repair commit 2910fe5 restored Laser Art and Contact navigation, added eight coaster listing records and two earlier studio photographs, three Sketchbook Etsy links, and 21 FAA links.
- All 21 catalog FAA links matched the supplied website-to-faa-53.json report exactly. Remaining 32 photographs are on hold for exact FAA linking.
- Local checks passed: 63 public pages, 53 photographs, contact validation, shared navigation/local assets, and print inquiry tests. GitHub verify job passed including staging.
- Browser checks confirmed desktop navigation, mobile Menu including Laser Art and Contact, Sketchbook Etsy links, and Contact inquiry title prefill. Full artwork enlargement verification remains incomplete.
- A full production byte comparison did not pass; do not represent it as passed or assume every mismatch is a regression without examining it.

## Open work

1. Correct coaster photograph orientations individually; complete desktop/mobile and enlarged-view inspection. This was not finished.
2. Finish visual verification of Static Mischief card, display, and enlarged source. The earlier repair rotated three image derivatives; avoid double rotation.
3. Verify individual Etsy listing availability and artwork matching where a current public check is still missing.
4. Verify exact counterparts or print masters for the remaining 32 FAA-unmatched photographs before adding links.
5. Pinterest account connection/domain claim and scheduling remain unconfirmed. Prepared Pin copy is not published content.

## Check procedure

- Fetch current branch state and read this log first. Determine whether a newer branch has explicitly superseded it; do not guess.
- Inspect changes since the prior check and available workflow/deployment evidence. Check relevant live pages where accessible.
- Separate planned, implemented, tested, deployed, and verified-live states. A commit or green build alone does not prove production publication.
- Update current status and append a short timestamped check entry, sources, changes, unresolved items, and next actions. Record no-change checks briefly.
- Preserve history and concurrent changes; update using the latest file SHA, retry after rereading if conflicted. Modify only this log during scheduled checks.
- If access is blocked, record what could not be verified and retain the last confirmed state. Never invent progress.

## Check history

- 2026-10-20: Log initialized from evidence collected in the current work session. Future checks must refresh repository and live evidence before advancing status.
