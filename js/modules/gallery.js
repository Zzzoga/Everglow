export function initGallery() {
  const items = document.querySelectorAll("[data-fancybox]");
  if (!items.length) return;
  const boot = () => {
    if (!window.Fancybox) return;
    window.Fancybox.bind("[data-fancybox]", {
      animated: true,
      hideClass: "f-fadeOut",
      dragToClose: false,
      Thumbs: false,
      Toolbar: {
        display: {
          left: ["infobar"],
          middle: [],
          right: ["iterateZoom", "close"],
        },
      },
      Images: { Panzoom: { maxScale: 2.5, click: "toggleZoom" } },
    });
  };
  if (window.Fancybox) boot();
  else window.addEventListener("load", boot, { once: true });
}
