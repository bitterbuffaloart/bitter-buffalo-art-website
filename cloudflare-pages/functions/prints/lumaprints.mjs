/** Sandbox-only LumaPrints client. Official paths: https://api-docs.lumaprints.com/ */
export const SANDBOX_ORIGIN = "https://us.api-sandbox.lumaprints.com";
export const SANDBOX_BASE = `${SANDBOX_ORIGIN}/api/v1`;
const PRODUCTION_ORIGIN = "https://us.api.lumaprints.com";

export function resolveBaseUrl(env = {}) {
  const requested = env.LUMAPRINTS_API_BASE || SANDBOX_BASE;
  let url;
  try {
    url = new URL(requested);
  } catch {
    throw new Error("unexpected_lumaprints_host");
  }
  if (url.origin === PRODUCTION_ORIGIN) throw new Error("production_lumaprints_blocked");
  if (url.origin !== SANDBOX_ORIGIN || !url.pathname.startsWith("/api/v1")) {
    throw new Error("unexpected_lumaprints_host");
  }
  return SANDBOX_BASE;
}

export function basicAuthHeader(apiKey, apiSecret) {
  if (!apiKey || !apiSecret) throw new Error("lumaprints_credentials_missing");
  const bytes = new TextEncoder().encode(`${apiKey}:${apiSecret}`);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `Basic ${btoa(binary)}`;
}

export function selectCanvasMapping(discovery) {
  const categories = (discovery.categories || []).filter((item) => /canvas/i.test(item.name || ""));
  const matches = [];
  for (const category of categories) {
    const subs = discovery.subcategories?.[category.categoryId] || [];
    for (const sub of subs) {
      const name = sub.name || "";
      const stretched = /1\.5\s*(in|inch)/i.test(name) && /stretch/i.test(name) && /canvas/i.test(name);
      const excluded = /0\.75|fram|float/i.test(name);
      if (stretched && !excluded) matches.push(sub);
    }
  }
  if (matches.length !== 1) {
    return { readyToSubmit: false, subcategoryId: null, optionIds: [], unresolvedGroups: ["subcategory"] };
  }
  const subcategory = matches[0];
  const groups = discovery.options?.[subcategory.subcategoryId] || [];
  const optionIds = [];
  const unresolvedGroups = [];
  for (const group of groups) {
    const groupName = group.optionGroup || "";
    const items = group.optionGroupItems || [];
    if (/border|edge|wrap/i.test(groupName)) {
      const mirrors = items.filter((item) => /mirror/i.test(item.optionName || ""));
      if (mirrors.length === 1) optionIds.push(mirrors[0].optionId);
      else unresolvedGroups.push(groupName);
    } else {
      unresolvedGroups.push(groupName);
    }
  }
  return {
    readyToSubmit: unresolvedGroups.length === 0,
    subcategoryId: subcategory.subcategoryId,
    optionIds,
    unresolvedGroups,
    requiredDpi: subcategory.requiredDPI ?? null,
  };
}

export function buildOrderPayload({ externalId, storeId, recipient, item }) {
  if (!item.mapping?.readyToSubmit || item.mapping.subcategoryId == null) {
    throw new Error("lumaprints_mapping_incomplete");
  }
  if (!item.fulfillmentUrl) throw new Error("print_master_url_missing");
  return {
    externalId,
    storeId,
    shippingMethod: "default",
    productionTime: "regular",
    recipient,
    orderItems: [{
      externalItemId: item.configurationId,
      subcategoryId: item.mapping.subcategoryId,
      quantity: 1,
      width: item.widthIn,
      height: item.heightIn,
      file: { imageUrl: item.fulfillmentUrl, saveImage: false },
      orderItemOptions: item.mapping.optionIds,
    }],
  };
}

export function createClient(env, fetchImpl = fetch) {
  const base = resolveBaseUrl(env);
  const headers = () => ({
    Authorization: basicAuthHeader(env.LUMAPRINTS_API_KEY, env.LUMAPRINTS_API_SECRET),
    "Content-Type": "application/json",
    Accept: "application/json",
  });
  async function request(path, options = {}) {
    const response = await fetchImpl(`${base}${path}`, { ...options, headers: { ...headers(), ...(options.headers || {}) } });
    const text = await response.text();
    let body = null;
    if (text) {
      try { body = JSON.parse(text); } catch { body = { raw: text.slice(0, 300) }; }
    }
    if (!response.ok) {
      const error = new Error("lumaprints_request_failed");
      error.status = response.status;
      error.body = body;
      throw error;
    }
    return body;
  }
  return {
    base,
    listStores: () => request("/stores"),
    listCategories: () => request("/products/categories"),
    listSubcategories: (categoryId) => request(`/products/categories/${categoryId}/subcategories`),
    listOptions: (subcategoryId) => request(`/products/subcategories/${subcategoryId}/options`),
    priceProducts: (items) => request("/pricing/products", { method: "POST", body: JSON.stringify(items) }),
    shippingCost: (payload) => request("/pricing/shipping", { method: "POST", body: JSON.stringify(payload) }),
    checkImage: (payload) => request("/images/checkImageConfig", { method: "POST", body: JSON.stringify(payload) }),
    createOrder: (payload) => request("/orders", { method: "POST", body: JSON.stringify(payload) }),
    getOrder: (orderNumber) => request(`/orders/${orderNumber}`),
    subscribeShipping: (payload) => request("/webhook", { method: "POST", body: JSON.stringify({ event: "shipping", ...payload }) }),
  };
}
