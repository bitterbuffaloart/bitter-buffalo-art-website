import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
const statusRoutes = await import('../cloudflare-pages/functions/api/lumaprints/status.js');
const catalogRoutes = await import('../cloudflare-pages/functions/api/lumaprints/catalog.js');
const quoteRoutes = await import('../cloudflare-pages/functions/api/lumaprints/quote.js');
const { onRequestGet: statusGet } = statusRoutes;
const { onRequestGet: catalogGet } = catalogRoutes;
const { onRequestPost: quotePost } = quoteRoutes;
import { basicHeader, httpStatusFor, lumaRequest } from '../cloudflare-pages/functions/_lib/lumaprints.js';

const originalFetch = globalThis.fetch;
const originalConsole = { log: console.log, info: console.info, warn: console.warn, error: console.error, debug: console.debug };
const admin = 'admin-token-for-test';
const key = 'Lumaprints';
const secret = 'Rocks';
let calls = [];
const logs = [];
for (const method of ['log', 'info', 'warn', 'error', 'debug']) {
  console[method] = (...args) => { logs.push(args.map(String).join(' ')); };
}

function env(overrides = {}) {
  return {
    LUMAPRINTS_API_KEY: key,
    LUMAPRINTS_API_SECRET: secret,
    LUMAPRINTS_ENVIRONMENT: 'sandbox',
    LUMAPRINTS_ADMIN_TOKEN: admin,
    ...overrides,
  };
}
function stub(handler) {
  calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), method: options.method || 'GET', authorization: options.headers?.Authorization || '', body: options.body || '' });
    return handler(String(url), options, calls.length);
  };
}
function authed(token = admin) {
  return { Authorization: `Bearer ${token}` };
}
async function bodyOf(response) {
  const text = await response.text();
  return { status: response.status, text, json: JSON.parse(text) };
}
function assertSilent(text) {
  assert.equal(text.includes(key), false);
  assert.equal(text.includes(secret), false);
  assert.equal(text.includes(admin), false);
  assert.equal(text.includes('Basic '), false);
  assert.equal(text.includes('Authorization'), false);
  assert.equal(logs.length, 0);
}

assert.equal(basicHeader('Lumaprints', 'Rocks'), 'Basic THVtYXByaW50czpSb2Nrcw==');
assert.equal(httpStatusFor('ok', 200), 200);
assert.equal(httpStatusFor('provider', 500), 502);
assert.equal(httpStatusFor('provider', 404), 404);
assert.throws(() => httpStatusFor('unexpected', 200), /Unhandled LumaPrints error class/);

stub(() => { throw new Error('should not be called'); });
let response = await bodyOf(await statusGet({ request: new Request('https://example.com/api/lumaprints/status'), env: {} }));
assert.equal(response.status, 503);
assert.equal(response.json.errorClass, 'configuration');
assert.equal(calls.length, 0);
assert.equal(response.json.credentials, undefined);
assertSilent(response.text);

response = await bodyOf(await statusGet({ request: new Request('https://example.com/api/lumaprints/status', { headers: authed('wrong-token') }), env: env() }));
assert.equal(response.status, 401);
assert.equal(response.json.errorClass, 'admin');
assert.equal(response.json.upstreamStatus, null);
assert.equal(calls.length, 0);
assertSilent(response.text);

