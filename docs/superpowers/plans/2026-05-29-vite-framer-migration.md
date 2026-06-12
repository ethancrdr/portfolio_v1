# Vite + Framer Motion Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the portfolio from a no-bundler CDN setup to Vite, enabling framer-motion for scroll-reveal, draw-on brush strokes, hanko stamp effect, and card hover animations.

**Architecture:** All `.jsx` files move to `src/`, globals become ES module imports/exports, the custom `Reveal`+`useInView` system is replaced by framer-motion `whileInView`, and `BrushDivider`/`SealStamp` gain framer animations. `sections.jsx`, `data.jsx`, and `tweaks-panel.jsx` get minimal changes (imports/exports only); `engine.jsx` is the major rewrite.

**Tech Stack:** Vite 6, @vitejs/plugin-react 4, React 18, framer-motion 12 (already installed)

---

## File Map

| Action | From | To | Notes |
|--------|------|----|-------|
| Create | — | `vite.config.js` | Vite config |
| Create | — | `index.html` | Replaces current shell from `Portfolio Ethan.html` |
| Create | — | `src/main.jsx` | ReactDOM.createRoot entry point |
| Create | — | `src/styles/main.css` | CSS extracted from `Portfolio Ethan.html` lines 11–366 |
| Convert | `data.jsx` | `src/data.jsx` | `window.PORTFOLIO` → named export |
| Convert | `tweaks-panel.jsx` | `src/tweaks-panel.jsx` | `React.*` → imports, `Object.assign(window)` → exports |
| Rewrite | `engine.jsx` | `src/engine.jsx` | Replace `Reveal`/`useInView` with framer; add framer to `BrushDivider`, `SealStamp` |
| Convert | `sections.jsx` | `src/sections.jsx` | Add imports, add `whileHover` to cards, named exports |
| Convert | `app.jsx` | `src/app.jsx` | Add imports, remove globals |
| Update | `package.json` | `package.json` | Add scripts + deps |
| Keep (unchanged) | `Portfolio Ethan.html` | `Portfolio Ethan.html` | Backup — delete after Task 10 passes |

---

## Task 1: Update package.json + install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Replace package.json content**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "framer-motion": "^12.40.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.5.0",
    "vite": "^6.3.0"
  }
}
```

- [ ] **Step 2: Install**

```bash
pnpm install
```

Expected: lockfile updates, `node_modules` gains `react`, `react-dom`, `vite`, `@vitejs/plugin-react`.

- [ ] **Step 3: Verify**

```bash
pnpm list react vite @vitejs/plugin-react framer-motion
```

Expected: all four packages listed with versions.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "build: add vite + react as npm deps"
```

---

## Task 2: Create vite.config.js

**Files:**
- Create: `vite.config.js`

- [ ] **Step 1: Create the file**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist' },
})
```

- [ ] **Step 2: Commit**

```bash
git add vite.config.js
git commit -m "build: add vite config"
```

---

## Task 3: Create index.html shell

**Files:**
- Create: `index.html`

The current `Portfolio Ethan.html` head has the font links we need. The new `index.html` is a minimal shell — no inline CSS, no CDN scripts.

- [ ] **Step 1: Create index.html**

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Ethan Mejía Cordero — Full Stack Developer</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500;600;700;800&family=Yuji+Syuku&family=Zen+Old+Mincho:wght@400;600;700;900&family=Zen+Kaku+Gothic+New:wght@300;400;500;700&family=Zen+Kaku+Gothic+Antique:wght@300;400;500;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "build: add vite index.html entry"
```

---

## Task 4: Extract CSS to src/styles/main.css

**Files:**
- Create: `src/styles/main.css`

The CSS lives between `<style>` (line 10) and `</style>` (line 367) in `Portfolio Ethan.html`. Extract lines 11–366.

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p src/styles
```

- [ ] **Step 2: Copy CSS out of the HTML**

```bash
sed -n '11,366p' "Portfolio Ethan.html" > src/styles/main.css
```

- [ ] **Step 3: Verify the file looks right**

```bash
head -5 src/styles/main.css
tail -5 src/styles/main.css
```

Expected first lines start with `:root{` and the file ends with a `}` closing a media query block (no `<style>` or `</style>` tags present).

- [ ] **Step 4: Commit**

```bash
git add src/styles/main.css
git commit -m "build: extract portfolio CSS to src/styles/main.css"
```

---

## Task 5: Convert src/data.jsx

**Files:**
- Create: `src/data.jsx` (converted from `data.jsx`)

Only change: remove `window.PORTFOLIO = PORTFOLIO;`, add `export`.

- [ ] **Step 1: Copy file to src/**

```bash
cp data.jsx src/data.jsx
```

- [ ] **Step 2: In src/data.jsx, replace the last line**

Find (line 244):
```js
window.PORTFOLIO = PORTFOLIO;
```

Replace with:
```js
export { PORTFOLIO };
```

Also remove line 2 comment `// Exposed on window.PORTFOLIO` (optional cleanup).

