/* Brew paints with coffee.

   A small generative engine for coffee on cotton paper. A wash is built from
   many translucent, slightly different copies of one ragged shape, which is
   how a real wash gets its soft body and its dark, dried rim. Lifts erase
   pigment back to the paper, the way a painter blots out a moon or a glint.

   The site, the deck and the preread use it for their living backgrounds and
   for the stand-in studies of each work until photographs are added in
   js/studio.js. Everything is seeded, so a painting always comes out the
   same. */
(function (global) {
  "use strict";

  var TAU = Math.PI * 2;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }

  /* ---------- randomness ---------- */

  function rng(seed) {
    var a = (seed >>> 0) || 0x9e3779b9;
    function r() {
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    r.gauss = function () { var u = 1 - r(), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };
    r.int = function (n) { return Math.floor(r() * n); };
    r.range = function (lo, hi) { return lo + (hi - lo) * r(); };
    return r;
  }

  function noise(seed) {
    var r = rng(seed), v = new Float32Array(512);
    for (var i = 0; i < 512; i++) v[i] = r();
    return function (x) {
      var i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
      return lerp(v[i & 511], v[(i + 1) & 511], u);
    };
  }

  function fbm(n, x, oct) {
    var s = 0, a = 0.5, f = 1, norm = 0;
    for (var i = 0; i < (oct || 4); i++) { s += a * n(x * f + i * 17.31); norm += a; a *= 0.5; f *= 2.07; }
    return s / norm;
  }

  /* ---------- coffee ---------- */

  // The same coffee at different strengths: s = 0 is a whisper of weak
  // brew, s = 1 is coffee so strong it is nearly ink.
  var WEAK = [214, 138, 62], STRONG = [58, 25, 9];
  function tone(s) {
    var k = Math.pow(clamp(s, 0, 1), 0.72);
    return [Math.round(lerp(WEAK[0], STRONG[0], k)), Math.round(lerp(WEAK[1], STRONG[1], k)), Math.round(lerp(WEAK[2], STRONG[2], k))];
  }
  function rgba(c, a) {
    return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + (a == null ? 1 : Math.round(clamp(a, 0, 1) * 1000) / 1000) + ")";
  }

  function sheet(w, h) {
    var c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    return c;
  }

  /* ---------- paper ---------- */

  var PAPER = [240, 235, 224];
  var grainCache = null;

  // A tileable patch of cold-pressed cotton: soft tooth, a few dark specks
  // and the odd fibre.
  function grainTile() {
    if (grainCache) return grainCache;
    var N = 256, c = sheet(N, N), x = c.getContext("2d");
    var img = x.createImageData(N, N), d = img.data, r = rng(1987);
    var G = 32, grid = new Float32Array(G * G);
    for (var i = 0; i < G * G; i++) grid[i] = r();
    function tooth(px, py) {
      var gx = px / N * G, gy = py / N * G, x0 = Math.floor(gx), y0 = Math.floor(gy);
      var fx = gx - x0, fy = gy - y0;
      fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
      var x1 = (x0 + 1) % G, y1 = (y0 + 1) % G;
      return lerp(lerp(grid[y0 * G + x0], grid[y0 * G + x1], fx), lerp(grid[y1 * G + x0], grid[y1 * G + x1], fx), fy);
    }
    for (var y = 0; y < N; y++) {
      for (var xx = 0; xx < N; xx++) {
        var t = tooth(xx, y), s = r();
        var v = 255 - t * 11 - Math.pow(s, 7) * 34 - s * 3;
        var k = (y * N + xx) * 4;
        d[k] = v; d[k + 1] = v - 1; d[k + 2] = v - 3; d[k + 3] = 255;
      }
    }
    x.putImageData(img, 0, 0);
    x.globalCompositeOperation = "multiply";
    x.lineWidth = 0.7;
    for (var f = 0; f < 12; f++) {
      var sx = 40 + r() * 176, sy = 40 + r() * 176;
      x.strokeStyle = "rgba(120,98,76,0.08)";
      x.beginPath();
      x.moveTo(sx, sy);
      x.bezierCurveTo(sx + r() * 30 - 15, sy + r() * 30 - 15, sx + r() * 30 - 15, sy + r() * 30 - 15, sx + r() * 36 - 18, sy + r() * 36 - 18);
      x.stroke();
    }
    grainCache = c;
    return c;
  }

  function paper(ctx, w, h, o) {
    o = o || {};
    var col = o.color || PAPER;
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = rgba(col, 1);
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "multiply";
    var pat = ctx.createPattern(grainTile(), "repeat");
    if (o.grainScale && o.grainScale !== 1 && pat.setTransform && global.DOMMatrix) {
      pat.setTransform(new DOMMatrix().scale(o.grainScale));
    }
    ctx.globalAlpha = o.grain == null ? 1 : o.grain;
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
    if (o.vignette !== false) {
      var g = ctx.createRadialGradient(w * 0.5, h * 0.45, Math.min(w, h) * 0.25, w * 0.5, h * 0.5, Math.max(w, h) * 0.78);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(1, "rgba(160,128,96,0.11)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  }

  /* ---------- shapes ---------- */

  function P(x, y, v) { return { x: x, y: y, v: v == null ? 1 : v }; }

  function ellipse(cx, cy, rx, ry, n, r, o) {
    o = o || {};
    var pts = [], rot = o.rot || 0, cr = Math.cos(rot), sr = Math.sin(rot);
    for (var i = 0; i < n; i++) {
      var a = i / n * TAU, j = 1 + (r && o.jitter ? r.gauss() * o.jitter : 0);
      var x = Math.cos(a) * rx * j, y = Math.sin(a) * ry * j;
      pts.push(P(cx + x * cr - y * sr, cy + x * sr + y * cr, r ? 0.5 + r() : 1));
    }
    return pts;
  }

  // Any outline, with extra points so no edge is long enough to buckle
  // badly when it is deformed.
  function shape(arr, r, step, rough) {
    step = step || 12;
    rough = rough == null ? 1 : rough;
    var out = [];
    for (var i = 0; i < arr.length; i++) {
      var a = arr[i], b = arr[(i + 1) % arr.length];
      var L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / step));
      for (var k = 0; k < n; k++) {
        var t = k / n;
        out.push(P(lerp(a[0], b[0], t), lerp(a[1], b[1], t), rough * (r ? 0.5 + r() : 1)));
      }
    }
    return out;
  }

  function box(x, y, w, h, r, step, rough) {
    return shape([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], r, step || Math.max(8, Math.min(w, h) / 3), rough);
  }

  // Split every edge and nudge the new point off the line. Each point keeps
  // its own roughness, so some stretches of edge stay calm while others go
  // ragged, like a real bloom.
  function deform(pts, depth, variance, r) {
    var out = pts;
    for (var d = 0; d < depth; d++) {
      var n = out.length, next = new Array(n * 2);
      for (var i = 0; i < n; i++) {
        var a = out[i], b = out[(i + 1) % n];
        var sd = Math.hypot(b.x - a.x, b.y - a.y) * variance * (a.v + b.v) * 0.25;
        next[2 * i] = a;
        next[2 * i + 1] = P((a.x + b.x) / 2 + r.gauss() * sd, (a.y + b.y) / 2 + r.gauss() * sd, (a.v + b.v) * 0.5 * (0.75 + r() * 0.5));
      }
      out = next;
    }
    return out;
  }

  function trace(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
  }

  function bounds(pts) {
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x;
      if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y;
    }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  function quad(p0, p1, p2, n) {
    var out = [];
    for (var i = 0; i <= n; i++) {
      var t = i / n, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t;
      out.push([a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1]]);
    }
    return out;
  }

  function cubic(p0, p1, p2, p3, n) {
    var out = [];
    for (var i = 0; i <= n; i++) {
      var t = i / n, m = 1 - t;
      var a = m * m * m, b = 3 * m * m * t, c = 3 * m * t * t, d = t * t * t;
      out.push([a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]]);
    }
    return out;
  }

  function yAt(line, x) {
    for (var i = 1; i < line.length; i++) {
      if (line[i][0] >= x) {
        var a = line[i - 1], b = line[i], t = (x - a[0]) / ((b[0] - a[0]) || 1);
        return lerp(a[1], b[1], t);
      }
    }
    return line[line.length - 1][1];
  }

  /* ---------- marks ---------- */

  // A translucent coffee wash. Options:
  //   s        strength of the brew, 0 to 1
  //   layers   how many thin passes build it up
  //   alpha    opacity of each pass
  //   baseVar  how far the overall shape wanders from the outline
  //   spread   how much each pass differs from the next (soft edges)
  //   rim      how dark the dried edge gets
  //   grain    granulation, the speckle strong coffee leaves in the tooth
  function wash(ctx, pts, r, o) {
    o = o || {};
    var col = o.color || tone(o.s == null ? 0.5 : o.s);
    var layers = o.layers || 20, alpha = o.alpha == null ? 0.05 : o.alpha;
    var base = deform(pts, o.baseDepth == null ? 2 : o.baseDepth, o.baseVar == null ? 0.5 : o.baseVar, r);
    var spread = o.spread == null ? 0.6 : o.spread, depth = o.depth == null ? 3 : o.depth;
    var rim = o.rim == null ? 1 : o.rim, u = o.u || 1;
    ctx.save();
    ctx.globalCompositeOperation = o.mode || "multiply";
    ctx.lineJoin = "round";
    ctx.lineWidth = (o.rimWidth || 1) * u;
    for (var i = 0; i < layers; i++) {
      trace(ctx, deform(base, depth, spread, r));
      var a = alpha * (0.75 + r() * 0.5);
      ctx.fillStyle = rgba(col, a);
      ctx.fill();
      if (rim > 0) {
        ctx.strokeStyle = rgba(col, a * rim);
        ctx.stroke();
      }
    }
    ctx.restore();
    if (o.grain) granulate(ctx, base, r, col, o.grain, u);
    return base;
  }

  // Blot pigment back off the sheet.
  function lift(ctx, pts, r, o) {
    o = o || {};
    var base = deform(pts, o.baseDepth == null ? 1 : o.baseDepth, o.baseVar == null ? 0.3 : o.baseVar, r);
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0," + (o.alpha || 0.3) + ")";
    for (var i = 0; i < (o.layers || 6); i++) {
      trace(ctx, deform(base, o.depth == null ? 2 : o.depth, o.spread == null ? 0.3 : o.spread, r));
      ctx.fill();
    }
    ctx.restore();
  }

  function granulate(ctx, pts, r, col, amount, u) {
    var b = bounds(pts);
    var count = Math.min(14000, Math.floor(b.w * b.h / (150 * u * u) * amount));
    if (count < 1) return;
    var styles = [rgba(col, 0.06), rgba(col, 0.1), rgba(col, 0.16), rgba(col, 0.22)];
    ctx.save();
    trace(ctx, pts);
    ctx.clip();
    ctx.globalCompositeOperation = "multiply";
    for (var i = 0; i < count; i++) {
      var s = (0.5 + r() * 1.3) * u;
      ctx.fillStyle = styles[r.int(4)];
      ctx.fillRect(b.x + r() * b.w, b.y + r() * b.h, s, s);
    }
    ctx.restore();
  }

  // Outline of a brush stroke along a line of points.
  function strokeShape(line, w0, w1, r, o) {
    o = o || {};
    var n = line.length, L = [], R = [], jit = o.jitter == null ? 0.25 : o.jitter;
    for (var i = 0; i < n; i++) {
      var a = line[Math.max(0, i - 1)], b = line[Math.min(n - 1, i + 1)];
      var dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
      var nx = -dy / d, ny = dx / d, t = n > 1 ? i / (n - 1) : 0;
      var w = lerp(w0, w1, t) * (1 + (r() - 0.5) * jit);
      if (o.taper) w *= Math.max(0.12, Math.pow(Math.min(1, t / o.taper, (1 - t) / o.taper), 0.6));
      L.push(P(line[i][0] + nx * w / 2, line[i][1] + ny * w / 2, 0.3));
      R.push(P(line[i][0] - nx * w / 2, line[i][1] - ny * w / 2, 0.3));
    }
    return L.concat(R.reverse());
  }

  function densify(line, step) {
    var out = [line[0]];
    for (var i = 1; i < line.length; i++) {
      var a = line[i - 1], b = line[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / step));
      for (var k = 1; k <= n; k++) out.push([lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)]);
    }
    return out;
  }

  function brush(ctx, line, w0, w1, r, o) {
    o = o || {};
    var u = o.u || 1;
    var s = strokeShape(densify(line, Math.max(2, 5 * u)), w0, w1, r, o);
    if (o.lift) return lift(ctx, s, r, { layers: o.layers || 2, alpha: o.alpha || 0.5, baseDepth: 0, depth: 1, spread: 0.1 });
    return wash(ctx, s, r, {
      s: o.s, color: o.color, layers: o.layers || 3, alpha: o.alpha == null ? 0.4 : o.alpha,
      baseDepth: 0, depth: 1, spread: o.spread == null ? 0.08 : o.spread, rim: o.rim == null ? 0.5 : o.rim, u: u
    });
  }

  function drops(ctx, r, cx, cy, spread, n, o) {
    o = o || {};
    var u = o.u || 1;
    for (var i = 0; i < n; i++) {
      var a = r() * TAU, d = Math.abs(r.gauss()) * spread;
      var rad = (1.2 + Math.pow(r(), 4) * 9) * u * (o.size || 1);
      var x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * (o.squash || 1);
      wash(ctx, ellipse(x, y, rad, rad * (0.8 + r() * 0.4), 10, r), r, {
        s: o.s == null ? 0.55 : o.s, layers: 4, alpha: 0.3, baseDepth: 1, baseVar: 0.35, depth: 1, spread: 0.18, rim: 2.4, u: u * 0.8
      });
    }
  }

  // The mark a wet cup leaves: a faint stain and a dark, uneven, often
  // broken rim where the coffee was carried outward as it dried.
  function ring(ctx, cx, cy, rad, r, o) {
    o = o || {};
    var u = o.u || 1, s = o.s == null ? 0.55 : o.s, col = tone(s);
    var n1 = noise(r.int(1e9)), n2 = noise(r.int(1e9)), n3 = noise(r.int(1e9));
    var gaps = o.gaps == null ? 0.34 : o.gaps, width = o.width || 0.03, sq = o.squash || 1;
    function around(n, a, k, off) { return (n(off + Math.cos(a) * k) + n(off + 40 + Math.sin(a) * k)) * 0.5; }
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, sq);
    if (o.fill !== 0) {
      wash(ctx, ellipse(0, 0, rad * 0.985, rad * 0.985, 28, r), r, {
        s: s * 0.35, layers: 8, alpha: o.fill || 0.009, baseDepth: 1, baseVar: 0.03, depth: 2, spread: 0.05, rim: 0, u: u
      });
    }
    ctx.globalCompositeOperation = "multiply";
    var steps = 240, passes = o.passes || 16;
    for (var p = 0; p < passes; p++) {
      var k = (p + 1) / passes, jit = r.gauss() * rad * 0.0012, outer = [], inner = [];
      for (var i = 0; i <= steps; i++) {
        var a = i / steps * TAU;
        var st = smooth(gaps, gaps + 0.22, around(n1, a, 1.3, 3));
        var ro = rad * (1 + (around(n2, a, 2.4, 9) - 0.5) * 0.018) + jit;
        var th = rad * width * st * k * (0.25 + 1.5 * around(n3, a, 3.2, 1));
        outer.push(Math.cos(a) * ro, Math.sin(a) * ro);
        inner.push(Math.cos(a) * (ro - th), Math.sin(a) * (ro - th));
      }
      ctx.beginPath();
      ctx.moveTo(outer[0], outer[1]);
      for (i = 2; i < outer.length; i += 2) ctx.lineTo(outer[i], outer[i + 1]);
      for (i = inner.length - 2; i >= 0; i -= 2) ctx.lineTo(inner[i], inner[i + 1]);
      ctx.closePath();
      ctx.fillStyle = rgba(col, (o.alpha || 1) * 0.1);
      ctx.fill();
    }
    ctx.restore();
  }

  // Fade the lower part of a layer into mist.
  function mist(ctx, y0, y1, amount) {
    var w = ctx.canvas.width, h = ctx.canvas.height;
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    var g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0," + amount + ")");
    ctx.fillStyle = g;
    ctx.fillRect(0, y0, w, y1 - y0);
    ctx.fillStyle = "rgba(0,0,0," + amount + ")";
    ctx.fillRect(0, y1, w, h - y1 + 1);
    ctx.restore();
  }

  // A fir as one wet silhouette: a tapering spine with drooping tiers.
  function fir(ctx, r, x, y, H, o) {
    o = o || {};
    var u = o.u || 1, W = H * (o.width || 0.3), tiers = 5 + r.int(4), n = tiers * 2, left = [], right = [];
    for (var i = 1; i <= n; i++) {
      var t = i / (n + 1), tip = i % 2 === 1;
      var half = W * 0.5 * Math.pow(1 - t, 0.95) * (tip ? 1 : 0.42) * (0.75 + r() * 0.5);
      var droop = tip ? H * 0.028 : 0;
      var yy = y - H * 0.05 - t * H * 0.95;
      left.push([x - half, yy + droop * (0.6 + r() * 0.8)]);
      right.push([x + half, yy + droop * (0.6 + r() * 0.8)]);
    }
    var trunk = W * 0.05 + u;
    var pts = [[x - trunk, y]].concat(left, [[x + r.gauss() * u, y - H]], right.reverse(), [[x + trunk, y]]);
    wash(ctx, shape(pts, r, 5 * u, 0.6), r, {
      s: o.s == null ? 0.85 : o.s, layers: o.layers || 4, alpha: o.alpha || 0.4,
      baseDepth: 1, baseVar: 0.14, depth: 1, spread: 0.12, rim: 1.2, u: u
    });
  }

  function bird(ctx, r, x, y, span, u) {
    brush(ctx, quad([x - span, y - span * 0.2], [x - span * 0.45, y - span * 0.55], [x, y], 8), u * 1.1, u * 2.4, r, { s: 0.85, alpha: 0.5, layers: 2, u: u });
    brush(ctx, quad([x, y], [x + span * 0.45, y - span * 0.6], [x + span, y - span * 0.3], 8), u * 2.4, u * 1.1, r, { s: 0.85, alpha: 0.5, layers: 2, u: u });
  }

  function hand(x0, y0, x1, y1, r, n, u) {
    var pts = [];
    for (var i = 0; i <= n; i++) {
      var t = i / n;
      pts.push([lerp(x0, x1, t) + r.gauss() * u * 0.7, lerp(y0, y1, t) + r.gauss() * u * 0.7]);
    }
    return pts;
  }

  // Paint a word as a coffee wash: texture a block, keep only the letters,
  // then darken their inside edge where the coffee dried.
  function washText(ctx, text, font, x, y, r, o) {
    o = o || {};
    var s = o.s == null ? 0.7 : o.s, u = o.u || 1;
    ctx.save();
    ctx.font = font;
    if (o.spacing && "letterSpacing" in ctx) ctx.letterSpacing = o.spacing + "px";
    var m = ctx.measureText(text);
    ctx.restore();
    var size = parseFloat(font.replace(/^[^0-9]*/, "")) || 100;
    var asc = m.actualBoundingBoxAscent || size * 0.8, desc = m.actualBoundingBoxDescent || size * 0.2;
    var pad = Math.ceil(size * 0.12), W = Math.ceil(m.width + pad * 2), H = Math.ceil(asc + desc + pad * 2);
    var t = sheet(W, H), c = t.getContext("2d");
    wash(c, box(-pad, -pad, W + pad * 2, H + pad * 2, r, 40 * u), r, { s: s, layers: 10, alpha: 0.13, baseVar: 0.2, spread: 0.5, rim: 0, u: u });
    for (var i = 0; i < 6; i++) {
      wash(c, ellipse(r() * W, r() * H, W * (0.08 + r() * 0.16), H * (0.3 + r() * 0.4), 14, r), r, {
        s: Math.min(1, s + 0.16), layers: 8, alpha: 0.07, spread: 0.8, rim: 0.8, u: u
      });
    }
    granulate(c, box(0, 0, W, H, r, 60), r, tone(s), 0.6, u);
    c.globalCompositeOperation = "destination-in";
    c.font = font;
    if (o.spacing && "letterSpacing" in c) c.letterSpacing = o.spacing + "px";
    c.fillStyle = "#000";
    c.textBaseline = "alphabetic";
    c.fillText(text, pad, pad + asc);
    c.globalCompositeOperation = "source-atop";
    c.strokeStyle = rgba(tone(Math.min(1, s + 0.25)), 0.4);
    c.lineWidth = 2.2 * u;
    c.lineJoin = "round";
    c.strokeText(text, pad, pad + asc);
    ctx.save();
    ctx.globalCompositeOperation = o.mode || "multiply";
    ctx.drawImage(t, x - pad, y - asc - pad);
    ctx.restore();
    return { width: m.width, ascent: asc, descent: desc };
  }

  /* ---------- reveals ---------- */

  // Draw `src` through a ragged circle, as if soaking outward from a drop.
  function spread(ctx, src, cx, cy, radius, seed, o) {
    o = o || {};
    if (radius <= 0) return;
    var n1 = noise(seed), n2 = noise(seed + 7), rough = o.rough == null ? 0.2 : o.rough, steps = 160;
    ctx.save();
    ctx.beginPath();
    for (var i = 0; i < steps; i++) {
      var a = i / steps * TAU;
      var k = 1 + (n1(Math.cos(a) * 2.2 + 5) + n2(Math.sin(a) * 2.2 + 5) - 1) * rough;
      var x = cx + Math.cos(a) * radius * k, y = cy + Math.sin(a) * radius * k;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.closePath();
    if (o.edge) {
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      ctx.strokeStyle = rgba(tone(o.edgeS == null ? 0.5 : o.edgeS), o.edge);
      ctx.lineWidth = (o.u || 1) * 2.5;
      ctx.stroke();
      ctx.restore();
    }
    ctx.clip();
    ctx.drawImage(src, o.x || 0, o.y || 0);
    ctx.restore();
  }

  // Draw `src` as far as a loaded brush has travelled across it (t: 0 to 1).
  function sweep(ctx, src, t, seed, o) {
    o = o || {};
    var w = src.width, h = src.height, n = noise(seed), dir = o.dir || 1;
    var band = w * 0.16, edge = lerp(-band, w + band, t), steps = 48;
    ctx.save();
    ctx.beginPath();
    var base = dir > 0 ? -2 : w + 2;
    ctx.moveTo(base, -2);
    for (var i = 0; i <= steps; i++) {
      var y = i / steps * h;
      var jag = (fbm(n, y / h * 5, 3) - 0.5) * band * 1.6;
      ctx.lineTo(dir > 0 ? edge + jag : w - edge - jag, y);
    }
    ctx.lineTo(base, h + 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(src, o.x || 0, o.y || 0);
    ctx.restore();
  }

  /* ---------- subjects ---------- */

  var SUBJECTS = {};

  function ridgeLine(n, w, baseY, amp, f, off) {
    var pts = [], steps = 64;
    for (var i = 0; i <= steps; i++) {
      var x = lerp(-0.05 * w, 1.05 * w, i / steps);
      pts.push([x, baseY - amp * (fbm(n, off + (x / w) * f, 5) * 2.2 - 0.7)]);
    }
    return pts;
  }

  function downTo(line, bottom) {
    return line.concat([[line[line.length - 1][0], bottom], [line[0][0], bottom]]);
  }

  SUBJECTS.ridge = function (w, h, seed) {
    var u = Math.min(w, h) / 800, n = noise(seed * 3 + 1), portrait = h > w * 1.05;
    var sun = { x: w * (portrait ? 0.64 : 0.7), y: h * (portrait ? 0.27 : 0.3), r: Math.min(w, h) * 0.058 };
    var specs = [
      { name: "far",   y: 0.53, amp: 0.1,  f: 2.1, s: 0.1 },
      { name: "mid",   y: 0.61, amp: 0.11, f: 2.7, s: 0.24 },
      { name: "hills", y: 0.7,  amp: 0.1,  f: 3.2, s: 0.42 },
      { name: "near",  y: 0.8,  amp: 0.09, f: 3.9, s: 0.62 }
    ];
    var lines = specs.map(function (sp, i) { return ridgeLine(n, w, h * sp.y, h * sp.amp, sp.f, 11 + i * 37.1); });
    var layers = [{
      name: "sky",
      paint: function (c, r) {
        wash(c, box(-0.05 * w, -0.05 * h, 1.1 * w, h * 0.72, r, 40 * u), r, { s: 0.06, layers: 18, alpha: 0.026, baseVar: 0.25, spread: 0.7, rim: 0.2, u: u });
        wash(c, box(-0.05 * w, -0.05 * h, 1.1 * w, h * 0.26, r, 40 * u), r, { s: 0.14, layers: 14, alpha: 0.026, baseVar: 0.3, spread: 0.9, rim: 0, u: u });
        wash(c, ellipse(sun.x, h * 0.52, w * 0.5, h * 0.12, 16, r), r, { s: 0, layers: 14, alpha: 0.035, spread: 1.1, rim: 0, u: u });
        for (var i = 0; i < 5; i++) {
          var cy = h * (0.08 + r() * 0.3), cx = w * r(), cw = w * (0.1 + r() * 0.16);
          wash(c, ellipse(cx, cy, cw, h * (0.01 + r() * 0.012), 18, r), r, { s: 0.26, layers: 10, alpha: 0.04, baseVar: 0.4, spread: 0.6, rim: 0.8, u: u });
        }
        // The sun is paper that was never touched.
        lift(c, ellipse(sun.x, sun.y, sun.r * 1.7, sun.r * 1.7, 30, r), r, { alpha: 0.04, layers: 6, spread: 0.6, baseVar: 0.2 });
        lift(c, ellipse(sun.x, sun.y, sun.r, sun.r, 40, r), r, { alpha: 0.65, layers: 5, spread: 0.05, baseVar: 0.02 });
      }
    }];
    specs.forEach(function (sp, i) {
      layers.push({
        name: sp.name,
        paint: function (c, r) {
          var line = lines[i];
          wash(c, shape(downTo(line, h * 1.05), r, 14 * u, 0.5), r, {
            s: sp.s, layers: 12, alpha: 0.085, baseDepth: 1, baseVar: 0.1, depth: 2, spread: 0.22, rim: 1.8, rimWidth: 1.2, u: u, grain: sp.s > 0.3 ? 0.3 : 0
          });
          // a second, stronger pass along the crest
          var crest = line.concat(line.slice().reverse().map(function (p) { return [p[0], p[1] + h * 0.045]; }));
          wash(c, shape(crest, r, 12 * u, 0.6), r, { s: sp.s + 0.1, layers: 6, alpha: 0.06, baseDepth: 1, baseVar: 0.2, depth: 2, spread: 0.35, rim: 1.2, u: u });
          if (i < specs.length - 1) mist(c, h * (sp.y + 0.015), h * (sp.y + 0.13), 0.85);
        }
      });
    });
    layers.push({
      name: "trees",
      paint: function (c, r) {
        var groups = [
          { line: lines[2], count: 22, hmin: 0.03, hmax: 0.055, s: 0.55, clusters: 3, spread: 0.07 },
          { line: lines[3], count: 9, hmin: 0.09, hmax: 0.19, s: 0.82, clusters: 1, spread: 0.08 }
        ];
        groups.forEach(function (g, gi) {
          var centres = [];
          for (var k = 0; k < g.clusters; k++) centres.push(gi === 1 ? (portrait ? 0.2 : 0.17) * w : (0.15 + r() * 0.7) * w);
          var trees = [];
          for (var i = 0; i < g.count; i++) {
            var x = centres[i % g.clusters] + r.gauss() * w * g.spread;
            trees.push({ x: x, h: h * lerp(g.hmin, g.hmax, Math.pow(r(), 1.4)) });
          }
          trees.sort(function (a, b) { return a.h - b.h; });
          trees.forEach(function (t) {
            fir(c, r, t.x, yAt(g.line, t.x) + h * 0.012, t.h, { s: g.s + r() * 0.1, u: u });
          });
        });
      }
    });
    layers.push({
      name: "ground",
      paint: function (c, r) {
        var top = [], steps = 44;
        for (var i = 0; i <= steps; i++) {
          var x = lerp(-0.05 * w, 1.05 * w, i / steps);
          top.push([x, h * 0.945 - h * 0.07 * fbm(n, 90 + x / w * 7, 4) - h * 0.04 * (1 - smooth(0.05 * w, 0.4 * w, x))]);
        }
        wash(c, shape(downTo(top, h * 1.06), r, 14 * u, 0.7), r, { s: 0.8, layers: 8, alpha: 0.15, baseDepth: 1, baseVar: 0.12, depth: 2, spread: 0.2, rim: 1.4, u: u, grain: 0.4 });
        for (var g = 0; g < 80; g++) {
          var gx = r() * w, gy = yAt(top, gx) + h * 0.012, gh = h * (0.02 + r() * 0.05), lean = (r() - 0.5) * gh * 0.7;
          brush(c, quad([gx, gy], [gx + lean * 0.3, gy - gh * 0.6], [gx + lean, gy - gh], 8), u * (2 + r() * 2), u * 0.4, r, { s: 0.95, alpha: 0.45, layers: 2, u: u });
        }
      }
    });
    layers.push({
      name: "details",
      paint: function (c, r) {
        var bx = sun.x - w * 0.2, by = sun.y + h * 0.06;
        for (var i = 0; i < 3; i++) bird(c, r, bx + i * w * 0.04 + r() * w * 0.02, by + (r() - 0.5) * h * 0.05, Math.min(w, h) * (0.011 + r() * 0.008), u);
        drops(c, r, w * 0.86, h * 0.9, Math.min(w, h) * 0.05, 8, { u: u, s: 0.85 });
      }
    });
    return layers;
  };

  function chair(c, r, x, floor, dir, S, u) {
    var o = { s: 0.9, alpha: 0.5, layers: 2, u: u }, seat = floor - S * 0.45;
    brush(c, [[x - S * 0.2, seat], [x + S * 0.2, seat]], u * 4, u * 4, r, o);
    brush(c, [[x - dir * S * 0.19, seat], [x - dir * S * 0.24, floor - S]], u * 3, u * 2.4, r, o);
    brush(c, quad([x - dir * S * 0.24, floor - S], [x - dir * S * 0.05, floor - S * 1.08], [x + dir * S * 0.06, floor - S * 0.96], 8), u * 3, u * 2, r, o);
    brush(c, [[x - S * 0.17, seat], [x - S * 0.22, floor]], u * 2.6, u * 2.2, r, o);
    brush(c, [[x + S * 0.17, seat], [x + S * 0.22, floor]], u * 2.6, u * 2.2, r, o);
  }

  SUBJECTS.cafe = function (w, h, seed) {
    var u = Math.min(w, h) / 800;
    var X0 = 0.08 * w, X1 = 0.92 * w, Y0 = 0.08 * h, GROUND = 0.84 * h;
    var signY0 = 0.4 * h, signY1 = 0.465 * h, awnY1 = 0.545 * h;
    return [
      {
        name: "wall",
        paint: function (c, r) {
          wash(c, box(X0, Y0, X1 - X0, GROUND - Y0, r, 30 * u), r, { s: 0.1, layers: 12, alpha: 0.06, baseDepth: 1, baseVar: 0.06, depth: 2, spread: 0.16, rim: 1.4, u: u, grain: 0.3 });
          wash(c, box(X1 - 0.13 * w, Y0, 0.13 * w, GROUND - Y0, r, 30 * u), r, { s: 0.3, layers: 8, alpha: 0.06, baseDepth: 1, baseVar: 0.1, depth: 2, spread: 0.2, rim: 1.2, u: u });
          wash(c, box(X0 - 0.015 * w, Y0 - 0.012 * h, X1 - X0 + 0.03 * w, 0.034 * h, r, 20 * u), r, { s: 0.52, layers: 6, alpha: 0.13, baseDepth: 1, baseVar: 0.06, depth: 1, spread: 0.1, rim: 1.4, u: u });
          [[0.16, 0.33], [0.43, 0.6]].forEach(function (wx) {
            var x0 = wx[0] * w, x1 = wx[1] * w, y0 = 0.14 * h, y1 = 0.33 * h, g = 0.009 * w, mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
            [[x0, y0, mx - g / 2, my - g / 2], [mx + g / 2, y0, x1, my - g / 2], [x0, my + g / 2, mx - g / 2, y1], [mx + g / 2, my + g / 2, x1, y1]].forEach(function (p) {
              wash(c, box(p[0], p[1], p[2] - p[0], p[3] - p[1], r, 12 * u), r, { s: 0.64, layers: 6, alpha: 0.15, baseDepth: 1, baseVar: 0.05, depth: 1, spread: 0.1, rim: 1.6, u: u });
            });
            brush(c, [[x0 + (x1 - x0) * 0.18, y1 - (y1 - y0) * 0.08], [x0 + (x1 - x0) * 0.72, y0 + (y1 - y0) * 0.12]], 0.012 * w, 0.006 * w, r, { lift: true, alpha: 0.2, u: u });
            wash(c, box(x0 - 0.012 * w, y1 + 0.006 * h, x1 - x0 + 0.024 * w, 0.012 * h, r, 10 * u), r, { s: 0.55, layers: 4, alpha: 0.16, baseDepth: 0, depth: 1, spread: 0.1, rim: 1.2, u: u });
            // a window box of something green, painted brown
            for (var k = 0; k < 7; k++) {
              wash(c, ellipse(lerp(x0, x1, (k + 0.5) / 7), y1 + 0.03 * h + r.gauss() * u * 3, 0.018 * w, 0.014 * h, 12, r), r, { s: 0.5 + r() * 0.25, layers: 4, alpha: 0.2, baseVar: 0.5, depth: 1, spread: 0.3, rim: 1.6, u: u });
            }
          });
          var nx0 = 0.8 * w, nx1 = 0.88 * w;
          wash(c, box(nx0, 0.14 * h, nx1 - nx0, 0.19 * h, r, 10 * u), r, { s: 0.75, layers: 6, alpha: 0.15, baseDepth: 1, baseVar: 0.05, depth: 1, spread: 0.1, rim: 1.6, u: u });
        }
      },
      {
        name: "sign",
        paint: function (c, r) {
          wash(c, box(0.11 * w, signY0, 0.78 * w, signY1 - signY0, r, 14 * u), r, { s: 0.84, layers: 8, alpha: 0.2, baseDepth: 1, baseVar: 0.04, depth: 1, spread: 0.1, rim: 1.5, u: u, grain: 0.5 });
          var size = (signY1 - signY0) * 0.6;
          c.save();
          c.globalCompositeOperation = "destination-out";
          c.font = "400 " + size + "px Gloock, Georgia, serif";
          c.textAlign = "center";
          c.textBaseline = "middle";
          if ("letterSpacing" in c) c.letterSpacing = (size * 0.3) + "px";
          c.fillStyle = "rgba(0,0,0,0.9)";
          c.fillText("CAFÉ", w * 0.5 + size * 0.15, (signY0 + signY1) / 2 + size * 0.05);
          c.restore();
        }
      },
      {
        name: "awning",
        paint: function (c, r) {
          var stripes = 9, xa0 = 0.1 * w, xa1 = 0.9 * w, xb0 = 0.06 * w, xb1 = 0.94 * w;
          for (var i = 0; i < stripes; i++) {
            var t0 = i / stripes, t1 = (i + 1) / stripes;
            var pts = [[lerp(xa0, xa1, t0), signY1], [lerp(xa0, xa1, t1), signY1], [lerp(xb0, xb1, t1), awnY1]];
            for (var k = 0; k <= 8; k++) {
              var tt = k / 8;
              pts.push([lerp(lerp(xb0, xb1, t1), lerp(xb0, xb1, t0), tt), awnY1 + Math.sin(tt * Math.PI) * 0.02 * h]);
            }
            wash(c, shape(pts, r, 8 * u, 0.4), r, { s: i % 2 ? 0.18 : 0.72, layers: 6, alpha: i % 2 ? 0.1 : 0.17, baseDepth: 0, depth: 1, spread: 0.1, rim: 1.4, u: u });
          }
          wash(c, box(0.09 * w, awnY1 + 0.012 * h, 0.82 * w, 0.05 * h, r, 20 * u), r, { s: 0.45, layers: 10, alpha: 0.05, baseVar: 0.2, spread: 0.6, rim: 0, u: u });
        }
      },
      {
        name: "shop",
        paint: function (c, r) {
          var x0 = 0.12 * w, x1 = 0.6 * w, y0 = 0.58 * h, y1 = 0.8 * h;
          wash(c, box(x0, y0, x1 - x0, y1 - y0, r, 14 * u), r, { s: 0.8, layers: 8, alpha: 0.2, baseDepth: 1, baseVar: 0.04, depth: 1, spread: 0.1, rim: 1.6, u: u, grain: 0.4 });
          lift(c, ellipse(x0 + (x1 - x0) * 0.3, y0 + (y1 - y0) * 0.32, 0.05 * w, 0.028 * h, 16, r), r, { alpha: 0.1, layers: 5, spread: 0.7 });
          lift(c, ellipse(x0 + (x1 - x0) * 0.74, y0 + (y1 - y0) * 0.28, 0.04 * w, 0.024 * h, 16, r), r, { alpha: 0.1, layers: 5, spread: 0.7 });
          lift(c, box((x0 + x1) / 2 - 0.004 * w, y0, 0.008 * w, y1 - y0, r, 10 * u), r, { alpha: 0.75, layers: 3, spread: 0.04, baseVar: 0.02 });
          brush(c, [[x0 + 0.03 * w, y1 - 0.02 * h], [x0 + 0.15 * w, y0 + 0.02 * h]], 0.01 * w, 0.005 * w, r, { lift: true, alpha: 0.16, u: u });
          brush(c, [[x0 + 0.08 * w, y1 - 0.01 * h], [x0 + 0.19 * w, y0 + 0.06 * h]], 0.008 * w, 0.004 * w, r, { lift: true, alpha: 0.22, u: u });
          var d0 = 0.66 * w, d1 = 0.84 * w;
          wash(c, box(d0, y0, d1 - d0, GROUND - y0, r, 14 * u), r, { s: 0.9, layers: 8, alpha: 0.22, baseDepth: 1, baseVar: 0.04, depth: 1, spread: 0.1, rim: 1.4, u: u });
          lift(c, box(d0 + 0.03 * w, y0 + 0.03 * h, d1 - d0 - 0.06 * w, 0.1 * h, r, 10 * u), r, { alpha: 0.42, layers: 4, spread: 0.1, baseVar: 0.05 });
          lift(c, ellipse(d1 - 0.028 * w, 0.72 * h, 0.006 * w, 0.006 * w, 10, r), r, { alpha: 0.6, layers: 3, spread: 0.1 });
        }
      },
      {
        name: "street",
        paint: function (c, r) {
          wash(c, box(-0.02 * w, GROUND, 1.04 * w, h - GROUND + 0.02 * h, r, 30 * u), r, { s: 0.22, layers: 10, alpha: 0.06, baseDepth: 1, baseVar: 0.1, depth: 2, spread: 0.3, rim: 0.6, u: u, grain: 0.5 });
          brush(c, hand(-0.02 * w, GROUND + 0.004 * h, 1.02 * w, GROUND + 0.004 * h, r, 20, u), u * 3, u * 3, r, { s: 0.7, alpha: 0.3, layers: 2, u: u });
          var tx = 0.36 * w, ty = 0.885 * h, floor = 0.965 * h, S = 0.13 * h;
          wash(c, ellipse(tx + 0.03 * w, floor + 0.004 * h, 0.14 * w, 0.013 * h, 18, r), r, { s: 0.5, layers: 6, alpha: 0.07, spread: 0.5, rim: 0, u: u });
          wash(c, ellipse(tx, ty, 0.075 * w, 0.012 * h, 20, r), r, { s: 0.9, layers: 4, alpha: 0.32, baseDepth: 0, depth: 1, spread: 0.1, rim: 1, u: u });
          brush(c, [[tx, ty], [tx, floor - 0.004 * h]], u * 4, u * 3, r, { s: 0.9, alpha: 0.5, layers: 2, u: u });
          brush(c, [[tx - 0.03 * w, floor - 0.003 * h], [tx + 0.03 * w, floor - 0.003 * h]], u * 3, u * 3, r, { s: 0.9, alpha: 0.5, layers: 2, u: u });
          chair(c, r, tx - 0.12 * w, floor, 1, S, u);
          chair(c, r, tx + 0.12 * w, floor, -1, S, u);
          var px = 0.63 * w;
          wash(c, shape([[px - 0.024 * w, 0.8 * h], [px + 0.024 * w, 0.8 * h], [px + 0.017 * w, GROUND], [px - 0.017 * w, GROUND]], r, 6 * u), r, { s: 0.6, layers: 4, alpha: 0.25, baseDepth: 0, depth: 1, spread: 0.1, rim: 1.4, u: u });
          for (var k = 0; k < 9; k++) {
            wash(c, ellipse(px + r.gauss() * 0.02 * w, 0.765 * h + r.gauss() * 0.018 * h, 0.014 * w, 0.011 * h, 10, r), r, { s: 0.45 + r() * 0.35, layers: 4, alpha: 0.22, baseVar: 0.5, depth: 1, spread: 0.3, rim: 1.6, u: u });
          }
        }
      },
      {
        name: "lines",
        paint: function (c, r) {
          [[X0, Y0 + 0.03 * h, X0, GROUND], [X1, Y0 + 0.03 * h, X1, GROUND], [X1 - 0.13 * w, Y0 + 0.03 * h, X1 - 0.13 * w, GROUND]].forEach(function (L) {
            brush(c, hand(L[0], L[1], L[2], L[3], r, 16, u), u * 2, u * 1.4, r, { s: 0.75, alpha: 0.26, layers: 2, u: u });
          });
          drops(c, r, 0.2 * w, 0.95 * h, 0.05 * w, 6, { u: u, s: 0.7 });
        }
      }
    ];
  };

  SUBJECTS.fern = function (w, h, seed) {
    var u = Math.min(w, h) / 800;
    function leaflet(c, r, p, a, len, bend, s) {
      var n = 22, cx = p[0], cy = p[1], centre = [];
      for (var k = 0; k <= n; k++) {
        var t = k / n, aa = a + bend * t * t;
        centre.push([cx, cy]);
        cx += Math.cos(aa) * len / n;
        cy += Math.sin(aa) * len / n;
      }
      var L = [], R = [];
      for (k = 0; k <= n; k++) {
        var t2 = k / n, q0 = centre[Math.max(0, k - 1)], q1 = centre[Math.min(n, k + 1)];
        var dx = q1[0] - q0[0], dy = q1[1] - q0[1], d = Math.hypot(dx, dy) || 1;
        var hw = len * 0.14 * Math.pow(Math.sin(Math.PI * Math.min(1, t2 * 1.04)), 0.7) * (0.55 + 0.45 * Math.abs(Math.sin(t2 * Math.PI * 6)));
        L.push([centre[k][0] - dy / d * hw, centre[k][1] + dx / d * hw]);
        R.push([centre[k][0] + dy / d * hw, centre[k][1] - dx / d * hw]);
      }
      wash(c, shape(L.concat(R.reverse()), r, 4 * u, 0.5), r, { s: s, layers: 5, alpha: 0.15, baseDepth: 0, depth: 1, spread: 0.18, rim: 2, u: u });
      brush(c, centre, u * 1.6, u * 0.4, r, { s: Math.min(1, s + 0.25), alpha: 0.28, layers: 1, u: u });
    }
    function frond(c, r, base, c1, c2, tip, size, s, count) {
      var stem = cubic(base, c1, c2, tip, 80);
      for (var i = 0; i < count; i++) {
        var t = 0.04 + (i / count) * 0.93, idx = Math.floor(t * 80), p = stem[idx], q = stem[Math.min(80, idx + 1)];
        var ang = Math.atan2(q[1] - p[1], q[0] - p[0]), side = i % 2 ? 1 : -1;
        var len = size * Math.pow(1 - t, 0.5) * smooth(0, 0.16, t + 0.03) * (0.85 + r() * 0.3);
        leaflet(c, r, p, ang + side * (1.02 + r() * 0.2), len, side * 0.4, s + (r() - 0.5) * 0.14);
      }
      brush(c, stem, u * 7, u * 1.2, r, { s: Math.min(1, s + 0.22), alpha: 0.45, layers: 3, u: u });
    }
    return [
      {
        name: "behind",
        paint: function (c, r) {
          frond(c, r, [0.6 * w, 1.0 * h], [0.72 * w, 0.72 * h], [0.8 * w, 0.42 * h], [0.68 * w, 0.16 * h], h * 0.19, 0.12, 26);
        }
      },
      {
        name: "frond",
        paint: function (c, r) {
          frond(c, r, [0.46 * w, 1.0 * h], [0.54 * w, 0.66 * h], [0.3 * w, 0.38 * h], [0.42 * w, 0.06 * h], h * 0.25, 0.42, 34);
        }
      },
      {
        name: "drops",
        paint: function (c, r) {
          drops(c, r, 0.2 * w, 0.86 * h, 0.06 * w, 7, { u: u, s: 0.5 });
          drops(c, r, 0.82 * w, 0.2 * h, 0.03 * w, 4, { u: u, s: 0.35 });
        }
      }
    ];
  };

  function boat(c, r, b, u) {
    var L = b.L, x = b.x, y = b.y;
    wash(c, shape([[x - L * 0.5, y - L * 0.1], [x + L * 0.5, y - L * 0.15], [x + L * 0.38, y + L * 0.02], [x - L * 0.4, y + L * 0.02]], r, 6 * u, 0.4), r, { s: b.s, layers: 5, alpha: 0.3, baseDepth: 0, depth: 1, spread: 0.1, rim: 1.4, u: u });
    brush(c, [[x - L * 0.46, y - L * 0.08], [x + L * 0.46, y - L * 0.125]], u * 2.2, u * 2.2, r, { lift: true, alpha: 0.5, u: u });
    wash(c, box(x - L * 0.14, y - L * 0.25, L * 0.2, L * 0.13, r, 6 * u), r, { s: b.s - 0.3, layers: 4, alpha: 0.25, baseDepth: 0, depth: 1, spread: 0.08, rim: 1.4, u: u });
    brush(c, [[x + L * 0.02, y - L * 0.12], [x + L * 0.02, y - L * 1.05]], u * 2.8, u * 1.4, r, { s: 0.9, alpha: 0.55, layers: 2, u: u });
    brush(c, [[x + L * 0.02, y - L * 0.32], [x - L * 0.36, y - L * 0.27]], u * 1.8, u * 1.4, r, { s: 0.9, alpha: 0.5, layers: 2, u: u });
    c.save();
    c.globalCompositeOperation = "multiply";
    c.strokeStyle = rgba(tone(0.8), 0.32);
    c.lineWidth = u * 0.8;
    c.beginPath();
    c.moveTo(x + L * 0.02, y - L * 1.05); c.lineTo(x + L * 0.5, y - L * 0.15);
    c.moveTo(x + L * 0.02, y - L * 1.05); c.lineTo(x - L * 0.5, y - L * 0.1);
    c.stroke();
    c.restore();
  }

  function zigzag(x, y0, len, amp, n) {
    var out = [];
    for (var j = 0; j <= n; j++) out.push([x + (j % 2 ? amp : -amp) * (1 + j * 0.35), y0 + j / n * len]);
    return out;
  }

  SUBJECTS.harbor = function (w, h, seed) {
    var u = Math.min(w, h) / 800, HZ = 0.5 * h, n = noise(seed + 5);
    var boats = [{ x: 0.3 * w, y: 0.68 * h, L: 0.2 * w, s: 0.74 }, { x: 0.6 * w, y: 0.59 * h, L: 0.11 * w, s: 0.58 }, { x: 0.8 * w, y: 0.77 * h, L: 0.16 * w, s: 0.82 }];
    var shore = [];
    for (var i = 0; i <= 50; i++) {
      var x = lerp(-0.04 * w, 1.04 * w, i / 50);
      shore.push([x, HZ - h * 0.03 * fbm(n, x / w * 4, 4) - h * 0.045 * smooth(0.55 * w, 0.78 * w, x) * (1 - smooth(0.9 * w, 1.04 * w, x))]);
    }
    return [
      {
        name: "sky",
        paint: function (c, r) {
          wash(c, box(-0.05 * w, -0.05 * h, 1.1 * w, HZ + 0.06 * h, r, 40 * u), r, { s: 0.08, layers: 16, alpha: 0.035, baseVar: 0.2, spread: 0.8, rim: 0.2, u: u });
          for (var i = 0; i < 4; i++) {
            wash(c, ellipse(w * r(), h * (0.1 + r() * 0.25), w * (0.12 + r() * 0.14), h * 0.02, 16, r), r, { s: 0.25, layers: 10, alpha: 0.045, baseVar: 0.4, spread: 0.7, rim: 0.6, u: u });
          }
        }
      },
      {
        name: "shore",
        paint: function (c, r) {
          wash(c, shape(downTo(shore, HZ + 0.012 * h), r, 12 * u, 0.5), r, { s: 0.4, layers: 8, alpha: 0.1, baseDepth: 1, baseVar: 0.1, depth: 2, spread: 0.2, rim: 1.4, u: u });
          for (var k = 0; k < 10; k++) {
            var bx = 0.06 * w + r() * 0.5 * w, bw = 0.012 * w + r() * 0.02 * w, bh = 0.012 * h + r() * 0.025 * h, by = yAt(shore, bx) + 0.004 * h;
            wash(c, box(bx, by - bh, bw, bh, r, 6 * u), r, { s: 0.48 + r() * 0.2, layers: 3, alpha: 0.26, baseDepth: 0, depth: 1, spread: 0.08, rim: 1.2, u: u });
          }
          var lx = 0.84 * w, ly = yAt(shore, lx) + 0.004 * h;
          wash(c, shape([[lx - 0.009 * w, ly], [lx + 0.009 * w, ly], [lx + 0.006 * w, ly - 0.075 * h], [lx - 0.006 * w, ly - 0.075 * h]], r, 5 * u), r, { s: 0.25, layers: 4, alpha: 0.2, baseDepth: 0, depth: 1, spread: 0.06, rim: 1.4, u: u });
          wash(c, box(lx - 0.008 * w, ly - 0.05 * h, 0.016 * w, 0.012 * h, r, 4 * u), r, { s: 0.7, layers: 3, alpha: 0.3, baseDepth: 0, depth: 1, spread: 0.05, rim: 1, u: u });
          wash(c, box(lx - 0.01 * w, ly - 0.088 * h, 0.02 * w, 0.014 * h, r, 4 * u), r, { s: 0.85, layers: 3, alpha: 0.35, baseDepth: 0, depth: 1, spread: 0.05, rim: 1, u: u });
        }
      },
      {
        name: "water",
        paint: function (c, r) {
          wash(c, box(-0.05 * w, HZ + 0.008 * h, 1.1 * w, h - HZ + 0.05 * h, r, 40 * u), r, { s: 0.15, layers: 10, alpha: 0.05, baseVar: 0.1, spread: 0.3, rim: 0.4, u: u });
          for (var i = 0; i < 120; i++) {
            var t = Math.pow(r(), 0.8), y = HZ + 0.015 * h + t * (h - HZ);
            var len = w * (0.03 + r() * 0.15) * (0.5 + t), x = r() * w - len / 2, th = u * (1 + t * 4) * (0.6 + r());
            brush(c, [[x, y], [x + len * 0.5, y + (r() - 0.5) * u * 2], [x + len, y]], th, th * 0.6, r, { s: 0.3 + t * 0.35, alpha: 0.22, layers: 2, u: u, jitter: 0.6 });
          }
        }
      },
      {
        name: "boats",
        paint: function (c, r) {
          boats.forEach(function (b) {
            for (var k = 0; k < 10; k++) {
              var xx = b.x + (r() - 0.5) * b.L * 0.8;
              brush(c, zigzag(xx, b.y + b.L * 0.04, b.L * (0.12 + r() * 0.26), u * 2.5, 6), u * 4, u * 2, r, { s: b.s - 0.15, alpha: 0.22, layers: 2, u: u });
            }
            brush(c, zigzag(b.x + b.L * 0.02, b.y + b.L * 0.06, b.L * 0.7, u * 3, 10), u * 2, u * 1, r, { s: 0.8, alpha: 0.26, layers: 2, u: u });
            boat(c, r, b, u);
          });
        }
      },
      {
        name: "details",
        paint: function (c, r) {
          [0.1, 0.14, 0.52].forEach(function (px, i) {
            var x = px * w, top = 0.8 * h + i * 0.02 * h, bottom = 0.9 * h;
            brush(c, [[x, top], [x, bottom]], u * 7, u * 6, r, { s: 0.92, alpha: 0.45, layers: 3, u: u });
            brush(c, zigzag(x, bottom + 0.004 * h, 0.07 * h, u * 3, 6), u * 5, u * 2, r, { s: 0.7, alpha: 0.25, layers: 2, u: u });
          });
          bird(c, r, 0.62 * w, 0.2 * h, 0.014 * Math.min(w, h), u);
          bird(c, r, 0.66 * w, 0.24 * h, 0.01 * Math.min(w, h), u);
          drops(c, r, 0.92 * w, 0.92 * h, 0.04 * w, 6, { u: u, s: 0.75 });
        }
      }
    ];
  };

  SUBJECTS.cup = function (w, h, seed) {
    var u = Math.min(w, h) / 800, cx = 0.47 * w, top = 0.43 * h, rx = 0.15 * w, ry = 0.045 * h, base = 0.72 * h, brx = 0.09 * w, TABLE = 0.62 * h;
    function body() {
      var pts = [], i;
      for (i = 0; i <= 24; i++) { var a = -i / 24 * Math.PI; pts.push([cx + Math.cos(a) * rx, top + Math.sin(a) * ry]); }
      pts = pts.concat(cubic([cx - rx, top], [cx - rx * 1.03, top + (base - top) * 0.55], [cx - brx * 1.3, base - (base - top) * 0.06], [cx - brx, base], 20).slice(1));
      for (i = 1; i <= 16; i++) { var a2 = Math.PI - i / 16 * Math.PI; pts.push([cx + Math.cos(a2) * brx, base + Math.sin(a2) * ry * 0.55]); }
      pts = pts.concat(cubic([cx + brx, base], [cx + brx * 1.3, base - (base - top) * 0.06], [cx + rx * 1.03, top + (base - top) * 0.55], [cx + rx, top], 20).slice(1, -1));
      return pts;
    }
    return [
      {
        name: "room",
        paint: function (c, r) {
          wash(c, box(-0.05 * w, -0.05 * h, 1.1 * w, TABLE + 0.05 * h, r, 40 * u), r, { s: 0.14, layers: 14, alpha: 0.042, baseVar: 0.15, spread: 0.5, rim: 0.3, u: u });
          lift(c, shape([[0.02 * w, -0.05 * h], [0.34 * w, -0.05 * h], [0.18 * w, TABLE], [-0.14 * w, TABLE]], r, 30 * u), r, { alpha: 0.16, layers: 6, spread: 0.4, baseVar: 0.2 });
          wash(c, box(-0.05 * w, TABLE, 1.1 * w, h - TABLE + 0.05 * h, r, 40 * u), r, { s: 0.3, layers: 12, alpha: 0.06, baseDepth: 1, baseVar: 0.06, depth: 2, spread: 0.25, rim: 1, u: u, grain: 0.4 });
          for (var i = 0; i < 12; i++) {
            var y = TABLE + (h - TABLE) * r(), x = r() * w * 0.8;
            brush(c, [[x, y], [x + w * (0.2 + r() * 0.3), y + (r() - 0.5) * u * 3]], u * 2, u, r, { s: 0.45, alpha: 0.12, layers: 1, u: u });
          }
          brush(c, [[-0.02 * w, TABLE], [1.02 * w, TABLE]], u * 3, u * 3, r, { s: 0.52, alpha: 0.26, layers: 2, u: u });
          // steam lifted out of the wall
          for (var k = 0; k < 3; k++) {
            var sx = cx + (k - 1) * rx * 0.4, line = [];
            for (var j = 0; j <= 24; j++) { var t = j / 24; line.push([sx + Math.sin(t * 5 + k * 2) * rx * 0.2 * t, top - ry * 1.6 - t * h * 0.28]); }
            brush(c, line, u * 12, u * 2, r, { lift: true, alpha: 0.16, u: u });
          }
        }
      },
      {
        name: "shadow",
        paint: function (c, r) {
          wash(c, ellipse(cx + rx * 1.1, base + ry * 0.6, rx * 1.7, ry * 1.3, 24, r), r, { s: 0.55, layers: 10, alpha: 0.05, spread: 0.5, rim: 0.2, u: u });
        }
      },
      {
        name: "saucer",
        paint: function (c, r) {
          var sy = base + ry * 0.3;
          wash(c, ellipse(cx, sy, rx * 1.65, ry * 1.55, 40, r), r, { s: 0.16, layers: 8, alpha: 0.08, baseDepth: 1, baseVar: 0.03, depth: 1, spread: 0.08, rim: 1.5, u: u });
          var band = [], i;
          for (i = 0; i <= 30; i++) { var a = i / 30 * Math.PI; band.push([cx + Math.cos(a) * rx * 1.65, sy + Math.sin(a) * ry * 1.55]); }
          for (i = 30; i >= 0; i--) { var a2 = i / 30 * Math.PI; band.push([cx + Math.cos(a2) * rx * 1.6, sy + Math.sin(a2) * ry * 1.2]); }
          wash(c, shape(band, r, 6 * u), r, { s: 0.45, layers: 5, alpha: 0.12, baseDepth: 0, depth: 1, spread: 0.1, rim: 1, u: u });
        }
      },
      {
        name: "cup",
        paint: function (c, r) {
          var b = body();
          wash(c, shape(b, r, 8 * u, 0.3), r, { s: 0.12, layers: 8, alpha: 0.07, baseDepth: 0, depth: 1, spread: 0.06, rim: 1.4, u: u });
          c.save();
          c.beginPath(); c.moveTo(b[0][0], b[0][1]);
          for (var i = 1; i < b.length; i++) c.lineTo(b[i][0], b[i][1]);
          c.closePath(); c.clip();
          wash(c, box(cx + rx * 0.05, top - ry, rx * 1.2, base - top + ry * 2, r, 12 * u), r, { s: 0.42, layers: 12, alpha: 0.05, baseVar: 0.15, spread: 0.7, rim: 0, u: u });
          wash(c, box(cx + rx * 0.55, top - ry, rx * 0.6, base - top + ry * 2, r, 12 * u), r, { s: 0.55, layers: 8, alpha: 0.05, baseVar: 0.15, spread: 0.6, rim: 0, u: u });
          c.restore();
          brush(c, [[cx - rx * 0.62, top + ry * 1.6], [cx - rx * 0.56, base - ry * 1.3]], rx * 0.1, rx * 0.04, r, { lift: true, alpha: 0.35, u: u });
          var hl = [];
          for (var k = 0; k <= 24; k++) { var a = -1.35 + k / 24 * 2.7; hl.push([cx + rx * 0.98 + Math.cos(a) * rx * 0.34, top + (base - top) * 0.38 + Math.sin(a) * (base - top) * 0.28]); }
          brush(c, hl, u * 16, u * 12, r, { s: 0.36, alpha: 0.35, layers: 3, u: u });
          wash(c, ellipse(cx, top + ry * 0.06, rx * 0.9, ry * 0.76, 36, r), r, { s: 0.55, layers: 6, alpha: 0.22, baseDepth: 0, depth: 1, spread: 0.05, rim: 1.5, u: u });
          wash(c, ellipse(cx + rx * 0.05, top + ry * 0.12, rx * 0.7, ry * 0.56, 36, r), r, { s: 0.95, layers: 6, alpha: 0.32, baseDepth: 1, baseVar: 0.05, depth: 1, spread: 0.1, rim: 1, u: u });
          lift(c, ellipse(cx - rx * 0.36, top - ry * 0.02, rx * 0.12, ry * 0.14, 14, r), r, { alpha: 0.4, layers: 3, spread: 0.2 });
          var rimLine = [];
          for (k = 0; k <= 48; k++) { var a3 = k / 48 * Math.PI * 2; rimLine.push([cx + Math.cos(a3) * rx, top + Math.sin(a3) * ry]); }
          brush(c, rimLine, u * 2.4, u * 2.4, r, { s: 0.5, alpha: 0.22, layers: 2, u: u });
        }
      },
      {
        name: "details",
        paint: function (c, r) {
          ring(c, 0.16 * w, 0.86 * h, 0.07 * w, r, { u: u, s: 0.6, squash: 0.32, passes: 10 });
          drops(c, r, 0.8 * w, 0.9 * h, 0.04 * w, 6, { u: u, s: 0.75, squash: 0.4 });
        }
      }
    ];
  };

  SUBJECTS.night = function (w, h, seed) {
    var u = Math.min(w, h) / 800, HZ = 0.58 * h, n = noise(seed);
    var moon = { x: 0.3 * w, y: 0.25 * h, r: Math.min(w, h) * 0.07 };
    var hills = ridgeLine(n, w, HZ, h * 0.06, 2.4, 3);
    var bank = [];
    for (var i = 0; i <= 30; i++) {
      var x = lerp(0.5 * w, 1.05 * w, i / 30);
      bank.push([x, 0.9 * h - 0.1 * h * smooth(0.5 * w, 0.85 * w, x) - 0.03 * h * fbm(n, 50 + x / w * 5, 3)]);
    }
    var trees = [];
    var tr = rng(seed + 99);
    for (i = 0; i < 9; i++) {
      var tx = lerp(0.64 * w, 1.02 * w, Math.pow(tr(), 0.7));
      trees.push({ x: tx, h: h * (0.16 + tr() * 0.22) });
    }
    trees.sort(function (a, b) { return a.h - b.h; });
    return [
      {
        name: "sky",
        paint: function (c, r) {
          wash(c, box(-0.05 * w, -0.05 * h, 1.1 * w, HZ + 0.05 * h, r, 40 * u), r, { s: 0.6, layers: 16, alpha: 0.065, baseVar: 0.15, spread: 0.6, rim: 0.3, u: u, grain: 0.3 });
          wash(c, box(-0.05 * w, -0.05 * h, 1.1 * w, 0.3 * h, r, 40 * u), r, { s: 0.85, layers: 12, alpha: 0.06, baseVar: 0.3, spread: 0.9, rim: 0, u: u });
          lift(c, ellipse(moon.x, moon.y, moon.r * 2.2, moon.r * 2.2, 30, r), r, { alpha: 0.03, layers: 7, spread: 0.7, baseVar: 0.3 });
          lift(c, ellipse(moon.x, moon.y, moon.r, moon.r, 40, r), r, { alpha: 0.72, layers: 5, spread: 0.05, baseVar: 0.02 });
          c.save();
          c.globalCompositeOperation = "destination-out";
          for (var i = 0; i < 60; i++) {
            c.fillStyle = "rgba(0,0,0," + (0.35 + r() * 0.55) + ")";
            c.beginPath();
            c.arc(r() * w, r() * HZ * 0.85, (0.5 + Math.pow(r(), 3) * 1.8) * u, 0, TAU);
            c.fill();
          }
          c.restore();
        }
      },
      {
        name: "hills",
        paint: function (c, r) {
          wash(c, shape(downTo(hills, HZ + 0.02 * h), r, 12 * u, 0.5), r, { s: 0.96, layers: 10, alpha: 0.16, baseDepth: 1, baseVar: 0.1, depth: 2, spread: 0.2, rim: 1.4, u: u });
        }
      },
      {
        name: "lake",
        paint: function (c, r) {
          wash(c, box(-0.05 * w, HZ + 0.012 * h, 1.1 * w, h - HZ + 0.05 * h, r, 40 * u), r, { s: 0.78, layers: 12, alpha: 0.075, baseVar: 0.1, spread: 0.3, rim: 0.3, u: u });
          for (var i = 0; i < 28; i++) {
            var t = i / 28, y = HZ + 0.025 * h + t * (h - HZ) * 0.9, half = moon.r * (0.35 + t * 1.6) * (0.5 + r() * 0.7), x = moon.x + (r() - 0.5) * moon.r * 0.5;
            brush(c, [[x - half, y], [x + half, y + (r() - 0.5) * u * 2]], u * (1.5 + t * 4), u * (1 + t * 2), r, { lift: true, alpha: 0.55 - t * 0.25, u: u });
          }
        }
      },
      {
        name: "shore",
        paint: function (c, r) {
          wash(c, shape(downTo(bank, 1.06 * h), r, 10 * u, 0.5), r, { s: 1, layers: 8, alpha: 0.22, baseDepth: 1, baseVar: 0.1, depth: 2, spread: 0.2, rim: 1.2, u: u });
          trees.forEach(function (t) {
            var by = yAt(bank, t.x) + 0.01 * h;
            fir(c, r, t.x, by, t.h, { s: 1, alpha: 0.42, u: u });
          });
        }
      },
      {
        name: "reeds",
        paint: function (c, r) {
          for (var i = 0; i < 40; i++) {
            var x = r() * 0.4 * w, y = h * (1.0 + r() * 0.02), hh = h * (0.06 + r() * 0.14), lean = (r() - 0.3) * hh * 0.3;
            brush(c, quad([x, y], [x + lean * 0.2, y - hh * 0.5], [x + lean, y - hh], 10), u * 3, u * 0.5, r, { s: 1, alpha: 0.4, layers: 2, u: u });
          }
          drops(c, r, 0.12 * w, 0.2 * h, 0.03 * w, 4, { u: u, s: 0.9 });
        }
      }
    ];
  };

  SUBJECTS.pines = function (w, h, seed) {
    var u = Math.min(w, h) / 800, n = noise(seed);
    var rows = [
      { y: 0.46, s: 0.14, hmin: 0.07, hmax: 0.12, count: 18 },
      { y: 0.58, s: 0.3, hmin: 0.11, hmax: 0.18, count: 13 },
      { y: 0.72, s: 0.52, hmin: 0.16, hmax: 0.28, count: 9 },
      { y: 0.93, s: 0.86, hmin: 0.3, hmax: 0.52, count: 5 }
    ];
    var layers = [{
      name: "sky",
      paint: function (c, r) {
        wash(c, box(-0.05 * w, -0.05 * h, 1.1 * w, 0.6 * h, r, 40 * u), r, { s: 0.06, layers: 16, alpha: 0.035, baseVar: 0.25, spread: 0.8, rim: 0.2, u: u });
        lift(c, ellipse(0.62 * w, 0.26 * h, 0.3 * w, 0.14 * h, 20, r), r, { alpha: 0.08, layers: 6, spread: 0.6 });
      }
    }];
    rows.forEach(function (row, ri) {
      layers.push({
        name: "row" + ri,
        paint: function (c, r) {
          var ground = [];
          for (var i = 0; i <= 40; i++) {
            var x = lerp(-0.05 * w, 1.05 * w, i / 40);
            ground.push([x, h * row.y - h * 0.02 * fbm(n, ri * 20 + x / w * 3, 3)]);
          }
          wash(c, shape(downTo(ground, 1.05 * h), r, 12 * u, 0.5), r, { s: row.s, layers: 8, alpha: 0.08, baseDepth: 1, baseVar: 0.1, depth: 2, spread: 0.2, rim: 1.4, u: u });
          var trees = [];
          for (i = 0; i < row.count; i++) trees.push({ x: ((i + 0.5) / row.count + r.gauss() * 0.3 / row.count) * w, h: h * lerp(row.hmin, row.hmax, r()) });
          trees.sort(function (a, b) { return a.h - b.h; });
          trees.forEach(function (t) { fir(c, r, t.x, yAt(ground, t.x) + h * 0.01, t.h, { s: row.s + 0.06, alpha: 0.36 + ri * 0.03, u: u }); });
          if (ri < rows.length - 1) mist(c, h * (row.y + 0.005), h * (row.y + 0.1), 0.9);
        }
      });
    });
    layers.push({
      name: "drops",
      paint: function (c, r) { drops(c, r, 0.84 * w, 0.14 * h, 0.04 * w, 6, { u: u, s: 0.4 }); }
    });
    return layers;
  };

  SUBJECTS.blooms = function (w, h, seed) {
    var S = Math.min(w, h), u = S / 800;
    var heads = [
      { x: 0.37 * w, y: 0.37 * h, R: 0.16 * S, s: 0.3 },
      { x: 0.67 * w, y: 0.5 * h, R: 0.125 * S, s: 0.2 },
      { x: 0.45 * w, y: 0.71 * h, R: 0.1 * S, s: 0.42 }
    ];
    function leaf(c, r, x, y, a, len, s) {
      var pts = [], i;
      for (i = 0; i <= 12; i++) {
        var t = i / 12, hw = len * 0.2 * Math.sin(Math.PI * t);
        pts.push([x + Math.cos(a) * len * t - Math.sin(a) * hw, y + Math.sin(a) * len * t + Math.cos(a) * hw]);
      }
      for (i = 11; i > 0; i--) {
        var t2 = i / 12, hw2 = len * 0.2 * Math.sin(Math.PI * t2);
        pts.push([x + Math.cos(a) * len * t2 + Math.sin(a) * hw2, y + Math.sin(a) * len * t2 - Math.cos(a) * hw2]);
      }
      wash(c, shape(pts, r, 5 * u, 0.5), r, { s: s, layers: 6, alpha: 0.14, baseDepth: 0, depth: 2, spread: 0.2, rim: 1.8, u: u });
      brush(c, [[x, y], [x + Math.cos(a) * len * 0.9, y + Math.sin(a) * len * 0.9]], u * 1.4, u * 0.4, r, { s: s + 0.2, alpha: 0.25, layers: 1, u: u });
    }
    return [
      {
        name: "stems",
        paint: function (c, r) {
          heads.forEach(function (hd, i) {
            var end = [0.5 * w + (i - 1) * 0.04 * w, 1.02 * h];
            var line = quad([hd.x, hd.y + hd.R * 0.3], [lerp(hd.x, end[0], 0.5) + (i - 1) * 0.06 * w, lerp(hd.y, end[1], 0.6)], end, 20);
            brush(c, line, u * 5, u * 3.5, r, { s: 0.5, alpha: 0.35, layers: 3, u: u });
            for (var k = 0; k < 2; k++) {
              var p = line[8 + k * 6], side = (k + i) % 2 ? 1 : -1;
              leaf(c, r, p[0], p[1], -Math.PI / 2 + side * (0.9 + r() * 0.4), S * (0.12 + r() * 0.06), 0.4 + r() * 0.15);
            }
          });
        }
      },
      {
        name: "petals",
        paint: function (c, r) {
          heads.forEach(function (hd) {
            var i, a;
            for (i = 0; i < 9; i++) {
              a = i / 9 * TAU + r() * 0.4;
              wash(c, ellipse(hd.x + Math.cos(a) * hd.R * 0.5, hd.y + Math.sin(a) * hd.R * 0.46, hd.R * 0.5, hd.R * 0.36, 16, r, { rot: a }), r, {
                s: hd.s + (r() - 0.5) * 0.14, layers: 8, alpha: 0.075, baseVar: 0.4, spread: 0.45, rim: 1.8, u: u
              });
            }
            for (i = 0; i < 6; i++) {
              a = i / 6 * TAU + r();
              wash(c, ellipse(hd.x + Math.cos(a) * hd.R * 0.22, hd.y + Math.sin(a) * hd.R * 0.2, hd.R * 0.3, hd.R * 0.22, 14, r, { rot: a }), r, {
                s: hd.s + 0.14, layers: 7, alpha: 0.08, baseVar: 0.4, spread: 0.4, rim: 1.8, u: u
              });
            }
          });
        }
      },
      {
        name: "centres",
        paint: function (c, r) {
          heads.forEach(function (hd) {
            wash(c, ellipse(hd.x, hd.y, hd.R * 0.12, hd.R * 0.1, 12, r), r, { s: 0.85, layers: 5, alpha: 0.25, baseVar: 0.4, depth: 1, spread: 0.3, rim: 1.6, u: u });
            drops(c, r, hd.x, hd.y, hd.R * 0.12, 7, { u: u * 0.7, s: 0.9 });
          });
          drops(c, r, 0.8 * w, 0.18 * h, 0.06 * S, 8, { u: u, s: 0.45 });
          drops(c, r, 0.14 * w, 0.84 * h, 0.04 * S, 5, { u: u, s: 0.6 });
        }
      }
    ];
  };

  SUBJECTS.rings = function (w, h, seed) {
    var S = Math.min(w, h), u = S / 800;
    return [
      {
        name: "bloom",
        paint: function (c, r) {
          wash(c, ellipse(0.58 * w, 0.46 * h, 0.3 * S, 0.26 * S, 18, r), r, { s: 0.26, layers: 22, alpha: 0.045, baseVar: 0.5, spread: 0.9, rim: 1.4, u: u });
          wash(c, ellipse(0.62 * w, 0.5 * h, 0.12 * S, 0.1 * S, 14, r), r, { s: 0.45, layers: 12, alpha: 0.04, baseVar: 0.5, spread: 0.9, rim: 1.8, u: u });
        }
      },
      {
        name: "rings",
        paint: function (c, r) {
          ring(c, 0.36 * w, 0.4 * h, 0.2 * S, r, { u: u, s: 0.62, width: 0.028 });
          ring(c, 0.63 * w, 0.62 * h, 0.17 * S, r, { u: u, s: 0.78, width: 0.034 });
          ring(c, 0.645 * w, 0.605 * h, 0.168 * S, r, { u: u, s: 0.6, width: 0.02, gaps: 0.5, fill: 0 });
          ring(c, 0.52 * w, 0.24 * h, 0.1 * S, r, { u: u, s: 0.45, gaps: 0.45 });
        }
      },
      {
        name: "drops",
        paint: function (c, r) {
          drops(c, r, 0.2 * w, 0.78 * h, 0.06 * S, 9, { u: u, s: 0.7 });
          drops(c, r, 0.86 * w, 0.2 * h, 0.03 * S, 5, { u: u, s: 0.55 });
        }
      }
    ];
  };

  // A study of coffee beans, built up the way a coffee painting is: pale
  // bodies first, then the shadows, then the form, then the crease and the
  // lifted highlights.
  SUBJECTS.beans = function (w, h, seed) {
    var S = Math.min(w, h), u = S / 800, r0 = rng(seed * 5 + 3);
    var L = S * (w > h * 1.2 ? 0.105 : 0.125);
    var want = Math.round((w * h) / (L * L) * 0.24), beans = [], tries = 0;
    // a spill: dense along a curve from the upper left, thinning toward the edges
    while (beans.length < want && tries < want * 80) {
      tries++;
      var t = r0();
      var cx = lerp(-0.02, 1.02, t) * w, cy = (0.14 + 0.62 * t + 0.14 * Math.sin(t * 3.3)) * h;
      var spread = S * (0.08 + 0.2 * Math.pow(1 - t, 1.3));
      var x = cx + r0.gauss() * spread, y = cy + r0.gauss() * spread * 0.85;
      var l = L * (0.82 + r0() * 0.34), ok = x > -l && x < w + l && y > -l && y < h + l;
      for (var i = 0; ok && i < beans.length; i++) {
        if (Math.hypot(beans[i].x - x, beans[i].y - y) < (beans[i].l + l) * 0.4) ok = false;
      }
      if (ok) beans.push({ x: x, y: y, l: l, a: r0() * Math.PI, flip: r0() < 0.5 ? 1 : -1 });
    }
    beans.sort(function (a, b) { return a.y - b.y; });
    var LX = -0.6, LY = -0.8;
    function outline(b, k, dx, dy) {
      return ellipse(b.x + (dx || 0), b.y + (dy || 0), b.l * 0.5 * (k || 1), b.l * 0.34 * (k || 1), 28, null, { rot: b.a });
    }
    function clipTo(c, b) {
      var p = outline(b);
      c.beginPath();
      c.moveTo(p[0].x, p[0].y);
      for (var i = 1; i < p.length; i++) c.lineTo(p[i].x, p[i].y);
      c.closePath();
      c.clip();
    }
    function along(b, t, off) {
      var ca = Math.cos(b.a), sa = Math.sin(b.a);
      return [b.x + ca * t * b.l - sa * off * b.l, b.y + sa * t * b.l + ca * off * b.l];
    }
    return [
      {
        name: "wash",
        paint: function (c, r) {
          beans.forEach(function (b) {
            wash(c, outline(b), r, { s: 0.12 + r() * 0.08, layers: 5, alpha: 0.15, baseDepth: 1, baseVar: 0.05, depth: 1, spread: 0.08, rim: 2, u: u });
          });
        }
      },
      {
        name: "shadow",
        paint: function (c, r) {
          beans.forEach(function (b) {
            wash(c, outline(b, 1.02, -LX * b.l * 0.16, -LY * b.l * 0.16), r, { s: 0.42, layers: 6, alpha: 0.08, baseDepth: 1, baseVar: 0.1, depth: 1, spread: 0.35, rim: 0.4, u: u });
          });
          // the shadow sits on the paper, not on the bean that casts it
          beans.forEach(function (b) { lift(c, outline(b, 0.97), r, { alpha: 0.9, layers: 2, baseDepth: 0, depth: 1, spread: 0.04 }); });
        }
      },
      {
        name: "form",
        paint: function (c, r) {
          beans.forEach(function (b) {
            c.save();
            clipTo(c, b);
            wash(c, outline(b, 1.05), r, { s: 0.55, layers: 4, alpha: 0.2, baseDepth: 0, depth: 1, spread: 0.1, rim: 0, u: u });
            lift(c, outline(b, 0.88, LX * b.l * 0.14, LY * b.l * 0.14), r, { alpha: 0.34, layers: 4, baseDepth: 0, depth: 1, spread: 0.18 });
            wash(c, outline(b, 1.04, -LX * b.l * 0.22, -LY * b.l * 0.22), r, { s: 0.85, layers: 3, alpha: 0.18, baseDepth: 0, depth: 1, spread: 0.2, rim: 0, u: u });
            c.restore();
          });
        }
      },
      {
        name: "crease",
        paint: function (c, r) {
          beans.forEach(function (b) {
            var line = [];
            for (var i = 0; i <= 16; i++) {
              var q = i / 16;
              line.push(along(b, lerp(-0.38, 0.38, q), b.flip * 0.05 * Math.sin(q * Math.PI * 2) + b.flip * 0.015));
            }
            brush(c, line, b.l * 0.075, b.l * 0.05, r, { s: 0.95, alpha: 0.55, layers: 3, u: u, taper: 0.3, jitter: 0.15 });
          });
        }
      },
      {
        name: "light",
        paint: function (c, r) {
          beans.forEach(function (b) {
            var arc = [];
            for (var i = 0; i <= 10; i++) {
              var q = i / 10;
              arc.push(along(b, lerp(-0.26, 0.2, q), -b.flip * (0.16 - 0.05 * Math.pow(q - 0.5, 2) * 4)));
            }
            brush(c, arc, b.l * 0.07, b.l * 0.035, r, { lift: true, alpha: 0.6, u: u, taper: 0.35 });
          });
        }
      },
      {
        name: "details",
        paint: function (c, r) {
          drops(c, r, w * 0.84, h * 0.86, S * 0.05, 7, { u: u, s: 0.8 });
          drops(c, r, w * 0.12, h * 0.1, S * 0.03, 4, { u: u, s: 0.5 });
        }
      }
    ];
  };

  /* ---------- painting ---------- */

  // The layers of a subject at a size, each on its own transparent sheet
  // so it can be revealed or moved on its own.
  function plan(subject, w, h, seed) {
    return (SUBJECTS[subject] || SUBJECTS.rings)(w, h, seed);
  }

  function paintLayer(L, i, w, h, seed, target) {
    var c = target || sheet(w, h), x = c.getContext("2d");
    if (target) x.clearRect(0, 0, w, h);
    L.paint(x, rng(seed * 131 + i * 977 + 1));
    return c;
  }

  function layers(subject, w, h, seed) {
    return plan(subject, w, h, seed).map(function (L, i) {
      return { name: L.name, canvas: paintLayer(L, i, w, h, seed) };
    });
  }

  // Paint a finished piece: paper, then each layer laid on with multiply,
  // the way washes stack on a real sheet.
  function paint(canvas, subject, seed, o) {
    o = o || {};
    var w = canvas.width, h = canvas.height, ctx = canvas.getContext("2d");
    paper(ctx, w, h, { grainScale: o.grainScale });
    var scratch = sheet(w, h);
    plan(subject, w, h, seed).forEach(function (L, i) {
      paintLayer(L, i, w, h, seed, scratch);
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      ctx.drawImage(scratch, 0, 0);
      ctx.restore();
    });
    return canvas;
  }

  // One bloom of coffee at a strength, on a transparent sheet.
  function swatch(canvas, s, seed) {
    var w = canvas.width, h = canvas.height, r = rng(seed), u = Math.min(w, h) / 400, c = canvas.getContext("2d");
    c.clearRect(0, 0, w, h);
    var R = Math.min(w, h) * 0.34;
    wash(c, ellipse(w / 2, h / 2, R, R * 0.94, 14, r), r, {
      s: s, layers: 26, alpha: 0.03 + s * 0.05, baseVar: 0.42, spread: 0.36, rim: 1.5, rimWidth: 1.2, u: u, grain: s > 0.4 ? 0.5 : 0.2
    });
    drops(c, r, w / 2 + R * 0.9, h / 2 + R * 0.7, R * 0.2, 3, { u: u, s: s });
    return canvas;
  }

  /* ---------- a gentle work queue ---------- */

  var queue = [], busy = false;
  function later(fn) {
    queue.push(fn);
    if (!busy) pump();
  }
  function pump() {
    busy = true;
    var run = function () {
      var fn = queue.shift();
      if (!fn) { busy = false; return; }
      try { fn(); } catch (e) { if (global.console) console.error(e); }
      setTimeout(run, 16);
    };
    setTimeout(run, 0);
  }

  global.Brew = {
    rng: rng, noise: noise, fbm: fbm, tone: tone, rgba: rgba, sheet: sheet,
    paper: paper, grainTile: grainTile,
    ellipse: ellipse, box: box, shape: shape, quad: quad, cubic: cubic,
    wash: wash, lift: lift, brush: brush, drops: drops, ring: ring, mist: mist, fir: fir, washText: washText,
    spread: spread, sweep: sweep,
    subjects: SUBJECTS, plan: plan, paintLayer: paintLayer, layers: layers, paint: paint, swatch: swatch, later: later
  };
})(window);
