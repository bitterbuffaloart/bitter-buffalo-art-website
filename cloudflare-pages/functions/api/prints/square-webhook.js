import { handleSquareNotification } from "../../prints/orders.mjs";
import { createClient } from "../../prints/square.mjs";
import { createD1Store } from "../../prints/store.mjs";

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

export async function onRequestPost({ request, env = {} }) {
  if (!env.PRINTS_DB) return json(503, { ok: false, error: "Order storage is not configured." });
  const rawBody = await request.text();
  let square;
  try { square = createClient(env); }
  catch (error) { return json(503, { ok: false, error: "Sandbox checkout is not configured.", code: error.message }); }
  const result = await handleSquareNotification({
    rawBody,
    signature: request.headers.get("x-square-hmacsha256-signature"),
    env,
    store: createD1Store(env.PRINTS_DB),
    square,
    lumaprints: null,
  });
  return json(result.status, result.body);
}
