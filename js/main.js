/* AAA628 — Portfolio interactions
   - flipping hero letters
   - card wheel (auto-spin, drag with inertia, scroll-linked, active label)
   - theme toggle, menu overlay, header state, reveal-on-scroll
   - topographic contour artwork */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var root = document.documentElement;

  /* ---------- Hero: split the word into flipping letters ---------- */
  function buildFlipWord(el) {
    var word = (el.getAttribute("data-word") || "").toUpperCase();
    var frag = document.createDocumentFragment();
    for (var i = 0; i < word.length; i++) {
      var ch = document.createElement("span");
      ch.className = "ch";
      ch.style.setProperty("--i", String(i));
      var f = document.createElement("span");
      f.className = "ch__f";
      f.textContent = word[i];
      var b = document.createElement("span");
      b.className = "ch__b";
      b.textContent = word[i];
      ch.appendChild(f);
      ch.appendChild(b);
      frag.appendChild(ch);
    }
    el.textContent = "";
    el.appendChild(frag);
  }
  document.querySelectorAll(".flip[data-word]").forEach(buildFlipWord);

  /* ---------- Topographic contours for Project 0 ---------- */
  function buildTopo() {
    var g = document.querySelector("#sym-topo .topo-lines");
    if (!g) return;
    var NS = "http://www.w3.org/2000/svg";
    function ring(cx, cy, base, k, seed) {
      var n = 72, d = "";
      for (var j = 0; j < n; j++) {
        var t = (Math.PI * 2 * j) / n;
        var r = base + k * 11 +
          5 * Math.sin(3 * t + seed + k * 0.45) +
          3.2 * Math.sin(5 * t + 1.7 * seed) +
          2.2 * Math.sin(2 * t + k * 0.9);
        var x = cx + r * Math.cos(t) * 1.08;
        var y = cy + r * Math.sin(t) * 0.92;
        d += (j ? "L" : "M") + x.toFixed(1) + "," + y.toFixed(1);
      }
      return d + "Z";
    }
    var k;
    for (k = 0; k < 10; k++) add(ring(66, 96, 5, k, 0.6));
    for (k = 0; k < 8; k++) add(ring(150, 212, 3, k, 2.3));
    function add(d) {
      var p = document.createElementNS(NS, "path");
      p.setAttribute("d", d);
      g.appendChild(p);
    }
  }
  buildTopo();

  /* ---------- Theme toggle ---------- */
  var themeBtn = document.querySelector("[data-theme-toggle]");
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  function syncThemeUI() {
    var dark = root.getAttribute("data-theme") === "dark";
    if (themeBtn) {
      themeBtn.setAttribute("aria-pressed", String(dark));
      themeBtn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
      var t = themeBtn.querySelector(".theme-toggle__text");
      if (t) t.textContent = dark ? "Light" : "Dark";
    }
    if (themeMeta) themeMeta.setAttribute("content", dark ? "#0c0d0e" : "#e3e3e1");
  }
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("aaa628-theme", next); } catch (e) {}
      syncThemeUI();
    });
  }
  syncThemeUI();

  /* ---------- Menu overlay ---------- */
  var menu = document.getElementById("menu");
  var menuBtn = document.querySelector("[data-menu-toggle]");
  function setMenu(open) {
    if (!menu || !menuBtn) return;
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.querySelector(".label").textContent = open ? "Close" : "Menu";
    document.body.style.overflow = open ? "hidden" : "";
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(function () {
        menu.classList.add("is-open");
        var first = menu.querySelector("a");
        if (first) first.focus();
      });
    } else {
      menu.classList.remove("is-open");
      menu.hidden = true;
    }
  }
  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      setMenu(menuBtn.getAttribute("aria-expanded") !== "true");
    });
  }
  if (menu) {
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && menuBtn && menuBtn.getAttribute("aria-expanded") === "true") {
      setMenu(false);
      menuBtn.focus();
    }
  });

  /* ---------- Header background after scrolling ---------- */
  var header = document.getElementById("header");
  function onScrollHeader() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 24);
  }
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Card wheel ---------- */
  var stage = document.querySelector("[data-wheel]");
  var spin = document.querySelector("[data-wheel-spin]");
  var labelEl = document.querySelector("[data-wheel-label]");
  if (stage && spin) {
    var cards = Array.prototype.slice.call(spin.querySelectorAll(".card"));
    var N = cards.length;
    var STEP = 360 / N;
    var AUTO = 5; // degrees per second
    var ME_INDEX = 2; // start with the "Me" card at the top

    var rot = -ME_INDEX * STEP;
    var vel = 0; // degrees per frame (inertia after a drag)
    var dragging = false;
    var hovering = false;
    var visible = true;
    var moved = 0;
    var lastX = 0;
    var lastT = 0;
    var lastScroll = window.scrollY;
    var activeIndex = -1;
    var rafId = 0;
    var prevFrame = 0;

    function radiusPx() {
      // --R is calc(var(--cw) * 2.3); read the rendered card width
      var cw = cards[0].offsetWidth || 200;
      return cw * 2.3;
    }

    function render() {
      spin.style.transform = "rotate(" + rot.toFixed(3) + "deg)";
      var idx = Math.round(((-rot % 360) + 360) % 360 / STEP) % N;
      if (idx !== activeIndex) {
        activeIndex = idx;
        if (labelEl) labelEl.textContent = cards[idx].getAttribute("data-label") || "";
        cards.forEach(function (c, i) { c.classList.toggle("is-active", i === idx); });
      }
    }

    function frame(now) {
      var dt = prevFrame ? Math.min((now - prevFrame) / 1000, 0.05) : 0;
      prevFrame = now;
      if (!dragging) {
        if (Math.abs(vel) > 0.01) {
          rot += vel;
          vel *= 0.94;
        } else {
          vel = 0;
          if (!hovering && !reduceMotion.matches) rot -= AUTO * dt;
        }
      }
      render();
      rafId = visible ? requestAnimationFrame(frame) : 0;
    }

    function start() {
      if (!rafId) {
        prevFrame = 0;
        rafId = requestAnimationFrame(frame);
      }
    }

    // Only animate while the wheel is on screen
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start();
      }).observe(stage);
    }

    // Scrolling the page turns the wheel a little
    window.addEventListener("scroll", function () {
      var y = window.scrollY;
      if (!reduceMotion.matches) rot -= (y - lastScroll) * 0.06;
      lastScroll = y;
      if (!rafId) render();
    }, { passive: true });

    // Drag to spin
    stage.addEventListener("pointerdown", function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      dragging = true;
      moved = 0;
      vel = 0;
      lastX = e.clientX;
      lastT = performance.now();
      stage.classList.add("is-dragging");
    });
    window.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX;
      lastX = e.clientX;
      moved += Math.abs(dx);
      if (moved > 6 && !stage.hasPointerCapture(e.pointerId)) {
        try { stage.setPointerCapture(e.pointerId); } catch (err) {}
      }
      var deg = (dx / radiusPx()) * (180 / Math.PI);
      rot += deg;
      var now = performance.now();
      var dtMs = Math.max(now - lastT, 1);
      vel = deg * (16.7 / dtMs);
      lastT = now;
      if (!rafId) render();
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove("is-dragging");
      if (performance.now() - lastT > 80) vel = 0;
      vel = Math.max(-6, Math.min(6, vel));
    }
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);

    // A drag should not count as a click on a card
    stage.addEventListener("click", function (e) {
      if (moved > 6) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
    stage.addEventListener("dragstart", function (e) { e.preventDefault(); });

    cards.forEach(function (c) {
      c.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") hovering = true; });
      c.addEventListener("pointerleave", function () { hovering = false; });
      // Keyboard focus: bring the focused card to the top
      c.addEventListener("focus", function () {
        var i = cards.indexOf(c);
        var target = -i * STEP;
        var delta = ((target - rot) % 360 + 540) % 360 - 180;
        rot += delta;
        render();
      });
    });

    render();
    start();
  }
})();
