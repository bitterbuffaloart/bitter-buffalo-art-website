# Website maintenance

Work only in bitterbuffaloart/bitter-buffalo-art-website on main.
The authoritative source is cloudflare-pages/. Edit its existing HTML/CSS/JS directly.
The legacy working/build-static-site.js would overwrite subsequent fixes; do not run it.
Do not use Art Builder branches, archives, or project-record paths for website commits.

Validate using working/qa-site.py and working/test-contact.mjs, then package with
working/stage-site.mjs in a clean checkout. Commit explicit website paths only.
Actions checks content and contact behavior, deploys a unique qa-<commit> candidate,
and compares all public pages/assets before optional working-preview publication.

Keep all approved artwork and photography bytes intact. Use only existing web images;
do not open or edit Lightroom, original photography, Art Builder, or Photo Culler.
All Etsy purchase links go to the verified shop home until individual listing IDs
are verified. The 33 photographs remain portfolio previews, not purchasable listings.
Never invent event history or confirmed appearances. Aspen rounds are decorative art.

Contact failures retain all entries and offer an explicit email draft. Website sending
requires RESEND_API_KEY, CONTACT_TO_EMAIL and CONTACT_FROM_EMAIL in Pages runtime settings.
No keys in Git. No real email delivery is proven by mocked tests. No paid services.
Keep direct email available. Never claim success after a provider rejection.

No DNS changes, live Shopify theme publishing or cancellation without explicit authority.
Follow ../DOMAIN_CUTOVER_CHECKLIST.md only after the outstanding gates pass.
