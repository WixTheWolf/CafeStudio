/* Cafe Studio: the site.

   A simple library of Hannah's work. The home page (index.html) opens on
   one of her paintings, enlarged, then her medium, the series, a quote over
   another painting, her work at home, her statement, FYIs and care, and
   inquiries. Each series has its own page (work.html?series=<id>) with
   every piece in a grid; a piece opens in a viewer with its size, price,
   other photos and a zoom. work.html?series=<id>&piece=<slug> opens straight
   on that piece, for links and QR codes.

   Everything shown comes from js/studio.js. The site shows no counts, so a
   new piece or series appears as soon as it is added there. */
(function () {
  "use strict";

  var S = window.STUDIO;
  if (!S) return;
  var doc = document.documentElement;
  var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var params = new URLSearchParams(location.search);
  var isHome = document.body.classList.contains("page-home");

  function $(s, r) { return (r || document).querySelector(s); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function img(src, alt, eager) {
    var i = el("img");
    i.src = src;
    i.alt = alt || "";
    i.decoding = "async";
    if (!eager) i.loading = "lazy";
    return i;
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function seriesUrl(id, slug) { return "work.html?series=" + encodeURIComponent(id) + (slug ? "&piece=" + encodeURIComponent(slug) : ""); }
  function hasWorks(se) { return S.inSeries(se.id).length > 0; }
  function cover(se) { var c = S.work(se.cover); return c && c.photo ? c : S.inSeries(se.id)[0]; }

  /* ---------- the menu ---------- */

  var menuSeries = $("#menu-series");
  S.series.filter(hasWorks).forEach(function (se) {
    var li = el("li"), a = el("a", null, se.title);
    a.href = seriesUrl(se.id);
    li.appendChild(a);
    menuSeries.appendChild(li);
  });

  // On a phone the menu is a panel behind the Menu button.
  var menuBtn = $("#menu-btn"), menu = $("#menu");
  function setMenu(open) {
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    doc.classList.toggle("menu-open", open);
  }
  menuBtn.addEventListener("click", function () { setMenu(menuBtn.getAttribute("aria-expanded") !== "true"); });
  menu.addEventListener("click", function (ev) { if (ev.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") setMenu(false); });

  /* ---------- the viewer ---------- */

  var viewer = $("#viewer"), art = $("#v-art"), thumbs = $("#v-thumbs"), hint = $("#v-hint"), viewing = null, big = null;
  var picker = $("#c-piece");

  function openViewer(w, start) {
    viewing = w;
    var se = S.seriesOf(w.series);
    $("#v-title").textContent = w.title;
    $("#v-meta").textContent = se ? se.title : "Original";
    $("#v-blurb").textContent = w.medium + ", " + S.sizeText(w).replace(/^Size/, "size") + ". An original, painted by hand with coffee.";
    $("#v-price").textContent = S.priceText(w);
    $("#v-note").textContent = "Frames in the photos are for staging and are not included. Pricing does not include shipping.";
    $("#v-ask").href = "index.html?piece=" + encodeURIComponent(w.slug) + "#inquire";
    art.innerHTML = "";
    thumbs.innerHTML = "";
    var shots = [[w.photo, "The piece"]];
    w.detailPhotos.forEach(function (p) { shots.push([p, "Up close"]); });
    if (w.homePhoto) shots.push([w.homePhoto, "At home"]);
    big = img(shots[0][0], w.title, true);
    art.appendChild(big);
    function show(i) {
      unzoom();
      big.src = shots[i][0];
      big.alt = w.title + ", " + shots[i][1].toLowerCase();
      Array.prototype.forEach.call(thumbs.children, function (b, j) { b.setAttribute("aria-pressed", j === i ? "true" : "false"); });
    }
    if (shots.length > 1) {
      shots.forEach(function (sh, i) {
        var b = el("button");
        b.type = "button";
        b.appendChild(img(sh[0], ""));
        b.appendChild(el("span", null, sh[1]));
        b.addEventListener("click", function () { show(i); });
        thumbs.appendChild(b);
      });
    }
    show(start < 0 ? shots.length - 1 : start || 0);
    if (viewer.showModal) viewer.showModal(); else viewer.setAttribute("open", "");
  }
  function closeViewer() {
    unzoom();
    if (viewer.close) viewer.close(); else viewer.removeAttribute("open");
  }
  $("#v-close").addEventListener("click", closeViewer);
  viewer.addEventListener("click", function (ev) { if (ev.target === viewer) closeViewer(); });
  viewer.addEventListener("close", unzoom);
  // On the home page the inquiry form is right here: fill it in and go there.
  $("#v-ask").addEventListener("click", function (ev) {
    if (!isHome || !viewing) return;
    ev.preventDefault();
    picker.value = viewing.title;
    closeViewer();
    $("#inquire").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  });

  // Zoom: tap or click the painting to look closer, again to step back.
  // A mouse looks around by moving; a finger drags.
  var ZOOM = 2.6, zoomed = false, ox = 50, oy = 50, drag = null;
  function pointAt(ev) {
    var r = art.getBoundingClientRect();
    return [clamp((ev.clientX - r.left - big.offsetLeft) / big.offsetWidth * 100, 0, 100),
            clamp((ev.clientY - r.top - big.offsetTop) / big.offsetHeight * 100, 0, 100)];
  }
  function applyZoom() {
    big.style.transformOrigin = ox.toFixed(1) + "% " + oy.toFixed(1) + "%";
    big.style.transform = zoomed ? "scale(" + ZOOM + ")" : "";
    art.classList.toggle("zoomed", zoomed);
    hint.textContent = zoomed ? "Tap again to step back" : "Tap the painting to zoom in";
  }
  function unzoom() { if (!big) return; zoomed = false; applyZoom(); }
  art.addEventListener("pointerdown", function (ev) {
    if (!big) return;
    drag = { x: ev.clientX, y: ev.clientY, ox: ox, oy: oy, moved: false };
    if (zoomed && ev.pointerType !== "mouse") art.setPointerCapture(ev.pointerId);
  });
  art.addEventListener("pointermove", function (ev) {
    if (!zoomed) return;
    if (ev.pointerType === "mouse") {
      var p = pointAt(ev);
      ox = p[0];
      oy = p[1];
      applyZoom();
    } else if (drag) {
      var dx = ev.clientX - drag.x, dy = ev.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true;
      ox = clamp(drag.ox - dx / big.offsetWidth * 100 * 1.4, 0, 100);
      oy = clamp(drag.oy - dy / big.offsetHeight * 100 * 1.4, 0, 100);
      applyZoom();
    }
  });
  art.addEventListener("pointerup", function (ev) {
    if (!drag || !big) return;
    var tap = !drag.moved;
    drag = null;
    if (!tap) return;
    if (!zoomed) {
      var p = pointAt(ev);
      ox = p[0];
      oy = p[1];
    }
    zoomed = !zoomed;
    applyZoom();
  });
  art.addEventListener("pointercancel", function () { drag = null; });

  /* ---------- a series page ---------- */

  if (!isHome) {
    var se = S.seriesOf(params.get("series")) || S.series.filter(hasWorks)[0];
    document.title = se.title + " · Cafe Studio";
    $("#s-title").textContent = se.title;
    $("#s-blurb").textContent = se.blurb || "";
    var grid = $("#pieces");
    S.inSeries(se.id).forEach(function (w) {
      var li = el("li", "piece"), b = el("button", "piece-art mount-" + w.mount);
      b.type = "button";
      b.setAttribute("aria-label", "View " + w.title);
      b.appendChild(img(w.photo, w.title + ", " + w.medium.toLowerCase()));
      b.addEventListener("click", function () {
        history.replaceState(null, "", seriesUrl(se.id, w.slug));
        openViewer(w, 0);
      });
      li.appendChild(b);
      li.appendChild(el("h2", "piece-title", w.title));
      li.appendChild(el("p", "piece-meta", S.sizeText(w)));
      li.appendChild(el("p", "piece-price", S.priceText(w)));
      grid.appendChild(li);
    });
    viewer.addEventListener("close", function () { history.replaceState(null, "", seriesUrl(se.id)); });
    // the other series
    var nav = $("#series-nav");
    nav.appendChild(el("p", "eyebrow", "More series"));
    var ul = el("ul");
    S.series.filter(hasWorks).forEach(function (o) {
      if (o.id === se.id) return;
      var li = el("li"), a = el("a", null, o.title);
      a.href = seriesUrl(o.id);
      li.appendChild(a);
      ul.appendChild(li);
    });
    nav.appendChild(ul);
    var first = S.work(params.get("piece"));
    if (first && first.series === se.id) openViewer(first, 0);
  }

  /* ---------- the home page ---------- */

  if (isHome) {
    // My Work: one painting for each series
    var sg = $("#series-grid");
    S.series.filter(hasWorks).forEach(function (s) {
      var w = cover(s), li = el("li", "series-card"), a = el("a", "series-link");
      a.href = seriesUrl(s.id);
      var f = el("span", "series-art mount-" + w.mount);
      f.appendChild(img(w.photo, w.title));
      a.appendChild(f);
      a.appendChild(el("span", "series-name", s.title));
      li.appendChild(a);
      sg.appendChild(li);
    });

    // Where it belongs: her paintings at home, at a few depths
    var homeWorks = (S.atHome || []).map(S.work).filter(function (w) { return w && w.photo && w.homePhoto; });
    // left %, top % of the section, width in vw, turn, depth
    var SPOTS = [[4, 3, 22, -3, 0.9], [71, 1, 24, 2.5, 0.55], [76, 31, 18, -2, 1.35], [3, 35, 19, 2.6, 1.45], [38, 3, 15, 1.4, 1.7],
      [62, 57, 23, 1.8, 1.0], [5, 67, 22, -2.4, 0.6], [34, 80, 19, -1.2, 1.25], [79, 79, 16, -3, 1.55], [18, 52, 14, 2.2, 1.8]];
    var homeSec = $("#home");
    var homeEls = homeWorks.slice(0, SPOTS.length).map(function (w, i) {
      var b = el("button", "hp"), sp = SPOTS[i];
      b.type = "button";
      b.setAttribute("aria-label", w.title + " at home");
      b.appendChild(img(w.homePhoto, ""));
      b.style.left = sp[0] + "%";
      b.style.top = sp[1] + "%";
      b.style.transform = "rotate(" + sp[3] + "deg)";
      b.addEventListener("click", function () { openViewer(w, -1); });
      $("#home-photos").appendChild(b);
      return { b: b, sp: sp };
    });
    var layoutHome = function () {
      var k = window.innerWidth < 700 ? 2 : 1.22;
      homeEls.forEach(function (h) { h.b.style.width = Math.min(h.sp[2] * k, 46) + "vw"; });
    };
    var ticking = false;
    var drift = function () {
      ticking = false;
      var r = homeSec.getBoundingClientRect(), vh = window.innerHeight;
      if (r.bottom < 0 || r.top > vh) return;
      var c = (vh / 2 - (r.top + r.height / 2)) / r.height;
      homeEls.forEach(function (h) {
        var z = h.sp[4];
        h.b.style.transform = "translate3d(0," + (-c * z * vh * 0.5).toFixed(1) + "px,0) rotate(" + (h.sp[3] + c * z * 2).toFixed(2) + "deg)";
      });
    };
    layoutHome();
    window.addEventListener("resize", layoutHome);
    if (!reduce) {
      window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(drift); } }, { passive: true });
      drift();
    }

    // Artist statement, FYIs and care
    S.bio.forEach(function (t) { $("#bio").appendChild(el("p", null, t)); });
    S.fyi.forEach(function (f) {
      var li = el("li");
      li.appendChild(img(f.photo, ""));
      li.appendChild(el("h3", null, f.title));
      li.appendChild(el("p", null, f.text));
      $("#fyi").appendChild(li);
    });
    $("#care-intro").textContent = S.care.intro;
    S.care.avoid.forEach(function (t) { $("#care-list").appendChild(el("li", null, t)); });
    $("#care-note").textContent = S.care.note;

    // Inquiries
    picker.appendChild(el("option", null, "No particular piece"));
    S.series.filter(hasWorks).forEach(function (s) {
      var g = el("optgroup");
      g.label = s.title;
      S.inSeries(s.id).forEach(function (w) { var o = el("option", null, w.title + " · " + S.priceText(w)); o.value = w.title; g.appendChild(o); });
      picker.appendChild(g);
    });
    var asked = S.work(params.get("piece"));
    if (asked) picker.value = asked.title;
    if (S.email) {
      var im = $("#inquire-mail"), ma = el("a", null, S.email);
      ma.href = "mailto:" + S.email;
      im.appendChild(document.createTextNode("Write to Hannah at "));
      im.appendChild(ma);
      im.appendChild(document.createTextNode(", or use the form."));
    }

    var enquiry = "";
    $("#c-form").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var name = $("#c-name").value.trim(), email = $("#c-email").value.trim(), msg = $("#c-msg").value.trim();
      var general = picker.selectedIndex === 0, piece = picker.value, missing = [], err = $("#c-error");
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
      var about = general ? "" : "I’m interested in “" + piece + "”" + (chosen && chosen.price ? " (" + S.priceText(chosen) + ")" : "") + ".";
      enquiry = "Hi Hannah,\n\n" + (about ? about + "\n\n" : "") + (msg ? msg + "\n\n" : "") + "Thanks,\n" + name + "\n" + email;
      $("#c-text").textContent = enquiry;
      var mail = $("#c-mail"), help = $("#c-help");
      help.textContent = "";
      if (S.email) {
        mail.href = "mailto:" + S.email + "?subject=" + encodeURIComponent(general ? "An inquiry from " + name : "About " + piece) + "&body=" + encodeURIComponent(enquiry);
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
  }

  /* ---------- the film: Hannah's own footage ---------- */

  var film = $("#film");
  if (film) {
    var filmVideo = $("#film-video");
    var openFilm = function () {
      if (film.showModal) film.showModal(); else film.setAttribute("open", "");
      var pr = filmVideo.play();
      if (pr && pr.catch) pr.catch(function () { /* the controls are there to start it */ });
    };
    var closeFilm = function () {
      filmVideo.pause();
      if (film.close) film.close(); else film.removeAttribute("open");
    };
    $("#film-btn").addEventListener("click", openFilm);
    $("#film-close").addEventListener("click", closeFilm);
    film.addEventListener("click", function (ev) { if (ev.target === film) closeFilm(); });
    film.addEventListener("close", function () { filmVideo.pause(); });
    if (location.hash === "#film") setTimeout(openFilm, 300);
  }

  /* ---------- the footer ---------- */

  $("#year").textContent = new Date().getFullYear();
  $("#legal").textContent = S.legal;
  if (S.email) {
    var mailto = el("a", null, S.email);
    mailto.href = "mailto:" + S.email;
    $("#contact-line").appendChild(mailto);
  }
  if (S.instagram) $("#contact-line").appendChild(document.createTextNode((S.email ? " · " : "") + "@" + S.instagram));
})();
