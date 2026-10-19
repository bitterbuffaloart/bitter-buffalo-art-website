import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CONFIGURATIONS, PHOTOGRAPH, getConfiguration } from "../cloudflare-pages/functions/prints/catalog.mjs";
import { evaluateProfit, profitInput } from "../cloudflare-pages/functions/prints/profit.mjs";
import { buildOrderPayload, resolveBaseUrl, selectCanvasMapping } from "../cloudflare-pages/functions/prints/lumaprints.mjs";
import { buildPaymentLinkRequest, resolveSquareBase, signWebhook } from "../cloudflare-pages/functions/prints/square.mjs";
import { createCheckout, handleShippingNotification, handleSquareNotification, submitSandboxOrder } from "../cloudflare-pages/functions/prints/orders.mjs";
import { issueMasterToken, MASTER_OBJECT_KEY, verifyMasterToken } from "../cloudflare-pages/functions/prints/master-access.mjs";
import { createMemoryStore } from "../cloudflare-pages/functions/prints/store.mjs";

const root = resolve(import.meta.dirname, "..");
const page = readFileSync(resolve(root, "cloudflare-pages/photography/prints/grand-tetons/index.html"), "utf8");
const sandboxEnv = {
  SQUARE_ENVIRONMENT: "sandbox",
  SQUARE_WEBHOOK_SIGNATURE_KEY: "test-key",
  SQUARE_WEBHOOK_NOTIFICATION_URL: "https://example.test/api/prints/square-webhook",
  LUMAPRINTS_API_BASE: "https://us.api-sandbox.lumaprints.com/api/v1",
};

function discovery() {
  return {
    categories: [{ categoryId: 50, name: "Canvas" }],
    subcategories: {
      50: [
        { subcategoryId: 9001, name: "0.75in Stretched Canvas", requiredDPI: 150 },
        { subcategoryId: 9002, name: "1.5in Stretched Canvas", requiredDPI: 200 },
        { subcategoryId: 9003, name: "1.5in Framed Canvas", requiredDPI: 200 },
      ],
    },
    options: {
      9002: [
        { optionGroup: "Canvas Border", optionGroupItems: [
          { optionId: 501, optionName: "Image Wrap" },
          { optionId: 502, optionName: "Mirror Wrap" },
        ] },
        { optionGroup: "Hanging Hardware", optionGroupItems: [
          { optionId: 601, optionName: "Wire" },
        ] },
      ],
    },
  };
}

async function signedPayment(store, payment, { eventId = "evt-1", type = "payment.updated" } = {}) {
  const rawBody = JSON.stringify({ event_id: eventId, type, data: { object: { payment: { id: payment.id } } } });
  const signature = await signWebhook({
    signatureKey: sandboxEnv.SQUARE_WEBHOOK_SIGNATURE_KEY,
    notificationUrl: sandboxEnv.SQUARE_WEBHOOK_NOTIFICATION_URL,
    rawBody,
  });
  return handleSquareNotification({
    rawBody,
    signature,
    env: sandboxEnv,
    store,
    square: { async getPayment() { return { payment }; } },
    lumaprints: { async createOrder() { throw new Error("lumaprints_called"); } },
  });
}

test("pilot catalog is one photograph and three canvas sizes", () => {
  assert.equal(new Set(CONFIGURATIONS.map((item) => item.photographId)).size, 1);
  assert.deepEqual(CONFIGURATIONS.map((item) => item.label), ["12×18", "16×24", "20×30"]);
  assert.equal(getConfiguration("bb-photo-01-16x24-canvas-15").retailCents, 19933);
  assert.equal(getConfiguration("bb-photo-01-12x18-canvas-15").retailCents, null);
  assert.equal(getConfiguration("bb-photo-01-20x30-canvas-15").retailCents, null);
  assert.equal(PHOTOGRAPH.title, "Grand Tetons");
  assert.equal(PHOTOGRAPH.masterReady, false);
});

test("page shows the confirmed price, three sizes, and no invented prices", () => {
  assert.equal(page.match(/<h1[ >]/g).length, 1);
  assert.equal(page.match(/name="configurationId"/g).length, 3);
  assert.match(page, /\$199\.33/);
  assert.match(page, /id="print-buy"/);
  assert.doesNotMatch(page, /134\.99|224\.99|314\.99|299\.99/);
  assert.doesNotMatch(page, /us\.api\.lumaprints\.com|connect\.squareup\.com/);
  for (const label of ["12×18", "16×24", "20×30"]) assert.match(page, new RegExp(label));
});

