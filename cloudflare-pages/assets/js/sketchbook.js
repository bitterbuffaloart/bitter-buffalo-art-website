const grid = document.getElementById("sketch-grid");
const empty = document.getElementById("sketch-empty");
const dialog = document.getElementById("sketch-dialog");
const stage = document.getElementById("sketch-stage");
const full = document.getElementById("sketch-full");
const zoomBtn = document.getElementById("sketch-zoom");
const preset = document.body.dataset.sketchFilter || "all";

function metaLine(work) {
  return [work.medium, work.year, work.dimensions, work.availability].filter(Boolean).join(" · ");
}

function card(work) {
  const figure = document.createElement("figure");
  figure.className = "sketch-card";
  figure.dataset.categories = work.categories.join(" ");
  figure.id = work.id;
  const button = document.createElement("button");
  button.type = "button";
  const img = document.createElement("img");
  img.src = work.thumb;
  img.alt = work.alt;
  img.width = work.width;
  img.height = work.height;
  img.decoding = "async";
  img.loading = "lazy";
  button.append(img);
  button.addEventListener("click", () => openWork(work));
  const cap = document.createElement("figcaption");
  const title = document.createElement("h2");
  title.textContent = work.title;
  const note = document.createElement("p");
  note.className = "sketch-note";
  note.textContent = work.story || metaLine(work);
  cap.append(title, note);
  if (work.etsyUrl) {
    const buy = document.createElement("a");
    buy.href = work.etsyUrl;
    buy.target = "_blank";
    buy.rel = "noopener noreferrer";
    buy.textContent = "Buy on Etsy";
    cap.append(buy);
  } else {
    const inquire = document.createElement("a");
    inquire.href = "/contact/?topic=custom&piece=" + encodeURIComponent(work.title);
    inquire.textContent = "Inquire About This Artwork";
    cap.append(inquire);
  }
  figure.append(button, cap);
  return figure;
}

function applyFilter(name) {
  let shown = 0;
  for (const cardEl of grid.children) {
    const ok = name === "all" || cardEl.dataset.categories.split(" ").includes(name);
    cardEl.hidden = !ok;
    if (ok) shown += 1;
  }
  empty.hidden = shown > 0;
  for (const item of document.querySelectorAll(".sketch-filters button")) {
    item.setAttribute("aria-pressed", item.dataset.filter === name ? "true" : "false");
  }
}

function openWork(work) {
  full.src = work.zoom;
  full.alt = work.alt;
  full.width = work.width;
  full.height = work.height;
  document.getElementById("sketch-dialog-title").textContent = work.title;
  document.getElementById("sketch-meta").textContent = metaLine(work);
  document.getElementById("sketch-story").textContent = work.story || "";
  const prefix = document.body.dataset.assetPrefix || "..";
  document.getElementById("sketch-inquire").href = prefix + "/contact/?topic=custom&piece=" + encodeURIComponent(work.title);
  const buy = document.getElementById("sketch-buy");
  if (work.etsyUrl) {
    buy.hidden = false;
    buy.href = work.etsyUrl;
  } else {
    buy.hidden = true;
    buy.removeAttribute("href");
  }
  stage.classList.remove("is-zoomed");
  zoomBtn.textContent = "View larger";
  zoomBtn.setAttribute("aria-pressed", "false");
  if (typeof dialog.showModal === "function") dialog.showModal();
  document.getElementById("sketch-close").focus();
}

document.getElementById("sketch-close").addEventListener("click", () => dialog.close());
zoomBtn.addEventListener("click", () => {
  const on = stage.classList.toggle("is-zoomed");
  zoomBtn.textContent = on ? "Fit to window" : "View larger";
  zoomBtn.setAttribute("aria-pressed", on ? "true" : "false");
});
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});
const filters = document.querySelector(".sketch-filters");
if (filters) {
  filters.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    applyFilter(button.dataset.filter);
  });
}

const listUrl = (document.body.dataset.assetPrefix || "..") + "/assets/sketchbook/works.json";
fetch(listUrl)
  .then((response) => response.json())
  .then((data) => {
    for (const work of data.works) grid.append(card(work));
    applyFilter(preset);
    const hash = location.hash.replace("#", "");
    const match = data.works.find((work) => work.id === hash);
    if (match) openWork(match);
  })
  .catch(() => {
    empty.hidden = false;
    empty.textContent = "The sketchbook list did not load.";
  });
