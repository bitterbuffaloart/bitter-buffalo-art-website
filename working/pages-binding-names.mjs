// Print Cloudflare Pages binding names and presence only. Never print values.
const REQUIRED = ['LUMAPRINTS_API_KEY', 'LUMAPRINTS_API_SECRET', 'LUMAPRINTS_ENVIRONMENT', 'LUMAPRINTS_ADMIN_TOKEN'];
const ACCOUNT = 'f3ee68d66369fd4b2bc390d1dae218f6';

function unwrap(raw) {
  let text = String(raw).trim();
  if (text.length >= 2 && (text[0] === '"' || text[0] === "'") && text.endsWith(text[0])) text = text.slice(1, -1).trim();
  return text;
}

function environmentLabel(text) {
  const normalized = text.toLowerCase();
  if (normalized === 'sandbox' || normalized === 'production') return normalized;
  return 'INVALID';
}

export function summarizeProcessEnv(env = {}) {
  return REQUIRED.map(key => {
    if (env[key] == null) return `github ${key} MISSING`;
    const text = unwrap(env[key]);
    if (text === '') return `github ${key} EMPTY`;
    if (key === 'LUMAPRINTS_ENVIRONMENT') return `github ${key} PRESENT value=${environmentLabel(text)}`;
    return `github ${key} PRESENT`;
  });
}

function describeBinding(key, entry) {
  if (!entry || typeof entry !== 'object') return `${key} absent MISSING`;
  const type = typeof entry.type === 'string' ? entry.type : 'unknown';
  if (type === 'secret_text') return `${key} ${type} PRESENT`;
  if (entry.value == null) return `${key} ${type} MISSING`;
  const text = unwrap(entry.value);
  if (text === '') return `${key} ${type} EMPTY`;
  if (key === 'LUMAPRINTS_ENVIRONMENT') return `${key} ${type} PRESENT value=${environmentLabel(text)}`;
  return `${key} ${type} PRESENT`;
}

export function summarizeProject(project = {}) {
  const lines = [`production_branch=${typeof project.production_branch === 'string' ? project.production_branch : 'unknown'}`];
  for (const envName of ['preview', 'production']) {
    const vars = project.deployment_configs?.[envName]?.env_vars || {};
    const keys = Object.keys(vars).sort();
    lines.push(`${envName} binding_count=${keys.length}`);
    for (const key of keys) lines.push(`${envName} ${describeBinding(key, vars[key])}`);
    for (const key of REQUIRED) if (!Object.hasOwn(vars, key)) lines.push(`${envName} ${key} absent MISSING`);
  }
  return lines;
}

function safeToPrint(lines, env) {
  const output = lines.join('\n');
  const hidden = [env.CLOUDFLARE_API_TOKEN, env.LUMAPRINTS_API_KEY, env.LUMAPRINTS_API_SECRET, env.LUMAPRINTS_ADMIN_TOKEN];
  return !hidden.some(value => typeof value === 'string' && value.length > 0 && output.includes(value));
}

export async function bindingReport(env = process.env, fetchImpl = globalThis.fetch) {
  const lines = [...summarizeProcessEnv(env)];
  if (!env.CLOUDFLARE_API_TOKEN || !env.CLOUDFLARE_ACCOUNT_ID) {
    lines.push('cloudflare_api_token MISSING');
    return lines;
  }
  lines.push('cloudflare_api_token PRESENT');
  lines.push(`cloudflare_account_id ${env.CLOUDFLARE_ACCOUNT_ID === ACCOUNT ? 'MATCH' : 'UNEXPECTED'}`);
  const response = await fetchImpl(`https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/pages/projects/bitter-buffalo-art`, {
    headers: { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}` },
    signal: AbortSignal.timeout(20000),
  });
  const data = await response.json();
  if (!data?.success) {
    const message = Array.isArray(data?.errors) ? data.errors.map(error => String(error?.message || '').replace(/\s+/g, ' ').slice(0, 160)).join('; ') : '';
    lines.push(`cloudflare_api status=${response.status} success=false ${message}`.trim());
    return lines;
  }
  lines.push(...summarizeProject(data.result || {}));
  return lines;
}

if (process.argv[1] && process.argv[1].endsWith('pages-binding-names.mjs')) {
  const lines = await bindingReport();
  if (!safeToPrint(lines, process.env)) {
    console.log('refusing to print a report that contains a credential');
    process.exit(1);
  }
  console.log(lines.join('\n'));
}
