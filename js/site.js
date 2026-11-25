// The page's behaviour. Everything here is an enhancement: the content and
// every link work without it.

(function () {
  "use strict";

  var $ = function (sel, root) {
    return (root || document).querySelector(sel);
  };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };
  var root = document.documentElement;
  var KEY = "mukesh-devs.site.theme";

  /* ----------------------------------------------------------- theme */
  function theme() {
    var button = $("[data-theme-toggle]");
    if (!button) return;
    var label = function () {
      button.setAttribute(
        "aria-label",
        root.dataset.theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
      );
    };
    label();
    button.addEventListener("click", function () {
      root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(KEY, root.dataset.theme);
      } catch (e) {
        // Remembered for this visit only.
      }
      label();
    });
    // Follow the system while the visitor hasn't chosen.
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
      var chosen = null;
      try {
        chosen = localStorage.getItem(KEY);
      } catch (err) {}
      if (chosen) return;
      root.dataset.theme = e.matches ? "dark" : "light";
      label();
    });
  }

  /* -------------------------------------------- the header's progress */
  function progress() {
    var bar = $("[data-progress]");
    if (!bar) return;
    var queued = false;
    var update = function () {
      queued = false;
      var max = root.scrollHeight - innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
      bar.style.setProperty("--p", p.toFixed(4));
    };
    var onScroll = function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    update();
  }

  /* ---------------------------------------------------------- reveals */
  function reveals() {
    var items = $$(".rise");
    var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("is-in");
      });
      return;
    }
    // Siblings that arrive together come in one after another.
    items.forEach(function (el) {
      var group = $$(":scope > .rise", el.parentElement);
      var i = group.indexOf(el);
      if (i > 0) el.style.setProperty("--d", Math.min(i, 5) * 90 + "ms");
    });
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    items.forEach(function (el) {
      io.observe(el);
    });
  }

  theme();
  progress();
  reveals();
})();
