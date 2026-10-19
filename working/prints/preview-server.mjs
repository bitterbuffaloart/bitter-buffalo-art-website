import { createServer } from "node:http";
import { readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { createCheckout } from "../../cloudflare-pages/functions/prints/orders.mjs";

const root = join(import.meta.dirname, "..", "..", "cloudflare-pages");
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".xml": "application/xml" };
const port = Number(process.env.PORT || 8765);

function fileFor(urlPath) {
  const requested = decodeURIComponent(urlPath.split("?")[0]).replace(/^\/+/, "");
  if (requested.includes("..")) return null;
  const full = join(root, requested);
  try {
    const stat = statSync(full);
    return stat.isDirectory() ? join(full, "index.html") : full;
  } catch {
    return null;
  }
}

createServer(async (request, response) => {
  if (request.method === "POST" && new URL(request.url, "http://localhost").pathname === "/api/prints/checkout") {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    let body = {};
    try { body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"); } catch { body = {}; }
    const result = await createCheckout({ body, env: { SQUARE_ENVIRONMENT: "sandbox" }, store: null });
    response.writeHead(result.status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    response.end(JSON.stringify(result.body));
    return;
  }
  const file = fileFor(new URL(request.url, "http://localhost").pathname);
  if (!file) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  response.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" });
  response.end(readFileSync(file));
}).listen(port, "127.0.0.1", () => {
  console.log(`http://127.0.0.1:${port}/photography/prints/grand-tetons/`);
});
