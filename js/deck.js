/* Cafe Studio deck.

   Arrow keys, space, a tap or a swipe move between slides. Each change
   spreads across the stage like a spill of coffee, with a darker wet edge.
   N shows speaker notes, F goes full screen. A slide can be linked
   directly as #s1, #s2 and so on. */
(function () {
  "use strict";

  var S = window.STUDIO, B = window.Brew, Crema = window.Crema, Develop = window.Develop;
  if (!S || !B) return;
  var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var TAU = Math.PI * 2;

  function $(s, r) { return (r || document).querySelector(s); }
  function all(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function work(slug) { return S.works.filter(function (w) { return w.slug === slug; })[0]; }
  var inSeries = S.inSeries, pieces = S.pieces;

  var deck = $("#deck"), stage = $("#stage"), edge = $("#edge");
  var slides = all(".slide");
  var k = 1, cur = 0;

  /* ---------- Hannah's work, framed ---------- */

  // A frame for one piece, with the image `h` stage pixels tall.
  function frameFor(w, h) {
    var fig = el("figure", "dframe mount-" + w.mount), mould = el("span", "moulding"), mat = el("span", "mat");
    var img = el("img", "art"), ih = Math.round(w.mount === "art" ? h * 0.86 : h);
    img.src = w.photo;
    img.alt = w.title + ", " + w.medium.toLowerCase();
    img.decoding = "async";
    img.style.width = Math.round(ih * w.ratio) + "px";
    img.style.height = ih + "px";
    mat.appendChild(img);
    mould.appendChild(mat);
    fig.appendChild(mould);
    var cap = el("figcaption", null, w.title);
    cap.appendChild(el("span", "spec", (w.size ? w.size.split("x").join(" × ") + " in · " : "") + S.priceText(w)));
    fig.appendChild(cap);
    return fig;
  }

  // Hang a set of works in rows across an area, as large as they will go.
  function hang(box, works, area) {
    box.innerHTML = "";
    var best = null;
    for (var rows = 1; rows <= 3; rows++) {
      var per = Math.ceil(works.length / rows), split = [];
      for (var i = 0; i < works.length; i += per) split.push(works.slice(i, i + per));
      var cap = (area.h - split.length * 64 - (split.length - 1) * 28) / split.length;
      var h = Math.min(cap, area.max || 470);
      split.forEach(function (row) {
        var ratios = row.reduce(function (a, w) { return a + w.ratio; }, 0);
        h = Math.min(h, (area.w - (row.length - 1) * 64 - row.length * 44) / ratios);
      });
      if (!best || h > best.h) best = { h: h, split: split };
    }
    var n = 0;
    best.split.forEach(function (row) {
      var r = el("div", "hang-row");
      row.forEach(function (w) {
        var f = frameFor(w, best.h);
        f.style.setProperty("--i", n++);
        r.appendChild(f);
      });
      box.appendChild(r);
    });
  }

  $("#d-quote").textContent = S.statement[0];
  $("#d-quote-2").textContent = S.statement[1];

  all(".solo").forEach(function (box) {
    var w = work(box.getAttribute("data-work"));
    if (w) box.appendChild(frameFor(w, w.ratio < 1 ? 600 : 470));
  });

  $("#d-collection").textContent = "The collection · " + pieces(S.total());
  S.series.forEach(function (se) {
    var li = el("li"), ws = inSeries(se.id), pic = el("div", "tile-pic");
    if (ws.length) {
      var img = el("img");
      img.src = ws[0].photo;
      img.alt = "";
      img.decoding = "async";
      pic.appendChild(img);
    } else {
      pic.classList.add("tile-empty");
      pic.appendChild(el("span", null, S.toCome(se)));
    }
    li.appendChild(pic);
    li.appendChild(el("h3", null, se.title));
    li.appendChild(el("p", null, pieces(se.count) + (ws.length && ws.length < se.count ? " · " + ws.length + " shown" : "")));
    $("#d-series").appendChild(li);
  });

  all(".s-wall").forEach(function (sl) {
    var ids = sl.getAttribute("data-series").split(","), works = [];
    ids.forEach(function (id) { works = works.concat(inSeries(id)); });
    var count = ids.reduce(function (t, id) { return t + S.seriesOf(id).count; }, 0);
    var shown = count > works.length ? ", " + works.length + " shown here" : "";
    if (ids.length === 1) {
      var se = S.seriesOf(ids[0]);
      $(".eyebrow", sl).textContent = pieces(count) + shown + " · " + se.blurb;
      $("h2", sl).textContent = se.title;
    } else {
      $(".eyebrow", sl).textContent = "Two more series · " + pieces(count) + shown;
    }
    hang($(".hang", sl), works, { w: 1380, h: 590, max: works.length <= 3 ? 470 : 420 });
  });

  // The price list: every series with its pieces, sizes and prices.
  $("#d-price-eyebrow").textContent = "The collection · " + pieces(S.total()) + " · " + S.priceRange();
  S.series.forEach(function (se) {
    var block = el("section", "pl-series"), ul = el("ul");
    block.appendChild(el("h3", null, se.title));
    inSeries(se.id).forEach(function (w) {
      var li = el("li"), name = el("span", "pl-name", w.title);
      name.appendChild(el("span", "pl-size", S.sizeText(w)));
      li.appendChild(name);
      li.appendChild(el("span", "pl-price", S.priceText(w)));
      ul.appendChild(li);
    });
    block.appendChild(ul);
    $("#d-prices").appendChild(block);
  });

  ["a-pleasant-pause", "but-first-tabby", "a-classic-breakfast", "fresh-baked"].forEach(function (slug, i) {
    var w = work(slug);
    if (!w || !w.detailPhoto) return;
    var li = el("li"), img = el("img");
    li.style.setProperty("--i", i);
    img.src = w.detailPhoto;
    img.alt = w.title + ", up close";
    img.decoding = "async";
    li.appendChild(img);
    li.appendChild(el("p", null, w.title));
    $("#d-closeups").appendChild(li);
  });

  S.fyi.forEach(function (f) {
    var li = el("li");
    li.appendChild(el("h3", null, f.title));
    li.appendChild(el("p", null, f.text));
    $("#d-fyi").appendChild(li);
  });
  $("#d-care-intro").textContent = S.care.intro;
  S.care.avoid.forEach(function (t) { $("#d-care").appendChild(el("li", null, t)); });
  $("#d-care-note").textContent = S.care.note;

  S.strengths.forEach(function (st) {
    var li = el("li"), c = el("canvas");
    c.setAttribute("aria-hidden", "true");
    c._s = st.s;
    li.appendChild(c);
    li.appendChild(el("span", "sw-name", st.name));
    $("#d-swatches").appendChild(li);
  });

  S.process.forEach(function (p, i) {
    var li = el("li"), c = el("canvas");
    c.setAttribute("aria-hidden", "true");
    li.appendChild(c);
    li.appendChild(el("span", "n", "Step " + (i + 1)));
    li.appendChild(el("h3", null, p.title));
    li.appendChild(el("p", null, p.text));
    $("#d-stages").appendChild(li);
  });

  var contact = $("#d-contact");
  function contactRow(label, value) {
    var li = el("li");
    li.appendChild(el("span", null, label));
    li.appendChild(document.createTextNode(value));
    contact.appendChild(li);
  }
  contactRow("Artist", S.artist);
  contactRow("Studio", S.legal);
  if (S.email) contactRow("Email", S.email);
  if (S.instagram) contactRow("Instagram", "@" + S.instagram);
  if (S.site) contactRow("Online", S.site.replace(/^https?:\/\//, ""));
  contactRow("The collection", "Six series, all painted in coffee");

  var dots = slides.map(function (s, i) {
    var li = el("li"), b = el("button");
    b.type = "button";
    b.setAttribute("aria-label", "Go to slide " + (i + 1));
    b.addEventListener("click", function (ev) { ev.stopPropagation(); go(i); });
    li.appendChild(b);
    $("#dots").appendChild(li);
    return b;
  });

  /* ---------- painting ---------- */

  function pxScale(cap) { return Math.min((window.devicePixelRatio || 1) * k, cap || 2); }

  function size(c, cap) {
    var s = pxScale(cap);
    c.width = Math.max(1, Math.round(c.clientWidth * s));
    c.height = Math.max(1, Math.round(c.clientHeight * s));
    return s;
  }

  function paintBg(c, kind, i) {
    var sc = size(c, 1.25), w = c.width, h = c.height, ctx = c.getContext("2d"), r = B.rng(100 + i * 13), u = Math.min(w, h) / 800;
    B.paper(ctx, w, h, { grainScale: sc });
    if (kind === "cover") {
      B.ring(ctx, w * 0.08, h * 0.95, h * 0.22, r, { u: u, s: 0.5, gaps: 0.42 });
      B.drops(ctx, r, w * 0.9, h * 0.9, w * 0.02, 6, { u: u, s: 0.6 });
      B.drops(ctx, r, w * 0.95, h * 0.1, w * 0.012, 4, { u: u, s: 0.45 });
    } else {
      B.drops(ctx, r, w * (0.86 + r() * 0.08), h * (0.1 + r() * 0.1), w * 0.014, 4, { u: u, s: 0.45 });
    }
  }

  function paintWordmark(c) {
    var sc = size(c, 2), ctx = c.getContext("2d"), f = function (px) { return "400 " + Math.round(px * sc) + "px Gloock, Georgia, serif"; };
    ctx.clearRect(0, 0, c.width, c.height);
    B.washText(ctx, "Cafe", f(206), 12 * sc, 194 * sc, B.rng(31), { s: 0.62, u: sc * 1.2 });
    B.washText(ctx, "Studio", f(206), 120 * sc, 392 * sc, B.rng(32), { s: 0.7, u: sc * 1.2 });
  }

  // Hannah's feature painting at the end of each step, rendered once with
  // the same WebGL build the site uses. Without WebGL each step shows the
  // finished piece.
  function paintStages(cs) {
    size(cs[0], 2);
    var w = cs[0].width, h = cs[0].height, f = S.work(S.feature);
    cs.forEach(function (c) { c.width = w; c.height = h; });
    var off = document.createElement("canvas"), D = Develop ? new Develop(off, { maxScale: 1 }) : null;
    if (!D || !D.ok) {
      var im = new Image();
      im.onload = function () {
        cs.forEach(function (c) {
          var s = Math.max(w / im.width, h / im.height), iw = im.width * s, ih = im.height * s;
          c.getContext("2d").drawImage(im, (w - iw) / 2, (h - ih) / 2, iw, ih);
        });
      };
      im.src = f.photo;
      return;
    }
    D.resize(w, h);
    D.load(f.photo, function () {
      cs.forEach(function (c, i) {
        D.state = null;
        D.draw({ a: f.photo, rect: [0, 0, w, h], build: i + 1, seed: 4.2 });
        c.getContext("2d").drawImage(off, 0, 0);
      });
    });
  }

  var fontsReady = document.fonts && document.fonts.load
    ? Promise.race([document.fonts.load("400 100px Gloock"), new Promise(function (res) { setTimeout(res, 2500); })])
    : Promise.resolve();

  function paintSlide(i) {
    var s = slides[i];
    if (!s || s._painted) return;
    s._painted = true;
    var bg = $("canvas.bg", s);
    if (bg) B.later(function () { paintBg(bg, s.getAttribute("data-paint"), i); });
    var wm = $(".wordmark", s);
    if (wm) fontsReady.then(function () { B.later(function () { paintWordmark(wm); }); });
    all("#d-swatches canvas", s).forEach(function (c, j) { B.later(function () { size(c, 2); B.swatch(c, c._s, 40 + j * 7); }); });
    var st = all("#d-stages canvas", s);
    if (st.length) B.later(function () { paintStages(st); });
  }

  /* ---------- live cups ---------- */

  var cups = [];
  all(".cup-gl").forEach(function (c) {
    var cr = Crema ? new Crema(c, { maxDpr: 2, frozen: reduce }) : null;
    if (!cr || !cr.ok) { c.style.display = "none"; return; }
    cr.set({ R: 0.3, cx: -0.04, cy: 0.02 });
    cups.push({ gl: cr, slide: c.closest(".slide") });
  });

  var transition = null;
  function frame(now) {
    requestAnimationFrame(frame);
    cups.forEach(function (cp) {
      var s = cp.slide;
      if (s === slides[cur] || (transition && (s === transition.from || s === transition.to))) cp.gl.draw(now);
    });
    if (transition) transition.step(now);
  }

  /* ---------- moving between slides ---------- */

  var edgeCtx = edge.getContext("2d");
  function sizeEdge() {
    var s = pxScale(1.5);
    edge.width = Math.round(1600 * s);
    edge.height = Math.round(900 * s);
    edgeCtx.setTransform(s, 0, 0, s, 0, 0);
  }

  function show(i) {
    var s = slides[i];
    stage.setAttribute("data-tone", s.getAttribute("data-tone") || "light");
    dots.forEach(function (d, j) { d.setAttribute("aria-current", j === i ? "true" : "false"); });
    $("#count").textContent = String(i + 1).padStart(2, "0") + " / " + String(slides.length).padStart(2, "0");
    $("#notes-text").textContent = s.getAttribute("data-notes") || "";
    try { history.replaceState(null, "", "#s" + (i + 1)); } catch (e) { /* the page may not own its address */ }
    paintSlide(i);
    paintSlide(i + 1);
    paintSlide(i - 1);
  }

  // restart a slide's entrance: frames swing onto their hooks and photos
  // develop from a pale wet wash to their true tones
  function enter(s) {
    s.classList.remove("enter");
    void s.offsetWidth;
    s.classList.add("enter");
  }

  function go(n) {
    n = clamp(n, 0, slides.length - 1);
    if (transition) transition.finish();
    if (n === cur) return;
    var from = slides[cur], to = slides[n], dir = n > cur ? 1 : -1;
    cur = n;
    show(n);
    to.classList.add("active");
    enter(to);
    all("video").forEach(function (v) { if (!to.contains(v)) v.pause(); });
    from.style.zIndex = "2";
    to.style.zIndex = "3";

    if (reduce) {
      from.classList.remove("active");
      from.style.zIndex = to.style.zIndex = "";
      return;
    }

    var ox = dir > 0 ? 1480 : 120, oy = 450 + (Math.random() - 0.5) * 360;
    var maxR = Math.hypot(Math.max(ox, 1600 - ox), Math.max(oy, 900 - oy)) * 1.35;
    var seed = (Math.random() * 1e6) | 0, n1 = B.noise(seed), n2 = B.noise(seed + 3), rim = B.tone(0.62);
    var t0 = performance.now(), dur = 1100;
    function outline(r, t) {
      var pts = [];
      for (var i = 0; i < 72; i++) {
        var a = i / 72 * TAU;
        var kk = 1 + (n1(Math.cos(a) * 2.1 + t * 1.5) + n2(Math.sin(a) * 2.1 + 5) - 1) * 0.3;
        pts.push([ox + Math.cos(a) * r * kk, oy + Math.sin(a) * r * kk]);
      }
      return pts;
    }
    transition = {
      from: from,
      to: to,
      step: function (now) {
        var t = clamp((now - t0) / dur, 0, 1), e = ease(t), pts = outline(e * maxR, t);
        to.style.clipPath = "polygon(" + pts.map(function (p) { return p[0].toFixed(1) + "px " + p[1].toFixed(1) + "px"; }).join(",") + ")";
        edgeCtx.clearRect(0, 0, 1600, 900);
        if (t < 1) {
          edgeCtx.beginPath();
          pts.forEach(function (p, i) { if (i) edgeCtx.lineTo(p[0], p[1]); else edgeCtx.moveTo(p[0], p[1]); });
          edgeCtx.closePath();
          edgeCtx.lineJoin = "round";
          edgeCtx.strokeStyle = B.rgba(rim, 0.16 * (1 - t));
          edgeCtx.lineWidth = 26;
          edgeCtx.stroke();
          edgeCtx.strokeStyle = B.rgba(rim, 0.5 * (1 - t));
          edgeCtx.lineWidth = 4;
          edgeCtx.stroke();
        } else {
          this.finish();
        }
      },
      finish: function () {
        to.style.clipPath = "";
        from.classList.remove("active");
        from.style.zIndex = to.style.zIndex = "";
        edgeCtx.clearRect(0, 0, 1600, 900);
        transition = null;
      }
    };
  }

  function next() { go(cur + 1); }
  function prev() { go(cur - 1); }

  /* ---------- controls ---------- */

  function toggleNotes() {
    var n = $("#notes"), on = n.hidden;
    n.hidden = !on;
    $("#btn-notes").setAttribute("aria-pressed", on ? "true" : "false");
  }
  $("#btn-notes").addEventListener("click", function (ev) { ev.stopPropagation(); toggleNotes(); });
  $("#btn-prev").addEventListener("click", function (ev) { ev.stopPropagation(); prev(); });
  $("#btn-next").addEventListener("click", function (ev) { ev.stopPropagation(); next(); });

  document.addEventListener("keydown", function (ev) {
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    var key = ev.key;
    if (ev.target && ev.target.tagName === "VIDEO" && key === " ") return;
    if (key === "ArrowRight" || key === "PageDown" || (key === " " && !ev.shiftKey)) { ev.preventDefault(); next(); }
    else if (key === "ArrowLeft" || key === "PageUp" || (key === " " && ev.shiftKey)) { ev.preventDefault(); prev(); }
    else if (key === "Home") { ev.preventDefault(); go(0); }
    else if (key === "End") { ev.preventDefault(); go(slides.length - 1); }
    else if (key === "n" || key === "N") toggleNotes();
    else if (key === "f" || key === "F") {
      if (document.fullscreenElement) { if (document.exitFullscreen) document.exitFullscreen().catch(function () {}); }
      else if (deck.requestFullscreen) deck.requestFullscreen().catch(function () {});
    }
  });

  deck.addEventListener("click", function (ev) {
    if (ev.target.closest("button, a, video, .notes")) return;
    var r = stage.getBoundingClientRect();
    if (ev.clientX > r.left + r.width * 0.35) next(); else prev();
  });

  var touchX = null, touchY = null;
  deck.addEventListener("touchstart", function (ev) { touchX = ev.touches[0].clientX; touchY = ev.touches[0].clientY; }, { passive: true });
  deck.addEventListener("touchend", function (ev) {
    if (touchX == null) return;
    var dx = ev.changedTouches[0].clientX - touchX, dy = ev.changedTouches[0].clientY - touchY;
    touchX = null;
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy)) {
      ev.preventDefault();
      if (dx < 0) next(); else prev();
    }
  });

  /* ---------- fitting ---------- */

  var paintedAt = 0;
  function fit() {
    k = Math.min(window.innerWidth / 1600, window.innerHeight / 900);
    stage.style.setProperty("--k", k.toFixed(4));
    sizeEdge();
    cups.forEach(function (cp) { cp.gl.resize(k); });
    var s = pxScale(2);
    if (paintedAt && s > paintedAt * 1.3) {
      slides.forEach(function (sl) { sl._painted = false; });
      paintSlide(cur);
      paintSlide(cur + 1);
    }
    if (!paintedAt || s > paintedAt) paintedAt = s;
  }
  var fitT = 0;
  window.addEventListener("resize", function () { clearTimeout(fitT); fitT = setTimeout(fit, 120); });

  var m = /^#s(\d+)$/.exec(location.hash || "");
  cur = m ? clamp(parseInt(m[1], 10) - 1, 0, slides.length - 1) : 0;
  fit();
  slides[cur].classList.add("active");
  enter(slides[cur]);
  show(cur);
  requestAnimationFrame(frame);
})();
