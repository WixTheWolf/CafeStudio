/* Cafe Studio: the scroll.

   The page opens in the café as Hannah sees it: macro loops of crema,
   steam and light, one spreading into the next like coffee on paper, until
   the last one clears to the sheet and leaves a ring. The ring blooms into
   the palette, and her three steps with the brush, filmed up close, move
   with the scroll. Then one of her paintings comes back together on the
   paper, wash by wash, and is framed and hung on the gallery wall with the
   rest of her work. From the wall you walk through her frames, one after
   another, into her close-ups; her kitchen photos drift by in morning
   light, and the lights go down in the night café, where she tells her
   story.

   Everything on the stage is a function of scroll position, so it plays
   the same forwards and backwards. The stage follows the scroll with a
   short glide, so a turn of the wheel moves it smoothly, and every chapter
   has beats (a line written, a painting in the middle of the wall, a frame
   at arm's length) that the page settles on when the reader stops near
   one. */
(function () {
  "use strict";

  var S = window.STUDIO, B = window.Brew, Reel = window.Reel, Develop = window.Develop;
  if (!S || !B || !Reel || !Develop) return;

  var doc = document.documentElement;
  doc.classList.add("js");
  var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

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

  var stageEl = $("#stage"), paperC = $("#paper"), devC = $("#dev"), devStill = $("#dev-still"), wall = $("#wall"), reelC = $("#reel");
  function slice(l) { return Array.prototype.slice.call(l); }
  var barMark = $(".bar-mark"), railLinks = Array.prototype.slice.call(document.querySelectorAll("#rail a"));
  var secReel = $("#top"), secRing = $("#medium"), secStr = $("#palette"), secBrush = $("#brush"), secLay = $("#process");
  var secGal = $("#work"), secThrough = $("#through"), secClose = $("#closer"), secHome = $("#home"), secNight = $("#artist"), sheetEl = $("#sheet");
  var hero = $("#hero"), pencil = $("#pencil");
  var track = $("#track"), gHead = $("#g-head");
  var SECTIONS = [secReel, secRing, secStr, secBrush, secLay, secGal, secThrough, secClose, secHome, secNight, sheetEl];
  var feature = S.work(S.feature);

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

  $("#feature-name").textContent = feature.title;
  $("#feature-done").textContent = feature.title + ", finished";
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
    var ws = S.inSeries(se.id);
    if (!ws.length) return;
    var g = el("optgroup");
    g.label = se.title;
    ws.forEach(function (w) { var o = el("option", null, w.title + " · " + S.priceText(w)); o.value = w.title; g.appendChild(o); });
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

  // The wall: each series behind its own wall text. The painting that was
  // just built on the paper is hung first, in the middle of the screen.
  var frames = [], hangItems = [], featureFrame = null;

  function makeFrame(w) {
    var fig = el("figure", "frame mount-" + w.mount);
    var btn = el("button", "frame-art");
    btn.type = "button";
    btn.setAttribute("aria-label", "View " + w.title);
    if (w.mount !== "panel" && w.mount !== "oval") {
      btn.innerHTML = '<svg class="frame-hang" viewBox="0 0 100 42" preserveAspectRatio="none" aria-hidden="true"><path d="M4 42 L50 2 L96 42"/></svg>';
    }
    var mould = el("span", "frame-moulding"), mat = el("span", "frame-mat"), media = el("img");
    media.src = w.photo;
    media.alt = w.title + ", " + w.medium.toLowerCase();
    media.decoding = "async";
    mat.appendChild(media);
    mould.appendChild(mat);
    btn.appendChild(mould);
    var cap = el("figcaption", "placard");
    cap.appendChild(el("span", "pl-title", w.title));
    cap.appendChild(el("span", "pl-meta", S.sizeText(w)));
    cap.appendChild(el("span", "pl-price", S.priceText(w)));
    fig.appendChild(btn);
    fig.appendChild(cap);
    track.appendChild(fig);
    var f = { w: w, fig: fig, art: btn, media: media, cssW: 0, cssH: 0, a: 0, v: 0, moving: false, x0: 0, dev: -1 };
    btn.addEventListener("click", function () { openViewer(w, 0); });
    frames.push(f);
    if (w === feature) featureFrame = f;
    return f;
  }

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
    ws.forEach(function (w) {
      var f = makeFrame(w);
      if (f !== featureFrame) hangItems.push(f.fig);
    });
  });

  /* ---------- measuring ---------- */

  var vw = 0, vh = 0, W = 0, H = 0, stageScale = 1, R1 = 0.28, ringR = 0;
  var hangLen = 0, trackLen = 0, trackShift = 0, stepCentres = [];
  var TRAVEL = 1.6;  // horizontal pixels travelled per pixel of scroll along the wall

  function measure() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    stageScale = Math.min(dpr, Math.sqrt(2.1e6 / (vw * vh)));
    W = Math.round(vw * stageScale);
    H = Math.round(vh * stageScale);
    R1 = vw < 760 ? 0.31 : 0.27;
    ringR = R1 * Math.min(W, H) * 0.8;
    doc.style.setProperty("--ring-r", (ringR / stageScale).toFixed(1) + "px");
  }

  function layoutGallery() {
    var fh = vw < 700 ? clamp(vh * 0.34, 150, 320) : clamp(vh * 0.4, 170, 480);
    frames.forEach(function (f) {
      var ar = f.w.ratio, h = fh * (f.w.mount === "art" ? 0.86 : 1), w = h * ar;
      if (w > vw * 0.74) { w = vw * 0.74; h = w / ar; }
      f.cssW = w;
      f.cssH = h;
      f.media.style.width = w.toFixed(1) + "px";
      f.media.style.height = h.toFixed(1) + "px";
    });
    // centre the feature painting; its wall text sits to its left
    track.style.paddingLeft = "0px";
    // (on a narrow screen that pushes the wall text off to the left)
    var ff = featureFrame.fig, pad = vw / 2 - (ff.offsetLeft + ff.offsetWidth / 2);
    track.style.paddingLeft = Math.max(16, pad).toFixed(1) + "px";
    track.style.paddingRight = Math.max(24, vw * 0.24).toFixed(1) + "px";
    trackShift = Math.min(0, pad - 16);
    frames.forEach(function (f) { f.x0 = f.fig.offsetLeft + f.fig.offsetWidth / 2; });
    trackLen = Math.max(0, track.scrollWidth - vw + trackShift);
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
  }

  // Each note on the process brings the painting through one stage while it
  // rises to the middle of the screen.
  function buildAt(pc) {
    var u = 0;
    for (var i = 0; i < stepCentres.length; i++) u += clamp((pc - (stepCentres[i] - 0.15)) / 0.15, 0, 1);
    return u;
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

  /* ---------- the painting ---------- */

  // Hannah's painting is rebuilt on the paper as the process notes scroll by,
  // then shrinks into its frame on the wall. One WebGL canvas covers the
  // screen and draws the painting inside a rectangle that moves.
  var dev = new Develop(devC, { maxScale: 1.25 });
  if (dev.ok) dev.load(feature.photo);
  devStill.src = feature.photo;
  var devOn = false;

  // k: 0 as the process section comes onto the screen, 1 once it fills it
  function processRect(k) {
    var mw = vw < 700 ? vw - 28 : Math.min(vw * 0.74, 1160), mh = vh * (vw < 700 ? 0.5 : 0.72);
    var w = mw, h = w / feature.ratio;
    if (h > mh) { h = mh; w = h * feature.ratio; }
    var rise = (1 - ease(k)) * vh * 0.16;
    // on a phone the painting sits under the bar, clear of the notes below
    var top = vw < 700 ? Math.max(72, vh * 0.1) : (vh - h) / 2 + vh * 0.02;
    return [(vw - w) / 2, top + rise, w, h];
  }

  function showPainting(rect, build, alpha, shadow) {
    if (dev.ok) {
      dev.draw({ a: feature.photo, rect: rect, build: build, alpha: alpha, shadow: shadow, seed: 4.2 });
      setO(devC, 1);
      setO(devStill, 0);
    } else {
      // without WebGL the finished painting simply fades in
      devStill.style.transform = "translate3d(" + rect[0].toFixed(1) + "px," + rect[1].toFixed(1) + "px,0)";
      devStill.style.width = rect[2].toFixed(1) + "px";
      devStill.style.height = rect[3].toFixed(1) + "px";
      setO(devStill, alpha * clamp(build / 4, 0, 1));
    }
  }
  function hidePainting() {
    setO(devC, 0);
    setO(devStill, 0);
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

  /* ---------- the café, through her eyes ---------- */

  // Five loops, each spreading over the last like coffee on paper. The last
  // clears to the sheet underneath, where the ring is waiting.
  var reel = new Reel(reelC, { maxScale: 1.25 });
  var reelStill = $("#reel-still"), clips = Array.prototype.slice.call(document.querySelectorAll("#reel-src video"));
  var reelLines = Array.prototype.slice.call(document.querySelectorAll("#reel-lines .reel-line"));
  var stills = clips.map(function (v) {
    var im = el("img");
    im.src = v.getAttribute("poster");
    im.alt = "";
    im.decoding = "async";
    reelStill.appendChild(im);
    return im;
  });
  var motion = reel.ok && !reduce;
  if (!motion) doc.classList.add("reel-still-mode");
  // where each move to the next loop starts (share of the section), and
  // where on screen each stain starts
  var MOVES = [0.09, 0.28, 0.47, 0.66], MOVE = 0.1, CLEAR0 = 0.85, CLEAR1 = 0.95;
  var FROM = [[0.5, 0.6], [0.26, 0.38], [0.74, 0.6], [0.5, 0.45]];
  var BLOOM = clips.length - 1, bloomOn = false;

  // Moving the pointer stirs the coffee (and tilts the kitchen photos).
  var stir = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, s: 0, lx: -1, ly: -1 };
  var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("pointermove", function (e) {
    var x = e.clientX / vw, y = e.clientY / vh;
    mouse.tx = x * 2 - 1;
    mouse.ty = -(y * 2 - 1);
    if (stir.lx >= 0) stir.s = Math.min(1.3, stir.s + Math.hypot(x - stir.lx, y - stir.ly) * 4);
    stir.lx = x;
    stir.ly = y;
    stir.tx = x;
    stir.ty = y;
  }, { passive: true });

  function setO(e, o) {
    var v = o.toFixed(3);
    if (e._o !== v) { e.style.opacity = v; e._o = v; }
  }
  // Ask a loop to play once; if the browser refuses (some phones do, in
  // low power mode), it waits on its first frame until the next tap.
  function play(v, on) {
    if (on) {
      if (v.preload !== "auto") v.preload = "auto";
      if (v.paused && motion && !v._asked) {
        v._asked = true;
        var pr = v.play();
        if (pr && pr.then) pr.then(function () { v._asked = false; }, function () { /* until a tap */ });
        else v._asked = false;
      }
    } else {
      v._asked = false;
      if (!v.paused) v.pause();
    }
  }
  function nudge() {
    clips.forEach(function (v) { if (v._want && v.paused) { v._asked = false; play(v, true); } });
  }
  ["pointerdown", "touchend", "keydown"].forEach(function (t) { window.addEventListener(t, nudge, { passive: true }); });

  function updateReel(y, now) {
    var p = pinP(secReel, y), inView = y < secReel._top + secReel._h;
    // the loop on screen, and how far the next has spread over it
    var cur = 0, mix = 0, i;
    for (i = 0; i < MOVES.length; i++) {
      if (p < MOVES[i]) break;
      if (p < MOVES[i] + MOVE) { mix = (p - MOVES[i]) / MOVE; break; }
      cur = i + 1;
    }
    var clear = smooth(CLEAR0, CLEAR1, p), live = inView && clear < 1;
    var next = mix > 0 ? cur + 1 : -1;
    // the bloom plays once, from the moment it starts to spread
    var bloomIn = live && (cur === BLOOM || next === BLOOM);
    if (bloomIn && !bloomOn) { try { clips[BLOOM].currentTime = 0; } catch (e) { /* not loaded */ } }
    bloomOn = bloomIn;
    for (i = 0; i < clips.length; i++) {
      clips[i]._want = live && (i === cur || i === next);
      play(clips[i], clips[i]._want);
      if (live && i === cur + 1 && clips[i].preload !== "auto") clips[i].preload = "auto";
    }

    stir.x = lerp(stir.x, stir.tx, 0.08);
    stir.y = lerp(stir.y, stir.ty, 0.08);
    stir.s *= 0.94;
    var drawn = false;
    if (live && motion) {
      drawn = reel.draw({ a: clips[cur], b: next >= 0 ? clips[next] : null, mix: ease(mix), from: FROM[cur],
        clear: clear, stir: [stir.x, stir.y], swirl: stir.s * 0.9, time: now / 1000,
        zoom: 1.05 + 0.025 * Math.sin(now / 7000 + cur), seed: 2.3 + cur * 1.7 });
    }
    setO(reelC, drawn ? 1 : 0);
    // the posters sit underneath until the loops are playing, and stand in
    // for them without WebGL or with reduced motion
    for (i = 0; i < stills.length; i++) setO(stills[i], i === cur ? 1 : i === next ? smooth(0.2, 0.8, mix) : 0);
    setO(reelStill, inView && !drawn ? 1 - clear : 0);

    var heroO = 1 - smooth(0.03, MOVES[0] + 0.03, p);
    setO(hero, heroO);
    hero.style.transform = "translate3d(0," + (-smooth(0, MOVES[0] + 0.05, p) * 70).toFixed(1) + "px,0)";
    setO(barMark, 1 - heroO);
    for (i = 0; i < reelLines.length; i++) {
      var h0 = MOVES[i] + MOVE, h1 = i + 1 < MOVES.length ? MOVES[i + 1] : CLEAR0;
      var o = smooth(h0 - 0.01, h0 + 0.03, p) * (1 - smooth(h1 - 0.02, h1 + 0.01, p));
      setO(reelLines[i], o);
      reelLines[i].style.transform = "translate3d(0," + ((1 - o) * 24).toFixed(1) + "px,0)";
    }
    setO(pencil, smooth(CLEAR1 - 0.02, CLEAR1 + 0.02, p));
    // dark while the café still covers the top of the screen
    return inView && clear < 0.35;
  }

  /* ---------- the brush ---------- */

  // Hannah's three steps, filmed up close: a pale wash, stronger strokes,
  // then the finest details. The footage arrives as a stain spreading over
  // the paper, and the scroll moves the brush: each clip is scrubbed, not
  // played, so the stroke goes as far as the reader does.
  var brushC = $("#brush-reel"), brushReel = new Reel(brushC, { maxScale: 1.25 });
  var brushStill = $("#brush-still"), brushClips = slice(document.querySelectorAll("#brush-src video"));
  var brushLines = slice(document.querySelectorAll("#brush-lines .reel-line")), brushCue = $("#brush-cue");
  var brushStills = brushClips.map(function (v) {
    var im = el("img");
    im.src = v.getAttribute("poster");
    im.alt = "";
    im.decoding = "async";
    brushStill.appendChild(im);
    return im;
  });
  var brushMotion = brushReel.ok && !reduce;
  // each clip's stretch of the section, where the next spreads over it,
  // and where each stain starts
  var BSPAN = [[0.02, 0.42], [0.34, 0.7], [0.62, 0.97]], BMOVES = [0.34, 0.62], BMOVE = 0.08;
  var BFROM = [[0.5, 0.55], [0.3, 0.5], [0.72, 0.45]];
  // where each line is fully written
  var BHOLDS = [[0.06, 0.32], [0.43, 0.61], [0.71, 0.88]];
  // where the brush is already in shot in each clip, in seconds
  var BIN = [0.9, 0.2, 1.5];

  function scrub(v, t, t0) {
    if (v.preload !== "auto") v.preload = "auto";
    if (!v.duration || v.readyState < 1 || v.seeking) return;
    var to = t0 + clamp(t, 0, 1) * (v.duration - t0 - 0.05);
    if (Math.abs(v.currentTime - to) > 0.02) { try { v.currentTime = to; } catch (e) { /* not seekable yet */ } }
  }

  function updateBrush(y, now) {
    var near = y + vh * 2.5 > secBrush._top && y < secBrush._top + secBrush._h;
    if (!near) {
      setO(brushC, 0);
      setO(brushStill, 0);
      return false;
    }
    var p = pinP(secBrush, y), cur = 0, mix = 0, i;
    for (i = 0; i < BMOVES.length; i++) {
      if (p < BMOVES[i]) break;
      if (p < BMOVES[i] + BMOVE) { mix = (p - BMOVES[i]) / BMOVE; break; }
      cur = i + 1;
    }
    var next = mix > 0 ? cur + 1 : -1;
    // it rises into view from the bottom of the screen as the palette leaves
    var reveal = smooth(-0.75, 0.04, (y - secBrush._top) / vh), clear = smooth(0.9, 0.975, p);
    var live = reveal > 0 && clear < 1;
    for (i = 0; i < brushClips.length; i++) scrub(brushClips[i], (p - BSPAN[i][0]) / (BSPAN[i][1] - BSPAN[i][0]), BIN[i]);
    var drawn = false;
    if (live && brushMotion) {
      drawn = brushReel.draw({ a: brushClips[cur], b: next >= 0 ? brushClips[next] : null, mix: ease(mix), from: reveal < 1 ? [0.5, 1.15] : BFROM[cur],
        reveal: reveal, clear: clear, stir: [stir.x, stir.y], swirl: stir.s * 0.7, time: now / 1000, zoom: 1.03, seed: 7.1 + cur * 1.3 });
    }
    setO(brushC, drawn ? 1 : 0);
    for (i = 0; i < brushStills.length; i++) setO(brushStills[i], i === cur ? 1 : i === next ? smooth(0.2, 0.8, mix) : 0);
    setO(brushStill, live && !drawn ? Math.min(reveal, 1 - clear) : 0);
    for (i = 0; i < brushLines.length; i++) {
      var o = smooth(BHOLDS[i][0] - 0.02, BHOLDS[i][0] + 0.03, p) * (1 - smooth(BHOLDS[i][1] - 0.02, BHOLDS[i][1] + 0.01, p));
      setO(brushLines[i], o);
      brushLines[i].style.transform = "translate3d(0," + ((1 - o) * 24).toFixed(1) + "px,0)";
    }
    setO(brushCue, smooth(0.05, 0.09, p) * (1 - smooth(0.26, 0.31, p)));
    // dark once the footage has the top of the screen to itself
    return live && reveal > 0.6 && clear < 0.35 && y > secBrush._top - vh * 0.08;
  }

  /* ---------- step inside ---------- */

  // Seven of her paintings, hung one behind another. Scrolling walks through
  // them: each frame comes forward until its painting fills the screen, then
  // the painting opens from the middle and the next one is waiting behind
  // it. The last one stays, and its close-up is the next thing on the page.
  var TUNNEL = ["breakfast-with-brooklyn", "coffee-house", "every-last-crumb", "al-banco", "iced-americana",
    "sticky-honey-pancake-balls", "a-pleasant-pause"].map(S.work).filter(function (w) { return w && w.photo; });
  var tunnel = $("#tunnel"), throughHead = $("#through-head");
  var tfs = TUNNEL.map(function (w, i) {
    var fig = el("figure", "tf mount-" + w.mount), btn = el("button", "tf-art");
    var mould = el("span", "frame-moulding"), mat = el("span", "frame-mat"), im = el("img");
    btn.type = "button";
    btn.setAttribute("aria-label", "View " + w.title);
    im.src = w.photo;
    im.alt = w.title + ", " + w.medium.toLowerCase();
    im.decoding = "async";
    mat.appendChild(im);
    mould.appendChild(mat);
    btn.appendChild(mould);
    fig.appendChild(btn);
    var cap = el("figcaption", "tf-cap");
    cap.appendChild(el("span", "tf-t", w.title));
    cap.appendChild(el("span", "tf-s", S.spec(w)));
    fig.appendChild(cap);
    btn.addEventListener("click", function () { openViewer(w, 0); });
    tunnel.appendChild(fig);
    return { w: w, fig: fig, im: im, cap: cap, side: i % 2 ? 1 : -1, key: "", hole: "" };
  });
  if (reduce) doc.classList.add("tunnel-flat");
  // the camera starts in front of the first frame and ends inside the last
  var CAM0 = -1.15, CAM1 = tfs.length - 1 + 0.18;
  // where frame i hangs close, whole and captioned
  function frameAt(i) { return (i - 0.22 - CAM0) / (CAM1 - CAM0); }

  function layoutTunnel() {
    tfs.forEach(function (t) {
      var h = Math.min(vh * 0.5, vw * 0.62 / t.w.ratio) * (t.w.mount === "art" ? 0.86 : 1);
      t.im.style.height = h.toFixed(1) + "px";
      t.im.style.width = (h * t.w.ratio).toFixed(1) + "px";
    });
  }

  function updateThrough(y) {
    if (reduce || y + vh < secThrough._top || y > secThrough._top + secThrough._h) return;
    var p = pinP(secThrough, y), n = tfs.length, cam = lerp(CAM0, CAM1, p);
    setO(throughHead, 1 - smooth(0.015, 0.08, p));
    for (var i = 0; i < n; i++) {
      var t = tfs[i], r = i - cam, last = i === n - 1;
      var s = 0.72 / Math.max(0.03, r + 0.36);
      var o = (1 - smooth(2.3, 3.3, r)) * (last ? 1 : 1 - smooth(0.06, 0.24, -r));
      var tf = "";
      if (o > 0.001) {
        // far frames hang a little off to the side, and straighten as they come
        var lean = smooth(0, 2.4, r);
        tf = "translate(-50%,-50%) translate3d(" + (t.side * vw * 0.07 * lean).toFixed(1) + "px," + (vh * 0.03 * lean).toFixed(1) +
          "px,0) scale(" + s.toFixed(4) + ") rotate(" + (t.side * 2.4 * lean).toFixed(2) + "deg)";
      }
      if (tf !== t.key) {
        t.fig.style.transform = tf;
        t.fig.style.visibility = tf ? "visible" : "hidden";
        t.fig.style.zIndex = String(Math.round(1000 - r * 100));
        t.key = tf;
      }
      setO(t.fig, o);
      // passing through: the painting opens from the middle, like a wet wash
      var hole = last ? -40 : lerp(-40, 120, smooth(1.7, 3.4, s));
      var hk = hole <= -40 ? "" : hole.toFixed(1) + "%";
      if (hk !== t.hole) {
        t.fig.classList.toggle("opening", !!hk);
        if (hk) t.fig.style.setProperty("--h", hk);
        t.hole = hk;
      }
      setO(t.cap, smooth(0.3, 0.46, s) * (1 - smooth(1.34, 1.7, s)));
    }
  }

  /* ---------- the gallery ---------- */

  var lastTx = 0;
  function updateGallery(y, pcL) {
    var d = y - secGal._top;
    var e = clamp(d / (hangLen * 0.78), 0, 1), ee = ease(e);
    var reveal = smooth(0.72, 1, d / hangLen);
    // the room darkens from the edges in, like a spotlight closing on the painting
    setO(wall, d > 0 ? 1 : 0);
    var hole = d > 0 ? lerp(105, -22, ease(smooth(0, 0.85, e))) : 105;
    if (wall._hole !== hole) { wall.style.setProperty("--hole", hole.toFixed(2) + "%"); wall._hole = hole; }
    var f0 = featureFrame;
    // the painting on the paper, then on its way into the frame
    var k = smooth(0.3, 0.95, (y + vh - secLay._top) / vh), on = smooth(0, 0.35, k);
    if (on > 0 && e < 1) {
      var R = processRect(k);
      if (d > 0) {
        var T = f0.media.getBoundingClientRect();
        R = [lerp(R[0], T.left, ee), lerp(R[1], T.top, ee), lerp(R[2], T.width, ee), lerp(R[3], T.height, ee)];
      }
      var line = vw < 700 ? (y + vh * 0.8 - secLay._top) / secLay._h : pcL;
      showPainting(R, d > 0 ? 4 : buildAt(line), on, 1 - ee);
      devOn = true;
    } else if (devOn) {
      hidePainting();
      devOn = false;
    }
    f0.media.style.visibility = e >= 1 ? "visible" : "hidden";
    setO(f0.fig, smooth(0.55, 0.95, e));
    for (var i = 0; i < hangItems.length; i++) {
      setO(hangItems[i], reveal);
      hangItems[i].style.transform = reveal < 1 ? "translate3d(" + ((1 - reveal) * 90).toFixed(1) + "px,0,0)" : "";
    }
    setO(gHead, reveal);
    var tx = trackShift - clamp((d - hangLen) * TRAVEL / Math.max(1, trackLen), 0, 1) * trackLen;
    if (tx !== lastTx) { track.style.transform = "translate3d(" + tx.toFixed(1) + "px,0,0)"; lastTx = tx; }
    developFrames(tx);
    return e;
  }

  // Photos on the wall start pale and soft, like a wash that has just gone
  // down, and dry to their true tones as they slide towards the middle.
  function developFrames(tx) {
    for (var i = 0; i < frames.length; i++) {
      var f = frames[i];
      if (f === featureFrame) continue;
      var x = f.x0 + tx, dv = reduce ? 1 : Math.round((1 - smooth(vw * 0.5, vw * 1.05, x)) * 40) / 40;
      if (dv === f.dev) continue;
      f.dev = dv;
      var w = 1 - dv;
      f.media.style.filter = dv >= 1 ? "" : "brightness(" + (1 + 0.42 * w).toFixed(3) + ") contrast(" + (1 - 0.5 * w).toFixed(3) +
        ") saturate(" + (1 - 0.45 * w).toFixed(3) + ") blur(" + (2.6 * w).toFixed(2) + "px)";
    }
  }

  /* ---------- up close ---------- */

  // Hannah's close-ups fill the screen. Each one drifts in to look closer
  // and back out again, then the next spreads over it like spilled coffee.
  var closeShots = ["a-pleasant-pause", "but-first-tabby", "a-classic-breakfast", "fresh-baked"].map(S.work).filter(function (w) { return w && w.detailPhoto; });
  var closeC = $("#close-dev"), closeDev = new Develop(closeC, { maxScale: 1.25 });
  var closeHead = $("#close-head"), closeCaps = [], closeDots = [], closeStills = [];
  var FROMS = [[0.12, 0.85], [0.88, 0.2], [0.25, 0.15], [0.82, 0.88]];
  var DRIFT = [[0.05, -0.03], [-0.06, 0.02], [0.04, 0.04], [-0.04, -0.03]];
  $("#close-note").textContent = S.care.note;
  closeShots.forEach(function (w, i) {
    if (closeDev.ok) closeDev.load(w.detailPhoto);
    else {
      var im = el("img");
      im.src = w.detailPhoto;
      im.alt = "";
      $("#close-stills").appendChild(im);
      closeStills.push(im);
    }
    var se = S.seriesOf(w.series), li = el("li", "close-cap");
    li.appendChild(el("span", "cc-n", (i < 9 ? "0" : "") + (i + 1) + " / " + (closeShots.length < 10 ? "0" : "") + closeShots.length));
    li.appendChild(el("span", "cc-t", w.title));
    li.appendChild(el("span", "cc-s", (se ? se.title + " · " : "") + "detail"));
    $("#close-caps").appendChild(li);
    closeCaps.push(li);
    var dot = el("li");
    $("#close-dots").appendChild(dot);
    closeDots.push(dot);
  });

  function updateClose(y) {
    if (y + vh < secClose._top || y > secClose._top + secClose._h) return;
    var n = closeShots.length, p = pinP(secClose, y) * n, i = Math.min(n - 1, Math.floor(p)), f = p - i;
    var breathe = Math.sin(Math.PI * clamp(f, 0, 1));
    var zoom = 1.04 + 0.22 * breathe, dr = DRIFT[i % DRIFT.length];
    var mix = i < n - 1 ? smooth(0.76, 1, f) : 0;
    if (closeDev.ok) {
      closeDev.draw({
        a: closeShots[i].detailPhoto, b: i < n - 1 ? closeShots[i + 1].detailPhoto : null, mix: mix,
        rect: [0, 0, vw, vh], zoom: zoom, pan: [dr[0] * breathe, dr[1] * breathe], from: FROMS[i % FROMS.length], seed: 2.3 + i
      });
    } else {
      closeStills.forEach(function (im, k) { setO(im, k === i ? 1 - mix : k === i + 1 ? mix : 0); });
    }
    setO(closeHead, 1 - smooth(0.3, 0.55, p));
    closeCaps.forEach(function (c, k) {
      var o = smooth(k + (k ? 0.02 : 0.5), k + (k ? 0.14 : 0.64), p) * (k < n - 1 ? 1 - smooth(k + 0.8, k + 0.92, p) : 1);
      setO(c, o);
    });
    closeDots.forEach(function (d, k) { d.classList.toggle("on", k === Math.round(clamp(p - 0.1, 0, n - 1))); });
  }

  /* ---------- at home ---------- */

  // Kitchen photos drift past at different depths in morning light.
  var homeWorks = (S.atHome || []).map(S.work).filter(function (w) { return w && w.photo && w.homePhoto; });
  // left %, top % of the section, width in vw, turn, depth
  var SPOTS = [[4, 3, 22, -3, 0.9], [71, 1, 24, 2.5, 0.55], [76, 31, 18, -2, 1.35], [3, 35, 19, 2.6, 1.45], [38, 3, 15, 1.4, 1.7],
    [62, 57, 23, 1.8, 1.0], [5, 67, 22, -2.4, 0.6], [34, 80, 19, -1.2, 1.25], [79, 79, 16, -3, 1.55], [18, 52, 14, 2.2, 1.8]];
  var homeEls = homeWorks.slice(0, SPOTS.length).map(function (w, i) {
    var b = el("button", "hp"), im = el("img"), sp = SPOTS[i];
    b.type = "button";
    b.setAttribute("aria-label", w.title + " at home");
    im.src = w.homePhoto;
    im.alt = "";
    im.loading = "lazy";
    im.decoding = "async";
    b.appendChild(im);
    b.style.left = sp[0] + "%";
    b.style.top = sp[1] + "%";
    b.addEventListener("click", function () { openViewer(w, -1); });
    $("#home-photos").appendChild(b);
    return { b: b, sp: sp, key: "" };
  });

  function layoutHome() {
    var k = vw < 700 ? 2 : 1.22;
    homeEls.forEach(function (h) { h.b.style.width = Math.min(h.sp[2] * k, 46) + "vw"; });
  }

  function updateHome(y) {
    if (y + vh < secHome._top || y > secHome._top + secHome._h) return;
    var c = centreP(secHome, y) - 0.5;
    homeEls.forEach(function (h) {
      var z = h.sp[4], dy = -c * z * vh * 0.7 + mouse.y * z * 8, dx = mouse.x * z * -10;
      var tf = "translate3d(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px,0) rotate(" + (h.sp[3] + c * z * 3).toFixed(2) + "deg)";
      if (tf !== h.key) { h.b.style.transform = tf; h.key = tf; }
    });
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

  /* ---------- the beats ---------- */

  // Each chapter has moments where everything is in place: a line fully
  // written, a painting in the middle of the wall, a frame at arm's length.
  // When the reader stops scrolling, the page glides on to the next beat
  // in the direction they were going, or back to one they have only just
  // passed, so one turn of the wheel or one swipe is one step of the story.
  // It never pulls back to where a scroll started, so it cannot hold anyone
  // in place, and it lets go at the first touch, turn of the wheel or key.
  // Hannah's story and the enquiry form at the end scroll freely.
  var beatYs = [];

  function atPin(sec, p) { return sec._top + p * Math.max(1, sec._h - vh); }
  function atCentre(e) {
    var r = e.getBoundingClientRect();
    return r.top + window.scrollY + r.height / 2 - vh / 2;
  }

  function beats() {
    var ys = [], i;
    // the café: the title, each line, then the ring left on clean paper
    ys.push(atPin(secReel, 0));
    for (i = 0; i < MOVES.length; i++) ys.push(atPin(secReel, (MOVES[i] + MOVE + (i + 1 < MOVES.length ? MOVES[i + 1] : CLEAR0)) / 2));
    ys.push(atPin(secReel, 1));
    // her two notes on the medium, every tone of the palette, each step with the brush
    slice(secRing.querySelectorAll(".beat")).forEach(function (b) { ys.push(atCentre(b)); });
    ys.push(atPin(secStr, 0.62));
    BHOLDS.forEach(function (h) { ys.push(atPin(secBrush, (h[0] + h[1]) / 2)); });
    // each note on the process, with its layer down
    ys.push(atCentre($(".process-head")));
    stepEls.forEach(function (e) { ys.push(atCentre(e)); });
    ys.push(atCentre($(".finish")));
    // the painting hung, then each painting on the wall in the middle of the screen
    var run = trackLen / TRAVEL, far = 0;
    ys.push(secGal._top + hangLen);
    frames.forEach(function (f) {
      var d = (f.x0 + trackShift - vw / 2) / TRAVEL;
      if (d > 8 && d <= run) ys.push(secGal._top + hangLen + d);
      far = Math.max(far, d);
    });
    // and the end of the wall, if the last painting is too near it to reach the middle
    if (far > run + 8) ys.push(secGal._top + hangLen + run);
    // through the frames, each one at arm's length
    if (!reduce) {
      ys.push(atPin(secThrough, 0));
      for (i = 0; i < tfs.length; i++) ys.push(atPin(secThrough, frameAt(i)));
    }
    // each close-up at its closest, then the kitchen
    ys.push(atPin(secClose, 0));
    for (i = 0; i < closeShots.length; i++) ys.push(atPin(secClose, (i ? i + 0.5 : 0.75) / closeShots.length));
    // the kitchen, with its photos level (its note is sticky, so the middle of the section)
    ys.push(secHome._top + secHome._h / 2 - vh / 2);
    return ys;
  }

  function layoutBeats() {
    var max = document.documentElement.scrollHeight - vh;
    beatYs = reduce ? [] : beats().map(function (y) { return Math.round(clamp(y, 0, max)); }).sort(function (a, b) { return a - b; });
  }

  var restY = window.scrollY, lastMove = 0, lastRy = -1, touching = false, settle = null, jumped = false;
  // the reader takes over mid-glide: their scroll starts from here
  function letGo() {
    if (settle) restY = window.scrollY;
    settle = null;
  }
  ["wheel", "keydown", "pointerdown"].forEach(function (t) { window.addEventListener(t, letGo, { passive: true }); });
  window.addEventListener("touchstart", function () { touching = true; letGo(); }, { passive: true });
  window.addEventListener("touchend", function () { touching = false; }, { passive: true });
  window.addEventListener("touchcancel", function () { touching = false; }, { passive: true });
  // a chapter link lands on the top of its section: carry on to its first beat
  document.addEventListener("click", function (ev) {
    if (ev.target.closest && ev.target.closest('a[href^="#"]')) jumped = true;
  });

  // where to settle from ry, after a scroll that started at restY
  function beatFor(ry) {
    var dir = ry > restY ? 1 : ry < restY ? -1 : 0, i, b, ahead = null, passed = null;
    if (!dir) return null;
    for (i = 0; i < beatYs.length; i++) {
      b = beatYs[i];
      if (Math.abs(b - ry) <= 2) return null;             // already on one
      if ((b - ry) * dir > 0) { if (ahead === null || Math.abs(b - ry) < Math.abs(ahead - ry)) ahead = b; }
      else if ((b - restY) * dir > 2 && (passed === null || Math.abs(b - ry) < Math.abs(passed - ry))) passed = b;
    }
    if (ahead !== null && Math.abs(ahead - ry) > vh * 2.9) ahead = null;
    if (passed !== null && Math.abs(passed - ry) > vh * 0.35) passed = null;
    if (ahead === null) return passed;
    if (passed === null) return ahead;
    return Math.abs(passed - ry) < Math.abs(ahead - ry) ? passed : ahead;
  }

  function settleStep(ry, now) {
    if (ry !== lastRy) { lastRy = ry; lastMove = now; }
    if (settle) {
      var t = clamp((now - settle.t0) / settle.d, 0, 1), to = Math.round(lerp(settle.from, settle.to, ease(t)));
      if (to !== ry) window.scrollTo(0, to);
      if (t >= 1) { restY = settle.to; settle = null; }
      return;
    }
    if (touching || now - lastMove < 170 || ry === restY || !beatYs.length) return;
    // not in a dialog, and not once the reader is into Hannah's story
    if ((viewer && viewer.open) || (film && film.open) || ry > secNight._top - vh * 0.5) { restY = ry; return; }
    if (jumped) { restY = ry - 1; jumped = false; }
    var to = beatFor(ry);
    if (to === null) { restY = ry; return; }
    var dist = Math.abs(to - ry) / vh;
    settle = { from: ry, to: to, t0: now, d: 300 + 360 * Math.min(2.6, dist) };
  }

  /* ---------- the frame loop ---------- */

  var currentWorld = "reel";
  function worldAt(line) {
    if (line < secRing._top) return "reel";
    if (line < secStr._top) return "ring";
    if (line < secBrush._top) return "strength";
    if (line < secLay._top) return "brush";
    if (line < secGal._top) return "layers";
    if (line < secThrough._top) return "gallery";
    if (line < secClose._top) return "through";
    if (line < secHome._top) return "closer";
    if (line < secNight._top) return "home";
    if (line < sheetEl._top) return "night";
    return "sheet";
  }

  // The stage follows the scroll a fraction of a second behind, so a turn
  // of the wheel glides instead of jumping. A jump across the page (the
  // rail, a link) is taken at once.
  var sy = -1, lastNow = 0;
  function glide(ry, now) {
    var dt = lastNow ? Math.min(64, now - lastNow) : 16;
    lastNow = now;
    if (reduce || sy < 0 || Math.abs(ry - sy) > vh * 2.5) sy = ry;
    else {
      sy += (ry - sy) * (1 - Math.exp(-dt / 90));
      if (Math.abs(ry - sy) < 0.3) sy = ry;
    }
    return sy;
  }

  function tick(now) {
    requestAnimationFrame(tick);
    var ry = window.scrollY;
    settleStep(ry, now);
    ry = window.scrollY;
    var y = glide(ry, now);
    mouse.x = lerp(mouse.x, mouse.tx, 0.05);
    mouse.y = lerp(mouse.y, mouse.ty, 0.05);

    var reelDark = updateReel(y, now);
    var brushDark = updateBrush(y, now);

    var pr = smooth(-0.2, 0.55, centreP(secRing, y));
    var pS = pinP(secStr, y);
    // the stain becomes the palette: the ring fades as the swatches bloom
    drawPaper(pr, 1 - 0.78 * smooth(0, 0.3, pS), 1 - smooth(0, 0.26, pS));
    for (var i = 0; i < swatchEls.length; i++) {
      var t = smooth(0.02 + i * 0.07, 0.16 + i * 0.07, pS), c = swatchEls[i];
      setO(c, t);
      var tf = t < 1 ? "scale(" + lerp(0.55, 1, ease(t)).toFixed(3) + ") rotate(" + ((1 - t) * -10).toFixed(2) + "deg)" : "";
      if (c._tf !== tf) { c.style.transform = tf; c._tf = tf; }
    }

    var pcL = centreP(secLay, y);
    var e = updateGallery(y, pcL);
    updateThrough(y);
    updateClose(y);
    updateHome(y);
    if (!sheetPainted && y + vh * 2 > sheetEl._top) paintSheet();
    if (y + vh > secNight._top && y < secNight._top + secNight._h) drawSteam(now);

    var inGallery = y >= secGal._top - vh && y < secThrough._top;
    sway(y, inGallery && e >= 1);

    var world = worldAt(ry + vh / 2);
    if (world !== currentWorld) {
      currentWorld = world;
      railLinks.forEach(function (a) { a.classList.toggle("on", a.getAttribute("data-for") === world); });
    }
    var top = worldAt(ry + 40), tone = "light";
    if (top === "reel") tone = reelDark ? "dark" : "light";
    else if (top === "brush" || top === "strength") tone = brushDark ? "dark" : "light";
    else if (top === "through") tone = "dark";
    else if (top === "gallery") tone = e > 0.35 ? "dark" : "light";
    else if (top === "night" || top === "closer") tone = "dark";
    if (doc.getAttribute("data-tone") !== tone) doc.setAttribute("data-tone", tone);
    if (doc.getAttribute("data-top") !== top) doc.setAttribute("data-top", top);
  }

  /* ---------- shortcuts ---------- */

  // "Work" skips the hanging and lands on the wall.
  Array.prototype.forEach.call(document.querySelectorAll('a[href="#work"]'), function (a) {
    a.addEventListener("click", function (ev) {
      ev.preventDefault();
      window.scrollTo({ top: secGal._top + hangLen, behavior: reduce ? "auto" : "smooth" });
    });
  });

  /* ---------- the viewer ---------- */

  var viewer = $("#viewer"), viewing = null;
  // start: which shot to show first; -1 is the last one (at home)
  function openViewer(w, start) {
    var art = $("#v-art"), thumbs = $("#v-thumbs");
    viewing = w;
    var se = S.seriesOf(w.series);
    $("#v-title").textContent = w.title;
    $("#v-meta").textContent = se ? se.title : "Original";
    $("#v-blurb").textContent = w.medium + ", " + S.sizeText(w).replace(/^Size/, "size") + ". An original, painted by hand with coffee.";
    $("#v-price").textContent = S.priceText(w);
    $("#v-note").textContent = "Frames in the photos are for staging and are not included. Pricing does not include shipping.";
    art.innerHTML = "";
    thumbs.innerHTML = "";
    art.className = "v-art mount-" + w.mount;
    var shots = [[w.photo, "The piece"]];
    w.detailPhotos.forEach(function (p) { shots.push([p, "Up close"]); });
    if (w.homePhoto) shots.push([w.homePhoto, "At home"]);
    var big = el("img");
    big.alt = w.title;
    art.appendChild(big);
    var show = function (i) {
      big.src = shots[i][0];
      big.alt = w.title + ", " + shots[i][1].toLowerCase();
      art.classList.toggle("is-photo", i > 0);
      Array.prototype.forEach.call(thumbs.children, function (b, j) { b.setAttribute("aria-pressed", j === i ? "true" : "false"); });
    };
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
    show(start < 0 ? shots.length - 1 : start || 0);
    if (viewer.showModal) viewer.showModal(); else viewer.setAttribute("open", "");
  }
  function closeViewer() {
    if (viewer.close) viewer.close(); else viewer.removeAttribute("open");
  }
  $("#v-close").addEventListener("click", closeViewer);
  viewer.addEventListener("click", function (ev) { if (ev.target === viewer) closeViewer(); });
  $("#v-ask").addEventListener("click", function () {
    if (viewing) picker.value = viewing.title;
    closeViewer();
  });

  /* ---------- the film ---------- */

  var film = $("#film"), filmVideo = $("#film-video");
  function openFilm() {
    if (film.showModal) film.showModal(); else film.setAttribute("open", "");
    try { filmVideo.currentTime = 0; } catch (e) { /* not loaded yet */ }
    var p = filmVideo.play();
    if (p && p.catch) p.catch(function () { /* the controls are there to start it */ });
  }
  function closeFilm() {
    filmVideo.pause();
    if (film.close) film.close(); else film.removeAttribute("open");
  }
  $("#film-btn").addEventListener("click", openFilm);
  $("#film-close").addEventListener("click", closeFilm);
  film.addEventListener("click", function (ev) { if (ev.target === film) closeFilm(); });
  film.addEventListener("close", function () { filmVideo.pause(); });
  if (location.hash === "#film") setTimeout(openFilm, 400);

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
    var chosen = S.works.filter(function (w) { return w.title === piece; })[0];
    var about = general ? "" : (piece === "An idea of my own" ? "I have an idea for a piece of my own." : "I’m interested in “" + piece + "”" + (chosen && chosen.price ? " (" + S.priceText(chosen) + ")" : "") + ".");
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
    reel.resize(vw, vh);
    brushReel.resize(vw, vh);
    dev.resize(vw, vh);
    closeDev.resize(vw, vh);
    if (rebuild || Math.abs(vw - lastW) > 40 || Math.abs(vh - lastH) > lastH * 0.18) {
      lastW = vw;
      lastH = vh;
      buildPaper();
      sheetPainted = false;
    }
    layoutGallery();
    layoutHome();
    layoutTunnel();
    cache();
    layoutBeats();
    paperKey = "";
  }
  window.addEventListener("resize", function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(function () { relayout(false); }, 180);
  });

  measure();
  reel.resize(vw, vh);
  brushReel.resize(vw, vh);
  lastW = vw;
  lastH = vh;
  dev.resize(vw, vh);
  closeDev.resize(vw, vh);
  layoutGallery();
  layoutHome();
  layoutTunnel();
  cache();
  layoutBeats();
  buildPaper();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { layoutGallery(); cache(); layoutBeats(); sheetPainted = false; });
  }
  window.addEventListener("load", function () { layoutGallery(); cache(); layoutBeats(); });
  requestAnimationFrame(tick);
})();
