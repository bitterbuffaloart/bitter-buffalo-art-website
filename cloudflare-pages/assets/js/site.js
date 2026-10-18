document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if (btn && nav) {
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  const tabRoot = document.querySelector('[data-bb-contact-tabs]');
  if (tabRoot) {
    const tabs = [...tabRoot.querySelectorAll('[data-bb-contact-tab]')];
    const panels = [...tabRoot.querySelectorAll('[data-bb-contact-panel]')];
    const activate = (id) => {
      tabs.forEach((t) => {
        const on = t.getAttribute('data-bb-contact-tab') === id;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      panels.forEach((p) => {
        const on = p.getAttribute('data-bb-contact-panel') === id;
        p.hidden = !on;
      });
    };
    tabs.forEach((t) => t.addEventListener('click', () => activate(t.getAttribute('data-bb-contact-tab'))));
    if (location.hash === '#start-custom-project') activate('project');
    if (location.hash === '#laser-intake') activate('laser');
  }

  // Try Pages /api/contact (Resend when secrets set); else native Shopify contact POST.
  document.querySelectorAll('form[data-bb-form]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      const status = form.querySelector('[data-bb-form-status]');
      if (form.querySelector('input[name="website"]')?.value) {
        e.preventDefault();
        return;
      }
      if (!form.reportValidity()) {
        e.preventDefault();
        if (status) {
          status.hidden = false;
          status.textContent = 'Please complete the required fields.';
          status.classList.add('is-err');
          status.classList.remove('is-ok');
        }
        return;
      }
      e.preventDefault();
      if (status) {
        status.hidden = false;
        status.textContent = 'Sending your request…';
        status.classList.add('is-ok');
        status.classList.remove('is-err');
      }
      const fd = new FormData(form);
      const payload = {};
      fd.forEach((v, k) => { if (typeof v === 'string') payload[k] = v; });
      payload.name = payload.name || payload['contact[name]'] || '';
      payload.email = payload.email || payload['contact[email]'] || '';
      payload.phone = payload.phone || payload['contact[phone]'] || '';
      payload.message = payload.message || payload['contact[body]'] || '';
      payload.subject = payload.subject || payload['contact[Subject]'] || '';
      payload.description = payload.description || payload['contact[body]'] || '';
      payload.product_category = payload.product_category || payload['contact[product_category]'] || '';
      payload.additional_notes = payload.additional_notes || payload['contact[additional_notes]'] || '';
      payload.size = payload.size || payload['contact[size]'] || '';
      payload.colors = payload.colors || payload['contact[colors]'] || '';
      payload.quantity = payload.quantity || payload['contact[quantity]'] || '';
      payload.budget_range = payload.budget_range || payload['contact[budget_range]'] || '';
      payload.needed_by = payload.needed_by || payload['contact[needed_by]'] || '';
      payload.preferred_contact = payload.preferred_contact || payload['contact[preferred_contact]'] || '';
      payload.project_type = payload.project_type || payload['contact[project_type]'] || '';
      payload.requested_item = payload.requested_item || payload['contact[requested_item]'] || '';
      payload.approximate_size = payload.approximate_size || payload['contact[approximate_size]'] || '';
      payload.body = payload['contact[body]'] || payload.message || '';
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          if (status) {
            status.textContent = 'Thank you — your request was sent. We will reply by email.';
            status.classList.add('is-ok');
            status.classList.remove('is-err');
          }
          form.reset();
          return;
        }
        if (res.status === 503 || data.shopifyBridgeStatus) {
          form.submit();
          return;
        }
        throw new Error(data.error || 'Submission failed');
      } catch (err) {
        try {
          form.submit();
        } catch (_) {
          if (status) {
            status.textContent = 'Could not send through the website. Please email backcountrytiedye@gmail.com.';
            status.classList.add('is-err');
            status.classList.remove('is-ok');
          }
        }
      }
    });
  });
});
