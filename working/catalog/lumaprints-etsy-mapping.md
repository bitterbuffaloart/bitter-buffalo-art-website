# Etsy and LumaPrints mapping

No Etsy listing was created, edited, or deleted. No LumaPrints account was reconnected. No authenticated LumaPrints or Square call was made. The four Pages names `LUMAPRINTS_API_KEY`, `LUMAPRINTS_API_SECRET`, `LUMAPRINTS_ENVIRONMENT`, and `LUMAPRINTS_ADMIN_TOKEN` are MISSING on Preview and Production. Previously exposed credentials are not reused.

## What the public API document shows

`GET /api/v1/stores` is documented at https://api-docs.lumaprints.com/api-5384565.md (read 2026-10-19). The description says the call retrieves Standard Stores and that only a Standard Store can be used to submit an order. The response fields shown are `storeId` and `storeName`. That page does not mention Etsy, a listing, a variant, or a configuration.

This session did not confirm a vendor rule that one Etsy listing can hold only one mapped configuration. It also did not confirm that Etsy variant sync is supported. Those claims stay unresolved until a replacement credential can call the API, or until LumaPrints documents the Etsy mapping.

## Local size records

The sale product is premium 1.5-inch framed canvas at 12×18, 16×24, and 20×30. `cloudflare-pages/functions/prints/catalog.mjs` keeps three Grand Tetons records. Each has `lumaprintsSubcategoryId: null`. None is `lumaprints_confirmed`.

| Size | Local configuration | Retail | LumaPrints |
| --- | --- | --- | --- |
| 12×18 | `bb-photo-01-12x18-canvas-15` | not confirmed | not confirmed |
| 16×24 | `bb-photo-01-16x24-canvas-15` | $199.33 owner-confirmed | not confirmed |
| 20×30 | `bb-photo-01-20x30-canvas-15` | on hold | not confirmed |

`selectCanvasMapping` still returns `readyToSubmit: false` and `optionIds: []`. A floating-frame subcategory id, frame finish, frame choice, foamcore, backing, hanging hardware, and wire are unresolved. The catalog importer refuses `lumaprints_confirmed=yes`, so a local edit cannot mark a variant confirmed.

The earlier subcategory 101003, “1.50in Stretched Canvas,” is a prior unframed quote. It is not the framed product. Its option ids (mirror wrap 2, black backboard with hanging wire 7, foamcore 10) stay on that unframed quote only.

## Framed fine-art paper correction

A sibling SKU sheet outside this repository labeled a Grand Tetons row `traditional_luster_glossy` / “Traditional Photo — Semi-Gloss / Glossy” while the supplier product text was fine-art paper, semi-gloss. Traditional photo paper and fine-art paper are different products. Fine-art paper does not inherit the canvas options or subcategory 101003. No framed fine-art paper subcategory was returned by the API in this session, so the paper rows in the pricing master stay unconfirmed worksheet records.

## Safest local alternative

Three sizes stay as local records on the existing Grand Tetons page and in the pricing master. They are not published as extra Etsy listings. The website still links only to `https://www.etsy.com/shop/BitterBuffaloArt`. Listing ids already written in the catalog are `recorded-not-reverified` and are not turned into listing URLs.

If LumaPrints later allows only one configuration on one listing, the local records are already separate. Connecting any of them still requires a replacement credential and an API response for that exact frame, finish, backing, foamcore, hardware, and wire set.
