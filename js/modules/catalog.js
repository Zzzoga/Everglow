import { products } from "../products.js";
import { getState } from "./store.js";
export function initCatalog() {
  const listing = document.querySelector("[data-listing]");
  if (!listing) return;
  const grid = listing.querySelector("[data-product-grid]");
  const cards = [...grid.children];
  const form = listing.querySelector("[data-filter-form]");
  const params = new URLSearchParams(location.search);
  const search = document.getElementById("search-query");
  const sort = listing.querySelector("[data-sort]");
  if (search) search.value = params.get("q") || "";
  if (
    sort &&
    ["popular", "new", "price-asc", "price-desc", "discount"].includes(
      params.get("sort"),
    )
  )
    sort.value = params.get("sort");
  const categoryAliases = {
    Уход: "Лицо",
    Подарки: "Наборы",
    Барьер: "Лицо",
    SPF: "Лицо",
    "Для сияния": "Лицо",
  };
  let category =
    categoryAliases[params.get("category")] || params.get("category") || "";
  let page = 1;
  const pageSize =
    listing.dataset.listing === "catalog"
      ? 12
      : listing.dataset.listing === "search"
        ? 10
        : 20;
  const selected = (name) =>
    form
      ? [...form.querySelectorAll(`input[name="${name}"]:checked`)].map(
          (el) => el.value,
        )
      : [];
  if (form && category)
    form.querySelectorAll("[name=category]").forEach((input) => {
      input.checked = input.value === category;
    });
  function apply() {
    const favorites = getState().favorites;
    const query = (search?.value || "").toLocaleLowerCase("ru").trim();
    const categories = selected("category");
    const brands = selected("brand");
    const badges = selected("badge");
    const min = form?.elements.min.value ? Number(form.elements.min.value) : 0;
    const max = form?.elements.max.value
      ? Number(form.elements.max.value)
      : Infinity;
    let matches = products.filter((p) => {
      if (listing.dataset.listing === "favorites" && !favorites.includes(p.id))
        return false;
      if (categories.length && !categories.includes(p.category)) return false;
      if (!form && category && ![p.category, "Новинки"].includes(category))
        return false;
      if (
        (category === "Новинки" || params.get("category") === "Новинки") &&
        p.badge !== "НОВИНКА"
      )
        return false;
      if (brands.length && !brands.includes(p.brand)) return false;
      if (
        badges.length &&
        !badges.some((b) => (b === "Скидка" ? !!p.old : p.badge === b))
      )
        return false;
      if (params.get("discount") && !p.old) return false;
      if (params.get("badge") && p.badge !== params.get("badge")) return false;
      if (p.price < min || p.price > max) return false;
      return (
        !query ||
        `${p.brand} ${p.title} ${p.meta} ${p.category} ${p.category === "Лицо" ? "уход" : ""}`
          .toLocaleLowerCase("ru")
          .includes(query)
      );
    });
    const mode = sort?.value;
    if (mode === "price-asc") matches.sort((a, b) => a.price - b.price);
    if (mode === "price-desc") matches.sort((a, b) => b.price - a.price);
    if (mode === "new")
      matches.sort(
        (a, b) => Number(b.badge === "НОВИНКА") - Number(a.badge === "НОВИНКА"),
      );
    if (mode === "discount")
      matches.sort(
        (a, b) =>
          (b.old ? 1 - b.price / b.old : 0) - (a.old ? 1 - a.price / a.old : 0),
      );
    if (mode === "popular") matches.sort((a, b) => b.reviews - a.reviews);
    const pages = Math.max(1, Math.ceil(matches.length / pageSize));
    page = Math.min(page, pages);
    const ids = matches
      .slice((page - 1) * pageSize, page * pageSize)
      .map((p) => p.id);
    cards.forEach((card) => {
      card.hidden = !ids.includes(card.dataset.product);
    });
    ids.forEach((id) => {
      const card = cards.find((c) => c.dataset.product === id);
      if (card) grid.append(card);
    });
    listing.querySelector("[data-result-count]").textContent =
      `${matches.length} товаров`;
    listing.querySelector("[data-empty]").hidden = !!matches.length;
    const pagination = listing.querySelector("[data-pagination]");
    pagination.replaceChildren();
    if (pages > 1)
      for (let i = 1; i <= pages; i++) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = i;
        button.setAttribute("aria-label", `Страница ${i}`);
        if (i === page) button.setAttribute("aria-current", "page");
        button.addEventListener("click", () => {
          page = i;
          apply();
          listing.scrollIntoView({ block: "start" });
          pagination.querySelector("[aria-current]")?.focus();
        });
        pagination.append(button);
      }
    document.querySelectorAll("[data-category]").forEach((button) => {
      if (button.tagName === "BUTTON")
        button.setAttribute(
          "aria-pressed",
          String(categories.includes(button.dataset.category)),
        );
    });
  }
  form?.addEventListener("change", () => {
    page = 1;
    category = "";
    apply();
  });
  form?.addEventListener("submit", (event) => event.preventDefault());
  form?.addEventListener("reset", () => {
    category = "";
    params.delete("category");
    params.delete("badge");
    params.delete("discount");
    page = 1;
    setTimeout(apply, 0);
  });
  document.querySelectorAll("button[data-category]").forEach((button) =>
    button.addEventListener("click", () => {
      const input = [...form.querySelectorAll("[name=category]")].find(
        (input) => input.value === button.dataset.category,
      );
      if (input) input.checked = !input.checked;
      page = 1;
      apply();
    }),
  );
  sort?.addEventListener("change", () => {
    page = 1;
    apply();
  });
  document.addEventListener("store:change", () => {
    if (listing.dataset.listing === "favorites") apply();
  });
  if (search) {
    search.form.addEventListener("submit", (event) => {
      event.preventDefault();
      page = 1;
      apply();
      document.getElementById("suggestions").hidden = true;
      history.replaceState(
        null,
        "",
        `search.html?q=${encodeURIComponent(search.value)}`,
      );
    });
    search.addEventListener("input", () => {
      page = 1;
      apply();
      const list = document.getElementById("suggestions");
      list.replaceChildren();
      const query = search.value.trim().toLocaleLowerCase("ru");
      const matched = query
        ? products
            .filter((p) =>
              `${p.title} ${p.brand}`.toLocaleLowerCase("ru").includes(query),
            )
            .slice(0, 5)
        : [];
      matched.forEach((p) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = `product.html?id=${p.id}`;
        a.textContent = `${p.brand} — ${p.title}`;
        li.append(a);
        list.append(li);
      });
      list.hidden = !matched.length;
    });
    search.addEventListener("keydown", (event) => {
      if (event.key === "Escape")
        document.getElementById("suggestions").hidden = true;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        document.querySelector("#suggestions a")?.focus();
      }
    });
    document.addEventListener("click", (event) => {
      if (!search.form.contains(event.target))
        document.getElementById("suggestions").hidden = true;
    });
  }
  const filters = listing.querySelector(".filters");
  const opener = listing.querySelector("[data-filter-open]");
  if (filters && opener) {
    const close = () => {
      filters.classList.remove("filters--open");
      opener.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      document.querySelector("main").removeAttribute("data-filter-active");
      opener.focus();
    };
    opener.addEventListener("click", () => {
      filters.classList.add("filters--open");
      opener.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      filters.querySelector("button").focus();
    });
    filters
      .querySelector("[data-filter-close]")
      .addEventListener("click", close);
    filters.addEventListener("keydown", (event) => {
      if (!filters.classList.contains("filters--open")) return;
      if (event.key === "Escape") close();
      if (event.key === "Tab") {
        const focusable = [
          ...filters.querySelectorAll("button,input,summary"),
        ].filter((el) => el.getClientRects().length && !el.disabled);
        const first = focusable[0],
          last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
    matchMedia("(min-width:1101px)").addEventListener("change", (event) => {
      if (event.matches && filters.classList.contains("filters--open")) close();
    });
  }
  apply();
}
