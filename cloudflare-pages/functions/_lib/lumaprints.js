// Server-only LumaPrints client. Credentials stay in the Pages env binding.
// Documented reads: GET /api/v1/products/categories,
// GET /api/v1/products/categories/{categoryId}/subcategories,
// GET /api/v1/products/subcategories/{subcategoryId}/options,
// GET /api/v1/stores (Standard Stores only).
// Quotes, not orders: POST /api/v1/pricing/product and POST /api/v1/pricing/shipping.
// https://api-docs.lumaprints.com/doc-420489

const HOSTS = {
  sandbox: 'us.api-sandbox.lumaprints.com',
  production: 'us.api.lumaprints.com',
};
const CATEGORIES_PATH = '/api/v1/products/categories';
const STORES_PATH = '/api/v1/stores';
const MAX_UPSTREAM = 48;
const MAX_LABEL = 160;

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function unwrap(raw) {
  if (typeof raw !== 'string') return '';
  let text = raw.trim();
  if (text.length >= 2) {
    const quote = text[0];
    if ((quote === '"' || quote === "'") && text.endsWith(quote)) text = text.slice(1, -1).trim();
  }
  return text;
}

function valueState(raw) {
  if (raw == null) return 'MISSING';
  if (typeof raw !== 'string') return 'EMPTY';
  return unwrap(raw) === '' ? 'EMPTY' : 'PRESENT';
}

function environmentOf(env = {}) {
  const state = valueState(env.LUMAPRINTS_ENVIRONMENT);
  if (state !== 'PRESENT') return { name: null, invalid: false, host: null };
  const name = unwrap(env.LUMAPRINTS_ENVIRONMENT).toLowerCase();
  if (name === 'sandbox' || name === 'production') return { name, invalid: false, host: HOSTS[name] };
  return { name: null, invalid: true, host: null };
}

function publicMeta(env = {}) {
  const environment = environmentOf(env);
  return {
    source: 'lumaprints',
    environment: environment.name,
    environmentInvalid: environment.invalid,
    host: environment.host,
    credentials: {
      apiKey: valueState(env.LUMAPRINTS_API_KEY),
      apiSecret: valueState(env.LUMAPRINTS_API_SECRET),
      environment: valueState(env.LUMAPRINTS_ENVIRONMENT),
    },
    orders: { enabled: false },
    merchandise: 'separate-from-etsy',
  };
}

function secretValues(env = {}) {
  return [env.LUMAPRINTS_API_KEY, env.LUMAPRINTS_API_SECRET, env.LUMAPRINTS_ADMIN_TOKEN]
    .map(unwrap)
    .filter(value => value !== '');
}

function ready(env = {}) {
  const environment = environmentOf(env);
  return valueState(env.LUMAPRINTS_API_KEY) === 'PRESENT'
    && valueState(env.LUMAPRINTS_API_SECRET) === 'PRESENT'
    && environment.name !== null;
}

function basicHeader(key, secret) {
  const bytes = new TextEncoder().encode(`${key}:${secret}`);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `Basic ${btoa(binary)}`;
}

function allowed(method, path) {
  if (method === 'GET' && (path === CATEGORIES_PATH || path === STORES_PATH)) return true;
  if (method === 'GET' && /^\/api\/v1\/products\/categories\/[1-9]\d{0,11}\/subcategories$/.test(path)) return true;
  if (method === 'GET' && /^\/api\/v1\/products\/subcategories\/[1-9]\d{0,11}\/options$/.test(path)) return true;
  if (method === 'POST' && (path === '/api/v1/pricing/product' || path === '/api/v1/pricing/shipping')) return true;
  return false;
}

function httpStatusFor(errorClass, upstreamStatus) {
  switch (errorClass) {
    case 'ok':
      return 200;
    case 'validation':
      return 400;
    case 'configuration':
      return 503;
    case 'admin':
      return 401;
    case 'network':
      return 502;
    case 'provider-authentication':
      return 401;
    case 'provider-access':
      return 403;
    case 'rejected':
      return 403;
    case 'provider':
      return upstreamStatus >= 400 && upstreamStatus < 500 ? upstreamStatus : 502;
    default: {
      const unexpected = errorClass;
      throw new Error(`Unhandled LumaPrints error class: ${String(unexpected)}`);
    }
  }
}

