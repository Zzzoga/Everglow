import { totals, getState, update } from "./store.js";
export function initForms() {
  document.querySelectorAll("form").forEach((form) => {
    if (form.matches("[data-filter-form],.search-form")) return;
    form.noValidate = true;
    const validate = (input) => {
      if (input.type === "tel") {
        const digits = input.value.replace(/\D/g, "");
        input.setCustomValidity(
          digits.length < 10 || digits.length > 15
            ? "Введите телефон: от 10 до 15 цифр."
            : "",
        );
      }
      const valid = input.checkValidity();
      input.setAttribute("aria-invalid", String(!valid));
      const error = input.closest(".field")?.querySelector(".field__message");
      if (error) {
        error.textContent = valid ? "" : input.validationMessage;
        if (!error.id)
          error.id = `error-${form.dataset.remoteForm || "checkout"}-${input.name}`;
        input.setAttribute("aria-describedby", error.id);
      }
      return valid;
    };
    form.querySelectorAll("input,textarea").forEach((input) => {
      input.addEventListener("blur", () => validate(input));
      input.addEventListener("input", () => {
        if (input.getAttribute("aria-invalid") === "true") validate(input);
      });
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const inputs = [...form.querySelectorAll("input,textarea")];
      const invalid = inputs.filter((input) => !validate(input));
      const status = form.querySelector("[data-form-status]");
      if (invalid.length) {
        if (status) status.textContent = "Проверьте обязательные поля.";
        invalid[0].focus();
        return;
      }
      if (form.hasAttribute("data-checkout-form")) {
        if (!totals().count) {
          status.textContent = "Добавьте товары в корзину.";
          return;
        }
        const state = getState();
        const order = {
          number: `DEMO-${Date.now().toString().slice(-6)}`,
          items: state.cart,
          total: totals().total,
        };
        try {
          sessionStorage.setItem("everglow-demo-order", JSON.stringify(order));
        } catch {
          /* The confirmation page also supports a generic state. */
        }
        update((s) => {
          s.cart = {};
        });
        location.href = "success.html";
        return;
      }
      if (form.hasAttribute("data-contact-form")) {
        const request = new CustomEvent("everglow:submit", {
          bubbles: true,
          cancelable: true,
          detail: { form, kind: "contact", data: new FormData(form), status },
        });
        if (form.dispatchEvent(request) && status)
          status.textContent =
            "Проверка пройдена. Серверная отправка будет подключена после интеграции обработчика.";
        return;
      }
      // Bitrix can provide a transport without changing the form markup or validation.
      // The default never stores passwords or claims a successful server action.
      const request = new CustomEvent("everglow:submit", {
        bubbles: true,
        cancelable: true,
        detail: {
          form,
          kind: form.dataset.remoteForm,
          data: new FormData(form),
          status,
        },
      });
      if (form.dispatchEvent(request) && status)
        status.textContent =
          "Отправка пока не подключена. Свяжитесь с нами: hello@everglow.ru.";
    });
  });
  if (document.body.dataset.page === "success") {
    try {
      const order = JSON.parse(sessionStorage.getItem("everglow-demo-order"));
      if (order)
        document.querySelector("[data-order-number]").textContent =
          `Тестовый заказ № ${order.number}`;
    } catch {
      /* Show the static demonstration state. */
    }
  }
}
