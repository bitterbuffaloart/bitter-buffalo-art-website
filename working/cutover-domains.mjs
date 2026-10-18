/**
 * Authorized cutover helper for bitter-buffalo-art Pages + zone DNS.
 * Never logs token values. Invoked from GitHub Actions with secrets.
 */
const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID;
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ZONE = process.env.ZONE_ID;
const PROJECT = process.env.PROJECT || 'bitter-buffalo-art';
const STEP = process.env.CUTOVER_STEP || 'status';
const TARGET = 'bitter-buffalo-art.pages.dev';

if (!ACCOUNT || !TOKEN || !ZONE) {
  console.error('Missing CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, or ZONE_ID');
  process.exit(1);
}

async function cf(method, path, body) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { success: false, raw: text.slice(0, 500) };
  }
  return { status: res.status, data };
}

async function listDns() {
  const { status, data } = await cf('GET', `/zones/${ZONE}/dns_records?per_page=100`);
  if (!data.success) throw new Error(`list dns ${status} ${JSON.stringify(data.errors || data)}`);
  return data.result;
}

async function listDomains() {
  const { status, data } = await cf('GET', `/accounts/${ACCOUNT}/pages/projects/${PROJECT}/domains`);
  if (!data.success) throw new Error(`list domains ${status} ${JSON.stringify(data.errors || data)}`);
  return data.result;
}

async function addDomain(name) {
  const { status, data } = await cf('POST', `/accounts/${ACCOUNT}/pages/projects/${PROJECT}/domains`, { name });
  console.log(JSON.stringify({ action: 'add-domain', name, http: status, success: data.success, errors: data.errors, result: data.result }, null, 2));
  return data;
}

async function setWebDns() {
  const records = await listDns();
  const apexA = records.filter((r) => r.type === 'A' && r.name === 'bitterbuffaloart.com');
  const apexAAAA = records.filter((r) => r.type === 'AAAA' && r.name === 'bitterbuffaloart.com');
  const www = records.filter((r) => r.type === 'CNAME' && r.name === 'www.bitterbuffaloart.com');
  const apexCname = records.filter((r) => r.type === 'CNAME' && r.name === 'bitterbuffaloart.com');

  // Preserve mail/TXT: never touch MX/TXT/NS
  for (const r of [...apexA, ...apexAAAA]) {
    const del = await cf('DELETE', `/zones/${ZONE}/dns_records/${r.id}`);
    console.log(JSON.stringify({ action: 'delete', type: r.type, name: r.name, content: r.content, http: del.status, success: del.data.success, errors: del.data.errors }));
  }

  if (apexCname.length === 0) {
    const created = await cf('POST', `/zones/${ZONE}/dns_records`, {
      type: 'CNAME',
      name: 'bitterbuffaloart.com',
      content: TARGET,
      ttl: 1,
      proxied: true,
    });
    console.log(JSON.stringify({ action: 'create-apex-cname', http: created.status, success: created.data.success, errors: created.data.errors, result: created.data.result && { id: created.data.result.id, content: created.data.result.content, proxied: created.data.result.proxied } }));
  } else {
    for (const r of apexCname) {
      const patched = await cf('PUT', `/zones/${ZONE}/dns_records/${r.id}`, {
        type: 'CNAME',
        name: 'bitterbuffaloart.com',
        content: TARGET,
        ttl: 1,
        proxied: true,
      });
      console.log(JSON.stringify({ action: 'update-apex-cname', http: patched.status, success: patched.data.success, errors: patched.data.errors }));
    }
  }

  if (www.length === 0) {
    const created = await cf('POST', `/zones/${ZONE}/dns_records`, {
      type: 'CNAME',
      name: 'www',
      content: TARGET,
      ttl: 1,
      proxied: true,
    });
    console.log(JSON.stringify({ action: 'create-www-cname', http: created.status, success: created.data.success, errors: created.data.errors }));
  } else {
    for (const r of www) {
      const patched = await cf('PUT', `/zones/${ZONE}/dns_records/${r.id}`, {
        type: 'CNAME',
        name: 'www',
        content: TARGET,
        ttl: 1,
        proxied: true,
      });
      console.log(JSON.stringify({ action: 'update-www-cname', from: r.content, http: patched.status, success: patched.data.success, errors: patched.data.errors }));
    }
  }

  const after = await listDns();
  const summary = after.map((r) => ({ type: r.type, name: r.name, content: r.content, proxied: r.proxied, priority: r.priority }));
  console.log(JSON.stringify({ action: 'dns-after', records: summary }, null, 2));
}

async function status() {
  const domains = await listDomains().catch((e) => ({ error: String(e.message || e) }));
  const dns = await listDns().catch((e) => ({ error: String(e.message || e) }));
  console.log(JSON.stringify({
    step: 'status',
    domains,
    web: Array.isArray(dns) ? dns.filter((r) => ['A', 'AAAA', 'CNAME'].includes(r.type) && (r.name === 'bitterbuffaloart.com' || r.name === 'www.bitterbuffaloart.com')).map((r) => ({ type: r.type, name: r.name, content: r.content, proxied: r.proxied })) : dns,
    mail: Array.isArray(dns) ? dns.filter((r) => r.type === 'MX' || (r.type === 'TXT' && (String(r.content).includes('spf') || String(r.name).includes('domainkey') || String(r.name).includes('_dmarc')))).map((r) => ({ type: r.type, name: r.name, content: r.content, priority: r.priority })) : null,
  }, null, 2));
}

async function main() {
  console.log(JSON.stringify({ step: STEP, account_suffix: ACCOUNT.slice(-6), zone_suffix: ZONE.slice(-6) }));
  if (STEP === 'status' || STEP === 'export') {
    await status();
    return;
  }
  if (STEP === 'add-domains') {
    await addDomain('bitterbuffaloart.com');
    await addDomain('www.bitterbuffaloart.com');
    await status();
    return;
  }
  if (STEP === 'set-web-dns') {
    await setWebDns();
    return;
  }
  throw new Error(`Unknown step ${STEP}`);
}

main().catch((err) => {
  console.error(String(err && err.stack ? err.stack : err));
  process.exit(1);
});
