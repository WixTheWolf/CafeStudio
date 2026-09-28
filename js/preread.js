/* Cafe Studio preread.

   Everything is filled in and painted as soon as the page loads, so the
   document is complete without scrolling. Photographs further down the page
   start a shade darker, like wet coffee, and dry as the reader arrives. */
(function () {
  "use strict";

  var S = window.STUDIO, B = window.Brew;
  if (!S || !B) return;
  var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  function $(s, r) { return (r || document).querySelector(s); }
  function all(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function work(slug) { return S.works.filter(function (w) { return w.slug === slug; })[0]; }
  function dpr() { return Math.min(window.devicePixelRatio || 1, 2); }
  function listJoin(a) { return a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]; }

  /* ---------- content ---------- */

  $("#p-series-list").textContent = listJoin(S.series.map(function (s) { return s.title; }));

  var plateNo = 1;
  function plate(w, cls) {
    var fig = el("figure", (cls || "plate") + " mount-" + w.mount), img = el("img");
    img.src = w.photo;
    img.alt = w.title + ", " + w.medium.toLowerCase();
    img.decoding = "async";
    img.width = 1000;
    img.height = Math.round(1000 / w.ratio);
    fig.appendChild(img);
    var cap = el("figcaption"), se = S.seriesOf(w.series);
    cap.appendChild(el("span", null, "Plate " + plateNo++));
    cap.appendChild(document.createTextNode(w.title + (se && !cls ? " · " + se.title : "")));
    fig.appendChild(cap);
    return fig;
  }

  var leadWork = work("but-first-tabby"), lead = $("#p-lead");
  if (leadWork) {
    var lp = plate(leadWork);
    lead.className = lp.className + " wide";
    while (lp.firstChild) lead.appendChild(lp.firstChild);
  }

  $("#p-quote").textContent = S.statement[0];
  $("#p-quote-2").textContent = S.statement[1];
  S.bio.forEach(function (t) { $("#p-bio").appendChild(el("p", null, t)); });

  S.strengths.forEach(function (st) {
    var li = el("li"), c = el("canvas");
    c.setAttribute("aria-hidden", "true");
    c._s = st.s;
    li.appendChild(c);
    li.appendChild(el("span", null, st.name));
    $("#p-swatches").appendChild(li);
  });

  S.process.forEach(function (p, i) {
    var li = el("li"), c = el("canvas");
    c.setAttribute("role", "img");
    c.setAttribute("aria-label", "The bean study after step " + (i + 1));
    li.appendChild(c);
    li.appendChild(el("span", "n", "Step " + (i + 1)));
    li.appendChild(el("h3", null, p.title));
    li.appendChild(el("p", null, p.text));
    $("#p-stages").appendChild(li);
  });

  S.series.forEach(function (se) {
    var block = el("div", "series-block"), ws = S.hung().filter(function (w) { return w.series === se.id; });
    block.appendChild(el("h3", null, se.title));
    block.appendChild(el("p", "series-meta", se.count + (se.count === 1 ? " piece" : " pieces") + " · " + se.blurb));
    if (ws.length) {
      var grid = el("div", "plates");
      ws.forEach(function (w) { if (w !== leadWork) grid.appendChild(plate(w, "plate-sm")); });
      if (grid.children.length) block.appendChild(grid);
      else block.appendChild(el("p", "aside", "Shown above as Plate 1."));
    } else {
      block.appendChild(el("p", "aside", "Photographs coming soon."));
    }
    $("#p-collection").appendChild(block);
  });

  S.fyi.forEach(function (f) {
    var d = el("div");
    d.appendChild(el("dt", null, f.title));
    d.appendChild(el("dd", null, f.text));
    $("#p-fyi").appendChild(d);
  });
  $("#p-care-intro").textContent = S.care.intro;
  S.care.avoid.forEach(function (t) { $("#p-care").appendChild(el("li", null, t)); });
  $("#p-care-note").textContent = S.care.note;

  var contact = $("#p-contact");
  function row(label, value, href) {
    var li = el("li");
    li.appendChild(el("span", null, label));
    if (href) {
      var a = el("a", null, value);
      a.href = href;
      li.appendChild(a);
    } else {
      li.appendChild(document.createTextNode(value));
    }
    contact.appendChild(li);
  }
  row("Artist", S.artist);
  row("Studio", S.legal);
  if (S.email) row("Email", S.email, "mailto:" + S.email);
  $("#p-legal").textContent = "© 2026 " + S.legal;
  if (S.instagram) row("Instagram", "@" + S.instagram);
  if (S.site) row("Online", S.site.replace(/^https?:\/\//, ""));

  /* ---------- painting ---------- */

  function fit(c) {
    var k = dpr();
    c.width = Math.max(1, Math.round(c.clientWidth * k));
    c.height = Math.max(1, Math.round(c.clientHeight * k));
    return k;
  }

  function onScreen(e) {
    var r = e.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  }

  // Show a finished sheet: brushed in if it is on screen, at once if not.
  function reveal(c, src) {
    var ctx = c.getContext("2d");
    if (reduce || !onScreen(c)) { ctx.drawImage(src, 0, 0); return; }
    var t0 = performance.now(), dur = 1100, seed = (Math.random() * 1e6) | 0;
    (function step(now) {
      var t = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - t, 3);
      ctx.clearRect(0, 0, c.width, c.height);
      B.sweep(ctx, src, e, seed, { dir: 1 });
      if (t < 1) requestAnimationFrame(step); else ctx.drawImage(src, 0, 0);
    })(t0);
  }

  function paintSwatch(c) {
    var k = fit(c), src = B.sheet(c.width, c.height), blob = B.sheet(c.width, c.height);
    var ctx = src.getContext("2d");
    B.paper(ctx, c.width, c.height, { grainScale: k, vignette: false });
    B.swatch(blob, c._s, 70 + Math.round(c._s * 100));
    ctx.drawImage(blob, 0, 0);
    reveal(c, src);
  }

  function paintStages(cs) {
    var k = fit(cs[0]), w = cs[0].width, h = cs[0].height;
    var plan = B.plan("beans", w, h, 11), paper = B.sheet(w, h), shown = [];
    B.paper(paper.getContext("2d"), w, h, { grainScale: k });
    var layers = plan.map(function (L, i) { return B.paintLayer(L, i, w, h, 11); });
    cs.forEach(function (c, si) {
      c.width = w;
      c.height = h;
      shown = shown.concat(S.process[si] ? S.process[si].layers : []);
      var src = B.sheet(w, h), ctx = src.getContext("2d");
      ctx.drawImage(paper, 0, 0);
      ctx.globalCompositeOperation = "multiply";
      plan.forEach(function (L, i) { if (shown.indexOf(L.name) >= 0) ctx.drawImage(layers[i], 0, 0); });
      reveal(c, src);
    });
  }

  function paintMast(c) {
    var k = fit(c), w = c.width, h = c.height, src = B.sheet(w, h), ctx = src.getContext("2d"), r = B.rng(51), u = Math.min(w, h) / 500;
    B.paper(ctx, w, h, { grainScale: k });
    B.ring(ctx, w * 0.83, h * 0.46, h * 0.36, r, { u: u, s: 0.55, gaps: 0.38 });
    B.ring(ctx, w * 0.845, h * 0.44, h * 0.357, r, { u: u, s: 0.45, width: 0.02, gaps: 0.55, fill: 0 });
    B.drops(ctx, r, w * 0.64, h * 0.8, w * 0.02, 6, { u: u, s: 0.6 });
    var size = h * 0.4;
    B.washText(ctx, "Cafe Studio", "400 " + Math.round(size) + "px Gloock, Georgia, serif", w * 0.06, h * 0.64, B.rng(9), { s: 0.64, u: size / 150 });
    reveal(c, src);
  }

  function paintMarks() {
    all(".mark").forEach(function (c, i) {
      var k = fit(c), r = B.rng(90 + i), s = c.width;
      B.ring(c.getContext("2d"), s / 2, s / 2, s * 0.36, r, { u: k * 0.25, s: 0.3, width: 0.07, gaps: 0.3, fill: 0.03 });
    });
  }

  var fontsReady = document.fonts && document.fonts.load
    ? Promise.race([document.fonts.load("400 100px Gloock"), new Promise(function (res) { setTimeout(res, 2500); })])
    : Promise.resolve();

  function start() {
    paintMarks();
    fontsReady.then(function () { B.later(function () { paintMast($("#mast")); }); });
    all("#p-swatches canvas").forEach(function (c) { B.later(function () { paintSwatch(c); }); });
    var st = all("#p-stages canvas");
    if (st.length) B.later(function () { paintStages(st); });

    // Photos below the fold look freshly wet and dry as they come into view.
    if (!reduce && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.remove("wet");
          io.unobserve(en.target);
        });
      }, { threshold: 0.3 });
      all(".plate img, .plate-sm img").forEach(function (img) {
        if (onScreen(img)) return;
        img.classList.add("wet");
        io.observe(img);
      });
    }
  }

  /* ---------- reading level ---------- */

  var level = $("#level");
  function onScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    level.style.setProperty("--p", max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : "1");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  if (document.readyState === "complete") start();
  else window.addEventListener("load", start);
})();
