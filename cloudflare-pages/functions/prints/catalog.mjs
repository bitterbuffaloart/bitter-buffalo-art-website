/** Grand Tetons pilot. Prices and sizes come from verified records only. */
export const PHOTOGRAPH = {
  photographId: "bb-photo-01",
  rank: 1,
  title: "Grand Tetons",
  slug: "grand-tetons",
  displayImage: "/assets/images/portfolio/01.jpg",
  sourceFile: "DSC_2626-Edit-no water mark.jpg",
  sourcePixels: { width: 5746, height: 3831 },
  masterRef: "bb-photo-01-dsc-2626",
  masterReady: false,
};

const SALE_PRODUCT = "premium 1.5-inch floating-frame canvas";
const FRAMED_COST_PROVENANCE = "Framed production cost, finishes, frame choices, foamcore, backing, wire, and shipping are unverified until a later sandbox call with replacement credentials.";

const SHARED_BLOCKERS = [
  "lumaprints_subcategory_unresolved",
  "lumaprints_options_unresolved",
  "shipping_cost_unverified",
  "processing_fee_unverified",
  "tax_unverified",
  "upgrade_costs_unverified",
  "print_master_not_in_protected_storage",
];

function priorUnframedQuote({ baseCents, foamcoreCents, sumOfReturnedLinesCents }) {
  return {
    role: "prior-unframed-quote",
    selectedProduct: false,
    subcategoryId: 101003,
    subcategoryName: "1.50in Stretched Canvas",
    baseCents,
    optionLines: [
      { optionId: 2, name: "Mirror Wrap", cents: 0 },
      { optionId: 7, name: "Black Backboard backing with hanging wire installed", cents: 908 },
      { optionId: 10, name: "Foamcore Underlayer", cents: foamcoreCents },
    ],
    sumOfReturnedLinesCents,
    provenance: "Prior unframed quote from the LumaPrints sandbox POST /pricing/products for subcategory 101003. Not the selected sale product.",
  };
}

export const CONFIGURATIONS = [
  {
    configurationId: "bb-photo-01-12x18-canvas-15",
    photographId: PHOTOGRAPH.photographId,
    label: "12×18",
    saleProduct: SALE_PRODUCT,
    lumaprintsSubcategoryId: null,
    widthIn: 18,
    heightIn: 12,
    retailCents: null,
    productionBaseCents: null,
    productionBaseProvenance: FRAMED_COST_PROVENANCE,
    priorUnframedQuote: priorUnframedQuote({ baseCents: 2649, foamcoreCents: 492, sumOfReturnedLinesCents: 4049 }),
    resolutionStatus: "ok-through-12x18",
    localMinPpi: 319.2,
    blockers: ["retail_not_verified", ...SHARED_BLOCKERS],
  },
  {
    configurationId: "bb-photo-01-16x24-canvas-15",
    photographId: PHOTOGRAPH.photographId,
    label: "16×24",
    saleProduct: SALE_PRODUCT,
    lumaprintsSubcategoryId: null,
    widthIn: 24,
    heightIn: 16,
    retailCents: 19933,
    productionBaseCents: null,
    productionBaseProvenance: FRAMED_COST_PROVENANCE,
    priorUnframedQuote: priorUnframedQuote({ baseCents: 3439, foamcoreCents: 704, sumOfReturnedLinesCents: 5051 }),
    resolutionStatus: "local-ppi-above-200-api-not-run",
    localMinPpi: 239.4,
    blockers: [...SHARED_BLOCKERS],
  },
  {
    configurationId: "bb-photo-01-20x30-canvas-15",
    photographId: PHOTOGRAPH.photographId,
    label: "20×30",
    saleProduct: SALE_PRODUCT,
    lumaprintsSubcategoryId: null,
    widthIn: 30,
    heightIn: 20,
    retailCents: null,
    productionBaseCents: null,
    productionBaseProvenance: FRAMED_COST_PROVENANCE,
    priorUnframedQuote: priorUnframedQuote({ baseCents: 5037, foamcoreCents: 976, sumOfReturnedLinesCents: 6921 }),
    resolutionStatus: "hold-below-200ppi",
    localMinPpi: 191.5,
    blockers: ["retail_not_verified", "resolution_hold_20x30", ...SHARED_BLOCKERS],
  },
];

export function listConfigurations() {
  return CONFIGURATIONS.map((item) => ({
    ...item,
    blockers: [...item.blockers],
    priorUnframedQuote: {
      ...item.priorUnframedQuote,
      optionLines: item.priorUnframedQuote.optionLines.map((line) => ({ ...line })),
    },
  }));
}

export function getConfiguration(configurationId) {
  return listConfigurations().find((item) => item.configurationId === configurationId) || null;
}

export function assertSinglePilot() {
  const ids = new Set(CONFIGURATIONS.map((item) => item.photographId));
  if (ids.size !== 1 || CONFIGURATIONS.length !== 3) {
    throw new Error("pilot_catalog_must_be_one_photograph_and_three_sizes");
  }
}
