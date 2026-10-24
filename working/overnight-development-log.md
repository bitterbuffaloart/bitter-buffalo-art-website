# Overnight development log — 2026-10-24

Local website work only. Nothing in this log was published to Etsy or to bitterbuffaloart.com.

## Verified

- Camera archives for the nine source photographs already existed. Each archive hash matched the phone file. None was overwritten.
  - `20261023_163922.jpg` `e43baf438ae7620b9728986e104a69e06910f6f3506d87d2af280922cb300b3e`
  - `20261023_163743.jpg` `11aadb4d5d58110c7f98692e12e2819589db67d54de167ab065d755b4cb97d8c`
  - `20261023_144135.jpg` `cf6ec091f411e933e7daaa24ec761881141d2e2933f1c6720c6665c0e26a0d9b`
  - `20261023_163443.jpg` `011369472758d32980273e9b13905be0d4fde58e7305e98a2db45a08d7781cf7`
  - `20261023_164130.jpg` `cbf53b5ec9b62fafa2b3025df481f9781a99b8d43c53c84cb22b35aa17bb285e`
  - `20261021_170417.jpg` `244ebb3209607e905983fa1e94a71969604c679fbb512e4d6560b50bda699d46`
  - `20261021_170512.jpg` `ede0f788f8c8536698fc9553d575ada31aa0bf00262f0c0fb7ad5a90391aca3e`
  - `20261021_165923.jpg` `6cbb82414f9f47e40f0213c5072e40f5727b08fac7903d716758774efbd3caaf`
  - `20261021_165956.jpg` `c2e28f85f9dfcaee93b44eb2e554ec4c656e8333f1d1d6633a14e0870e57a72b`
- Painted wood panel crop is now `(148, 1036, 3868, 2926)` on the oriented 4000×3000 frame. Poster pixels end at y=1036. The panel stays dark through about y=2924. Public display is 1400×711 and shows the panel edge, face, teeth, and side marks. The wall poster and the object under the panel are outside the frame.
- The other heroes were inspected as full photographs. Canvas or wood edges are visible, with table or cloth around them. The mandala's top notch is the object, not a crop. None of those heroes was recropped.
- Git `801ca2b` catalog: 107 products, 16 laser. Working catalog: 109 products, 18 laser. Added only `bb-resonance-in-eight-dimensions` ($199.33) and `bb-architecture-of-infinity` ($199.99). The original 16 laser IDs are still present. `products.csv` still has 8 laser rows because that file is the coaster import, not the live catalog.
- Original Fine Art holds five records. Sale pieces are quantity one, with no Etsy URL: Mycelial Delirium $93.33, Chromatic Rupture $133.33, The Unquiet Interior $166.66, Fragments of the Unconscious $166.66. The Anatomy of Unreason is `saleable: false`, private collection, and has no purchase link.
- Image files for those paintings stay in `cloudflare-pages/assets/sketchbook/`. The Sketchbook list still has the earlier drawings, the three already-listed paintings, and The Color Between Worlds.
- Laser page in the local preview shows the existing pieces as Buy on Etsy and the two new pieces as Inquire. Those inquiry URLs are `/contact/?topic=custom&piece=...`. They are not Etsy listing URLs.
- Contact for Mycelial Delirium opens the general form with the message prefilled `Inquiry: Mycelial Delirium`. The laser intake tab is not the selected form.
- `python working/qa-site.py cloudflare-pages` and the same check on `.site-build/public`: 107 pages, 0 errors. `node working/seo-check.js` passed. Node tests: 28 passed, 0 failed (`test-gallery-regressions`, `test-site-chrome`, `test-import`, `test-print-inquiry`, `test-print-storefront`, `test-contact`).
- Local preview used for the checks: `http://127.0.0.1:8877/`.

## Full-size viewer, local preview 2026-10-24