assert.equal(statusRoutes.onRequest, undefined);
assert.equal(statusRoutes.onRequestPost, undefined);
assert.equal(catalogRoutes.onRequest, undefined);
assert.equal(quoteRoutes.onRequest, undefined);
assert.equal(quoteRoutes.onRequestGet, undefined);
const bypasses = [
  new Request(`https://example.com/api/lumaprints/status?access_token=${admin}&token=${admin}`),
  new Request('https://example.com/api/lumaprints/status', { headers: { Cookie: `LUMAPRINTS_ADMIN_TOKEN=${admin}` } }),
  new Request('https://example.com/api/lumaprints/status', { headers: { 'X-Admin-Token': admin } }),
  new Request('https://example.com/api/lumaprints/status', { headers: { Authorization: `Basic ${btoa(`${admin}:`)}` } }),
  new Request('https://example.com/api/lumaprints/status', { headers: { Authorization: `bearer ${admin}` } }),
  new Request('https://example.com/api/lumaprints/status', { headers: { Authorization: `Bearer ${key}` } }),
  new Request('https://example.com/api/lumaprints/status', { headers: { Authorization: `Bearer ${admin}extra` } }),
];
for (const request of bypasses) {
  response = await bodyOf(await statusGet({ request, env: env() }));
  assert.equal(response.status, 401);
  assert.equal(response.json.errorClass, 'admin');
  assert.equal(response.json.credentials, undefined);
  assert.equal(calls.length, 0);
  assertSilent(response.text);
}
response = await bodyOf(await statusGet({ env: env() }));
assert.equal(response.status, 401);
assert.equal(calls.length, 0);
response = await bodyOf(await catalogGet({ request: new Request(`https://example.com/api/lumaprints/catalog?access_token=${admin}`), env: env() }));
assert.equal(response.status, 401);
assert.equal(calls.length, 0);
response = await bodyOf(await quotePost({
  request: new Request('https://example.com/api/lumaprints/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: admin, subcategoryId: 101001, width: 16, height: 24 }),
  }),
  env: env(),
}));
assert.equal(response.status, 401);
assert.equal(response.json.errorClass, 'admin');
assert.equal(calls.length, 0);

response = await bodyOf(await catalogGet({ request: new Request('https://example.com/api/lumaprints/catalog', { headers: authed() }), env: env({ LUMAPRINTS_API_KEY: undefined }) }));
assert.equal(response.status, 503);
assert.equal(response.json.credentials.apiKey, 'MISSING');
assert.equal(response.json.credentials.apiSecret, 'PRESENT');
assert.equal(calls.length, 0);

response = await bodyOf(await statusGet({ request: new Request('https://example.com/api/lumaprints/status', { headers: authed() }), env: env({ LUMAPRINTS_API_SECRET: '   ' }) }));
assert.equal(response.json.credentials.apiSecret, 'EMPTY');
assert.equal(calls.length, 0);

response = await bodyOf(await statusGet({ request: new Request('https://example.com/api/lumaprints/status', { headers: authed() }), env: env({ LUMAPRINTS_ENVIRONMENT: 'live' }) }));
assert.equal(response.status, 503);
assert.equal(response.json.environment, null);
assert.equal(response.json.environmentInvalid, true);
assert.equal(calls.length, 0);
assert.doesNotMatch(response.text, /live/);

stub(() => new Response(JSON.stringify([{ id: 101, name: 'Canvas' }]), { status: 200 }));
response = await bodyOf(await statusGet({
  request: new Request('https://example.com/api/lumaprints/status', { headers: authed() }),
  env: env({ LUMAPRINTS_API_KEY: '  "Lumaprints"  ', LUMAPRINTS_API_SECRET: "'Rocks'" }),
}));
assert.equal(response.status, 200);
assert.equal(response.json.authenticated, true);
assert.equal(response.json.environment, 'sandbox');
assert.equal(response.json.host, 'us.api-sandbox.lumaprints.com');
assert.equal(response.json.upstreamStatus, 200);
assert.equal(response.json.categoryCount, 1);
assert.equal(response.json.credentials.apiKey, 'PRESENT');
assert.equal(response.json.standardStore, false);
assert.equal(response.json.storeCount, 0);
assert.equal(calls.length, 2);
assert.equal(calls[0].url, 'https://us.api-sandbox.lumaprints.com/api/v1/products/categories');
assert.equal(calls[1].url, 'https://us.api-sandbox.lumaprints.com/api/v1/stores');
assert.equal(calls[0].authorization, 'Basic THVtYXByaW50czpSb2Nrcw==');
assert.equal(calls[1].authorization, calls[0].authorization);
assertSilent(response.text);

