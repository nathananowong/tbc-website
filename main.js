(function () {
  var panel = document.getElementById("nav-panel");
  var openBtn = document.getElementById("menu-btn");
  var closeBtn = document.getElementById("close-btn");
  if (!panel || !openBtn || !closeBtn) return;

  function openMenu() {
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    openBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function closeMenu() {
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    openBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    openBtn.focus();
  }

  openBtn.addEventListener("click", openMenu);
  closeBtn.addEventListener("click", closeMenu);
  panel.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && panel.classList.contains("is-open")) {
      closeMenu();
    }
  });
})();