test("landscape file matches the 3:2 canvas sizes", () => {
  const ratio = PHOTOGRAPH.sourcePixels.width / PHOTOGRAPH.sourcePixels.height;
  for (const item of CONFIGURATIONS) {
    const printRatio = item.widthIn / item.heightIn;
    assert.ok(Math.abs(ratio - printRatio) / printRatio < 0.01);
  }
  assert.equal(getConfiguration("bb-photo-01-20x30-canvas-15").resolutionStatus, "hold-below-200ppi");
});

test("mapping selects 1.5-inch stretch and mirror wrap without guessing other groups", () => {
  const mapping = selectCanvasMapping(discovery());
  assert.equal(mapping.subcategoryId, 9002);
  assert.deepEqual(mapping.optionIds, [502]);
  assert.equal(mapping.readyToSubmit, false);
  assert.deepEqual(mapping.unresolvedGroups, ["Hanging Hardware"]);
});

test("mapping fails closed when mirror wrap is ambiguous", () => {
  const input = discovery();
  input.options[9002][0].optionGroupItems.push({ optionId: 503, optionName: "Mirror Edge" });
  const mapping = selectCanvasMapping(input);
  assert.equal(mapping.subcategoryId, 9002);
  assert.deepEqual(mapping.optionIds, []);
  assert.ok(mapping.unresolvedGroups.includes("Canvas Border"));
});

test("LumaPrints and Square production hosts are refused", () => {
  assert.equal(resolveBaseUrl({}), "https://us.api-sandbox.lumaprints.com/api/v1");
  assert.throws(() => resolveBaseUrl({ LUMAPRINTS_API_BASE: "https://us.api.lumaprints.com/api/v1" }), /production_lumaprints_blocked/);
  assert.throws(() => resolveSquareBase({ SQUARE_ENVIRONMENT: "production" }), /square_not_sandbox/);
  assert.throws(() => resolveSquareBase({ SQUARE_ENVIRONMENT: "sandbox", SQUARE_API_BASE: "https://connect.squareup.com" }), /production_square_blocked/);
});

test("Square link request uses the server price and asks for a shipping address", () => {
  const request = buildPaymentLinkRequest({
    orderId: "bb_test",
    configuration: getConfiguration("bb-photo-01-16x24-canvas-15"),
    locationId: "LOC",
    idempotencyKey: "bb_test",
  });
  assert.equal(request.order.line_items[0].base_price_money.amount, 19933);
  assert.equal(request.checkout_options.ask_for_shipping_address, true);
  assert.throws(() => buildPaymentLinkRequest({
    orderId: "bb_test",
    configuration: getConfiguration("bb-photo-01-12x18-canvas-15"),
    locationId: "LOC",
    idempotencyKey: "bb_test",
  }), /retail_not_verified/);
});

test("checkout refuses every current size and does not call Square", async () => {
  let called = false;
  const square = { async createPaymentLink() { called = true; } };
  for (const item of CONFIGURATIONS) {
    const result = await createCheckout({
      body: { configurationId: item.configurationId, retailCents: item.retailCents },
      env: sandboxEnv,
      store: createMemoryStore(),
      square,
    });
    assert.equal(result.status, 409);
    assert.equal(result.body.retailCents, item.retailCents);
  }
  assert.equal(called, false);
});

test("checkout rejects a client price that does not match", async () => {
  const result = await createCheckout({
    body: { configurationId: "bb-photo-01-16x24-canvas-15", retailCents: 100 },
    env: sandboxEnv,
    store: createMemoryStore(),
    square: { async createPaymentLink() { throw new Error("square_called"); } },
  });
  assert.equal(result.status, 400);
});

test("verified payment does not submit while costs and manual approval block the pilot", async () => {
  const store = createMemoryStore();
  await store.insertOrder({
    orderId: "bb_order",
    configurationId: "bb-photo-01-16x24-canvas-15",
    squareOrderId: "sq-order",
    paymentStatus: "link_created",
    fulfillmentStatus: "not_submitted",
    updatedAt: "2026-10-18T00:00:00.000Z",
  });
  const payment = { id: "pay-1", status: "COMPLETED", order_id: "sq-order", amount_money: { amount: 19933, currency: "USD" } };
  const first = await signedPayment(store, payment);
  assert.equal(first.status, 200);
  assert.equal(first.body.submitted, false);
  assert.equal(first.body.fulfillmentStatus, "blocked_unverified_costs");
  const second = await signedPayment(store, payment);
  assert.equal(second.body.duplicate, true);
  const otherEvent = await signedPayment(store, payment, { eventId: "evt-2" });
  assert.equal(otherEvent.body.duplicate, true);
});

