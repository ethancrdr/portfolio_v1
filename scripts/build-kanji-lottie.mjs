// Build Lottie stroke-order drawing animations from KanjiVG stroke data.
// Outputs:
//   1. lottie-player/public/lottie.json  — hero 恵丹 + hanko seal + washi bg, editable slots (skottie player)
//   2. src/assets/kanji-lottie.json      — hero 恵丹, transparent bg, slots resolved (lottie-web on the site)
//   3. src/assets/kanji-kickers.json     — map of section-kicker words → seal-red stroke animations
//
// Stroke data: scripts/kanjivg/<codepoint>.svg (KanjiVG, viewBox 0 0 109 109).
// Usage: node scripts/build-kanji-lottie.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const KVG_DIR = join(ROOT, 'scripts', 'kanjivg');
const FR = 60;
const KVG_BOX = 109; // KanjiVG viewBox is 0 0 109 109

const INK = [0.102, 0.09, 0.078, 1];     // --ink   #1a1714
const SEAL = [0.659, 0.2, 0.165, 1];     // --seal  #a8332a
const WASHI = [0.925, 0.898, 0.839, 1];  // --washi #ece5d6

/* ---------- SVG path parsing ---------- */
function glyphStrokes(glyph) {
  const cp = glyph.codePointAt(0).toString(16).padStart(5, '0');
  const svg = readFileSync(join(KVG_DIR, cp + '.svg'), 'utf8');
  // KanjiVG stroke elements have id kvg:XXXXX-sN; keep stroke order by N
  const strokes = [];
  const re = /id="kvg:[0-9a-f]+-s(\d+)"[^>]*\bd="([^"]+)"/g;
  let m;
  while ((m = re.exec(svg)) !== null) strokes.push({ n: +m[1], d: m[2] });
  strokes.sort((a, b) => a.n - b.n);
  return strokes.map(s => s.d);
}

function parsePath(d) {
  const tokens = d.match(/[MmCcSsLl]|-?\d*\.?\d+(?:e-?\d+)?/g);
  let i = 0;
  const num = () => parseFloat(tokens[i++]);
  const segs = []; // cubic segments {p0, c1, c2, p1}
  let cur = [0, 0], start = [0, 0], prevC2 = null, cmd = null;

  while (i < tokens.length) {
    if (/[A-Za-z]/.test(tokens[i])) cmd = tokens[i++];
    switch (cmd) {
      case 'M': cur = [num(), num()]; start = [...cur]; prevC2 = null; cmd = 'L'; break;
      case 'm': cur = [cur[0] + num(), cur[1] + num()]; start = [...cur]; prevC2 = null; cmd = 'l'; break;
      case 'C': case 'c': {
        const rel = cmd === 'c';
        const o = rel ? cur : [0, 0];
        const c1 = [o[0] + num(), o[1] + num()];
        const o2 = rel ? cur : [0, 0];
        const c2 = [o2[0] + num(), o2[1] + num()];
        const o3 = rel ? cur : [0, 0];
        const p1 = [o3[0] + num(), o3[1] + num()];
        segs.push({ p0: [...cur], c1, c2, p1 });
        prevC2 = c2; cur = p1; break;
      }
      case 'S': case 's': {
        const rel = cmd === 's';
        const c1 = prevC2 ? [2 * cur[0] - prevC2[0], 2 * cur[1] - prevC2[1]] : [...cur];
        const o = rel ? cur : [0, 0];
        const c2 = [o[0] + num(), o[1] + num()];
        const o2 = rel ? cur : [0, 0];
        const p1 = [o2[0] + num(), o2[1] + num()];
        segs.push({ p0: [...cur], c1, c2, p1 });
        prevC2 = c2; cur = p1; break;
      }
      case 'L': case 'l': {
        const rel = cmd === 'l';
        const o = rel ? cur : [0, 0];
        const p1 = [o[0] + num(), o[1] + num()];
        // represent line as a cubic with tangents on the line
        const c1 = [cur[0] + (p1[0] - cur[0]) / 3, cur[1] + (p1[1] - cur[1]) / 3];
        const c2 = [cur[0] + 2 * (p1[0] - cur[0]) / 3, cur[1] + 2 * (p1[1] - cur[1]) / 3];
        segs.push({ p0: [...cur], c1, c2, p1 });
        prevC2 = null; cur = p1; break;
      }
      default: throw new Error(`unsupported path command: ${cmd}`);
    }
  }
  return segs;
}

