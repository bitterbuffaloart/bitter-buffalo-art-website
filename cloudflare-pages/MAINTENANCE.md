# Website maintenance guide (for ChatGPT / assistants)

Use this after Cursor access ends. Work only on the static website—not Art Builder, Trout, Lightroom, or Shopify DNS unless Clyde explicitly asks.

## Locations
| Item | Path / URL |
|------|------------|
| Local work copy | `C:\\Users\\bitte\\bitter-buffalo-website-etsy-update-2026-10-17\\cloudflare-pages` |
| Repo archive | `project-record/website-etsy-update-2026-10-17/` in BitterBuffaloArt |
| Builder script | `../working/build-static-site.js` (from cloudflare-pages) |
| Live domain (Shopify until cutover) | https://bitterbuffaloart.com |
| Cloudflare Pages preview | https://bitter-buffalo-art.pages.dev/ |
| Pages project | `bitter-buffalo-art` (account `f3ee68d66369fd4b2bc390d1dae218f6`) |
| Etsy shop | https://www.etsy.com/shop/BitterBuffaloArt |
| Git branch | `art-builder-ui-rebuild-local-2026-09-03` |

## Safe edit workflow
1. Edit `working/build-static-site.js` (preferred) or HTML/CSS under `cloudflare-pages/`.
2. Rebuild: `node working/build-static-site.js` from the migration folder.
3. Preview locally if needed (`npx serve cloudflare-pages -l 4173`).
4. Deploy: `cloudflare-pages\\deploy-preview.cmd` (requires `npx wrangler login` once).
5. Commit **only** files under `project-record/website-etsy-update-2026-10-17/`.
6. Push development branch. Do not change production DNS without approval.

## Content rules
- All purchase CTAs → verified Etsy shop URL unless an individual listing URL is independently verified.
- Do not invent event history, booth photos, or product inventory.
- Engraved aspen rounds = decorative artwork only (not food-safe / not cutting boards).
- Photography: prefer portfolio wording until print listings are verified.
- Never reintroduce Shopify cart, Free Shipping promos, Ground Builder, or Union Peaks giveaways.
- Events stays a top-level nav item (calendar + vendor record).
- Hero SVG editable source: `working/assets/hero-highcountry.svg` (copied to `assets/images/`).

## Contact / custom-order forms
Original system = Shopify theme contact forms (`form_type=contact`) on `/pages/contact` and laser intake.
While Shopify hosts the live store, static forms POST to `https://bitterbuffaloart.com/contact`.
Cloudflare-only delivery (after cutover): set Pages secrets `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` and wire `functions/api/contact.js`.
Do not commit API keys. Reference photo upload was never enabled on the original Shopify Forms block.

## Navigation (canonical)
Home | Photography | Shop | Tie-Dye | Laser Art | Custom Art | Events | About | Contact | Shop Etsy

## Hard restrictions
No production DNS changes, Shopify cancel, PREVIEW2 publish, Worker deletion, Lightroom/archive edits, or unrelated art-builder changes unless Clyde authorizes.
