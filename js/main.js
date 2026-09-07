import { initUI } from "./modules/ui.js";
import { initCommerce } from "./modules/commerce.js";
import { initCatalog } from "./modules/catalog.js";
import { initForms } from "./modules/forms.js";
import { initSliders } from "./modules/sliders.js";
import { initGallery } from "./modules/gallery.js";
import { initScroll } from "./modules/scroll.js";

function boot() {
  initCommerce();
  initUI();
  initCatalog();
  initForms();
  initSliders();
  initGallery();
  initScroll();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
