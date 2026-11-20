/* aaa628 — Portfolio interactions
   - first-visit logo intro (pixel bloom)
   - flipping hero letters
   - card wheel (auto-spin, drag with inertia, active label)
   - pop-ups (cards, index and menu links open a dialog instead of scrolling)
   - theme toggle, menu overlay, header state
   - topographic contour artwork */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var root = document.documentElement;

  /* ---------- First-visit intro: the logo and name bloom out of a pixel grid ---------- */
  var intro = document.querySelector("[data-intro]");
  function runIntro() {
    if (!intro) return;
    var canvas = intro.querySelector("canvas");
    var countEl = intro.querySelector("[data-intro-count]");
    var skipBtn = intro.querySelector("[data-intro-skip]");
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var vw = window.innerWidth, vh = window.innerHeight;
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);

    var CREAM = "#efece2";
    var PALETTE = ["#e04a36", "#f2a93b", "#2f5fe0", "#efece2", "#e04a36", "#f6d27a"];
    var FISH = new Path2D("M13 24 Q27 8 44 24 Q27 40 13 24 Z M13 24 L3 13.5 L3 34.5 Z");
    var GILL = new Path2D("M24 15.5 Q20.5 24 24 32.5");
    var WORD = "aaa628";

    // ---- layout: [fish][gap][aaa628], centred, at most 82% of the width
    var measure = document.createElement("canvas").getContext("2d");
    function setFont(c, size) {
      c.font = "900 " + size + "px Archivo, Arial Black, sans-serif";
      if ("fontStretch" in c) c.fontStretch = "expanded";
    }
    setFont(measure, 100);
    var m = measure.measureText(WORD);
    var textW100 = m.width;
    var asc100 = m.actualBoundingBoxAscent || 72, desc100 = m.actualBoundingBoxDescent || 2;
    var fishW100 = 100 * 0.9 * (41 / 32), gap100 = 100 * 0.2;
    var F = Math.min((vw * 0.82) / ((fishW100 + gap100 + textW100) / 100), vh * 0.3, 240);
    var fishH = F * 0.9, fishW = fishH * (41 / 32), gap = F * 0.2;
    var textW = textW100 * F / 100, asc = asc100 * F / 100, desc = desc100 * F / 100;
    var totalW = fishW + gap + textW;
    var x0 = (vw - totalW) / 2, cy = vh / 2;
    var baseline = cy + (asc - desc) / 2;

    function drawMark(c, ox, oy) {
      // fish (with eye and gill cut out), then the name
      c.save();
      c.translate(x0 - ox, cy - fishH / 2 - oy);
      c.scale(fishH / 32, fishH / 32);
      c.translate(-3, -8);
      c.lineJoin = "round"; c.lineWidth = 1.6;
      c.fill(FISH); c.stroke(FISH);
      c.globalCompositeOperation = "destination-out";
      c.beginPath(); c.arc(35, 21.5, 3, 0, Math.PI * 2); c.fill();
      c.lineWidth = 2.4; c.lineCap = "round"; c.stroke(GILL);
      c.restore();
      setFont(c, F);
      c.textBaseline = "alphabetic";
      c.fillText(WORD, x0 + fishW + gap - ox, baseline - oy);
    }

    // ---- rasterise the mark into a grid of cells
    var cs = Math.max(6, Math.round(F / 15));          // cell size (CSS px)
    var halo = cs * 9;                                 // how far the scattered squares reach
    var bx = Math.floor(x0 - halo), by = Math.floor(cy - fishH / 2 - halo);
    var bw = Math.ceil(totalW + halo * 2), bh = Math.ceil(fishH + halo * 2);
    var mask = document.createElement("canvas"); mask.width = bw; mask.height = bh;
    var mc = mask.getContext("2d"); mc.fillStyle = mc.strokeStyle = "#000";
    drawMark(mc, bx, by);
    var blur = document.createElement("canvas"); blur.width = bw; blur.height = bh;
    var bc = blur.getContext("2d"); bc.filter = "blur(" + Math.round(cs * 2.6) + "px)"; bc.drawImage(mask, 0, 0);
    var md = mc.getImageData(0, 0, bw, bh).data, bd = bc.getImageData(0, 0, bw, bh).data;
    function alphaAt(d, x, y) {
      x = Math.max(0, Math.min(bw - 1, x | 0)); y = Math.max(0, Math.min(bh - 1, y | 0));
      return d[(y * bw + x) * 4 + 3] / 255;
    }

    var originX = x0 + fishW * 0.45, originY = cy;     // the bloom starts in the fish
    var maxD = Math.hypot(totalW + halo, fishH / 2 + halo);
    var cells = [];
    for (var gy = 0; gy * cs < bh; gy++) {
      for (var gx = 0; gx * cs < bw; gx++) {
        var lx = gx * cs, ly = gy * cs, cov = 0;
        for (var sy = 0; sy < 3; sy++) for (var sx = 0; sx < 3; sx++) cov += alphaAt(md, lx + (sx + 0.5) * cs / 3, ly + (sy + 0.5) * cs / 3);
        cov /= 9;
        var h = alphaAt(bd, lx + cs / 2, ly + cs / 2);
        var kind = cov >= 0.5 ? 0 : cov >= 0.08 ? 1 : (h > 0.035 && Math.random() < h * 2 ? 2 : -1);
        if (kind < 0) continue;
        var px = bx + lx, py = by + ly;
        var d = Math.hypot(px + cs / 2 - originX, py + cs / 2 - originY) / maxD;
        var size = kind === 0 ? cs - 1.5 : kind === 1 ? cs * (0.5 + cov * 0.6) : cs * (0.22 + h * 0.6) * (0.6 + Math.random() * 0.4);
        cells.push({
          x: px, y: py, kind: kind, size: Math.min(size, cs - 1.5),
          delay: 0.25 + d * 1.05 + Math.random() * 0.3,
          color: PALETTE[(Math.random() * PALETTE.length) | 0],
          outline: kind !== 0 && Math.random() < 0.35,
          seed: Math.random() * 10
        });
      }
    }

    // ---- timeline (seconds)
    var T_RESOLVE = 2.15, T_CLEAN = 2.7, T_EXIT = 3.25, T_END = 4.15;
    var start = performance.now(), raf = 0, done = false, exiting = false;
    var ease = function (t) { return 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3); };

    function frame(now) {
      var t = (now - start) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, vw, vh);

      var fadeOut = ease((t - T_RESOLVE) / 0.5);           // edge + scattered squares leave
      var crisp = ease((t - (T_RESOLVE + 0.1)) / 0.4);      // the clean mark arrives on top...
      var gridOut = ease((t - (T_RESOLVE + 0.5)) / 0.3);    // ...then the grid under it goes
      for (var i = 0; i < cells.length; i++) {
        var c = cells[i], lt = t - c.delay;
        if (lt <= 0) continue;
        var grow = ease(lt / 0.22);
        var alpha = c.kind === 0 ? 1 - gridOut : 1 - fadeOut;
        if (alpha <= 0.01) continue;
        var flicker = lt < 0.45 || c.kind !== 0;
        var col = flicker ? PALETTE[((c.seed + Math.floor(t * 14)) | 0) % PALETTE.length] : CREAM;
        if (c.kind !== 0 && lt > 0.6) col = c.color;
        var sz = c.size * grow, off = (cs - sz) / 2;
        ctx.globalAlpha = alpha;
        if (c.outline && lt > 0.3) {
          ctx.strokeStyle = col; ctx.lineWidth = 1;
          ctx.strokeRect(c.x + off + 0.5, c.y + off + 0.5, sz - 1, sz - 1);
        } else {
          ctx.fillStyle = col;
          ctx.fillRect(c.x + off, c.y + off, sz, sz);
        }
      }
      if (crisp > 0) {
        ctx.globalAlpha = crisp;
        ctx.fillStyle = ctx.strokeStyle = CREAM;
        drawMark(ctx, 0, 0);
      }
      ctx.globalAlpha = 1;
      if (countEl) countEl.textContent = String(Math.round(628 * ease(t / T_CLEAN))).padStart(3, "0");

      if (t >= T_EXIT && !exiting) leave();
      if (t < T_END && !done) raf = requestAnimationFrame(frame);
    }

    function leave() {
      if (exiting) return;
      exiting = true;
      root.classList.remove("intro-pending");          // the hero starts its own entrance now
      intro.classList.add("is-leaving");
      setTimeout(finish, 950);
    }
    function finish() {
      done = true;
      cancelAnimationFrame(raf);
      intro.classList.remove("is-playing", "is-leaving");
      root.classList.remove("intro-pending");
      try { localStorage.setItem("aaa628-intro", "seen"); } catch (e) {}
      document.removeEventListener("keydown", onKey);
    }
    function skip() {
      // jump straight to the clean mark, then lift
      start = performance.now() - T_CLEAN * 1000;
      leave();
    }
    function onKey(e) { if (e.key === "Escape" || e.key === "Enter" || e.key === " ") skip(); }
    if (skipBtn) skipBtn.onclick = skip;
    document.addEventListener("keydown", onKey);

    intro.classList.add("is-playing");
    raf = requestAnimationFrame(frame);
  }

  function startIntro() {
    // wait for the (embedded) display font so the name is drawn in Archivo
    var go = function () { runIntro(); };
    if (document.fonts && document.fonts.load) {
      Promise.race([
        document.fonts.load('900 100px "Archivo"'),
        new Promise(function (r) { setTimeout(r, 800); })
      ]).then(go, go);
    } else {
      go();
    }
  }
  if (root.classList.contains("intro-pending")) startIntro();
  document.querySelectorAll("[data-replay-intro]").forEach(function (b) {
    b.addEventListener("click", function () {
      root.classList.add("intro-pending");
      startIntro();
    });
  });

  /* ---------- Hero: split the word into flipping letters ---------- */
  function buildFlipWord(el) {
    var word = (el.getAttribute("data-word") || "").toUpperCase();
    var frag = document.createDocumentFragment();
    for (var i = 0; i < word.length; i++) {
      var ch = document.createElement("span");
      ch.className = "ch is-intro";
      ch.addEventListener("animationend", function (e) {
        if (e.animationName === "letter-in") e.currentTarget.classList.remove("is-intro");
      });
      ch.style.setProperty("--i", String(i));
      var inner = document.createElement("span");
      inner.className = "ch__in";
      var f = document.createElement("span");
      f.className = "ch__f";
      f.textContent = word[i];
      var b = document.createElement("span");
      b.className = "ch__b";
      b.textContent = word[i];
      inner.appendChild(f);
      inner.appendChild(b);
      ch.appendChild(inner);
      frag.appendChild(ch);
    }
    el.textContent = "";
    el.appendChild(frag);
  }
  document.querySelectorAll(".flip[data-word]").forEach(buildFlipWord);

  // Hovering the title flips the letter under the pointer and its echo
  var heroTitle = document.querySelector(".hero__title");
  if (heroTitle && !reduceMotion.matches) {
    var mains = heroTitle.querySelectorAll(".flip--main .ch");
    var echoes = heroTitle.querySelectorAll(".flip--echo .ch");
    var poke = function (el) {
      if (!el || el.classList.contains("is-poked")) return;
      el.classList.remove("is-intro");
      el.classList.add("is-poked");
      el.addEventListener("animationend", function done(e) {
        if (e.target !== el) return;
        el.classList.remove("is-poked");
        el.removeEventListener("animationend", done);
      });
    };
    mains.forEach(function (el, i) {
      el.addEventListener("pointerenter", function () {
        poke(el);
        setTimeout(function () { poke(echoes[i]); }, 90);
      });
    });
  }

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

  /* ---------- Pop-ups ---------- */
  // Links with data-open="name" open <dialog id="m-name">.
  // (A data attribute, not the href: some previewers, e.g. htmlpreview.github.io,
  // rewrite "#name" links into full URLs.)
  var openDialog = null;
  function dialogFor(name) {
    name = (name || "").replace(/^#/, "");
    if (!name) return null;
    var d = document.getElementById("m-" + name);
    return d && d.tagName === "DIALOG" ? d : null;
  }
  function clearHash() {
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
  }
  function openModal(d) {
    if (openDialog && openDialog !== d) closeModal(openDialog, true);
    clearTimeout(d._closeTimer);
    d.classList.remove("is-closing");
    if (!d.open) {
      d.showModal();
      var panel = d.querySelector(".modal__panel");
      if (panel) panel.scrollTop = 0;
    }
    openDialog = d;
  }
  function closeModal(d, instant) {
    if (!d || !d.open) return;
    if (openDialog === d) openDialog = null;
    if (instant || reduceMotion.matches) {
      d.classList.remove("is-closing");
      d.close();
    } else {
      d.classList.add("is-closing");
      d._closeTimer = setTimeout(function () {
        d.classList.remove("is-closing");
        d.close();
      }, 220);
    }
  }

  document.addEventListener("click", function (e) {
    var link = e.target.closest("[data-open]");
    if (link) {
      var d = dialogFor(link.getAttribute("data-open"));
      if (d) {
        e.preventDefault();
        openModal(d);
        return;
      }
    }
    var closer = e.target.closest("[data-close]");
    if (closer) {
      closeModal(closer.closest("dialog"));
      return;
    }
    // Clicking the dimmed area outside the panel closes the pop-up
    if (e.target.tagName === "DIALOG" && e.target.classList.contains("modal")) closeModal(e.target);
  });

  document.querySelectorAll("dialog.modal").forEach(function (d) {
    d.addEventListener("cancel", function (e) { // Escape key
      e.preventDefault();
      closeModal(d);
    });
  });

  // Pop-ups never change the URL, and a leftover "#about"-style hash is
  // removed on load so a reload always starts on the plain page.
  if (dialogFor(location.hash)) clearHash();

  /* ---------- Footer world: builds itself as it scrolls into view ---------- */
  var footer = document.querySelector("[data-footer]");
  var scene = document.querySelector("[data-footer-scene]");
  if (footer && scene) {
    var sceneSvg = scene.querySelector("svg");
    var ticking = false;
    var setProgress = function () {
      ticking = false;
      if (reduceMotion.matches) { footer.style.setProperty("--p", "1"); return; }
      var r = scene.getBoundingClientRect();
      var p = (window.innerHeight - r.top) / (r.height * 0.9);
      p = Math.max(0, Math.min(1, p));
      footer.style.setProperty("--p", p.toFixed(3));
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(setProgress); }
    }, { passive: true });
    window.addEventListener("resize", setProgress);
    setProgress();

    // Ambient motion (walker, beacons, satellite) only while the footer is on screen
    var setLive = function (live) {
      footer.classList.toggle("is-live", live && !reduceMotion.matches);
      if (sceneSvg && sceneSvg.pauseAnimations) {
        if (live && !reduceMotion.matches) sceneSvg.unpauseAnimations();
        else sceneSvg.pauseAnimations();
      }
    };
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) { setLive(entries[0].isIntersecting); }).observe(footer);
    } else {
      setLive(true);
    }
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
    var ME_INDEX = 1; // start with the "Me" card at the top

    var rot = -ME_INDEX * STEP;
    var vel = 0; // degrees per frame (inertia after a drag)
    var dragging = false;
    var visible = true;
    var moved = 0;
    var lastX = 0;
    var lastT = 0;
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
          if (!reduceMotion.matches) rot -= AUTO * dt;
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

    // Press, drag or tap.
    // The card is chosen at the moment of the press. On release it opens,
    // unless the pointer travelled far enough to count as a drag. This works
    // even though the wheel keeps turning under the pointer during the click.
    var DRAG_PX = 10;
    var downX = 0, downY = 0, downCard = null, lastPointerDown = 0;
    var swallowClick = false;

    stage.addEventListener("pointerdown", function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      dragging = true;
      moved = 0;
      vel = 0;
      lastX = downX = e.clientX;
      downY = e.clientY;
      lastT = lastPointerDown = performance.now();
      downCard = e.target.closest ? e.target.closest(".card") : null;
      stage.classList.add("is-dragging");
    });
    // Stop the mouse from focusing (and text-selecting) on press
    stage.addEventListener("mousedown", function (e) { e.preventDefault(); });

    window.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX;
      lastX = e.clientX;
      moved = Math.max(moved, Math.abs(e.clientX - downX), Math.abs(e.clientY - downY));
      if (moved < DRAG_PX) return; // small wobble during a click: ignore
      if (!stage.hasPointerCapture(e.pointerId)) {
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

    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove("is-dragging");
      var wasDrag = moved >= DRAG_PX;
      if (wasDrag) {
        if (performance.now() - lastT > 80) vel = 0;
        vel = Math.max(-6, Math.min(6, vel));
      } else {
        vel = 0;
      }
      // The browser's own click may or may not follow (the card has moved);
      // either way we handle it here and swallow that click.
      swallowClick = true;
      setTimeout(function () { swallowClick = false; }, 400);
      if (e.type === "pointerup" && !wasDrag && downCard) {
        var d = dialogFor(downCard.getAttribute("data-open"));
        if (d) openModal(d);
      }
      downCard = null;
    }
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);

    // Swallow the native click that follows a pointer press on the wheel.
    // Keyboard "clicks" (Enter on a focused card) are not swallowed.
    window.addEventListener("click", function (e) {
      if (!swallowClick) return;
      swallowClick = false;
      e.preventDefault();
      e.stopPropagation();
    }, true);
    stage.addEventListener("dragstart", function (e) { e.preventDefault(); });

    cards.forEach(function (c) {
      // Keyboard focus (Tab) brings the focused card to the top.
      // Focus caused by a pointer press must not move the wheel.
      c.addEventListener("focus", function () {
        if (performance.now() - lastPointerDown < 600) return;
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
