document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("print-order");
  const price = document.getElementById("print-price");
  const result = document.getElementById("print-result");
  if (!form || !price || !result) return;
  const radios = [...form.querySelectorAll('input[name="configurationId"]')];
  const selected = () => radios.find((radio) => radio.checked) || radios[0];
  const showPrice = () => {
    const radio = selected();
    const label = radio.closest("label")?.querySelector(".size-choice__label")?.textContent || "Size";
    const cents = radio.dataset.retailCents;
    price.textContent = cents ? `${label} · $${(Number(cents) / 100).toFixed(2)}` : `${label} · Price not verified`;
  };
  radios.forEach((radio) => radio.addEventListener("change", showPrice));
  showPrice();
  fetch("/assets/data/pricing-master.json")
    .then((response) => {
      if (!response.ok) throw new Error(String(response.status));
      return response.json();
    })
    .then((payload) => {
      const confirmed = (payload.records || []).find((record) => record.sku === "FRAMED-OPEN-16x24" && record.price_approval === "owner-confirmed");
      if (!confirmed?.confirmed_retail_usd) return;
      const radio = form.querySelector('input[value="bb-photo-01-16x24-canvas-15"]');
      if (!radio) return;
      radio.dataset.retailCents = String(Math.round(Number(confirmed.confirmed_retail_usd) * 100));
      const span = radio.closest("label")?.querySelector(".size-choice__price");
      if (span) span.textContent = `$${confirmed.confirmed_retail_usd}`;
      if (radio.checked) showPrice();
    })
    .catch(() => {});
  const inquiry = document.getElementById("print-buy");
  const inquiryFor = () => {
    const radio = selected();
    const label = radio.closest("label")?.querySelector(".size-choice__label")?.textContent || "";
    const target = new URL("../../../contact/", window.location.href);
    target.searchParams.set("topic", "print");
    target.searchParams.set("piece", "Grand Tetons");
    target.searchParams.set("size", label);
    return target.pathname + target.search;
  };
  if (inquiry) inquiry.href = inquiryFor();
  radios.forEach((radio) => radio.addEventListener("change", () => {
    if (inquiry) inquiry.href = inquiryFor();
  }));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    result.textContent = "This page does not take payment. Use the inquiry link.";
  });
});
