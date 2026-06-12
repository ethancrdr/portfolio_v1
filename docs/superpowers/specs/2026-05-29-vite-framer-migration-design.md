# Vite + Framer Motion Migration Design

**Date:** 2026-05-29
**Status:** Approved

## Context

Portfolio currently runs as a no-bundler browser app: React 18 + Babel Standalone via CDN, all JSX files loaded as `type="text/babel"`. `framer-motion` v12 is installed in `node_modules` but unreachable without a bundler. Goal: migrate to Vite so framer-motion can be used, deploy-ready.

## Decisions

- **Reveal strategy:** Replace custom `Reveal` + `useInView` with framer-motion `whileInView`. Same public API — `sections.jsx` untouched.
- **Build:** Dev server + production build (`vite build`), ready for Netlify/Vercel deploy.
- **Structure:** Reorganize into `src/` (Vite standard).

## File Structure

```
(root)
├── index.html                  ← minimal shell: head/fonts + <div id="root"> + module script
├── vite.config.js
├── package.json                ← updated scripts + react/react-dom as deps
└── src/
    ├── main.jsx                ← ReactDOM.createRoot (split from app.jsx)
    ├── app.jsx                 ← App + TopBar, imports instead of globals
    ├── data.jsx                ← PORTFOLIO export (was window.PORTFOLIO global)
    ├── engine.jsx              ← Reveal (framer) + SumiInkCursorTrail + primitives
    ├── sections.jsx            ← unchanged
    ├── tweaks-panel.jsx        ← unchanged
    └── styles/
        └── main.css            ← all CSS extracted from Portfolio Ethan.html
```

`Portfolio Ethan.html` kept as backup until verified, then deleted.

## Vite Config

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist' }
})
```

## package.json

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

## Reveal Component (engine.jsx)

Identical props API. Internals replaced with framer-motion.

```jsx
import { motion } from "framer-motion";

const VARIANTS = {
  up:    { hidden: { opacity: 0, y: 28 },            visible: { opacity: 1, y: 0 } },
  fade:  { hidden: { opacity: 0 },                   visible: { opacity: 1 } },
  right: { hidden: { opacity: 0, x: -24 },           visible: { opacity: 1, x: 0 } },
  left:  { hidden: { opacity: 0, x: 24 },            visible: { opacity: 1, x: 0 } },
  clip:  { hidden: { clipPath: "inset(0 0 100% 0)" }, visible: { clipPath: "inset(0 0 0% 0)" } },
  scale: { hidden: { opacity: 0, scale: 0.88 },      visible: { opacity: 1, scale: 1 } },
};

function Reveal({ children, variant="up", delay=0, as="div", className="", style={} }) {
  const Tag = motion[as] ?? motion.div;
  const dur = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue("--reveal-dur")
  ) / 1000 || 0.9;

  return (
    <Tag
      className={className} style={style}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-8% 0px" }}
      variants={VARIANTS[variant]}
      transition={{ duration: dur, delay: delay / 1000, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </Tag>
  );
}
```

`animSpeed` tweak in `app.jsx` sets `--reveal-dur` CSS var → Reveal reads it on each render → framer picks up new `duration`. Animations already played (once: true) are not affected — correct behavior.

## Additional Framer Animations

### BrushDivider — draw-on effect
`motion.path` with `pathLength` animating from 0 → 1 on `whileInView`:
```jsx
<motion.path
  initial={{ pathLength: 0, opacity: 0 }}
  whileInView={{ pathLength: 1, opacity: 0.55 }}
  viewport={{ once: true }}
  transition={{ duration: 1.1, ease: "easeOut" }}
/>
```

### SealStamp — hanko stamp effect
```jsx
initial={{ scale: 0, rotate: -20, opacity: 0 }}
whileInView={{ scale: 1, rotate: 0, opacity: 1 }}
whileHover={{ scale: 1.06, rotate: 3 }}
transition={{ type: "spring", stiffness: 260, damping: 18 }}
```

### ProjectCard + ServiceCard — physical hover
```jsx
whileHover={{ y: -5 }}
transition={{ type: "spring", stiffness: 400, damping: 22 }}
```

## Global → Module Conversions

| File | Before | After |
|------|--------|-------|
| `data.jsx` | `window.PORTFOLIO = {...}` | `export const PORTFOLIO = {...}` |
| `engine.jsx` | `Object.assign(window, { Reveal, ... })` | named exports |
| `sections.jsx` | `Object.assign(window, { Hero, ... })` | named exports |
| `tweaks-panel.jsx` | globals | named exports |
| `app.jsx` | `window.PORTFOLIO` reads | `import { PORTFOLIO }` |

## What Gets Deleted

From `engine.jsx`:
- `__revealWatchers` Set
- `__revealTick`, `__revealSchedule` functions
- `useInView` hook
- Old `Reveal` component (CSS data-attr based)
- rAF no-anim fallback detection
- `window.__revealBound` guard

From HTML → gone entirely:
- CDN scripts for React, ReactDOM, Babel Standalone
- Inline `<style>` block (→ `src/styles/main.css`)
- `<script type="text/babel">` tags

## Unchanged

- `SumiInkCursorTrail` — canvas/rAF, no framer needed
- `ScrollProgress` — rAF scroll tracker, no framer needed
- `VerticalText`, `BrushDivider` structure, `SealStamp` structure
- All of `sections.jsx`, `data.jsx`, `tweaks-panel.jsx` logic
