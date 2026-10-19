import { handleShippingNotification } from "../../prints/orders.mjs";
import { createD1Store } from "../../prints/store.mjs";

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

export async function onRequestPost({ request, env = {} }) {
  if (!env.PRINTS_DB) return json(503, { ok: false, error: "Order storage is not configured." });
  let body = {};
  const text = await request.text();
  if (text) {
    try { body = JSON.parse(text); }
    catch { return json(400, { ok: false, error: "invalid_json" }); }
  }
  const result = await handleShippingNotification({
    authorization: request.headers.get("authorization"),
    env,
    store: createD1Store(env.PRINTS_DB),
    body,
  });
  return json(result.status, result.body);
}
