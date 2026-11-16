/* Live background: a quiet, optimistic future city. Glass towers, a saucer
   tower, a geodesic dome, and a monorail at dusk, under a starry sky with a coral horizon.
   Deliberately low-contrast so the type on top stays readable.
   Pure WebGL2, no libraries. */
(function () {
  const canvas = document.getElementById('sky');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });

  function fallback() {
    document.documentElement.classList.add('no-gl');
    window.Scene = { start() {} };
  }
  if (!gl) return fallback();

  const VERT = `#version 300 es
void main(){
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

  /* Kept branch-free on purpose: ternaries inside loops miscompiled on some GPUs. */
  const FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform float uTime, uScroll, uIntro, uRise;

const vec3 NIGHT = vec3(.020, .035, .085);
const vec3 ACC = vec3(1., .90, .62);
float gD, gAspect, aa;
vec2 gM;

float hash11(float p){ p = fract(p * .1031); p *= p + 33.33; p *= p + p; return fract(p); }
float hash21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash21(i), hash21(i + vec2(1, 0)), f.x),
             mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++){ s += a * noise(p); p = p * 2.03 + 17.; a *= .5; } return s; }
/* 1 inside a shape (signed distance below zero), with a soft pixel edge */
float fill(float d){ return 1. - smoothstep(-aa, aa, d); }
float sdEll(vec2 p, vec2 r){ return (length(p / r) - 1.) * min(r.x, r.y); }
vec3 glass(float shade){ return mix(vec3(.055, .075, .17), vec3(.30, .25, .43), clamp(shade, 0., 1.)); }

vec3 scene(vec2 p){
  float d = gD;
  float y0 = -.235 - d * .04;
  float t = p.y - y0;

  /* sky at dusk: deep teal-navy overhead, falling through blue and mauve to a coral horizon */
  vec3 top = mix(vec3(.025, .06, .15), vec3(.02, .045, .12), d);
  vec3 mid = mix(vec3(.07, .22, .40), vec3(.06, .17, .34), d);
  vec3 low = mix(vec3(.50, .33, .55), vec3(.46, .26, .50), d);
  vec3 hor = mix(vec3(.98, .52, .44), vec3(.95, .42, .46), d);
  vec3 c = mix(hor, low, smoothstep(0., .20, t));
  c = mix(c, mid, smoothstep(.12, .42, t));
  c = mix(c, top, smoothstep(.30, .85, t));
  c += vec3(1., .45, .38) * exp(-length((p - vec2(0., y0)) * vec2(.45, 2.2)) * 2.6) * .42;

  /* stars, a few of them tinted */
  vec2 sg = p * 70.;
  vec2 sid = floor(sg);
  float sh = hash21(sid);
  vec2 sf = fract(sg) - .5 + (vec2(hash21(sid + 7.), hash21(sid + 13.)) - .5) * .7;
  float star = step(.80, sh) * (1. - smoothstep(.02, .13 * (.4 + hash21(sid + 3.)), length(sf)));
  star *= .55 + .45 * sin(uTime * (1. + sh * 2.) + sh * 90.);
  vec3 tint = mix(vec3(1.), .6 + .4 * cos(6.283 * (sh * 7. + vec3(0., .33, .67))), step(.94, sh));
  c += tint * star * smoothstep(.10, .45, t) * .9;

  /* cloud patches: dark overhead, catching pink light near the horizon */
  float cl = fbm(vec2(p.x * 1.6 + uTime * .006, p.y * 3.2 + 2.));
  float cm = smoothstep(.48, .72, cl) * smoothstep(.02, .22, t);
  vec3 cloudCol = mix(vec3(.90, .42, .50), vec3(.03, .07, .17), smoothstep(.10, .42, t));
  c = mix(c, cloudCol, cm * .55);

  /* distant skyline, two hazy layers */
  for (int i = 0; i < 2; i++){
    float fi = float(i);
    float sc = 13. - fi * 5.;
    float x = (p.x + gM.x * .004 * (fi + 1.)) * sc + fi * 31.;
    float id = floor(x), fx = fract(x);
    float h = hash11(id + fi * 5.);
    float ht = (.04 + .20 * h * h) * (1. + fi * .25);
    float w = .35 + .5 * hash11(id + 9.);
    float m = fill((abs(fx - .5) - w * .5) / sc) * fill(t - ht);
    vec3 bc = mix(low, vec3(.10, .10, .24), .45 + .28 * fi);
    bc = mix(bc, mix(low, hor, .5), smoothstep(0., .25, ht - t) * .45);
    vec2 wg = vec2(x * 9., t * 240.);
    float wh = hash21(floor(wg) + fi * 3.);
    float lit = step(.80, wh) * step(.3, fract(wg.x)) * step(.4, fract(wg.y));
    bc += ACC * lit * .55 * (.6 + .4 * sin(uTime * .5 + wh * 20.));
    c = mix(c, bc, m);
  }

  c = mix(c, hor, exp(-max(t, 0.) * 14.) * .25);
  float px = gM.x * .008;

  /* tall glass tower with a slanted crown, its slim twin and a chrome sphere */
  vec2 q = p - vec2(-.47 + px, y0);
  float dT = max(abs(q.x) - .045, max(-q.y, q.y - (.47 + q.x * 1.6)));
  float sT = .25 + .45 * smoothstep(-.045, .045, q.x) + .08 * step(.5, fract(q.x * 110.)) + .05 * step(.5, fract(q.y * 60.));
  c = mix(c, glass(sT), fill(dT));
  q = p - vec2(-.385 + px, y0);
  float dT2 = max(abs(q.x) - .02, max(-q.y, q.y - (.30 - q.x * 2.)));
  c = mix(c, glass(.35 + .3 * smoothstep(-.02, .02, q.x) + .06 * step(.5, fract(q.y * 70.))), fill(dT2));
  q = p - vec2(-.405 + px, y0 + .24);
  c = mix(c, glass(.35 + .7 * smoothstep(-.03, .03, dot(q, vec2(.6, .8)))), fill(length(q) - .03));

  /* geodesic dome */
  q = p - vec2(-.20 + px, y0);
  float dD = max(length(q) - .135, -q.y);
  float l3 = min(abs(fract(q.x * 30.) - .5), min(abs(fract((q.x * .5 + q.y * .866) * 30.) - .5), abs(fract((q.x * .5 - q.y * .866) * 30.) - .5)));
  float sD = .28 + .45 * smoothstep(-.135, .135, dot(q, vec2(.6, .8))) + (1. - smoothstep(.03, .08, l3)) * .14;
  c = mix(c, glass(sD), fill(dD));

  /* saucer tower */
  q = p - vec2(.08 + px, y0);
  float wS = mix(.030, .014, clamp(q.y / .36, 0., 1.));
  c = mix(c, glass(.25 + .4 * smoothstep(-wS, wS, q.x)), fill(max(abs(q.x) - wS, max(-q.y, q.y - .36))));
  for (int i = 0; i < 3; i++){
    float fi = float(i);
    float cy = .21 + .065 * fi;
    float rx = .078 + .02 * fi - .056 * max(fi - 1., 0.);
    float ry = rx * .19;
    vec2 e = q - vec2(0., cy);
    float sh = .32 + .5 * smoothstep(-ry, ry, e.y) - .16 * fill(abs(e.y) - ry * .22) * step(.3, fract(e.x * 120.));
    c = mix(c, glass(sh), fill(sdEll(e, vec2(rx, ry))));
  }
  c = mix(c, glass(.6), fill(max(sdEll(q - vec2(0., .36), vec2(.035)), .36 - q.y)));
  c = mix(c, glass(.7), fill(max(abs(q.x) - .003, max(.36 - q.y, q.y - .50))));
  c += ACC * exp(-dot(q - vec2(0., .50), q - vec2(0., .50)) * 9000.) * (.5 + .5 * sin(uTime * 2.)) * .8;

  /* big ribbed dome on the right */
  q = p - vec2(.68 + px * 1.5, y0 - .06);
  float lr = length(q);
  float ribs = (1. - smoothstep(.04, .10, abs(fract(lr * 14.) - .5))) * .10
             + (1. - smoothstep(.04, .10, abs(fract(atan(q.y, q.x) * 5.) - .5))) * .08;
  c = mix(c, glass(.15 + .35 * smoothstep(-.33, .33, dot(q, vec2(-.5, .85))) + ribs), fill(max(lr - .33, y0 - p.y)));

  /* monorail arc with a train gliding along it */
  vec2 mc = vec2(.50 + px * 1.5, y0 + .03);
  vec2 rad = vec2(.44, .17);
  vec2 mq = (p - mc) / rad;
  float e = length(mq);
  float above = step(mc.y, p.y);
  float pil = fill(abs(fract(p.x * 8.) - .5) / 8. - .004) * step(y0, p.y) * step(e, 1.);
  c = mix(c, glass(.30), pil);
  c = mix(c, glass(.48 + .3 * smoothstep(.97, 1.03, e)), fill((abs(e - 1.) - .030) * .17) * above);
  float th = atan(mq.y, mq.x);
  float tt = 3.3 - mod(uTime * .07, 3.9);
  float car = fill((abs(th - tt) - .17) * .3) * fill((abs(e - 1.075) - .040) * .17) * above;
  vec3 tc = mix(vec3(.50, .62, .72), vec3(.14, .22, .34), fill((abs(e - 1.085) - .010) * .17) * step(.25, fract(th * 18.)));
  tc = mix(tc, ACC * .85, fill((abs(e - 1.055) - .004) * .17));
  c = mix(c, tc, car);

  /* tree line and lawn */
  float yT = y0 + .010 + (fbm(vec2(p.x * 7. + 3., 1.)) - .5) * .045 + abs(noise(vec2(p.x * 38., 4.)) - .5) * .02;
  vec3 tr = mix(vec3(.025, .05, .08), vec3(.05, .09, .12), noise(p * 40.));
  tr += vec3(.95, .40, .55) * step(.965, hash21(floor(p * 170.))) * smoothstep(.07, 0., yT - p.y) * .8;
  c = mix(c, tr, fill(p.y - yT));
  float yL = y0 - .05 + .03 * sin(p.x * 2.1 + .8);
  vec3 lc = mix(vec3(.02, .045, .07), vec3(.07, .11, .15), smoothstep(-.5, yL, p.y));
  lc += vec3(.35, .14, .20) * smoothstep(.05, 0., yL - p.y) * .25;
  lc *= .94 + .12 * noise(vec2(p.x * 60., p.y * 240.));
  c = mix(c, lc, fill(p.y - yL));
  return c;
}

void main(){
  gAspect = uRes.x / uRes.y;
  gD = uScroll;
  gM = uMouse;
  /* the city is drawn small and low so the headline sits on open sky */
  const float SCALE = 1.7;
  aa = 1.5 * SCALE / uRes.y;
  vec2 uv = (gl_FragCoord.xy - .5 * uRes) / uRes.y;
  /* scrolling pushes the camera in and up */
  vec3 col = scene(uv * SCALE * (1. - .12 * gD) + vec2(0., .326 + (1. - uRise) * .05 - .05 * gD));
  col *= 1. - .22 * dot(uv, uv);
  col += (hash21(gl_FragCoord.xy + fract(uTime) * 100.) - .5) * .014;
  /* once past the first screen the city recedes so the text is easy to read; it returns at the end */
  float dim = smoothstep(.03, .22, gD) * (1. - .55 * smoothstep(.86, 1., gD));
  col = mix(col, col * .55 + NIGHT * .22, dim);
  col = mix(NIGHT, col, uIntro);
  fragColor = vec4(clamp(col, 0., 1.), 1.);
}`;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return fallback();
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(prog));
    return fallback();
  }
  gl.useProgram(prog);
  const U = {};
  ['uRes', 'uMouse', 'uTime', 'uScroll', 'uIntro', 'uRise'].forEach((n) => (U[n] = gl.getUniformLocation(prog, n)));

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.round(innerWidth * dpr), h = Math.round(innerHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }
  addEventListener('resize', resize);
  resize();

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => {
    mouse.tx = (e.clientX / innerWidth) * 2 - 1;
    mouse.ty = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });

  let scroll = 0, startedAt = null;
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const easeOut = (v) => 1 - Math.pow(1 - v, 3);

  function scrollTarget() {
    const max = document.documentElement.scrollHeight - innerHeight;
    return max > 0 ? clamp01(scrollY / max) : 0;
  }

  const t0 = performance.now();
  function frame(now) {
    const time = ((now - t0) / 1000) * (reduced ? 0.15 : 1);
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    scroll += (scrollTarget() - scroll) * 0.07;

    let intro = 0, rise = 0;
    if (startedAt !== null) {
      const s = (now - startedAt) / 1000;
      intro = reduced ? 1 : easeOut(clamp01(s / 1.8));
      rise = reduced ? 1 : easeOut(clamp01(s / 3));
    }
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform2f(U.uMouse, mouse.x, mouse.y);
    gl.uniform1f(U.uTime, time);
    gl.uniform1f(U.uScroll, scroll);
    gl.uniform1f(U.uIntro, intro);
    gl.uniform1f(U.uRise, rise);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  window.Scene = {
    start() {
      if (startedAt === null) startedAt = performance.now();
    },
  };
})();