test("failed payment, amount mismatch, bad signature, and refund do not submit", async () => {
  const store = createMemoryStore();
  await store.insertOrder({
    orderId: "bb_order",
    configurationId: "bb-photo-01-16x24-canvas-15",
    squareOrderId: "sq-order",
    paymentStatus: "link_created",
    fulfillmentStatus: "not_submitted",
    updatedAt: "2026-10-18T00:00:00.000Z",
  });
  const failed = await signedPayment(store, { id: "pay-fail", status: "FAILED", order_id: "sq-order", amount_money: { amount: 19933, currency: "USD" } }, { eventId: "evt-fail" });
  assert.equal(failed.body.paymentStatus, "payment_failed");
  const mismatch = await signedPayment(store, { id: "pay-bad", status: "COMPLETED", order_id: "sq-order", amount_money: { amount: 100, currency: "USD" } }, { eventId: "evt-bad" });
  assert.equal(mismatch.body.fulfillmentStatus, "needs_manual_intervention");
  const unsigned = await handleSquareNotification({ rawBody: "{}", signature: "nope", env: sandboxEnv, store, square: {}, lumaprints: {} });
  assert.equal(unsigned.status, 401);
  const refundBody = JSON.stringify({ event_id: "evt-refund", type: "refund.updated" });
  const refund = await handleSquareNotification({
    rawBody: refundBody,
    signature: await signWebhook({ signatureKey: sandboxEnv.SQUARE_WEBHOOK_SIGNATURE_KEY, notificationUrl: sandboxEnv.SQUARE_WEBHOOK_NOTIFICATION_URL, rawBody: refundBody }),
    env: sandboxEnv,
    store,
    square: {},
    lumaprints: { async createOrder() { throw new Error("lumaprints_called"); } },
  });
  assert.equal(refund.body.fulfillmentStatus, "needs_manual_intervention");
  assert.equal(refund.body.submitted, false);
});

test("sandbox submission is manual, idempotent, and recovers from an API failure", async () => {
  const configuration = getConfiguration("bb-photo-01-16x24-canvas-15");
  const mapping = { readyToSubmit: true, subcategoryId: 9002, optionIds: [502] };
  const recipient = { addressLine1: "1 Test", city: "Breckenridge", state: "CO", zipCode: "80424", country: "US" };
  const blocked = createMemoryStore();
  await blocked.insertOrder({ orderId: "bb_hold", configurationId: configuration.configurationId, paymentStatus: "payment_completed", fulfillmentStatus: "not_submitted", updatedAt: "2026-10-18T00:00:00.000Z" });
  const held = await submitSandboxOrder({
    order: await blocked.getOrder("bb_hold"), configuration, env: sandboxEnv, store: blocked,
    lumaprints: { async createOrder() { throw new Error("should_not_submit"); } }, recipient, mapping, fulfillmentUrl: "https://example.test/master.jpg",
  });
  assert.equal(held.body.submitted, false);
  assert.equal(held.body.fulfillmentStatus, "awaiting_owner_approval");

  const calls = [];
  const store = createMemoryStore();
  await store.insertOrder({ orderId: "bb_ok", configurationId: configuration.configurationId, paymentStatus: "payment_completed", fulfillmentStatus: "not_submitted", updatedAt: "2026-10-18T00:00:00.000Z" });
  const env = { ...sandboxEnv, PRINT_FULFILLMENT_MODE: "sandbox-approved", LUMAPRINTS_STORE_ID: "1088" };
  const lumaprints = { async createOrder(payload) { calls.push(payload); return { orderNumber: 4242 }; } };
  const created = await submitSandboxOrder({
    order: await store.getOrder("bb_ok"), configuration, env, store, lumaprints, recipient, mapping, fulfillmentUrl: "https://example.test/master.jpg",
  });
  assert.equal(created.body.submitted, true);
  assert.equal(created.body.lumaprintsOrderNumber, "4242");
  assert.equal(calls[0].orderItems[0].width, 24);
  assert.equal(calls[0].orderItems[0].height, 16);
  assert.deepEqual(calls[0].orderItems[0].orderItemOptions, [502]);
  const duplicate = await submitSandboxOrder({
    order: await store.getOrder("bb_ok"), configuration, env, store, lumaprints, recipient, mapping, fulfillmentUrl: "https://example.test/master.jpg",
  });
  assert.equal(duplicate.body.duplicate, true);
  assert.equal(calls.length, 1);

  const failedStore = createMemoryStore();
  await failedStore.insertOrder({ orderId: "bb_fail", configurationId: configuration.configurationId, paymentStatus: "payment_completed", fulfillmentStatus: "not_submitted", updatedAt: "2026-10-18T00:00:00.000Z" });
  const failed = await submitSandboxOrder({
    order: await failedStore.getOrder("bb_fail"), configuration, env, store: failedStore,
    lumaprints: { async createOrder() { throw new Error("lumaprints_request_failed"); } },
    recipient, mapping, fulfillmentUrl: "https://example.test/master.jpg",
  });
  assert.equal(failed.status, 502);
  assert.equal(failed.body.retryable, true);
  assert.equal(failed.body.lumaprintsOrderNumber, null);
  await assert.rejects(() => submitSandboxOrder({
    order: failedStore.getOrder("bb_fail"), configuration,
    env: { ...env, LUMAPRINTS_API_BASE: "https://us.api.lumaprints.com/api/v1" },
    store: failedStore, lumaprints, recipient, mapping, fulfillmentUrl: "https://example.test/master.jpg",
  }), /production_lumaprints_blocked/);
});

