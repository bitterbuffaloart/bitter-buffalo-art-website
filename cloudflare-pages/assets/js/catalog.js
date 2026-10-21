document.addEventListener("DOMContentLoaded", () => {
  const roots = [...document.querySelectorAll("[data-catalog-grid]")];
  if (!roots.length) return;
  const dialog = document.createElement("dialog");
  dialog.className = "catalog-enlarge";
  dialog.innerHTML = '<button type="button" class="catalog-enlarge__close">Close</button><img alt=""><p></p>';
  document.body.append(dialog);
  const enlarged = dialog.querySelector("img");
  const caption = dialog.querySelector("p");
  dialog.querySelector("button").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  const money = (value) => (value ? `$${value}` : "");
  const pageSize = 12;

  const card = (product, inquiryById) => {
    const [thumb, display, large] = product.images.split("|");
    const figure = document.createElement("figure");
    figure.className = "portfolio-card";
    figure.id = product.id;
    const image = document.createElement("img");
    image.src = thumb || display;
    image.alt = product.name;
    image.width = Number(product.thumb_width) || Number(product.display_width) || 480;
    image.height = Number(product.thumb_height) || Number(product.display_height) || 320;
    const photography = product.category === "photography prints";
    let media;
    if (photography) {
      media = document.createElement("a");
      media.className = "catalog-thumb";
      media.href = product.inquiry_or_external_link;
      media.append(image);
    } else {
      media = document.createElement("button");
      media.type = "button";
      media.className = "catalog-thumb";
      media.append(image);
      media.addEventListener("click", () => {
        enlarged.src = large || display;
        enlarged.alt = product.name;
        caption.textContent = product.name;
        dialog.showModal();
      });
    }
    const text = document.createElement("figcaption");
    const title = photography ? document.createElement("a") : document.createElement("p");
    title.className = "catalog-title";
    title.textContent = product.name;
    if (photography) title.href = product.inquiry_or_external_link;
    const copy = document.createElement("p");
    copy.className = "catalog-copy";
    copy.textContent = product.description;
    text.append(title, copy);
    const faa = typeof product.faa_artwork_url === "string" ? product.faa_artwork_url : "";
    if (photography) {
      const inquiry = inquiryById ? inquiryById.get(product.id) : null;
      const offers = inquiry && typeof BBPrices !== "undefined" ? BBPrices.pricedPublicOffers(inquiry) : [];
      const price = document.createElement("div");
      price.className = "catalog-price";
      if (offers.length) {
        const list = document.createElement("ul");
        list.className = "catalog-offers";
        for (const offer of offers) {
          const item = document.createElement("li");
          item.textContent = faa ? `Website price: ${offer.label}` : offer.label;
          list.append(item);
        }
        price.append(list);
      } else if (product.retail_price) {
        price.textContent = faa ? `Website price: ${money(product.retail_price)}` : money(product.retail_price);
      } else {
        price.textContent = "Contact for Pricing.";
      }
      text.append(price);
      if (faa && (offers.length || product.retail_price)) {
        const note = document.createElement("p");
        note.className = "catalog-copy";
        note.textContent = "Fine Art America sets its own price.";
        text.append(note);
      }
      const actions = document.createElement("p");
      actions.className = "catalog-actions";
      const buy = document.createElement("a");
      if (faa) {
        buy.href = faa;
        buy.target = "_blank";
        buy.rel = "noopener noreferrer";
        buy.textContent = "Buy Prints on Fine Art America";
      } else {
        buy.href = `/contact/?topic=print&piece=${encodeURIComponent(product.name)}`;
        buy.textContent = "Contact to Purchase";
      }
      actions.append(buy);
      text.append(actions);
    } else {
      if (product.retail_price) {
        const price = document.createElement("span");
        price.className = "catalog-price";
        price.textContent = money(product.retail_price);
        text.append(price);
      } else if (product.availability === "on-hold") {
        const hold = document.createElement("span");
        hold.className = "portfolio-badge";
        hold.textContent = "On hold";
        text.append(hold);
      }
      const link = document.createElement("a");
      link.href = product.inquiry_or_external_link;
      if (product.inquiry_or_external_link.includes("etsy.com/listing/")) {
        link.textContent = "Buy on Etsy";
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      } else if (product.inquiry_or_external_link.includes("/contact/")) {
        link.textContent = "Inquire";
      } else {
        link.textContent = "View print";
      }
      text.append(link);
    }
    figure.append(media, text);
    return figure;
  };

  const visibleItems = (catalog, root) => {
    const category = root.getAttribute("data-category");
    let items = catalog.products.filter((product) => product.category === category && product.availability !== "withheld");
    if (category === "photography prints") {
      if (root.hasAttribute("data-featured")) items = items.filter((product) => product.featured === true);
      const subject = root.getAttribute("data-subject");
      if (subject) items = items.filter((product) => Array.isArray(product.subjects) && product.subjects.includes(subject));
      if (typeof BBPrices !== "undefined") items = BBPrices.separatePairs(items);
    }
    return items;
  };

  const paint = (root, items) => {
    const page = Number(root.dataset.page || "1");
    const pages = Math.max(1, Math.ceil(items.length / pageSize));
    const safePage = Math.min(Math.max(page, 1), pages);
    root.dataset.page = String(safePage);
    const slice = items.slice((safePage - 1) * pageSize, safePage * pageSize);
    if (!slice.length) {
      const empty = document.createElement("p");
      empty.className = "catalog-empty";
      empty.textContent = "No photographs are published in this subject.";
      root.replaceChildren(empty);
    } else {
      root.replaceChildren(...slice.map((product) => card(product, root.inquiryById)));
    }
    root.dataset.catalogCount = String(items.length);
    const pager = root.parentElement ? root.parentElement.querySelector("[data-catalog-pager]") : null;
    if (!pager) return;
    const status = pager.querySelector("[data-page-status]");
    if (status) status.textContent = `Page ${safePage} of ${pages}. Showing ${slice.length} of ${items.length}.`;
    const prev = pager.querySelector("[data-page='prev']");
    const next = pager.querySelector("[data-page='next']");
    if (prev) prev.disabled = safePage <= 1;
    if (next) next.disabled = safePage >= pages;
  };

  const needsInquiry = roots.some((root) => root.getAttribute("data-category") === "photography prints");
  const inquiryPromise = needsInquiry
    ? fetch("/assets/data/print-inquiry.json").then((response) => {
      if (!response.ok) throw new Error(String(response.status));
      return response.json();
    })
    : Promise.resolve({ photographs: [] });

  Promise.all([
    fetch("/assets/data/catalog.json").then((response) => {
      if (!response.ok) throw new Error(String(response.status));
      return response.json();
    }),
    inquiryPromise,
  ])
    .then(([catalog, inquiry]) => {
      const inquiryById = new Map((inquiry.photographs || []).map((photo) => [photo.id, photo]));
      const publicPhotos = catalog.products.filter((product) => product.category === "photography prints" && product.availability !== "withheld");
      document.querySelectorAll("[data-portfolio-count]").forEach((node) => {
        node.textContent = String(publicPhotos.length);
      });
      roots.forEach((root) => {
        root.inquiryById = inquiryById;
        root.dataset.page = "1";
        const items = visibleItems(catalog, root);
        paint(root, items);
        const pager = root.parentElement ? root.parentElement.querySelector("[data-catalog-pager]") : null;
        if (!pager) return;
        pager.addEventListener("click", (event) => {
          const button = event.target.closest("button");
          if (!button || !pager.contains(button)) return;
          const current = Number(root.dataset.page || "1");
          if (button.dataset.page === "prev") root.dataset.page = String(current - 1);
          if (button.dataset.page === "next") root.dataset.page = String(current + 1);
          paint(root, visibleItems(catalog, root));
          root.scrollIntoView({ block: "start" });
        });
      });
    })
    .catch(() => {
      roots.forEach((root) => {
        root.textContent = "The product catalog did not load.";
      });
    });
});
