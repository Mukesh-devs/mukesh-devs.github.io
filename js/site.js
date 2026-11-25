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
  var reduced = function () {
    return matchMedia("(prefers-reduced-motion: reduce)").matches;
  };
  var root = document.documentElement;

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
        localStorage.setItem("mukesh-devs.site.theme", root.dataset.theme);
      } catch (e) {
        // Remembered for this visit only.
      }
      label();
    });
    // Follow the system while the visitor hasn't chosen.
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
      var chosen = null;
      try {
        chosen = localStorage.getItem("mukesh-devs.site.theme");
      } catch (err) {}
      if (chosen) return;
      root.dataset.theme = e.matches ? "dark" : "light";
      label();
    });
  }

  /* ------------------------------------------------------------- nav */
  function nav() {
    var menu = $("[data-menu]");
    var toggle = $("[data-menu-toggle]");
    var close = function () {
      if (!menu) return;
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    };
    if (menu && toggle) {
      toggle.addEventListener("click", function () {
        var open = !menu.classList.contains("is-open");
        menu.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
      });
      menu.addEventListener("click", function (e) {
        if (e.target.closest("a")) close();
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") close();
      });
      document.addEventListener("click", function (e) {
        if (!e.target.closest(".nav__bar")) close();
      });
    }

    // The section in view lights up in the menu.
    var links = $$('.nav__links a[href^="#"]');
    var sections = $$("main > section[id]");
    if (!("IntersectionObserver" in window) || !sections.length) return;
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.id;
          links.forEach(function (a) {
            a.classList.toggle("is-on", a.getAttribute("href") === "#" + id);
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach(function (s) {
      io.observe(s);
    });
    // Above the first section, nothing is lit.
    var hero = $(".hero");
    if (hero) {
      new IntersectionObserver(
        function (entries) {
          if (entries[0].isIntersecting && entries[0].intersectionRatio > 0.5)
            links.forEach(function (a) {
              a.classList.remove("is-on");
            });
        },
        { threshold: [0.5] },
      ).observe(hero);
    }
  }

  /* -------------------------------------------- the header's progress */
  function progress() {
    var bar = $("[data-progress]");
    if (!bar) return;
    var queued = false;
    var update = function () {
      queued = false;
      var max = document.documentElement.scrollHeight - innerHeight;
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
    if (reduced() || !("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("is-in");
      });
      return;
    }
    // Siblings that arrive together come in one after another.
    items.forEach(function (el) {
      var parent = el.parentElement;
      var group = $$(":scope > .rise", parent);
      var i = group.indexOf(el);
      if (i > 0) el.style.setProperty("--d", Math.min(i, 5) * 80 + "ms");
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

  /* --------------------------------------------- the terminal, typing */
  function terminal() {
    var term = $("[data-term]");
    if (!term || reduced()) return;
    var lines = $$(".term__line", term);
    lines.forEach(function (line) {
      line.classList.add("is-waiting");
    });

    var wait = function (ms) {
      return new Promise(function (resolve) {
        setTimeout(resolve, ms);
      });
    };
    var type = function (el) {
      var text = el.textContent;
      el.textContent = "";
      var i = 0;
      return new Promise(function (resolve) {
        var step = function () {
          i += 1;
          el.textContent = text.slice(0, i);
          if (i >= text.length) return resolve();
          setTimeout(step, 45 + Math.random() * 55);
        };
        step();
      });
    };

    var run = function () {
      var chain = wait(250);
      lines.forEach(function (line) {
        chain = chain.then(function () {
          line.classList.remove("is-waiting");
          var cmd = line.hasAttribute("data-cmd") ? $(".term__c", line) : null;
          if (!cmd) return wait(110);
          return wait(380)
            .then(function () {
              return type(cmd);
            })
            .then(function () {
              return wait(260);
            });
        });
      });
    };

    // Start once the terminal is on screen.
    if (!("IntersectionObserver" in window)) return run();
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      run();
    });
    io.observe(term);
  }

  /* --------------------------------------------- copy the email address */
  function copy() {
    var button = $("[data-copy]");
    if (!button || !navigator.clipboard) return;
    var label = $("[data-copy-label]", button);
    button.hidden = false;
    var timer = 0;
    button.addEventListener("click", function () {
      navigator.clipboard.writeText(button.dataset.copy).then(
        function () {
          button.classList.add("is-done");
          label.textContent = "Copied";
          clearTimeout(timer);
          timer = setTimeout(function () {
            button.classList.remove("is-done");
            label.textContent = "Copy address";
          }, 2000);
        },
        function () {
          label.textContent = "Couldn't copy";
        },
      );
    });
  }

  theme();
  nav();
  progress();
  reveals();
  terminal();
  copy();
})();
