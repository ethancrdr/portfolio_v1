// app.jsx — assembly, theme vars, language + tweaks
import { useState as useState_, useEffect as useEffect_ } from 'react';
import { PORTFOLIO } from './data';
import { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakColor, TweakSelect, TweakSlider } from './tweaks-panel';
import { SumiInkCursorTrail, SealStamp, BrushDivider } from './engine';
import { Hero, About, Stack, Work, Services, Contact, ProjectTimeline } from './sections';

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mode": "light",
  "sealColor": "#a8332a",
  "displayFont": "Shippori Mincho",
  "animSpeed": 1,
  "heroVariant": "A"
} /*EDITMODE-END*/;

const THEMES = {
  light: { washi: "#ece5d6", ink: "#1a1714", wash: "#5d564a", silk: "#cdbfa3", line: "rgba(26,23,20,.16)", paperEdge: "rgba(26,23,20,.10)", brocade: "rgb(182,135,42)" },
  dark:  { washi: "#16120d", ink: "#e9e3d5", wash: "#9a9281", silk: "#0e0b08", line: "rgba(233,227,213,.16)", paperEdge: "rgba(0,0,0,.40)",  brocade: "#1a1007" }
};

function TopBar({ P, t, lang, setLang }) {
  const [solid, setSolid] = useState_(false);
  useEffect_(() => {
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.7);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const items = [
  ["about", t.nav.about], ["stack", t.nav.stack], ["work", t.nav.work],
  ["services", t.nav.services], ["contact", t.nav.contact]];

  return (
    <div className={"topbar" + (solid ? " topbar--solid" : "")}>
      <a className="topbar__brand" href="#top">
        <SealStamp glyph={P.seal} size={26} />
        <span className="topbar__brand-name">{P.name}</span>
      </a>
      <nav className="topbar__nav">
        {items.map(([id, label]) =>
        <a key={id} href={"#" + id}>{label}</a>
        )}
      </nav>
      <div className="lang-toggle" role="group" aria-label="language">
        <button className={lang === "es" ? "on" : ""} onClick={() => setLang("es")}>ES</button>
        <span className="lang-toggle__sep">·</span>
        <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
      </div>
    </div>);

}

function App() {
  const [tw, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [lang, setLang] = useState_(() => localStorage.getItem("km_lang") || "es");
  useEffect_(() => {localStorage.setItem("km_lang", lang);}, [lang]);

  const P = PORTFOLIO;
  const t = P[lang];
  const theme = THEMES[tw.mode] || THEMES.light;

  // apply theme vars to :root
  useEffect_(() => {
    const r = document.documentElement.style;
    r.setProperty("--washi", theme.washi);
    r.setProperty("--ink", theme.ink);
    r.setProperty("--wash", theme.wash);
    r.setProperty("--silk", theme.silk);
    r.setProperty("--line", theme.line);
    r.setProperty("--paper-edge", theme.paperEdge);
    r.setProperty("--brocade", theme.brocade);
    r.setProperty("--seal", tw.sealColor);
    r.setProperty("--font-display", `"${tw.displayFont}", serif`);
    const dur = Math.round(900 / Math.max(0.4, tw.animSpeed));
    r.setProperty("--reveal-dur", dur + "ms");
    document.body.classList.toggle("is-dark", tw.mode === "dark");
  }, [theme, tw.sealColor, tw.displayFont, tw.animSpeed, tw.mode]);

  return (
    <div id="top" className="scroll-root">
      <SumiInkCursorTrail inkColor={theme.ink} />
      <TopBar P={P} t={t} lang={lang} setLang={setLang} />

      <div className="roller roller--top" aria-hidden="true"><i /><i /></div>

      <main className="paper">
        <Hero P={P} t={t} variant={tw.heroVariant} />
        <About P={P} t={t} />
        <ProjectTimeline t={t} />
        <Work t={t} />
        <Stack t={t} />
        <Services t={t} />
        <Contact P={P} t={t} />
        <footer className="footer">
          <BrushDivider length={120} style={{ opacity: .5 }} />
          <p>{t.footer}</p>
          <p className="footer__sig">{"\n"}</p>
        </footer>
      </main>

      <div className="roller roller--bottom" aria-hidden="true"><i /><i /></div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Pergamino" />
        <TweakRadio label="Modo" value={tw.mode} options={["light", "dark"]}
        onChange={(v) => setTweak("mode", v)} />
        <TweakColor label="Sello / acento" value={tw.sealColor}
        options={["#a8332a", "#2f3a52", "#b6884a", "#1a1714"]}
        onChange={(v) => setTweak("sealColor", v)} />
        <TweakSelect label="Tipografía" value={tw.displayFont}
        options={["Shippori Mincho", "Yuji Syuku", "Zen Old Mincho"]}
        onChange={(v) => setTweak("displayFont", v)} />

        <TweakSection label="Movimiento" />
        <TweakRadio label="Hero" value={tw.heroVariant} options={["A", "B"]}
        onChange={(v) => setTweak("heroVariant", v)} />
        <TweakSlider label="Velocidad scroll" value={tw.animSpeed} min={0.5} max={1.6} step={0.1}
        onChange={(v) => setTweak("animSpeed", v)} />
      </TweaksPanel>
    </div>);

}

export { App };