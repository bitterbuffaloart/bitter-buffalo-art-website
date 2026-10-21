# Sitewide restoration report

Checked 2026-10-21 00:02 Mountain Time. The public site is not finished.

## Production

- Site: https://bitterbuffaloart.com and https://www.bitterbuffaloart.com
- Events: https://bitterbuffaloart.com/events/ and https://www.bitterbuffaloart.com/events/
- Laser Art: https://bitterbuffaloart.com/laser-art/
- Live content commit: `3552a6d` (2026-10-20 23:49:12 MT), “Show the Treetop Holiday Kickoff Market flyer.”
- Preview: https://10608a7a.bitter-buffalo-art.pages.dev
- Preview run: https://github.com/bitterbuffaloart/bitter-buffalo-art-website/actions/runs/39551797045 (branch-preview completed 23:50 MT)
- Production run: https://github.com/bitterbuffaloart/bitter-buffalo-art-website/actions/runs/39552095571 (publish-production succeeded 23:53:55 MT)
- Laser Art content remains `f3df65a`, an ancestor of `3552a6d`. Its production run was https://github.com/bitterbuffaloart/bitter-buffalo-art-website/actions/runs/39542726670.
- A documentation commit after `3552a6d` records this report. It was not deployed again. DNS, Square, and LumaPrints were not changed.

## Pages audited

Home, Shop, Laser Art, Tie-Dye, Photography, Sketchbook, Events, About, Custom Art, and Contact were opened on production after the deploy, desktop 1440×900 and mobile 390×844. Screenshots are `sitewide-*.png` in the project store `media/` folder.

The header on those shots is Home, Shop, Tie-Dye, Photography, Sketchbook, Laser Art, Custom Art, Events, About, Contact. Sketchbook stays labeled Sketchbook. Contact remains `/contact/`.

## Treetop flyer

The uploaded JPEG was copied byte for byte. It was not recompressed or redrawn.

- Source used: the store file `docs/treetop-holiday-kickoff-market-2026.jpg`
- Website file: `cloudflare-pages/assets/images/events/treetop-holiday-kickoff-market-2026.jpg`
- Size: 1115×627 JPEG, 94909 bytes
- SHA-256: `850be805812324a1d5f95d001d0caff5a815273aacb37c56849ac8e5c489b2fc`

2026 cards, in date order, with every earlier card kept:

1. Soul Rebel Festival — Sunday, July 12, 2026 — `soul-rebel-black-uhuru.jpg`
2. Questing the WildeRealm — July 16–18, 2026 — `questing-the-wilderealm.jpg`
3. Elevate Love — July 31–August 2, 2026 — `elevate-love-2026-lineup.jpg` and `elevate-love-2026-poster.jpg`
4. Bitter Buffalo Art at Union Peak Festival — August 28–30, 2026 — no flyer was supplied, and the card says so
5. Till the Break of Dawn: DISCONNECT — September 4–5, 2026 — `disconnect-till-the-break-of-dawn.jpg`
6. Holiday Kickoff Market — Saturday, November 21, 2026, 10:00 AM–3:00 PM, Summit County Community & Senior Center — the new flyer

The poster uses `object-fit: contain`, width auto, max-width 100%, and height auto. On the preview it displayed at 1115×627 on desktop and 293×165 on mobile. The ratio stayed 1115/627. Production screenshots show the full flyer, including “SAT. NOV. 21 | 10 AM TO 3 PM” and “SUMMIT COUNTY COMMUNITY & SENIOR CENTER.” The image link opens the JPEG itself.

Alt text: “Holiday Kickoff Market flyer, Treetop Child Advocacy Center, Saturday, November 21, 2026, 10:00 AM–3:00 PM, Summit County Community & Senior Center.”

The card says the organizer is Treetop Child Advocacy Center and that the flyer is not a record that Bitter Buffalo Art attended or has a vendor space. No vendor list or booth detail was added. The October 5, 2026 vendor registration is still described as not a guaranteed space, and November 21 is not published as a Bitter Buffalo Art appearance.

Live recheck at 00:02 MT: both hosts returned HTTP 200 for the events page and for the JPEG. Both JPEGs were 94909 bytes and matched the SHA-256 above. Both pages contain the filename and the non-attendance sentence.

## Images corrected this pass

No existing photograph was rotated, cropped, or recompressed in this pass.

Coasters re-read at full size and left as they were:

- `01-coaster-4pc-001` — upright, no rotation
- `02-coaster-4pc-002` — already rotated 90° clockwise once in `f3df65a`; not rotated again
- `04-coaster-5pc-001` — upright, no rotation
- `06-coaster-4pc-005` — upright, no rotation
- `07-coaster-4pc-006` — already rotated 90° clockwise once in `f3df65a`; not rotated again
- `08-coaster-4pc-007` — upright, no rotation

Coasters 03 and 05 were left at the earlier upright reading from the `f3df65a` enlargement check. They were not opened again as files this pass. No public image under `cloudflare-pages/assets/images` had an EXIF orientation other than none.

Static Mischief was not rotated again. Sky Within, Grit & Grin, and Static Mischief stay on their matching Etsy listings.

The only new image is the Treetop flyer, copied rather than redrawn.

## Missing assets

- Laser ornament. Searched repository text, `origin/main` piece references, and `git log --all -- *ornament*`. No ornament photograph was found. The Laser Art page says: “No ornament photograph was recovered, so none is shown.” Homepage and laser introductory copy still mention ornaments in prose. No substitute image was added.
- Union Peak flyer. Still absent. The card already says no flyer was supplied.
- Higher-resolution camera originals of the rounds and cutting boards. The live files remain the 800×800 photographs recovered from `origin/main`.

`laser.png` and `custom.png` stay in the repository and are not referenced by public pages.

## Product links

- Twenty-five tie-dye listing URLs were left unchanged. QA accepts them.
- These two listings were opened because their size lines conflict. They were not edited:
  - https://www.etsy.com/listing/4599061887/wildfire-bramble-hand-dyed-v-neck-ruffle — title and description say Medium; the Etsy size attribute says L. Website title says Medium; website size line says L. Image `assets/images/tie-dye/etsy/4599061887.jpg`.
  - https://www.etsy.com/listing/4599062615/midnight-bramble-hand-dyed-pink-and — title and description say Large; the Etsy size attribute says M. Website title says Large; website size line says M. Image `assets/images/tie-dye/etsy/4599062615.jpg`.
- The sixteen laser Etsy URLs were verified against the photographs on 2026-10-20 and were not reopened after `f3df65a`. Four round slugs still contain “cutting-board.” The page text calls those pieces decorative rounds. The buffalo piece is the one documented as aspen. The rectangular and paddle pieces are the cutting boards. No URL was guessed or replaced.
- Photography: 53 photographs, 21 verified Fine Art America links, 32 on hold. Approved prices stay. Empty prices stay “Contact for Pricing.” Photographs without an FAA link stay “Contact to Purchase” with the artwork title. Square checkout and LumaPrints were not activated.

## Photographs left at their measured shape

These four files are 16:9 and were not cropped to 3:2:

- Small Life, Wide Silence — `assets/images/portfolio/10.jpg` — 1400×788
- Where Stone Holds the Stars — `assets/images/portfolio/18.jpg` — 1600×900
- Gold Beneath the Wild — `assets/images/portfolio/24.jpg` — 1600×900
- The Gold That Stayed — `assets/images/portfolio/37.jpg` — 1600×899

Their print pages use the native width and height with `object-fit: contain`.

## Validation

- Before the flyer edit: `python working/qa-site.py cloudflare-pages` reported 63 pages, 343 resources, 53 portfolio numbers, and no errors. `node --test working/test-contact.mjs working/test-site-chrome.mjs working/test-print-inquiry.mjs` reported 7 tests and 0 failures.
- After the flyer commit: a clean stage of `3552a6d` succeeded, and the staged JPEG matched the SHA-256. GitHub verify on the preview run and the production run succeeded. That verify step runs `qa-site.py` and `test-contact.mjs`.
- No failed test was recorded.
- No secrets or payment credentials were added.

## What this pass did not finish

- A garment-by-garment visual review for floor and clutter was not completed. No tie-dye image was replaced.
- A photograph-by-photograph comparison of all 53 images against camera originals was not completed. No photograph file was changed.
- The Sketchbook “View larger” control still does not grow Static Mischief past the dialog’s max height. The dialog fits, scrolls, and closes. It was not changed.
- A favicon request still returns 404. That predates this restoration.
- The other 32 photographs stay without an FAA link. Pinterest is not connected.

Next actions: leave the two dress sizes unchanged until the owner supplies one size for each listing; add an ornament only if an authentic photograph is found; keep the 32 FAA holds and Pinterest unpublished until each match is verified.
