# Sitewide restoration report

Checked 2026-10-21 00:32 Mountain Time. The public site is not finished.

## Production

- Site: https://bitterbuffaloart.com and https://www.bitterbuffaloart.com
- Events: https://bitterbuffaloart.com/events/ and https://www.bitterbuffaloart.com/events/
- Laser Art: https://bitterbuffaloart.com/laser-art/
- Live content commit: `95ee113` (2026-10-21 00:21:05 MT), “Replace the overalls photo that showed the floor.”
- The Treetop flyer file is still the accepted `3552a6d` JPEG. It was not redrawn. Both public hosts still return 94909 bytes and SHA-256 `850be805812324a1d5f95d001d0caff5a815273aacb37c56849ac8e5c489b2fc`.
- Overalls preview: https://b6c6aaf9.bitter-buffalo-art.pages.dev from run https://github.com/bitterbuffaloart/bitter-buffalo-art-website/actions/runs/39555029771.
- Overalls production run: https://github.com/bitterbuffaloart/bitter-buffalo-art-website/actions/runs/39555552953. publish-production succeeded at 00:28:35 MT.
- The earlier flyer production run remains https://github.com/bitterbuffaloart/bitter-buffalo-art-website/actions/runs/39552095571 for `3552a6d`.
- Laser Art content remains `f3df65a`. Its production run was https://github.com/bitterbuffaloart/bitter-buffalo-art-website/actions/runs/39542726670.
- DNS, Square, and LumaPrints were not changed.

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

On 2026-10-21 the full files for coasters 03 and 05 were opened. Both are upright and were not rotated. No EXIF orientation tag is set.

- `03-coaster-4pc-003.jpg` — 1600×1200. Four bison skulls, horns up, trees growing upward. Thumb is the same orientation.
- `05-coaster-4pc-004.jpg` — 1200×1600. Trees grow upward, the bison skull is horns-up, and the Sri Yantra points up. Thumb is the same orientation.

Static Mischief was not rotated again. Sky Within, Grit & Grin, and Static Mischief stay on their matching Etsy listings.

## Tie-dye visual pass

All 25 published listing photographs were opened. Each garment is upright, on a sheet or plain backdrop, and shows the piece rather than a floor. None was replaced. Wildfire Bramble (`4599061887.jpg`) and Midnight Bramble (`4599062615.jpg`) sizes were not changed. The edited files in `OneDrive\Desktop\New folder` are not the same frames as those 25 listing photographs.

The studio lace top, `lace-top-display.jpg`, is the lace side from `20260630_125720.jpg`. Its related view, `20260630_130013.jpg`, is the plain spiral side of the same top. The published lace photograph is fully visible and was left as it is. `tie-dye.jpg` is a flat shirt with the collar at the top and was left as it is.

One garment was replaced:

- Published file: `assets/images/tie-dye/overalls-display.jpg`, plus `overalls-thumb.jpg` and `overalls-large.jpg`
- Problem: the camera photograph `20260630_124345.jpg` included the hardwood floor and a person’s feet
- Replacement source: `20260630_124345_edited.jpg`, the same front, 2189×3000, background already removed
- New sizes: display 1167×1600, thumb 350×480, large 1751×2400
- The reverse, `20260630_125013.jpg`, stays the other side and was not published as a second product

Live check at 00:32 MT: both https://bitterbuffaloart.com/assets/images/tie-dye/overalls-display.jpg and the www host return 132650 bytes, matching the commit. Desktop and mobile cards show the full front, straps up, with no floor. `object-fit` is contain.

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

On 2026-10-21 each of the 53 published displays was compared with its approved original after EXIF orientation was applied. The thumbnail and the enlarged file were compared with the display. All 53 matched rotation 0, and the display aspect stayed within 0.03 of the original. No photograph file was changed. The 21 FAA links and the 32 holds were not changed. Small Life, Wide Silence had the smallest numeric margin because most of the frame is blank sky; the published file shows the bird upright on the wire, so it was left 16:9.

## Validation

- Before the flyer edit: `python working/qa-site.py cloudflare-pages` reported 63 pages, 343 resources, 53 portfolio numbers, and no errors. `node --test working/test-contact.mjs working/test-site-chrome.mjs working/test-print-inquiry.mjs` reported 7 tests and 0 failures.
- After the flyer commit: a clean stage of `3552a6d` succeeded, and the staged JPEG matched the SHA-256. GitHub verify on the preview run and the production run succeeded. That verify step runs `qa-site.py` and `test-contact.mjs`.
- No failed test was recorded.
- No secrets or payment credentials were added.

## Validation for the overalls change

- `python working/qa-site.py cloudflare-pages` reported 63 pages, 343 resources, 53 portfolio numbers, and no errors.
- `node --test working/test-contact.mjs working/test-site-chrome.mjs working/test-print-inquiry.mjs` reported 7 tests and 0 failures.
- A clean stage of `95ee113` succeeded. The staged flyer still matched SHA-256 `850be805812324a1d5f95d001d0caff5a815273aacb37c56849ac8e5c489b2fc`.
- GitHub verify succeeded on the preview run and the production run. No failed test was recorded.

## What remains unfinished

- The Sketchbook “View larger” control still does not grow Static Mischief past the dialog’s max height. The dialog fits, scrolls, and closes. It was not changed.
- A favicon request still returns 404. That predates this restoration.
- The other 32 photographs stay without an FAA link. Pinterest is not connected.
- No ornament photograph has been found.

Next actions: leave the two dress sizes unchanged until the owner supplies one size for each listing; add an ornament only if an authentic photograph is found; keep the 32 FAA holds and Pinterest unpublished until each match is verified.
