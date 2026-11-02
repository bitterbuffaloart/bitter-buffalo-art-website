# GA4 R01 — production deployment verification

Verified 2026-11-02. The owner-approved GA4 property **551062294**, measurement ID **G-QHL8LRGK9H**, is live at https://bitterbuffaloart.com.

Deployed source commit: `9d8cd7eb672dde7ef1a492ab7913f5388b78f8b6` on `cursor/ga4-production-r01`. Cloudflare production branch remains `preview`; production deployment `4283aa07-6ef7-44cd-bd0f-39547e5bdb66` completed at 16:11:20 UTC. The prior canonical deployment is `a0dcf374-49d2-4cdf-ba6b-37694049ae7b`, source `6fa20603b063af86816d4b9c5388bc2da1db41c8`. DNS and project settings were not changed.

## Approved scope

Exactly three runtime files changed: `assets/js/analytics.js`, `assets/data/analytics-config.json`, and a nine-line analytics loader appended to `assets/js/site.js`, all under `cloudflare-pages/`. The analytics files and loader come from the verified development implementation `78bb61fac4cb0c8d8f60ab6e0a82c5e694532940`; unrelated photography, dashboard, Etsy, FAA and Search Console work was excluded. No image, gallery HTML, navigation, price, artwork, Function source or integration setting changed. The existing Cloudflare Web Analytics beacon remains separate from the single Google tag.

This session created isolated candidate `618a5d69`, pushed the prepared source commit, and observed that another production publication of that exact approved SHA completed during preflight. It therefore verified the existing successful production deployment without publishing a duplicate. No main-branch merge was performed.

## Verification

- Source QA: 107 HTML pages, 518 referenced/public resources, zero source errors; approved analytics unit tests pass; mocked contact tests pass without sending email.
- Live readback: **519/519 public files match** the deployed source. Images and other binary files compare byte-for-byte. HTML comparison explicitly accounts for Cloudflare's injected Web Analytics/JSD scripts, decoded email protection and repeated blank lines; text line endings normalize to LF. Initial transient HTTP 500 responses resolved on bounded retries.
- Homepage, photography landing and wildlife page retain identical visible text, navigation and image sources. Home and wildlife screenshots are pixel-identical; the photography screenshot has small rendering variations and is not reported as pixel-identical.
- **Seven live interaction checks pass**. Google loads once and configures once per page, including repeated initialization. `/photography/all/` advances from Page 1 to Page 2 of 7 with 12 of 84 photographs, and its image viewer opens, zooms and closes. Paging/viewer use sends no extra app page view or gallery view.
- Live `page_view`, `gallery_view` and mobile `artwork_view` requests use the approved measurement ID and receive **HTTP 204**. Mobile print navigation works with no horizontal overflow.
- Empty contact input returns JSON **HTTP 400** after deployment, with no email sent. Functions remain enabled and compatibility date remains 2026-10-17.
- **Google Analytics Realtime/DebugView is not verified.** No authenticated UI session or Data API token was available. Collector acceptance is not proof of processing in the property. No new property, account connection or credential was created.

Two initial browser assertions were incorrect (status lookup and an assumed zoom factor). The harness was corrected and rerun against unchanged runtime code; `INITIAL_HARNESS_FAILURE.json` preserves that result.

## Reproduce

Use a clean checkout of the deployed source plus this documentation commit. Run `node working/stage-site.mjs` once, then `node working/ga4-deployment-r01/test_analytics.mjs` and `python3 working/ga4-deployment-r01/verify_public_files.py https://bitterbuffaloart.com /tmp/ga4-readback.json`. The file checker makes read-only GET requests. Its `--retry-failed` option preserves the prior failing report.

For browser checks, start a separate headless Chromium with a temporary profile and DevTools on 127.0.0.1:9244, then run `node working/ga4-deployment-r01/verify_browser.mjs production-interactions https://bitterbuffaloart.com /tmp/ga4-browser-checks`. It creates test analytics traffic, tests local browser controls and submits no forms or purchases. Stop the isolated browser when done. Do not run concurrent navigation checks against the same DevTools page.

`PUBLIC_FILE_READBACK.json` records every source/readback hash. `SOURCE_SCOPE_MANIFEST.json` records the exact code diff. `BROWSER_INTERACTIONS.json` and `DEPLOYMENT_VERIFICATION.json` record accepted events and the remaining access limitation. No raw visitor client IDs, OAuth credentials or customer data are included.

Owner follow-up: view this property's Realtime or DebugView using an authorized Google account to confirm ingestion. No further publication is needed to enable the tag. Any rollback or subsequent website change requires its own scoped instruction.