- Live site before this repair: Sketchbook works including The Color Between Worlds, The Sky Within, Grit & Grin, and Static Mischief were visible. Original Fine Art and the two new laser pieces were not on production. Tie-dye photographs were not controls; the only control on each garment was Buy on Etsy.
- The shared viewer is `window.BBLightbox` in `cloudflare-pages/assets/js/site.js`. The photograph fills the stage with `object-fit: contain`, so the first view shows the whole image without stretching. Zoom, pan, previous, next, close, keyboard, and pointer controls are in that file. A logo sits over the stage at 18% opacity. That mark does not stop screenshots or downloads.
- Local preview `http://127.0.0.1:8877/` after `?v=20261024` on the stylesheet and scripts:
  - Original Fine Art: five works. Mycelial Delirium opened `/assets/sketchbook/zoom/mycelial-delirium.jpg` (1800×2400) fitted inside the stage. Zoom reached scale 1.4. Next opened Chromatic Rupture. The Anatomy of Unreason had no purchase link.
  - Tie-dye: clicking the first garment stayed on `/tie-dye/` and opened `/assets/images/tie-dye/etsy/4596278804.jpg`. Buy on Etsy remained a separate link to the existing listing. On a 390×844 viewport the garment fit inside the stage.
  - Sketchbook: the seven existing titles were present, including the four named above. The Color Between Worlds opened its large file and kept Inquire separate from the photograph.
  - Laser Art: 16 Buy on Etsy links plus Inquire for Resonance in Eight Dimensions and Architecture of Infinity. Resonance opened the large file and a detail thumbnail at `/assets/images/products/details/resonance-in-eight-dimensions.jpg`.
  - Photography: the featured grid opened `/assets/images/portfolio/large/01.jpg` and kept the Fine Art America link separate. The print page for The Sun Breaks Over the Peak opened `portfolio/large/87.jpg` (1600×1068) fitted at 1179×787 inside an 1179×867 stage. Contact to Purchase stayed a separate link.
- Screenshots: `working/gallery-viewer-2026-10-24/original-fine-art-lightbox-desktop.png` and `working/gallery-viewer-2026-10-24/tie-dye-lightbox-mobile.png`.
- Checks after the viewer: `python working/qa-site.py cloudflare-pages` and `.site-build/public` both reported 107 pages and no errors. `node working/seo-check.js` passed after its expected header was aligned with the existing ten-item navigation. Node tests for gallery, chrome, import, contact, and print files passed.
- Asset URLs use `?v=20261024` so a browser that cached the older `site.js` loads this viewer. `/assets/js/*` and `/assets/css/*` revalidate.

## Not published

- No Etsy listing was created. There is no seller listing API in this session, so no listing ID or URL was invented.
- Cloudflare Pages was not deployed. `working/stage-site.mjs` prepared `.site-build` after the previous staged folder was moved aside to `.site-build-previous`. Deploy still requires a commit SHA and an isolated `qa-` branch. That deploy was not run.

## Guardian

- Windows has no process with PID 9694.
- `F:\Guardian Master\guardian-two-pass.log` kept writing vision results during this work, from about `VISION OK 72` at 08:06 UTC through `VISION OK 126` at 08:11 UTC.
- `F:\Guardian Master\Reports\Guardian Status.json` was last written `2026-10-24T05:46:47+00:00`: 77,247 files, vision ok 7,580, pending 69,401, error 266.
- `python.exe` PID 83356 was running. Its command line was not readable from this session. No Ollama process was visible by name. Neither process was stopped. A local preview that had bound port 8765 was stopped because that port is already used by Guardian Morph Deck. The photo scanner and Ollama were not given a stop, restart, or write.

## Outstanding blockers

- Etsy seller drafts for the six sale pieces do not exist yet. Quantity stays one, and the website stays on inquiry until a real listing URL is checked.
- The live site and the working preview were not updated with this collection.
- Titles are still working titles. Dimensions were not remeasured. Paint brand, finish, hanging hardware, weight, year, and shipping size remain unconfirmed.
- Guardian PID 9694 is not the process writing the vision log on this Windows session. The scanner itself is still advancing.
