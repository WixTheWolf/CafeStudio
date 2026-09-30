/* Cafe Studio: the café, through Hannah's eyes.

   A small WebGL renderer for the opening of the site. It plays short macro
   loops of coffee (crema, steam, light, a drop on paper), all in Hannah's
   one colour, and moves between them the way coffee moves on paper: the
   next loop spreads over the last as a stain with a dark wet rim. The
   pointer stirs whatever is on screen, and at the very end the stain
   clears to the paper underneath. It can also arrive the same way: with
   `reveal` below 1 the footage only shows inside a stain spreading from
   `from`.

   draw({ a: video, b: video or null, mix: 0..1, clear: 0..1, reveal: 0..1,
          from: [u, v], stir: [x, y] in 0..1, swirl, time, zoom }) */
(function () {
  "use strict";

  var VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";

  var FS = [
    "precision highp float;",
    "uniform sampler2D uA,uB;",
    "uniform vec2 uRes,uFrom,uStir;",
    "uniform float uAspA,uAspB,uMix,uClear,uReveal,uHasB,uSwirl,uTime,uZoom,uSeed;",
    "float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}",
    "float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);",
    "  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}",
    "float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n(p);p=p*2.03+17.1;a*=.5;}return s;}",
    "vec2 cover(vec2 uv,float ra,float ia){",
    "  if(ia>ra)uv.x=(uv.x-.5)*ra/ia+.5;else uv.y=(uv.y-.5)*ia/ra+.5;return uv;}",
    // the spreading stain: 0 outside, 1 inside, with the front at t
    "float stain(vec2 uv,float ra,float t,float seed,out float rim){",
    "  vec2 d=(uv-uFrom)*vec2(ra,1.);",
    "  float g=fbm(uv*vec2(ra,1.)*2.3+seed)-.5,g2=fbm(uv*vec2(ra,1.)*9.+seed*1.9)-.5;",
    "  float v=length(d)/(length(vec2(ra,1.))*.62)+g*.46+g2*.06;",
    "  float front=t*1.5-.12;",
    "  float k=1.-smoothstep(front-.035,front,v);",
    "  rim=exp(-pow((front-v)/.028,2.))*step(.001,t)*step(t,.999);",
    "  return k;}",
    "void main(){",
    "  vec2 uv=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)/uRes;",
    "  float ra=uRes.x/uRes.y;",
    // stirring: the picture turns around the pointer, most near it
    "  vec2 d=(uv-uStir)*vec2(ra,1.);",
    "  float r2=dot(d,d),a=uSwirl*exp(-r2/.05);",
    "  float cs=cos(a),sn=sin(a);",
    "  d=mat2(cs,-sn,sn,cs)*d;",
    "  vec2 w=uStir+d/vec2(ra,1.);",
    // and it is always a little wet
    "  w+=(vec2(fbm(uv*3.+uTime*.05),fbm(uv*3.+7.3-uTime*.04))-.5)*.012;",
    "  vec2 z=(w-.5)/uZoom+.5;",
    "  vec3 A=texture2D(uA,cover(z,ra,uAspA)).rgb;",
    "  vec3 col=A;float alpha=1.,rim=0.,r2b=0.;",
    "  if(uHasB>.5){",
    "    float k=stain(uv,ra,uMix,uSeed,rim);",
    "    vec3 B=texture2D(uB,cover(z,ra,uAspB)).rgb;",
    "    col=mix(A,B,k);",
    "    col*=1.-rim*.42;}",
    "  if(uClear>0.){",
    "    float k=stain(uv,ra,uClear,uSeed+3.1,r2b);",
    "    alpha=1.-k;",
    // the dried edge stays on the paper as it clears
    "    float edge=r2b*.8;",
    "    col=mix(col,vec3(.36,.21,.11),edge*k);",
    "    alpha=max(alpha,edge*.55);}",
    // arriving: only inside a spreading stain, with its wet rim
    "  if(uReveal<1.){",
    "    float rr;float k=stain(uv,ra,uReveal,uSeed+5.3,rr);",
    "    col*=1.-rr*.45;alpha*=max(k,rr*.7);}",
    // vignette and grain
    "  vec2 c=uv-.5;col*=1.-dot(c,c)*.55;",
    "  col+=(h(gl_FragCoord.xy+fract(uTime*7.1)*97.)-.5)*.035;",
    "  gl_FragColor=vec4(col*alpha,alpha);",
    "}"
  ].join("\n");

  function Reel(canvas, opts) {
    opts = opts || {};
    this.canvas = canvas;
    this.maxScale = opts.maxScale || 1.25;
    this.ok = false;
    var gl = null;
    try {
      gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false }) ||
           canvas.getContext("experimental-webgl", { premultipliedAlpha: true, alpha: true });
    } catch (e) { gl = null; }
    this.gl = gl;
    if (!gl) return;
    var vs = compile(gl, gl.VERTEX_SHADER, VS), fs = compile(gl, gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return;
    var pr = gl.createProgram();
    gl.attachShader(pr, vs);
    gl.attachShader(pr, fs);
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    gl.useProgram(pr);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.u = {};
    var names = ["uA", "uB", "uRes", "uFrom", "uStir", "uAspA", "uAspB", "uMix", "uClear", "uReveal", "uHasB", "uSwirl", "uTime", "uZoom", "uSeed"];
    for (var i = 0; i < names.length; i++) this.u[names[i]] = gl.getUniformLocation(pr, names[i]);
    gl.uniform1i(this.u.uA, 0);
    gl.uniform1i(this.u.uB, 1);
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

  Reel.prototype.resize = function (w, h) {
    var k = Math.min(window.devicePixelRatio || 1, this.maxScale);
    // a full-screen video texture does not need more than about 2 million pixels
    k = Math.min(k, Math.sqrt(2.2e6 / Math.max(1, w * h)));
    var cw = Math.max(1, Math.round(w * k)), ch = Math.max(1, Math.round(h * k));
    if (this.canvas.width !== cw || this.canvas.height !== ch) {
      this.canvas.width = cw;
      this.canvas.height = ch;
    }
  };

  // Upload a video's current frame, once per new frame.
  Reel.prototype.frame = function (v, unit) {
    var gl = this.gl;
    if (!v._reel) {
      var t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      v._reel = { t: t, at: -1, has: false };
    }
    var r = v._reel;
    gl.activeTexture(unit === 1 ? gl.TEXTURE1 : gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, r.t);
    if (v.readyState >= 2 && v.videoWidth && (v.currentTime !== r.at || !r.has)) {
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, v);
        r.at = v.currentTime;
        r.has = true;
      } catch (e) { /* not decodable yet */ }
    }
    return r.has;
  };

  Reel.prototype.draw = function (p) {
    if (!this.ok || !p.a) return false;
    var gl = this.gl, u = this.u;
    if (!this.frame(p.a, 0)) return false;
    var hasB = !!(p.b && p.mix > 0 && this.frame(p.b, 1));
    if (!hasB) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, p.a._reel.t);
    }
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform2f(u.uFrom, p.from ? p.from[0] : 0.5, p.from ? p.from[1] : 0.5);
    gl.uniform2f(u.uStir, p.stir ? p.stir[0] : 0.5, p.stir ? p.stir[1] : 0.5);
    gl.uniform1f(u.uAspA, p.a.videoWidth / p.a.videoHeight);
    gl.uniform1f(u.uAspB, hasB ? p.b.videoWidth / p.b.videoHeight : 1);
    gl.uniform1f(u.uMix, hasB ? p.mix : 0);
    gl.uniform1f(u.uHasB, hasB ? 1 : 0);
    gl.uniform1f(u.uClear, p.clear || 0);
    gl.uniform1f(u.uReveal, p.reveal == null ? 1 : p.reveal);
    gl.uniform1f(u.uSwirl, p.swirl || 0);
    gl.uniform1f(u.uTime, p.time || 0);
    gl.uniform1f(u.uZoom, p.zoom || 1);
    gl.uniform1f(u.uSeed, p.seed || 2.3);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return true;
  };

  window.Reel = Reel;
})();
