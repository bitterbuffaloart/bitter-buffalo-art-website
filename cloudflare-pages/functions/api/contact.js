// Delivery requires an explicitly configured sender and recipient.
function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: {
    'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  }});
}
export async function onRequestPost({ request, env = {} }) {
  let raw;
  try {
    if (Number(request.headers.get('content-length')) > 24000) return json(413, { ok: false, error: 'Please shorten your request.' });
    const text = await request.text();
    if (new TextEncoder().encode(text).length > 24000) return json(413, { ok: false, error: 'Please shorten your request.' });
    raw = request.headers.get('content-type')?.includes('application/json') ? JSON.parse(text) : Object.fromEntries(new URLSearchParams(text));
    if (!raw || Array.isArray(raw) || typeof raw !== 'object' || Object.values(raw).some(v => typeof v !== 'string')) throw new Error('Invalid fields');
  } catch { return json(400, { ok: false, error: 'Please enter a valid contact request.' }); }
  const data = {};
  for (const [key, value] of Object.entries(raw)) data[key.replace(/^contact\[(.+)\]$/, '$1')] = value.trim();
  if (data.website || data.company_url) return json(200, { ok: true, delivered: false });
  const kind = data.form_kind || 'general';
  const message = data.body || data.message || data.description;
  if (!data.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || '') || !message) return json(400, { ok: false, error: 'Name, a valid email address, and a message are required.' });
  if (!['general', 'custom-project', 'laser-intake'].includes(kind)) return json(400, { ok: false, error: 'Select a contact form.' });
  const required = kind === 'custom-project' ? ['product_category', 'project_contact_ack'] : kind === 'laser-intake' ?
    ['project_type', 'requested_item', 'approximate_size', 'quantity', 'needed_by', 'preferred_contact', 'owns_photo', 'request_not_order', 'approval_required', 'production_use'] : ['Subject'];
  if (required.some(key => !data[key])) return json(400, { ok: false, error: 'Please complete the required project fields and permissions.' });
  const permissions = kind === 'custom-project' ? ['project_contact_ack'] : kind === 'laser-intake' ? ['owns_photo', 'request_not_order', 'approval_required', 'production_use'] : [];
  if (permissions.some(key => data[key] !== 'yes')) return json(400, { ok: false, error: 'Please confirm the required project permissions.' });
  if (data.quantity && (!/^\d+$/.test(data.quantity) || Number(data.quantity) < 1)) return json(400, { ok: false, error: 'Quantity must be a positive whole number.' });
  if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL || !env.CONTACT_FROM_EMAIL) return json(503, { ok: false, delivered: false, error: 'Website sending is unavailable. Your request has not been sent. Use the email draft below or email backcountrytiedye@gmail.com.' });
  const subject = kind === 'custom-project' ? 'Custom project request' : kind === 'laser-intake' ? 'Custom laser engraving intake' : (data.Subject || data.subject || 'General question');
  const text = Object.entries(data).filter(([key]) => !['website', 'company_url', 'utf8', 'form_type'].includes(key)).map(([key,value]) => `${key}: ${value}`).join('\n');
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.CONTACT_FROM_EMAIL, to: [env.CONTACT_TO_EMAIL], reply_to: data.email,
        subject: `[Bitter Buffalo Art] ${subject.replace(/[\r\n]/g, ' ').slice(0,150)}`, text }),
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error('Provider rejected request');
    return json(200, { ok: true, delivered: true, channel: 'resend' });
  } catch {
    return json(502, { ok: false, delivered: false, error: 'The email service could not accept your request. Your entries are retained; please use the email draft below.' });
  }
}
