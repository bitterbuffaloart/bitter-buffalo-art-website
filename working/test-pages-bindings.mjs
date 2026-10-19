import assert from 'node:assert/strict';
import { summarizeProcessEnv, summarizeProject } from './pages-binding-names.mjs';

const secret = 'super-secret-value-do-not-print';
const other = 'another-secret-value';
const lines = summarizeProject({
  production_branch: 'main',
  deployment_configs: {
    preview: {
      env_vars: {
        LUMAPRINTS_API_KEY: { type: 'secret_text', value: secret },
        LUMAPRINTS_API_SECRET: { type: 'secret_text' },
        LUMAPRINTS_ENVIRONMENT: { type: 'plain_text', value: 'sandbox' },
        LUMAPRINTS_ADMIN_TOKEN: { type: 'plain_text', value: '   ' },
        OTHER_TOKEN: { type: 'plain_text', value: other },
      },
    },
    production: { env_vars: {} },
  },
});
const text = lines.join('\n');
assert.equal(text.includes(secret), false);
assert.equal(text.includes(other), false);
assert.match(text, /preview LUMAPRINTS_API_KEY secret_text PRESENT/);
assert.match(text, /preview LUMAPRINTS_API_SECRET secret_text PRESENT/);
assert.match(text, /preview LUMAPRINTS_ENVIRONMENT plain_text PRESENT value=sandbox/);
assert.match(text, /preview LUMAPRINTS_ADMIN_TOKEN plain_text EMPTY/);
assert.match(text, /preview OTHER_TOKEN plain_text PRESENT/);
assert.match(text, /production LUMAPRINTS_API_KEY absent MISSING/);
assert.equal(summarizeProject({ deployment_configs: { preview: { env_vars: { LUMAPRINTS_ENVIRONMENT: { type: 'plain_text', value: secret } } } } }).join('\n').includes(secret), false);
assert.match(summarizeProject({ deployment_configs: { preview: { env_vars: { LUMAPRINTS_ENVIRONMENT: { type: 'plain_text', value: 'production' } } } } }).join('\n'), /value=production/);
const github = summarizeProcessEnv({ LUMAPRINTS_API_KEY: secret, LUMAPRINTS_API_SECRET: '', LUMAPRINTS_ENVIRONMENT: 'sandbox' }).join('\n');
assert.equal(github.includes(secret), false);
assert.match(github, /github LUMAPRINTS_API_KEY PRESENT/);
assert.match(github, /github LUMAPRINTS_API_SECRET EMPTY/);
assert.match(github, /github LUMAPRINTS_ENVIRONMENT PRESENT value=sandbox/);
assert.match(github, /github LUMAPRINTS_ADMIN_TOKEN MISSING/);
console.log('PASS pages binding report redacts values');
