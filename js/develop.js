/* Cafe Studio: Hannah's paintings, developed on screen.

   One small WebGL renderer, used two ways:

   - build: a finished painting is put back on the paper one wash at a time.
     Every pixel is given coffee in stages, lightest first, until it reaches
     the darkness it has in the photograph. Each new wash sweeps across the
     sheet with a ragged wet edge, sits a little darker while it is wet, and
     leaves a faint rim where it dries. Early washes are soft; the detail
     only sharpens in the last stage, as it does on paper.
   - bleed: one photograph spreads over another like spilled coffee, with a
     dark wet rim at the edge.

   The image is drawn inside a rectangle given in CSS pixels, so the same
   canvas can hold it large on the page and then shrink it into a frame. */
(function () {
  "use strict";

  var VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";

  var FS = [
    "precision highp float;",
    "uniform sampler2D uA,uB;",
    "uniform vec2 uRes;",
    "uniform vec4 uRect;",
    "uniform float uBuild,uMix,uShadow,uAlpha,uZoom,uSeed,uAspA,uAspB,uHasB,uScale;",
    "uniform vec2 uPan,uFrom;",
    "uniform vec3 uPaper;",
    "float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}",
    "float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);",
    "  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}",
    "float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n(p);p=p*2.03+17.1;a*=.5;}return s;}",
    "vec2 cover(vec2 uv,float ra,float ia){",
    "  if(ia>ra)uv.x=(uv.x-.5)*ra/ia+.5;else uv.y=(uv.y-.5)*ia/ra+.5;return uv;}",
    // stage densities: how dark a pixel may get by the end of each stage
    "float sd(float i){return i<.5?0.:i<1.5?.2:i<2.5?.5:i<3.5?1.:40.;}",
    "void main(){",
    "  vec2 px=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)/uScale;",
    "  vec2 uv=(px-uRect.xy)/uRect.zw;",
    "  vec2 c=uRect.xy+uRect.zw*.5;",
    "  vec2 q=abs(px-c-vec2(0.,uRect.w*.035))-uRect.zw*.5;",
    "  float d=length(max(q,0.));",
    "  bool inside=uv.x>=0.&&uv.x<=1.&&uv.y>=0.&&uv.y<=1.;",
    "  if(!inside){",
    "    float sh=uShadow*.42*exp(-d/(uRect.w*.045+6.));",
    "    gl_FragColor=vec4(vec3(.08,.04,.02)*sh,sh)*uAlpha;return;}",
    "  float ra=uRect.z/uRect.w;",
    "  vec2 tv=(uv-.5)/uZoom+.5+uPan;",
    "  float s=clamp(uBuild,0.,4.);",
    "  float bias=mix(2.7,0.,smoothstep(2.55,3.7,s));",
    "  vec3 col=texture2D(uA,cover(tv,ra,uAspA),bias).rgb;",
    "  vec3 T=clamp(col/uPaper,.002,1.);",
    "  float D=max(0.,-log(dot(T,vec3(.3,.5,.2))));",
    "  float g1=fbm(uv*vec2(ra,1.)*3.1+uSeed),g2=fbm(uv*vec2(ra,1.)*11.+uSeed*1.7);",
    "  float idx=min(floor(s),3.),f=s-idx;",
    "  float D0=sd(idx),D1=sd(idx+1.);",
    "  vec2 dir=mod(idx,2.)<.5?normalize(vec2(1.,.42)):normalize(vec2(-1.,.55));",
    "  float pos=dot(uv-.5,dir)+.5+(g1-.5)*.42+(g2-.5)*.07;",
    "  float front=f*1.75-.36;",
    "  float k=1.-smoothstep(front-.09,front,pos);",
    "  float Dth=mix(D0,D1,k);",
    "  float Ds=min(D,Dth),frac=D>.001?Ds/D:1.;",
    // part-built pixels take the colour of a coffee wash of that strength;
    // finished ones are exactly the photograph
    "  vec3 tint=uPaper*exp(-Ds*vec3(.47,.9,1.75));",
    "  vec3 shown=mix(tint,uPaper*pow(T,vec3(frac)),smoothstep(.4,1.,frac));",
    // the wash that is still wet: darker, grainier, with a rim at its edge
    "  float recv=smoothstep(D0,D0+.06,D)*step(s,3.999);",
    "  float wet=recv*k*(1.-smoothstep(front-.46,front-.04,pos));",
    "  float rim=recv*k*(1.-k)*4.;",
    "  shown*=1.-wet*(.09+.07*g2)-rim*.09;",
    "  shown*=.985+.015*h(gl_FragCoord.xy+uSeed);",
    "  if(uHasB>.5){",
    "    vec3 b=texture2D(uB,cover(tv,ra,uAspB)).rgb;",
    "    float fl=length((uv-uFrom)*vec2(ra,1.))*.7+(g1-.5)*.55+(g2-.5)*.08;",
    "    float m=uMix*1.9-.35;",
    "    float t=1.-smoothstep(m-.05,m,fl);",
    "    float band=t*(1.-t)*4.;",
    "    shown=mix(shown,b,t)*(1.-band*.35);",
    "  }",
    "  gl_FragColor=vec4(shown*uAlpha,uAlpha);",
    "}"
  ].join("\n");

  function Develop(canvas, opts) {
    opts = opts || {};
    this.canvas = canvas;
    this.maxScale = opts.maxScale || 1.5;
    this.scale = 1;
    this.tex = {};
    this.state = null;
    var gl = null;
    try {
      gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false, preserveDrawingBuffer: !!opts.keep }) ||
           canvas.getContext("experimental-webgl", { premultipliedAlpha: true, alpha: true });
    } catch (e) { gl = null; }
    this.gl = gl;
    this.ok = false;
    if (!gl) return;
    var vs = compile(gl, gl.VERTEX_SHADER, VS), fs = compile(gl, gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return;
    var pr = gl.createProgram();
    gl.attachShader(pr, vs);
    gl.attachShader(pr, fs);
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    this.pr = pr;
    gl.useProgram(pr);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.u = {};
    var names = ["uA", "uB", "uRes", "uRect", "uBuild", "uMix", "uShadow", "uAlpha", "uZoom", "uSeed", "uAspA", "uAspB", "uHasB", "uScale", "uPan", "uFrom", "uPaper"];
    for (var i = 0; i < names.length; i++) this.u[names[i]] = gl.getUniformLocation(pr, names[i]);
    gl.uniform1i(this.u.uA, 0);
    gl.uniform1i(this.u.uB, 1);
    this.maxTex = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048, 2048);
    this.ok = true;
  }

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      if (window.console) console.warn(gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  // The brightest few percent of the photo is taken as the bare paper.
  function paperOf(img) {
    var c = document.createElement("canvas"), n = 48;
    c.width = c.height = n;
    var x = c.getContext("2d");
    x.drawImage(img, 0, 0, n, n);
    var d = x.getImageData(0, 0, n, n).data, px = [];
    for (var i = 0; i < d.length; i += 4) px.push([d[i], d[i + 1], d[i + 2], d[i] * 0.3 + d[i + 1] * 0.5 + d[i + 2] * 0.2]);
    px.sort(function (a, b) { return b[3] - a[3]; });
    var top = px.slice(0, Math.max(4, Math.round(px.length * 0.03))), r = 0, g = 0, b = 0;
    top.forEach(function (p) { r += p[0]; g += p[1]; b += p[2]; });
    return [r / top.length / 255, g / top.length / 255, b / top.length / 255];
  }

  // Load an image into a power-of-two texture so it can be mipmapped
  // (the soft early washes read from the blurrier levels).
  Develop.prototype.load = function (url, cb) {
    var self = this;
    if (this.tex[url]) {
      if (this.tex[url].ready) { if (cb) cb(this.tex[url]); } else if (cb) this.tex[url].wait.push(cb);
      return this.tex[url];
    }
    var t = { ready: false, wait: cb ? [cb] : [], asp: 1, paper: [0.94, 0.92, 0.88] };
    this.tex[url] = t;
    if (!this.ok) return t;
    var img = new Image();
    img.decoding = "async";
    img.onload = function () {
      var gl = self.gl, size = self.maxTex, c = document.createElement("canvas");
      c.width = c.height = size;
      c.getContext("2d").drawImage(img, 0, 0, size, size);
      t.asp = img.naturalWidth / img.naturalHeight;
      try { t.paper = paperOf(img); } catch (e) { /* keep the default */ }
      t.t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t.t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, c);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      t.ready = true;
      self.state = null;
      var w = t.wait;
      t.wait = [];
      w.forEach(function (f) { f(t); });
    };
    img.src = url;
    return t;
  };

  Develop.prototype.resize = function (w, h) {
    var k = Math.min(window.devicePixelRatio || 1, this.maxScale);
    var cw = Math.max(1, Math.round(w * k)), ch = Math.max(1, Math.round(h * k));
    if (this.canvas.width !== cw || this.canvas.height !== ch) {
      this.canvas.width = cw;
      this.canvas.height = ch;
      this.state = null;
    }
    this.scale = k;
    this.cssW = w;
    this.cssH = h;
  };

  // p: { a: url, b: url (optional), rect: [x, y, w, h] in CSS px, build, mix,
  //      from: [u, v] where the bleed starts, zoom, pan: [x, y], shadow, alpha, seed }
  Develop.prototype.draw = function (p) {
    if (!this.ok) return false;
    var A = this.tex[p.a], B = p.b ? this.tex[p.b] : null;
    if (!A || !A.ready) return false;
    var hasB = !!(B && B.ready && p.mix > 0);
    var key = [p.a, hasB ? p.b : "", p.rect.map(function (v) { return v.toFixed(1); }).join(","), (p.build == null ? 4 : p.build).toFixed(4),
      hasB ? p.mix.toFixed(4) : 0, (p.zoom || 1).toFixed(4), p.pan ? p.pan[0].toFixed(4) + p.pan[1].toFixed(4) : "",
      (p.shadow || 0).toFixed(3), (p.alpha == null ? 1 : p.alpha).toFixed(3), this.canvas.width, this.canvas.height].join("|");
    if (key === this.state) return false;
    this.state = key;
    var gl = this.gl, u = this.u;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, A.t);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, hasB ? B.t : A.t);
    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(u.uScale, this.scale);
    gl.uniform4f(u.uRect, p.rect[0], p.rect[1], p.rect[2], p.rect[3]);
    gl.uniform1f(u.uBuild, p.build == null ? 4 : p.build);
    gl.uniform1f(u.uMix, hasB ? p.mix : 0);
    gl.uniform1f(u.uHasB, hasB ? 1 : 0);
    gl.uniform1f(u.uShadow, p.shadow || 0);
    gl.uniform1f(u.uAlpha, p.alpha == null ? 1 : p.alpha);
    gl.uniform1f(u.uZoom, p.zoom || 1);
    gl.uniform1f(u.uSeed, p.seed || 3.7);
    gl.uniform1f(u.uAspA, A.asp);
    gl.uniform1f(u.uAspB, hasB ? B.asp : 1);
    gl.uniform2f(u.uPan, p.pan ? p.pan[0] : 0, p.pan ? p.pan[1] : 0);
    gl.uniform2f(u.uFrom, p.from ? p.from[0] : 0.5, p.from ? p.from[1] : 0.5);
    gl.uniform3f(u.uPaper, A.paper[0], A.paper[1], A.paper[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return true;
  };

  window.Develop = Develop;
})();
