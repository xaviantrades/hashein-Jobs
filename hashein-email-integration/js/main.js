/*
 * Homepage behaviour: opportunity browser, destination shortcuts and FAQ.
 * Content comes from js/data.js; everything else lives in index.html.
 */
(function () {
  "use strict";

  var data = window.HASHEIN;
  if (!data) return;

  var signupPage = "signup.html";

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function arrowUpRight(size, strokeWidth) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' +
      (strokeWidth || 2) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>';
  }

  function arrowRight(size) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';
  }

  function signupUrl(params) {
    var query = new URLSearchParams(params || {}).toString();
    return query ? signupPage + "?" + query : signupPage;
  }

  /* ---------- Opportunity browser ---------- */
  var tabsContainer = document.getElementById("category-tabs");
  var panel = document.getElementById("roles-panel");
  var content = document.getElementById("roles-content");
  var activeIndex = 0;

  function activeCategory() {
    return data.categories[activeIndex];
  }

  function renderTabs() {
    if (!tabsContainer) return;
    tabsContainer.innerHTML = data.categories.map(function (category, index) {
      var selected = index === activeIndex;
      return '<button id="category-tab-' + category.id + '" type="button" class="category-tab' +
        (selected ? " category-tab--active" : "") + '" role="tab" aria-selected="' + selected +
        '" aria-controls="category-panel" tabindex="' + (selected ? "0" : "-1") + '" data-index="' + index + '">' +
        '<span class="category-number">0' + (index + 1) + '</span>' +
        '<span class="category-text"><span class="category-title">' + escapeHtml(category.name) +
        '</span><span class="category-description">' + escapeHtml(category.description) + '</span></span>' +
        arrowUpRight(19, 1.8) + '</button>';
    }).join("");
  }

  function renderRoles() {
    if (!panel || !content) return;
    var category = activeCategory();

    content.innerHTML =
      '<span class="roles-eyebrow">EXPLORE THIS FIELD</span>' +
      '<h3 class="roles-heading">' + escapeHtml(category.name) + '<span>.</span></h3>' +
      '<p class="roles-description">Select a role to pre-fill your application.</p>' +
      '<div class="roles-grid">' +
      category.roles.map(function (role) {
        return '<button class="role-button" type="button" data-role="' + escapeHtml(role) + '"><span>' +
          escapeHtml(role) + '</span>' + arrowUpRight(18, 1.7) + '</button>';
      }).join("") +
      '</div>' +
      '<p class="roles-footnote">Don\'t see your role? <button type="button" data-other-role>Tell us what you do ' +
      arrowRight(15) + '</button></p>';

    panel.setAttribute("aria-labelledby", "category-tab-" + category.id);
  }

  function selectCategory(index, moveFocus) {
    if (!data.categories[index]) return;
    activeIndex = index;

    Array.prototype.forEach.call(tabsContainer.querySelectorAll("[role='tab']"), function (tab, tabIndex) {
      var selected = tabIndex === index;
      tab.classList.toggle("category-tab--active", selected);
      tab.setAttribute("aria-selected", selected ? "true" : "false");
      tab.setAttribute("tabindex", selected ? "0" : "-1");
      if (selected && moveFocus) tab.focus();
    });

    // Re-run the panel entrance animation the way AnimatePresence did.
    content.classList.remove("is-entering");
    void content.offsetWidth;
    renderRoles();
    content.classList.add("is-entering");
  }

  if (tabsContainer && panel && content) {
    renderTabs();
    renderRoles();

    tabsContainer.addEventListener("click", function (event) {
      var tab = event.target.closest("[role='tab']");
      if (!tab) return;
      selectCategory(Number(tab.getAttribute("data-index")), false);
    });

    tabsContainer.addEventListener("keydown", function (event) {
      var tab = event.target.closest("[role='tab']");
      if (!tab) return;

      var count = data.categories.length;
      var index = Number(tab.getAttribute("data-index"));
      var next = null;

      if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (index + 1) % count;
      else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (index - 1 + count) % count;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = count - 1;
      else return;

      event.preventDefault();
      selectCategory(next, true);
    });

    content.addEventListener("click", function (event) {
      var roleButton = event.target.closest("[data-role]");
      if (roleButton) {
        window.location.href = signupUrl({
          category: activeCategory().name,
          role: roleButton.getAttribute("data-role")
        });
        return;
      }

      if (event.target.closest("[data-other-role]")) {
        window.location.href = signupUrl({
          category: "Specialist & other roles",
          role: data.OTHER_ROLE
        });
      }
    });
  }

  /* ---------- Destination shortcuts ---------- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-destination]"), function (button) {
    button.addEventListener("click", function () {
      window.location.href = signupUrl({ destination: button.getAttribute("data-destination") });
    });
  });

  /* ---------- FAQ accordion ---------- */
  Array.prototype.forEach.call(document.querySelectorAll(".faq-item"), function (item) {
    var question = item.querySelector(".faq-question");
    if (!question) return;

    question.addEventListener("click", function () {
      var isOpen = item.classList.contains("is-open");

      Array.prototype.forEach.call(document.querySelectorAll(".faq-item"), function (other) {
        other.classList.remove("is-open");
        var otherQuestion = other.querySelector(".faq-question");
        if (otherQuestion) otherQuestion.setAttribute("aria-expanded", "false");
        var plus = other.querySelector(".faq-plus");
        if (plus) plus.classList.remove("faq-plus--open");
      });

      if (isOpen) return;

      item.classList.add("is-open");
      question.setAttribute("aria-expanded", "true");
      var icon = question.querySelector(".faq-plus");
      if (icon) icon.classList.add("faq-plus--open");
    });
  });
})();