stub((url) => {
  if (url.endsWith('/api/v1/products/categories')) return new Response(JSON.stringify([{ id: 101, name: 'Canvas' }]), { status: 200 });
  if (url.endsWith('/api/v1/stores')) return new Response(JSON.stringify([{ storeId: 42, storeName: 'Studio Standard' }, { storeId: 0, storeName: 'Skipped' }]), { status: 200 });
  throw new Error('unexpected path');
});
response = await bodyOf(await statusGet({ request: new Request('https://example.com/api/lumaprints/status', { headers: authed() }), env: env() }));
assert.equal(response.status, 200);
assert.equal(response.json.standardStore, true);
assert.equal(response.json.storeCount, 1);
assert.equal(response.json.stores[0].storeId, 42);
assert.equal(response.json.stores[0].storeName, 'Studio Standard');
assertSilent(response.text);

stub((url) => {
  if (url.endsWith('/api/v1/products/categories')) return new Response(JSON.stringify([{ id: 101, name: 'Canvas' }]), { status: 200 });
  if (url.endsWith('/api/v1/stores')) return new Response(JSON.stringify({ storeId: 42 }), { status: 200 });
  throw new Error('unexpected path');
});
response = await bodyOf(await statusGet({ request: new Request('https://example.com/api/lumaprints/status', { headers: authed() }), env: env() }));
assert.equal(response.status, 502);
assert.equal(response.json.errorClass, 'provider');
assert.equal(response.json.request.path, '/api/v1/stores');
assertSilent(response.text);

stub(() => new Response(JSON.stringify({ statusCode: 401, message: 'Unauthorized' }), { status: 401 }));
response = await bodyOf(await statusGet({ request: new Request('https://example.com/api/lumaprints/status', { headers: authed() }), env: env() }));
assert.equal(response.status, 401);
assert.equal(response.json.errorClass, 'provider-authentication');
assert.equal(response.json.upstreamStatus, 401);
assert.equal(response.json.authenticated, false);
assert.equal(response.json.message, 'Unauthorized');
assertSilent(response.text);

stub(() => new Response(JSON.stringify({ message: secret }), { status: 401 }));
response = await bodyOf(await statusGet({ request: new Request('https://example.com/api/lumaprints/status', { headers: authed() }), env: env() }));
assert.equal(response.json.message, null);
assertSilent(response.text);

stub(() => new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 }));
response = await bodyOf(await statusGet({ request: new Request('https://example.com/api/lumaprints/status', { headers: authed() }), env: env() }));
assert.equal(response.status, 403);
assert.equal(response.json.errorClass, 'provider-access');
assert.equal(response.json.upstreamStatus, 403);

stub(() => new Response('unavailable', { status: 503 }));
response = await bodyOf(await statusGet({ request: new Request('https://example.com/api/lumaprints/status', { headers: authed() }), env: env() }));
assert.equal(response.status, 502);
assert.equal(response.json.errorClass, 'provider');
assert.equal(response.json.upstreamStatus, 503);
assert.doesNotMatch(response.text, /unavailable/);

stub(() => { throw new TypeError('network down'); });
response = await bodyOf(await statusGet({ request: new Request('https://example.com/api/lumaprints/status', { headers: authed() }), env: env() }));
assert.equal(response.status, 502);
assert.equal(response.json.errorClass, 'network');
assert.equal(response.json.upstreamStatus, null);
assert.doesNotMatch(response.text, /network down/);

stub(() => new Response(JSON.stringify([{ id: 101, name: 'Canvas' }]), { status: 200 }));
response = await bodyOf(await statusGet({ request: new Request('https://example.com/api/lumaprints/status', { headers: authed() }), env: env({ LUMAPRINTS_ENVIRONMENT: 'production' }) }));
assert.equal(calls[0].url, 'https://us.api.lumaprints.com/api/v1/products/categories');
assert.equal(response.json.environment, 'production');

