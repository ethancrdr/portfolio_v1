// sections.jsx — all page sections for the kakejiku portfolio
import { useState as useS } from 'react';
import { Reveal, VerticalText, SealStamp, BrushDivider } from './engine';

/* ---------- shared bits ---------- */
function Placeholder({ label, ratio = "3 / 4", className = "", style = {} }) {
  return (
    <div className={"ph " + className} style={{ aspectRatio: ratio, ...style }}>
      <div className="ph__stripes" />
      <span className="ph__label">{label}</span>
    </div>);

}

function SectionHead({ kicker, title, id }) {
  return (
    <div className="sec-head" id={id}>
      <Reveal variant="right" className="sec-head__kicker">
        <VerticalText style={{ fontFamily: "var(--font-display)" }}>{kicker}</VerticalText>
      </Reveal>
      <div className="sec-head__main">
        <Reveal variant="clip">
          <BrushDivider length={64} style={{ display: "block", marginBottom: "0.6rem" }} />
        </Reveal>
        <Reveal variant="up" delay={80}>
          <h2 className="sec-title">{title}</h2>
        </Reveal>
      </div>
    </div>);

}

function Chip({ children }) {
  return <span className="chip">{children}</span>;
}

/* ---------- HERO ---------- */
function Hero({ P, t, variant }) {
  if (variant === "B") {
    return (
      <header className="hero hero--b" data-screen-label="hero">
        <VerticalText className="hero-b__kanji" aria-hidden="true">{P.kanji}</VerticalText>
        <div className="hero-b__center">
          <Reveal variant="fade" delay={120}>
            <p className="hero__role">{t.role}</p>
          </Reveal>
          <Reveal variant="up" delay={220}>
            <h1 className="hero__name hero__name--center">{P.name}</h1>
          </Reveal>
          <Reveal variant="clip" delay={420}>
            <BrushDivider length={220} style={{ margin: "1.1rem auto" }} />
          </Reveal>
          <Reveal variant="fade" delay={560}>
            <p className="hero__tagline">{t.tagline}</p>
          </Reveal>
          <Reveal variant="fade" delay={760}>
            <SealStamp glyph={P.seal} size={62} className="hero-b__seal" />
          </Reveal>
        </div>
        <ScrollCue label={t.scrollCue} />
      </header>);

  }
  // Variant A — split: latin name on the left, vertical kanji column on the right
  return (
    <header className="hero hero--a" data-screen-label="hero" style={{ opacity: "1" }}>
      <div className="hero-a__text">
        <Reveal variant="fade" delay={100}>
          <p className="hero__role">{t.role}</p>
        </Reveal>
        <Reveal variant="up" delay={200}>
          <h1 className="hero__name">{P.name}</h1>
        </Reveal>
        <Reveal variant="clip" delay={420}>
          <BrushDivider length={260} style={{ margin: "1.2rem 0" }} />
        </Reveal>
        <Reveal variant="fade" delay={520}>
          <p className="hero__tagline" style={{ fontFamily: "\"Zen Kaku Gothic New\"" }}>{t.tagline}</p>
        </Reveal>
      </div>

      <div className="hero-a__column">
        <Reveal variant="right" delay={240} className="hero-a__kanji-wrap">
          <VerticalText className="hero-a__kanji">{P.kanji}</VerticalText>
        </Reveal>
        <Reveal variant="fade" delay={620} className="hero-a__kata-wrap">
          <VerticalText className="hero-a__kata">{P.katakana}</VerticalText>
        </Reveal>
        <Reveal variant="scale" delay={780}>
          <SealStamp glyph={P.seal} size={58} className="hero-a__seal" />
        </Reveal>
      </div>

      <ScrollCue label={t.scrollCue} />
    </header>);

}

function ScrollCue({ label }) {
  return (
    <div className="scroll-cue" aria-hidden="true">
      <VerticalText className="scroll-cue__txt">{label}</VerticalText>
      <span className="scroll-cue__line" />
    </div>);

}

