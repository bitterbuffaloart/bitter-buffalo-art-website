import { getConfiguration, PHOTOGRAPH } from "./catalog.mjs";
import { evaluateProfit, profitInput } from "./profit.mjs";
import { buildOrderPayload, resolveBaseUrl } from "./lumaprints.mjs";
import { buildPaymentLinkRequest, createClient as createSquareClient, verifyWebhookSignature } from "./square.mjs";

function nowIso(now) {
  return (now || new Date()).toISOString();
}

function publicOrder(order) {
  return {
    orderId: order.orderId,
    configurationId: order.configurationId,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    lumaprintsOrderNumber: order.lumaprintsOrderNumber || null,
    blockers: order.blockers || [],
  };
}

export function decideFulfillment(config, env = {}) {
  const profit = evaluateProfit(profitInput(config));
  if (!profit.sellable) return { action: "block", reason: "costs_or_mapping" };
  if (env.PRINT_FULFILLMENT_MODE !== "sandbox-approved") return { action: "hold", reason: "manual-approval" };
  return { action: "submit-sandbox" };
}

export async function createCheckout({ body, env = {}, store, square, now }) {
  const configuration = getConfiguration(body?.configurationId);
  if (!configuration) return { status: 400, body: { ok: false, error: "Choose one of the three canvas sizes." } };
  if (body.retailCents != null && Number(body.retailCents) !== configuration.retailCents) {
    return { status: 400, body: { ok: false, error: "The price on the page does not match the confirmed price." } };
  }
  const profit = evaluateProfit(profitInput(configuration));
  if (!profit.sellable) {
    return {
      status: 409,
      body: {
        ok: false,
        error: "This size is not for sale until its costs, print file, and LumaPrints options are verified.",
        configurationId: configuration.configurationId,
        retailCents: configuration.retailCents,
        blockers: configuration.blockers,
      },
    };
  }
  if (!store) return { status: 503, body: { ok: false, error: "Order storage is not configured. No payment was started." } };
  if (body.idempotencyKey) {
    const existing = await store.findByIdempotency(body.idempotencyKey);
    if (existing) return { status: 200, body: { ok: true, duplicate: true, ...publicOrder(existing) } };
  }
  let client = square;
  if (!client) {
    try { client = createSquareClient(env); }
    catch (error) { return { status: 503, body: { ok: false, error: "Sandbox checkout is not configured. No payment was started.", code: error.message } }; }
  }
  const orderId = `bb_${crypto.randomUUID().replace(/-/g, "")}`;
  const linkRequest = buildPaymentLinkRequest({
    orderId,
    configuration,
    locationId: env.SQUARE_LOCATION_ID,
    idempotencyKey: body.idempotencyKey || orderId,
  });
  const link = await client.createPaymentLink(linkRequest);
  const order = {
    orderId,
    configurationId: configuration.configurationId,
    idempotencyKey: body.idempotencyKey || orderId,
    squarePaymentLinkId: link?.payment_link?.id || null,
    squareOrderId: link?.payment_link?.order_id || null,
    squarePaymentId: null,
    paymentStatus: "link_created",
    fulfillmentStatus: "not_submitted",
    checkoutUrl: link?.payment_link?.url || null,
    blockers: [],
    updatedAt: nowIso(now),
  };
  await store.insertOrder(order);
  await store.audit({ orderId, kind: "checkout_link_created", detail: { configurationId: configuration.configurationId }, createdAt: order.updatedAt });
  return { status: 200, body: { ok: true, checkoutUrl: order.checkoutUrl, ...publicOrder(order) } };
}

async function refuseFulfillment(store, order, patch, env) {
  const next = await store.updateOrder(order.orderId, { ...patch, updatedAt: nowIso() });
  await store.audit({ orderId: order.orderId, kind: patch.fulfillmentStatus, detail: { mode: env.PRINT_FULFILLMENT_MODE || "manual-approval" }, createdAt: next.updatedAt });
  return next;
}

export async function handleSquareNotification({ rawBody, signature, env = {}, store, square, lumaprints }) {
  const verified = await verifyWebhookSignature({
    signatureKey: env.SQUARE_WEBHOOK_SIGNATURE_KEY,
    notificationUrl: env.SQUARE_WEBHOOK_NOTIFICATION_URL,
    rawBody,
    signature,
  });
  if (!verified) return { status: 401, body: { ok: false, error: "signature_rejected" } };
  let event;
  try { event = JSON.parse(rawBody); } catch { return { status: 400, body: { ok: false, error: "invalid_json" } }; }
  const eventId = event.event_id || event.eventId;
  if (!eventId) return { status: 400, body: { ok: false, error: "missing_event_id" } };
  const fresh = await store.recordReceipt("square", eventId);
  if (!fresh) return { status: 200, body: { ok: true, duplicate: true, submitted: false } };

  const type = event.type || "";
  if (type === "refund.updated") {
    return { status: 200, body: { ok: true, submitted: false, fulfillmentStatus: "needs_manual_intervention" } };
  }
  const hintedId = event?.data?.object?.payment?.id;
  if (!hintedId) return { status: 200, body: { ok: true, ignored: true, submitted: false } };
  const paymentResponse = await square.getPayment(hintedId);
  const payment = paymentResponse.payment || paymentResponse;
  const existingPayment = await store.findByPayment(payment.id);
  if (existingPayment?.squarePaymentId === payment.id && existingPayment.paymentStatus === "payment_completed") {
    return { status: 200, body: { ok: true, duplicate: true, submitted: false } };
  }
  const order = await store.findBySquareOrder(payment.order_id);
  if (!order) return { status: 202, body: { ok: false, error: "order_not_found", submitted: false } };

  if (payment.status !== "COMPLETED") {
    const failed = await refuseFulfillment(store, order, {
      squarePaymentId: payment.id,
      paymentStatus: "payment_failed",
      fulfillmentStatus: "not_submitted",
    }, env);
    return { status: 200, body: { ok: true, submitted: false, ...publicOrder(failed) } };
  }
  const configuration = getConfiguration(order.configurationId);
  const amount = payment.amount_money?.amount;
  if (!configuration || amount !== configuration.retailCents || payment.amount_money?.currency !== "USD") {
    const held = await refuseFulfillment(store, order, {
      squarePaymentId: payment.id,
      paymentStatus: "payment_completed",
      fulfillmentStatus: "needs_manual_intervention",
    }, env);
    return { status: 200, body: { ok: true, submitted: false, ...publicOrder(held) } };
  }
  const decision = decideFulfillment({ ...configuration, mappingReady: false, masterReady: PHOTOGRAPH.masterReady }, env);
  if (decision.action !== "submit-sandbox") {
    const held = await refuseFulfillment(store, order, {
      squarePaymentId: payment.id,
      paymentStatus: "payment_completed",
      fulfillmentStatus: decision.action === "hold" ? "awaiting_owner_approval" : "blocked_unverified_costs",
      blockers: configuration.blockers,
    }, env);
    return { status: 200, body: { ok: true, submitted: false, ...publicOrder(held) } };
  }
  return submitSandboxOrder({ order, configuration, payment, env, store, lumaprints });
}

