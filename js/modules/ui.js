let toastTimer;

export function toast(message) {
  const target = document.querySelector("[data-toast]");
  if (!target) return;
  clearTimeout(toastTimer);
  target.textContent = message;
  target.classList.add("toast--visible");
  toastTimer = setTimeout(
    () => target.classList.remove("toast--visible"),
    2800,
  );
}

export function message(title, text) {
  const dialog = document.getElementById("message-dialog");
  if (!dialog) return;
  dialog.querySelector("#message-title").textContent = title;
  dialog.querySelector("[data-message]").textContent = text;
  openDialog(dialog);
}

const openers = new WeakMap();
const focusableSelector =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])';

export function openDialog(dialog, opener = document.activeElement) {
  if (!dialog || dialog.open) return;
  openers.set(dialog, opener);
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
  opener?.setAttribute("aria-expanded", "true");
  dialog.querySelector(focusableSelector)?.focus();
}

function initDialogs() {
  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (
        event.clientX < box.left ||
        event.clientX > box.right ||
        event.clientY < box.top ||
        event.clientY > box.bottom
      )
        dialog.close();
    });
    dialog.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const items = [...dialog.querySelectorAll(focusableSelector)].filter(
        (item) => item.getClientRects().length,
      );
      if (!items.length) return;
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    dialog.addEventListener("close", () => {
      const opener = openers.get(dialog);
      opener?.setAttribute("aria-expanded", "false");
      if (opener?.isConnected) opener.focus();
    });
  });
}

function initReveal() {
  const items = [
    ...document.querySelectorAll(
      ".section, .product-card, .article-card, .service-card, .panel",
    ),
  ];
  if (
    !items.length ||
    !("IntersectionObserver" in window) ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;
  const reveal = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("reveal--visible");
        reveal.unobserve(entry.target);
      }),
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );
  items.forEach((item, index) => {
    item.classList.add("reveal");
    item.style.setProperty(
      "--reveal-delay",
      `${Math.min(index % 5, 4) * 45}ms`,
    );
    reveal.observe(item);
  });
}

function initStickyHeader() {
  const header = document.querySelector(".header--overlay");
  if (!header) return;

  const update = () => {
    header.classList.toggle("header--scrolled", window.scrollY > 16);
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
}

export function initUI() {
  document.addEventListener("click", (event) => {
    const open = event.target.closest("[data-open]");
    if (open) openDialog(document.getElementById(open.dataset.open), open);
    const contact = event.target.closest("[data-contact-open]");
    if (contact) {
      event.preventDefault();
      openDialog(document.getElementById("contact-dialog"), contact);
    }
    const close = event.target.closest("[data-close]");
    if (close) close.closest("dialog")?.close();
    const legal = event.target.closest("[data-legal]");
    if (legal)
      message(
        legal.textContent,
        legal.dataset.legal === "cookies"
          ? "В этом прототипе корзина и избранное хранятся только в вашем браузере. Аналитические и рекламные cookies не используются."
          : "Документ магазина необходимо подключить при интеграции. Для уточнения условий свяжитесь с Everglow.",
      );
  });

  initDialogs();
  const mobile = matchMedia("(max-width: 767px)");
  const footer = () =>
    document.querySelectorAll(".footer__group").forEach((group) => {
      group.open = !mobile.matches;
    });
  footer();
  mobile.addEventListener("change", footer);
  document.querySelectorAll(".footer__group summary").forEach((summary) =>
    summary.addEventListener("click", (event) => {
      if (!mobile.matches) event.preventDefault();
    }),
  );
  matchMedia("(min-width: 1101px)").addEventListener("change", (event) => {
    if (event.matches) document.getElementById("mobile-menu")?.close();
  });

  const tabsRoot = document.querySelector("[data-tabs]");
  if (tabsRoot) {
    const tabs = [...tabsRoot.querySelectorAll("[role=tab]")];
    const select = (tab) =>
      tabs.forEach((item) => {
        const active = item === tab;
        item.setAttribute("aria-selected", String(active));
        item.tabIndex = active ? 0 : -1;
        document.getElementById(item.getAttribute("aria-controls")).hidden =
          !active;
      });
    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => select(tab));
      tab.addEventListener("keydown", (event) => {
        let next = index;
        if (["ArrowRight", "ArrowDown"].includes(event.key))
          next = (index + 1) % tabs.length;
        else if (["ArrowLeft", "ArrowUp"].includes(event.key))
          next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = tabs.length - 1;
        else return;
        event.preventDefault();
        select(tabs[next]);
        tabs[next].focus();
      });
    });
    tabsRoot
      .querySelector("[data-tab-target]")
      ?.addEventListener("click", (event) => {
        const tab = document.getElementById(
          event.currentTarget.dataset.tabTarget,
        );
        if (tab) {
          select(tab);
          tab.focus();
        }
      });
  }

  document.querySelectorAll("[data-password]").forEach((button) =>
    button.addEventListener("click", () => {
      const input = button.parentElement.querySelector("input");
      const visible = input.type === "password";
      input.type = visible ? "text" : "password";
      button.textContent = visible ? "Скрыть пароль" : "Показать пароль";
      button.setAttribute("aria-pressed", String(visible));
    }),
  );
  document.querySelectorAll("[data-letter]").forEach((button) =>
    button.addEventListener("click", () => {
      document
        .querySelectorAll("[data-letter]")
        .forEach((item) =>
          item.setAttribute("aria-pressed", String(item === button)),
        );
      document.querySelectorAll("[data-brand-name]").forEach((card) => {
        card.hidden = !card.dataset.brandName.startsWith(button.dataset.letter);
      });
    }),
  );
  document.querySelectorAll("[data-topic-filter]").forEach((button) =>
    button.addEventListener("click", () => {
      const all = button.dataset.topicFilter === "Все";
      let count = 0;
      document
        .querySelectorAll("[data-topic-filter]")
        .forEach((item) =>
          item.setAttribute("aria-pressed", String(item === button)),
        );
      document.querySelectorAll("[data-topic]").forEach((card) => {
        card.hidden = !all && card.dataset.topic !== button.dataset.topicFilter;
        if (!card.hidden) count++;
      });
      const empty = document.querySelector("[data-journal-empty]");
      if (empty) empty.hidden = count > 0;
    }),
  );
  initStickyHeader();
  initReveal();
}