- [ ] **Step 3: Commit**

```bash
git add src/data.jsx
git commit -m "build: convert data.jsx to ES module"
```

---

## Task 6: Convert src/tweaks-panel.jsx

**Files:**
- Create: `src/tweaks-panel.jsx` (converted from `tweaks-panel.jsx`)

Changes: add React imports at top, replace all `React.*` calls with direct names, replace `Object.assign(window, {...})` with named exports.

- [ ] **Step 1: Copy file to src/**

```bash
cp tweaks-panel.jsx src/tweaks-panel.jsx
```

- [ ] **Step 2: Add import at the top of src/tweaks-panel.jsx** (before the `__TWEAKS_STYLE` const)

```js
import { useState, useCallback, useEffect, useRef } from 'react';
```

- [ ] **Step 3: Replace all React.* references in src/tweaks-panel.jsx**

These replacements are global (replace all occurrences):

| Find | Replace |
|------|---------|
| `React.useState` | `useState` |
| `React.useCallback` | `useCallback` |
| `React.useEffect` | `useEffect` |
| `React.useRef` | `useRef` |

Run a quick check after:
```bash
grep -n "React\." src/tweaks-panel.jsx
```
Expected: no matches.

- [ ] **Step 4: Replace the last block** — find:

```js
Object.assign(window, {
  useTweaks, TweaksPanel, TweakSection, TweakRow,
  TweakSlider, TweakToggle, TweakRadio, TweakSelect,
  TweakText, TweakNumber, TweakColor, TweakButton,
});
```

Replace with:
```js
export {
  useTweaks, TweaksPanel, TweakSection, TweakRow,
  TweakSlider, TweakToggle, TweakRadio, TweakSelect,
  TweakText, TweakNumber, TweakColor, TweakButton,
};
```

- [ ] **Step 5: Commit**

```bash
git add src/tweaks-panel.jsx
git commit -m "build: convert tweaks-panel.jsx to ES module"
```

---

## Task 7: Write src/engine.jsx (Reveal + framer animations)

**Files:**
- Create: `src/engine.jsx`

This is the major rewrite. The `__revealWatchers` scroll system and `useInView` are deleted entirely. `Reveal` is rebuilt with framer-motion. `BrushDivider` and `SealStamp` gain framer animations. `SumiInkCursorTrail` and `ScrollProgress` are copied unchanged.

- [ ] **Step 1: Copy file to src/**

```bash
cp engine.jsx src/engine.jsx
```

- [ ] **Step 2: Replace the top of src/engine.jsx**

Find (lines 1–3):
```js
// engine.jsx — brush trail + scroll-reveal primitives
// Exports to window: SumiInkCursorTrail, Reveal, useInView, ScrollProgress, VerticalText, SealStamp, BrushDivider
const { useRef, useEffect, useState, useLayoutEffect } = React;
```

Replace with:
```js
// engine.jsx — brush trail + scroll-reveal primitives
import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
```

- [ ] **Step 3: Delete the reveal manager block**

Delete everything from line 5 through the end of the `(function() {...})()` IIFE — that is, delete:
- The `__revealWatchers` Set
- `__revealTick` function
- `__revealSchedule` function
- The `if (typeof window !== "undefined" && !window.__revealBound)` block
- The `(function () { ... })()` rAF no-anim detection IIFE
- The `useInView` function
- The old `Reveal` component

In the original file that is lines 5–71. After deletion, the file jumps from the import lines directly to `/* ---------- VerticalText (tategaki) ---------- */`.

- [ ] **Step 4: Insert the new Reveal component** — paste this block immediately after the imports (before the VerticalText comment):

```jsx
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
  const dur = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue("--reveal-dur")
  ) / 1000 || 0.9;

  const builtVariants = {
    ...REVEAL_VARIANTS[variant],
    visible: {
      ...REVEAL_VARIANTS[variant].visible,
      transition: { duration: dur, delay: delay / 1000, ease: [0.25, 0.1, 0.25, 1] },
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
```

Note on transitions: the `visible` variant embeds its own transition (ease curve, delay), so it overrides the component-level `transition` prop. The component-level `transition` (spring) is used only for `whileHover`. This gives scroll reveals a smooth ease and card hovers a snappy spring.

- [ ] **Step 5: Update SealStamp**

Find the existing `SealStamp` function and replace it:

```jsx
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
```

- [ ] **Step 6: Update BrushDivider with motion.path**

Find the existing `BrushDivider` function and replace it:

```jsx
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
```

- [ ] **Step 7: Replace the last line** (window exports → named exports)

Find:
```js
Object.assign(window, { SumiInkCursorTrail, Reveal, useInView, ScrollProgress, VerticalText, SealStamp, BrushDivider });
```

Replace with:
```js
export { SumiInkCursorTrail, Reveal, ScrollProgress, VerticalText, SealStamp, BrushDivider };
```

Note: `useInView` is removed from exports (it no longer exists).

- [ ] **Step 8: Verify no remaining window globals or React globals**

```bash
grep -n "window\.\|Object\.assign\|const {.*} = React" src/engine.jsx
```

Expected: no matches.

- [ ] **Step 9: Commit**

```bash
git add src/engine.jsx
git commit -m "feat: replace Reveal with framer-motion, add BrushDivider/SealStamp animations"
```

---

## Task 8: Convert src/sections.jsx

**Files:**
- Create: `src/sections.jsx` (converted from `sections.jsx`)

Changes: add imports, remove `React.useState` destructure, add `whileHover` to `ProjectCard` and service cards, replace window exports with named exports.

- [ ] **Step 1: Copy file to src/**

```bash
cp sections.jsx src/sections.jsx
```

- [ ] **Step 2: Replace the first two lines of src/sections.jsx**

Find:
```js
// sections.jsx — all page sections for the kakejiku portfolio
const { useState: useS } = React;
```

Replace with:
```js
// sections.jsx — all page sections for the kakejiku portfolio
import { useState as useS } from 'react';
import { Reveal, VerticalText, SealStamp, BrushDivider } from './engine';
```

- [ ] **Step 3: Add whileHover to ProjectCard**

Find in `ProjectCard`:
```jsx
<Reveal variant="up" delay={i * 80} className="proj-card">
```

Replace with:
```jsx
<Reveal variant="up" delay={i * 80} className="proj-card" whileHover={{ y: -5 }}>
```

- [ ] **Step 4: Add whileHover to service cards**

Find in `Services`:
```jsx
<Reveal key={i} variant="up" delay={i * 70} className="svc">
```

Replace with:
```jsx
<Reveal key={i} variant="up" delay={i * 70} className="svc" whileHover={{ x: 4 }}>
```

- [ ] **Step 5: Replace the last line**

Find:
```js
Object.assign(window, { Hero, About, Stack, Work, Services, Contact, SectionHead, ProjectTimeline });
```

Replace with:
```js
export { Hero, About, Stack, Work, Services, Contact, SectionHead, ProjectTimeline };
```

- [ ] **Step 6: Verify**

```bash
grep -n "window\.\|Object\.assign\|React\." src/sections.jsx
```

Expected: no matches.

- [ ] **Step 7: Commit**

```bash
git add src/sections.jsx
git commit -m "build: convert sections.jsx to ES module, add card hover animations"
```

---

## Task 9: Convert src/app.jsx + create src/main.jsx

**Files:**
- Create: `src/app.jsx` (converted from `app.jsx`)
- Create: `src/main.jsx`

- [ ] **Step 1: Copy app.jsx to src/**

```bash
cp app.jsx src/app.jsx
```

- [ ] **Step 2: Replace the first two lines of src/app.jsx**

Find:
```js
// app.jsx — assembly, theme vars, language + tweaks
const { useState: useState_, useEffect: useEffect_ } = React;
```

Replace with:
```js
// app.jsx — assembly, theme vars, language + tweaks
import { useState as useState_, useEffect as useEffect_ } from 'react';
import { PORTFOLIO } from './data';
import { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakColor, TweakSelect, TweakSlider } from './tweaks-panel';
import { SumiInkCursorTrail, SealStamp } from './engine';
import { Hero, About, Stack, Work, Services, Contact, ProjectTimeline } from './sections';
```

- [ ] **Step 3: Update the PORTFOLIO reference in src/app.jsx**

Find (inside the `App` function):
```js
const P = window.PORTFOLIO;
```

Replace with:
```js
const P = PORTFOLIO;
```

- [ ] **Step 4: Remove the ReactDOM call at the bottom of src/app.jsx**

Find (last line):
```js
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
```

Delete that line entirely.

- [ ] **Step 5: Add export to App and TopBar**

Find:
```js
function TopBar({ P, t, lang, setLang }) {
```
Add `export` — no, actually only `App` needs to be exported. Simpler: add a named export at the bottom of the file:

```js
export { App };
```

- [ ] **Step 6: Create src/main.jsx**

```jsx
import ReactDOM from 'react-dom/client';
import { App } from './app';

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
```

Note: no CSS import here — CSS is imported in `src/app.jsx`. Actually, move it to main.jsx for clarity:

**In src/main.jsx:**
```jsx
import ReactDOM from 'react-dom/client';
import './styles/main.css';
import { App } from './app';

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
```

- [ ] **Step 7: Verify no remaining globals in src/app.jsx**

```bash
grep -n "window\.\|ReactDOM\|Object\.assign\|const {.*} = React" src/app.jsx
```

Expected: no matches.

- [ ] **Step 8: Commit**

```bash
git add src/app.jsx src/main.jsx
git commit -m "build: convert app.jsx to ES module, add main.jsx entry"
```

---

## Task 10: Run dev server + verify visually

**Files:** none (verification only)

- [ ] **Step 1: Start dev server**

```bash
pnpm dev
```

Expected output:
```
  VITE vX.X.X  ready in Xms

  ➜  Local:   http://localhost:5173/
```

- [ ] **Step 2: Open http://localhost:5173/ in browser**

Check all of the following — each item is a pass/fail:

| Check | Expected |
|-------|----------|
| Page loads without blank screen | ✓ |
| Hero section renders with kanji column | ✓ |
| TopBar visible, links work (scroll to section) | ✓ |
| Scroll down — elements animate in | ✓ (Reveal works) |
| BrushDividers draw themselves as they enter view | ✓ (pathLength 0→1) |
| SealStamp stamps in with scale+rotate spring | ✓ |
| Hover over a project card — card lifts `y: -5` | ✓ |
| Hover over a service card — card shifts `x: 4` | ✓ |
| Light/dark mode toggle works | ✓ |
| Tweaks panel opens (send `__activate_edit_mode` via console or find the trigger) | ✓ |
| animSpeed tweak changes reveal speed | ✓ (CSS var read by Reveal) |
| Console: zero errors | ✓ |

- [ ] **Step 3: If any check fails, debug before continuing**

Common issues:
- `motion[as]` undefined → `as` prop value is not a valid HTML element name in framer-motion. Check which `as` values are used in sections.jsx (`div`, `li`, `header` — all valid).
- CSS not loading → verify `src/styles/main.css` import in `src/main.jsx`.
- `PORTFOLIO` undefined → verify `export { PORTFOLIO }` in `src/data.jsx` and `import { PORTFOLIO }` in `src/app.jsx`.
- Tweaks panel invisible → verify all tweaks exports are present in `src/tweaks-panel.jsx` exports block.

---

## Task 11: Production build + preview

**Files:** none (verification only)

- [ ] **Step 1: Build**

```bash
pnpm build
```

Expected: `dist/` directory created, output ends with something like:
```
dist/index.html         X kB
dist/assets/index-*.js  XXX kB │ gzip: XX kB
dist/assets/index-*.css X kB
```

No errors. Warnings about chunk size are OK.

- [ ] **Step 2: Preview**

```bash
pnpm preview
```

Open http://localhost:4173/ and repeat the checks from Task 10 Step 2.

- [ ] **Step 3: Commit**

```bash
git add dist/ -f   # only if you want to commit dist; skip if deploying via CI
git commit -m "build: verify production build passes"
```

Actually, skip committing `dist/` — add it to `.gitignore` instead:

```bash
echo "dist/" >> .gitignore
git add .gitignore
git commit -m "build: add dist/ to gitignore"
```

---

## Task 12: Cleanup old root-level files

Do this only after Task 10 passed all checks.

- [ ] **Step 1: Remove old root-level .jsx files**

```bash
git rm app.jsx data.jsx engine.jsx sections.jsx tweaks-panel.jsx
git commit -m "build: remove old root-level jsx files (moved to src/)"
```

- [ ] **Step 2: Rename HTML backup**

```bash
git mv "Portfolio Ethan.html" "Portfolio Ethan.html.bak"
git commit -m "build: keep old html as .bak"
```

Or delete it entirely if you're confident:

```bash
git rm "Portfolio Ethan.html"
git commit -m "build: remove old no-bundler html (replaced by index.html + vite)"
```

---

## Self-Review Notes

- `motion[as]` with `as="li"` → `motion.li` ✓ (framer-motion exports all HTML elements)
- `useLayoutEffect` was imported in old engine.jsx but never used — not included in new imports ✓
- `useS` (useState) in sections.jsx — checked: unused in current code, imported for completeness ✓
- `SealStamp` uses `motion.span` — `motion.span` exists in framer-motion ✓
- CSS var `--reveal-dur` is set in `app.jsx` `useEffect_` on mount and on every tweak change — `Reveal` reads it on each render, so elements not yet in view will pick up new duration ✓
- `BrushDivider` `opacity` starts at `0` and animates to `0.55` via framer (not CSS `opacity: 0.55` inline) — old CSS `opacity="0.55"` attribute removed from `<path>` and moved to framer ✓
- `ScrollProgress` unchanged — still uses rAF, no framer needed ✓
- `SumiInkCursorTrail` unchanged — canvas/rAF, no framer needed ✓