/* ---------- ABOUT ---------- */
function About({ P, t }) {
  return (
    <section className="section about" data-screen-label="about">
      <SectionHead kicker={t.about.kicker} title={t.about.title} id="about" />
      <div className="about__grid">
        <Reveal variant="clip" delay={120} className="about__photo">
          <div className="photo-mount">
            <Placeholder label="[ tu retrato · 3:4 ]" />
            <span className="photo-mount__cap">{t.about.photoCaption}</span>
          </div>
        </Reveal>
        <div className="about__text">
          <Reveal variant="up">
            <p className="about__lead">{t.about.lead}</p>
          </Reveal>
          <Reveal variant="up" delay={120}>
            <p className="about__body">{t.about.body}</p>
          </Reveal>
        </div>
      </div>

      <div className="about__exp">
        <Reveal variant="right" className="about__exp-kicker">
          <VerticalText style={{ fontFamily: "var(--font-display)" }}>{t.about.expKicker}</VerticalText>
        </Reveal>
        <div className="about__exp-body">
          <Reveal variant="up"><h3 className="about__exp-title">{t.about.expTitle}</h3></Reveal>
          <div className="areas">
            {t.about.areas.map((a, i) =>
            <Reveal key={i} variant="up" delay={i * 70} className="area">
                <VerticalText className="area__kanji">{a.kanji}</VerticalText>
                <span className="area__label" style={{ width: "105px", fontSize: "15px" }}>{a.es}</span>
              </Reveal>
            )}
          </div>
        </div>
      </div>
    </section>);

}

/* ---------- STACK ---------- */
function Stack({ t }) {
  return (
    <section className="section stack" data-screen-label="stack">
      <SectionHead kicker={t.stack.kicker} title={t.stack.title} id="stack" />
      <div className="stack__grid">
        {t.stack.groups.map((g, i) =>
        <Reveal key={i} variant="up" delay={i * 80} className="stack-col">
            <div className="stack-col__head">
              <VerticalText className="stack-col__kanji">{g.kanji}</VerticalText>
              <span className="stack-col__label">{g.label}</span>
            </div>
            <BrushDivider length={90} style={{ opacity: 0.5, margin: "0.5rem 0 0.9rem" }} />
            <ul className="stack-col__items">
              {g.items.map((it) => <li key={it}>{it}</li>)}
            </ul>
          </Reveal>
        )}
      </div>
    </section>);

}

/* ---------- WORK ---------- */
function ProjectFeatured({ p, t }) {
  return (
    <Reveal variant="up" className="proj-featured">
      <div className="proj-featured__media">
        <Placeholder label="[ SafeLock · captura ]" ratio="16 / 11" />
        <VerticalText className="proj-featured__num" aria-hidden="true">{p.num}</VerticalText>
      </div>
      <div className="proj-featured__body">
        <span className="proj__flag">{t.work.featuredLabel}</span>
        <h3 className="proj-featured__name">{p.name}</h3>
        <p className="proj__tag">{p.tag}</p>
        <p className="proj-featured__desc">{p.desc}</p>
        <div className="proj__chips">{p.stack.map((s) => <Chip key={s}>{s}</Chip>)}</div>
      </div>
    </Reveal>);

}

function ProjectCard({ p, t, i }) {
  return (
    <Reveal variant="up" delay={i * 80} className="proj-card" whileHover={{ y: -5 }}>
      <div className="proj-card__top">
        <VerticalText className="proj-card__num" aria-hidden="true">{p.num}</VerticalText>
        <Placeholder label="[ captura ]" ratio="16 / 10" className="proj-card__media" />
      </div>
      <h3 className="proj-card__name">{p.name}</h3>
      <p className="proj__tag">{p.tag}</p>
      <p className="proj-card__desc">{p.desc}</p>
      <div className="proj__chips">{p.stack.map((s) => <Chip key={s}>{s}</Chip>)}</div>
      {p.link &&
      <a className="proj__link" href={p.link} target="_blank" rel="noopener noreferrer">
          {t.work.visit} <span aria-hidden="true">↗</span>
        </a>
      }
    </Reveal>);

}

