// suminagashi.jsx — GPU fluid ink overlay (stable fluids: advect → vorticity → project)
// Dye field stores absorbance; the canvas multiplies paper below (light mode)
// or screens light ink onto dark washi (dark mode).
import * as THREE from 'three';
import { useEffect, useRef } from 'react';

const config = {
  SIM_RES: 192,
  DYE_RES: 1024,
  PRESSURE_ITER: 22,
  VEL_DISSIPATION: 0.18,
  DYE_DISSIPATION: 0.32,
  CURL: 12,
  SPLAT_RADIUS: 0.0026,
  SPLAT_FORCE: 3000,
  TIME_SCALE: 0.55,  // slows the whole simulation so swirls read as ink on water
};

const LIGHT_INKS = ['#1a1714', '#2f3a52', '#a8332a', '#b6884a'];
const DARK_INKS = ['#e9e3d5', '#7a93c2', '#d4564a', '#c9a35f'];

const VERT = /* glsl */`
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const ADVECT_FRAG = /* glsl */`
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVelocity, uSource;
  uniform vec2 uTexel;
  uniform float uDt, uDissipation;
  void main(){
    vec2 coord = vUv - uDt * texture2D(uVelocity, vUv).xy * uTexel;
    gl_FragColor = texture2D(uSource, coord) / (1.0 + uDissipation * uDt);
  }
`;

const SPLAT_FRAG = /* glsl */`
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTarget;
  uniform float uAspect, uRadius;
  uniform vec2 uPoint;
  uniform vec3 uColor;
  void main(){
    vec2 p = vUv - uPoint;
    p.x *= uAspect;
    vec3 splat = exp(-dot(p, p) / uRadius) * uColor;
    gl_FragColor = vec4(texture2D(uTarget, vUv).rgb + splat, 1.0);
  }
`;

const CURL_FRAG = /* glsl */`
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform vec2 uTexel;
  void main(){
    float L = texture2D(uVelocity, vUv - vec2(uTexel.x, 0.0)).y;
    float R = texture2D(uVelocity, vUv + vec2(uTexel.x, 0.0)).y;
    float B = texture2D(uVelocity, vUv - vec2(0.0, uTexel.y)).x;
    float T = texture2D(uVelocity, vUv + vec2(0.0, uTexel.y)).x;
    gl_FragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
  }
`;

const VORTICITY_FRAG = /* glsl */`
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVelocity, uCurl;
  uniform vec2 uTexel;
  uniform float uCurlStrength, uDt;
  void main(){
    float L = texture2D(uCurl, vUv - vec2(uTexel.x, 0.0)).x;
    float R = texture2D(uCurl, vUv + vec2(uTexel.x, 0.0)).x;
    float B = texture2D(uCurl, vUv - vec2(0.0, uTexel.y)).x;
    float T = texture2D(uCurl, vUv + vec2(0.0, uTexel.y)).x;
    float C = texture2D(uCurl, vUv).x;
    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= uCurlStrength * C;
    force.y *= -1.0;
    vec2 vel = texture2D(uVelocity, vUv).xy + force * uDt;
    gl_FragColor = vec4(clamp(vel, -1000.0, 1000.0), 0.0, 1.0);
  }
`;

const DIVERGE_FRAG = /* glsl */`
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform vec2 uTexel;
  void main(){
    float L = texture2D(uVelocity, vUv - vec2(uTexel.x, 0.0)).x;
    float R = texture2D(uVelocity, vUv + vec2(uTexel.x, 0.0)).x;
    float B = texture2D(uVelocity, vUv - vec2(0.0, uTexel.y)).y;
    float T = texture2D(uVelocity, vUv + vec2(0.0, uTexel.y)).y;
    vec2 C = texture2D(uVelocity, vUv).xy;
    if (vUv.x - uTexel.x < 0.0) L = -C.x;
    if (vUv.x + uTexel.x > 1.0) R = -C.x;
    if (vUv.y - uTexel.y < 0.0) B = -C.y;
    if (vUv.y + uTexel.y > 1.0) T = -C.y;
    gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
  }
