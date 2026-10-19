/** Sale stays blocked while any cost in the margin formula is unknown. */
export function evaluateProfit(config) {
  const unknown = [];
  if (config.retailCents == null) unknown.push("retail");
  if (config.productionCents == null) unknown.push("production");
  if (config.shippingCents == null) unknown.push("shipping");
  if (config.processingFeeCents == null) unknown.push("processing_fee");
  if (config.taxStatus !== "recorded-not-required" && config.taxCents == null) unknown.push("tax");
  if (config.upgradeCostStatus !== "verified-none" && config.upgradeCostStatus !== "included-in-production") {
    unknown.push("upgrades");
  }
  const costsKnown = unknown.length === 0;
  const taxCents = config.taxCents || 0;
  const contributionCents = costsKnown
    ? config.retailCents - config.productionCents - config.shippingCents - config.processingFeeCents - taxCents
    : null;
  const sellable = costsKnown
    && contributionCents > 0
    && config.resolutionStatus === "accepted"
    && config.mappingReady === true
    && config.masterReady === true;
  const knownGapCents = config.retailCents != null && config.productionBaseCents != null
    ? config.retailCents - config.productionBaseCents
    : null;
  return { sellable, unknown, contributionCents, knownGapCents };
}

export function profitInput(config) {
  return {
    retailCents: config.retailCents,
    productionCents: null,
    productionBaseCents: config.productionBaseCents,
    shippingCents: null,
    processingFeeCents: null,
    taxCents: null,
    taxStatus: "unverified",
    upgradeCostStatus: "unverified",
    resolutionStatus: config.resolutionStatus,
    mappingReady: false,
    masterReady: false,
  };
}
