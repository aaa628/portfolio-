/* aaa628 — Portfolio interactions
   - logo intro on every page load (pixel bloom)
   - flipping hero letters
   - card wheel (auto-spin, drag with inertia, active label)
   - pop-ups (cards, index and menu links open a dialog instead of scrolling)
   - theme toggle, menu overlay, header state
   - topographic contour artwork */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var root = document.documentElement;

  /* ---------- Footer world: extra animation details, then a copy at the bottom of the menu ----------
     Done before anything else binds, so the copy's Discord/copy/replay buttons are wired like the original. */
  (function () {
    var menuEl = document.getElementById("menu");
    var src = document.querySelector("[data-footer]");
    if (!src) return;
    var NS = "http://www.w3.org/2000/svg";
    // Extra life for the footer world (applies to the page footer and to its copy in the menu)
    // wordmark letters rise one by one
    var word = src.querySelector(".footer__word");
    if (word) {
      var t = word.textContent; word.textContent = "";
      t.split("").forEach(function (ch, i) {
        var sp = document.createElement("span"); sp.textContent = ch; sp.style.setProperty("--i", i); word.appendChild(sp);
      });
    }
    var svg = src.querySelector("svg.footer__svg");
    var world = svg && svg.querySelector("g[clip-path]");
    // rocket: exhaust flame under the body
    var rocket = svg && svg.querySelector(".sc-rocket");
    if (rocket) {
      var flame = document.createElementNS(NS, "path");
      flame.setAttribute("class", "sc-flame");
      flame.setAttribute("d", "M745 366 Q757 412 769 366 Q763 380 757 368 Q751 380 745 366 Z");
      rocket.insertBefore(flame, rocket.firstChild);
    }
    // smoke on the pad, stars in the sky
    if (world) {
      var smoke = document.createElementNS(NS, "g");
      smoke.setAttribute("class", "sc-smoke");
      [[-34, 0], [-18, 6], [0, 10], [18, 6], [34, 0], [-50, -4], [50, -4]].forEach(function (o, i) {
        var c = document.createElementNS(NS, "circle");
        c.setAttribute("cx", 757 + o[0]); c.setAttribute("cy", 368 + o[1] * -1); c.setAttribute("r", 9 + (i % 3) * 3);
        c.style.setProperty("--d", (i * 0.07).toFixed(2) + "s");
        smoke.appendChild(c);
      });
      world.appendChild(smoke);
      var stars = document.createElementNS(NS, "g");
      stars.setAttribute("class", "sc-stars");
      for (var i = 0; i < 18; i++) {
        var st = document.createElementNS(NS, "circle");
        st.setAttribute("cx", (40 + Math.random() * 1360).toFixed(0));
        st.setAttribute("cy", (14 + Math.random() * 110).toFixed(0));
        st.setAttribute("r", (0.9 + Math.random() * 1.2).toFixed(1));
        st.style.setProperty("--d", (-Math.random() * 4).toFixed(2) + "s");
        stars.appendChild(st);
      }
      svg.insertBefore(stars, svg.firstChild.nextSibling);
    }
    var mf = src.cloneNode(true);
    mf.removeAttribute("data-footer");
    mf.setAttribute("data-menu-footer", "");
    mf.classList.add("footer--menu");
    // unique ids inside the copy
    mf.querySelectorAll("[id]").forEach(function (el) { el.id = el.id + "-m"; });
    mf.querySelectorAll("[clip-path]").forEach(function (el) {
      el.setAttribute("clip-path", el.getAttribute("clip-path").replace(/#([\w-]+)\)/, "#$1-m)"));
    });
    var scene = mf.querySelector("[data-footer-scene]");
    scene.removeAttribute("data-footer-scene");
    scene.setAttribute("data-menu-scene", "");
    // "Back to top" scrolls the menu instead of the page
    var top = mf.querySelector(".footer__top");
    if (top) {
      var btn = document.createElement("button");
      btn.type = "button"; btn.className = top.className + " footer__replay"; btn.setAttribute("data-menu-top", "");
      btn.textContent = "Back to index ↑";
      top.replaceWith(btn);
    }
    if (menuEl) menuEl.appendChild(mf);
  })();

  /* ---------- Intro on every load: the logo and name bloom out of a pixel grid ---------- */
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
    var FAMILY = (document.fonts && document.fonts.check && document.fonts.check('900 100px "Archivo"'))
      ? '"Archivo"' : '"Arial Black", Arial, sans-serif';
    function setFont(c, size) {
      c.font = "900 " + size + "px " + FAMILY;
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
    var crispCv = document.createElement("canvas");
    crispCv.width = Math.ceil(bw * dpr); crispCv.height = Math.ceil(bh * dpr);
    var cc = crispCv.getContext("2d");
    cc.scale(dpr, dpr); cc.fillStyle = cc.strokeStyle = CREAM;
    drawMark(cc, bx, by);
    function alphaAt(d, x, y) {
      x = Math.max(0, Math.min(bw - 1, x | 0)); y = Math.max(0, Math.min(bh - 1, y | 0));
      return d[(y * bw + x) * 4 + 3] / 255;
    }

    var originX = x0 + fishW * 0.45, originY = cy;     // the bloom starts in the fish
    var maxD = Math.hypot(totalW + halo, fishH / 2 + halo);
    var cells = [];
    for (var gy = 0; gy * cs < bh; gy++) {
      for (var gx = 0; gx * cs < bw; gx++) {
        // exact ink coverage of this square (every pixel), so no sliver of the mark is missed
        var lx = gx * cs, ly = gy * cs, cov = 0, n = 0;
        for (var yy = ly; yy < ly + cs && yy < bh; yy++) {
          for (var xx = lx; xx < lx + cs && xx < bw; xx++) { cov += md[(yy * bw + xx) * 4 + 3]; n++; }
        }
        cov = n ? cov / (n * 255) : 0;
        var h = alphaAt(bd, lx + cs / 2, ly + cs / 2);
        // 0 inside, 1 edge, 3 thin sliver of the mark (no square, but it still resolves), 2 scattered halo
        var kind = cov >= 0.5 ? 0 : cov >= 0.08 ? 1 : cov > 0 ? 3 : (h > 0.035 && Math.random() < h * 2 ? 2 : -1);
        if (kind < 0) continue;
        var px = bx + lx, py = by + ly;
        var d = Math.hypot(px + cs / 2 - originX, py + cs / 2 - originY) / maxD;
        var size = kind === 0 ? cs - 1.5 : kind === 1 ? cs * (0.5 + cov * 0.6) : cs * (0.22 + h * 0.6) * (0.6 + Math.random() * 0.4);
        cells.push({
          x: px, y: py, kind: kind, size: Math.min(size, cs - 1.5),
          delay: 0.25 + d * 1.05 + Math.random() * 0.3,
          color: PALETTE[(Math.random() * PALETTE.length) | 0],
          outline: kind !== 0 && Math.random() < 0.35,
          seed: Math.random() * 10,
          ro: d * 0.6 + Math.random() * 0.12      // resolve offset: when this square becomes the real mark
        });
      }
    }

    // ---- timeline (seconds)
    var T_RESOLVE = 2.1;                // the resolve wave starts here...
    var T_FULL = T_RESOLVE + 0.76;      // ...and has reached every square by here
    var T_CLEAN = T_FULL, T_EXIT = T_FULL + 0.5, T_END = T_EXIT + 0.95;
    var start = performance.now(), raf = 0, done = false, exiting = false;
    var ease = function (t) { return 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3); };

    function frame(now) {
      var t = (now - start) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, vw, vh);

      var full = t >= T_FULL;
      var fadeOut = ease((t - T_RESOLVE) / 0.45);       // the scattered squares drift away
      if (full) ctx.drawImage(crispCv, 0, 0, crispCv.width, crispCv.height, bx, by, bw, bh);
      for (var i = 0; i < cells.length; i++) {
        var c = cells[i], lt = t - c.delay;
        if (c.kind === 3 && !full && t >= T_RESOLVE + c.ro) {
          ctx.globalAlpha = 1;
          ctx.drawImage(crispCv, (c.x - bx - 0.5) * dpr, (c.y - by - 0.5) * dpr, (cs + 1) * dpr, (cs + 1) * dpr,
            c.x - 0.5, c.y - 0.5, cs + 1, cs + 1);
        }
        if (c.kind === 3) continue;
        if (lt <= 0) continue;
        if (c.kind !== 2) {
          if (full) continue;                            // the clean mark is already drawn whole
          if (t >= T_RESOLVE + c.ro) {
            // this square becomes its exact piece of the clean mark (slightly overlapped: no seams)
            ctx.globalAlpha = 1;
            ctx.drawImage(crispCv, (c.x - bx - 0.5) * dpr, (c.y - by - 0.5) * dpr, (cs + 1) * dpr, (cs + 1) * dpr,
              c.x - 0.5, c.y - 0.5, cs + 1, cs + 1);
            continue;
          }
        }
        var alpha = c.kind === 2 ? 1 - fadeOut : 1;
        if (alpha <= 0.01) continue;
        var grow = ease(lt / 0.22);
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
  function applyTheme(next) {
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("aaa628-theme", next); } catch (e) {}
    syncThemeUI();
  }

  /* Theme transition: blades fly in, a jagged slash wall covers the screen, the theme swaps
     underneath, then the colour breaks apart in splatter to reveal the new theme. */
  var themeBusy = false;
  function themeTransition(next) {
    if (reduceMotion.matches || !document.createElement("canvas").getContext) { applyTheme(next); return; }
    themeBusy = true;
    var ACC = { light: "#e04a36", dark: "#3cc8d4" };
    var fromAcc = ACC[next === "dark" ? "light" : "dark"], toAcc = ACC[next], INK = "#0b0b0c";
    var cv = document.createElement("canvas");
    cv.className = "theme-fx";
    cv.setAttribute("aria-hidden", "true");
    document.body.appendChild(cv);
    var dpr = Math.min(window.devicePixelRatio || 1, 2), W = window.innerWidth, H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var c = cv.getContext("2d");
    var D = Math.hypot(W, H), ANG = -0.42;                // the sweep runs along a tilted axis
    var R = function (a, b) { return a + Math.random() * (b - a); };
    var ease = function (t) { t = Math.max(0, Math.min(1, t)); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
    var easeOut = function (t) { t = Math.max(0, Math.min(1, t)); return 1 - Math.pow(1 - t, 3); };

    // 1) blades in the current accent
    var blades = [];
    for (var i = 0; i < 34; i++) blades.push({ y: R(-D / 2, D / 2), len: R(18, 70), w: R(3, 9), sp: R(1.6, 2.8), t0: R(0, 0.28) });
    // 2) the wall: jagged front in the new accent, black streaks riding its edge
    var teeth = [];
    var N = 26;
    for (var k = 0; k <= N; k++) teeth.push(k % 2 ? R(-30, 0) : R(40, 150));
    var streaks = [];
    for (var j = 0; j < 12; j++) streaks.push({ y: R(-D / 2, D / 2), len: R(120, 320), w: R(10, 26), lead: R(-40, 120) });
    // 3) the reveal: wobbly holes that grow out of the colour, plus drifting embers
    var holes = [];
    for (var h = 0; h < 30; h++) {
      var pts = [];
      for (var q = 0; q < 12; q++) pts.push(R(0.72, 1.18));
      holes.push({ x: R(-0.05, 1.05) * W, y: R(-0.05, 1.05) * H, r: R(0.18, 0.42) * D, d: R(0, 0.22), pts: pts, rot: R(0, 6.28) });
    }
    var embers = [];
    for (var e2 = 0; e2 < 40; e2++) embers.push({ x: R(0, W), y: R(0, H), vx: R(-40, 40), vy: R(-160, -60), s: R(2, 6), rot: R(0, 6.28), d: R(0, 0.25) });

    var T_WALL0 = 0.12, T_WALL1 = 0.6, T_SWAP = 0.62, T_REVEAL = 0.7, T_END = 1.32;
    var swapped = false, start = performance.now();

    function wallFront(t) { return -D / 2 - 220 + ease((t - T_WALL0) / (T_WALL1 - T_WALL0)) * (D + 440); }
    function blade(x, y, len, w, col) {
      c.beginPath(); c.moveTo(x - len, y); c.lineTo(x, y - w / 2); c.lineTo(x + len * 0.35, y); c.lineTo(x, y + w / 2); c.closePath();
      c.fillStyle = col; c.fill();
    }
    function frame(now) {
      var t = (now - start) / 1000;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, W, H);
      if (t < T_REVEAL) {
        c.save(); c.translate(W / 2, H / 2); c.rotate(ANG);
        var X = wallFront(t);
        // blades shoot across ahead of the wall
        blades.forEach(function (b) {
          var lt = t - b.t0; if (lt <= 0) return;
          var bx = -D / 2 - 80 + lt * b.sp * D;
          if (bx < X + 30) return;                       // already swallowed by the wall
          blade(bx, b.y, b.len, b.w, fromAcc);
        });
        if (t > T_WALL0) {
          // the jagged wall
          c.beginPath(); c.moveTo(-D, -D / 2 - 40);
          for (var k2 = 0; k2 <= N; k2++) c.lineTo(X + teeth[k2], -D / 2 - 40 + (D + 80) * k2 / N);
          c.lineTo(-D, D / 2 + 40); c.closePath();
          c.fillStyle = toAcc; c.fill();
          // black streaks on its edge
          streaks.forEach(function (st) { blade(X + st.lead, st.y, st.len, st.w, INK); });
        }
        c.restore();
      } else {
        // fully covered: swap happened; now the colour breaks apart
        c.fillStyle = toAcc; c.fillRect(0, 0, W, H);
        c.globalCompositeOperation = "destination-out";
        holes.forEach(function (o) {
          var g = easeOut((t - T_REVEAL - o.d) / 0.42); if (g <= 0) return;
          c.beginPath();
          for (var q2 = 0; q2 < o.pts.length; q2++) {
            var a = o.rot + q2 / o.pts.length * Math.PI * 2, rr = o.r * g * o.pts[q2];
            var px = o.x + Math.cos(a) * rr, py = o.y + Math.sin(a) * rr;
            q2 ? c.lineTo(px, py) : c.moveTo(px, py);
          }
          c.closePath(); c.fill();
        });
        c.globalCompositeOperation = "source-over";
        // embers drift up and fade
        embers.forEach(function (m) {
          var lt2 = t - T_REVEAL - m.d; if (lt2 <= 0) return;
          var life = 1 - lt2 / 0.55; if (life <= 0) return;
          c.save(); c.globalAlpha = life;
          c.translate(m.x + m.vx * lt2, m.y + m.vy * lt2); c.rotate(m.rot + lt2 * 4);
          blade(0, 0, m.s * 2.2, m.s, toAcc);
          c.restore();
        });
      }
      if (!swapped && t >= T_SWAP) { swapped = true; applyTheme(next); }
      if (t < T_END) requestAnimationFrame(frame);
      else { cv.remove(); themeBusy = false; }
    }
    requestAnimationFrame(frame);
  }

  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      if (themeBusy) return;
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      themeTransition(next);
    });
  }
  syncThemeUI();

  /* ---------- Menu overlay ---------- */
  var menu = document.getElementById("menu");
  var menuBtn = document.querySelector("[data-menu-toggle]");
  function setMenu(open, fromKeyboard) {
    if (!menu || !menuBtn) return;
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.querySelector(".label").textContent = open ? "Close" : "Menu";
    document.body.style.overflow = open ? "hidden" : "";
    root.classList.toggle("menu-open", open);          // the header steps aside
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(function () {
        menu.classList.add("is-open");
        // keyboard: start on the first section; mouse/touch: park focus on Close (no visible ring)
        var target = fromKeyboard ? menu.querySelector(".menu__list a") : menu.querySelector("[data-menu-close]");
        if (target) target.focus({ preventScroll: true });
      });
    } else {
      menu.classList.remove("is-open");
      menu.hidden = true;
    }
  }
  if (menuBtn) {
    menuBtn.addEventListener("click", function (e) {
      setMenu(menuBtn.getAttribute("aria-expanded") !== "true", e.detail === 0);
    });
  }
  if (menu) {
    menu.addEventListener("click", function (e) {
      if (e.target.closest("[data-menu-close]")) { setMenu(false); if (menuBtn) menuBtn.focus({ preventScroll: true }); return; }
      if (e.target.closest("a")) setMenu(false);
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && menuBtn && menuBtn.getAttribute("aria-expanded") === "true") {
      setMenu(false);
      menuBtn.focus();
    }
  });

  /* ---------- Menu: live preview panel (built from the pop-ups' own content) ---------- */
  var mpv = menu && menu.querySelector("[data-mpv]");
  if (mpv) {
    var esc = function (t) { var d = document.createElement("div"); d.textContent = t; return d.innerHTML; };
    var txt = function (sel) { var el = document.querySelector(sel); return el ? el.textContent.replace(/\s+/g, " ").trim() : ""; };
    var panel = function (name) { return mpv.querySelector('[data-panel="' + name + '"]'); };
    var label = function (t) { return '<p class="mono menu__label">Preview / ' + t + "</p>"; };

    // About: the homepage lead + location
    panel("about").innerHTML = label("About") +
      '<p class="mpv__lead">' + esc(txt(".index__lead")) + "</p>" +
      '<dl class="mpv__rows"><div><dt class="mono">Based</dt><dd>' + esc(txt(".index__meta")) + "</dd></div></dl>";

    // Projects: every row of the Projects pop-up, clickable
    var rows = Array.prototype.map.call(document.querySelectorAll("#m-projects .plist a"), function (a) {
      return '<li><a href="#' + a.getAttribute("data-open") + '" data-open="' + a.getAttribute("data-open") + '">' +
        '<span class="mpv__name">' + esc(a.querySelector(".plist__name").textContent) + "</span>" +
        '<span class="mono mpv__meta">' + esc(a.querySelector(".plist__meta").textContent) + "</span></a></li>";
    }).join("");
    panel("projects").innerHTML = label("Projects") + '<ul class="mpv__list">' + rows + "</ul>";

    // Capabilities: the four areas and their one-liners
    var caps = Array.prototype.map.call(document.querySelectorAll("#m-skills .skill"), function (k) {
      return '<li><div><span class="mpv__name">' + esc(k.querySelector(".skill__title").textContent) + "</span>" +
        '<span class="mpv__text">' + esc(k.querySelector(".skill__line").textContent) + "</span></div></li>";
    }).join("");
    panel("skills").innerHTML = label("Capabilities") + '<ul class="mpv__list">' + caps + "</ul>";

    // Research: the quote + the three pillars
    var pillars = Array.prototype.map.call(document.querySelectorAll("#m-research .fields dt"), function (dt) {
      var n = dt.querySelector(".fields__n"), name = dt.textContent.replace(n ? n.textContent : "", "").trim();
      return '<li><div><span class="mono mpv__meta" style="text-align:left">' + esc(n ? n.textContent : "") + '</span><span class="mpv__name">' + esc(name) + "</span></div></li>";
    }).join("");
    panel("research").innerHTML = label("Research") +
      '<p class="mpv__lead">' + esc(txt("#m-research .quote p")) + "</p>" + '<ul class="mpv__list">' + pillars + "</ul>";

    // Contact: availability + response time
    panel("contact").innerHTML = label("Contact") +
      '<p class="mpv__lead">' + esc(txt("#m-contact .contact__text")) + "</p>" +
      '<dl class="mpv__rows"><div><dt class="mono">Fastest</dt><dd>Discord · aaa628no</dd></div>' +
      '<div><dt class="mono">Code</dt><dd>github.com/aaa628</dd></div></dl>';

    var navItems = menu.querySelectorAll(".menu__list li[data-preview]");
    var aside = menu.querySelector(".menu__aside");
    var current = "now", backTimer = 0;
    var showPanel = function (name) {
      clearTimeout(backTimer);
      if (name === current) return;
      current = name;
      mpv.querySelectorAll(".mpv__panel").forEach(function (p) {
        var on = p.getAttribute("data-panel") === name;
        p.classList.toggle("is-active", on);
        p.setAttribute("aria-hidden", String(!on));
      });
      navItems.forEach(function (li) { li.classList.toggle("is-current", li.getAttribute("data-preview") === name); });
    };
    var backToNow = function () {
      clearTimeout(intent);
      clearTimeout(backTimer);
      backTimer = setTimeout(function () { showPanel("now"); }, 260);
    };
    var intent = 0;
    navItems.forEach(function (li) {
      var name = li.getAttribute("data-preview");
      // a short intent delay, so sweeping across rows doesn't flicker the preview
      li.addEventListener("pointerenter", function (e) {
        if (e.pointerType !== "mouse") return;
        clearTimeout(intent); clearTimeout(backTimer);
        intent = setTimeout(function () { showPanel(name); }, 70);
      });
      li.querySelector("a").addEventListener("focus", function () { showPanel(name); });
    });
    menu.querySelector(".menu__list").addEventListener("pointerleave", backToNow);
    if (aside) {
      aside.addEventListener("pointerenter", function () { clearTimeout(backTimer); });
      aside.addEventListener("pointerleave", backToNow);
    }
    menu.addEventListener("focusout", function () {
      setTimeout(function () {
        var a = document.activeElement;
        if (!menu.contains(a) || (!a.closest(".menu__list") && !a.closest(".menu__aside"))) showPanel("now");
      }, 0);
    });
    menu.resetPreview = function () { current = ""; showPanel("now"); };
  }

  /* ---------- Menu footer: builds as the menu scrolls; rocket launches once complete ---------- */
  var mfoot = menu && menu.querySelector("[data-menu-footer]");
  if (mfoot) {
    var mscene = mfoot.querySelector("[data-menu-scene]");
    var msvg = mscene.querySelector("svg");
    var mTicking = false;
    var setMenuProgress = function () {
      mTicking = false;
      if (menu.hidden) return;
      if (reduceMotion.matches) { mfoot.style.setProperty("--p", "1"); mfoot.classList.add("is-built"); return; }
      var r = mscene.getBoundingClientRect();
      var p = Math.max(0, Math.min(1, (window.innerHeight - r.top) / (r.height * 0.85)));
      mfoot.style.setProperty("--p", p.toFixed(3));
      mfoot.classList.toggle("is-built", p > 0.97);
    };
    menu.addEventListener("scroll", function () {
      if (!mTicking) { mTicking = true; requestAnimationFrame(setMenuProgress); }
    }, { passive: true });
    window.addEventListener("resize", setMenuProgress);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.target === mfoot) {
            mfoot.classList.toggle("is-live", en.isIntersecting && !reduceMotion.matches);
            if (msvg && msvg.pauseAnimations) { en.isIntersecting && !reduceMotion.matches ? msvg.unpauseAnimations() : msvg.pauseAnimations(); }
          } else if (en.isIntersecting) {
            mfoot.classList.add("is-in");               // the sign-off band slides in
          }
        });
      }, { root: menu, threshold: 0.15 }).observe(mfoot);
    }
    var bandObs = "IntersectionObserver" in window && new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) mfoot.classList.add("is-in");
    }, { root: menu, threshold: 0.2 });
    if (bandObs) bandObs.observe(mfoot.querySelector(".footer__band")); else mfoot.classList.add("is-in");
    menu.addEventListener("click", function (e) {
      if (e.target.closest("[data-menu-top]")) menu.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
    });
    // each time the menu opens: back to the top, world un-built, band hidden again
    new MutationObserver(function () {
      if (!menu.hidden) {
        menu.scrollTop = 0;
        mfoot.classList.remove("is-in", "is-built");
        setMenuProgress();
      }
    }).observe(menu, { attributes: true, attributeFilter: ["hidden"] });
  }

  /* ---------- Menu: live local time (IST) ---------- */
  var clockEl = menu && menu.querySelector("[data-clock]");
  var clockTimer = 0;
  var clockFmt = (window.Intl && Intl.DateTimeFormat) ? new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) : null;
  function tickClock() { if (clockEl && clockFmt) clockEl.textContent = clockFmt.format(new Date()); }
  if (menu) {
    new MutationObserver(function () {
      clearInterval(clockTimer);
      if (!menu.hidden) {
        tickClock(); clockTimer = setInterval(tickClock, 1000);
        if (menu.resetPreview) menu.resetPreview();
      }
    }).observe(menu, { attributes: true, attributeFilter: ["hidden"] });
  }

  /* ---------- Header background after scrolling ---------- */
  var header = document.getElementById("header");
  var lastY = window.scrollY;
  function onScrollHeader() {
    if (!header) return;
    var y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 24);
    // fade away while scrolling down, come back on the way up
    var menuOpen = menuBtn && menuBtn.getAttribute("aria-expanded") === "true";
    if (y < 80 || menuOpen) {
      header.classList.remove("is-hidden");
      lastY = y;
    } else if (Math.abs(y - lastY) > 6) {
      header.classList.toggle("is-hidden", y > lastY && !header.querySelector(":focus-visible"));
      lastY = y;
    }
    var max = document.documentElement.scrollHeight - window.innerHeight;
    header.style.setProperty("--sp", max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : "0");
  }
  // The header's grid texture leans slightly toward the pointer
  if (header && !reduceMotion.matches && window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener("pointermove", function (e) {
      header.style.setProperty("--mx", ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
      header.style.setProperty("--my", ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3));
    }, { passive: true });
  }
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  // keyboard users tabbing into the header always get it back
  if (header) header.addEventListener("focusin", function () {
    if (header.querySelector(":focus-visible")) header.classList.remove("is-hidden");
  });

  /* ---------- Visitor counter: one count per device ----------
     Uses Abacus (abacus.jasoncameron.dev), a free counter API: no account, no cookies, nothing
     personal is sent. The first visit from a browser adds 1 and remembers that in localStorage;
     later visits only read the number. Only the live domain counts, so previews and local copies
     never inflate it. */
  (function () {
    var wraps = document.querySelectorAll("[data-visits-wrap]");
    if (!wraps.length || !window.fetch) return;
    var API = "https://abacus.jasoncameron.dev", KEY = "aaa628-fishing/visitors";
    var live = /(^|\.)aaa628\.fishing$/.test(location.hostname);
    var counted = false;
    try { counted = localStorage.getItem("aaa628-counted") === "1"; } catch (e) {}
    var url = API + (live && !counted ? "/hit/" : "/get/") + KEY;
    fetch(url, { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (d) {
        var n = Number(d && d.value);
        if (!isFinite(n) || n < 0) return;
        if (live && !counted) { try { localStorage.setItem("aaa628-counted", "1"); } catch (e) {} }
        var fmt = function (v) { return Math.round(v).toLocaleString("en-US"); };
        wraps.forEach(function (w) { w.hidden = false; });
        // count up the first time each number scrolls into view
        document.querySelectorAll("[data-visits]").forEach(function (el) {
          var run = function () {
            if (reduceMotion.matches || n < 2) { el.textContent = fmt(n); return; }
            var t0 = performance.now(), dur = 1200;
            (function step(now) {
              var p = Math.min(1, (now - t0) / dur);
              el.textContent = fmt(n * (1 - Math.pow(1 - p, 3)));
              if (p < 1) requestAnimationFrame(step);
            })(t0);
          };
          if ("IntersectionObserver" in window) {
            var io2 = new IntersectionObserver(function (es) {
              if (es[0].isIntersecting) { io2.disconnect(); run(); }
            });
            io2.observe(el);
          } else run();
        });
      })
      .catch(function () { /* service unreachable or counter not created yet: keep it hidden */ });
  })();

  /* ---------- Discord: copy the username ---------- */
  var DISCORD = "aaa628no";
  var toast = document.querySelector("[data-toast]");
  var toastTimer = 0;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    clearTimeout(toastTimer);
    toast.classList.remove("is-out");
    if (toast.showPopover) { try { toast.hidePopover(); } catch (e) {} toast.showPopover(); }
    else toast.hidden = false;
    toastTimer = setTimeout(function () {
      toast.classList.add("is-out");
      setTimeout(function () {
        if (toast.hidePopover) { try { toast.hidePopover(); } catch (e) {} } else toast.hidden = true;
      }, 260);
    }, 2200);
  }
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta);
      ok ? resolve() : reject();
    });
  }
  if (toast && !toast.showPopover) toast.hidden = true;
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var value = btn.getAttribute("data-copy"), what = btn.getAttribute("data-copy-what") || "Text";
      copyText(value).then(function () {
        var lab = btn.querySelector("[data-copy-label]");
        btn.classList.add("is-copied"); if (lab) lab.textContent = "Copied";
        showToast(what + " copied · " + value);
        setTimeout(function () { btn.classList.remove("is-copied"); if (lab) lab.textContent = "Copy"; }, 1600);
      }, function () { showToast(what + ": " + value); });
    });
  });
  document.querySelectorAll("[data-discord]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      copyText(DISCORD).then(function () {
        btn.classList.add("is-copied");
        var label = btn.querySelector("[data-discord-label]");
        if (label) label.textContent = "Copied";
        showToast("Discord username copied · " + DISCORD);
        setTimeout(function () {
          btn.classList.remove("is-copied");
          if (label) label.textContent = "Copy";
        }, 1600);
      }, function () {
        showToast("Discord: " + DISCORD);   // copying blocked: at least show it
      });
    });
  });

  /* ---------- Verse: Arabic <-> English ---------- */
  var verses = document.querySelectorAll("[data-verse]");
  var showingEnglish = false;
  function setVerse(english) {
    showingEnglish = english;
    verses.forEach(function (v) {
      v.classList.add("is-swapping");
      setTimeout(function () {
        v.setAttribute("dir", english ? "ltr" : "rtl");
        v.querySelector(".verse__ar").hidden = english;
        v.querySelector(".verse__by-ar").hidden = english;
        v.querySelector(".verse__en").hidden = !english;
        v.querySelector(".verse__by-en").hidden = !english;
        var t = v.querySelector("[data-verse-toggle]");
        t.setAttribute("aria-pressed", String(english));
        t.setAttribute("aria-label", english ? "Show the original Arabic" : "Show the English translation");
        t.innerHTML = english ? '<span class="verse__glyph" lang="ar">ع</span>' : '<span class="mono">EN</span>';
        v.classList.remove("is-swapping");
      }, reduceMotion.matches ? 0 : 200);
    });
  }
  document.querySelectorAll("[data-verse-toggle]").forEach(function (t) {
    t.addEventListener("click", function () { setVerse(!showingEnglish); });
  });
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
      if (reduceMotion.matches) { footer.style.setProperty("--p", "1"); footer.classList.add("is-built", "is-in"); return; }
      var r = scene.getBoundingClientRect();
      var p = (window.innerHeight - r.top) / (r.height * 0.9);
      p = Math.max(0, Math.min(1, p));
      footer.style.setProperty("--p", p.toFixed(3));
      footer.classList.toggle("is-built", p > 0.97);   // rocket launches, windows flicker
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(setProgress); }
    }, { passive: true });
    window.addEventListener("resize", setProgress);
    setProgress();

    // The sign-off band slides in when it first comes into view
    var band = footer.querySelector(".footer__band");
    if ("IntersectionObserver" in window && band) {
      var bo = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { footer.classList.add("is-in"); bo.disconnect(); }
      }, { threshold: 0.2 });
      bo.observe(band);
    } else {
      footer.classList.add("is-in");
    }

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
