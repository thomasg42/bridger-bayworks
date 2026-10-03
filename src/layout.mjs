// Shared shell for every page: <head> SEO, header, footer, CTA band, icon sprite, JSON-LD helpers.
// Copy rule for anything a visitor reads: no em dashes, short sentences, every path leads to Max.

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function makeCtx(SITE, slug, opts = {}) {
  const base = SITE.url.replace(/\/$/, '');
  const depth = slug ? slug.split('/').filter(Boolean).length : 0;
  // 404.html is served at any missing path, so its links must be absolute.
  const root = opts.absolute ? `${base}/` : (depth ? '../'.repeat(depth) : './');
  const r = SITE.rates;
  const ctx = {
    SITE, slug, root, esc,
    abs: (path = '') => `${base}/${path}`,
    link: (s) => (s ? `${root}${s}/` : root),
    reserve: (params) => {
      const q = params ? '?' + new URLSearchParams(params).toString() : '';
      return `${root}reserve/${q}`;
    },
    tel: `tel:${SITE.phone.e164}`,
    sms: `sms:${SITE.phone.e164}`,
    asset: (p) => `${root}assets/${p}?v=${SITE.assetVersion}`,
    icon: (name, cls = 'ico') => `<svg class="${cls}" aria-hidden="true" focusable="false"><use href="#i-${name}"></use></svg>`,
    // Prices: one switch (SITE.showPrices) turns every price into "Ask Max".
    shows: SITE.showPrices,
    money: (n) => (n === 0 ? 'Free' : `$${n}`),
    price: (key, unit = '') => {
      if (!SITE.showPrices) return 'Ask Max';
      const n = r[key];
      return n === 0 ? 'Free' : `$${n}${unit}`;
    },
    // Count-up number: final value is in the HTML so crawlers and no-JS visitors see it.
    count: (key) => {
      const n = r[key];
      if (!SITE.showPrices) return 'Ask';
      if (n === 0) return 'Free';
      return `<span class="num" data-count="${n}" data-prefix="$">$${n}</span>`;
    },
  };
  return ctx;
}

// ---------- decorative SVG ----------

// Layered ridge + pine treeline, the brochure's footer motif. Deterministic so builds diff cleanly.
export function ridge(variant = 'light') {
  const W = 1440, H = 220;
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const tree = (x, h, w) => {
    const b = H, t = b - h, m = b - h * 0.48, n = b - h * 0.2;
    return `M${x} ${t}L${x + w * 0.42} ${m}L${x + w * 0.2} ${m}L${x + w * 0.55} ${n}L${x + w * 0.3} ${n}L${x + w * 0.62} ${b}L${x - w * 0.62} ${b}L${x - w * 0.3} ${n}L${x - w * 0.55} ${n}L${x - w * 0.2} ${m}L${x - w * 0.42} ${m}Z`;
  };
  let trees = '';
  for (let x = -10; x < W + 20; x += 18 + rnd() * 26) {
    const edge = Math.min(x, W - x) / W;           // taller at the edges, like the brochure
    const h = 46 + rnd() * 40 + (0.5 - edge) * 70;
    trees += tree(Math.round(x), Math.round(h), Math.round(h * 0.42));
  }
  const far = 'M0 150L120 104L210 132L330 70L420 118L540 84L640 128L760 58L880 112L990 80L1100 126L1220 66L1330 112L1440 92L1440 220L0 220Z';
  const mid = 'M0 176L150 120L250 160L380 96L470 150L600 110L720 164L860 92L960 150L1080 118L1200 166L1320 120L1440 150L1440 220L0 220Z';
  const snow = 'M330 70L312 82L322 80L330 88L338 79L348 84Z M760 58L740 72L752 70L760 78L768 69L780 74Z M1220 66L1202 78L1212 76L1220 84L1228 75L1238 80Z';
  const c = variant === 'dark'
    ? { far: '#2A3766', mid: '#22305C', snow: '#3B4A80', trees: '#141C33' }
    : { far: '#C9D3EE', mid: '#A9B9E3', snow: '#EEF1FA', trees: '#5B74BD' };
  return `<svg class="ridge" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false"><path fill="${c.far}" d="${far}"/><path fill="${c.snow}" d="${snow}"/><path fill="${c.mid}" d="${mid}"/><path fill="${c.trees}" d="${trees}"/></svg>`;
}

