/* Mobile menu for the inner pages.
   Open/close, Escape, scroll lock, and focus move with the overlay. */
(function () {
  var btn = document.querySelector(".menu-toggle");
  var menu = document.getElementById("site-menu");
  if (!btn || !menu) return;

  function items() {
    return Array.prototype.slice.call(menu.querySelectorAll("a, button"));
  }

  function openMenu() {
    menu.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    btn.setAttribute("aria-label", "Close menu");
    document.body.classList.add("menu-open");
    var first = items()[0];
    if (first) first.focus();
  }

  function closeMenu(restoreFocus) {
    if (menu.hidden) return;
    menu.hidden = true;
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "Open menu");
    document.body.classList.remove("menu-open");
    if (restoreFocus) btn.focus();
  }

  btn.addEventListener("click", function () {
    if (btn.getAttribute("aria-expanded") === "true") closeMenu(false);
    else openMenu();
  });

  document.addEventListener("keydown", function (event) {
    if (menu.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu(true);
      return;
    }
    if (event.key !== "Tab") return;
    var list = items();
    if (!list.length) return;
    var first = list[0];
    var last = list[list.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
})();
