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

  const card = (product) => {
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
      const price = document.createElement("span");
      price.className = "catalog-price";
      if (product.retail_price) {
        const amount = product.retail_price === "199.33"
          ? "16×24 framed canvas $199.33"
          : money(product.retail_price);
        price.textContent = faa ? `Website price: ${amount}` : amount;
      } else {
        price.textContent = "Contact for Pricing.";
      }
      text.append(price);
      if (faa && product.retail_price) {
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

  fetch("/assets/data/catalog.json")
    .then((response) => {
      if (!response.ok) throw new Error(String(response.status));
      return response.json();
    })
    .then((catalog) => {
      roots.forEach((root) => {
        const category = root.getAttribute("data-category");
        const items = catalog.products.filter((product) => product.category === category);
        root.replaceChildren(...items.map(card));
        root.dataset.catalogCount = String(items.length);
      });
    })
    .catch(() => {
      roots.forEach((root) => {
        root.textContent = "The product catalog did not load.";
      });
    });
});
