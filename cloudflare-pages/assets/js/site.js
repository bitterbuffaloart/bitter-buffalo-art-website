const BBLightbox = (() => {
  const dialog = document.createElement("dialog");
  dialog.className = "bb-lightbox";
  dialog.innerHTML = [
    '<div class="bb-lightbox__bar">',
    '<button type="button" data-zoom-out>Zoom out</button>',
    '<button type="button" data-fit>Fit artwork</button>',
    '<button type="button" data-zoom-in>Zoom in</button>',
    '<button type="button" data-close>Close</button>',
    "</div>",
    '<div class="bb-lightbox__stage">',
    '<button type="button" class="bb-lightbox__nav" data-prev>Previous</button>',
    '<img class="bb-lightbox__photo" alt="">',
    '<img class="bb-lightbox__mark" src="/assets/images/logo.png" alt="">',
    '<button type="button" class="bb-lightbox__nav" data-next>Next</button>',
    "</div>",
    '<div class="bb-lightbox__thumbs"></div>',
    '<div class="bb-lightbox__meta"><p class="bb-lightbox__caption"></p><a class="bb-lightbox__buy"></a></div>',
  ].join("");
  document.body.append(dialog);
  const photo = dialog.querySelector(".bb-lightbox__photo");
  const caption = dialog.querySelector(".bb-lightbox__caption");
  const buy = dialog.querySelector(".bb-lightbox__buy");
  const thumbs = dialog.querySelector(".bb-lightbox__thumbs");
  const state = { slides: [], index: 0, frame: 0, scale: 1, x: 0, y: 0, pointers: new Map(), pinch: 0 };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const currentFrames = () => state.slides[state.index]?.frames || [];
  const apply = () => {
    const rotation = currentFrames()[state.frame]?.rotation || 0;
    photo.style.transform = `translate(${state.x}px, ${state.y}px) rotate(${rotation}deg) scale(${rotation ? state.scale * 0.75 : state.scale})`;
    dialog.classList.toggle("is-zoomed", state.scale > 1);
  };
  const fit = () => {
    state.scale = 1;
    state.x = 0;
    state.y = 0;
    apply();
  };
  const zoomBy = (factor) => {
    state.scale = clamp(state.scale * factor, 1, 4);
    if (state.scale === 1) fit();
    else apply();
  };
  const show = () => {
    const slide = state.slides[state.index];
    if (!slide) return;
    const frames = currentFrames();
    state.frame = clamp(state.frame, 0, Math.max(0, frames.length - 1));
    const frame = frames[state.frame] || { src: "", alt: "" };
    fit();
    photo.onerror = () => {
      if (frame.fallback && photo.getAttribute("src") !== frame.fallback) photo.src = frame.fallback;
    };
    photo.src = frame.src;
    photo.alt = frame.alt || slide.caption || "";
    caption.textContent = slide.caption || "";
    if (slide.purchase && slide.purchase.href) {
      buy.hidden = false;
      buy.href = slide.purchase.href;
      buy.textContent = slide.purchase.label || "View";
      if (slide.purchase.external) {
        buy.target = "_blank";
        buy.rel = "noopener noreferrer";
      } else {
        buy.removeAttribute("target");
        buy.removeAttribute("rel");
      }
    } else {
      buy.hidden = true;
      buy.removeAttribute("href");
    }
    thumbs.replaceChildren();
    if (frames.length > 1) {
      frames.forEach((item, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.setAttribute("aria-current", index === state.frame ? "true" : "false");
        button.setAttribute("aria-label", item.alt || `Photograph ${index + 1}`);
        const thumb = document.createElement("img");
        thumb.src = item.thumb || item.src;
        thumb.alt = "";
        button.append(thumb);
        button.addEventListener("click", () => {
          state.frame = index;
          show();
        });
        thumbs.append(button);
      });
    }
    const single = state.slides.length < 2;
    dialog.querySelector("[data-prev]").hidden = single;
    dialog.querySelector("[data-next]").hidden = single;
  };
  const move = (step) => {
    if (state.slides.length < 2) return;
    state.index = (state.index + step + state.slides.length) % state.slides.length;
    state.frame = 0;
    show();
  };
  const open = (slides, index) => {
    state.slides = slides.filter((slide) => slide && slide.frames && slide.frames.length);
    state.index = clamp(index || 0, 0, Math.max(0, state.slides.length - 1));
    state.frame = 0;
    if (!state.slides.length) return;
    show();
    if (!dialog.open) dialog.showModal();
    dialog.querySelector("[data-close]").focus();
  };
  dialog.querySelector("[data-close]").addEventListener("click", () => dialog.close());
  dialog.querySelector("[data-prev]").addEventListener("click", () => move(-1));
  dialog.querySelector("[data-next]").addEventListener("click", () => move(1));
  dialog.querySelector("[data-zoom-in]").addEventListener("click", () => zoomBy(1.4));
  dialog.querySelector("[data-zoom-out]").addEventListener("click", () => zoomBy(1 / 1.4));
  dialog.querySelector("[data-fit]").addEventListener("click", fit);
  dialog.addEventListener("close", fit);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" && state.scale === 1) { event.preventDefault(); move(1); }
    else if (event.key === "ArrowLeft" && state.scale === 1) { event.preventDefault(); move(-1); }
    else if (event.key === "ArrowRight") { state.x -= 40; apply(); }
    else if (event.key === "ArrowLeft") { state.x += 40; apply(); }
    else if (event.key === "ArrowDown") { state.y -= 40; apply(); }
    else if (event.key === "ArrowUp") { state.y += 40; apply(); }
    else if (event.key === "+" || event.key === "=") zoomBy(1.25);
    else if (event.key === "-" || event.key === "_") zoomBy(0.8);
    else if (event.key === "Home") fit();
  });
  photo.addEventListener("wheel", (event) => {
    if (!dialog.open) return;
    event.preventDefault();
    zoomBy(event.deltaY < 0 ? 1.12 : 0.9);
  }, { passive: false });
  photo.addEventListener("dblclick", () => (state.scale > 1 ? fit() : zoomBy(2)));
  const stage = dialog.querySelector(".bb-lightbox__stage");
  stage.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button, a")) return;
    state.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY });
    stage.setPointerCapture(event.pointerId);
    if (state.pointers.size === 2) {
      const [a, b] = [...state.pointers.values()];
      state.pinch = Math.hypot(a.x - b.x, a.y - b.y);
    }
  });
  stage.addEventListener("pointermove", (event) => {
    const point = state.pointers.get(event.pointerId);
    if (!point) return;
    const dx = event.clientX - point.x;
    const dy = event.clientY - point.y;
    point.x = event.clientX;
    point.y = event.clientY;
    if (state.pointers.size === 2 && state.pinch) {
      const [a, b] = [...state.pointers.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      zoomBy(distance / state.pinch);
      state.pinch = distance;
      return;
    }
    if (state.scale > 1) {
      state.x += dx;
      state.y += dy;
      apply();
    }
  });
  const endPointer = (event) => {
    const point = state.pointers.get(event.pointerId);
    state.pointers.delete(event.pointerId);
    state.pinch = 0;
    if (!point || state.scale > 1 || state.pointers.size) return;
    const dx = event.clientX - point.startX;
    const dy = event.clientY - point.startY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
  };
  stage.addEventListener("pointerup", endPointer);
  stage.addEventListener("pointercancel", endPointer);
  return { open };
})();
window.BBLightbox = BBLightbox;

