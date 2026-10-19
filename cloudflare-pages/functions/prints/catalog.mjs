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

const SHARED_BLOCKERS = [
  "lumaprints_subcategory_unresolved",
  "lumaprints_options_unresolved",
  "shipping_cost_unverified",
  "processing_fee_unverified",
  "tax_unverified",
  "upgrade_costs_unverified",
  "print_master_not_in_protected_storage",
];

export const CONFIGURATIONS = [
  {
    configurationId: "bb-photo-01-12x18-canvas-15",
    photographId: PHOTOGRAPH.photographId,
    label: "12×18",
    widthIn: 18,
    heightIn: 12,
    retailCents: null,
    productionBaseCents: 2649,
    productionBaseProvenance: "Lumaprints public 1.5-inch stretch price, 2026-10-17, before foamcore and hardware",
    resolutionStatus: "ok-through-12x18",
    localMinPpi: 319.2,
    blockers: ["retail_not_verified", ...SHARED_BLOCKERS],
  },
  {
    configurationId: "bb-photo-01-16x24-canvas-15",
    photographId: PHOTOGRAPH.photographId,
    label: "16×24",
    widthIn: 24,
    heightIn: 16,
    retailCents: 19933,
    productionBaseCents: 3439,
    productionBaseProvenance: "Lumaprints public 1.5-inch stretch price, 2026-10-17, before foamcore and hardware",
    resolutionStatus: "local-ppi-above-200-api-not-run",
    localMinPpi: 239.4,
    blockers: [...SHARED_BLOCKERS],
  },
  {
    configurationId: "bb-photo-01-20x30-canvas-15",
    photographId: PHOTOGRAPH.photographId,
    label: "20×30",
    widthIn: 30,
    heightIn: 20,
    retailCents: null,
    productionBaseCents: 5037,
    productionBaseProvenance: "Lumaprints cart custom size, 2026-10-17, before foamcore and hardware",
    resolutionStatus: "hold-below-200ppi",
    localMinPpi: 191.5,
    blockers: ["retail_not_verified", "resolution_hold_20x30", ...SHARED_BLOCKERS],
  },
];

export function listConfigurations() {
  return CONFIGURATIONS.map((item) => ({ ...item, blockers: [...item.blockers] }));
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
