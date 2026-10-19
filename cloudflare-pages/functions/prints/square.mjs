/** Square sandbox checkout. Production host is refused. */
export const SANDBOX_ORIGIN = "https://connect.squareupsandbox.com";
const PRODUCTION_ORIGIN = "https://connect.squareup.com";

export function resolveSquareBase(env = {}) {
  if (env.SQUARE_ENVIRONMENT !== "sandbox") throw new Error("square_not_sandbox");
  const requested = env.SQUARE_API_BASE || SANDBOX_ORIGIN;
  let url;
  try { url = new URL(requested); } catch { throw new Error("unexpected_square_host"); }
  if (url.origin === PRODUCTION_ORIGIN) throw new Error("production_square_blocked");
  if (url.origin !== SANDBOX_ORIGIN) throw new Error("unexpected_square_host");
  return SANDBOX_ORIGIN;
}

export function buildPaymentLinkRequest({ orderId, configuration, locationId, idempotencyKey }) {
  if (configuration.retailCents == null) throw new Error("retail_not_verified");
  return {
    idempotency_key: idempotencyKey,
    description: `Bitter Buffalo Art print ${configuration.configurationId}`,
    order: {
      location_id: locationId,
      reference_id: orderId.slice(0, 40),
      line_items: [{
        name: `Grand Tetons ${configuration.label} premium 1.5-inch canvas`,
        quantity: "1",
        note: configuration.configurationId,
        base_price_money: { amount: configuration.retailCents, currency: "USD" },
      }],
    },
    checkout_options: { ask_for_shipping_address: true },
  };
}

function safeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string" || left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return diff === 0;
}

export async function signWebhook({ signatureKey, notificationUrl, rawBody }) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(signatureKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const bytes = new Uint8Array(await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${notificationUrl}${rawBody}`),
  ));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export async function verifyWebhookSignature({ signatureKey, notificationUrl, rawBody, signature }) {
  if (!signatureKey || !notificationUrl || !signature) return false;
  const expected = await signWebhook({ signatureKey, notificationUrl, rawBody });
  return safeEqual(expected, signature);
}

export function createClient(env, fetchImpl = fetch) {
  const base = resolveSquareBase(env);
  if (!env.SQUARE_ACCESS_TOKEN || !env.SQUARE_LOCATION_ID) throw new Error("square_credentials_missing");
  const headers = {
    Authorization: `Bearer ${env.SQUARE_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
    "Square-Version": env.SQUARE_VERSION || "2026-09-16",
  };
  async function request(path, options = {}) {
    const response = await fetchImpl(`${base}${path}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error("square_request_failed");
      error.status = response.status;
      error.body = body;
      throw error;
    }
    return body;
  }
  return {
    base,
    createPaymentLink: (payload) => request("/v2/online-checkout/payment-links", { method: "POST", body: JSON.stringify(payload) }),
    getPayment: (paymentId) => request(`/v2/payments/${paymentId}`),
    getOrder: (orderId) => request(`/v2/orders/${orderId}`),
  };
}
