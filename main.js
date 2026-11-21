(function () {
  var SUPABASE_URL = "https://udviizqhxyhozdgtqhgn.supabase.co";
  var SUPABASE_KEY = "sb_publishable_fUJTUxhXmTv4I_Z5ZAYYoQ_s2Jsk4cS";

  var panel = document.getElementById("nav-panel");
  var openBtn = document.getElementById("menu-btn");
  var closeBtn = document.getElementById("close-btn");

  function openMenu() {
    if (!panel || !openBtn || !closeBtn) return;
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    panel.removeAttribute("inert");
    openBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function closeMenu() {
    if (!panel || !openBtn) return;
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    panel.setAttribute("inert", "");
    openBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    openBtn.focus();
  }

  if (panel && openBtn && closeBtn) {
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
  }

  var supabaseClient = null;
  if (window.supabase && typeof window.supabase.createClient === "function") {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    supabaseClient.auth.getSession().then(function (result) {
      var session = result && result.data ? result.data.session : null;
      var longevity = document.getElementById("nav-longevity");
      var cocreate = document.getElementById("nav-cocreate");
      if (longevity) {
        longevity.setAttribute("href", session ? "longevity-member.html" : "longevity.html");
      }
      if (cocreate) {
        cocreate.setAttribute("href", session ? "co-create-member.html" : "co-create.html");
      }
    });
  }

  function sameSiteNext(value) {
    if (!value || typeof value !== "string") return "";
    var next = value.trim();
    if (!next || next.length > 200) return "";
    if (/[\u0000-\u001F\\]/.test(next)) return "";
    if (next.indexOf("..") !== -1) return "";
    if (/^[a-z][a-z0-9+.-]*:/i.test(next)) return "";
    if (next.slice(0, 2) === "//") return "";
    var path = next.split("#")[0].split("?")[0];
    if (!/^(\/|\.\/)?[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(path)) return "";
    return next;
  }

  var forgot = document.getElementById("forgot-password");
  if (forgot) {
    forgot.addEventListener("click", function (event) {
      event.preventDefault();
    });
  }

  var form = document.getElementById("loginForm");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var msg = document.getElementById("message");
      if (!supabaseClient) {
        if (msg) msg.textContent = "Sign-in is unavailable right now.";
        return;
      }
      var email = document.getElementById("email").value;
      var password = document.getElementById("password").value;
      if (msg) msg.textContent = "Logging in...";
      supabaseClient.auth.signInWithPassword({ email: email, password: password }).then(function (result) {
        if (result.error) {
          if (msg) msg.textContent = result.error.message;
          return;
        }
        var params = new URLSearchParams(window.location.search);
        var next = sameSiteNext(params.get("next"));
        window.location.href = next || "co-create-member.html";
      });
    });
  }
})();