test("shipping webhook requires basic auth and ignores a duplicate delivery", async () => {
  const store = createMemoryStore();
  await store.insertOrder({ orderId: "bb_ok", configurationId: "bb-photo-01-16x24-canvas-15", paymentStatus: "payment_completed", fulfillmentStatus: "submitted_sandbox", updatedAt: "2026-10-18T00:00:00.000Z" });
  const env = { ...sandboxEnv, LUMAPRINTS_WEBHOOK_USER: "hook-user", LUMAPRINTS_WEBHOOK_PASSWORD: "hook-secret" };
  const denied = await handleShippingNotification({ authorization: "Basic bm90OnZhbGlk", env, store, body: { externalId: "bb_ok", trackingNumber: "1Z" } });
  assert.equal(denied.status, 401);
  const authorization = `Basic ${btoa("hook-user:hook-secret")}`;
  const accepted = await handleShippingNotification({
    authorization, env, store, body: { eventId: "ship-1", externalId: "bb_ok", orderNumber: 4242, trackingNumber: "1Z999", carrier: "UPS" },
  });
  assert.equal(accepted.body.duplicate, false);
  assert.equal((await store.getOrder("bb_ok")).trackingNumber, "1Z999");
  const duplicate = await handleShippingNotification({
    authorization, env, store, body: { eventId: "ship-1", externalId: "bb_ok", trackingNumber: "1Z999" },
  });
  assert.equal(duplicate.body.duplicate, true);
});

test("profit blocks unknown costs and does not treat the base gap as margin", () => {
  const config = getConfiguration("bb-photo-01-16x24-canvas-15");
  const result = evaluateProfit(profitInput(config));
  assert.equal(result.sellable, false);
  assert.equal(result.contributionCents, null);
  assert.equal(result.knownGapCents, 16494);
  assert.ok(result.unknown.includes("shipping"));
  assert.ok(result.unknown.includes("tax"));
  const payload = buildOrderPayload({
    externalId: "bb_ok",
    storeId: 1088,
    recipient: { addressLine1: "1 Test", city: "Breckenridge", state: "CO", zipCode: "80424", country: "US" },
    item: { configurationId: config.configurationId, widthIn: 24, heightIn: 16, mapping: { readyToSubmit: true, subcategoryId: 9002, optionIds: [502] }, fulfillmentUrl: "https://example.test/master.jpg" },
  });
  assert.equal(payload.orderItems.length, 1);
  assert.throws(() => buildOrderPayload({
    externalId: "bb_ok", storeId: 1088, recipient: {},
    item: { configurationId: config.configurationId, widthIn: 24, heightIn: 16, mapping: selectCanvasMapping(discovery()), fulfillmentUrl: "https://example.test/master.jpg" },
  }), /lumaprints_mapping_incomplete/);
});

test("print master token expires and does not accept another object key", async () => {
  const secret = "local-test-secret";
  const now = 1_700_000_000;
  const token = await issueMasterToken(secret, MASTER_OBJECT_KEY, now, 900);
  assert.equal((await verifyMasterToken(secret, token, now + 1)).ok, true);
  assert.equal((await verifyMasterToken(secret, token, now + 900)).ok, false);
  assert.equal((await verifyMasterToken("other-secret", token, now + 1)).ok, false);
  await assert.rejects(() => issueMasterToken(secret, "other-file", now, 60));
  await assert.rejects(() => issueMasterToken(secret, MASTER_OBJECT_KEY, now, 901));
});
