(function () {
  var STORAGE_KEY = "thebiocode-editions.cobuild.prospects";
  var PAGE_SIZE = 8;
  var CUSTOMER_GOAL = 30;
  var PARTNER_GOAL = 6;
  var PRODUCTS = [
    "Pharmanex LifePak",
    "ageLOC Youthspan",
    "Collagen+",
    "Mindfull",
    "Eye Formula",
    "G3"
  ];

  var listEl = document.getElementById("scanee-list");
  var overlay = document.getElementById("prospect-overlay");
  var form = document.getElementById("prospect-form");
  if (!listEl || !overlay || !form) return;

  var sortBtn = document.getElementById("sort-btn");
  var sortMenu = document.getElementById("sort-menu");
  var sortWrap = sortBtn ? sortBtn.parentNode : null;
  var addBtn = document.getElementById("add-btn");
  var prevBtn = document.getElementById("prev-page");
  var nextBtn = document.getElementById("next-page");
  var customersCount = document.getElementById("customers-count");
  var partnersCount = document.getElementById("partners-count");
  var customersMeter = document.getElementById("customers-meter");
  var partnersMeter = document.getElementById("partners-meter");
  var navPanel = document.getElementById("nav-panel");

  var titleEl = document.getElementById("prospect-title");
  var scrollEl = document.getElementById("prospect-scroll");
  var nameInput = document.getElementById("prospect-name");
  var scoreInput = document.getElementById("prospect-score");
  var dateInput = document.getElementById("prospect-date");
  var whatsappInput = document.getElementById("prospect-whatsapp");
  var instagramInput = document.getElementById("prospect-instagram");
  var nameError = document.getElementById("name-error");
  var purchasesEl = document.getElementById("purchases");
  var addPurchaseBtn = document.getElementById("add-purchase");
  var closeBtn = document.getElementById("prospect-close");
  var cancelBtn = document.getElementById("prospect-cancel");
  var deleteWrap = document.getElementById("prospect-delete");
  var deleteBtn = document.getElementById("delete-btn");
  var deleteNote = document.getElementById("delete-note");
  var purchaseTemplate = document.getElementById("purchase-template");

  var state = {
    records: [],
    sort: "recent",
    page: 0,
    editingId: null
  };
  var previousOverflow = "";

  function blankFlags(boxes) {
    var out = {};
    for (var i = 0; i < boxes.length; i++) out[boxes[i].value] = false;
    return out;
  }

  function flagKeys(name) {
    var boxes = form.querySelectorAll('input[name="' + name + '"]');
    var keys = [];
    for (var i = 0; i < boxes.length; i++) keys.push(boxes[i].value);
    return keys;
  }

  function emptyFlags(name) {
    var keys = flagKeys(name);
    var out = {};
    for (var i = 0; i < keys.length; i++) out[keys[i]] = false;
    return out;
  }

  function readStoredFlags(source, name) {
    var keys = flagKeys(name);
    var out = {};
    for (var i = 0; i < keys.length; i++) {
      out[keys[i]] = !!(source && source[keys[i]]);
    }
    return out;
  }

  function makeSeed() {
    var start = Date.UTC(2026, 0, 1);
    var records = [];
    for (var i = 0; i < 8; i++) {
      var status = emptyFlags("status");
      if (i === 0 || i === 1) status.customer = true;
      if (i === 2) status.builder = true;
      records.push({
        id: "seed-steve-" + (i + 1),
        name: "Steve",
        prysmScore: "",
        scanDate: "",
        whatsapp: "",
        instagram: "",
        status: status,
        opportunity: emptyFlags("opportunity"),
        health: emptyFlags("health"),
        purchases: [],
        createdAt: start + i * 1000
      });
    }
    return records;
  }

  function normalizePurchase(item) {
    if (!item || typeof item !== "object") return null;
    return {
      name: item.name ? String(item.name) : "",
      quantity: item.quantity === 0 || item.quantity ? String(item.quantity) : "",
      date: item.date ? String(item.date) : ""
    };
  }

  function normalizeRecord(raw) {
    if (!raw || typeof raw !== "object") return null;
    var name = raw.name ? String(raw.name).trim() : "";
    if (!name) return null;
    var purchases = [];
    if (Array.isArray(raw.purchases)) {
      for (var i = 0; i < raw.purchases.length; i++) {
        var purchase = normalizePurchase(raw.purchases[i]);
        if (purchase) purchases.push(purchase);
      }
    }
    return {
      id: raw.id ? String(raw.id) : uid(),
      name: name,
      prysmScore: raw.prysmScore === 0 || raw.prysmScore ? String(raw.prysmScore) : "",
      scanDate: raw.scanDate ? String(raw.scanDate) : "",
      whatsapp: raw.whatsapp ? String(raw.whatsapp) : "",
      instagram: raw.instagram ? String(raw.instagram) : "",
      status: readStoredFlags(raw.status, "status"),
      opportunity: readStoredFlags(raw.opportunity, "opportunity"),
      health: readStoredFlags(raw.health, "health"),
      purchases: purchases,
      createdAt: typeof raw.createdAt === "number" ? raw.createdAt : Date.now()
    };
  }

  function loadRecords() {
    var raw = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      raw = null;
    }
    if (raw === null) {
      var seed = makeSeed();
      state.records = seed;
      persist();
      return;
    }
    var parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      state.records = [];
      return;
    }
    if (!Array.isArray(parsed)) {
      state.records = [];
      return;
    }
    var records = [];
    for (var i = 0; i < parsed.length; i++) {
      var record = normalizeRecord(parsed[i]);
      if (record) records.push(record);
    }
    state.records = records;
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records));
    } catch (err) {}
  }

  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "p-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function nextStamp() {
    var stamp = Date.now();
    var max = 0;
    for (var i = 0; i < state.records.length; i++) {
      if (state.records[i].createdAt > max) max = state.records[i].createdAt;
    }
    return stamp > max ? stamp : max + 1;
  }

  function findById(id) {
    for (var i = 0; i < state.records.length; i++) {
      if (state.records[i].id === id) return state.records[i];
    }
    return null;
  }

  function scoreOf(record) {
    if (record.prysmScore === "" || record.prysmScore === null || record.prysmScore === undefined) return null;
    var number = Number(record.prysmScore);
    return isNaN(number) ? null : number;
  }

  function compareTextDesc(a, b) {
    var aEmpty = !a;
    var bEmpty = !b;
    if (aEmpty && bEmpty) return 0;
    if (aEmpty) return 1;
    if (bEmpty) return -1;
    if (a < b) return 1;
    if (a > b) return -1;
    return 0;
  }

  function sortedRecords() {
    var list = state.records.slice();
    list.sort(function (a, b) {
      var diff = 0;
      if (state.sort === "name") {
        diff = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      } else if (state.sort === "date") {
        diff = compareTextDesc(a.scanDate, b.scanDate);
      } else if (state.sort === "score") {
        var aScore = scoreOf(a);
        var bScore = scoreOf(b);
        if (aScore === null && bScore === null) diff = 0;
        else if (aScore === null) diff = 1;
        else if (bScore === null) diff = -1;
        else diff = bScore - aScore;
      } else {
        diff = b.createdAt - a.createdAt;
      }
      if (diff) return diff;
      return a.createdAt - b.createdAt;
    });
    return list;
  }

  function whatsappHref(value) {
    var digits = String(value || "").replace(/\D/g, "");
    if (!digits) return "";
    return "https://wa.me/" + digits;
  }

  function instagramHref(value) {
    var handle = String(value || "").trim();
    if (!handle) return "";
    handle = handle.replace(/^@+/, "");
    handle = handle.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "");
    handle = handle.split(/[/?#\s]/)[0];
    handle = handle.replace(/^@+/, "");
    if (!handle) return "";
    return "https://instagram.com/" + encodeURIComponent(handle);
  }

  function makeIcon(kind, href, label) {
    var node;
    if (href) {
      node = document.createElement("a");
      node.href = href;
      node.target = "_blank";
      node.rel = "noopener noreferrer";
    } else {
      node = document.createElement("span");
      node.classList.add("is-disabled");
      node.setAttribute("role", "img");
      node.setAttribute("aria-disabled", "true");
    }
    node.classList.add("scanee-icon");
    node.setAttribute("aria-label", label);
    var template = document.getElementById(kind === "wa" ? "tpl-wa" : "tpl-ig");
    if (template) node.appendChild(template.content.cloneNode(true));
    return node;
  }

  function renderCard(record) {
    var item = document.createElement("li");
    item.className = "scanee";
    item.setAttribute("data-id", record.id);

    var button = document.createElement("button");
    button.type = "button";
    button.className = "scanee-open";
    button.setAttribute("aria-label", "Edit " + record.name);
    var name = document.createElement("span");
    name.className = "scanee-name";
    name.textContent = record.name;
    button.appendChild(name);
    button.addEventListener("click", function () {
      var current = findById(record.id);
      if (current) openForm(current);
    });

    var actions = document.createElement("span");
    actions.className = "scanee-actions";
    var waHref = whatsappHref(record.whatsapp);
    var igHref = instagramHref(record.instagram);
    actions.appendChild(makeIcon("wa", waHref, waHref ? "WhatsApp " + record.name : "WhatsApp unavailable"));
    actions.appendChild(makeIcon("ig", igHref, igHref ? "Instagram " + record.name : "Instagram unavailable"));
    actions.addEventListener("click", function (event) {
      event.stopPropagation();
    });

    item.appendChild(button);
    item.appendChild(actions);
    return item;
  }

  function updateMeters() {
    var customers = 0;
    var partners = 0;
    for (var i = 0; i < state.records.length; i++) {
      var status = state.records[i].status || {};
      if (status.customer) customers += 1;
      if (status.builder) partners += 1;
    }
    if (customersCount) customersCount.textContent = customers + " / " + CUSTOMER_GOAL;
    if (partnersCount) partnersCount.textContent = partners + " / " + PARTNER_GOAL;
    if (customersMeter) {
      customersMeter.style.width = Math.min(100, (customers / CUSTOMER_GOAL) * 100) + "%";
    }
    if (partnersMeter) {
      partnersMeter.style.width = Math.min(100, (partners / PARTNER_GOAL) * 100) + "%";
    }
  }

  function updateSortChecks() {
    if (!sortMenu) return;
    var buttons = sortMenu.querySelectorAll("button[data-sort]");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute("aria-checked", buttons[i].getAttribute("data-sort") === state.sort ? "true" : "false");
    }
  }

  function render() {
    var list = sortedRecords();
    var pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if (state.page > pageCount - 1) state.page = pageCount - 1;
    if (state.page < 0) state.page = 0;
    var start = state.page * PAGE_SIZE;
    var slice = list.slice(start, start + PAGE_SIZE);
    listEl.innerHTML = "";
    if (!slice.length) {
      var empty = document.createElement("li");
      empty.className = "scanee-empty";
      empty.textContent = "No scanees yet.";
      listEl.appendChild(empty);
    } else {
      for (var i = 0; i < slice.length; i++) listEl.appendChild(renderCard(slice[i]));
    }
    if (prevBtn) prevBtn.disabled = state.page <= 0;
    if (nextBtn) nextBtn.disabled = state.page >= pageCount - 1 || list.length === 0;
    updateMeters();
    updateSortChecks();
  }

  function pageFor(id) {
    var list = sortedRecords();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return Math.floor(i / PAGE_SIZE);
    }
    return 0;
  }

  function cardButton(id) {
    var cards = listEl.querySelectorAll(".scanee");
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].getAttribute("data-id") === id) return cards[i].querySelector(".scanee-open");
    }
    return null;
  }

  function closeSort(restoreFocus) {
    if (!sortMenu || sortMenu.hidden) return;
    sortMenu.hidden = true;
    sortBtn.setAttribute("aria-expanded", "false");
    if (restoreFocus) sortBtn.focus();
  }

  function openSort() {
    sortMenu.hidden = false;
    sortBtn.setAttribute("aria-expanded", "true");
    var current = sortMenu.querySelector('[aria-checked="true"]');
    if (current) current.focus();
  }

  function setInert(on) {
    var nodes = document.querySelectorAll("body > header, body > nav, body > main, body > footer");
    for (var i = 0; i < nodes.length; i++) {
      if (on) nodes[i].setAttribute("inert", "");
      else nodes[i].removeAttribute("inert");
    }
  }

  function overlayOpen() {
    return overlay.classList.contains("is-open");
  }

  function isShown(el) {
    var node = el;
    while (node && node !== document.body) {
      if (node.hidden) return false;
      var style = window.getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden") return false;
      node = node.parentElement;
    }
    return true;
  }

  function focusable() {
    var nodes = overlay.querySelectorAll("button, a[href], input, select, textarea");
    var out = [];
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.disabled || el.tabIndex < 0) continue;
      if (!isShown(el)) continue;
      out.push(el);
    }
    return out;
  }

  function resetDelete() {
    if (!deleteBtn) return;
    deleteBtn.setAttribute("data-armed", "false");
    deleteBtn.textContent = "Delete record";
    if (deleteNote) deleteNote.hidden = true;
  }

  function setChecks(name, values) {
    var boxes = form.querySelectorAll('input[name="' + name + '"]');
    for (var i = 0; i < boxes.length; i++) {
      boxes[i].checked = !!(values && values[boxes[i].value]);
    }
  }

  function readChecks(name) {
    var boxes = form.querySelectorAll('input[name="' + name + '"]');
    var out = {};
    for (var i = 0; i < boxes.length; i++) out[boxes[i].value] = boxes[i].checked;
    return out;
  }

  function knownProduct(name) {
    for (var i = 0; i < PRODUCTS.length; i++) {
      if (PRODUCTS[i] === name) return true;
    }
    return false;
  }

  function addPurchase(data) {
    if (!purchaseTemplate || !purchasesEl) return;
    var row = purchaseTemplate.content.firstElementChild.cloneNode(true);
    purchasesEl.appendChild(row);
    if (!data) return;
    var select = row.querySelector(".purchase-product");
    var customWrap = row.querySelector(".purchase-custom");
    var customInput = row.querySelector(".purchase-custom-input");
    if (data.name && !knownProduct(data.name)) {
      select.value = "__custom";
      customWrap.hidden = false;
      customInput.value = data.name;
    } else if (select) {
      select.value = data.name || "";
    }
    var qty = row.querySelector(".purchase-qty");
    var date = row.querySelector(".purchase-date");
    if (qty) qty.value = data.quantity || "";
    if (date) date.value = data.date || "";
  }

  function readPurchases() {
    var rows = purchasesEl.querySelectorAll(".purchase");
    var out = [];
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var select = row.querySelector(".purchase-product");
      var customInput = row.querySelector(".purchase-custom-input");
      var qty = row.querySelector(".purchase-qty");
      var date = row.querySelector(".purchase-date");
      var name = "";
      if (select && select.value === "__custom") name = customInput ? customInput.value.trim() : "";
      else if (select) name = select.value.trim();
      var quantity = qty ? qty.value.trim() : "";
      var purchased = date ? date.value : "";
      if (!name && !quantity && !purchased) continue;
      out.push({ name: name, quantity: quantity, date: purchased });
    }
    return out;
  }

  function showNameError() {
    nameError.hidden = false;
    nameInput.setAttribute("aria-invalid", "true");
    nameInput.focus();
  }

  function clearNameError() {
    nameError.hidden = true;
    nameInput.removeAttribute("aria-invalid");
  }

  function openForm(record) {
    closeSort(false);
    form.reset();
    clearNameError();
    purchasesEl.innerHTML = "";
    resetDelete();
    if (record) {
      state.editingId = record.id;
      titleEl.textContent = "Edit prospect";
      nameInput.value = record.name || "";
      scoreInput.value = record.prysmScore || "";
      dateInput.value = record.scanDate || "";
      whatsappInput.value = record.whatsapp || "";
      instagramInput.value = record.instagram || "";
      setChecks("status", record.status);
      setChecks("opportunity", record.opportunity);
      setChecks("health", record.health);
      var purchases = record.purchases || [];
      for (var i = 0; i < purchases.length; i++) addPurchase(purchases[i]);
      deleteWrap.hidden = false;
    } else {
      state.editingId = null;
      titleEl.textContent = "New prospect";
      setChecks("status", blankFlags(form.querySelectorAll('input[name="status"]')));
      setChecks("opportunity", blankFlags(form.querySelectorAll('input[name="opportunity"]')));
      setChecks("health", blankFlags(form.querySelectorAll('input[name="health"]')));
      deleteWrap.hidden = true;
    }
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    setInert(true);
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (scrollEl) scrollEl.scrollTop = 0;
    nameInput.focus();
  }

  function closeForm(focusId) {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    setInert(false);
    document.body.style.overflow = previousOverflow;
    state.editingId = null;
    resetDelete();
    render();
    var next = focusId ? cardButton(focusId) : null;
    if (!next) next = addBtn;
    if (next) next.focus();
  }

  function readForm() {
    return {
      name: nameInput.value.trim(),
      prysmScore: scoreInput.value.trim(),
      scanDate: dateInput.value,
      whatsapp: whatsappInput.value.trim(),
      instagram: instagramInput.value.trim(),
      status: readChecks("status"),
      opportunity: readChecks("opportunity"),
      health: readChecks("health"),
      purchases: readPurchases()
    };
  }

  function saveForm(event) {
    if (event) event.preventDefault();
    var data = readForm();
    if (!data.name) {
      showNameError();
      return;
    }
    var id = state.editingId;
    if (id && findById(id)) {
      data.id = id;
      data.createdAt = findById(id).createdAt;
      for (var i = 0; i < state.records.length; i++) {
        if (state.records[i].id === id) state.records[i] = data;
      }
    } else {
      data.id = uid();
      data.createdAt = nextStamp();
      state.records.push(data);
      id = data.id;
    }
    persist();
    state.page = pageFor(id);
    closeForm(id);
  }

  function deleteCurrent() {
    var id = state.editingId;
    var kept = [];
    for (var i = 0; i < state.records.length; i++) {
      if (state.records[i].id !== id) kept.push(state.records[i]);
    }
    state.records = kept;
    persist();
    closeForm(null);
  }

  if (sortBtn && sortMenu) {
    sortBtn.addEventListener("click", function () {
      if (sortMenu.hidden) openSort();
      else closeSort(false);
    });
    sortMenu.addEventListener("click", function (event) {
      var button = event.target.closest("button[data-sort]");
      if (!button) return;
      state.sort = button.getAttribute("data-sort");
      state.page = 0;
      closeSort(true);
      render();
    });
    sortMenu.addEventListener("keydown", function (event) {
      var buttons = sortMenu.querySelectorAll("button[data-sort]");
      if (!buttons.length) return;
      var index = -1;
      for (var i = 0; i < buttons.length; i++) {
        if (buttons[i] === document.activeElement) index = i;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        buttons[(index + 1) % buttons.length].focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        buttons[(index - 1 + buttons.length) % buttons.length].focus();
      } else if (event.key === "Home") {
        event.preventDefault();
        buttons[0].focus();
      } else if (event.key === "End") {
        event.preventDefault();
        buttons[buttons.length - 1].focus();
      }
    });
  }

  document.addEventListener("click", function (event) {
    if (!sortWrap || !sortMenu || sortMenu.hidden) return;
    if (!sortWrap.contains(event.target)) closeSort(false);
  });

  if (addBtn) {
    addBtn.addEventListener("click", function () {
      openForm(null);
    });
  }
  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      if (state.page <= 0) return;
      state.page -= 1;
      render();
      prevBtn.focus();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      state.page += 1;
      render();
      if (nextBtn.disabled) prevBtn.focus();
      else nextBtn.focus();
    });
  }

  form.addEventListener("submit", saveForm);
  nameInput.addEventListener("input", function () {
    if (!nameError.hidden) clearNameError();
  });
  if (closeBtn) closeBtn.addEventListener("click", function () { closeForm(state.editingId); });
  if (cancelBtn) cancelBtn.addEventListener("click", function () { closeForm(state.editingId); });
  if (addPurchaseBtn) addPurchaseBtn.addEventListener("click", function () { addPurchase(null); });
  if (purchasesEl) {
    purchasesEl.addEventListener("click", function (event) {
      var button = event.target.closest(".purchase-remove");
      if (!button || !purchasesEl.contains(button)) return;
      var row = button.closest(".purchase");
      if (row) row.remove();
    });
    purchasesEl.addEventListener("change", function (event) {
      var select = event.target;
      if (!select.classList || !select.classList.contains("purchase-product")) return;
      var row = select.closest(".purchase");
      if (!row) return;
      var custom = row.querySelector(".purchase-custom");
      if (!custom) return;
      custom.hidden = select.value !== "__custom";
      if (select.value === "__custom") {
        var input = row.querySelector(".purchase-custom-input");
        if (input) input.focus();
      }
    });
  }
  if (deleteBtn) {
    deleteBtn.addEventListener("click", function () {
      if (deleteBtn.getAttribute("data-armed") !== "true") {
        deleteBtn.setAttribute("data-armed", "true");
        deleteBtn.textContent = "Confirm delete";
        if (deleteNote) deleteNote.hidden = false;
        return;
      }
      deleteCurrent();
    });
  }

  document.addEventListener("keydown", function (event) {
    var menuOpen = navPanel && navPanel.classList.contains("is-open");
    if (event.key === "Escape") {
      if (menuOpen) return;
      if (overlayOpen()) {
        event.preventDefault();
        closeForm(state.editingId);
        return;
      }
      if (sortMenu && !sortMenu.hidden) {
        event.preventDefault();
        closeSort(true);
      }
      return;
    }
    if (event.key !== "Tab" || !overlayOpen()) return;
    var items = focusable();
    if (!items.length) {
      event.preventDefault();
      return;
    }
    var first = items[0];
    var last = items[items.length - 1];
    var active = document.activeElement;
    if (event.shiftKey) {
      if (active === first || !overlay.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else if (active === last || !overlay.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  }, true);

  document.addEventListener("focusin", function (event) {
    if (!overlayOpen()) return;
    if (overlay.contains(event.target)) return;
    var items = focusable();
    if (items.length) items[0].focus();
  });

  loadRecords();
  render();
})();