// Stand-in brand mark drawn from the flyer's peaks. Swap for Max's master logo when he sends it.
export const brandMark = `<svg class="brand-mark" viewBox="0 0 64 40" aria-hidden="true" focusable="false"><path fill="#5B74BD" d="M0 40L17 15L23 23L32 3L41 17L48 10L64 40Z"/><path fill="#FBFAF7" d="M32 3L26.5 14L30 11.5L32 15L34.5 11L37.5 13Z M48 10L44.5 16.5L47 15L48.5 17.5L50.5 15.5Z M17 15L13.6 20L16 19L17.6 21L19.4 19.6Z"/></svg>`;

// ---------- icon sprite (24x24 stroke icons) ----------

const sprite = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
<symbol id="i-lift" viewBox="0 0 24 24"><path d="M3 21V3M21 21V3M3 14h3.5M21 14h-3.5M6.5 13.5l1.7-3.8h7.6l1.7 3.8M6 13.5h12V17H6z"/><circle cx="8.5" cy="17.5" r="1.4"/><circle cx="15.5" cy="17.5" r="1.4"/></symbol>
<symbol id="i-wrench" viewBox="0 0 24 24"><path d="M14.7 6.3a4.2 4.2 0 0 0-5.6 5.4L3.4 17.4a1.6 1.6 0 0 0 0 2.3l.9.9a1.6 1.6 0 0 0 2.3 0l5.7-5.7a4.2 4.2 0 0 0 5.4-5.6l-2.6 2.6-2.3-.6-.6-2.3z"/></symbol>
<symbol id="i-engine" viewBox="0 0 24 24"><path d="M3 10v5M3 12.5h2M5 9h2.5V7H14v2h2l2 2h1.5V9H21v7h-1.5v-2H18l-2 3H8l-3-3z"/></symbol>
<symbol id="i-gear" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M21.2 12h-2.6M5.4 12H2.8M18.5 5.5l-1.8 1.8M7.3 16.7l-1.8 1.8M18.5 18.5l-1.8-1.8M7.3 7.3L5.5 5.5"/><circle cx="12" cy="12" r="6.6"/></symbol>
<symbol id="i-people" viewBox="0 0 24 24"><circle cx="12" cy="8" r="2.6"/><circle cx="5.5" cy="9.5" r="2"/><circle cx="18.5" cy="9.5" r="2"/><path d="M7.5 19v-1.5a4.5 4.5 0 0 1 9 0V19M2 19v-1a3.5 3.5 0 0 1 4.3-3.4M22 19v-1a3.5 3.5 0 0 0-4.3-3.4"/></symbol>
<symbol id="i-toolbox" viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="12" rx="1.5"/><path d="M9 8V5.5h6V8M3 12.5h18M10.5 12.5v2h3v-2"/></symbol>
<symbol id="i-impact" viewBox="0 0 24 24"><path d="M3 6.5h11.5a2 2 0 0 1 2 2V11a2 2 0 0 1-2 2H9.5l-1 7.5h-3l.5-7.5H3zM16.5 8.5H20M20 7.5v3M14 6.5V4.5"/></symbol>
<symbol id="i-door" viewBox="0 0 24 24"><path d="M2.5 9.5L12 4l9.5 5.5M4.5 9v11h15V9M7 12h10M7 14.5h10M7 17h10"/></symbol>
<symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></symbol>
<symbol id="i-cap" viewBox="0 0 24 24"><path d="M2 9l10-4.5L22 9l-10 4.5zM6.5 11v4.5c0 1.4 2.5 2.8 5.5 2.8s5.5-1.4 5.5-2.8V11M21.5 9.5v5"/></symbol>
<symbol id="i-truck" viewBox="0 0 24 24"><path d="M2 16.5V7.5h11v9M13 10.5h4.5l3 3v3H13"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></symbol>
<symbol id="i-mountain" viewBox="0 0 24 24"><path d="M1.5 20L8.5 9l3.5 5 3-4.5L22.5 20zM8.5 9l-1.8 2.8 1.8-.8 1.4 1.4"/></symbol>
<symbol id="i-phone" viewBox="0 0 24 24"><path d="M5 3.5h3.5l1.5 4-2 1.5a11 11 0 0 0 7 7l1.5-2 4 1.5V19a1.5 1.5 0 0 1-1.5 1.5A16.5 16.5 0 0 1 3.5 5 1.5 1.5 0 0 1 5 3.5z"/></symbol>
<symbol id="i-chat" viewBox="0 0 24 24"><path d="M4 5h16v11H9l-4.5 3.5V16H4z"/><path d="M8 9.5h8M8 12.5h5"/></symbol>
<symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.3"/></symbol>
<symbol id="i-mail" viewBox="0 0 24 24"><rect x="3" y="5.5" width="18" height="13" rx="1.5"/><path d="M3.5 6.5L12 13l8.5-6.5"/></symbol>
<symbol id="i-ig" viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/></symbol>
<symbol id="i-fb" viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="3.5"/><path d="M15.5 8h-2a2 2 0 0 0-2 2v10.5M9.5 13h5"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><path d="M4.5 12.5l4.5 4.5 10.5-10.5"/></symbol>
<symbol id="i-arrow" viewBox="0 0 24 24"><path d="M4 12h15M13.5 6.5L19 12l-5.5 5.5"/></symbol>
<symbol id="i-drop" viewBox="0 0 24 24"><path d="M12 3.5s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11z"/></symbol>
<symbol id="i-scan" viewBox="0 0 24 24"><rect x="6" y="2.5" width="12" height="15" rx="2"/><rect x="8.5" y="5" width="7" height="5" rx=".8"/><path d="M10 13.5h4M12 17.5v2.5a1.5 1.5 0 0 0 1.5 1.5H17"/></symbol>
</defs></svg>`;

// ---------- head ----------

function head(ctx, page, schema) {
  const { SITE, esc } = ctx;
  const url = ctx.abs(page.file || (page.slug ? `${page.slug}/` : ''));
  const noindex = page.noindex || !SITE.launched;
  const ogImage = ctx.abs('assets/og-image.png');
  const ld = schema.map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n');
  return `<!doctype html>
