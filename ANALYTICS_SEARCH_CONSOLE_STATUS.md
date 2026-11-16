# Analytics and Search Console status — 2026-11-16

Verified against property `551062294`, measurement ID `G-QHL8LRGK9H`, and Search Console property `sc-domain:bitterbuffaloart.com`. No new Google property was created. DNS was not changed.

## Production website

The live pages match this branch’s HTML except for Cloudflare’s injected email protection and beacon. `robots.txt` and `sitemap.xml` match. Production `site.js` (`?v=20261019v` on most pages, `?v=20261019priced` on photography) does not load `analytics.js`, and `https://bitterbuffaloart.com/assets/data/analytics-config.json` returns HTTP 404. The Google tag is not on the current production pages.

All ten sitemap URLs return HTTP 200, include a canonical URL on `https://bitterbuffaloart.com`, have a title and description, and do not send `noindex`. `www.bitterbuffaloart.com` returns the same page with the apex canonical.

## GA4 events in this branch

The tag is added once. `gtag('config', 'G-QHL8LRGK9H')` sends the page view. The page script does not send a second `page_view`. Local preview `http://127.0.0.1:8901` confirmed one tag and one config on photography, tie-dye, and laser art.

| Event | When it is sent | Parameters |
| --- | --- | --- |
| `page_view` | Automatic, from the single Google tag configuration | Google’s default page fields |
| `gallery_view` | Photography gallery pages | `page_path`, `gallery_subject`, `device_class` |
| `artwork_view` | A photography card is at least 55% visible, once per card | `item_id`, `product_category=photography` |
| `product_view` | A tie-dye or laser card is at least 55% visible, once per card | `item_id`, `product_category` |
| `etsy_outbound_click` | A click to Etsy | `link_host`, `page_path` |
| `gallery_print_inquiry` | Print form only after `/api/contact` reports delivery | `item_id` such as `photo-01`, `material_code`, `size_code` |
| `contact_inquiry` | Other contact forms only after confirmed delivery | `form_id`, `form_type` |
| `navigation_click` | Primary or footer navigation to this site | `destination_path`, `nav_area` |

Names, email addresses, phone numbers, postal codes, messages, and mailto values are removed before an event is sent. A blocked local contact form did not record an inquiry. These events are not yet collected on production because production does not load this script.

## Search Console

On 2026-11-16 the stored read-only token was refreshed and these calls returned HTTP 200:

- Sites get: `permissionLevel` `siteOwner`.
- Sitemap `https://bitterbuffaloart.com/sitemap.xml`: submitted 2026-11-02, downloaded 2026-11-14, 10 web URLs, 0 errors, 0 warnings. The sitemap resource reports `indexed` 0.
- URL Inspection, which is the page-level result: home, photography, sketchbook, shop, tie-dye, events, about, and contact are `Submitted and indexed`, `PASS`, `INDEXING_ALLOWED`, fetch `SUCCESSFUL`. `/laser-art/` and `/custom/` are `URL is unknown to Google`. Both return HTTP 200 and are linked from the primary navigation and footer.
- Search Analytics for 2026-10-18 through 2026-11-15: 2 clicks, 105 impressions, CTR 1.90%, average position 21.15. Pages with impressions include `/`, `/shop/`, `/about/`, `/contact/`, `/events/`, `/photography/`, plus legacy URLs `/collections/all`, `/pages/blog`, `/original-fine-art/`, and `/photography/prints/iris-under-a-broken-sky/`.

This branch adds redirects for the three legacy URLs that currently return HTTP 404: `/pages/blog` to `/`, `/original-fine-art/` to `/sketchbook/`, and `/photography/prints/*` to `/photography/`. `/collections/all` already redirects to the Etsy shop. Those new redirects are not on production yet.

## GA4 and Search Console link

The Analytics Admin API is disabled for project `bitter-buffalo-art-analytics` (project number 678077729891). The read-only token cannot see or create the Search Console link. This session did not enable the API and did not create a link.

## GA4 reporting totals

The Data API `runReport` for 2026-10-18 through 2026-11-15 returned 23 users, 26 sessions, and 47 screen page views. Those figures are historical property totals. They are not measurements from the instrumentation in this branch, because production is not currently loading it.

## Not promoted

No Cloudflare production deployment was made. The Pages production branch is `preview`. Publishing `main` would deploy this site to that branch.

At commit `356cad38a00cb9b5402c0f6c0ed8a7453f1d2bb7`, Wrangler 4.151.1 was not logged in and no `CLOUDFLARE_API_TOKEN` was available, so this session did not upload a preview. GitHub Actions had not created a workflow run for that commit. The Cloudflare, Cursor, and Vercel check suites were queued and had no deployment URL. Compare any later preview URL with `https://bitterbuffaloart.com` before merging.
