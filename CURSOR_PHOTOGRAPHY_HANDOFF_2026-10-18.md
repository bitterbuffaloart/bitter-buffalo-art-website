# NEW Cursor project — Bitter Buffalo Etsy Launch
Date: 2026-10-18, America/Denver
Owner instruction: Cursor restores the correct photographs and builds Etsy listings; ChatGPT writes the photograph names and stories from the actual images. Create a separate Cursor workspace for this task; the other Cursor project is working on Photo Culler and must continue independently.

## Roles and shared source
- Cursor: local original-photo lookup, verified web exports, website implementation, Etsy draft assembly, checkpoints.
- ChatGPT: review the actual photos, write suggested artistic titles and truthful story descriptions, and return structured copy keyed by the existing rank.
- Shared repository: bitterbuffaloart/bitter-buffalo-art-website.
- New, separate Cursor project/workspace: C:\Users\bitte\bitter-buffalo-etsy-launch. Create it if absent; otherwise inspect and resume its checkpoints. Keep its code, editorial data, and export scripts independently backed up with Git. Keep credentials and full-resolution print masters out of public Git.
- Existing website is an integration destination, not the workspace to use for Photo Culler. Reuse the website repository for bounded website changes when the photo assets and copy are verified. Inspect the existing local website checkout if present at C:\Users\bitte\bitter-buffalo-website-etsy-update-2026-10-17; preserve uncommitted work.
- Photo folder recorded in existing project: C:\Users\bitte\OneDrive\Desktop\Portfolio for Etsy.
- Read WEBSITE_UPDATE_STATUS_2026-10-17.md, NEXT_ACTION.md, working/final33-portfolio.json, the existing Phase 5/Etsy/LumaPrints records in the Windows photo folder, and any applicable AGENTS.md before work.

## Current verified baseline
- Website repair merged in d3fcfe081ac0401b94b263fb92298efb213fbf64 (PR #3).
- Deploy run 39134002269 passed: 9 pages, 55 resources, 31 existing Etsy product images, 0 errors.
- Photography page currently renders 11 real exports: ranks 01, 02, 09, 10, 11, 18, 21, 24, 30, 31, 32. Browser verified all 11 loaded.
- The manifest retains all 33 records. The other 22 entries have image_kind=placeholder_no_jpeg_export and empty source paths. They are hidden from the public gallery until real matching photos are available.
- Gallery closing markup and stray footer text were repaired. Preserve that repair.
- Existing apparel, laser, and painting galleries and links are completed work; retain them.

## Phase A — restore the correct photographs now
1. Open/create the separate C:\Users\bitte\bitter-buffalo-etsy-launch project. Inspect its files and checkpoints first. Leave the separate Photo Culler project and all its running processes alone. Retrieve the shared website records and this handoff, preserving any local changes; no reset, force-push, competing Photo Culler worker, or legacy whole-site rebuild.
2. Inspect the recorded Desktop Portfolio for Etsy folder and its existing Phase 5 records. Locate the actual ranked originals/exports for all 33, prioritizing the 22 missing ranks. Existing records and established rank mappings are the authority; filenames alone are not proof of identity when ambiguous.
3. If a source is unavailable locally, check whether the OneDrive file is online-only. Report its exact status/path rather than claiming it is missing globally. Do not invent replacement images or select a different photograph to fill a slot.
4. Export appropriate sRGB web derivatives from the matching existing image files with preserved aspect ratios and no new creative edit/crop. Website derivatives may replace only their known placeholder derivative at cloudflare-pages/assets/images/portfolio/NN.jpg. Keep all originals and print masters unchanged. Do not use small website JPEGs as print masters.
5. Update a manifest record to web_from_jpeg only after checking the source identity and the actual decoded export. Record the source path, dimensions, export path, byte size, and SHA-256. A source and resized derivative normally have different hashes; do not claim they should match. Hash byte-for-byte copies independently where applicable.
6. Restore each verified image to the public gallery with its original rank. Use its actual dimensions. Keep Maroon Bells Reflection first. Retain pending status for anything unresolved.
7. Do not run working/build-static-site.js across the whole website: it predates some of the completed gallery edits. Make bounded changes to the current committed site and relevant generation logic only.
8. Run the existing QA/contact mock/staging checks and normal GitHub deployment workflow. Verify actual image display, aspect ratios, navigation, and print-format layout; HTTP 200 alone is not photo verification.

## Phase A return package for ChatGPT
Keep launch-project work and checkpoints in the separate launch workspace. Commit the following small editorial handoff artifacts to this shared website repository so ChatGPT can read them (web-sized previews only; no print masters or credentials):
- working/photography-editorial-review.json: all 33 ranks, current title, source match status, web asset path, original/print dimensions, derivative dimensions and SHA-256, available Etsy draft/listing ID if any, verified factual location/subject notes, and exact blockers. Do not include credentials.
- A readable numbered contact sheet from the actual restored photographs, split into manageable pages if needed. Keep rank numbers visible. Include individual web-image paths so ChatGPT can inspect each photograph.
- A checkpoint containing actual restored count, unresolved ranks, checks, deployment URL and run ID, and any remaining blocker.
Use current titles as provisional labels. Do not invent a personal backstory, date, location, or owner experience.

## Phase B — ChatGPT supplies editorial copy
When the return package is committed, the owner returns to ChatGPT with the completion note. ChatGPT reads the committed photos/contact sheet and writes:
- rank and unchanged asset identity;
- suggested artistic title plus Etsy search-oriented title;
- short story paragraph grounded in the visible photograph;
- listing description and suggested tags;
- explicit factual gaps rather than invented claims.
Save the result as working/photography-listing-copy.json keyed by rank for Cursor to consume. Cursor preserves any owner-approved existing name/story and flags a conflict rather than silently replacing it.

## Phase C — Cursor builds Etsy drafts
- Use the returned editorial JSON and existing approved Phase 5 product, pricing, material, fulfillment, sizing, and shipping records. Inspect current Etsy drafts/live listings first and update matching records rather than creating duplicates.
- Use the proper full-resolution print source for the product, not the website derivative.
- Preserve the agreed edition rule: 66 signed/numbered collector prints total per photograph across all sizes/materials, with COA and signing photograph; unsigned prints are open editions.
- Acrylic face-mount is future-only unless a verified supplier/product/price is present. Do not invent unavailable variants, stock, delivery promises, prices, shipping weights, or supplier integration status.
- Build Etsy drafts for review. Publication of newly prepared photography listings is a separate step after correct photos, copy, product options, pricing, and fulfillment are verified.
- Return actual draft IDs/URLs, matched source rank, assets used, completed fields, and missing fields. Only link the website to a product URL after its live publication is verified.

## Boundaries
- Leave C:\Users\bitte\bitter-buffalo-ai-photo-culler, all of its workers, F:\Masters, F:\Portfolio, all source photographs, Lightroom, ratings, and completed analysis untouched. Do not stop or repurpose the other Cursor project.
- No deletion/moving/overwriting of original photographs. No DNS change, Shopify cancellation, new subscription, credential change, or extra account creation.
- Contact email request remains bitteebuffalophoto@gmail.com. Prior Cloudflare dashboard access was denied by the browser origin gate. Do not treat this document as permission to bypass that gate. Record contact setup separately from the photography work.
- Never claim a photograph is restored, an export is full-resolution, a draft exists, or a deployment works without direct evidence.