<html lang="en-US">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
<link rel="canonical" href="${url}">
${noindex ? '<meta name="robots" content="noindex, nofollow">\n' : ''}<meta name="theme-color" content="#1B2541">
<meta name="format-detection" content="telephone=no">
<link rel="icon" href="${ctx.asset('favicon.svg')}" type="image/svg+xml">
<link rel="apple-touch-icon" href="${ctx.root}assets/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,600;0,800;1,800&family=Barlow:wght@400;500;600&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Yellowtail&text=DriveMo.%20&display=swap">
<link rel="stylesheet" href="${ctx.asset('site.css')}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(SITE.name)}">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Bridger Bayworks DIY Garage in Belgrade, Montana">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(page.title)}">
<meta name="twitter:description" content="${esc(page.description)}">
<meta name="twitter:image" content="${ogImage}">
<meta name="geo.region" content="US-MT">
<meta name="geo.placename" content="Belgrade">
${ld}
<script>document.documentElement.classList.add('js');setTimeout(function(){if(!window.__bbReady)document.documentElement.classList.remove('js')},3000)</script>
</head>`;
}

// ---------- header / footer ----------

const NAV = [
  ['lift-rental', 'Lift Rental'],
  ['tool-rental', 'Tool Rental'],
  ['diagnostics', 'Diagnostics'],
  ['rates', 'Rates'],
  ['how-it-works', 'How It Works'],
  ['about', 'Community'],
];

function header(ctx) {
  const { SITE } = ctx;
  const items = NAV.map(([s, label]) =>
    `<li><a href="${ctx.link(s)}"${ctx.slug === s ? ' aria-current="page"' : ''}>${label}</a></li>`).join('');
  return `<a class="skip" href="#main">Skip to content</a>
<header class="site-header" data-header>
  <div class="wrap header-inner">
    <a class="brand" href="${ctx.link('')}" aria-label="${SITE.name}, home">
      ${brandMark}
      <span class="brand-words"><span class="b1">Bridger</span><span class="b2">Bayworks</span><span class="b3">DIY Garage</span></span>
    </a>
    <nav class="nav" aria-label="Main">
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-menu"><span class="bars" aria-hidden="true"></span><span class="nav-toggle-label">Menu</span></button>
      <ul id="nav-menu" class="nav-menu">
        ${items}
        <li class="nav-cta"><a class="btn btn-yellow" href="${ctx.reserve()}"${ctx.slug === 'reserve' ? ' aria-current="page"' : ''}><span>Reserve a Bay</span></a></li>
      </ul>
    </nav>
    <a class="header-phone" href="${ctx.tel}">${ctx.icon('phone')}<span>${SITE.phone.display}</span></a>
  </div>
