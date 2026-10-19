import { createCheckout } from "../../prints/orders.mjs";
import { createD1Store } from "../../prints/store.mjs";

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

export async function onRequestPost({ request, env = {} }) {
  let body;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).length > 8000) return json(413, { ok: false, error: "Please shorten your request." });
    body = request.headers.get("content-type")?.includes("application/json")
      ? JSON.parse(text)
      : Object.fromEntries(new URLSearchParams(text));
    if (!body || Array.isArray(body) || typeof body !== "object") throw new Error("invalid");
  } catch {
    return json(400, { ok: false, error: "Enter a valid print request." });
  }
  const store = env.PRINTS_DB ? createD1Store(env.PRINTS_DB) : null;
  const result = await createCheckout({ body, env, store });
  return json(result.status, result.body);
}
