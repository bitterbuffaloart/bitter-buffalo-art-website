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

  // Forms post to the live Shopify contact endpoint (original delivery path) while Shopify hosts
  // the store. Optional /api/contact + RESEND_API_KEY is for Cloudflare-only delivery after cutover.
  document.querySelectorAll('form[data-bb-form]').forEach((form) => {
    form.addEventListener('submit', (e) => {
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
      if (status) {
        status.hidden = false;
        status.textContent = 'Sending your request…';
        status.classList.add('is-ok');
        status.classList.remove('is-err');
      }
    });
  });
});