</header>`;
}

export function crumbs(ctx, name) {
  return `<nav class="crumbs wrap" aria-label="Breadcrumb"><ol><li><a href="${ctx.link('')}">Home</a></li><li aria-current="page">${name}</li></ol></nav>`;
}

// Page header band for every inner page (the home hero is reserved for Higgsfield).
export function pageHero(ctx, { kicker, h1, lead, cta, ctaParams, secondary = true }) {
  return `<section class="page-hero">
  <div class="wrap page-hero-inner">
    <p class="kicker kicker-light">${kicker}</p>
    <h1>${h1}</h1>
    <p class="lead">${lead}</p>
    <div class="btn-row">
      <a class="btn btn-yellow btn-lg" href="${ctx.reserve(ctaParams)}"><span>${cta}</span></a>
      ${secondary ? `<a class="btn btn-ghost-light btn-lg" href="${ctx.tel}">${ctx.icon('phone')}<span>Call or text Max</span></a>` : ''}
    </div>
  </div>
  ${ridge('dark')}
</section>`;
}

export function ctaBand(ctx, { title = 'Got a project? Talk to Max.', text, params } = {}) {
  const t = text || 'Tell Max what you’re working on and when you want to come in. He’ll get back to you with a bay and a price.';
  return `<section class="cta-band" aria-labelledby="cta-title">
  ${ridge('dark')}
  <div class="wrap cta-inner reveal">
    <p class="kicker kicker-light">Reserve a bay today</p>
    <h2 id="cta-title">${title}</h2>
    <p>${t}</p>
    <div class="btn-row">
      <a class="btn btn-yellow btn-lg btn-brush" href="${ctx.reserve(params)}"><span>Reserve a Bay</span></a>
      <a class="btn btn-ghost-light btn-lg" href="${ctx.tel}">${ctx.icon('phone')}<span>Call ${ctx.SITE.phone.display}</span></a>
      <a class="btn btn-ghost-light btn-lg" href="${ctx.sms}">${ctx.icon('chat')}<span>Text Max</span></a>
    </div>
    <p class="tagline-dots">Build <i></i> Fix <i></i> Learn <i></i> Repeat</p>
  </div>
</section>`;
}

function footer(ctx) {
  const { SITE } = ctx;
  const a = SITE.address;
  const year = SITE.updated.slice(0, 4);
  return `<footer class="site-footer">
  <div class="footer-body">
    <div class="wrap footer-grid">
      <div class="footer-brand">
        <a class="brand brand-footer" href="${ctx.link('')}" aria-label="${SITE.name}, home">${brandMark}<span class="brand-words"><span class="b1">Bridger</span><span class="b2">Bayworks</span><span class="b3">DIY Garage</span></span></a>
        <p class="script">Drive More. Do More.</p>
        <address>
          <a href="${SITE.mapsUrl}" target="_blank" rel="noopener">${ctx.icon('pin')}<span>${a.street}<br>${a.city}, ${a.region} ${a.zip}</span></a>
        </address>
        <p class="footer-hours">${ctx.icon('clock')}<span>${SITE.hoursNote}</span></p>
      </div>
      <div>
        <h2 class="footer-h">The shop</h2>
        <ul>
          <li><a href="${ctx.link('lift-rental')}">Lift rental</a></li>
          <li><a href="${ctx.link('tool-rental')}">Tool rental</a></li>
          <li><a href="${ctx.link('diagnostics')}">Diagnostics</a></li>
          <li><a href="${ctx.link('rates')}">Rates</a></li>
          <li><a href="${ctx.link('how-it-works')}">How it works</a></li>
          <li><a href="${ctx.link('diy-garage-bozeman')}">DIY garage near Bozeman</a></li>
        </ul>
      </div>
      <div>
        <h2 class="footer-h">Talk to Max</h2>
        <ul>
          <li><a href="${ctx.reserve()}">Reserve a bay</a></li>
          <li><a href="${ctx.tel}">${ctx.icon('phone')}<span>${SITE.phone.display}</span></a></li>
          <li><a href="${ctx.sms}">${ctx.icon('chat')}<span>Text Max</span></a></li>
          <li><a href="mailto:${SITE.email}">${ctx.icon('mail')}<span>${SITE.email}</span></a></li>
        </ul>
      </div>
      <div>
        <h2 class="footer-h">Community</h2>
        <ul>
          <li><a href="${ctx.link('about')}">More than a garage</a></li>
          <li><a href="${SITE.social.instagram.url}" target="_blank" rel="noopener">${ctx.icon('ig')}<span>${SITE.social.instagram.handle}</span></a></li>
          <li><a href="${SITE.social.facebook.url}" target="_blank" rel="noopener">${ctx.icon('fb')}<span>${SITE.social.facebook.handle}</span></a></li>
        </ul>
      </div>
    </div>
    <div class="wrap legal">
      <span>&copy; ${year} ${SITE.name}</span>
      <span class="tagline-dots">Cars <i></i> Community <i></i> Higher Ground</span>
    </div>
  </div>
