const ALLOWED = /^https:\/\/(?:square\.link|checkout\.square\.site)\//i;

function showVerifiedLink() {
  const slot = document.querySelector("[data-square-slot]");
  const product = document.querySelector("#print-product");
  const size = document.querySelector("#print-size");
  const photoId = document.body.dataset.photographId;
  if (!slot || !product || !size || !photoId || !window.__bbSquareLinks) return;
  slot.replaceChildren();
  const row = window.__bbSquareLinks.find((item) => item.id === photoId && item.material === product.value && item.size === size.value);
  if (!row || typeof row.url !== "string" || !ALLOWED.test(row.url)) return;
  const link = document.createElement("a");
  link.className = "btn btn--solid-ink";
  link.href = row.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Buy this print";
  slot.appendChild(link);
}

fetch("/assets/data/square-payment-links.json")
  .then((response) => response.json())
  .then((data) => {
    window.__bbSquareLinks = Array.isArray(data.links) ? data.links : [];
    const product = document.querySelector("#print-product");
    const size = document.querySelector("#print-size");
    if (product) product.addEventListener("change", showVerifiedLink);
    if (size) size.addEventListener("change", showVerifiedLink);
    showVerifiedLink();
  })
  .catch(() => {
    window.__bbSquareLinks = [];
  });
