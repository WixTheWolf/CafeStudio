/* Crema: a cup of coffee seen from above, drawn live in WebGL.

   The crema slowly turns and folds. Outside the cup the canvas is clear, so
   the cup and its soft shadow sit on whatever paper is painted underneath.

   Controls, all in "short side" units where the shorter edge of the canvas
   is 1:
     R      radius of the cup's lip
     cx,cy  centre of the cup, measured from the middle of the canvas
     lift   0 resting on the table, 1 lifted toward the viewer
     alpha  overall opacity */
(function (global) {
  "use strict";

  var VERT = "attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}";

  var FRAG = [
    "precision highp float;",
    "uniform vec2 uRes;",
    "uniform float uTime, uR, uLift, uAlpha;",
    "uniform vec2 uC, uMouse;",
    "float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }",
    "float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);",
    "  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y); }",
    "float fbm(vec2 p){ float v = 0.0, a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);",
    "  for (int i = 0; i < 5; i++){ v += a * noise(p); p = m * p + vec2(1.7, 9.2); a *= 0.5; } return v; }",
    "float seg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }",
    "const float LIQ = 0.84;",
    "const vec2 HD = vec2(0.9292, -0.3697);",
    "float cupSDF(vec2 q){ return min(length(q) - 1.0, seg(q, HD * 0.95, HD * 1.4) - 0.12); }",
    "void over(inout vec3 pc, inout float pa, vec3 c, float a){ pc = c * a + pc * (1.0 - a); pa = a + pa * (1.0 - a); }",
    "void main(){",
    "  float S = min(uRes.x, uRes.y);",
    "  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / S;",
    "  float sc = uR * (1.0 + 0.22 * uLift);",
    "  vec2 q = (uv - vec2(uC.x, -uC.y)) / sc;",
    "  float px = 1.5 / (S * sc);",
    "  vec2 L = normalize(vec2(-0.55, 0.62));",
    "  vec3 pc = vec3(0.0); float pa = 0.0;",
    // shadow on the paper, drifting and softening as the cup lifts
    "  vec2 so = -L * (0.05 + 0.55 * uLift);",
    "  float blur = 0.05 + 0.6 * uLift;",
    "  float sd = cupSDF(q - so);",
    "  float sh = (1.0 - smoothstep(-blur * 0.6, blur, sd)) * (0.34 - 0.24 * uLift);",
    "  over(pc, pa, vec3(0.16, 0.1, 0.06), sh);",
    // handle, a flattened porcelain loop
    "  float hOut = seg(q, HD * 0.95, HD * 1.4) - 0.12;",
    "  float hIn = seg(q, HD * 1.1, HD * 1.26) - 0.045;",
    "  float hm = (1.0 - smoothstep(-px, px, hOut)) * smoothstep(-px, px, hIn);",
    "  vec3 ceramic = vec3(0.955, 0.94, 0.915);",
    "  float hside = dot(normalize(vec2(-HD.y, HD.x)), L);",
    "  vec3 hc = ceramic * (0.8 + 0.2 * smoothstep(0.0, 0.06, -hOut) + 0.06 * sign(dot(q - HD * 1.15, vec2(-HD.y, HD.x))) * hside);",
    "  over(pc, pa, hc, hm);",
    // the cup: lip, inner wall, coffee
    "  float r = length(q);",
    "  vec2 nq = q / max(r, 1e-4);",
    "  float facing = dot(nq, L);",
    "  float bm = 1.0 - smoothstep(1.0 - px, 1.0 + px, r);",
    "  vec3 lip = ceramic * (0.84 + 0.16 * sin(clamp((r - 0.9) / 0.1, 0.0, 1.0) * 3.14159)) + vec3(0.05) * max(facing, 0.0);",
    "  float wt = smoothstep(LIQ, 0.92, r);",
    "  vec3 wall = ceramic * (0.5 + 0.38 * wt + 0.16 * (-facing));",
    "  vec3 cup = mix(wall, lip, smoothstep(0.91, 0.935, r));",
    "  float lm = 1.0 - smoothstep(LIQ - px, LIQ + px, r);",
    "  vec2 lq = q / LIQ;",
    "  float lr = length(lq);",
    "  float t = uTime;",
    "  float ang = t * 0.03 + (1.0 - lr) * (1.3 + 0.3 * sin(t * 0.05));",
    "  float cs = cos(ang), sn = sin(ang);",
    "  vec2 sp = mat2(cs, -sn, sn, cs) * lq * 1.7;",
    "  vec2 w1 = vec2(fbm(sp * 1.2 + vec2(t * 0.015, 0.0)), fbm(sp * 1.2 + vec2(5.2, 1.3) - t * 0.012));",
    "  float f = fbm(sp * 1.5 + w1 * 2.4);",
    "  float edge = smoothstep(0.45, 1.0, lr);",
    "  float crema = smoothstep(0.36, 0.7, f + edge * 0.28);",
    "  float fine = fbm(sp * 8.0 + w1 * 4.0);",
    "  vec3 espresso = vec3(0.07, 0.04, 0.022);",
    "  vec3 deep = vec3(0.4, 0.22, 0.11);",
    "  vec3 gold = vec3(0.8, 0.56, 0.32);",
    "  vec3 liq = mix(espresso, deep, crema);",
    "  liq = mix(liq, gold, smoothstep(0.55, 0.86, f + fine * 0.3 - 0.08) * crema);",
    "  liq *= 0.88 + 0.24 * fine;",
    "  vec2 bp = sp * 34.0; vec2 bi = floor(bp); vec2 bf = fract(bp) - 0.5;",
    "  float bub = step(0.9, hash(bi)) * (1.0 - smoothstep(0.1, 0.22, length(bf + (vec2(hash(bi + 3.1), hash(bi + 7.7)) - 0.5) * 0.3))) * edge;",
    "  liq = mix(liq, gold, bub * 0.28);",
    "  liq += vec3(0.2, 0.13, 0.07) * smoothstep(0.9, 1.0, lr);",
    "  liq *= 1.0 - 0.35 * smoothstep(0.55, 1.0, lr) * smoothstep(-0.2, 0.8, dot(normalize(lq + 1e-4), L));",
    "  vec2 wq = (lq - vec2(-0.32, 0.36) - uMouse * 0.06) * vec2(1.0, 1.5);",
    "  float win = 1.0 - smoothstep(0.02, 0.26, length(wq));",
    "  liq += vec3(0.95, 0.88, 0.8) * win * win * 0.09;",
    "  cup = mix(cup, liq, lm);",
    "  over(pc, pa, cup, bm);",
    "  pc += (hash(gl_FragCoord.xy + fract(t)) - 0.5) / 128.0 * pa;",
    "  gl_FragColor = vec4(pc, pa) * uAlpha;",
    "}"
  ].join("\n");

  function Crema(canvas, o) {
    o = o || {};
    this.canvas = canvas;
    this.maxDpr = o.maxDpr || 1.5;
    this.state = { R: o.R || 0.3, cx: o.cx || 0, cy: o.cy || 0, lift: 0, alpha: 1, mx: 0, my: 0 };
    this.t0 = performance.now();
    this.frozen = !!o.frozen;
    var gl = null;
    try {
      gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false }) ||
           canvas.getContext("experimental-webgl", { alpha: true, premultipliedAlpha: true });
    } catch (e) { gl = null; }
    this.ok = false;
    if (!gl) return;
    function compile(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        if (global.console) console.warn(gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    }
    var vs = compile(gl.VERTEX_SHADER, VERT), fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.gl = gl;
    this.u = {};
    ["uRes", "uTime", "uR", "uLift", "uAlpha", "uC", "uMouse"].forEach(function (n) { this.u[n] = gl.getUniformLocation(prog, n); }, this);
    this.ok = true;
    this.resize();
  }

  // `mult` sizes the drawing buffer for a canvas that is shown scaled,
  // such as a slide stage.
  Crema.prototype.resize = function (mult) {
    if (!this.ok) return;
    var dpr = Math.min((global.devicePixelRatio || 1) * (mult || 1), this.maxDpr);
    var w = Math.max(1, Math.round(this.canvas.clientWidth * dpr)), h = Math.max(1, Math.round(this.canvas.clientHeight * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.gl.viewport(0, 0, w, h);
  };

  Crema.prototype.set = function (o) {
    for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) this.state[k] = o[k];
  };

  Crema.prototype.draw = function (now) {
    if (!this.ok) return;
    var gl = this.gl, s = this.state, u = this.u;
    var t = this.frozen ? 40 : ((now || performance.now()) - this.t0) / 1000 + 40;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(u.uTime, t);
    gl.uniform1f(u.uR, s.R);
    gl.uniform1f(u.uLift, s.lift);
    gl.uniform1f(u.uAlpha, s.alpha);
    gl.uniform2f(u.uC, s.cx, s.cy);
    gl.uniform2f(u.uMouse, s.mx, s.my);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  // The lip radius at which the coffee alone covers the whole canvas.
  Crema.coverRadius = function (w, h) {
    return 0.5 * Math.hypot(w, h) / Math.min(w, h) / 0.84;
  };

  global.Crema = Crema;
})(window);