function classifyStatus(status) {
  if (status === 401) return 'provider-authentication';
  if (status === 403) return 'provider-access';
  return 'provider';
}

function safeMessage(value, secrets) {
  if (typeof value !== 'string') return null;
  const text = value.replace(/\s+/g, ' ').trim().slice(0, 240);
  if (!text || /authorization/i.test(text) || /basic\s/i.test(text)) return null;
  if (secrets.some(secret => text.includes(secret))) return null;
  return text;
}

function cleanLabel(value, secrets) {
  if (typeof value !== 'string') return '';
  const text = value.trim().slice(0, MAX_LABEL);
  if (!text || secrets.some(secret => text.includes(secret))) return '';
  return text;
}

function positiveId(value) {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 1e12) return null;
  return value;
}

function configurationResult(env) {
  return {
    errorClass: 'configuration',
    upstreamStatus: null,
    called: false,
    message: environmentOf(env).invalid
      ? 'LUMAPRINTS_ENVIRONMENT must be sandbox or production.'
      : 'LumaPrints credentials are not configured on the server.',
  };
}

async function lumaRequest(env, method, path, options = {}) {
  if (!allowed(method, path)) {
    return { errorClass: 'rejected', upstreamStatus: null, called: false, message: 'That LumaPrints request is not enabled.' };
  }
  if (!ready(env)) return configurationResult(env);
  const environment = environmentOf(env);
  const secrets = secretValues(env);
  let response;
  try {
    response = await fetch(`https://${environment.host}${path}`, {
      method,
      headers: {
        Authorization: basicHeader(unwrap(env.LUMAPRINTS_API_KEY), unwrap(env.LUMAPRINTS_API_SECRET)),
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    return {
      errorClass: 'network',
      upstreamStatus: null,
      called: true,
      message: 'The print service could not be reached.',
    };
  }
  const errorClass = response.ok ? 'ok' : classifyStatus(response.status);
  let parsed = null;
  try {
    const text = await response.text();
    parsed = text ? JSON.parse(text.slice(0, 1_000_000)) : null;
  } catch {
    parsed = null;
  }
  const message = !response.ok && parsed && typeof parsed === 'object'
    ? safeMessage(parsed.message, secrets)
    : null;
  return {
    errorClass,
    upstreamStatus: response.status,
    called: true,
    json: response.ok ? parsed : null,
    message,
  };
}

function failureBody(env, result, request) {
  return {
    ok: false,
    authenticated: false,
    errorClass: result.errorClass,
    ...publicMeta(env),
    request: request || null,
    upstreamStatus: result.upstreamStatus,
    message: result.message || null,
  };
}

async function sameSecret(provided, expected) {
  const encoded = new TextEncoder();
  const digest = value => crypto.subtle.digest('SHA-256', encoded.encode(value));
  const [left, right] = await Promise.all([digest(provided), digest(expected)]);
  const a = new Uint8Array(left);
  const b = new Uint8Array(right);
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function requireAdmin(request, env = {}) {
  if (valueState(env.LUMAPRINTS_ADMIN_TOKEN) !== 'PRESENT') {
    return jsonResponse(503, {
      ok: false,
      authenticated: false,
      errorClass: 'configuration',
      request: null,
      upstreamStatus: null,
      message: 'The print connection check is not configured.',
    });
  }
  const header = request?.headers?.get?.('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token || token.length > 512 || /\s/.test(token) || !(await sameSecret(token, unwrap(env.LUMAPRINTS_ADMIN_TOKEN)))) {
    return jsonResponse(401, {
      ok: false,
      authenticated: false,
      errorClass: 'admin',
      request: null,
      upstreamStatus: null,
      message: 'Administrator authentication is required.',
    });
  }
  return null;
}

function mapStores(payload, secrets) {
  if (!Array.isArray(payload)) return null;
  return payload.map(store => ({
    storeId: positiveId(store?.storeId),
    storeName: cleanLabel(store?.storeName, secrets),
  })).filter(store => store.storeId && store.storeName);
}

async function checkConnection(env) {
  const request = { method: 'GET', path: CATEGORIES_PATH };
  const result = await lumaRequest(env, 'GET', CATEGORIES_PATH);
  if (result.errorClass !== 'ok') return jsonResponse(httpStatusFor(result.errorClass, result.upstreamStatus), failureBody(env, result, result.called ? request : null));
  const categories = Array.isArray(result.json) ? result.json : null;
  if (!categories) {
    return jsonResponse(502, failureBody(env, { errorClass: 'provider', upstreamStatus: result.upstreamStatus, message: 'The print service returned an unexpected catalog.' }, request));
  }
  const storesRequest = { method: 'GET', path: STORES_PATH };
  const storesResult = await lumaRequest(env, 'GET', STORES_PATH);
  if (storesResult.errorClass !== 'ok') {
    return jsonResponse(httpStatusFor(storesResult.errorClass, storesResult.upstreamStatus), failureBody(env, storesResult, storesResult.called ? storesRequest : null));
  }
  const stores = mapStores(storesResult.json, secretValues(env));
  if (!stores) {
    return jsonResponse(502, failureBody(env, { errorClass: 'provider', upstreamStatus: storesResult.upstreamStatus, message: 'The print service returned an unexpected store list.' }, storesRequest));
  }
  return jsonResponse(200, {
    ok: true,
    authenticated: true,
    errorClass: null,
    ...publicMeta(env),
    request,
    upstreamStatus: 200,
    categoryCount: categories.length,
    stores,
    storeCount: stores.length,
    standardStore: stores.length > 0,
    message: null,
  });
}

function mapOptions(payload, secrets) {
  if (!Array.isArray(payload)) return null;
  return payload.map(group => ({
    optionGroup: cleanLabel(group?.optionGroup, secrets),
    optionGroupItems: Array.isArray(group?.optionGroupItems)
      ? group.optionGroupItems.map(item => ({
        optionId: positiveId(item?.optionId),
        optionName: cleanLabel(item?.optionName, secrets),
      })).filter(item => item.optionId && item.optionName)
      : [],
  })).filter(group => group.optionGroup);
}

async function loadCatalog(env) {
  const secrets = secretValues(env);
  let calls = 0;
  const next = async (method, path) => {
    calls += 1;
    if (calls > MAX_UPSTREAM) return { errorClass: 'truncated' };
    return lumaRequest(env, method, path);
  };
  const categoriesResult = await next('GET', CATEGORIES_PATH);
  if (categoriesResult.errorClass === 'truncated') {
    return jsonResponse(200, { ok: true, authenticated: true, ...publicMeta(env), categories: [], truncated: true, pricing: quoteCapability(), shipping: quoteCapability('shipping') });
  }
  if (categoriesResult.errorClass !== 'ok') {
    return jsonResponse(httpStatusFor(categoriesResult.errorClass, categoriesResult.upstreamStatus), failureBody(env, categoriesResult, { method: 'GET', path: CATEGORIES_PATH }));
  }
  if (!Array.isArray(categoriesResult.json)) {
    return jsonResponse(502, failureBody(env, { errorClass: 'provider', upstreamStatus: categoriesResult.upstreamStatus, message: 'The print service returned an unexpected catalog.' }, { method: 'GET', path: CATEGORIES_PATH }));
  }
  const categories = [];
  let truncated = false;
  for (const category of categoriesResult.json) {
    const id = positiveId(category?.id);
    const name = cleanLabel(category?.name, secrets);
    if (!id || !name) continue;
    const subsResult = await next('GET', `/api/v1/products/categories/${id}/subcategories`);
    if (subsResult.errorClass === 'truncated') { truncated = true; break; }
    if (subsResult.errorClass !== 'ok') {
      return jsonResponse(httpStatusFor(subsResult.errorClass, subsResult.upstreamStatus), failureBody(env, subsResult, { method: 'GET', path: `/api/v1/products/categories/${id}/subcategories` }));
    }
    if (!Array.isArray(subsResult.json)) {
      return jsonResponse(502, failureBody(env, { errorClass: 'provider', upstreamStatus: subsResult.upstreamStatus, message: 'The print service returned an unexpected size list.' }, { method: 'GET', path: `/api/v1/products/categories/${id}/subcategories` }));
    }
    const subcategories = [];
    for (const sub of subsResult.json) {
      const subcategoryId = positiveId(sub?.subcategoryId);
      const subName = cleanLabel(sub?.name, secrets);
      if (!subcategoryId || !subName) continue;
      const optionsResult = await next('GET', `/api/v1/products/subcategories/${subcategoryId}/options`);
      if (optionsResult.errorClass === 'truncated') { truncated = true; break; }
      if (optionsResult.errorClass !== 'ok') {
        return jsonResponse(httpStatusFor(optionsResult.errorClass, optionsResult.upstreamStatus), failureBody(env, optionsResult, { method: 'GET', path: `/api/v1/products/subcategories/${subcategoryId}/options` }));
      }
      const options = mapOptions(optionsResult.json, secrets);
      if (!options) {
        return jsonResponse(502, failureBody(env, { errorClass: 'provider', upstreamStatus: optionsResult.upstreamStatus, message: 'The print service returned unexpected options.' }, { method: 'GET', path: `/api/v1/products/subcategories/${subcategoryId}/options` }));
      }
      subcategories.push({
        subcategoryId,
        name: subName,
        minimumWidth: numberOrNull(sub?.minimumWidth),
        maximumWidth: numberOrNull(sub?.maximumWidth),
        minimumHeight: numberOrNull(sub?.minimumHeight),
        maximumHeight: numberOrNull(sub?.maximumHeight),
        requiredDPI: numberOrNull(sub?.requiredDPI),
        options,
      });
    }
    categories.push({ id, name, subcategories });
    if (truncated) break;
  }
  return jsonResponse(200, {
    ok: true,
    authenticated: true,
    errorClass: null,
    ...publicMeta(env),
    categories,
    truncated,
    pricing: {
      supported: true,
      method: 'POST',
      path: '/api/v1/pricing/product',
      retrieved: false,
      reason: 'A price is calculated for one subcategory and size through the quote endpoint.',
    },
    shipping: {
      supported: true,
      method: 'POST',
      path: '/api/v1/pricing/shipping',
      retrieved: false,
      reason: 'A shipping estimate needs a destination. No destination is assumed.',
    },
  });
}

function numberOrNull(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function quoteCapability(kind = 'pricing') {
  if (kind === 'shipping') {
    return { supported: true, method: 'POST', path: '/api/v1/pricing/shipping', retrieved: false };
  }
  return { supported: true, method: 'POST', path: '/api/v1/pricing/product', retrieved: false };
}

function finiteSize(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 200;
}

function parseQuote(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Send a print quote as JSON.' };
  const subcategoryId = positiveId(body.subcategoryId);
  const width = body.size?.width ?? body.width;
  const height = body.size?.height ?? body.height;
  if (!subcategoryId) return { error: 'A subcategory id is required.' };
  if (!finiteSize(width) || !finiteSize(height)) return { error: 'Width and height must be inches between 0 and 200.' };
  let options;
  if (body.options != null) {
    if (!Array.isArray(body.options) || body.options.length > 24 || body.options.some(item => !positiveId(item))) {
      return { error: 'Options must be a short list of option ids.' };
    }
    options = body.options;
  }
  let recipient;
  if (body.recipient != null) {
    recipient = parseRecipient(body.recipient);
    if (!recipient) return { error: 'A shipping quote needs a street, city, state, postal code, and two-letter country.' };
  }
  const quantity = body.quantity == null ? 1 : body.quantity;
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) return { error: 'Quantity must be a whole number from 1 to 20.' };
  return { value: { subcategoryId, size: { width, height }, options, recipient, quantity } };
}

function parseRecipient(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const text = (field, max) => (typeof value[field] === 'string' ? value[field].trim().slice(0, max) : '');
  const recipient = {
    addressLine1: text('addressLine1', 120),
    city: text('city', 80),
    state: text('state', 40),
    zipCode: text('zipCode', 20),
    country: text('country', 2).toUpperCase(),
  };
  if (!recipient.addressLine1 || !recipient.city || !recipient.state || !recipient.zipCode || !/^[A-Z]{2}$/.test(recipient.country)) return null;
  for (const field of ['firstName', 'lastName', 'company', 'addressLine2', 'phone']) {
    const item = text(field, 80);
    if (item) recipient[field] = item;
  }
  return recipient;
}

function sanitizePrice(payload, secrets) {
  if (!payload || typeof payload !== 'object' || typeof payload.price !== 'number') return null;
  return {
    subcategoryId: positiveId(payload.subcategoryId),
    size: {
      width: numberOrNull(payload.size?.width),
      height: numberOrNull(payload.size?.height),
    },
    price: payload.price,
    options: Array.isArray(payload.options) ? payload.options.map(item => ({
      optionId: positiveId(item?.optionId),
      optionGroupName: cleanLabel(item?.optionGroupName, secrets),
      optionName: cleanLabel(item?.optionName, secrets),
      price: typeof item?.price === 'number' ? item.price : null,
    })) : [],
  };
}

function sanitizeShipping(payload, secrets) {
  if (!payload || typeof payload !== 'object' || !Array.isArray(payload.shippingMethods)) return null;
  return {
    message: safeMessage(payload.message, secrets) || '',
    shippingMethods: payload.shippingMethods.map(item => ({
      carrier: cleanLabel(item?.carrier, secrets).slice(0, 80),
      method: cleanLabel(item?.method, secrets).slice(0, 80),
      cost: typeof item?.cost === 'number' ? item.cost : null,
    })),
  };
}

async function quotePrint(request, env) {
  let raw;
  try {
    if (Number(request.headers.get('content-length')) > 8000) return jsonResponse(413, { ok: false, errorClass: 'validation', message: 'The quote is too large.' });
    const text = await request.text();
    if (new TextEncoder().encode(text).length > 8000) return jsonResponse(413, { ok: false, errorClass: 'validation', message: 'The quote is too large.' });
    raw = JSON.parse(text);
  } catch {
    return jsonResponse(400, { ok: false, errorClass: 'validation', ...publicMeta(env), message: 'Send a print quote as JSON.' });
  }
  const parsed = parseQuote(raw);
  if (parsed.error) return jsonResponse(400, { ok: false, errorClass: 'validation', ...publicMeta(env), message: parsed.error });
  const input = parsed.value;
  const pricingResult = await lumaRequest(env, 'POST', '/api/v1/pricing/product', {
    body: {
      subcategoryId: input.subcategoryId,
      size: input.size,
      ...(input.options ? { options: input.options } : {}),
    },
  });
  if (pricingResult.errorClass !== 'ok') {
    return jsonResponse(httpStatusFor(pricingResult.errorClass, pricingResult.upstreamStatus), failureBody(env, pricingResult, { method: 'POST', path: '/api/v1/pricing/product' }));
  }
  const secrets = secretValues(env);
  const pricing = sanitizePrice(pricingResult.json, secrets);
  if (!pricing) {
    return jsonResponse(502, failureBody(env, { errorClass: 'provider', upstreamStatus: pricingResult.upstreamStatus, message: 'The print service returned an unexpected price.' }, { method: 'POST', path: '/api/v1/pricing/product' }));
  }
  let shipping = { supported: true, method: 'POST', path: '/api/v1/pricing/shipping', retrieved: false, reason: 'No destination was provided.' };
  if (input.recipient) {
    const shippingResult = await lumaRequest(env, 'POST', '/api/v1/pricing/shipping', {
      body: {
        recipient: input.recipient,
        orderItems: [{
          subcategoryId: input.subcategoryId,
          quantity: input.quantity,
          width: Math.max(1, Math.round(input.size.width)),
          height: Math.max(1, Math.round(input.size.height)),
          ...(input.options ? { orderItemOptions: input.options } : {}),
        }],
      },
    });
    if (shippingResult.errorClass !== 'ok') {
      const body = failureBody(env, shippingResult, { method: 'POST', path: '/api/v1/pricing/shipping' });
      return jsonResponse(httpStatusFor(shippingResult.errorClass, shippingResult.upstreamStatus), { ...body, pricing: { ...pricing, retrieved: true } });
    }
    const methods = sanitizeShipping(shippingResult.json, secrets);
    if (!methods) {
      return jsonResponse(502, failureBody(env, { errorClass: 'provider', upstreamStatus: shippingResult.upstreamStatus, message: 'The print service returned an unexpected shipping estimate.' }, { method: 'POST', path: '/api/v1/pricing/shipping' }));
    }
    shipping = { supported: true, method: 'POST', path: '/api/v1/pricing/shipping', retrieved: true, ...methods };
  }
  return jsonResponse(200, {
    ok: true,
    authenticated: true,
    errorClass: null,
    ...publicMeta(env),
    pricing: { supported: true, method: 'POST', path: '/api/v1/pricing/product', retrieved: true, ...pricing },
    shipping,
  });
}

export {
  basicHeader,
  checkConnection,
  httpStatusFor,
  jsonResponse,
  loadCatalog,
  lumaRequest,
  publicMeta,
  quotePrint,
  requireAdmin,
  valueState,
};