stub((url) => {
  if (url.endsWith('/api/v1/products/categories')) return new Response(JSON.stringify([{ id: 101, name: 'Canvas' }, { id: 'bad;id', name: 'Skipped' }]), { status: 200 });
  if (url.endsWith('/subcategories')) return new Response(JSON.stringify([{ subcategoryId: 101001, name: '0.75in Stretched Canvas', minimumWidth: 5, maximumWidth: 120, minimumHeight: 5, maximumHeight: 52, requiredDPI: 200 }]), { status: 200 });
  if (url.endsWith('/options')) return new Response(JSON.stringify([{ optionGroup: 'Canvas Border', optionGroupItems: [{ optionId: 1, optionName: 'Image Wrap' }] }]), { status: 200 });
  throw new Error('unexpected path');
});
response = await bodyOf(await catalogGet({ request: new Request('https://example.com/api/lumaprints/catalog', { headers: authed() }), env: env() }));
assert.equal(response.status, 200);
assert.equal(response.json.merchandise, 'separate-from-etsy');
assert.equal(response.json.orders.enabled, false);
assert.equal(response.json.categories.length, 1);
assert.equal(response.json.categories[0].subcategories[0].subcategoryId, 101001);
assert.equal(response.json.categories[0].subcategories[0].options[0].optionGroupItems[0].optionName, 'Image Wrap');
assert.equal(response.json.pricing.retrieved, false);
assert.equal(response.json.pricing.path, '/api/v1/pricing/product');
assert.equal(response.json.shipping.path, '/api/v1/pricing/shipping');
assert.equal(calls.some(call => call.url.includes('/orders')), false);
assert.doesNotMatch(response.text, /etsy\.com/);
assertSilent(response.text);

calls = [];
const blocked = await lumaRequest(env(), 'POST', '/api/v1/orders', { body: { storeId: 1 } });
assert.equal(blocked.errorClass, 'rejected');
assert.equal(blocked.called, false);
assert.equal(calls.length, 0);

stub((url) => {
  if (url.endsWith('/pricing/product')) return new Response(JSON.stringify({ subcategoryId: 101001, size: { width: 8, height: 10 }, price: 12.5, options: [{ optionId: 1, optionGroupName: 'Canvas Border', optionName: 'Image Wrap', price: 0 }] }), { status: 200 });
  if (url.endsWith('/pricing/shipping')) return new Response(JSON.stringify({ message: '', shippingMethods: [{ carrier: 'USPS', method: 'usps_ground_advantage', cost: 9.35 }] }), { status: 200 });
  throw new Error('unexpected path');
});
response = await bodyOf(await quotePost({
  request: new Request('https://example.com/api/lumaprints/quote', {
    method: 'POST',
    headers: { ...authed(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ subcategoryId: 101001, width: 8, height: 10, options: [1] }),
  }),
  env: env(),
}));
assert.equal(response.status, 200);
assert.equal(response.json.pricing.retrieved, true);
assert.equal(response.json.pricing.price, 12.5);
assert.equal(response.json.shipping.retrieved, false);
assert.equal(calls.length, 1);
assert.equal(calls[0].url, 'https://us.api-sandbox.lumaprints.com/api/v1/pricing/product');
assert.equal(calls.some(call => call.url.includes('/orders')), false);

response = await bodyOf(await quotePost({
  request: new Request('https://example.com/api/lumaprints/quote', {
    method: 'POST',
    headers: { ...authed(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subcategoryId: 101001,
      size: { width: 8, height: 10 },
      recipient: { addressLine1: '955 E Ball Rd', city: 'Anaheim', state: 'CA', zipCode: '92805', country: 'US' },
    }),
  }),
  env: env(),
}));
assert.equal(response.json.shipping.retrieved, true);
assert.equal(response.json.shipping.shippingMethods[0].cost, 9.35);
assert.equal(calls.at(-1).url, 'https://us.api-sandbox.lumaprints.com/api/v1/pricing/shipping');
assert.equal(calls.some(call => call.url.includes('/orders')), false);
assertSilent(response.text);

