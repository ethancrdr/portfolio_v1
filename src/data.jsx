// data.jsx — bilingual content for the kakejiku portfolio
// Exposed on window.PORTFOLIO

const PORTFOLIO = {
  name: "Ethan Mejía Cordero",
  kanji: "恵丹",            // ateji ~ "Etan": 恵 grace · 丹 cinnabar-red (echoes the seal)
  katakana: "エイタン・メヒア",
  seal: "恵",               // single glyph for the red hanko
  links: {
    github: "https://github.com/ethancrdr",
    linkedin: "https://www.linkedin.com/in/ethan-cordero-24415a282/",
    email: "ethan@ethancrdr.dev", // PLACEHOLDER — confirm real address
  },

  es: {
    role: "Full Stack Developer",
    tagline: "Aplicaciones web, móviles e infraestructura cloud.",
    scrollCue: "desliza para desplegar",

    nav: { about: "Sobre mí", stack: "Stack", work: "Proyectos", services: "Servicios", contact: "Contacto" },

    about: {
      kicker: "紹介",
      title: "Sobre mí",
      lead: "Full Stack Developer enfocado en aplicaciones web, móviles e infraestructura cloud.",
      body: "Trabajo principalmente con React, React Native, Node.js y Python, además de herramientas de DevOps como Docker, Nginx y GitHub Actions. Construyo desde la interfaz hasta el despliegue, cuidando que cada sistema sea rápido, seguro y mantenible.",
      photoCaption: "Ethan Mejía Cordero",
      expKicker: "経歴",
      expTitle: "He trabajado en",
      areas: [
        { kanji: "安全", es: "Ciberseguridad" },
        { kanji: "計測", es: "Telemetría" },
        { kanji: "市場", es: "Marketplaces" },
        { kanji: "携帯", es: "Aplicaciones móviles" },
        { kanji: "即時", es: "Dashboards en tiempo real" },
        { kanji: "分散", es: "Sistemas distribuidos" },
      ],
    },

    stack: {
      kicker: "技術",
      title: "Stack de tecnologías",
      groups: [
        { kanji: "前", label: "Frontend", items: ["React", "Next.js", "React Native", "Expo"] },
        { kanji: "後", label: "Backend", items: ["Node.js", "Express", "Python"] },
        { kanji: "庫", label: "Datos", items: ["MongoDB", "Firebase"] },
        { kanji: "構", label: "DevOps", items: ["Docker", "Nginx", "GitHub Actions"] },
        { kanji: "雲", label: "Cloud", items: ["Cloudflare", "Railway", "Render"] },
        { kanji: "網", label: "Red", items: ["Tailscale"] },
      ],
    },

    work: {
      kicker: "作品",
      title: "Proyectos destacados",
      featuredLabel: "Proyecto principal",
      visit: "Visitar",
      projects: [
        {
          num: "壱", featured: true, name: "SafeLock",
          tag: "Seguridad · Infraestructura",
          desc: "Plataforma de seguridad y monitoreo con telemetría, OTA updates, dashboards en tiempo real e infraestructura multi-cloud.",
          stack: ["React", "Node.js", "Telemetría", "OTA", "Multi-cloud"],
          link: null, slot: "safelock",
        },
        {
          num: "弐", name: "CareConnect",
          tag: "Marketplace móvil",
          desc: "Marketplace móvil para servicios de salud a domicilio con chat, agendamiento y notificaciones.",
          stack: ["React Native", "Chat", "Notificaciones"],
          link: null, slot: "careconnect",
        },
        {
          num: "参", name: "OpenLock Security",
          tag: "Ciberseguridad · Producción",
          desc: "Contribuciones frontend y backend para una plataforma de ciberseguridad en producción.",
          stack: ["Frontend", "Backend", "Seguridad"],
          link: "https://openlocksecurity.com/", slot: "openlock",
        },
        {
          num: "肆", name: "OpenLock — Landing",
          tag: "Landing comercial",
          desc: "Landing page enfocada en captación de clientes y presentación comercial para OpenLock Security.",
          stack: ["Next.js", "Cloudflare", "SEO"],
          link: "https://direct-connection-hub.ethancrdr.workers.dev/", slot: "openlock-landing",
        },
        {
          num: "伍", name: "Jaco Jungle Tours",
          tag: "Turismo · SEO",
          desc: "Sitio web turístico enfocado en SEO y experiencia para usuarios internacionales.",
          stack: ["Web", "SEO", "i18n"],
          link: "https://jacojungletours.com/", slot: "jaco",
        },
      ],
    },

    services: {
      kicker: "提供",
      title: "Lo que puedo hacer",
      items: [
        { kanji: "網", title: "Aplicaciones web", desc: "Plataformas y SPAs con React / Next.js, listas para escalar." },
        { kanji: "携帯", title: "Apps móviles", desc: "Aplicaciones nativas multiplataforma con React Native y Expo." },
        { kanji: "雲", title: "Cloud & DevOps", desc: "Contenedores, CI/CD e infraestructura multi-cloud confiable." },
        { kanji: "即時", title: "Dashboards en tiempo real", desc: "Telemetría y visualización de datos en vivo." },
        { kanji: "守", title: "Sistemas de seguridad", desc: "Software con la ciberseguridad en el centro del diseño." },
        { kanji: "看板", title: "Landing pages & SEO", desc: "Sitios rápidos, optimizados y orientados a conversión." },
      ],
    },

    contact: {
      kicker: "連絡",
      title: "Trabajemos juntos",
      lead: "¿Tienes un proyecto en mente? Hablemos.",
      emailLabel: "Correo",
      sealNote: "Firmado en tinta",
    },

    footer: "Hecho a mano · estilo kakejiku 掛軸",

    timelineKicker: "歴史",
    timelineTitle: "Cronología",
    timeline: [
      { name: "Jaco Jungle Tours", tag: "Turismo · SEO", period: "Sep 2025 — Nov 2025", kanji: "旅", current: false },
      { name: "CareConnect", tag: "Marketplace móvil · Salud", period: "Oct 2025 — Feb 2026", kanji: "医", current: false },
      { name: "SafeLock · OpenLock Security", tag: "Seguridad · Infraestructura", period: "Ene 2026 — Actualidad", kanji: "守", current: true },
    ],
  },

  en: {
    role: "Full Stack Developer",
    tagline: "Web, mobile & cloud infrastructure.",
    scrollCue: "scroll to unroll",

    nav: { about: "About", stack: "Stack", work: "Work", services: "Services", contact: "Contact" },

    about: {
      kicker: "紹介",
      title: "About me",
      lead: "Full Stack Developer focused on web, mobile and cloud infrastructure.",
      body: "I work mainly with React, React Native, Node.js and Python, plus DevOps tooling like Docker, Nginx and GitHub Actions. I build from the interface down to deployment, keeping every system fast, secure and maintainable.",
      photoCaption: "Ethan Mejía Cordero",
      expKicker: "経歴",
      expTitle: "I have worked on",
      areas: [
        { kanji: "安全", es: "Cybersecurity" },
        { kanji: "計測", es: "Telemetry" },
        { kanji: "市場", es: "Marketplaces" },
        { kanji: "携帯", es: "Mobile apps" },
        { kanji: "即時", es: "Real-time dashboards" },
        { kanji: "分散", es: "Distributed systems" },
      ],
    },

    stack: {
      kicker: "技術",
      title: "Technology stack",
      groups: [
        { kanji: "前", label: "Frontend", items: ["React", "Next.js", "React Native", "Expo"] },
        { kanji: "後", label: "Backend", items: ["Node.js", "Express", "Python"] },
        { kanji: "庫", label: "Data", items: ["MongoDB", "Firebase"] },
        { kanji: "構", label: "DevOps", items: ["Docker", "Nginx", "GitHub Actions"] },
        { kanji: "雲", label: "Cloud", items: ["Cloudflare", "Railway", "Render"] },
        { kanji: "網", label: "Network", items: ["Tailscale"] },
      ],
    },

    work: {
      kicker: "作品",
      title: "Selected work",
      featuredLabel: "Flagship project",
      visit: "Visit",
      projects: [
        {
          num: "壱", featured: true, name: "SafeLock",
          tag: "Security · Infrastructure",
          desc: "Security & monitoring platform with telemetry, OTA updates, real-time dashboards and multi-cloud infrastructure.",
          stack: ["React", "Node.js", "Telemetry", "OTA", "Multi-cloud"],
          link: null, slot: "safelock",
        },
        {
          num: "弐", name: "CareConnect",
          tag: "Mobile marketplace",
          desc: "Mobile marketplace for at-home health services with chat, scheduling and notifications.",
          stack: ["React Native", "Chat", "Notifications"],
          link: null, slot: "careconnect",
        },
        {
          num: "参", name: "OpenLock Security",
          tag: "Cybersecurity · Production",
          desc: "Frontend and backend contributions to a cybersecurity platform running in production.",
          stack: ["Frontend", "Backend", "Security"],
          link: "https://openlocksecurity.com/", slot: "openlock",
        },
        {
          num: "肆", name: "OpenLock — Landing",
          tag: "Sales landing",
          desc: "Landing page focused on lead capture and commercial presentation for OpenLock Security.",
          stack: ["Next.js", "Cloudflare", "SEO"],
          link: "https://direct-connection-hub.ethancrdr.workers.dev/", slot: "openlock-landing",
        },
        {
          num: "伍", name: "Jaco Jungle Tours",
          tag: "Tourism · SEO",
          desc: "Tourism website focused on SEO and experience for international visitors.",
          stack: ["Web", "SEO", "i18n"],
          link: "https://jacojungletours.com/", slot: "jaco",
        },
      ],
    },

    services: {
      kicker: "提供",
      title: "What I can build",
      items: [
        { kanji: "網", title: "Web applications", desc: "Platforms and SPAs with React / Next.js, ready to scale." },
        { kanji: "携帯", title: "Mobile apps", desc: "Cross-platform native apps with React Native and Expo." },
        { kanji: "雲", title: "Cloud & DevOps", desc: "Containers, CI/CD and reliable multi-cloud infrastructure." },
        { kanji: "即時", title: "Real-time dashboards", desc: "Telemetry and live data visualization." },
        { kanji: "守", title: "Security systems", desc: "Software with cybersecurity at the center of the design." },
        { kanji: "看板", title: "Landing pages & SEO", desc: "Fast, optimized, conversion-driven sites." },
      ],
    },

    contact: {
      kicker: "連絡",
      title: "Let's work together",
      lead: "Have a project in mind? Let's talk.",
      emailLabel: "Email",
      sealNote: "Signed in ink",
    },

    footer: "Handcrafted · kakejiku style 掛軸",

    timelineKicker: "歴史",
    timelineTitle: "Timeline",
    timeline: [
      { name: "Jaco Jungle Tours", tag: "Tourism · SEO", period: "Sep 2025 — Nov 2025", kanji: "旅", current: false },
      { name: "CareConnect", tag: "Mobile marketplace · Healthcare", period: "Oct 2025 — Feb 2026", kanji: "医", current: false },
      { name: "SafeLock · OpenLock Security", tag: "Security · Infrastructure", period: "Jan 2026 — Present", kanji: "守", current: true },
    ],
  },
};

export { PORTFOLIO };
