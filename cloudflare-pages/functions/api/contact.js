/**
 * Custom-order / contact bridge for Cloudflare Pages.
 *
 * Original system: Shopify theme contact forms (form_type=contact) that email
 * the store owner. File upload was never wired (Shopify Forms app block missing).
 *
 * While Shopify remains the live store, this function forwards submissions to
 * https://bitterbuffaloart.com/contact so Clyde still receives inquiries.
 *
 * Post-cutover (owner authorization): set RESEND_API_KEY + CONTACT_TO_EMAIL
 * secrets; the function will email via Resend instead of Shopify.
 */

const SHOPIFY_CONTACT = 'https://bitterbuffaloart.com/contact';

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

async function parseBody(request) {
  const ct = request.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    return await request.json();
  }
  const fd = await request.formData();
  const data = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === 'string') data[k] = v;
  }
  return data;
}

function buildShopifyBody(data) {
  const params = new URLSearchParams();
  params.set('form_type', 'contact');
  params.set('utf8', '✓');

  const name = (data.name || data['contact[name]'] || '').trim();
  const email = (data.email || data['contact[email]'] || '').trim();
  const phone = (data.phone || data['contact[phone]'] || '').trim();
  const formKind = (data.form_kind || 'general').trim();

  params.set('contact[name]', name);
  params.set('contact[email]', email);
  if (phone) params.set('contact[phone]', phone);

  if (formKind === 'custom-project') {
    const category = (data.product_category || '').trim();
    const description = (data.description || data.body || '').trim();
    const notes = (data.additional_notes || '').trim();
    const size = (data.size || '').trim();
    const colors = (data.colors || '').trim();
    const qty = (data.quantity || '').trim();
    const budget = (data.budget_range || '').trim();
    const needed = (data.needed_by || '').trim();
    const method = (data.preferred_contact || '').trim();

    params.set('contact[form_type]', 'custom-project-intake');
    params.set('contact[Subject]', 'Custom project request');
    params.set('contact[product_category]', category);
    if (size) params.set('contact[size]', size);
    if (colors) params.set('contact[colors]', colors);
    if (qty) params.set('contact[quantity]', qty);
    if (budget) params.set('contact[budget_range]', budget);
    if (needed) params.set('contact[needed_by]', needed);
    if (method) params.set('contact[preferred_contact]', method);
    if (notes) params.set('contact[additional_notes]', notes);
    params.set(
      'contact[body]',
      [
        'CUSTOM PROJECT REQUEST (website)',
        `Category: ${category}`,
        size ? `Size: ${size}` : null,
        colors ? `Colors: ${colors}` : null,
        qty ? `Quantity: ${qty}` : null,
        budget ? `Budget: ${budget}` : null,
        needed ? `Needed by: ${needed}` : null,
        method ? `Preferred contact: ${method}` : null,
        '',
        description,
        notes ? `\nAdditional notes:\n${notes}` : null,
      ]
        .filter(Boolean)
        .join('\n')
    );
    params.set('contact[tags]', 'custom-project-intake,website-pages');
  } else if (formKind === 'laser-intake') {
    const projectType = (data.project_type || '').trim();
    const item = (data.requested_item || '').trim();
    const size = (data.approximate_size || '').trim();
    const qty = (data.quantity || '').trim();
    const needed = (data.needed_by || '').trim();
    const method = (data.preferred_contact || '').trim();
    const notes = (data.description || data.body || '').trim();
    params.set('contact[Subject]', 'Custom laser engraving intake');
    params.set('contact[tags]', 'custom-laser-intake,website-pages');
    params.set('contact[project_type]', projectType);
    params.set('contact[requested_item]', item);
    params.set('contact[approximate_size]', size);
    params.set('contact[quantity]', qty);
    params.set('contact[needed_by]', needed);
    params.set('contact[preferred_contact]', method);
    params.set(
      'contact[body]',
      [
        'CUSTOM LASER ENGRAVING INTAKE (website)',
        `Project type: ${projectType}`,
        `Item/surface: ${item}`,
        `Size: ${size}`,
        `Quantity: ${qty}`,
        `Needed by: ${needed}`,
        `Preferred contact: ${method}`,
        '',
        notes,
      ].join('\n')
    );
  } else {
    const subject = (data.subject || 'General question').trim();
    const message = (data.message || data.body || '').trim();
    params.set('contact[Subject]', subject);
    params.set('contact[body]', message);
  }

  return { params, name, email };
}

async function sendViaResend(env, data, summary) {
  const key = env.RESEND_API_KEY;
  const to = env.CONTACT_TO_EMAIL || 'backcountrytiedye@gmail.com';
  const from = env.CONTACT_FROM_EMAIL || 'Bitter Buffalo Art Website <onboarding@resend.dev>';
  if (!key) return null;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: data.email || undefined,
      subject: summary.subject,
      text: summary.text,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Resend failed: ${res.status} ${errText.slice(0, 200)}`);
  }
  return { channel: 'resend' };
}

export async function onRequestPost(context) {
  try {
    const data = await parseBody(context.request);

    // Honeypot — bots fill hidden fields
    if (data.website || data.company_url) {
      return json(200, { ok: true, delivered: false, honeypot: true });
    }

    const name = (data.name || '').trim();
    const email = (data.email || '').trim();
    if (!name || !email) {
      return json(400, { ok: false, error: 'Name and email are required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json(400, { ok: false, error: 'Enter a valid email address.' });
    }

    const formKind = (data.form_kind || 'general').trim();
    const { params } = buildShopifyBody(data);
    const bodyText = params.get('contact[body]') || '';
    const subject =
      params.get('contact[Subject]') ||
      (formKind === 'custom-project' ? 'Custom project request' : 'Website contact');

    const env = context.env || {};
    if (env.RESEND_API_KEY) {
      await sendViaResend(env, data, {
        subject: `[Bitter Buffalo Art] ${subject}`,
        text: `From: ${name} <${email}>\nPhone: ${data.phone || '(none)'}\nForm: ${formKind}\n\n${bodyText}`,
      });
      return json(200, { ok: true, delivered: true, channel: 'resend' });
    }

    // Shopify Online Store contact rejects bare server-side POSTs (HTTP 403 / bot protection).
    // Browser-native form posts to bitterbuffaloart.com/contact still work while Shopify hosts the live site.
    // For Cloudflare-only delivery after cutover, set Pages secrets:
    //   RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL (verified domain)
    return json(503, {
      ok: false,
      error:
        'Server email is not configured yet. The page will fall back to the live Shopify contact form, or email backcountrytiedye@gmail.com.',
      needs: ['RESEND_API_KEY', 'CONTACT_TO_EMAIL', 'CONTACT_FROM_EMAIL'],
      shopifyBridgeStatus: 'blocked-403-without-browser-session',
    });
  } catch (err) {
    return json(500, {
      ok: false,
      error: 'Submission failed. Please email backcountrytiedye@gmail.com.',
      detail: String(err && err.message ? err.message : err).slice(0, 200),
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