function bindStaticArtwork() {
  document.querySelectorAll(".gallery--etsy, .gallery--portfolio:not([data-catalog-grid])").forEach((root) => {
    const figures = [...root.querySelectorAll("figure")].filter((figure) => figure.querySelector("img"));
    const slides = figures.map((figure) => {
      const image = figure.querySelector("img");
      const link = [...figure.querySelectorAll("a")].find((anchor) => /etsy\.com\/listing\//.test(anchor.href));
      const frames = [{ src: image.getAttribute("src"), alt: image.alt }];
      if (figure.dataset.detail) frames.push({ src: figure.dataset.detail, alt: `${image.alt} detail` });
      return {
        frames,
        caption: figure.querySelector(".catalog-title")?.textContent || image.alt,
        purchase: link ? { href: link.href, label: "Buy on Etsy", external: true } : null,
      };
    });
    figures.forEach((figure, index) => {
      const image = figure.querySelector("img");
      if (image.closest("a")) return;
      image.style.cursor = "zoom-in";
      image.tabIndex = 0;
      image.setAttribute("role", "button");
      image.setAttribute("aria-label", `View ${image.alt} full size`);
      const open = () => BBLightbox.open(slides, index);
      image.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        open();
      });
      image.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        open();
      });
    });
  });
  const printPhoto = document.querySelector(".print-inquiry__photo img");
  if (printPhoto && !printPhoto.closest("a")) {
    const display = printPhoto.getAttribute("src");
    const large = display.includes("/portfolio/") && !display.includes("/portfolio/large/")
      ? display.replace("/portfolio/", "/portfolio/large/")
      : display;
    printPhoto.style.cursor = "zoom-in";
    printPhoto.tabIndex = 0;
    printPhoto.setAttribute("role", "button");
    const purchase = document.querySelector(".purchase-actions a");
    const open = () => BBLightbox.open([{
      frames: [{ src: large, fallback: display, alt: printPhoto.alt }],
      caption: printPhoto.alt,
      purchase: purchase ? { href: purchase.href, label: purchase.textContent.trim(), external: purchase.target === "_blank" } : null,
    }], 0);
    printPhoto.addEventListener("click", open);
    printPhoto.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); }
    });
    printPhoto.addEventListener("error", () => {
      if (printPhoto.getAttribute("src") !== display) printPhoto.setAttribute("src", display);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  bindStaticArtwork();
  const params = new URLSearchParams(window.location.search);
  const piece = params.get('piece');
  const topic = params.get('topic');
  if (topic === 'laser') window.location.hash = 'laser-intake';
  if (piece) {
    const subject = document.querySelector('[name="contact[Subject]"]');
    const body = document.querySelector('[name="contact[body]"]');
    if (subject && topic === 'print') subject.value = 'Print inquiry';
    if (body && !body.value) {
      const size = params.get('size');
      body.value = `Inquiry: ${piece}${size ? ` · ${size}` : ''}`;
    }
  }
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
      if (submit.disabled) return;
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
      payload.body = payload['contact[body]'] || payload.message || '';
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
        const lines = [...fd.entries()].filter(([key]) => key.startsWith('contact[')).map(([key, value]) => `${key.replace(/^contact\[(.+)\]$/, '$1')}: ${value}`);
        draft.href = 'mailto:backcountrytiedye@gmail.com?subject=' + encodeURIComponent(payload.subject || 'Bitter Buffalo Art project request') + '&body=' + encodeURIComponent(lines.join('\n'));
        form.append(draft);
      } finally { submit.disabled = false; }
    });
  });
});
