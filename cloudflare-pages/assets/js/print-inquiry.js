const APPROVED = {
  photographId: "bb-photo-01",
  productId: "canvas-floating-15",
  sizeId: "16x24",
  text: "$199.33",
};

export function quoteText(photographId, productId, sizeId) {
  if (
    photographId === APPROVED.photographId
    && productId === APPROVED.productId
    && sizeId === APPROVED.sizeId
  ) return APPROVED.text;
  return "Request a quote.";
}

export function inquiryDetails({ photographId, title, productName, sizeLabel, productId, sizeId, message }) {
  const price = quoteText(photographId, productId, sizeId);
  return {
    photographTitle: title,
    catalogId: photographId,
    product: productName,
    size: sizeLabel,
    priceOrQuote: price,
    message,
    lines: [
      `Photograph: ${title}`,
      `Catalog ID: ${photographId}`,
      `Product: ${productName}`,
      `Size: ${sizeLabel}`,
      `Price: ${price}`,
      `Message: ${message}`,
    ],
  };
}

function selectedSize(sizeSelect) {
  const option = sizeSelect.selectedOptions[0];
  if (!option || !option.value || option.disabled || option.hidden) return null;
  if (option.dataset.status === "hold") return null;
  return option;
}

function applyProduct(productSelect, sizeSelect, price) {
  const chosen = productSelect.value;
  sizeSelect.disabled = !chosen;
  for (const option of sizeSelect.options) {
    if (!option.value) continue;
    const matches = option.dataset.product === chosen;
    const hold = option.dataset.status === "hold";
    option.hidden = !matches;
    option.disabled = !matches || hold;
  }
  const current = selectedSize(sizeSelect);
  if (!current || current.dataset.product !== chosen) sizeSelect.value = "";
  showPrice(productSelect, sizeSelect, price);
}

function showPrice(productSelect, sizeSelect, price) {
  const option = selectedSize(sizeSelect);
  const photographId = document.body.dataset.photographId;
  if (!productSelect.value || !option) {
    price.textContent = "";
    return;
  }
  price.textContent = quoteText(photographId, option.dataset.product, option.dataset.size);
}

function statusMessage(form, text) {
  const status = form.querySelector("[data-bb-form-status]");
  if (!status) return;
  status.hidden = false;
  status.textContent = text;
}

if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("[data-print-inquiry]");
  if (!form) return;
  const productSelect = form.querySelector("#print-product");
  const sizeSelect = form.querySelector("#print-size");
  const price = form.querySelector("#print-price");
  if (!productSelect || !sizeSelect || !price) return;
  applyProduct(productSelect, sizeSelect, price);
  productSelect.addEventListener("change", () => applyProduct(productSelect, sizeSelect, price));
  sizeSelect.addEventListener("change", () => showPrice(productSelect, sizeSelect, price));
  form.addEventListener("submit", (event) => {
    const option = selectedSize(sizeSelect);
    const message = form.querySelector("[name='contact[visitor_message]']");
    if (!productSelect.value || !option) {
      event.preventDefault();
      event.stopImmediatePropagation();
      sizeSelect.disabled = !productSelect.value;
      statusMessage(form, "Choose a print product and a size that is available for this photograph. Nothing has been sent.");
      return;
    }
    if (!form.reportValidity()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    const details = inquiryDetails({
      photographId: document.body.dataset.photographId,
      title: document.body.dataset.photographTitle,
      productName: productSelect.selectedOptions[0].textContent,
      sizeLabel: option.dataset.label,
      productId: option.dataset.product,
      sizeId: option.dataset.size,
      message: message.value,
    });
    form.querySelector("[name='contact[photograph_title]']").value = details.photographTitle;
    form.querySelector("[name='contact[catalog_id]']").value = details.catalogId;
    form.querySelector("[name='contact[print_product]']").value = details.product;
    form.querySelector("[name='contact[print_size]']").value = details.size;
    form.querySelector("[name='contact[price_or_quote]']").value = details.priceOrQuote;
    form.querySelector("[name='contact[body]']").value = details.lines.join("\n");
  }, true);
});
