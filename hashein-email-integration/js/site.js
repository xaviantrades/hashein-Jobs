/*
 * Shared page behaviour: header state, mobile navigation, smooth anchor
 * scrolling, scroll-in reveals and small content hooks.
 * Replaces the React/framer-motion wrappers used by the old build.
 */
(function () {
  "use strict";

  var reduceMotion = typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".menu-toggle");
  var mobileNav = document.getElementById("mobile-navigation");
  var menuOpen = false;
  var hideTimer = null;

  function isAutoHeader() {
    return header && header.getAttribute("data-header") === "auto";
  }

  function syncHeader() {
    if (!header) return;
    var solid = !isAutoHeader() || menuOpen || window.scrollY > 30;
    header.classList.toggle("site-header--solid", solid);
  }

  function setMenu(open, focusToggle) {
    if (!toggle || !mobileNav) return;
    menuOpen = open;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.style.overflow = open ? "hidden" : "";
    if (header) header.classList.toggle("site-header--menu-open", open);

    window.clearTimeout(hideTimer);

    if (open) {
      mobileNav.hidden = false;
      // Force a reflow so the transition starts from the closed state.
      void mobileNav.offsetWidth;
      mobileNav.classList.add("is-open");
    } else {
      mobileNav.classList.remove("is-open");
      hideTimer = window.setTimeout(function () {
        if (!menuOpen) mobileNav.hidden = true;
      }, reduceMotion ? 0 : 250);
    }

    syncHeader();
    if (open && focusToggle) toggle.focus();
  }

  function closeMenu() {
    if (menuOpen) setMenu(false);
  }

  if (toggle) {
    toggle.addEventListener("click", function () {
      setMenu(!menuOpen);
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && menuOpen) {
      setMenu(false, true);
    }
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 1050) closeMenu();
  });

  window.addEventListener("scroll", syncHeader, { passive: true });
  syncHeader();

  /* Anchor links scroll after the mobile menu starts closing, because the
     body scroll lock would otherwise block the jump. */
  document.addEventListener("click", function (event) {
    var link = event.target.closest ? event.target.closest('a[href^="#"]') : null;
    if (!link) return;
    if (link.classList.contains("skip-link")) return;

    var href = link.getAttribute("href");
    if (!href || href === "#") return;

    event.preventDefault();
    var wasMenuOpen = menuOpen;
    closeMenu();

    window.setTimeout(function () {
      var target = href === "#top" ? document.body : document.querySelector(href);
      if (target) {
        target.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start"
        });
      }
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, "", href);
      }
    }, wasMenuOpen ? 60 : 0);
  });

  /* Scroll-in reveals. Content is visible by default; the `.js` class added
     in each page's <head> is what enables the hidden starting state. */
  var revealElements = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  if (revealElements.length) {
    var show = function (element) {
      element.classList.add("is-visible");
    };

    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealElements.forEach(show);
    } else {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          show(entry.target);
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.13 });

      revealElements.forEach(function (element) {
        var delay = parseFloat(element.getAttribute("data-reveal-delay") || "0");
        if (delay > 0) element.style.transitionDelay = delay + "s";
        observer.observe(element);
      });
    }
  }

  /* Footer year. */
  var year = String(new Date().getFullYear());
  Array.prototype.forEach.call(document.querySelectorAll("[data-current-year]"), function (element) {
    element.textContent = year;
  });

  /* Email links stay hidden while src config still holds the placeholder. */
  var data = window.HASHEIN || {};
  Array.prototype.forEach.call(document.querySelectorAll("[data-admin-email]"), function (element) {
    if (!data.hasAdminEmail) return;
    element.setAttribute("href", "mailto:" + data.ADMIN_EMAIL);
    element.hidden = false;
  });
})();