function Work({ t }) {
  const featured = t.work.projects.find((p) => p.featured);
  const rest = t.work.projects.filter((p) => !p.featured);
  return (
    <section className="section work" data-screen-label="work">
      <SectionHead kicker={t.work.kicker} title={t.work.title} id="work" />
      <ProjectFeatured p={featured} t={t} />
      <div className="work__grid">
        {rest.map((p, i) => <ProjectCard key={p.name} p={p} t={t} i={i} />)}
      </div>
    </section>);

}

/* ---------- TIMELINE ---------- */
function ProjectTimeline({ t }) {
  return (
    <section className="section timeline-sec" data-screen-label="timeline">
      <SectionHead kicker={t.timelineKicker} title={t.timelineTitle} id="timeline" />
      <div className="tl-wrap">
        <div className="tl-line" aria-hidden="true" />
        {t.timeline.map((item, i) =>
        <Reveal key={i} variant="up" delay={i * 150} className={"tl-item" + (item.current ? " tl-item--current" : "")}>
            <div className="tl-dot-col">
              <div className="tl-dot" />
            </div>
            <div className="tl-content">
              <span className="tl-period">{item.period}</span>
              <h3 className="tl-name">{item.name}</h3>
              <span className="tl-tag">{item.tag}</span>
            </div>
          </Reveal>
        )}
      </div>
    </section>);

}

/* ---------- SERVICES ---------- */
function Services({ t }) {
  return (
    <section className="section services" data-screen-label="services">
      <SectionHead kicker={t.services.kicker} title={t.services.title} id="services" />
      <div className="services__grid">
        {t.services.items.map((s, i) =>
        <Reveal key={i} variant="up" delay={i * 70} className="svc" whileHover={{ x: 4 }}>
            <VerticalText className="svc__kanji">{s.kanji}</VerticalText>
            <div className="svc__body">
              <h3 className="svc__title">{s.title}</h3>
              <p className="svc__desc">{s.desc}</p>
            </div>
          </Reveal>
        )}
      </div>
    </section>);

}

/* ---------- CONTACT ---------- */
function Contact({ P, t }) {
  return (
    <section className="section contact" data-screen-label="contact">
      <SectionHead kicker={t.contact.kicker} title={t.contact.title} id="contact" />
      <div className="contact__inner">
        <div className="contact__left">
          <Reveal variant="up"><p className="contact__lead">{t.contact.lead}</p></Reveal>
          <ul className="contact__links">
            <Reveal as="li" variant="up" delay={80}>
              <a href={"mailto:" + P.links.email}>
                <span className="contact__k">{t.contact.emailLabel}</span>
                <span className="contact__v">{P.links.email}</span>
              </a>
            </Reveal>
            <Reveal as="li" variant="up" delay={160}>
              <a href={P.links.github} target="_blank" rel="noopener noreferrer">
                <span className="contact__k">GitHub</span>
                <span className="contact__v">github.com/ethancrdr ↗</span>
              </a>
            </Reveal>
            <Reveal as="li" variant="up" delay={240}>
              <a href={P.links.linkedin} target="_blank" rel="noopener noreferrer">
                <span className="contact__k">LinkedIn</span>
                <span className="contact__v">Ethan Cordero ↗</span>
              </a>
            </Reveal>
          </ul>
        </div>
        <Reveal variant="scale" delay={200} className="contact__seal-wrap">
          <SealStamp glyph={P.seal} size={120} />
          <span className="contact__seal-note">{t.contact.sealNote}</span>
        </Reveal>
      </div>
    </section>);

}

export { Hero, About, Stack, Work, Services, Contact, SectionHead, ProjectTimeline };