export async function submitSandboxOrder({ order, configuration, payment, env, store, lumaprints, recipient, mapping, fulfillmentUrl }) {
  resolveBaseUrl(env);
  if (env.PRINT_FULFILLMENT_MODE !== "sandbox-approved") {
    const held = await refuseFulfillment(store, order, {
      paymentStatus: "payment_completed",
      fulfillmentStatus: "awaiting_owner_approval",
    }, env);
    return { status: 409, body: { ok: false, submitted: false, ...publicOrder(held) } };
  }
  if (order.lumaprintsOrderNumber) {
    return { status: 200, body: { ok: true, duplicate: true, submitted: false, lumaprintsOrderNumber: order.lumaprintsOrderNumber } };
  }
  const item = {
    configurationId: configuration.configurationId,
    widthIn: configuration.widthIn,
    heightIn: configuration.heightIn,
    mapping,
    fulfillmentUrl,
  };
  let payload;
  try {
    payload = buildOrderPayload({
      externalId: order.orderId,
      storeId: Number(env.LUMAPRINTS_STORE_ID),
      recipient,
      item,
    });
  } catch (error) {
    const failed = await refuseFulfillment(store, order, {
      squarePaymentId: payment?.id || order.squarePaymentId,
      paymentStatus: "payment_completed",
      fulfillmentStatus: "fulfillment_failed",
      lastError: error.message,
    }, env);
    return { status: 409, body: { ok: false, submitted: false, ...publicOrder(failed) } };
  }
  try {
    const created = await lumaprints.createOrder(payload);
    const saved = await store.updateOrder(order.orderId, {
      squarePaymentId: payment?.id || order.squarePaymentId,
      paymentStatus: "payment_completed",
      fulfillmentStatus: "submitted_sandbox",
      lumaprintsOrderNumber: String(created.orderNumber),
      updatedAt: nowIso(),
    });
    await store.audit({ orderId: order.orderId, kind: "lumaprints_sandbox_submitted", detail: { orderNumber: created.orderNumber }, createdAt: saved.updatedAt });
    return { status: 200, body: { ok: true, submitted: true, ...publicOrder(saved) } };
  } catch (error) {
    const failed = await refuseFulfillment(store, order, {
      squarePaymentId: payment?.id || order.squarePaymentId,
      paymentStatus: "payment_completed",
      fulfillmentStatus: "fulfillment_failed",
      lastError: error.message,
    }, env);
    return { status: 502, body: { ok: false, submitted: false, retryable: true, ...publicOrder(failed) } };
  }
}

export async function handleShippingNotification({ authorization, env = {}, store, body }) {
  const expectedUser = env.LUMAPRINTS_WEBHOOK_USER;
  const expectedPassword = env.LUMAPRINTS_WEBHOOK_PASSWORD;
  if (!expectedUser || !expectedPassword) return { status: 503, body: { ok: false, error: "webhook_auth_not_configured" } };
  const match = /^Basic\s+([A-Za-z0-9+/=]+)$/.exec(authorization || "");
  const decoded = match ? new TextDecoder().decode(Uint8Array.from(atob(match[1]), (char) => char.charCodeAt(0))) : "";
  if (decoded !== `${expectedUser}:${expectedPassword}`) return { status: 401, body: { ok: false, error: "signature_rejected" } };
  const eventId = body?.eventId || body?.shipmentId || `${body?.orderNumber || "unknown"}:${body?.trackingNumber || "none"}`;
  const fresh = await store.recordReceipt("lumaprints", eventId);
  if (!fresh) return { status: 200, body: { ok: true, duplicate: true } };
  const order = body?.externalId ? await store.getOrder(body.externalId) : null;
  if (order) {
    await store.updateOrder(order.orderId, {
      fulfillmentStatus: "shipped",
      trackingNumber: body.trackingNumber || null,
      carrier: body.carrier || null,
      updatedAt: nowIso(),
    });
  }
  await store.audit({
    orderId: order?.orderId || null,
    kind: "shipping_notification",
    detail: { orderNumber: body?.orderNumber || null, trackingPresent: Boolean(body?.trackingNumber) },
    createdAt: nowIso(),
  });
  return { status: 200, body: { ok: true, duplicate: false } };
}
