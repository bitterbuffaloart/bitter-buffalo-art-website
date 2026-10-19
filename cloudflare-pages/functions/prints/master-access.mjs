/** Short-lived fulfillment URL for the print master. The object stays in a private R2 binding. */
export const MASTER_OBJECT_KEY = "bb-photo-01-dsc-2626";
export const MAX_TTL_SECONDS = 900;

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlToBytes(value) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function sign(secret, payload) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
}

function safeEqual(left, right) {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) diff |= left[index] ^ right[index];
  return diff === 0;
}

export async function issueMasterToken(secret, objectKey, nowSeconds, ttlSeconds = MAX_TTL_SECONDS) {
  if (!secret) throw new Error("print_master_url_secret_missing");
  if (objectKey !== MASTER_OBJECT_KEY) throw new Error("print_master_key_rejected");
  if (!Number.isInteger(ttlSeconds) || ttlSeconds < 1 || ttlSeconds > MAX_TTL_SECONDS) {
    throw new Error("print_master_ttl_rejected");
  }
  const exp = nowSeconds + ttlSeconds;
  const payload = `${objectKey}.${exp}`;
  const signature = bytesToBase64Url(await sign(secret, payload));
  return `${bytesToBase64Url(new TextEncoder().encode(payload))}.${signature}`;
}

export async function verifyMasterToken(secret, token, nowSeconds) {
  if (!secret || typeof token !== "string") return { ok: false };
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false };
  let payload;
  try { payload = new TextDecoder().decode(base64UrlToBytes(parts[0])); } catch { return { ok: false }; }
  const match = /^([a-z0-9-]+)\.(\d+)$/.exec(payload);
  if (!match || match[1] !== MASTER_OBJECT_KEY) return { ok: false };
  const exp = Number(match[2]);
  if (!Number.isInteger(exp) || exp <= nowSeconds || exp > nowSeconds + MAX_TTL_SECONDS) return { ok: false };
  const expected = await sign(secret, payload);
  let actual;
  try { actual = base64UrlToBytes(parts[1]); } catch { return { ok: false }; }
  if (!safeEqual(actual, expected)) return { ok: false };
  return { ok: true, key: match[1], exp };
}

export function masterFulfillmentPath(token) {
  return `/api/prints/master?t=${encodeURIComponent(token)}`;
}
