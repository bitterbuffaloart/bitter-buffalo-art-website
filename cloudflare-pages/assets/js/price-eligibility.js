(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BBPrices = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const PUBLIC = {
    "canvas-floating-15": {
      label: "framed canvas",
      sizes: { "12x18": "12\u00d718", "16x24": "16\u00d724", "20x30": "20\u00d730" },
    },
    "metal-aluminum": {
      label: "aluminum metal",
      sizes: { "12x18": "12\u00d718", "16x24": "16\u00d724", "20x30": "20\u00d730" },
    },
    "paper-archival": {
      label: "archival matte",
      sizes: { "12x18": "12\u00d718", "16x24": "16\u00d724", "20x30": "20\u00d730" },
    },
  };
  const PRODUCT_ORDER = ["canvas-floating-15", "metal-aluminum", "paper-archival"];
  const SIZE_ORDER = ["12x18", "16x24", "20x30"];
  const SUBJECTS = [
    { name: "Landscapes", slug: "landscapes" },
    { name: "Wildlife", slug: "wildlife" },
    { name: "Waterscapes", slug: "waterscapes" },
    { name: "Night Skies", slug: "night-skies" },
    { name: "Historic/Rural", slug: "historic-rural" },
    { name: "Desert/Rock", slug: "desert-rock" },
  ];
  const PAIRS = [
    ["Still Standing, Still Flowing", "The Night Keeps Watch"],
    ["Where the Fence Meets the Trees", "The Tree That Leans Into the Wind"],
  ];

  function pricedPublicOffers(photo) {
    if (!photo || !Array.isArray(photo.sizes)) return [];
    const offers = [];
    for (const productId of PRODUCT_ORDER) {
      const spec = PUBLIC[productId];
      for (const sizeId of SIZE_ORDER) {
        const size = photo.sizes.find((item) => item.productId === productId && item.sizeId === sizeId);
        if (!size || size.status !== "priced" || size.publicOffer === "omitted" || !size.priceText) continue;
        if (!spec.sizes[sizeId]) continue;
        offers.push({
          productId,
          sizeId,
          priceText: size.priceText,
          label: spec.sizes[sizeId] + " " + spec.label + " " + size.priceText,
        });
      }
    }
    return offers;
  }

  function unknownSubjects(names) {
    const known = new Set(SUBJECTS.map((item) => item.name));
    return (names || []).filter((name) => !known.has(name));
  }

  function separatePairs(items) {
    const list = items.slice();
    let guard = 0;
    while (guard < list.length + 2) {
      guard += 1;
      let moved = false;
      for (const pair of PAIRS) {
        const i = list.findIndex((item) => item.name === pair[0]);
        const j = list.findIndex((item) => item.name === pair[1]);
        if (i < 0 || j < 0 || Math.abs(i - j) !== 1) continue;
        const later = Math.max(i, j);
        if (later >= list.length - 1) continue;
        const item = list[later];
        list.splice(later, 1);
        list.splice(later + 1, 0, item);
        moved = true;
      }
      if (!moved) break;
    }
    return list;
  }

  return {
    PUBLIC,
    SUBJECTS,
    pricedPublicOffers,
    unknownSubjects,
    separatePairs,
  };
});
