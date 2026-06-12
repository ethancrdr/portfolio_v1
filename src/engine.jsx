// engine.jsx — brush trail + scroll-reveal primitives
import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useReducedMotion, useInView } from 'framer-motion';
import lottie from 'lottie-web/build/player/lottie_light';
import kanjiStrokes from './assets/kanji-lottie.json';

/* ---------- Reveal — framer-motion whileInView ---------- */
const REVEAL_VARIANTS = {
  up:    { hidden: { opacity: 0, y: 28 },            visible: { opacity: 1, y: 0 } },
  fade:  { hidden: { opacity: 0 },                   visible: { opacity: 1 } },
  right: { hidden: { opacity: 0, x: -24 },           visible: { opacity: 1, x: 0 } },
  left:  { hidden: { opacity: 0, x: 24 },            visible: { opacity: 1, x: 0 } },
  clip:  { hidden: { clipPath: "inset(0 0 100% 0)" }, visible: { clipPath: "inset(0 0 0% 0)" } },
  scale: { hidden: { opacity: 0, scale: 0.88 },      visible: { opacity: 1, scale: 1 } },
};

function Reveal({ children, variant = "up", delay = 0, as = "div", className = "", style = {}, whileHover }) {
  const Tag = motion[as] ?? motion.div;
  const reduce = useReducedMotion();
  const dur = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue("--reveal-dur")
  ) / 1000 || 0.9;

  if (reduce) {
    return (
      <Tag className={className} style={style} whileHover={whileHover}>
        {children}
      </Tag>
    );
  }

  const builtVariants = {
    ...REVEAL_VARIANTS[variant],
    visible: {
      ...REVEAL_VARIANTS[variant].visible,
      transition: { duration: dur, delay: delay / 1000, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <Tag
      className={className}
      style={style}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-8% 0px" }}
      variants={builtVariants}
      whileHover={whileHover}
      transition={whileHover ? { type: "spring", stiffness: 400, damping: 22 } : undefined}
    >
      {children}
    </Tag>
  );
}

/* ---------- CharReveal — per-character brush-stroke entrance ---------- */
function CharReveal({ text, delay = 0, stagger = 34 }) {
  const reduce = useReducedMotion();
  if (reduce) return <span aria-hidden="true">{text}</span>;
  let charIndex = 0;
  return (
    <span aria-hidden="true">
      {text.split(" ").map((word, wi, words) => (
        <span key={wi}>
          <span style={{ display: "inline-block", whiteSpace: "nowrap" }}>
          {Array.from(word).map((c, ci) => {
            const i = charIndex++;
            return (
              <motion.span
                key={ci}
                style={{ display: "inline-block" }}
                initial={{ opacity: 0, y: "0.42em", filter: "blur(7px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.72, delay: (delay + i * stagger) / 1000, ease: [0.16, 1, 0.3, 1] }}
              >
                {c}
              </motion.span>
            );
          })}
          </span>
          {wi < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
}

/* ---------- ParallaxY — scroll-linked vertical drift (no listeners) ---------- */
function ParallaxY({ children, from = 0, to = 60, className = "", style = {} }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [from, to]);
  return (
    <motion.div ref={ref} className={className} style={{ ...style, y: reduce ? 0 : y }}>
      {children}
    </motion.div>
  );
}

/* ---------- VerticalText (tategaki) ---------- */
function VerticalText({ children, className = "", style = {} }) {
  return (
    <span
      className={className}
      style={{ writingMode: "vertical-rl", textOrientation: "upright", fontWeight: 600, ...style }}>

      {children}
    </span>);

}

/* ---------- SealStamp (hanko) ---------- */
function SealStamp({ glyph = "恵", size = 64, className = "", style = {} }) {
  return (
    <motion.span
      className={"seal-stamp " + className}
      style={{ width: size, height: size, fontSize: size * 0.5, ...style }}
      aria-hidden="true"
      initial={{ scale: 0, rotate: -20, opacity: 0 }}
      whileInView={{ scale: 1, rotate: 0, opacity: 1 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.06, rotate: 3 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
    >
      <span style={{ writingMode: "vertical-rl", textOrientation: "upright", padding: "0px 0px 1px", margin: "0px 0px 1px" }}>{glyph}</span>
    </motion.span>
  );
}

/* ---------- KanjiBrush — Lottie stroke-order drawing of kanji glyphs ---------- */
// playOn: "mount" plays after `delay` ms; "visible" waits until scrolled into view.
function KanjiBrush({ label, data = kanjiStrokes, delay = 400, playOn = "mount", className = "", style = {} }) {
  const ref = useRef(null);
  const animRef = useRef(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });

  useEffect(() => {
    const anim = lottie.loadAnimation({
      container: ref.current,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      // lottie-web mutates animationData; clone so words reused across rerenders stay pristine
      animationData: structuredClone(data),
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
    });
    animRef.current = anim;
    if (reduce) anim.goToAndStop(anim.totalFrames - 1, true);
    return () => { animRef.current = null; anim.destroy(); };
  }, [reduce, data]);

  useEffect(() => {
    if (reduce || !animRef.current) return;
    if (playOn === "mount" || inView) {
      const timer = setTimeout(() => animRef.current?.play(), delay);
      return () => clearTimeout(timer);
    }
  }, [reduce, playOn, inView, delay, data]);

  return <div ref={ref} className={"kanji-brush " + className} style={style} role="img" aria-label={label} />;
}

/* ---------- BrushDivider — a tapering ink stroke ---------- */
function BrushDivider({ vertical = false, length = 120, className = "", style = {} }) {
  if (vertical) {
    return (
      <svg className={className} width="10" height={length} viewBox={`0 0 10 ${length}`}
        preserveAspectRatio="none" style={style} aria-hidden="true">
        <motion.path
          d={`M5 2 C 7 ${length * 0.3}, 3 ${length * 0.6}, 5 ${length - 2}`}
          stroke="var(--ink)" strokeWidth="2.4" fill="none" strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 0.55 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </svg>
    );
  }
  return (
    <svg className={className} width={length} height="12" viewBox={`0 0 ${length} 12`}
      preserveAspectRatio="none" style={style} aria-hidden="true">
      <motion.path
        d={`M2 6 C ${length * 0.3} 3, ${length * 0.6} 9, ${length - 2} 5`}
        stroke="var(--ink)" strokeWidth="2.4" fill="none" strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 0.55 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      />
    </svg>
  );
}

/* ---------- ScrollProgress — fills the mounting seam as the scroll unrolls ---------- */
function ScrollProgress({ side = "left" }) {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.4 });
  if (reduce) return null;
  return (
    <div className={"scroll-seam scroll-seam--" + side} aria-hidden="true">
      <div className="scroll-seam__track" />
      <motion.div className="scroll-seam__fill" style={{ scaleY }} />
    </div>);

}

/* ---------- SumiInkCursorTrail — Shodō-inspired organic brush marks ---------- */
function SumiInkCursorTrail({ inkColor = "#1a1714" }) {
  const canvasRef = useRef(null);
  const inkRef = useRef(inkColor);
  inkRef.current = inkColor;

  useEffect(() => {
    // skip on touch devices and for reduced-motion users
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let marks = [];
    let lastPos = null;
    let lastMarkT = 0;
    let W, H, dpr;

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Generate an irregular blob of points around origin for one ink mark
    const mkBlobPts = (size) => {
      const n = 6 + Math.floor(Math.random() * 4);
      return Array.from({ length: n }, (_, i) => {
        const angle = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        const r = size * (0.38 + Math.random() * 0.82);
        return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
      });
    };

    const spawnMark = (cx, cy, speed) => {
      // slow cursor → big/dark mark; fast → small/light
      const size = Math.max(4, 30 - speed * 22);
      const alpha = Math.max(0.055, 0.16 - speed * 0.085);
      const life = 700 + Math.random() * 550;
      marks.push({
        x: cx, y: cy,
        rot: Math.random() * Math.PI * 2,
        sx: 0.55 + Math.random() * 0.9,
        sy: 0.55 + Math.random() * 0.9,
        alpha, life,
        born: performance.now(),
        pts: mkBlobPts(size),
        size,
      });
      if (marks.length > 58) marks.shift();
    };

    const onMove = (e) => {
      const now = performance.now();
      const x = e.clientX, y = e.clientY;
      let speed = 0;
      if (lastPos) {
        const dt = Math.max(8, now - lastPos.t);
        speed = Math.hypot(x - lastPos.x, y - lastPos.y) / dt;
      }
      // faster cursor → space marks further apart
      if (now - lastMarkT > 38 + speed * 14) {
        spawnMark(x, y, Math.min(speed, 2));
        lastMarkT = now;
      }
      lastPos = { x, y, t: now };
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    // Smooth closed curve through points via Catmull-Rom → bezier
    const drawBlob = (pts) => {
      const n = pts.length;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const p0 = pts[(i - 1 + n) % n];
        const p1 = pts[i];
        const p2 = pts[(i + 1) % n];
        const p3 = pts[(i + 2) % n];
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        if (i === 0) ctx.moveTo(p1.x, p1.y);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
      }
      ctx.closePath();
    };

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const now = performance.now();
      const ink = inkRef.current;
      marks = marks.filter(m => now - m.born < m.life);

      for (const m of marks) {
        const prog = (now - m.born) / m.life;
        const fade = Math.pow(1 - prog, 1.9);
        const a = m.alpha * fade;
        if (a < 0.004) continue;

        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.rotate(m.rot);
        ctx.scale(m.sx, m.sy);
        ctx.globalAlpha = a;

        // Radial gradient for feathered ink edge
        const grad = ctx.createRadialGradient(0, 0, m.size * 0.08, 0, 0, m.size * 1.1);
        grad.addColorStop(0, ink);
        grad.addColorStop(0.52, ink);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;

        drawBlob(m.pts);
        ctx.fill();
        ctx.restore();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} className="brush-canvas" aria-hidden="true" />;
}

export { SumiInkCursorTrail, Reveal, ScrollProgress, VerticalText, SealStamp, BrushDivider, CharReveal, ParallaxY, KanjiBrush };
