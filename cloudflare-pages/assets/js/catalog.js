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
    const button = document.createElement("button");
    button.type = "button";
    button.className = "catalog-thumb";
    const image = document.createElement("img");
    image.src = thumb || display;
    image.alt = product.name;
    image.width = Number(product.thumb_width) || Number(product.display_width) || 480;
    image.height = Number(product.thumb_height) || Number(product.display_height) || 320;
    button.append(image);
    button.addEventListener("click", () => {
      enlarged.src = large || display;
      enlarged.alt = product.name;
      caption.textContent = product.name;
      dialog.showModal();
    });
    const text = document.createElement("figcaption");
    const title = document.createElement("p");
    title.className = "catalog-title";
    title.textContent = product.name;
    const copy = document.createElement("p");
    copy.className = "catalog-copy";
    copy.textContent = product.description;
    text.append(title, copy);
    if (product.status === "blocked") {
      const hold = document.createElement("span");
      hold.className = "portfolio-badge";
      hold.textContent = "Not available for print";
      text.append(hold);
    } else if (product.price_approval === "owner-confirmed" && product.retail_price) {
      const price = document.createElement("span");
      price.className = "catalog-price";
      price.textContent = money(product.retail_price);
      text.append(price);
    } else if (product.availability === "on-hold" || product.status === "draft") {
      const hold = document.createElement("span");
      hold.className = "portfolio-badge";
      hold.textContent = product.status === "draft" ? "Draft" : "On hold";
      text.append(hold);
    }
    if (product.variations) {
      const sizes = document.createElement("p");
      sizes.className = "catalog-copy";
      sizes.textContent = product.variations;
      text.append(sizes);
    }
    if (product.status !== "blocked" && product.status !== "draft" && product.inquiry_or_external_link) {
      const link = document.createElement("a");
      link.href = product.inquiry_or_external_link;
      if (product.inquiry_or_external_link.includes("/contact/")) link.textContent = "Inquire";
      else if (product.inquiry_or_external_link.startsWith("http")) {
        link.textContent = "View on Etsy";
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      } else link.textContent = "View print";
      text.append(link);
    }
    figure.append(button, text);
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
        const sandbox = root.getAttribute("data-catalog-mode") === "sandbox";
        const items = catalog.products.filter((product) => {
          if (category && product.category !== category) return false;
          if (!sandbox && product.status === "draft") return false;
          return true;
        });
        if (!items.length) {
          const empty = document.createElement("p");
          empty.textContent = "No products are in this section.";
          root.replaceChildren(empty);
        } else if (sandbox) {
          root.replaceChildren(...items.map((product) => {
            const figure = card(product);
            const note = document.createElement("p");
            note.className = "catalog-copy";
            const profit = product.estimated_profit == null ? "not calculated" : `$${product.estimated_profit}`;
            const listing = product.etsy_listing_id ? ` · Etsy listing ${product.etsy_listing_id} recorded, not reverified` : "";
            note.textContent = `${product.status} · SKU ${product.sku || product.id} · profit ${profit} · LumaPrints ${product.lumaprints_confirmed}${listing}`;
            figure.append(note);
            return figure;
          }));
        } else {
          root.replaceChildren(...items.map(card));
        }
        root.dataset.catalogCount = String(items.length);
      });
    })
    .catch(() => {
      roots.forEach((root) => {
        root.textContent = "The product catalog did not load.";
      });
    });

  const pricingRoot = document.querySelector("[data-pricing-master]");
  const confirmedNodes = [...document.querySelectorAll("[data-confirmed-retail]")];
  if (!pricingRoot && !confirmedNodes.length) return;
  fetch("/assets/data/pricing-master.json")
    .then((response) => {
      if (!response.ok) throw new Error(String(response.status));
      return response.json();
    })
    .then((payload) => {
      const records = payload.records || [];
      const confirmed = records.find((record) => record.sku === "FRAMED-OPEN-16x24" && record.price_approval === "owner-confirmed");
      if (confirmed?.confirmed_retail_usd) {
        confirmedNodes.forEach((node) => {
          node.textContent = `$${confirmed.confirmed_retail_usd}`;
        });
      }
      if (!pricingRoot) return;
      const table = document.createElement("table");
      const head = document.createElement("tr");
      ["SKU", "Size", "Approval", "Confirmed retail", "Known base", "Shipping", "Unresolved quote"].forEach((label) => {
        const cell = document.createElement("th");
        cell.textContent = label;
        head.append(cell);
      });
      table.append(head);
      records.forEach((record) => {
        const row = document.createElement("tr");
        const cells = [
          record.sku,
          record.size_in || "",
          record.price_approval,
          record.confirmed_retail_usd ? `$${record.confirmed_retail_usd}` : "",
          record.known_supplier_base_usd ? `$${record.known_supplier_base_usd}` : "",
          record.shipping_estimate_usd ? `$${record.shipping_estimate_usd}` : "",
          record.named_unresolved_quote_usd ? `$${record.named_unresolved_quote_usd}` : "",
        ];
        cells.forEach((value) => {
          const cell = document.createElement("td");
          cell.textContent = value;
          row.append(cell);
        });
        table.append(row);
      });
      pricingRoot.replaceChildren(table);
      pricingRoot.dataset.pricingCount = String(records.length);
    })
    .catch(() => {
      if (pricingRoot) pricingRoot.textContent = "The pricing master did not load.";
    });
});
