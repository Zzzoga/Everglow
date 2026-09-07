import { products } from "../products.js";
import {
  productById,
  getState,
  update,
  totals,
  money,
  addToCart,
  toggleFavorite,
  escapeHTML as esc,
} from "./store.js";
import { toast } from "./ui.js";
export function cardHTML(p) {
  return `<article class="product-card" data-product="${p.id}" data-category="${p.category}" data-brand="${esc(p.brand)}" data-price="${p.price}"><div class="product-card__media"><a href="product.html?id=${p.id}" aria-label="${esc(p.brand + " " + p.title)}"><img src="${p.image}" width="408" height="485" loading="lazy" alt=""></a>${p.badge ? `<span class="badge">${p.badge}</span>` : ""}<button class="icon-button product-card__favorite" type="button" data-favorite="${p.id}" aria-label="В избранное: ${esc(p.title)}" aria-pressed="false"><img class="icon" src="img/heart.svg" width="24" height="24" alt=""></button></div><div class="product-card__content"><p class="product-card__brand">${esc(p.brand)}</p><h3 class="product-card__title"><a href="product.html?id=${p.id}">${esc(p.title)}</a></h3><p class="product-card__meta">${esc(p.meta)}</p><p class="rating">★ ${p.rating} <span class="muted">· ${p.reviews}</span></p></div><div class="product-card__footer"><div class="product-card__price"><span class="price ${p.old ? "price--sale" : ""}">${money(p.price)}</span>${p.old ? `<del class="price__old">${money(p.old)}</del>` : ""}</div><button class="button button--small button--secondary" type="button" data-add="${p.id}">В корзину</button></div></article>`;
}
function cartHTML(p, qty) {
  return `<article class="cart-item" data-cart-item="${p.id}"><a href="product.html?id=${p.id}"><img src="${p.image}" width="150" height="162" alt="${esc(p.title)}"></a><div class="cart-item__info"><p class="eyebrow">${esc(p.brand)}</p><h2><a href="product.html?id=${p.id}">${esc(p.title)}</a></h2><p class="muted">${esc(p.meta)}</p><div class="cart-item__actions"><div class="quantity" data-quantity="${p.id}"><button type="button" data-step="-1" aria-label="Уменьшить количество">−</button><input type="number" min="1" max="99" value="${qty}" aria-label="Количество"><button type="button" data-step="1" aria-label="Увеличить количество">+</button></div><button class="text-button" type="button" data-remove="${p.id}">Удалить</button></div></div><strong class="cart-item__price">${money(p.price * qty)}</strong></article>`;
}
export function syncCommerce() {
  const state = getState();
  const sums = totals();
  document.querySelectorAll("[data-cart-count]").forEach((el) => {
    el.textContent = sums.count;
    el.hidden = !sums.count;
  });
  document.querySelectorAll("[data-favorites-count]").forEach((el) => {
    el.textContent = state.favorites.length;
    el.hidden = el.classList.contains("counter") && !state.favorites.length;
  });
  document.querySelectorAll("[data-favorite]").forEach((button) => {
    const active = state.favorites.includes(button.dataset.favorite);
    button.setAttribute("aria-pressed", String(active));
    button.setAttribute(
      "aria-label",
      `${active ? "Убрать из избранного" : "В избранное"}: ${productById.get(button.dataset.favorite)?.title || ""}`,
    );
  });
  document.querySelectorAll("[data-summary-count]").forEach((el) => {
    el.textContent = `${sums.count} шт.`;
  });
  document.querySelectorAll("[data-subtotal]").forEach((el) => {
    el.textContent = money(sums.subtotal);
  });
  document.querySelectorAll("[data-discount]").forEach((el) => {
    el.textContent = "− " + money(sums.subtotal - sums.total);
  });
  const checkout = document.querySelector("[data-checkout]");
  const shipping =
    checkout && sums.count
      ? document.querySelector("[name=delivery]:checked")?.value === "pickup"
        ? 190
        : 390
      : 0;
  document.querySelectorAll("[data-total]").forEach((el) => {
    el.textContent = money(sums.total + shipping);
  });
  if (checkout) {
    document.querySelector("[data-shipping]").textContent = money(shipping);
    const submit = document.querySelector(
      '[form="checkout-form"][type="submit"]',
    );
    if (submit) submit.disabled = !sums.count;
  }
  const cart = document.querySelector("[data-cart-items]");
  if (cart) {
    // Keep active inputs and keyboard focus stable when updating quantity.
    const active = document.activeElement;
    const id = active.closest("[data-cart-item]")?.dataset.cartItem;
    const action = active.hasAttribute("data-step")
      ? active.dataset.step
      : active.matches("input")
        ? "input"
        : null;
    cart.innerHTML = Object.entries(state.cart)
      .map(([key, qty]) => cartHTML(productById.get(key), qty))
      .join("");
    document.querySelector("[data-cart-layout]").hidden = !sums.count;
    document.querySelector("[data-cart-empty]").hidden = !!sums.count;
    if (id && action)
      cart
        .querySelector(
          `[data-cart-item="${id}"] ${action === "input" ? "input" : `[data-step="${action}"]`}`,
        )
        ?.focus();
  }
}
export function initCommerce() {
  const pdp = document.querySelector("[data-pdp]");
  if (pdp) {
    const id = new URLSearchParams(location.search).get("id") || "axis";
    const p = productById.get(id);
    if (p) {
      pdp.dataset.pdp = p.id;
      document.querySelectorAll("[data-pdp-brand]").forEach((el) => {
        el.textContent = p.brand;
      });
      document.querySelector("[data-pdp-title]").textContent = p.title;
      document.title = `${p.title} — EVERGLOW`;
      document.querySelector("[data-pdp-price]").innerHTML =
        `<span class="price ${p.old ? "price--sale" : ""}">${money(p.price)}</span>${p.old ? `<del class="price__old">${money(p.old)}</del>` : ""}`;
      document.querySelector("[data-pdp-add]").dataset.add = p.id;
      document.querySelector("[data-pdp-favorite]").dataset.favorite = p.id;
      if (id !== "axis") {
        document.querySelector("[data-pdp-description]").textContent = p.meta;
        pdp.querySelector(".pdp__meta").innerHTML =
          `<a href="#reviews">★ ${p.rating} · ${p.reviews} отзывов</a>`;
        pdp.querySelectorAll(".gallery-item").forEach((item, index) => {
          const image = item.querySelector("img");
          if (image) {
            image.src = p.image;
            image.alt = `${p.title} — фото ${index + 1}`;
          }
          item.href = p.image;
          item.dataset.caption = `${p.brand} ${p.title} — фото ${index + 1}`;
        });
        pdp.querySelector(".volume").hidden = true;
        pdp.querySelector(".pdp__story").hidden = true;
        pdp.querySelector(".pdp__info>.muted").hidden = true;
        pdp.querySelector(".accordion__body").textContent =
          `${p.title}. ${p.meta}. Подробные характеристики уточните у консультанта.`;
        document.querySelector(".pdp + section")?.remove();
        document.querySelector("main>.section--tint")?.remove();
      }
    }
  }
  if (document.body.dataset.page === "brand") {
    const requested =
      new URLSearchParams(location.search).get("brand") || "DAVINES";
    const subset = products.filter((p) => p.brand === requested);
    document.querySelector("[data-brand-products]").innerHTML = subset.length
      ? subset.map(cardHTML).join("")
      : "<p>Товары бренда появятся в каталоге позже.</p>";
    if (requested !== "DAVINES") {
      document.querySelector("h1").textContent = requested;
      document.title = `${requested} — EVERGLOW`;
      document.querySelector(".page-intro__text").textContent =
        "Познакомьтесь с продуктами бренда в Everglow.";
      document.querySelector(".page-intro .chips").hidden = true;
      document.querySelector("[data-brand-story]").textContent =
        "За подробной информацией о бренде и подбором средств обращайтесь к консультантам Everglow.";
      document.querySelector("[data-brand-why]").parentElement.hidden = true;
    }
  }
  document.addEventListener("click", (event) => {
    const add = event.target.closest("[data-add]");
    if (add) {
      const qty =
        Number(
          add.closest("[data-pdp]")?.querySelector(".quantity input").value,
        ) || 1;
      addToCart(add.dataset.add, qty);
      toast("Товар добавлен в корзину");
    }
    const favorite = event.target.closest("[data-favorite]");
    if (favorite) {
      toggleFavorite(favorite.dataset.favorite);
      toast(
        getState().favorites.includes(favorite.dataset.favorite)
          ? "Добавлено в избранное"
          : "Удалено из избранного",
      );
    }
    const remove = event.target.closest("[data-remove]");
    if (remove) {
      const id = remove.dataset.remove;
      update((s) => {
        delete s.cart[id];
      });
      toast("Товар удалён из корзины");
      document
        .querySelector("[data-cart-items] button, [data-cart-empty] a")
        ?.focus();
    }
    const step = event.target.closest("[data-step]");
    if (step) {
      const quantity = step.closest("[data-quantity]");
      const input = quantity.querySelector("input");
      input.value = Math.max(
        1,
        Math.min(99, (Number(input.value) || 1) + Number(step.dataset.step)),
      );
      if (quantity.dataset.quantity)
        update((s) => {
          s.cart[quantity.dataset.quantity] = Number(input.value);
        });
    }
    if (event.target.closest("[data-clear-favorites]"))
      update((s) => {
        s.favorites = [];
      });
  });
  document.addEventListener("change", (event) => {
    const input = event.target.closest("[data-quantity] input");
    if (input) {
      input.value = Math.max(
        1,
        Math.min(99, Math.trunc(Number(input.value)) || 1),
      );
      const id = input.closest("[data-quantity]").dataset.quantity;
      if (id)
        update((s) => {
          s.cart[id] = Number(input.value);
        });
    }
    if (event.target.matches("[name=delivery]")) syncCommerce();
  });
  document
    .querySelector("[data-promo]")
    ?.addEventListener("change", (event) => {
      document.querySelector("[data-promo-message]").textContent =
        event.target.value.trim()
          ? "Промокод не найден. Проверьте написание."
          : "";
    });
  document.addEventListener("store:change", syncCommerce);
  syncCommerce();
}