`;

const PRESSURE_FRAG = /* glsl */`
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uPressure, uDivergence;
  uniform vec2 uTexel;
  void main(){
    float L = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
    float R = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
    float B = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x;
    float T = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x;
    float div = texture2D(uDivergence, vUv).x;
    gl_FragColor = vec4((L + R + B + T - div) * 0.25, 0.0, 0.0, 1.0);
  }
`;

const GRADIENT_FRAG = /* glsl */`
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uPressure, uVelocity;
  uniform vec2 uTexel;
  void main(){
    float L = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
    float R = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
    float B = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x;
    float T = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x;
    vec2 vel = texture2D(uVelocity, vUv).xy - vec2(R - L, T - B);
    gl_FragColor = vec4(vel, 0.0, 1.0);
  }
`;

const CLEAR_FRAG = /* glsl */`
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform float uValue;
  void main(){ gl_FragColor = uValue * texture2D(uTexture, vUv); }
`;

// Opaque parchment render. uDark 0: paper × exp(-A) (subtractive ink on washi)
// plus fibre grain, low-frequency aging stains and an edge vignette.
// uDark 1: paper + (1-exp(-A)) — emissive ink on dark washi.
const DISPLAY_FRAG = /* glsl */`
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uDye;
  uniform vec3 uPaper;
  uniform float uDark;

  float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p){
    vec2 i=floor(p), f=fract(p);
    f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
               mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
  }

  void main(){
    // paper fibre grain
    float fiber = noise(vUv * 420.0) * 0.028
                + noise(vUv * 180.0) * 0.022
                + noise(vUv * 60.0)  * 0.018;

    // aging stains: large soft sepia blotches
    float mottle = noise(vUv * 6.0) * 0.6 + noise(vUv * 13.0) * 0.4;
    mottle = smoothstep(0.45, 0.95, mottle);
    vec3 stain = vec3(0.078, 0.055, 0.022) * mottle;

    vec3 A = texture2D(uDye, vUv).rgb;
    vec3 trans = exp(-A);

    vec3 light = uPaper * trans + fiber - stain;
    vec3 darkc = uPaper + (vec3(1.0) - trans) + (fiber - stain) * 0.5;
    vec3 col = mix(light, darkc, uDark);

    // darkened paper edge
    vec2 uv2 = vUv * (1.0 - vUv.yx);
    float vign = pow(uv2.x * uv2.y * 15.0, 0.18);
    col *= 0.92 + 0.08 * vign;

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`;

function SuminagashiFluid({ dark = false, paper = '#ece5d6' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const canvasEl = canvasRef.current;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvasEl, antialias: false, alpha: false, depth: false, stencil: false,
      });
    } catch {
      return; // no WebGL — page works without the effect
    }
    // canvas is sticky inside .paper: sized by CSS, clipped to the scroll column
    let rect = canvasEl.getBoundingClientRect();
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(rect.width, rect.height, false);
    renderer.autoClear = false;

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const scene = new THREE.Scene();
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial());
    scene.add(quad);

    const makeRT = (w, h) => new THREE.WebGLRenderTarget(w, h, {
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping,
      format: THREE.RGBAFormat, type: THREE.HalfFloatType, depthBuffer: false,
    });
    const makeDoubleFBO = (w, h) => ({
      read: makeRT(w, h), write: makeRT(w, h),
      texel: new THREE.Vector2(1 / w, 1 / h),
      swap() { const t = this.read; this.read = this.write; this.write = t; },
      resize(nw, nh) {
        this.read.setSize(nw, nh); this.write.setSize(nw, nh);
        this.texel.set(1 / nw, 1 / nh);
      },
      dispose() { this.read.dispose(); this.write.dispose(); },
    });

    const simSizes = () => {
      const aspect = rect.width / rect.height;
      const sim = config.SIM_RES, dyeMax = Math.min(config.DYE_RES, Math.max(rect.width, rect.height));
      return aspect >= 1
        ? { sw: Math.round(sim * aspect), sh: sim, dw: dyeMax, dh: Math.round(dyeMax / aspect) }
        : { sw: sim, sh: Math.round(sim / aspect), dw: Math.round(dyeMax * aspect), dh: dyeMax };
    };

    let S = simSizes();
    const velocity = makeDoubleFBO(S.sw, S.sh);
    const dye = makeDoubleFBO(S.dw, S.dh);
    const pressure = makeDoubleFBO(S.sw, S.sh);
    const curlRT = makeRT(S.sw, S.sh);
    const divergeRT = makeRT(S.sw, S.sh);

    const prog = (frag, uniforms) => new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false,
    });

    const advectMat = prog(ADVECT_FRAG, {
      uVelocity: { value: null }, uSource: { value: null },
      uTexel: { value: new THREE.Vector2() }, uDt: { value: 0 }, uDissipation: { value: 0 },
    });
    const splatMat = prog(SPLAT_FRAG, {
      uTarget: { value: null }, uAspect: { value: 1 }, uRadius: { value: 0.001 },
      uPoint: { value: new THREE.Vector2() }, uColor: { value: new THREE.Vector3() },
    });
    const curlMat = prog(CURL_FRAG, { uVelocity: { value: null }, uTexel: { value: new THREE.Vector2() } });
    const vorticityMat = prog(VORTICITY_FRAG, {
      uVelocity: { value: null }, uCurl: { value: null },
      uTexel: { value: new THREE.Vector2() }, uCurlStrength: { value: 0 }, uDt: { value: 0 },
    });
    const divergeMat = prog(DIVERGE_FRAG, { uVelocity: { value: null }, uTexel: { value: new THREE.Vector2() } });
    const pressureMat = prog(PRESSURE_FRAG, {
      uPressure: { value: null }, uDivergence: { value: null }, uTexel: { value: new THREE.Vector2() },
    });
    const gradientMat = prog(GRADIENT_FRAG, {
      uPressure: { value: null }, uVelocity: { value: null }, uTexel: { value: new THREE.Vector2() },
    });
    const clearMat = prog(CLEAR_FRAG, { uTexture: { value: null }, uValue: { value: 0.8 } });
    const paperColor = new THREE.Color(paper);
    const displayMat = prog(DISPLAY_FRAG, {
      uDye: { value: null },
      uPaper: { value: new THREE.Vector3(paperColor.r, paperColor.g, paperColor.b) },
      uDark: { value: dark ? 1 : 0 },
    });
    const materials = [advectMat, splatMat, curlMat, vorticityMat, divergeMat, pressureMat, gradientMat, clearMat, displayMat];

    const blit = (mat, target) => {
      quad.material = mat;
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
    };

    /* ── ink: display color → field vector ──
       light: absorbance A = -ln(c)·s   so paper·exp(-A) ≈ c at full strength
       dark:  emission   A = -ln(1-c)·s so 1-exp(-A)    ≈ c at full strength */
    const INKS = (dark ? DARK_INKS : LIGHT_INKS).map(hex => new THREE.Color(hex));
    const inkField = (c, strength) => {
      const e = 0.012;
      const ch = (v) => -Math.log(Math.max(dark ? 1 - v : v, e)) * strength;
      return new THREE.Vector3(ch(c.r), ch(c.g), ch(c.b));
    };

    const splatVelocity = (x, y, fx, fy, radiusMul) => {
      splatMat.uniforms.uTarget.value = velocity.read.texture;
      splatMat.uniforms.uAspect.value = rect.width / rect.height;
      splatMat.uniforms.uPoint.value.set(x, y);
      splatMat.uniforms.uRadius.value = config.SPLAT_RADIUS * (radiusMul || 1);
      splatMat.uniforms.uColor.value.set(fx, fy, 0);
      blit(splatMat, velocity.write);
      velocity.swap();
    };
    const splatDye = (x, y, field, radiusMul) => {
      splatMat.uniforms.uTarget.value = dye.read.texture;
      splatMat.uniforms.uAspect.value = rect.width / rect.height;
      splatMat.uniforms.uPoint.value.set(x, y);
      splatMat.uniforms.uRadius.value = config.SPLAT_RADIUS * (radiusMul || 1);
      splatMat.uniforms.uColor.value.copy(field);
      blit(splatMat, dye.write);
      dye.swap();
    };

    const dropInk = (x, y, color, strength) => {
      splatDye(x, y, inkField(color, strength * 0.12), 1.0);
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 80;
      splatVelocity(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 1.2);
    };

    /* ── pointer (window-level: canvas has pointer-events none) ── */
    let inkIdx = 0;
    const pointer = { moved: false, x: 0, y: 0, px: 0, py: 0 };
    let lastInteraction = performance.now();

    const toUV = (e) => {
      const r = canvasEl.getBoundingClientRect();
      return { x: (e.clientX - r.left) / r.width, y: 1 - (e.clientY - r.top) / r.height };
    };
    const inside = (p) => p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1;
    const onMove = (e) => {
      const p = toUV(e);
      pointer.px = pointer.x; pointer.py = pointer.y;
      pointer.x = p.x; pointer.y = p.y;
      pointer.moved = inside(p);
      lastInteraction = performance.now();
    };
    const onDown = (e) => {
      const p = toUV(e);
      if (!inside(p)) return;
      inkIdx++;
      dropInk(p.x, p.y, INKS[inkIdx % INKS.length], 0.5 + Math.random() * 0.3);
      lastInteraction = performance.now();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerdown', onDown);

    const applyPointer = () => {
      if (!pointer.moved) return;
      pointer.moved = false;
      const dx = pointer.x - pointer.px;
      const dy = pointer.y - pointer.py;
      if (Math.abs(dx) + Math.abs(dy) < 1e-6) return;
      splatVelocity(pointer.x, pointer.y, dx * config.SPLAT_FORCE, dy * config.SPLAT_FORCE, 1.6);
      const speed = Math.min(Math.hypot(dx, dy) * 30, 1);
      splatDye(pointer.x, pointer.y, inkField(INKS[inkIdx % INKS.length], 0.015 + speed * 0.04), 0.9);
    };

    /* ── idle drops + slow drift, kept subtle for a content page ── */
    let nextDrop = 3000;
    let nextStir = 2600;
    const autoUpdate = (now, dt) => {
      const idle = now - lastInteraction > 4000;
      nextDrop -= dt * 1000;
      if (idle && nextDrop <= 0) {
        const x = 0.14 + Math.random() * 0.72;
        const y = 0.16 + Math.random() * 0.68;
        dropInk(x, y, INKS[Math.floor(Math.random() * INKS.length)], 0.25 + Math.random() * 0.25);
        nextDrop = 4500 + Math.random() * 3500;
      }
      nextStir -= dt * 1000;
      if (nextStir <= 0) {
        const t = now * 0.00012;
        const cx = 0.5 + Math.sin(t * 1.7) * 0.3;
        const cy = 0.5 + Math.cos(t * 1.1) * 0.3;
        const a = t * 6.0 + Math.random() * 1.5;
        splatVelocity(cx, cy, Math.cos(a) * 90, Math.sin(a) * 90, 14);
        nextStir = 1200 + Math.random() * 1000;
      }
    };

    const step = (dt) => {
      curlMat.uniforms.uVelocity.value = velocity.read.texture;
      curlMat.uniforms.uTexel.value.copy(velocity.texel);
      blit(curlMat, curlRT);

      vorticityMat.uniforms.uVelocity.value = velocity.read.texture;
      vorticityMat.uniforms.uCurl.value = curlRT.texture;
      vorticityMat.uniforms.uTexel.value.copy(velocity.texel);
      vorticityMat.uniforms.uCurlStrength.value = config.CURL;
      vorticityMat.uniforms.uDt.value = dt;
      blit(vorticityMat, velocity.write);
      velocity.swap();

      divergeMat.uniforms.uVelocity.value = velocity.read.texture;
      divergeMat.uniforms.uTexel.value.copy(velocity.texel);
      blit(divergeMat, divergeRT);

      clearMat.uniforms.uTexture.value = pressure.read.texture;
      clearMat.uniforms.uValue.value = 0.8;
      blit(clearMat, pressure.write);
      pressure.swap();

      pressureMat.uniforms.uDivergence.value = divergeRT.texture;
      pressureMat.uniforms.uTexel.value.copy(velocity.texel);
      for (let i = 0; i < config.PRESSURE_ITER; i++) {
        pressureMat.uniforms.uPressure.value = pressure.read.texture;
        blit(pressureMat, pressure.write);
        pressure.swap();
      }

      gradientMat.uniforms.uPressure.value = pressure.read.texture;
      gradientMat.uniforms.uVelocity.value = velocity.read.texture;
      gradientMat.uniforms.uTexel.value.copy(velocity.texel);
      blit(gradientMat, velocity.write);
      velocity.swap();

      advectMat.uniforms.uVelocity.value = velocity.read.texture;
      advectMat.uniforms.uSource.value = velocity.read.texture;
      advectMat.uniforms.uTexel.value.copy(velocity.texel);
      advectMat.uniforms.uDt.value = dt;
      advectMat.uniforms.uDissipation.value = config.VEL_DISSIPATION;
      blit(advectMat, velocity.write);
      velocity.swap();

      advectMat.uniforms.uVelocity.value = velocity.read.texture;
      advectMat.uniforms.uSource.value = dye.read.texture;
      advectMat.uniforms.uTexel.value.copy(dye.texel);
      advectMat.uniforms.uDissipation.value = config.DYE_DISSIPATION;
      blit(advectMat, dye.write);
      dye.swap();
    };

    // manual sticky: keep the 100vh canvas glued to the viewport inside .paper
    const wrapEl = canvasEl.parentElement;
    const followScroll = () => {
      const wr = wrapEl.getBoundingClientRect();
      const y = Math.min(Math.max(-wr.top, 0), Math.max(0, wr.height - innerHeight));
      canvasEl.style.transform = `translateY(${y}px)`;
    };

    let raf;
    let lastT = performance.now();
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      let dt = (now - lastT) / 1000;
      lastT = now;
      dt = Math.min(dt, 1 / 30) * config.TIME_SCALE;
      if (dt <= 0) return;

      followScroll();
      applyPointer();
      autoUpdate(now, dt);
      step(dt);

      displayMat.uniforms.uDye.value = dye.read.texture;
      blit(displayMat, null);
    };

    const onResize = () => {
      rect = canvasEl.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      S = simSizes();
      velocity.resize(S.sw, S.sh);
      pressure.resize(S.sw, S.sh);
      curlRT.setSize(S.sw, S.sh);
      divergeRT.setSize(S.sw, S.sh);
      dye.resize(S.dw, S.dh);
    };
    window.addEventListener('resize', onResize);

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('resize', onResize);
      velocity.dispose(); dye.dispose(); pressure.dispose();
      curlRT.dispose(); divergeRT.dispose();
      materials.forEach(m => m.dispose());
      quad.geometry.dispose();
      renderer.dispose();
    };
  }, [dark, paper]);

  return (
    <div className="fluid-wrap" aria-hidden="true">
      <canvas ref={canvasRef} className="fluid-canvas" />
    </div>
  );
}

export { SuminagashiFluid };
