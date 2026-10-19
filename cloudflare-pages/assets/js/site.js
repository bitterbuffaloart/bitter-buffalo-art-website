document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if (btn && nav) {
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); btn.focus();
      }
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
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach((p) => {
        const on = p.getAttribute('data-bb-contact-panel') === id;
        p.hidden = !on;
      });
    };
    tabs.forEach((t, index) => {
      t.addEventListener('click', () => activate(t.getAttribute('data-bb-contact-tab')));
      t.addEventListener('keydown', (event) => {
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : -1;
        if (next >= 0) { event.preventDefault(); activate(tabs[next].getAttribute('data-bb-contact-tab')); tabs[next].focus(); }
      });
    });
    activate('general');
    if (location.hash === '#start-custom-project') activate('project');
    if (location.hash === '#laser-intake') activate('laser');
  }

  const forms = [...document.querySelectorAll('form[data-bb-form]')];
  const blockDelivery = (form) => {
    form.dataset.deliveryBlocked = 'true';
    const submit = form.querySelector('button[type="submit"]');
    if (submit) submit.disabled = true;
    const status = form.querySelector('[data-bb-form-status]');
    if (!status) return;
    status.hidden = false;
    status.classList.add('is-err');
    status.classList.remove('is-ok');
    status.textContent = 'Email delivery is not configured on this server, so this form cannot send a request. Nothing has been submitted.';
  };
  if (forms.length) {
    fetch('/api/contact', { headers: { Accept: 'application/json' } })
      .then((response) => response.json())
      .then((data) => { if (!data || data.configured !== true) forms.forEach(blockDelivery); })
      .catch(() => forms.forEach(blockDelivery));
  }

  // Retain the request on delivery failure and offer an explicit email draft.
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
      const submit = form.querySelector('button[type="submit"]');
      if (submit.disabled || form.dataset.deliveryBlocked) return;
      submit.disabled = true;
      form.querySelector('[data-email-draft]')?.remove();
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
      payload.body = payload.body || payload['contact[body]'] || payload.message || '';
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(15000),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok && data.delivered) {
          if (status) {
            status.textContent = 'Thank you — your request was sent. We will reply by email.';
            status.classList.add('is-ok');
            status.classList.remove('is-err');
          }
          form.reset();
          return;
        }
        throw new Error(data.error || 'Your request could not be sent.');
      } catch (err) {
        if (status) {
          status.textContent = 'Your request has not been sent. Your entries are still here. Open an email draft below, attach any reference images, and send it from your email app.';
          status.classList.add('is-err'); status.classList.remove('is-ok');
        }
        const draft = document.createElement('a');
        draft.dataset.emailDraft = ''; draft.className = 'btn btn--ghost';
        draft.textContent = 'Open email draft';
        const lines = [...fd.entries()].filter(([key, value]) => key !== 'website' && key !== 'company_url' && typeof value === 'string' && value).map(([key, value]) => `${key.replace(/^contact\[(.+)\]$/, '$1')}: ${value}`);
        draft.href = 'mailto:backcountrytiedye@gmail.com?subject=' + encodeURIComponent(payload.subject || (payload.form_kind === 'print-inquiry' ? 'Photography print inquiry' : 'Bitter Buffalo Art project request')) + '&body=' + encodeURIComponent(lines.join('\n'));
        form.append(draft);
      } finally { if (!form.dataset.deliveryBlocked) submit.disabled = false; }
    });
  });
});