calls = [];
response = await bodyOf(await quotePost({
  request: new Request('https://example.com/api/lumaprints/quote', {
    method: 'POST',
    headers: authed(),
    body: JSON.stringify({ subcategoryId: 0, width: 8, height: 10 }),
  }),
  env: env(),
}));
assert.equal(response.status, 400);
assert.equal(response.json.errorClass, 'validation');
assert.equal(calls.length, 0);

globalThis.fetch = originalFetch;
Object.assign(console, originalConsole);
const states = liveStates();
if (states.apiKey !== 'PRESENT' || states.apiSecret !== 'PRESENT') {
  console.log(`PASS lumaprints: admin gate, credential states, sandbox and production hosts, 200/401/403/5xx/network, catalog, quote, no orders. Live sandbox was not called because credentials are ${states.apiKey}/${states.apiSecret}.`);
} else if (states.environment !== 'sandbox') {
  console.log('PASS lumaprints. Live call skipped because LUMAPRINTS_ENVIRONMENT is not sandbox.');
} else {
  try {
    const live = await liveProbe();
    console.log(`PASS lumaprints. Live sandbox ${live}`);
  } catch (error) {
    console.log(`PASS lumaprints. Live sandbox stopped with ${error?.name || 'Error'} before a catalog result.`);
  }
}

function valueState(raw) {
  if (raw == null) return 'MISSING';
  if (typeof raw !== 'string') return 'EMPTY';
  let text = raw.trim();
  if (text.length >= 2) {
    const quote = text[0];
    if ((quote === '"' || quote === "'") && text.endsWith(quote)) text = text.slice(1, -1).trim();
  }
  return text === '' ? 'EMPTY' : 'PRESENT';
}
function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match) out[match[1]] = match[2];
  }
  return out;
}
function liveStates() {
  const fromFiles = {};
  for (const file of ['.env', '.dev.vars', 'cloudflare-pages/.dev.vars', 'cloudflare-pages/.env']) {
    const parsed = parseEnvFile(file);
    for (const [name, value] of Object.entries(parsed)) if (fromFiles[name] == null) fromFiles[name] = value;
  }
  const pick = name => (process.env[name] != null && process.env[name] !== '' ? process.env[name] : fromFiles[name]);
  const environment = valueState(pick('LUMAPRINTS_ENVIRONMENT')) === 'PRESENT' ? String(pick('LUMAPRINTS_ENVIRONMENT')).trim().replace(/^['"]|['"]$/g, '').toLowerCase() : 'MISSING';
  return {
    apiKey: valueState(pick('LUMAPRINTS_API_KEY')),
    apiSecret: valueState(pick('LUMAPRINTS_API_SECRET')),
    environment,
    values: {
      LUMAPRINTS_API_KEY: pick('LUMAPRINTS_API_KEY'),
      LUMAPRINTS_API_SECRET: pick('LUMAPRINTS_API_SECRET'),
      LUMAPRINTS_ENVIRONMENT: pick('LUMAPRINTS_ENVIRONMENT'),
      LUMAPRINTS_ADMIN_TOKEN: 'local-check-token',
    },
  };
}
async function liveProbe() {
  const { values } = liveStates();
  const checked = await bodyOf(await statusGet({
    request: new Request('https://example.com/api/lumaprints/status', { headers: authed('local-check-token') }),
    env: values,
  }));
  if (!checked.json.authenticated) return `status=${checked.json.upstreamStatus} errorClass=${checked.json.errorClass}`;
  const listed = await bodyOf(await catalogGet({
    request: new Request('https://example.com/api/lumaprints/catalog', { headers: authed('local-check-token') }),
    env: values,
  }));
  const names = (listed.json.categories || []).map(category => `${category.name}:${(category.subcategories || []).map(item => item.name).join(',')}`).join('; ');
  return `status=200 categories=${checked.json.categoryCount} products=${names || 'none'}`;
}