function segsToLottiePath(segs) {
  const v = [segs[0].p0.map(r2)];
  const inT = [[0, 0]];
  const outT = [];
  for (const s of segs) {
    outT.push(sub(s.c1, s.p0));
    inT.push(sub(s.c2, s.p1));
    v.push(s.p1.map(r2));
  }
  outT.push([0, 0]);
  return { c: false, v, i: inT, o: outT };
}

const r2 = (x) => Math.round(x * 100) / 100;
const sub = (a, b) => [r2(a[0] - b[0]), r2(a[1] - b[1])];

function pathLength(segs) {
  let len = 0;
  for (const { p0, c1, c2, p1 } of segs) {
    let prev = p0;
    for (let t = 1; t <= 20; t++) {
      const u = t / 20, w = 1 - u;
      const pt = [
        w * w * w * p0[0] + 3 * w * w * u * c1[0] + 3 * w * u * u * c2[0] + u * u * u * p1[0],
        w * w * w * p0[1] + 3 * w * w * u * c1[1] + 3 * w * u * u * c2[1] + u * u * u * p1[1],
      ];
      len += Math.hypot(pt[0] - prev[0], pt[1] - prev[1]);
      prev = pt;
    }
  }
  return len;
}

/* ---------- Lottie builders ---------- */
const stat = (k) => ({ a: 0, k });

function groupTr() {
  return { ty: 'tr', p: stat([0, 0]), a: stat([0, 0]), s: stat([100, 100]), r: stat(0), o: stat(100) };
}

function strokeGroup(name, segs, startFrame, durFrames, ink) {
  return {
    ty: 'gr', nm: name,
    it: [
      { ty: 'sh', ks: stat(segsToLottiePath(segs)) },
      {
        ty: 'tm', m: 1, nm: name + '-trim',
        s: stat(0), o: stat(0),
        e: {
          a: 1,
          k: [
            { t: startFrame, s: [0], o: { x: [0.45], y: [0] }, i: { x: [0.25], y: [1] } },
            { t: startFrame + durFrames, s: [100] },
          ],
        },
      },
      {
        ty: 'st', c: ink, o: stat(100),
        w: { sid: 'brushWidth' }, lc: 2, lj: 2,
      },
      groupTr(),
    ],
  };
}

// One shape layer drawing one glyph stroke by stroke.
// pace: KanjiVG units drawn per frame (higher = faster brush).
function kanjiLayer(name, glyph, center, scalePct, t0, { pace = 6.5, gap = 3, ink } = {}) {
  let t = t0;
  const groups = [];
  glyphStrokes(glyph).forEach((d, idx) => {
    const segs = parsePath(d);
    const dur = Math.max(4, Math.min(20, Math.round(pathLength(segs) / pace)));
    groups.push(strokeGroup(`${name}-s${idx + 1}`, segs, t, dur));
    t += dur + gap; // small breath between strokes
  });
  if (ink) for (const g of groups) g.it.find(s => s.ty === 'st').c = ink;
  const layer = {
    ty: 4, nm: name, ip: 0, op: 0, st: 0,
    ks: {
      o: stat(100), r: stat(0),
      p: stat([center[0], center[1], 0]),
      a: stat([KVG_BOX / 2, KVG_BOX / 2, 0]),
      s: stat([scalePct, scalePct, 100]),
    },
    shapes: groups,
  };
  return { layer, end: t - gap };
}

function sealLayer(t0, op, center) {
  const pop = {
    a: 1,
    k: [
      { t: t0, s: [0, 0, 100], o: { x: [0.3], y: [0] }, i: { x: [0.2], y: [1] } },
      { t: t0 + 9, s: [116, 116, 100], o: { x: [0.4], y: [0] }, i: { x: [0.5], y: [1] } },
      { t: t0 + 16, s: [100, 100, 100] },
    ],
  };
  const rot = {
    a: 1,
    k: [
      { t: t0, s: [-22], o: { x: [0.3], y: [0] }, i: { x: [0.2], y: [1] } },
      { t: t0 + 16, s: [-8] },
    ],
  };
  return {
    ty: 4, nm: 'seal', ip: 0, op, st: 0,
    ks: { o: stat(100), r: rot, p: stat([center[0], center[1], 0]), a: stat([0, 0, 0]), s: pop },
    shapes: [
      {
        ty: 'gr', nm: 'seal-rim',
        it: [
          { ty: 'rc', p: stat([0, 0]), s: stat([33, 33]), r: stat(4) },
          { ty: 'st', c: stat(WASHI), o: stat(90), w: stat(2), lc: 2, lj: 2 },
          groupTr(),
        ],
      },
      {
        ty: 'gr', nm: 'seal-body',
        it: [
          { ty: 'rc', p: stat([0, 0]), s: stat([46, 46]), r: stat(7) },
          { ty: 'fl', c: { sid: 'sealColor' }, o: stat(100) },
          groupTr(),
        ],
      },
    ],
  };
}

