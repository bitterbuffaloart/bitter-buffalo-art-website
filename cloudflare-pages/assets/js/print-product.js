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
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const radio = selected();
    const payload = { configurationId: radio.value };
    if (radio.dataset.retailCents) payload.retailCents = Number(radio.dataset.retailCents);
    result.textContent = "Checking this size…";
    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => null);
      if (response.status === 409) {
        result.textContent = body?.error || "This size is not for sale yet. No payment was started.";
        return;
      }
      if (!response.ok || !body?.checkoutUrl) {
        result.textContent = body?.error || "Checkout is not open. No payment was started.";
        return;
      }
      result.textContent = "Sandbox checkout is ready.";
      window.location.assign(body.checkoutUrl);
    } catch {
      result.textContent = "Checkout could not be reached. No payment was started.";
    }
  });
});
