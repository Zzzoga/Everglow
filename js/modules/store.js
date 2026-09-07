import { products } from "../products.js";
export const productById = new Map(
  products.map((product) => [product.id, product]),
);
const key = "everglow-demo-v1";
const defaults = {
  cart: { babor: 1, intrigue: 1, love: 1 },
  favorites: products.slice(0, 8).map((p) => p.id),
};
let state;
try {
  state = JSON.parse(localStorage.getItem(key)) || structuredClone(defaults);
} catch {
  state = structuredClone(defaults);
}
state.cart = Object.fromEntries(
  Object.entries(state.cart || {}).filter(
    ([id, n]) => productById.has(id) && Number.isInteger(n) && n > 0 && n <= 99,
  ),
);
state.favorites = [
  ...new Set(
    (Array.isArray(state.favorites) ? state.favorites : []).filter((id) =>
      productById.has(id),
    ),
  ),
];
export const money = (value) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
export function getState() {
  return structuredClone(state);
}
export function update(mutator) {
  mutator(state);
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    /* Session-only behavior when storage is unavailable. */
  }
  document.dispatchEvent(new CustomEvent("store:change"));
}
export function totals() {
  return Object.entries(state.cart).reduce(
    (sum, [id, qty]) => {
      const p = productById.get(id);
      sum.count += qty;
      sum.total += p.price * qty;
      sum.subtotal += (p.old || p.price) * qty;
      return sum;
    },
    { count: 0, total: 0, subtotal: 0 },
  );
}
export function addToCart(id, qty = 1) {
  if (!productById.has(id)) return;
  update((s) => {
    s.cart[id] = Math.min(
      99,
      (s.cart[id] || 0) + Math.max(1, Math.trunc(qty) || 1),
    );
  });
}
export function toggleFavorite(id) {
  if (!productById.has(id)) return;
  update((s) => {
    s.favorites = s.favorites.includes(id)
      ? s.favorites.filter((value) => value !== id)
      : [...s.favorites, id];
  });
}
export function escapeHTML(value) {
  return String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
