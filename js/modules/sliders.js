function setSlideState(root, swiper) {
  const slides = [...root.querySelectorAll(".swiper-slide")];
  if (!slides.length) return;
  const rawIndex =
    typeof swiper === "number"
      ? swiper
      : (swiper.realIndex ?? swiper.activeIndex ?? 0);
  const index = Math.max(0, Math.min(rawIndex, slides.length - 1));
  const count = root.querySelector("[data-slide-count]");
  const progress = root.querySelector("[data-progress]");
  const caption = root.querySelector("[data-slide-caption]");
  if (count)
    count.textContent = `${String(index + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
  if (progress)
    progress.style.width = `${((index + 1) / Math.max(slides.length, 1)) * 100}%`;
  if (caption) caption.textContent = slides[index]?.dataset.caption || "";
  slides.forEach((slide, slideIndex) => {
    const active = slideIndex === index;
    slide.setAttribute("aria-hidden", String(!active));
    slide.toggleAttribute("inert", !active);
  });
}

function createHeroSlider(root) {
  if (!window.Swiper || root.swiper || root.dataset.sliderReady) return false;
  try {
    const swiper = new window.Swiper(root, {
      effect: "fade",
      fadeEffect: { crossFade: true },
      speed: 650,
      loop: false,
      watchOverflow: false,
      observer: true,
      observeParents: true,
      keyboard: { enabled: true, onlyInViewport: true },
      autoplay: {
        delay: 6000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },
      on: {
        init(instance) {
          setSlideState(root, instance);
        },
        slideChange(instance) {
          setSlideState(root, instance);
        },
      },
    });
    root.dataset.sliderReady = "swiper";
    root
      .querySelector("[data-prev]")
      ?.addEventListener("click", () => swiper.slidePrev());
    root
      .querySelector("[data-next]")
      ?.addEventListener("click", () => swiper.slideNext());
    return true;
  } catch (error) {
    console.error("[Everglow] Не удалось инициализировать Swiper.", error);
    return false;
  }
}

function createNativeSlider(root) {
  if (root.dataset.sliderReady) return;
  const slides = [...root.querySelectorAll(".swiper-slide")];
  if (slides.length < 2) {
    root.dataset.sliderReady = "native";
    setSlideState(root, 0);
    return;
  }
  let index = 0;
  let timer;
  const reduceMotion = () =>
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  const render = () => setSlideState(root, index);
  const goTo = (next) => {
    index = (next + slides.length) % slides.length;
    render();
  };
  const stop = () => {
    if (timer) window.clearInterval(timer);
    timer = undefined;
  };
  const start = () => {
    stop();
    if (!reduceMotion())
      timer = window.setInterval(() => goTo(index + 1), 6000);
  };
  root.classList.add("slider--native");
  root.dataset.sliderReady = "native";
  root.querySelector("[data-prev]")?.addEventListener("click", () => {
    goTo(index - 1);
    start();
  });
  root.querySelector("[data-next]")?.addEventListener("click", () => {
    goTo(index + 1);
    start();
  });
  root.addEventListener("mouseenter", stop);
  root.addEventListener("mouseleave", start);
  root.addEventListener("focusin", stop);
  root.addEventListener("focusout", (event) => {
    if (!root.contains(event.relatedTarget)) start();
  });
  root.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(index - 1);
      start();
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(index + 1);
      start();
    }
  });
  render();
  start();
}

export function initSliders() {
  const roots = [...document.querySelectorAll("[data-slider]")];
  if (!roots.length) return;
  const boot = () =>
    roots.forEach((root) => {
      if (root.swiper || root.dataset.sliderReady) return;
      if (!createHeroSlider(root)) createNativeSlider(root);
    });
  if (window.Swiper) {
    boot();
    return;
  }
  // Defer/module execution order differs between browsers and static hosts.
  // Retry briefly so the local Swiper bundle can register before falling back.
  let attempts = 0;
  const retry = () => {
    if (window.Swiper || attempts >= 30) {
      boot();
      return;
    }
    attempts += 1;
    window.setTimeout(retry, 50);
  };
  window.addEventListener("load", boot, { once: true });
  retry();
}
