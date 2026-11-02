(function (root) {
  const MEASUREMENT = /^G-[A-Z0-9]+$/;
  const PRIVATE_KEY = /email|phone|name|message|address|body|password|token|secret/i;
  const state = { events: [], seen: new Set(), googleLoaded: false, measurementId: "" };

  function shouldLoadGoogle(measurementId) {
    return MEASUREMENT.test(String(measurementId || ""));
  }

  function googleTagUrl(measurementId) {
    return shouldLoadGoogle(measurementId)
      ? "https://www.googletagmanager.com/gtag/js?id=" + measurementId
      : "";
  }

  function sanitize(params) {
    const clean = {};
    const source = params || {};
    Object.keys(source).forEach((key) => {
      if (PRIVATE_KEY.test(key)) return;
      const value = source[key];
      if (typeof value === "string" && (value.includes("@") || /^mailto:/i.test(value))) return;
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") clean[key] = value;
    });
    clean.sale_completed = false;
    return clean;
  }

  function collectPage(pathname) {
    const path = pathname || "/";
    const events = [{ name: "page_view", params: { page_path: path } }];
    const print = path.match(/^\/photography\/prints\/([^/]+)\/?$/);
    if (print) {
      events.push({ name: "artwork_view", params: { page_path: path, item_id: print[1] } });
    } else if (path === "/photography" || path.startsWith("/photography/")) {
      const subject = path.replace(/^\/photography\/?/, "").replace(/\/$/, "");
      events.push({
        name: "gallery_view",
        params: { page_path: path, gallery_subject: subject || "all" },
      });
    }
    return events;
  }

  function classifyClick(href) {
    let url;
    try {
      url = new URL(href, "https://bitterbuffaloart.com");
    } catch (error) {
      return null;
    }
    if (url.protocol === "mailto:" || url.protocol === "tel:") return null;
    const host = url.hostname.replace(/^www\./, "");
    if (host === "fineartamerica.com" || host === "pixels.com") {
      return { name: "faa_purchase_link_click", params: { link_host: host, outcome: "click" } };
    }
    if (host === "square.link" || host === "checkout.square.site") {
      return { name: "gallery_print_link_click", params: { link_host: host, outcome: "click" } };
    }
    if (host === "etsy.com") {
      return { name: "etsy_outbound_click", params: { link_host: host, outcome: "click" } };
    }
    if (host === "bitterbuffaloart.com" && url.pathname.startsWith("/contact") && url.searchParams.get("topic") === "print") {
      return { name: "gallery_print_inquiry_click", params: { page_path: url.pathname, outcome: "click" } };
    }
    return null;
  }

  function inquiryFromForm(form) {
    if (!form || form.querySelector('input[name="website"]')?.value) return null;
    if (typeof form.checkValidity === "function" && !form.checkValidity()) return null;
    const print = form.hasAttribute("data-print-inquiry");
    const params = { outcome: "inquiry" };
    if (print) {
      const product = form.querySelector("#print-product");
      const size = form.querySelector("#print-size");
      const catalog = form.querySelector('input[name="contact[catalog_id]"]');
      if (product && product.value) params.product_code = product.value;
      if (size && size.value) params.size_code = size.value;
      if (catalog && catalog.value && !catalog.value.includes("@")) params.item_id = catalog.value;
      return { name: "gallery_print_inquiry", params: params };
    }
    if (form.hasAttribute("data-bb-form")) {
      params.form_id = form.id || "contact";
      return { name: "contact_inquiry", params: params };
    }
    return null;
  }

  function record(name, params, onceKey) {
    if (onceKey && state.seen.has(onceKey)) return false;
    if (onceKey) state.seen.add(onceKey);
    const event = { name: name, params: sanitize(params) };
    state.events.push(event);
    if (state.googleLoaded && name !== "page_view" && typeof root.gtag === "function") {
      root.gtag("event", name, event.params);
    }
    return true;
  }

  function loadGoogle(measurementId) {
    if (!shouldLoadGoogle(measurementId) || state.googleLoaded) return false;
    const existing = root.document.querySelector('script[data-bb-gtag="' + measurementId + '"]');
    state.googleLoaded = true;
    state.measurementId = measurementId;
    if (existing) return false;
    root.dataLayer = root.dataLayer || [];
    root.gtag = root.gtag || function gtag() { root.dataLayer.push(arguments); };
    root.gtag("js", new Date());
    root.gtag("config", measurementId);
    const script = root.document.createElement("script");
    script.async = true;
    script.src = googleTagUrl(measurementId);
    script.dataset.bbGtag = measurementId;
    root.document.head.append(script);
    return true;
  }

  function deviceClass() {
    const media = root.matchMedia ? root.matchMedia("(max-width: 700px)") : null;
    return media && media.matches ? "mobile" : "desktop";
  }

  function boot(config) {
    if (state.booted) return;
    state.booted = true;
    const measurementId = config && config.measurementId;
    const path = root.location && root.location.pathname ? root.location.pathname : "/";
    if (shouldLoadGoogle(measurementId)) loadGoogle(measurementId);
    collectPage(path).forEach((event) => {
      event.params.device_class = deviceClass();
      record(event.name, event.params, event.name + ":" + path);
    });
    root.document.addEventListener("click", (event) => {
      const link = event.target && event.target.closest ? event.target.closest("a[href]") : null;
      if (!link) return;
      const hit = classifyClick(link.href);
      if (!hit) return;
      hit.params.device_class = deviceClass();
      hit.params.page_path = path;
      record(hit.name, hit.params);
    }, true);
    root.document.addEventListener("submit", (event) => {
      const hit = inquiryFromForm(event.target);
      if (!hit) return;
      hit.params.device_class = deviceClass();
      hit.params.page_path = path;
      record(hit.name, hit.params);
    }, true);
  }

  function start() {
    const ready = root.fetch
      ? root.fetch("/assets/data/analytics-config.json").then((response) => response.json()).catch(() => ({}))
      : Promise.resolve({});
    ready.then(boot);
  }

  root.BBAnalytics = {
    state: state,
    shouldLoadGoogle: shouldLoadGoogle,
    googleTagUrl: googleTagUrl,
    sanitize: sanitize,
    collectPage: collectPage,
    classifyClick: classifyClick,
    inquiryFromForm: inquiryFromForm,
    record: record,
    loadGoogle: loadGoogle,
    boot: boot,
    start: start,
  };

  if (root.document && root.document.addEventListener) start();
})(typeof window !== "undefined" ? window : globalThis);
