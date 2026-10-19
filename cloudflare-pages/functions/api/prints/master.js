import { verifyMasterToken } from "../../prints/master-access.mjs";

function denied(status) {
  return new Response(status === 503 ? "Storage is not configured." : "Not found.", {
    status,
    headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
}

export async function onRequestGet({ request, env = {} }) {
  const token = new URL(request.url).searchParams.get("t");
  const verdict = await verifyMasterToken(env.PRINT_MASTER_URL_SECRET, token, Math.floor(Date.now() / 1000));
  if (!verdict.ok) return denied(404);
  if (!env.PRINT_MASTERS || typeof env.PRINT_MASTERS.get !== "function") return denied(503);
  const object = await env.PRINT_MASTERS.get(verdict.key);
  if (!object) return denied(404);
  const type = object.httpMetadata?.contentType || "image/jpeg";
  return new Response(object.body, {
    status: 200,
    headers: {
      "Content-Type": type,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
