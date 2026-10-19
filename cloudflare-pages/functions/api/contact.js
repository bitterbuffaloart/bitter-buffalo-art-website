// Delivery requires an explicitly configured sender and recipient.
function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: {
    'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  }});
}
export async function onRequestGet({ env = {} }) {
  const configured = Boolean(env.RESEND_API_KEY && env.CONTACT_TO_EMAIL && env.CONTACT_FROM_EMAIL);
  return json(200, { ok: true, configured, channel: configured ? 'resend' : null });
}

const PRINT_MATERIALS = new Set(["framed-canvas","stretched-canvas","metal","giclee","hot-press","cold-press","somerset","traditional","glossy","metallic","acrylic"]);
const PRINT_SIZES = new Set(['12x18', '16x24', '20x30', 'quote']);
// Server-authoritative open-edition retail values; tests enforce parity with public catalog.
const PRINT_RETAIL_USD = {"framed-canvas":{"12x18":159.33,"16x24":199.33,"20x30":299.33},"stretched-canvas":{"12x18":109.33,"16x24":149.33,"20x30":219.33},"metal":{"12x18":179.99,"16x24":249.99,"20x30":359.99},"giclee":{"12x18":89.99,"16x24":129.99,"20x30":199.99},"hot-press":{"12x18":99.99,"16x24":149.99,"20x30":219.99},"cold-press":{"12x18":99.99,"16x24":149.99,"20x30":219.99},"somerset":{"12x18":109.99,"16x24":159.99,"20x30":249.99},"traditional":{"12x18":69.99,"16x24":109.99,"20x30":189.99},"glossy":{"12x18":79.99,"16x24":119.99,"20x30":199.99},"metallic":{"12x18":109.99,"16x24":169.99,"20x30":269.99}};
const PRINT_UNAVAILABLE = new Set(['#14 · Horse portrait', '#18 · Shiprock star trails', '#24 · Aspen valley']);

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
  if (kind === 'print-inquiry') {
    const unitRetail = PRINT_RETAIL_USD[data.material]?.[data.size];
    const count = Number(data.quantity || 0);
    const retailNote = unitRetail === undefined ? 'retail_price: Special request — individually quoted' : `retail_price: ${unitRetail.toFixed(2)} USD each; print_subtotal: ${(unitRetail * count).toFixed(2)} USD, shipping not included`;
    data.body = [
      'Photography print inquiry. This is not a payment and does not place a supplier order.',
      `photograph: ${data.photograph || ''}`,
      `material: ${data.material || ''}`,
      `size: ${data.size || ''}`,
      `quantity: ${data.quantity || ''}`,
      retailNote,
      'shipping: Confirmed before payment',
      'supplier_order: Not placed',
      `postal_code: ${data.postal_code || ''}`,
      `instructions: ${data.instructions || ''}`,
    ].join('\n');
  }
  const message = data.body || data.message || data.description;
  if (!data.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || '') || !message) return json(400, { ok: false, error: 'Name, a valid email address, and a message are required.' });
  if (!['general', 'custom-project', 'laser-intake', 'print-inquiry'].includes(kind)) return json(400, { ok: false, error: 'Select a contact form.' });
  if (Object.keys(data).some(key => /card|cvv|cvc|pan|payment/i.test(key))) return json(400, { ok: false, error: 'Payment details are not accepted.' });
  const required = kind === 'print-inquiry' ? ['photograph', 'material', 'size', 'quantity', 'request_not_order'] : kind === 'custom-project' ? ['product_category', 'project_contact_ack'] : kind === 'laser-intake' ?
    ['project_type', 'requested_item', 'approximate_size', 'quantity', 'needed_by', 'preferred_contact', 'owns_photo', 'request_not_order', 'approval_required', 'production_use'] : ['Subject'];
  if (required.some(key => !data[key])) return json(400, { ok: false, error: 'Please complete the required project fields and permissions.' });
  const permissions = kind === 'print-inquiry' ? ['request_not_order'] : kind === 'custom-project' ? ['project_contact_ack'] : kind === 'laser-intake' ? ['owns_photo', 'request_not_order', 'approval_required', 'production_use'] : [];
  if (permissions.some(key => data[key] !== 'yes')) return json(400, { ok: false, error: 'Please confirm the required project permissions.' });
  if (data.quantity && (!/^\d+$/.test(data.quantity) || Number(data.quantity) < 1 || Number(data.quantity) > 99)) return json(400, { ok: false, error: 'Quantity must be a positive whole number.' });
  if (kind === 'print-inquiry') {
    if (!PRINT_MATERIALS.has(data.material) || !PRINT_SIZES.has(data.size)) return json(400, { ok: false, error: 'Choose a print material and size from the catalog.' });
    if (!/^#\d{2} · .{2,80}$/.test(data.photograph)) return json(400, { ok: false, error: 'Choose a photograph from the portfolio.' });
    if (PRINT_UNAVAILABLE.has(data.photograph)) return json(400, { ok: false, error: 'That photograph is not available for print until a clean original is reviewed.' });
    if (data.postal_code && !/^[A-Za-z0-9][A-Za-z0-9 -]{1,11}$/.test(data.postal_code)) return json(400, { ok: false, error: 'Enter a shorter postal code, or leave it blank.' });
    if (data.instructions && data.instructions.length > 2000) return json(400, { ok: false, error: 'Please shorten the instructions.' });
  }
  if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL || !env.CONTACT_FROM_EMAIL) return json(503, { ok: false, delivered: false, error: 'Website sending is unavailable. Your request has not been sent. Use the email draft below or email backcountrytiedye@gmail.com.' });
  const subject = kind === 'print-inquiry' ? 'Photography print inquiry — not an order' : kind === 'custom-project' ? 'Custom project request' : kind === 'laser-intake' ? 'Custom laser engraving intake' : (data.Subject || data.subject || 'General question');
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
