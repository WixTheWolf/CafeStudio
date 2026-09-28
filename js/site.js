/* Cafe Studio: the scroll.

   The page is one sheet of paper. Scrolling pulls back from a cup of coffee,
   lifts the cup and leaves its ring. The ring blooms, the palette appears,
   a bean study paints itself one dry layer at a time and is framed and hung
   on the gallery wall beside Hannah's series, and then the lights go down in
   the night café, where she tells her story. Everything on the stage is a function of scroll position,
   so it plays the same forwards and backwards. */
(function () {
  "use strict";

  var S = window.STUDIO, B = window.Brew, Crema = window.Crema;
  if (!S || !B || !Crema) return;

  var doc = document.documentElement;
  doc.classList.add("js");
  var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var LAND_SEED = 11;

  function $(s, r) { return (r || document).querySelector(s); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  var stageEl = $("#stage"), paperC = $("#paper"), landC = $("#land"), wall = $("#wall"), cupC = $("#cup");
  var barMark = $(".bar-mark"), railLinks = Array.prototype.slice.call(document.querySelectorAll("#rail a"));
  var secCup = $("#top"), secRing = $("#medium"), secStr = $("#palette"), secLay = $("#process");
  var secGal = $("#work"), secNight = $("#artist"), sheetEl = $("#sheet");
  var hero = $("#hero"), line1 = $("#cup-line-1"), line2 = $("#cup-line-2"), pencil = $("#pencil");
  var track = $("#track"), gHead = $("#g-head");
  var SECTIONS = [secCup, secRing, secStr, secLay, secGal, secNight, sheetEl];

  /* ---------- content from js/studio.js ---------- */

  var swatchEls = [];
  S.strengths.forEach(function (st, i) {
    var li = el("li", "swatch"), c = el("canvas");
    c.width = c.height = 360;
    c.setAttribute("aria-hidden", "true");
    li.appendChild(c);
    li.appendChild(el("span", "sw-name", st.name));
    $("#swatches").appendChild(li);
    swatchEls.push(c);
    B.later(function () { B.swatch(c, st.s, 40 + i * 7); });
  });

  var stepEls = S.process.map(function (p, i) {
    var li = el("li", "card step");
    li.appendChild(el("span", "step-n", "Step " + (i + 1)));
    li.appendChild(el("h3", null, p.title));
    li.appendChild(el("p", null, p.text));
    $("#steps").appendChild(li);
    return li;
  });

  S.bio.forEach(function (t) { $("#bio").appendChild(el("p", null, t)); });

  S.fyi.forEach(function (f) {
    var li = el("li"), img = el("img");
    img.src = f.photo;
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    li.appendChild(img);
    li.appendChild(el("h3", null, f.title));
    li.appendChild(el("p", null, f.text));
    $("#fyi").appendChild(li);
  });

  $("#care-intro").textContent = S.care.intro;
  S.care.avoid.forEach(function (t) { $("#care").appendChild(el("li", null, t)); });
  $("#care-note").textContent = S.care.note;

  var picker = $("#c-piece");
  picker.appendChild(el("option", null, "Not sure yet, or a general question"));
  S.series.forEach(function (se) {
    var ws = S.hung().filter(function (w) { return w.series === se.id; });
    if (!ws.length) return;
    var g = el("optgroup");
    g.label = se.title;
    ws.forEach(function (w) { var o = el("option", null, w.title); o.value = w.title; g.appendChild(o); });
    picker.appendChild(g);
  });
  var idea = el("option", null, "An idea of my own");
  idea.value = "An idea of my own";
  picker.appendChild(idea);

  $("#legal").textContent = S.legal;
  var contactLine = $("#contact-line");
  if (S.email) {
    var mailto = el("a", null, S.email);
    mailto.href = "mailto:" + S.email;
    contactLine.appendChild(mailto);
  }
  if (S.instagram) contactLine.appendChild(document.createTextNode((S.email ? " · " : "") + "@" + S.instagram));

  /* ---------- the gallery ---------- */

  // The wall: the bean study that was just painted, then each series
  // behind its own wall text.
  var live = {
    live: true,
    slug: "scroll-study",
    title: "Scroll Study",
    medium: "Painted by this page as you scrolled",
    blurb: "A quick demonstration of how a coffee painting is built, painted live by this website. It is not one of Hannah’s pieces."
  };
  var frames = [], hangItems = [];

  function makeFrame(w) {
    var fig = el("figure", "frame mount-" + (w.live ? "art" : w.mount));
    var btn = el("button", "frame-art");
    btn.type = "button";
    btn.setAttribute("aria-label", "View " + w.title);
    if (w.mount !== "panel" && w.mount !== "oval") {
      btn.innerHTML = '<svg class="frame-hang" viewBox="0 0 100 42" preserveAspectRatio="none" aria-hidden="true"><path d="M4 42 L50 2 L96 42"/></svg>';
    }
    var mould = el("span", "frame-moulding"), mat = el("span", "frame-mat"), media;
    if (w.live) {
      media = el("canvas");
      media.setAttribute("aria-hidden", "true");
    } else {
      media = el("img");
      media.src = w.photo;
      media.alt = w.title + ", " + w.medium.toLowerCase();
      media.loading = "lazy";
      media.decoding = "async";
    }
    mat.appendChild(media);
    mould.appendChild(mat);
    btn.appendChild(mould);
    var cap = el("figcaption", "placard");
    cap.appendChild(el("span", "pl-title", w.title));
    cap.appendChild(el("span", "pl-meta", w.live ? "Demonstration · painted as you scrolled" : w.medium));
    fig.appendChild(btn);
    fig.appendChild(cap);
    track.appendChild(fig);
    var f = { w: w, fig: fig, art: btn, media: media, cssW: 0, cssH: 0, a: 0, v: 0, moving: false };
    btn.addEventListener("click", function () { openViewer(f); });
    frames.push(f);
    return f;
  }

  makeFrame(live);
  $("#g-note").textContent = S.total() + " original pieces, each painted by hand with coffee. Tap a painting to see it up close.";
  S.series.forEach(function (se) {
    var ws = S.inSeries(se.id), note = S.toCome(se);
    var text = el("div", "wall-text");
    text.appendChild(el("p", "wt-count", S.pieces(se.count)));
    text.appendChild(el("h3", null, se.title));
    text.appendChild(el("p", "wt-blurb", se.blurb));
    if (note) text.appendChild(el("p", "wt-note", note));
    track.appendChild(text);
    hangItems.push(text);
    ws.forEach(function (w) { hangItems.push(makeFrame(w).fig); });
  });

  /* ---------- measuring ---------- */

  var vw = 0, vh = 0, W = 0, H = 0, stageScale = 1, R0 = 2, R1 = 0.28, ringR = 0;
  var hangLen = 0, trackLen = 0, stepCentres = [], windows = {};
  var TRAVEL = 1.6;  // horizontal pixels travelled per pixel of scroll along the wall

  function measure() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    stageScale = Math.min(dpr, Math.sqrt(2.1e6 / (vw * vh)));
    W = Math.round(vw * stageScale);
    H = Math.round(vh * stageScale);
    R0 = Crema.coverRadius(vw, vh) * 1.55;
    R1 = vw < 760 ? 0.31 : 0.27;
    ringR = R1 * Math.min(W, H) * 0.8;
    doc.style.setProperty("--ring-r", (ringR / stageScale).toFixed(1) + "px");
  }

  function layoutGallery() {
    var fh = vw < 700 ? clamp(vh * 0.34, 150, 320) : clamp(vh * 0.4, 170, 480);
    frames.forEach(function (f) {
      var ar = f.w.live ? vw / vh : f.w.ratio, h = fh * (f.w.mount === "art" ? 0.86 : 1), w = h * ar;
      if (w > vw * 0.74) { w = vw * 0.74; h = w / ar; }
      f.cssW = w;
      f.cssH = h;
      f.media.style.width = w.toFixed(1) + "px";
      f.media.style.height = h.toFixed(1) + "px";
      if (f.media.tagName === "CANVAS") {
        var k = Math.min(window.devicePixelRatio || 1, 2), nw = Math.round(w * k), nh = Math.round(h * k);
        if (f.media.width !== nw || f.media.height !== nh) {
          f.media.width = nw;
          f.media.height = nh;
          f.painted = false;
        }
      }
    });
    track.style.paddingLeft = Math.max(16, (vw - frames[0].fig.offsetWidth) / 2).toFixed(1) + "px";
    track.style.paddingRight = Math.max(24, vw * 0.24).toFixed(1) + "px";
    trackLen = Math.max(0, track.scrollWidth - vw);
    hangLen = vh * 1.1;
    secGal.style.height = Math.round(vh + hangLen + trackLen / TRAVEL + vh * 0.2) + "px";
  }

  function cache() {
    var y = window.scrollY;
    SECTIONS.forEach(function (e) {
      var r = e.getBoundingClientRect();
      e._top = r.top + y;
      e._h = r.height;
    });
    stepCentres = stepEls.map(function (e) {
      var r = e.getBoundingClientRect();
      return (r.top + y + r.height / 2 - secLay._top) / secLay._h;
    });
    // Each note on the process paints its layers while it rises to the
    // middle of the screen.
    windows = {};
    S.process.forEach(function (p, i) {
      var f = stepCentres[i], n = p.layers.length, span = 0.14;
      p.layers.forEach(function (name, k) {
        var a = f - 0.13 + k * span / n;
        windows[name] = [a, a + span / n + 0.04];
      });
    });
  }

  function pinP(e, y) { return clamp((y - e._top) / Math.max(1, e._h - vh), 0, 1); }
  function centreP(e, y) { return (y + vh / 2 - e._top) / e._h; }

  /* ---------- the paper, the ring and the bloom ---------- */

  var paperBase = null, ringSheet = null, bloomSheet = null, dropSprites = [], ringX = 0, ringY = 0, paperKey = "";

  function buildPaper() {
    var r = B.rng(5), S0 = Math.min(W, H), u = S0 / 800, big = Math.max(W, H), i;
    paperC.width = W;
    paperC.height = H;
    paperBase = B.sheet(W, H);
    var pc = paperBase.getContext("2d");
    B.paper(pc, W, H, { grainScale: stageScale });
    ringX = W / 2;
    ringY = H / 2;
    // the cup was set down twice, as cups are
    ringSheet = B.sheet(W, H);
    var rc = ringSheet.getContext("2d");
    B.ring(rc, ringX, ringY, ringR, r, { u: u, s: 0.66, width: 0.04, fill: 0.014 });
    B.ring(rc, ringX + ringR * 0.035, ringY - ringR * 0.025, ringR * 0.995, r, { u: u, s: 0.5, width: 0.025, gaps: 0.56, fill: 0 });

    bloomSheet = B.sheet(W, H);
    var bc = bloomSheet.getContext("2d");
    B.wash(bc, B.ellipse(ringX, ringY, big * 0.6, big * 0.46, 44, r), r, { s: 0.07, layers: 24, alpha: 0.017, baseVar: 0.3, spread: 0.6, rim: 1.2, u: u * 2 });
    B.wash(bc, B.ellipse(ringX, ringY, S0 * 0.36, S0 * 0.32, 32, r), r, { s: 0.18, layers: 18, alpha: 0.02, baseVar: 0.4, spread: 0.7, rim: 1.8, u: u * 1.5 });
    for (i = 0; i < 5; i++) {
      var a = r() * Math.PI * 2, d = S0 * (0.3 + r() * 0.22);
      B.wash(bc, B.ellipse(ringX + Math.cos(a) * d * 1.3, ringY + Math.sin(a) * d, S0 * 0.1, S0 * 0.08, 20, r), r, { s: 0.18, layers: 10, alpha: 0.032, baseVar: 0.5, spread: 0.8, rim: 2.2, u: u });
    }

    dropSprites = [];
    // drops land on the right-hand side and below, clear of the reading column
    var spots = [[0.78, 0.2], [0.9, 0.46], [0.66, 0.84], [0.84, 0.74], [0.4, 0.9], [0.95, 0.12]];
    spots.forEach(function (sp, k) {
      var sz = Math.round(S0 * 0.16), c = B.sheet(sz, sz), dc = c.getContext("2d");
      B.wash(dc, B.ellipse(sz / 2, sz / 2, sz * 0.075, sz * 0.07, 14, r), r, { s: 0.32 + r() * 0.2, layers: 7, alpha: 0.16, baseVar: 0.4, depth: 2, spread: 0.3, rim: 2, u: u });
      B.drops(dc, r, sz / 2, sz / 2, sz * 0.12, 4, { u: u * 0.8, s: 0.35 + r() * 0.2 });
      dropSprites.push({ c: c, x: sp[0] * W, y: sp[1] * H, at: 0.12 + k * 0.11 });
    });
    paperKey = "";
  }

  function drawPaper(pr, bloomAlpha, ringAlpha) {
    if (!paperBase) return;
    var key = pr.toFixed(3) + "|" + bloomAlpha.toFixed(3) + "|" + ringAlpha.toFixed(3);
    if (key === paperKey) return;
    paperKey = key;
    var c = paperC.getContext("2d");
    c.globalCompositeOperation = "source-over";
    c.globalAlpha = 1;
    c.drawImage(paperBase, 0, 0);
    c.globalCompositeOperation = "multiply";
    if (ringAlpha > 0) {
      c.globalAlpha = ringAlpha;
      c.drawImage(ringSheet, 0, 0);
    }
    if (pr <= 0 || bloomAlpha <= 0) {
      c.globalAlpha = 1;
      c.globalCompositeOperation = "source-over";
      return;
    }
    c.globalAlpha = bloomAlpha;
    var maxR = Math.hypot(W, H) * 0.62, start = ringR * 0.9;
    B.spread(c, bloomSheet, ringX, ringY, start + ease(pr) * (maxR - start), 77, { rough: 0.22, edge: 0.3 * (1 - pr), u: Math.min(W, H) / 800 });
    dropSprites.forEach(function (d) {
      var t = smooth(d.at, d.at + 0.06, pr);
      if (t <= 0) return;
      var s = lerp(0.45, 1, ease(t)), sz = d.c.width * s;
      c.globalAlpha = bloomAlpha * t;
      c.drawImage(d.c, d.x - sz / 2, d.y - sz / 2, sz, sz);
    });
    c.globalAlpha = 1;
    c.globalCompositeOperation = "source-over";
  }

  /* ---------- the bean study ---------- */

  var DEPTH = {};
  var land = { paper: null, layers: [], names: [], token: 0, done: 0 }, landKey = "";

  function buildLand() {
    var token = ++land.token, w = W, h = H;
    landC.width = w;
    landC.height = h;
    land.paper = B.sheet(w, h);
    B.paper(land.paper.getContext("2d"), w, h, { grainScale: stageScale });
    var plan = B.plan("beans", w, h, LAND_SEED);
    land.names = plan.map(function (p) { return p.name; });
    land.layers = plan.map(function () { return null; });
    land.done = 0;
    landKey = "";
    plan.forEach(function (L, i) {
      B.later(function () {
        if (token !== land.token) return;
        land.layers[i] = B.paintLayer(L, i, w, h, LAND_SEED);
        land.done++;
        landKey = "";
      });
    });
  }

  function drawLand(pc) {
    if (!land.paper) return false;
    var pcc = clamp(pc, 0, 1), key = pcc.toFixed(3), state = [];
    for (var i = 0; i < land.names.length; i++) {
      var win = windows[land.names[i]], t = 1, wet = 0;
      if (win) {
        t = smooth(win[0], win[1], pc);
        wet = t > 0 ? 1 - smooth(win[1], win[1] + 0.05, pc) : 0;
      }
      state.push({ t: t, wet: wet });
      key += "," + (land.layers[i] ? t.toFixed(3) + ":" + wet.toFixed(2) : "x");
    }
    if (key === landKey) return false;
    landKey = key;
    var c = landC.getContext("2d");
    c.globalCompositeOperation = "source-over";
    c.globalAlpha = 1;
    c.drawImage(land.paper, 0, 0);
    c.globalCompositeOperation = "multiply";
    for (i = 0; i < land.names.length; i++) {
      var L = land.layers[i], s = state[i];
      if (!L || s.t <= 0) continue;
      var dy = (0.5 - pcc) * H * 0.028 * (DEPTH[land.names[i]] || 0.5);
      // Wet coffee looks darker than it dries; each fresh layer starts deep
      // and settles as you scroll on.
      for (var k = 0; k < (s.wet > 0.01 ? 2 : 1); k++) {
        c.globalAlpha = k ? s.wet * 0.45 : 1;
        if (s.t >= 1) c.drawImage(L, 0, dy);
        else B.sweep(c, L, s.t, 300 + i, { dir: i % 2 ? -1 : 1, y: dy });
      }
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = "source-over";
    return true;
  }

  function copyLive() {
    var f = frames[0];
    if (f.media.tagName !== "CANVAS" || !land.paper) return;
    f.media.getContext("2d").drawImage(landC, 0, 0, f.media.width, f.media.height);
  }

  /* ---------- the footer sheet ---------- */

  var sheetPainted = false;
  function paintSheet() {
    sheetPainted = true;
    var c = $("#sheet-paper"), rect = sheetEl.getBoundingClientRect(), k = Math.min(window.devicePixelRatio || 1, 1.25);
    c.width = Math.round(rect.width * k);
    c.height = Math.round(rect.height * k);
    var ctx = c.getContext("2d"), r = B.rng(21), u = Math.min(c.width, c.height) / 800;
    B.paper(ctx, c.width, c.height, { grainScale: k });
    var narrow = rect.width < 700;
    B.ring(ctx, c.width * (narrow ? 0.82 : 0.84), c.height * (narrow ? 0.8 : 0.32), Math.min(c.width, c.height) * (narrow ? 0.18 : 0.24), r, { u: u, s: 0.5, gaps: 0.4 });
    B.drops(ctx, r, c.width * 0.8, c.height * 0.66, c.width * 0.03, 6, { u: u, s: 0.6 });
    var m = $("#sheet-mark"), km = Math.min(window.devicePixelRatio || 1, 2);
    m.width = Math.round(m.clientWidth * km);
    m.height = Math.round(m.clientHeight * km);
    var size = m.height * 0.6;
    B.washText(m.getContext("2d"), "Cafe Studio", "400 " + size.toFixed(0) + "px Gloock, Georgia, serif", m.width * 0.015, m.height * 0.74, B.rng(9), { s: 0.6, u: size / 180 });
  }

  /* ---------- steam in the night café ---------- */

  var steamC = $("#steam");
  function drawSteam(now) {
    var w = steamC.clientWidth, h = steamC.clientHeight;
    if (steamC.width !== w || steamC.height !== h) { steamC.width = w; steamC.height = h; }
    var c = steamC.getContext("2d"), t = (reduce ? 20000 : now) / 1000;
    c.clearRect(0, 0, w, h);
    c.lineCap = "round";
    for (var i = 0; i < 6; i++) {
      var baseX = w * (0.06 + i * 0.18), amp = 26 + (i % 3) * 16;
      c.beginPath();
      for (var k = 0; k <= 48; k++) {
        var f = k / 48, y = h * (1.02 - f * 1.04);
        var x = baseX + Math.sin(f * 5 + t * 0.5 + i * 1.7) * amp * f + Math.sin(f * 12 - t * 0.8 + i) * 7 * f;
        if (k) c.lineTo(x, y); else c.moveTo(x, y);
      }
      var g = c.createLinearGradient(0, h, 0, 0);
      g.addColorStop(0, "rgba(243,227,200,0)");
      g.addColorStop(0.35, "rgba(243,227,200,1)");
      g.addColorStop(1, "rgba(243,227,200,0)");
      c.strokeStyle = g;
      [[46, 0.012], [24, 0.018], [8, 0.024]].forEach(function (p) {
        c.globalAlpha = p[1];
        c.lineWidth = p[0];
        c.stroke();
      });
    }
    c.globalAlpha = 1;
  }

  /* ---------- the cup ---------- */

  var crema = new Crema(cupC, { maxDpr: 1.25, frozen: reduce });
  if (!crema.ok) doc.classList.add("no-gl");
  var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("pointermove", function (e) {
    mouse.tx = e.clientX / vw * 2 - 1;
    mouse.ty = -(e.clientY / vh * 2 - 1);
  }, { passive: true });

  function setO(e, o) {
    var v = o.toFixed(3);
    if (e._o !== v) { e.style.opacity = v; e._o = v; }
  }

  function updateCup(y, now) {
    var p = pinP(secCup, y);
    var zoom = ease(smooth(0.04, 0.6, p));
    var R = Math.exp(lerp(Math.log(R0), Math.log(R1), zoom));
    var lift = smooth(0.64, 0.92, p), alpha = 1 - smooth(0.77, 0.95, p);
    var inView = y < secCup._top + secCup._h;
    if (crema.ok && inView && alpha > 0.002) {
      crema.set({ R: R, lift: lift, alpha: alpha, mx: mouse.x, my: mouse.y });
      crema.draw(now);
      setO(cupC, 1);
    } else {
      setO(cupC, 0);
    }
    doc.style.setProperty("--cup-o", (crema.ok ? 0 : 1 - smooth(0.2, 0.6, p)).toFixed(3));
    var heroO = 1 - smooth(0.02, 0.16, p);
    setO(hero, heroO);
    hero.style.transform = "translate3d(0," + (-p * 80).toFixed(1) + "px,0)";
    setO(barMark, 1 - heroO);
    setO(line1, smooth(0.38, 0.48, p) * (1 - smooth(0.62, 0.7, p)));
    setO(line2, smooth(0.8, 0.9, p));
    setO(pencil, smooth(0.86, 0.96, p));
    // dark while the coffee still covers the top corners of the screen
    return inView && y <= secCup._top + secCup._h - vh && R * 0.84 * Math.min(vw, vh) > Math.hypot(vw, vh) * 0.46;
  }

  /* ---------- the gallery ---------- */

  var lastTx = 0;
  function updateGallery(y) {
    var d = y - secGal._top;
    var e = clamp(d / (hangLen * 0.78), 0, 1), ee = ease(e);
    var reveal = smooth(0.72, 1, d / hangLen);
    setO(wall, smooth(0.1, 0.8, e));
    var f0 = frames[0];
    if (d > 0 && e < 1) {
      var T = f0.media.getBoundingClientRect();
      landC.style.transform = "translate3d(" + (T.left * ee).toFixed(2) + "px," + (T.top * ee).toFixed(2) + "px,0) scale(" +
        lerp(1, T.width / vw, ee).toFixed(5) + "," + lerp(1, T.height / vh, ee).toFixed(5) + ")";
      landC.style.boxShadow = "0 " + (40 * ee).toFixed(0) + "px " + (80 * ee).toFixed(0) + "px rgba(0,0,0," + (0.5 * ee).toFixed(2) + ")";
    } else if (d <= 0) {
      if (landC.style.transform) { landC.style.transform = ""; landC.style.boxShadow = ""; }
    }
    f0.media.style.visibility = e >= 1 ? "visible" : "hidden";
    setO(f0.fig, smooth(0.55, 0.95, e));
    for (var i = 0; i < hangItems.length; i++) {
      setO(hangItems[i], reveal);
      hangItems[i].style.transform = reveal < 1 ? "translate3d(" + ((1 - reveal) * 90).toFixed(1) + "px,0,0)" : "";
    }
    setO(gHead, reveal);
    var tx = -clamp((d - hangLen) * TRAVEL / Math.max(1, trackLen), 0, 1) * trackLen;
    if (tx !== lastTx) { track.style.transform = "translate3d(" + tx.toFixed(1) + "px,0,0)"; lastTx = tx; }
    return e;
  }

  var lastY = window.scrollY, vel = 0;
  function sway(y, active) {
    var dy = y - lastY;
    lastY = y;
    vel = lerp(vel, dy, 0.25);
    var target = active && !reduce ? clamp(-vel * 0.08, -3, 3) : 0;
    frames.forEach(function (f, i) {
      f.v += (target * (0.8 + (i % 3) * 0.15) - f.a) * 0.05;
      f.v *= 0.9;
      f.a += f.v;
      if (Math.abs(f.a) < 0.005 && Math.abs(f.v) < 0.005) {
        if (f.moving) { f.art.style.transform = ""; f.moving = false; }
        f.a = f.v = 0;
        return;
      }
      f.moving = true;
      f.art.style.transform = "rotate(" + f.a.toFixed(3) + "deg)";
    });
  }

  /* ---------- the frame loop ---------- */

  var currentWorld = "cup", liveStamp = -1;
  function worldAt(line) {
    if (line < secRing._top) return "cup";
    if (line < secStr._top) return "ring";
    if (line < secLay._top) return "strength";
    if (line < secGal._top) return "layers";
    if (line < secNight._top) return "gallery";
    if (line < sheetEl._top) return "night";
    return "sheet";
  }

  function tick(now) {
    requestAnimationFrame(tick);
    var y = window.scrollY;
    mouse.x = lerp(mouse.x, mouse.tx, 0.05);
    mouse.y = lerp(mouse.y, mouse.ty, 0.05);

    var cupDark = updateCup(y, now);

    var pr = smooth(-0.2, 0.55, centreP(secRing, y));
    var pS = pinP(secStr, y);
    // the stain becomes the palette: the ring fades as the swatches bloom
    drawPaper(pr, 1 - 0.78 * smooth(0.02, 0.4, pS), 1 - smooth(0.02, 0.32, pS));
    for (var i = 0; i < swatchEls.length; i++) {
      var t = smooth(0.06 + i * 0.09, 0.2 + i * 0.09, pS), c = swatchEls[i];
      setO(c, t);
      var tf = t < 1 ? "scale(" + lerp(0.55, 1, ease(t)).toFixed(3) + ") rotate(" + ((1 - t) * -10).toFixed(2) + "deg)" : "";
      if (c._tf !== tf) { c.style.transform = tf; c._tf = tf; }
    }

    var pcL = centreP(secLay, y);
    var e = updateGallery(y);
    var landOn = smooth(-0.07, 0.0, pcL) * (e >= 1 ? 0 : 1);
    setO(landC, landOn);
    // Once the wall is reached the finished landscape also hangs in the
    // first frame, however the reader got here.
    var redrawn = (landOn > 0 || y >= secGal._top) && drawLand(pcL);
    if (y >= secGal._top && (redrawn || liveStamp !== land.token * 100 + land.done)) {
      copyLive();
      liveStamp = land.token * 100 + land.done;
    }
    if (!sheetPainted && y + vh * 2 > sheetEl._top) paintSheet();
    if (y + vh > secNight._top && y < secNight._top + secNight._h) drawSteam(now);

    var inGallery = y >= secGal._top - vh && y < secNight._top;
    sway(y, inGallery && e >= 1);

    var world = worldAt(y + vh / 2);
    if (world !== currentWorld) {
      currentWorld = world;
      railLinks.forEach(function (a) { a.classList.toggle("on", a.getAttribute("data-for") === world); });
    }
    var top = worldAt(y + 40), tone = "light";
    if (top === "cup") tone = cupDark ? "dark" : "light";
    else if (top === "gallery") tone = e > 0.35 ? "dark" : "light";
    else if (top === "night") tone = "dark";
    if (doc.getAttribute("data-tone") !== tone) doc.setAttribute("data-tone", tone);
    if (doc.getAttribute("data-top") !== top) doc.setAttribute("data-top", top);
  }

  /* ---------- touches ---------- */

  // Tap the paper and a drop of coffee lands there.
  document.addEventListener("click", function (ev) {
    if (reduce || !(currentWorld === "ring" || currentWorld === "strength" || currentWorld === "layers")) return;
    if (ev.target.closest && ev.target.closest("a, button, input, textarea, select, label, .card, .beat, .strength-head, .swatches, dialog")) return;
    var size = 180, k = Math.min(window.devicePixelRatio || 1, 2), n = size * k;
    var c = B.sheet(n, n), ctx = c.getContext("2d"), r = B.rng((Math.random() * 1e9) | 0), u = k * 0.6;
    B.wash(ctx, B.ellipse(n / 2, n / 2, 15 * k, 14 * k, 12, r), r, { s: 0.45 + r() * 0.35, layers: 8, alpha: 0.16, baseVar: 0.45, depth: 2, spread: 0.3, rim: 2.2, u: u });
    B.drops(ctx, r, n / 2, n / 2, 28 * k, 7, { u: u, s: 0.6 });
    c.className = "drop-fx";
    c.style.width = c.style.height = size + "px";
    c.style.left = (ev.clientX - size / 2) + "px";
    c.style.top = (ev.clientY - size / 2) + "px";
    document.body.appendChild(c);
    requestAnimationFrame(function () { requestAnimationFrame(function () { c.style.opacity = "0"; }); });
    setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 4000);
  });

  // "Work" skips the hanging and lands on the wall.
  Array.prototype.forEach.call(document.querySelectorAll('a[href="#work"]'), function (a) {
    a.addEventListener("click", function (ev) {
      ev.preventDefault();
      window.scrollTo({ top: secGal._top + hangLen + 2, behavior: reduce ? "auto" : "smooth" });
    });
  });

  /* ---------- the viewer ---------- */

  var viewer = $("#viewer"), viewing = null;
  function openViewer(f) {
    var w = f.w, art = $("#v-art"), thumbs = $("#v-thumbs");
    viewing = w;
    var se = w.live ? null : S.seriesOf(w.series);
    $("#v-title").textContent = w.title;
    $("#v-meta").textContent = w.live ? "Demonstration" : (se ? se.title : "Original");
    $("#v-blurb").textContent = w.live ? w.blurb : w.medium + ". An original, painted by hand with coffee.";
    $("#v-note").textContent = w.live ? "" : "Sizing is included with each piece. Frames are for staging and are not included, and pricing does not include shipping.";
    $("#v-ask").hidden = !!w.live;
    art.innerHTML = "";
    thumbs.innerHTML = "";
    art.className = "v-art mount-" + (w.live ? "art" : w.mount);
    if (w.live) {
      var c = el("canvas"), ar = vw / vh, k = Math.min(window.devicePixelRatio || 1, 1.5);
      var cw = Math.min(vw * 0.6, 1100) * k;
      if (cw / ar > vh * 0.74 * k) cw = vh * 0.74 * k * ar;
      c.width = Math.round(cw);
      c.height = Math.round(cw / ar);
      c.setAttribute("role", "img");
      c.setAttribute("aria-label", "The bean study painted on this page");
      c.getContext("2d").drawImage(landC, 0, 0, c.width, c.height);
      art.appendChild(c);
    } else {
      var shots = [[w.photo, "The piece"]];
      if (w.detailPhoto) shots.push([w.detailPhoto, "Up close"]);
      if (w.homePhoto) shots.push([w.homePhoto, "At home"]);
      var big = el("img");
      big.alt = w.title;
      art.appendChild(big);
      function show(i) {
        big.src = shots[i][0];
        big.alt = w.title + ", " + shots[i][1].toLowerCase();
        art.classList.toggle("is-photo", i > 0);
        Array.prototype.forEach.call(thumbs.children, function (b, j) { b.setAttribute("aria-pressed", j === i ? "true" : "false"); });
      }
      if (shots.length > 1) {
        shots.forEach(function (sh, i) {
          var b = el("button"), t = el("img");
          b.type = "button";
          t.src = sh[0];
          t.alt = "";
          b.appendChild(t);
          b.appendChild(el("span", null, sh[1]));
          b.addEventListener("click", function () { show(i); });
          thumbs.appendChild(b);
        });
      }
      show(0);
    }
    if (viewer.showModal) viewer.showModal(); else viewer.setAttribute("open", "");
  }
  function closeViewer() {
    if (viewer.close) viewer.close(); else viewer.removeAttribute("open");
  }
  $("#v-close").addEventListener("click", closeViewer);
  viewer.addEventListener("click", function (ev) { if (ev.target === viewer) closeViewer(); });
  $("#v-ask").addEventListener("click", function () {
    if (viewing && !viewing.live) picker.value = viewing.title;
    closeViewer();
  });

  /* ---------- the enquiry ---------- */

  var enquiry = "";
  $("#c-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var name = $("#c-name").value.trim(), email = $("#c-email").value.trim(), msg = $("#c-idea").value.trim();
    var piece = picker.value, missing = [], err = $("#c-error");
    var general = picker.selectedIndex === 0;
    if (!name) missing.push("your name");
    if (!/^\S+@\S+\.\S+$/.test(email)) missing.push("an email address Hannah can reply to");
    if (general && !msg) missing.push("a short message");
    if (missing.length) {
      err.textContent = "Add " + missing.join(missing.length > 2 ? ", " : " and ").replace(/, ([^,]*)$/, ", and $1") + ", then try again.";
      err.hidden = false;
      return;
    }
    err.hidden = true;
    var about = general ? "" : (piece === "An idea of my own" ? "I have an idea for a piece of my own." : "I’m interested in “" + piece + "”.");
    enquiry = "Hi Hannah,\n\n" + (about ? about + "\n\n" : "") + (msg ? msg + "\n\n" : "") + "Thanks,\n" + name + "\n" + email;
    $("#c-text").textContent = enquiry;
    var mail = $("#c-mail"), help = $("#c-help");
    help.textContent = "";
    if (S.email) {
      mail.href = "mailto:" + S.email + "?subject=" + encodeURIComponent(general ? "A question from " + name : "About " + piece) + "&body=" + encodeURIComponent(enquiry);
      mail.hidden = false;
      help.appendChild(document.createTextNode("If the button does not open your email, send it to "));
      help.appendChild(el("strong", null, S.email));
      help.appendChild(document.createTextNode("."));
    } else {
      mail.hidden = true;
      help.textContent = "Copy the message and send it to Hannah.";
    }
    $("#c-copy").textContent = "Copy message";
    $("#c-out").hidden = false;
  });
  $("#c-copy").addEventListener("click", function () {
    var btn = this, pre = $("#c-text");
    function selectIt() {
      var range = document.createRange();
      range.selectNodeContents(pre);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      btn.textContent = "Selected, press copy";
    }
    try {
      navigator.clipboard.writeText(enquiry).then(function () { btn.textContent = "Copied"; }, selectIt);
    } catch (x) { selectIt(); }
  });

  /* ---------- start ---------- */

  var lastW = 0, lastH = 0, resizeT = 0;
  function relayout(rebuild) {
    measure();
    crema.resize();
    if (rebuild || Math.abs(vw - lastW) > 40 || Math.abs(vh - lastH) > lastH * 0.18) {
      lastW = vw;
      lastH = vh;
      buildPaper();
      buildLand();
      sheetPainted = false;
    }
    layoutGallery();
    cache();
    landKey = "";
    paperKey = "";
    liveStamp = -1;
  }
  window.addEventListener("resize", function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(function () { relayout(false); }, 180);
  });

  measure();
  lastW = vw;
  lastH = vh;
  layoutGallery();
  cache();
  buildPaper();
  setTimeout(buildLand, 250);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { layoutGallery(); cache(); sheetPainted = false; });
  }
  window.addEventListener("load", function () { layoutGallery(); cache(); });
  requestAnimationFrame(tick);
})();