function bgLayer(w, h, op) {
  return {
    ty: 4, nm: 'background', ip: 0, op, st: 0,
    ks: { o: stat(100), r: stat(0), p: stat([w / 2, h / 2, 0]), a: stat([0, 0, 0]), s: stat([100, 100, 100]) },
    shapes: [
      {
        ty: 'gr', nm: 'bg',
        it: [
          { ty: 'rc', p: stat([0, 0]), s: stat([w, h]), r: stat(0) },
          { ty: 'fl', c: { sid: 'bgColor' }, o: stat(100) },
          groupTr(),
        ],
      },
    ],
  };
}

const SLOTS = {
  inkColor: { p: stat(INK) },
  sealColor: { p: stat(SEAL) },
  bgColor: { p: stat(WASHI) },
  brushWidth: { p: stat(5) },
};

// Replace { sid } references with the slot's default value so the file
// also plays in runtimes without slot support (lottie-web on the site).
function resolveSlots(node) {
  if (Array.isArray(node)) return node.map(resolveSlots);
  if (node && typeof node === 'object') {
    if (node.sid && SLOTS[node.sid]) return structuredClone(SLOTS[node.sid].p);
    return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, resolveSlots(v)]));
  }
  return node;
}

function doc(nm, w, h, op, layers, withSlots) {
  const d = { v: '5.7.0', fr: FR, ip: 0, op, w, h, nm, assets: [], layers };
  if (withSlots) d.slots = SLOTS;
  return d;
}

/* ---------- Hero 恵丹 (vertical) ---------- */
function buildHero({ withSeal, withBg }) {
  const W = 300, H = withSeal ? 640 : 520;
  const megumi = kanjiLayer('megumi', '恵', [W / 2, 145], 205, 10, { ink: { sid: 'inkColor' } });
  const tan = kanjiLayer('tan', '丹', [W / 2, 395], 205, megumi.end + 12, { ink: { sid: 'inkColor' } });
  const sealStart = tan.end + 10;
  const op = (withSeal ? sealStart + 16 : tan.end) + 70; // hold finished comp
  for (const l of [megumi.layer, tan.layer]) l.op = op;

  const layers = [megumi.layer, tan.layer];
  if (withSeal) layers.unshift(sealLayer(sealStart, op, [W / 2, 575]));
  if (withBg) layers.push(bgLayer(W, H, op));
  return doc('kanji-megumi-tan', W, H, op, layers, true);
}

/* ---------- Section kickers (vertical words, seal-red ink) ---------- */
const KICKER_WORDS = ['紹介', '経歴', '技術', '作品', '提供', '連絡', '歴史'];

function buildKicker(word) {
  const BOX = 130; // per-glyph cell, glyph scaled to 110% of the 109 box
  const W = 140, H = BOX * word.length;
  let t = 4;
  const layers = [];
  [...word].forEach((glyph, gi) => {
    const k = kanjiLayer(`g${gi}-${glyph}`, glyph, [W / 2, BOX / 2 + BOX * gi + 5], 110, t,
      { pace: 9, gap: 2, ink: stat(SEAL) });
    layers.push(k.layer);
    t = k.end + 8; // pause between glyphs
  });
  const op = t - 8 + 50;
  for (const l of layers) l.op = op;
  const d = doc('kicker-' + word, W, H, op, layers, true);
  const resolved = resolveSlots(d);
  delete resolved.slots;
  return resolved;
}

/* ---------- Write outputs ---------- */
const playerDoc = buildHero({ withSeal: true, withBg: true });
writeFileSync(join(ROOT, 'lottie-player/public/lottie.json'), JSON.stringify(playerDoc));

const webHero = resolveSlots(buildHero({ withSeal: false, withBg: false }));
delete webHero.slots;
writeFileSync(join(ROOT, 'src/assets/kanji-lottie.json'), JSON.stringify(webHero));

const kickers = Object.fromEntries(KICKER_WORDS.map(w => [w, buildKicker(w)]));
writeFileSync(join(ROOT, 'src/assets/kanji-kickers.json'), JSON.stringify(kickers));

console.log(`hero: player op=${playerDoc.op}, web op=${webHero.op}`);
for (const w of KICKER_WORDS) console.log(`kicker ${w}: op=${kickers[w].op} (${(kickers[w].op / FR).toFixed(2)}s)`);