</footer>
<div class="mobile-bar" aria-label="Contact Max">
  <a href="${ctx.tel}">${ctx.icon('phone')}<span>Call</span></a>
  <a href="${ctx.sms}">${ctx.icon('chat')}<span>Text</span></a>
  <a class="mb-primary" href="${ctx.reserve()}"><span>Reserve a Bay</span></a>
</div>`;
}

// ---------- JSON-LD ----------

export function businessId(ctx) { return ctx.abs('#business'); }

export function businessSchema(ctx) {
  const { SITE } = ctx;
  const r = SITE.rates;
  const offer = (name, price, unit) => ({
    '@type': 'Offer',
    itemOffered: { '@type': 'Service', name },
    priceSpecification: {
      '@type': 'UnitPriceSpecification', price, priceCurrency: 'USD',
      ...(unit ? { unitCode: 'HUR', unitText: 'hour' } : {}),
    },
  });
  const o = {
    '@context': 'https://schema.org',
    '@type': 'AutomotiveBusiness',
    '@id': businessId(ctx),
    name: SITE.name,
    alternateName: SITE.shortName,
    description: 'DIY garage in Belgrade, Montana. Rent a professional lift, quality tools, impact guns and scan tools by the hour to work on your own car, truck or SUV.',
    url: ctx.abs(''),
    image: ctx.abs('assets/og-image.png'),
    logo: ctx.abs('assets/apple-touch-icon.png'),
    telephone: SITE.phone.e164,
    email: SITE.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE.address.street,
      addressLocality: SITE.address.city,
      addressRegion: SITE.address.region,
      postalCode: SITE.address.zip,
      addressCountry: SITE.address.country,
    },
    hasMap: SITE.mapsUrl,
    areaServed: SITE.areaServed.map((n) => ({ '@type': 'City', name: `${n}, MT` })),
    sameAs: [SITE.social.instagram.url, SITE.social.facebook.url],
    knowsAbout: ['DIY auto repair', 'Lift rental', 'Tool rental', 'Vehicle diagnostics'],
  };
  if (SITE.showPrices) {
    o.makesOffer = [
      offer('Lift and shop time', r.lift, true),
      offer('Tool access', r.tools, true),
      offer('3/8 and 1/2 inch impact gun rental', r.impact, true),
      offer('Used oil disposal', r.oilDisposal, false),
      offer('Coolant disposal', r.coolantDisposal, false),
    ];
  }
  return o;
}

export function breadcrumbSchema(ctx, name) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: ctx.abs('') },
      { '@type': 'ListItem', position: 2, name, item: ctx.abs(`${ctx.slug}/`) },
    ],
  };
}

export function serviceSchema(ctx, { name, serviceType, description, priceKey }) {
  const { SITE } = ctx;
  const o = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name, serviceType, description,
    url: ctx.abs(`${ctx.slug}/`),
    provider: { '@id': businessId(ctx) },
    areaServed: SITE.areaServed.map((n) => ({ '@type': 'City', name: `${n}, MT` })),
  };
  if (priceKey && SITE.showPrices) {
    o.offers = {
      '@type': 'Offer',
      priceSpecification: { '@type': 'UnitPriceSpecification', price: SITE.rates[priceKey], priceCurrency: 'USD', unitCode: 'HUR', unitText: 'hour' },
    };
  }
  return o;
}

export function faqSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(([q, a]) => ({
      '@type': 'Question', name: q,
      acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') },
    })),
  };
}

export function faqList(faqs, open = 0) {
  return `<div class="faq">${faqs.map(([q, a], i) =>
    `<details class="faq-item reveal"${i < open ? ' open' : ''}><summary><h3>${q}</h3></summary><div class="faq-a"><p>${a}</p></div></details>`).join('')}</div>`;
}

// ---------- page ----------

export function renderPage(ctx, page) {
  const schema = typeof page.schema === 'function' ? page.schema(ctx) : [];
  const body = page.body(ctx);
  return `${head(ctx, page, schema)}
<body class="${page.bodyClass || ''}">
<!-- Generated by website/build.mjs from website/src/. Edit the source, not this file. -->
${sprite}
${header(ctx)}
<main id="main">
${body}
</main>
${footer(ctx)}
<script src="${ctx.asset('config.js')}"></script>
<script src="${ctx.asset('bb-core.js')}"></script>
<script src="${ctx.asset('site.js')}" defer></script>
</body>
</html>
`;
}
