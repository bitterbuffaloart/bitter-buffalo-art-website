# Bitter Buffalo Art — SEO & Pinterest audit, October 20, 2026

## Completed on branch `cursor/photography-storefront-pilot-3433`
- Added specific SEO titles and search descriptions to ten top-level website pages.
- Added Open Graph preview images and large-image sharing metadata to those pages.
- Added homepage Organization structured data with the studio's verified locality.
- Optimized the 53 photograph detail pages with unique titles and story-derived descriptions.
- Removed each detail page's `noindex` directive; they were already present in the sitemap.
- Added `cloudflare-pages/pinterest-feed.xml` containing twelve curated, original photographs, with individual same-domain links and preview JPEGs.

## Kept unchanged
All original artwork titles, photographs and image bytes, artist stories, print-format eligibility, retail prices, Etsy products/links, and checkout settings. No Square/LumaPrints/FAA fulfillment connections have been changed.

## Outstanding setup (not automated by the GitHub commit)
1. Run website QA on this updated source branch. Confirm preview content and asset loads, then publish from the latest safe branch without reverting any existing site changes.
2. Confirm the 53 photo detail pages are now indexable on the live domain and the sitemap is submitted to Google Search Console.
3. Use a Pinterest **Business** account and claim `bitterbuffaloart.com`. Pinterest gives you a verification tag or DNS record; do not invent one.
4. In Pinterest Settings > Import Content or Create Pins in Bulk > RSS feed, enter `https://bitterbuffaloart.com/pinterest-feed.xml` and select the public target photography board. The feed must be published before linking.
5. Pinterest can automatically create Pins when feed items are new; do not add the same items again and again. Add new portfolio entries to this feed as new artwork is published.
6. Your existing Metricool brand currently links Facebook and Instagram, not Pinterest. Connect the Pinterest business account in Metricool to schedule additional original Pins and view analytics.
7. When a Fine Art America checkout is truly verified, update inquiry-only/no-payment copy and add tested sales links separately. Do not advertise checkout yet.

## Important SEO notes
Google does not use the deprecated meta-keywords tag for ranking. Accurate titles, copy, indexing, relevant image alt text, page links, and site analytics matter more. Avoid changing creative names or inventing landmark locations not documented in each photograph's story. SEO changes cannot guarantee rankings or orders.

## Verification limitations
Changes to the connected GitHub branch are not proof of live deployment. Cloudflare configuration and Pinterest authorization must be checked separately.
