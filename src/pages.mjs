// Every page on the site. Facts come from ../site.config.mjs; claims must trace to
// ../../context/product-facts.md. Every page ends in a path to Max (reserve, call or text).

import {
  ridge, crumbs, pageHero, ctaBand, businessSchema, breadcrumbSchema, serviceSchema,
  faqSchema, faqList,
} from './layout.mjs';
import { liftStory, serviceCards, whyList, ratesStrip, planBuilder, rateTable, diagnosticScene, communityScene } from './components.mjs';

// Shared FAQ answers. Prices read from config so a rate change cannot leave a stale answer.
function faqs(ctx) {
  const { SITE } = ctx;
  const r = SITE.rates;
  const a = SITE.address;
  const cost = SITE.showPrices
    ? `Lift and shop time is $${r.lift} an hour. Tool access and impact guns are $${r.tools} an hour each. Used oil disposal is free and coolant disposal is $${r.coolantDisposal}.`
    : 'Pricing is hourly. Call or text us for current rates.';
  return {
    what: ['What is a DIY garage?', 'A shop where you rent the space and the equipment and do the work yourself. At Bridger Bayworks you get a bay with a professional lift, quality tools, and a crew nearby if you need help.'],
    cost: ['How much does it cost?', cost],
    tools: ['Do I need my own tools?', `No. Toolbox access is on site${SITE.showPrices ? ` for $${r.tools} an hour` : ''}, plus 1/2" and 3/8" impact guns. Bring what you have and use ours for the rest.`],
    vehicles: ['What vehicles can I bring?', 'Cars, trucks, and SUVs. All makes and models are welcome.'],
    help: ['Can someone help me if I get stuck?', 'Yes. Work at your own pace with our knowledgeable crew nearby if you need help.'],
    hours: ['When are you open?', '7 days a week. Hours may vary, so reserve your bay ahead of time.'],
    fluids: ['What do I do with used oil and coolant?', SITE.showPrices ? `Leave it with us. Used oil disposal is free and coolant disposal is $${r.coolantDisposal}.` : 'Leave it with us. Ask us about disposal when you book.'],
    regular: ['Is there a rate for regulars?', SITE.showPrices ? `Yes. If you use the shop more than ${r.regularHours} hours a month, month after month, lift and shop time drops to $${r.liftRegular} an hour.` : 'Yes. Ask us about the regular-use rate.'],
    reserve: ['How do I reserve a bay?', `Book online, call or text ${SITE.phone.display}, or stop by ${a.street} in ${a.city}.`],
    where: ['Where is the shop?', `${a.street}, ${a.city}, ${a.region} ${a.zip}. A short drive from Bozeman, Manhattan, and Three Forks.`],
  };
}

// ============================== HOME ==============================

const home = {
  slug: '',
  title: 'DIY Garage & Lift Rental in Belgrade, MT | Bridger Bayworks',
  description: 'Rent a professional lift, quality tools and a clean bay to work on your own car or truck. DIY garage in Belgrade, MT, near Bozeman. Open 7 days a week.',
  bodyClass: 'page-home',
  schema: (ctx) => [
    businessSchema(ctx),
    { '@context': 'https://schema.org', '@type': 'WebSite', name: ctx.SITE.name, url: ctx.abs(''), publisher: { '@id': ctx.abs('#business') } },
  ],
  body: (ctx) => {
    const { SITE } = ctx;
    const f = faqs(ctx);
    return `
<!-- HERO: Higgsfield shop-lift clip (Lane 2 Codex, 2026-10-03), built from the real shop (IMG_7028).
     Full-bleed, the text sits over the clip, and scrolling scrubs it (HERO-SLOT.md).
     Source deck: ../marketing/shop-lift-hero/. Spec: website/HERO-SLOT.md. Keep the h1 text and both buttons. -->
<section class="hero" data-hero-slot="higgsfield" aria-labelledby="hero-title">
  <div class="hero-media" aria-hidden="true">
    <img class="hero-poster" src="${ctx.asset('hero/shop-lift-poster.jpg')}" alt="" width="1280" height="720" fetchpriority="high" decoding="async">
    <canvas class="hero-canvas" data-hero-canvas></canvas>
    <video class="hero-video" data-hero-video data-src="${ctx.asset('hero/shop-lift-hero-scrub.mp4')}" poster="${ctx.asset('hero/shop-lift-poster.jpg')}" muted playsinline preload="none" disablepictureinpicture tabindex="-1"></video>
  </div>
  <div class="hero-inner">
    <div class="wrap">
    <div class="hero-copy">
      <p class="kicker kicker-light">Your space. Your tools. Your projects.</p>
      <h1 id="hero-title">DIY Garage &amp; Lift Rental in <span class="blue-light">Belgrade, MT</span></h1>
      <p class="lead">Rent a professional lift, quality tools, and a clean bay to work on your own car or truck. Open 7 days a week, a short drive from Bozeman.</p>
      <div class="btn-row">
        <a class="btn btn-yellow btn-lg btn-brush" href="${ctx.reserve()}"><span>Reserve a Bay</span></a>
        <a class="btn btn-ghost-light" href="${ctx.tel}">${ctx.icon('phone')}<span>Call us</span></a><a class="hero-text-link" href="${ctx.sms}">${ctx.icon('chat')}Text us</a>
      </div>
      <p class="hero-hours">${ctx.icon('clock')} ${SITE.hoursNote}</p>
    </div>
    </div>
  </div>
</section>
<div class="shop-strip"><div class="wrap"><span>${ctx.icon('pin')}Belgrade, Montana</span><span>${ctx.icon('lift')}Professional lifts</span><span>${ctx.icon('wrench')}Tools on site</span><a href="${ctx.link('rates')}">See shop rates ${ctx.icon('arrow')}</a></div></div>

<section class="section section-paper" aria-labelledby="get-title">
  <div class="wrap">
    <div class="section-head reveal">
      <p class="kicker">Everything you need to get the job done</p>
      <h2 id="get-title">What you <span class="blue">get</span></h2>
      <p class="section-lead">A clean, safe, and welcoming space for enthusiasts, DIYers, and everyday drivers.</p>
    </div>
    ${serviceCards(ctx)}
  </div>
</section>

${diagnosticScene(ctx)}

${liftStory(ctx)}

<section class="section section-navy" aria-labelledby="rates-title">
  <div class="wrap">
    <div class="section-head reveal">
      <p class="kicker kicker-light">No surprises</p>
      <h2 id="rates-title">Simple <span class="blue-light">hourly</span> rates</h2>
    </div>
    ${ratesStrip(ctx)}
    <div class="center reveal">
      <a class="btn btn-yellow btn-lg" href="${SITE.showPrices ? `${ctx.link('rates')}#plan` : ctx.reserve()}"><span>${SITE.showPrices ? 'Plan your bay time' : 'Ask us for a quote'}</span></a>
    </div>
  </div>
</section>

<section class="section section-paper" aria-labelledby="why-title">
  <div class="wrap split">
    <div class="section-head reveal">
      <p class="kicker">A clean, well-equipped space to work on your ride</p>
      <h2 id="why-title">Why work <span class="blue">here</span></h2>
      <p class="section-lead">Get the car in the air, grab the right tool, and get it done.</p>
      <figure class="shop-detail"><img src="${ctx.asset('photos/shop-door.jpg')}" alt="Open bay door at Bridger Bayworks" width="750" height="1000" loading="lazy"><figcaption>201 S Weaver St, Building A</figcaption></figure>
      <a class="btn btn-royal" href="${ctx.reserve()}"><span>Reserve a bay</span>${ctx.icon('arrow')}</a>
    </div>
    ${whyList(ctx)}
  </div>
</section>

${communityScene(ctx)}
<section class="mountain-window" aria-label="Snow-covered Bridger Mountains">
  <div class="wrap"><p>Cars. Community. Higher ground.</p><span>The Bridger Mountains, Montana</span><a href="${ctx.link('about')}">Meet the community ${ctx.icon('arrow')}</a></div>
</section>

<section class="section section-paper" aria-labelledby="faq-title">
  <div class="wrap narrow">
    <div class="section-head reveal">
      <p class="kicker">Good questions</p>
      <h2 id="faq-title">Before you <span class="blue">come in</span></h2>
    </div>
    ${faqList([f.what, f.cost, f.tools], 1)}
    <p class="center reveal"><a class="text-link" href="${ctx.link('how-it-works')}#faq">More answers${ctx.icon('arrow')}</a></p>
  </div>
</section>

<section class="section section-white" aria-labelledby="find-title">
  <div class="wrap split find">
    <div class="reveal">
      <p class="kicker">Find the shop</p>
      <h2 id="find-title">Belgrade, <span class="blue">Montana</span></h2>
      <address class="find-address">${SITE.address.street}<br>${SITE.address.city}, ${SITE.address.region} ${SITE.address.zip}</address>
      <p class="find-hours">${ctx.icon('clock')}<span>${SITE.hoursNote}</span></p>
      <div class="btn-row">
        <a class="btn btn-royal" href="${ctx.reserve()}"><span>Reserve a bay</span></a>
        <a class="btn btn-outline" href="${SITE.mapsUrl}" target="_blank" rel="noopener">${ctx.icon('pin')}<span>Get directions</span></a>
      </div>
    </div>
    <div class="towns reveal">
      <p class="towns-h">A short drive from</p>
      <ul>${SITE.areaServed.filter((t) => t !== 'Belgrade').map((t) => `<li>${t === 'Bozeman' ? `<a href="${ctx.link('diy-garage-bozeman')}">Bozeman</a>` : t}</li>`).join('')}</ul>
      <p class="towns-foot">and the rest of the Gallatin Valley.</p>
    </div>
  </div>
</section>

${ctaBand(ctx)}`;
  },
};

// ============================== LIFT RENTAL ==============================

const lift = {
  slug: 'lift-rental',
  crumb: 'Lift Rental',
  title: 'Lift Rental in Belgrade, MT | Bridger Bayworks DIY Garage',
  description: 'Rent a professional car lift by the hour in Belgrade, MT. Work on your own car, truck or SUV in a clean shop with tools on site. Reserve a bay with us.',
  bodyClass: 'page-inner',
  schema: (ctx) => [
    serviceSchema(ctx, { name: 'Lift Rental', serviceType: 'Car lift rental', description: 'Hourly rental of a professional two-post vehicle lift and shop space for DIY car and truck work.', priceKey: 'lift' }),
    breadcrumbSchema(ctx, 'Lift Rental'),
  ],
  body: (ctx) => {
    const { SITE } = ctx;
    const r = SITE.rates;
    const f = faqs(ctx);
    return `${crumbs(ctx, 'Lift Rental')}
${pageHero(ctx, {
  kicker: 'Lift rental',
  h1: 'Lift Rental in <span class="blue-light">Belgrade, MT</span>',
  lead: 'Get your car or truck in the air on a professional lift. Same equipment the pros use, in a clean, well-equipped shop.',
  cta: 'Reserve lift time', ctaParams: { service: 'lift' },
})}

<section class="section section-paper">
  <div class="wrap split">
    <div class="reveal">
      <p class="kicker">Why a lift</p>
      <h2>Stand up. <span class="blue">See everything.</span></h2>
      <p class="section-lead">Jack stands on a cold driveway make every job slower and harder. On a lift you stand under the car, see the whole underside, and have room to swing a wrench.</p>
      <ul class="ticks">
        <li>${ctx.icon('check')}<span>Wheels off and room to work</span></li>
        <li>${ctx.icon('check')}<span>Clear view of brakes, suspension, and exhaust</span></li>
        <li>${ctx.icon('check')}<span>Drain plugs and filters right at arm's reach</span></li>
        <li>${ctx.icon('check')}<span>Tools and impact guns a few steps away</span></li>
      </ul>
    </div>
    <div class="price-card reveal">
      <p class="kicker">Lift and shop time</p>
      <p class="price-big">${ctx.count('lift')}${SITE.showPrices ? '<small>/hr</small>' : ''}</p>
      <ul class="price-adds">
        <li><span>Tool access</span><span>${ctx.price('tools', '/hr')}</span></li>
        <li><span>Impact guns</span><span>${ctx.price('impact', '/hr')}</span></li>
        <li><span>Used oil disposal</span><span>${ctx.price('oilDisposal')}</span></li>
      </ul>
      ${SITE.showPrices ? `<p class="fine">Regulars over ${r.regularHours} hrs a month, month after month: $${r.liftRegular}/hr.</p>` : ''}
      <a class="btn btn-yellow btn-block" href="${ctx.reserve({ service: 'lift' })}"><span>Reserve lift time</span></a>
    </div>
  </div>
</section>

<section class="section section-white">
  <div class="wrap">
    <div class="section-head reveal">
      <p class="kicker">Routine maintenance or a bigger project</p>
      <h2>Good jobs for a <span class="blue">lift</span></h2>
    </div>
    <ul class="jobs">
      ${['Oil and filter changes', 'Brakes and rotors', 'Suspension and steering', 'Exhaust work', 'Transmission and differential fluid', 'A look under a car before you buy it']
        .map((j, i) => `<li class="reveal" style="--i:${i}">${ctx.icon('wrench')}<span>${j}</span></li>`).join('')}
    </ul>
    <p class="center reveal">Not sure your job fits? <a class="text-link" href="${ctx.reserve({ service: 'other' })}">Ask us${ctx.icon('arrow')}</a></p>
  </div>
</section>

<section class="section section-paper">
  <div class="wrap narrow">
    <div class="section-head reveal"><h2>Lift rental <span class="blue">questions</span></h2></div>
    ${faqList([f.cost, f.tools, f.help, f.vehicles])}
  </div>
</section>

${ctaBand(ctx, { title: 'Ready to get it in the air?', params: { service: 'lift' } })}`;
  },
};

// ============================== TOOL RENTAL ==============================

const tools = {
  slug: 'tool-rental',
  crumb: 'Tool Rental',
  title: 'Tool & Impact Gun Rental, Belgrade MT | Bridger Bayworks',
  description: 'Rent quality tools and 1/2" and 3/8" impact guns by the hour at our DIY garage in Belgrade, MT. Use them right next to the lift. Ask us to reserve a bay.',
  bodyClass: 'page-inner',
  schema: (ctx) => [
    serviceSchema(ctx, { name: 'Tool Rental', serviceType: 'Automotive tool rental', description: 'Hourly access to a full toolbox and 1/2 and 3/8 inch impact guns for DIY vehicle work, on site at the shop.', priceKey: 'tools' }),
    breadcrumbSchema(ctx, 'Tool Rental'),
  ],
  body: (ctx) => {
    const { SITE } = ctx;
    const f = faqs(ctx);
    return `${crumbs(ctx, 'Tool Rental')}
${pageHero(ctx, {
  kicker: 'Tool rental',
  h1: 'Tool Rental for <span class="blue-light">DIY Car Repair</span>',
  lead: 'Don’t buy a tool you’ll use once. Use ours by the hour, right next to the lift.',
  cta: 'Reserve a bay with tools', ctaParams: { service: 'tools' },
})}

<section class="section section-paper">
  <div class="wrap">
    <div class="section-head reveal">
      <p class="kicker">Quality tools on site</p>
      <h2>What’s in the <span class="blue">shop</span></h2>
    </div>
    <figure class="equipment-banner reveal"><img src="${ctx.asset('photos/shop-lift.jpg')}" alt="The lift and work area inside Bridger Bayworks" width="1050" height="1400" loading="lazy"><figcaption>Inside Bridger Bayworks. Ask us about the specific tool your job needs.</figcaption></figure>
    <div class="cards cards-3">
      <div class="card card-static reveal" style="--i:0"><span class="card-ico">${ctx.icon('toolbox')}</span><h3>Toolbox access</h3><p>Quality hand tools on site, so the job doesn’t stall on a missing socket.</p><span class="card-foot"><span class="chip">${ctx.price('tools', '/hr')}</span></span></div>
      <div class="card card-static reveal" style="--i:1"><span class="card-ico">${ctx.icon('impact')}</span><h3>1/2" and 3/8" impact guns</h3><p>For lug nuts, suspension bolts, and anything rusted tight.</p><span class="card-foot"><span class="chip">${ctx.price('impact', '/hr')}</span></span></div>
      <div class="card card-static reveal" style="--i:2"><span class="card-ico">${ctx.icon('gear')}</span><h3>Shop equipment</h3><p>Lifts, workbenches, compressors, and more.</p><span class="card-foot"><span class="chip">In the shop</span></span></div>
    </div>
    <p class="center reveal">Need something specific? <a class="text-link" href="${ctx.reserve({ service: 'tools' })}">Ask us before you come in${ctx.icon('arrow')}</a></p>
  </div>
</section>

<section class="section section-white">
  <div class="wrap split">
    <div class="reveal">
      <p class="kicker">Here a lot?</p>
      <h2>Regulars get a <span class="blue">better deal</span></h2>
      <p class="section-lead">Tool pricing for regular users can be worked out depending on how often you’re here and what you’re using.</p>
      <a class="btn btn-royal" href="${ctx.reserve({ service: 'regular' })}"><span>Ask about regular pricing</span>${ctx.icon('arrow')}</a>
    </div>
    <div class="reveal">${SITE.showPrices ? rateTable(ctx) : ''}</div>
  </div>
</section>

<section class="section section-paper">
  <div class="wrap narrow">
    <div class="section-head reveal"><h2>Tool rental <span class="blue">questions</span></h2></div>
    ${faqList([f.tools, f.help, f.cost])}
  </div>
</section>

${ctaBand(ctx, { title: 'Tell us what you’re working on.', params: { service: 'tools' } })}`;
  },
};

// ============================== DIAGNOSTICS ==============================

const diag = {
  slug: 'diagnostics',
  crumb: 'Diagnostics',
  title: 'DIY Car Diagnostics & Scan Tools | Bridger Bayworks',
  description: 'Check engine light on? Use our scan tools to pull the codes, then fix it on a lift in the same visit. DIY garage in Belgrade, MT. Ask us to reserve a bay.',
  bodyClass: 'page-inner',
  schema: (ctx) => [
    serviceSchema(ctx, { name: 'DIY Diagnostics', serviceType: 'Vehicle diagnostic scan tool access', description: 'Use of scan tools and diagnostic equipment so DIYers can read trouble codes and find the problem before repairing it on a lift.' }),
    breadcrumbSchema(ctx, 'Diagnostics'),
  ],
  body: (ctx) => {
    const f = faqs(ctx);
    const steps = [
      ['scan', 'Read the codes', 'Plug in a scan tool and see what the car is telling you.'],
      ['engine', 'Track it down', 'A code points to a system, not always a part. Check it before you buy anything.'],
      ['lift', 'Fix it on the lift', 'Get the car in the air and do the repair in the same visit.'],
      ['check', 'Clear and confirm', 'Clear the code and make sure it stays gone.'],
    ];
    return `${crumbs(ctx, 'Diagnostics')}
${pageHero(ctx, {
  kicker: 'Diagnostics',
  h1: 'DIY Car Diagnostics in <span class="blue-light">Belgrade, MT</span>',
  lead: 'Check engine light on? Use our scan tools and equipment to find the problem, then fix it on a lift.',
  cta: 'Ask us about diagnostics', ctaParams: { service: 'diagnostics' },
})}

${diagnosticScene(ctx)}

<section class="section section-paper">
  <div class="wrap">
    <div class="section-head reveal">
      <p class="kicker">Scan tools and equipment to help you get the job done</p>
      <h2>From warning light to <span class="blue">fixed</span></h2>
    </div>
    <ol class="flow">${steps.map(([ic, t, d], i) => `<li class="reveal" style="--i:${i}"><span class="flow-n">${i + 1}</span>${ctx.icon(ic)}<h3>${t}</h3><p>${d}</p></li>`).join('')}</ol>
  </div>
</section>

<section class="section section-white">
  <div class="wrap split">
    <div class="reveal">
      <p class="kicker">You’re not on your own</p>
      <h2>A second set of <span class="blue">eyes</span></h2>
      <p class="section-lead">Work at your own pace. If a code has you stumped, our knowledgeable crew is nearby when you need help.</p>
    </div>
    <div class="price-card reveal">
      <p class="kicker">Diagnostics</p>
      <p class="price-big price-ask">Ask us</p>
      <p class="fine">Tell us what the car is doing and we’ll tell you what it takes.</p>
      <a class="btn btn-yellow btn-block" href="${ctx.reserve({ service: 'diagnostics' })}"><span>Get a quote</span></a>
    </div>
  </div>
</section>

<section class="section section-paper">
  <div class="wrap narrow">
    <div class="section-head reveal"><h2>Diagnostics <span class="blue">questions</span></h2></div>
    ${faqList([f.help, f.tools, f.reserve])}
  </div>
</section>

${ctaBand(ctx, { title: 'Light on? Talk to us.', params: { service: 'diagnostics' } })}`;
  },
};

// ============================== RATES ==============================

const rates = {
  slug: 'rates',
  crumb: 'Rates',
  title: 'DIY Garage Rates & Lift Time Pricing | Bridger Bayworks',
  description: 'Simple hourly rates at our Belgrade, MT DIY garage: lift and shop time, tool access, impact guns, and fluid disposal. Plan your bay time and send it to us.',
  bodyClass: 'page-inner',
  schema: (ctx) => [businessSchema(ctx), breadcrumbSchema(ctx, 'Rates')],
  body: (ctx) => {
    const { SITE } = ctx;
    const r = SITE.rates;
    return `${crumbs(ctx, 'Rates')}
${pageHero(ctx, {
  kicker: 'Shop rates',
  h1: 'DIY Garage <span class="blue-light">Rates</span>',
  lead: SITE.showPrices ? 'Hourly pricing. No packages to decode. Plan your time below and send it to us.' : 'Hourly pricing. Tell us what you’re working on and we’ll quote it.',
  cta: 'Get a quote', ctaParams: { service: 'lift' },
})}

<section class="section section-paper">
  <div class="wrap split">
    <div class="reveal">
      <p class="kicker">Standard rates</p>
      <h2>What it <span class="blue">costs</span></h2>
      ${rateTable(ctx)}
    </div>
    <div class="stack">
      ${SITE.showPrices ? `<div class="note-card reveal"><span class="card-ico">${ctx.icon('clock')}</span><div><h3>Regular-use rate</h3><p>Using the shop more than ${r.regularHours} hours a month, month after month? Your lift and shop rate drops to <strong>$${r.liftRegular} an hour</strong>.</p><a class="text-link" href="${ctx.reserve({ service: 'regular' })}">Ask about the regular rate${ctx.icon('arrow')}</a></div></div>` : ''}
      <div class="note-card reveal"><span class="card-ico">${ctx.icon('people')}</span><div><h3>Bring a friend</h3><p>Send people our way and you can earn free shop time. Ask us how referral credit works.</p><a class="text-link" href="${ctx.reserve({ service: 'other' })}">Ask us${ctx.icon('arrow')}</a></div></div>
    </div>
  </div>
</section>

${SITE.showPrices ? `<section class="section section-navy" aria-label="Plan your bay time">
  <div class="wrap reveal">${planBuilder(ctx)}</div>
</section>` : ''}

${ctaBand(ctx, { title: 'Questions on price? Ask us.', params: { service: 'lift' } })}`;
  },
};

// ============================== HOW IT WORKS ==============================

const how = {
  slug: 'how-it-works',
  crumb: 'How It Works',
  title: 'How Our DIY Garage Works | Bridger Bayworks, Belgrade MT',
  description: 'Reserve a bay, bring your project, use our lifts and tools, and get it done at your own pace. How the Bridger Bayworks DIY garage works, plus answers to FAQs.',
  bodyClass: 'page-inner',
  schema: (ctx) => {
    const f = faqs(ctx);
    return [faqSchema(Object.values(f)), breadcrumbSchema(ctx, 'How It Works')];
  },
  body: (ctx) => {
    const f = faqs(ctx);
    return `${crumbs(ctx, 'How It Works')}
${pageHero(ctx, {
  kicker: 'Simple steps. Real progress.',
  h1: 'How Our <span class="blue-light">DIY Garage</span> Works',
  lead: 'Your space. Your tools. Your projects. Here’s how a visit goes, start to finish.',
  cta: 'Reserve a bay',
})}

${liftStory(ctx, { heading: 'Four steps to <span class="blue">done</span>' })}

<section class="section section-paper">
  <div class="wrap split">
    <div class="reveal">
      <p class="kicker">Bring your project</p>
      <h2>What to <span class="blue">bring</span></h2>
      <ul class="ticks">
        <li>${ctx.icon('check')}<span>Your car, truck, or SUV</span></li>
        <li>${ctx.icon('check')}<span>Your parts for the job</span></li>
        <li>${ctx.icon('check')}<span>Any tools you like to use</span></li>
        <li>${ctx.icon('check')}<span>A plan, or questions for the crew</span></li>
      </ul>
    </div>
    <div class="reveal">
      <p class="kicker">Use our equipment</p>
      <h2>What’s <span class="blue">here</span></h2>
      <ul class="ticks">
        <li>${ctx.icon('check')}<span>Professional lifts</span></li>
        <li>${ctx.icon('check')}<span>Toolbox access</span></li>
        <li>${ctx.icon('check')}<span>1/2" and 3/8" impact guns</span></li>
        <li>${ctx.icon('check')}<span>Workbenches and compressors</span></li>
        <li>${ctx.icon('check')}<span>A clean, spacious bay</span></li>
        <li>${ctx.icon('check')}<span>Used oil and coolant disposal</span></li>
      </ul>
    </div>
  </div>
</section>

<section class="section section-white" id="faq">
  <div class="wrap narrow">
    <div class="section-head reveal">
      <p class="kicker">Good questions</p>
      <h2>Frequently asked <span class="blue">questions</span></h2>
    </div>
    ${faqList(Object.values(f), 1)}
  </div>
</section>

${ctaBand(ctx)}`;
  },
};

// ============================== ABOUT / COMMUNITY ==============================

const about = {
  slug: 'about',
  crumb: 'Community',
  title: 'About Bridger Bayworks | DIY Garage Community, Belgrade',
  description: 'More than a garage. Bridger Bayworks is a community for people who love working on their own cars, trucks and motorcycles in Belgrade and Bozeman, Montana.',
  bodyClass: 'page-inner',
  schema: (ctx) => [
    { '@context': 'https://schema.org', '@type': 'AboutPage', name: 'About Bridger Bayworks', url: ctx.abs('about/'), about: { '@id': ctx.abs('#business') } },
    breadcrumbSchema(ctx, 'Community'),
  ],
  body: (ctx) => {
    const { SITE } = ctx;
    return `${crumbs(ctx, 'Community')}
${pageHero(ctx, {
  kicker: 'Cars. Community. Higher ground.',
  h1: 'More Than a Garage. <span class="blue-light">A Community.</span>',
  lead: 'A place for people who love working on their own vehicles.',
  cta: 'Talk to us',
})}

${communityScene(ctx)}

<section class="section section-paper">
  <div class="wrap split">
    <div class="reveal">
      <p class="kicker">Same cars. Brighter days.</p>
      <h2>Your space. Your tools. <span class="blue">Your projects.</span></h2>
      <p class="section-lead">Whether it’s routine maintenance or a bigger project, Bridger Bayworks provides the space, tools, and community to help you get it done. It is a clean, safe, and welcoming space for enthusiasts, DIYers, and everyday drivers.</p>
      <p class="tagline-dots tagline-ink">Learn <i></i> Build <i></i> Maintain <i></i> Enjoy</p>
    </div>
    <ul class="pillars">
      <li class="reveal" style="--i:0">${ctx.icon('people')}<div><h3>Meet like-minded enthusiasts</h3><p>Cars, trucks, motorcycles, and more.</p></div></li>
      <li class="reveal" style="--i:1">${ctx.icon('mountain')}<div><h3>Build your skills</h3><p>Learn, share, and tackle new projects.</p></div></li>
      <li class="reveal" style="--i:2">${ctx.icon('wrench')}<div><h3>Keep cars on the road</h3><p>A stronger, more independent car community.</p></div></li>
    </ul>
  </div>
</section>

<section class="section section-white">
  <div class="wrap split">
    <div class="reveal">
      <p class="kicker">Talk to the owner</p>
      <h2>Questions go <span class="blue">straight to us</span></h2>
      <p class="section-lead">Bridger Bayworks is locally owned and run. Got a project, a question about the shop, or want a regular spot? Ask us directly.</p>
      <div class="btn-row">
        <a class="btn btn-royal" href="${ctx.reserve()}"><span>Message us</span>${ctx.icon('arrow')}</a>
        <a class="btn btn-outline" href="${ctx.tel}">${ctx.icon('phone')}<span>${SITE.phone.display}</span></a>
      </div>
    </div>
    <div class="social-card reveal">
      <p class="kicker">Follow the shop</p>
      <a href="${SITE.social.instagram.url}" target="_blank" rel="noopener">${ctx.icon('ig')}<span>${SITE.social.instagram.handle}</span></a>
      <a href="${SITE.social.facebook.url}" target="_blank" rel="noopener">${ctx.icon('fb')}<span>${SITE.social.facebook.handle}</span></a>
    </div>
  </div>
</section>

${ctaBand(ctx, { title: 'Come check out the shop.', text: 'Or reserve a bay today. Tell us what you’re working on and we’ll get back to you.' })}`;
  },
};

// ============================== BOZEMAN ==============================

const bozeman = {
  slug: 'diy-garage-bozeman',
  crumb: 'DIY Garage Near Bozeman',
  title: 'DIY Garage Near Bozeman, MT | Bridger Bayworks',
  description: 'No garage or lift at your Bozeman place? Rent a professional lift, tools and a clean bay by the hour at Bridger Bayworks in Belgrade, a short drive away.',
  bodyClass: 'page-inner',
  schema: (ctx) => [
    serviceSchema(ctx, { name: 'DIY Garage for Bozeman Drivers', serviceType: 'Self-service auto repair garage', description: 'Hourly lift, tool and bay rental for Bozeman-area drivers who want to work on their own vehicles.', priceKey: 'lift' }),
    breadcrumbSchema(ctx, 'DIY Garage Near Bozeman'),
  ],
  body: (ctx) => {
    const { SITE } = ctx;
    const f = faqs(ctx);
    return `${crumbs(ctx, 'DIY Garage Near Bozeman')}
${pageHero(ctx, {
  kicker: 'Serving Bozeman and the Gallatin Valley',
  h1: 'DIY Garage Near <span class="blue-light">Bozeman, MT</span>',
  lead: 'No garage at your Bozeman place? No lift? Bridger Bayworks in Belgrade gives you a professional lift, quality tools, and a clean bay by the hour.',
  cta: 'Reserve a bay',
})}

<section class="section section-paper">
  <div class="wrap">
    <div class="section-head reveal">
      <p class="kicker">Why Bozeman drivers make the drive</p>
      <h2>Do the job <span class="blue">right</span></h2>
    </div>
    <div class="cards cards-3">
      <div class="card card-static reveal" style="--i:0"><span class="card-ico">${ctx.icon('lift')}</span><h3>A real lift</h3><p>Not jack stands in a parking lot. Stand under the car and see the whole job.</p></div>
      <div class="card card-static reveal" style="--i:1"><span class="card-ico">${ctx.icon('toolbox')}</span><h3>Tools on site</h3><p>Don’t buy a tool you’ll use once. Toolbox access and impact guns by the hour.</p></div>
      <div class="card card-static reveal" style="--i:2"><span class="card-ico">${ctx.icon('door')}</span><h3>An indoor bay</h3><p>Work in a clean shop instead of the driveway. If your lease or HOA says no car repairs, bring it here.</p></div>
    </div>
  </div>
</section>

<section class="section section-white">
  <div class="wrap split">
    <div class="reveal">
      <p class="kicker">Getting here</p>
      <h2>A short drive to <span class="blue">Belgrade</span></h2>
      <address class="find-address">${SITE.address.street}<br>${SITE.address.city}, ${SITE.address.region} ${SITE.address.zip}</address>
      <p class="find-hours">${ctx.icon('clock')}<span>${SITE.hoursNote}</span></p>
      <div class="btn-row">
        <a class="btn btn-royal" href="${ctx.reserve()}"><span>Reserve a bay</span></a>
        <a class="btn btn-outline" href="${SITE.mapsUrl}" target="_blank" rel="noopener">${ctx.icon('pin')}<span>Get directions</span></a>
      </div>
    </div>
    <div class="reveal">
      <p class="kicker">What you can rent</p>
      <ul class="link-list">
        <li><a href="${ctx.link('lift-rental')}">${ctx.icon('lift')}<span>Lift rental</span><em>${ctx.price('lift', '/hr')}</em></a></li>
        <li><a href="${ctx.link('tool-rental')}">${ctx.icon('wrench')}<span>Tool rental</span><em>${ctx.price('tools', '/hr')}</em></a></li>
        <li><a href="${ctx.link('diagnostics')}">${ctx.icon('engine')}<span>Diagnostics</span><em>Ask us</em></a></li>
        <li><a href="${ctx.link('rates')}">${ctx.icon('clock')}<span>All rates</span><em>See rates</em></a></li>
      </ul>
    </div>
  </div>
</section>

<section class="section section-paper">
  <div class="wrap narrow">
    <div class="section-head reveal"><h2>Bozeman drivers <span class="blue">ask</span></h2></div>
    ${faqList([f.where, f.what, f.cost, f.hours])}
  </div>
</section>

${ctaBand(ctx, { title: 'Bozeman, bring your project.' })}`;
  },
};

// ============================== RESERVE (the conversion page) ==============================

const reserve = {
  slug: 'reserve',
  crumb: 'Reserve a Bay',
  title: 'Reserve a Bay or Get a Quote | Bridger Bayworks',
  description: 'Reserve a bay or get a quote at Bridger Bayworks DIY Garage in Belgrade, MT. Tell us what you are working on and when. Or call or text 406-233-6598.',
  bodyClass: 'page-inner page-reserve',
  schema: (ctx) => [
    businessSchema(ctx),
    { '@context': 'https://schema.org', '@type': 'ContactPage', name: 'Reserve a Bay', url: ctx.abs('reserve/'), about: { '@id': ctx.abs('#business') } },
    breadcrumbSchema(ctx, 'Reserve a Bay'),
  ],
  body: (ctx) => {
    const { SITE, esc } = ctx;
    const endpoint = SITE.leadEndpoint;
    return `${crumbs(ctx, 'Reserve a Bay')}
<section class="reserve-hero">
  <div class="wrap">
    <p class="kicker">Reserve a bay today</p>
    <h1>Reserve a Bay or <span class="blue">Get a Quote</span></h1>
    <p class="lead">Tell us what you’re working on and when you’d like to come in. We’ll get back to you to confirm your bay and price.</p>
  </div>
</section>

<section class="section section-paper section-tight">
  <div class="wrap reserve-grid">
    <div class="form-card">
      <form id="reserve-form" class="reserve-form" method="post"${endpoint ? ` action="${esc(endpoint)}"` : ''} novalidate data-endpoint="${esc(endpoint)}">
        <div class="hp" aria-hidden="true"><label for="f-company">Company</label><input id="f-company" type="text" name="company" tabindex="-1" autocomplete="off"></div>
        <div class="field full">
          <label for="f-service">What do you need? <b aria-hidden="true">*</b></label>
          <select id="f-service" name="service" required>
            <option value="">Choose one</option>
            <option value="lift">Lift time</option>
            <option value="tools">Tool rental</option>
            <option value="diagnostics">Diagnostics / scan tools</option>
            <option value="regular">Regular-use rate</option>
            <option value="other">A quote for something else</option>
          </select>
        </div>
        <div class="field">
          <label for="f-name">Name <b aria-hidden="true">*</b></label>
          <input id="f-name" type="text" name="name" required maxlength="80" autocomplete="name">
        </div>
        <div class="field">
          <label for="f-phone">Phone <b aria-hidden="true">*</b></label>
          <input id="f-phone" type="tel" name="phone" required maxlength="20" pattern="[0-9\\s\\(\\)\\.\\+\\-]{10,20}" inputmode="tel" autocomplete="tel" aria-describedby="f-phone-hint">
          <small id="f-phone-hint">We call or text you back here.</small>
        </div>
        <div class="field">
          <label for="f-email">Email <span class="opt">(optional)</span></label>
          <input id="f-email" type="email" name="email" maxlength="120" autocomplete="email">
        </div>
        <div class="field">
          <label for="f-vehicle">Vehicle <b aria-hidden="true">*</b></label>
          <input id="f-vehicle" type="text" name="vehicle" required maxlength="80" placeholder="Year, make, model">
        </div>
        <div class="field">
          <label for="f-date">Preferred day <span class="opt">(optional)</span></label>
          <input id="f-date" type="date" name="date">
        </div>
        <div class="field">
          <label for="f-hours">How long? <span class="opt">(optional)</span></label>
          <select id="f-hours" name="hours">
            <option value="">Not sure</option>
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => `<option value="${h}">${h} hour${h > 1 ? 's' : ''}</option>`).join('')}
            <option value="full-day">Full day</option>
          </select>
        </div>
        <fieldset class="field full checks">
          <legend>Add-ons <span class="opt">(optional)</span></legend>
          <label class="check"><input type="checkbox" name="tools" value="yes"><span>Tool access</span></label>
          <label class="check"><input type="checkbox" name="impact" value="yes"><span>Impact guns</span></label>
          <label class="check"><input type="checkbox" name="coolant" value="yes"><span>Coolant disposal</span></label>
        </fieldset>
        <div class="field full">
          <label for="f-details">What’s the job? <b aria-hidden="true">*</b></label>
          <textarea id="f-details" name="details" required maxlength="2000" rows="5" placeholder="Brakes and rotors on the front, first time doing it myself."></textarea>
        </div>
        <div class="field full">
          <button class="btn btn-yellow btn-lg btn-block" type="submit"><span>${SITE.leadEndpoint ? 'Send to us' : 'Prepare text or email'}</span></button>
          <p class="fine">${SITE.leadEndpoint ? 'We use this to get back to you about your request.' : 'Next, send your request through your text or email app. Your bay is confirmed when we reply.'}</p>
        </div>
      </form>
      <noscript><p class="panel panel-warn">This form needs JavaScript. Call or text us at <a href="${ctx.tel}">${SITE.phone.display}</a>.</p></noscript>

      <div class="panel panel-ok" id="form-thanks" hidden tabindex="-1">
        <h2>Sent. We have it.</h2>
        <p>We’ll get back to you at the number you gave. Need us sooner? Call or text <a href="${ctx.tel}">${SITE.phone.display}</a>.</p>
      </div>
      <div class="panel panel-handoff" id="form-handoff" hidden tabindex="-1">
        <h2>Last step: send it to us.</h2>
        <p>Your request is written up. Tap one to send it to us.</p>
        <div class="btn-row">
          <a class="btn btn-yellow btn-lg" id="handoff-sms" href="${ctx.sms}">${ctx.icon('chat')}<span>Text it to us</span></a>
          <a class="btn btn-outline btn-lg" id="handoff-mail" href="mailto:${SITE.email}">${ctx.icon('mail')}<span>Email it to us</span></a>
        </div>
        <p class="fine">Or call <a href="${ctx.tel}">${SITE.phone.display}</a>. Your details are still in the form above.</p>
      </div>
      <div class="panel panel-error" id="form-error" hidden role="alert" tabindex="-1">
        <h2>That didn’t send.</h2>
        <p>Your details are still in the form, so you can try again. If it keeps failing, <a id="error-sms" href="${ctx.sms}">text us</a> or call <a href="${ctx.tel}">${SITE.phone.display}</a>.</p>
      </div>
    </div>

    <aside class="reserve-side">
      <div class="side-card">
        <h2 class="side-h">Rather talk now?</h2>
        <a class="side-link" href="${ctx.tel}">${ctx.icon('phone')}<span><b>Call us</b>${SITE.phone.display}</span></a>
        <a class="side-link" href="${ctx.sms}">${ctx.icon('chat')}<span><b>Text us</b>${SITE.phone.display}</span></a>
        <a class="side-link" href="mailto:${SITE.email}">${ctx.icon('mail')}<span><b>Email</b>${SITE.email}</span></a>
      </div>
      <div class="side-card">
        <h2 class="side-h">The shop</h2>
        <address><a class="side-link" href="${SITE.mapsUrl}" target="_blank" rel="noopener">${ctx.icon('pin')}<span><b>${SITE.address.street}</b>${SITE.address.city}, ${SITE.address.region} ${SITE.address.zip}</span></a></address>
        <p class="side-link">${ctx.icon('clock')}<span><b>Hours</b>${SITE.hoursNote}</span></p>
      </div>
      ${SITE.showPrices ? `<div class="side-card side-rates"><h2 class="side-h">Rates</h2>${rateTable(ctx)}</div>` : ''}
    </aside>
  </div>
</section>`;
  },
};

// ============================== 404 ==============================

const notFound = {
  slug: '404',
  file: '404.html',
  noindex: true,
  inSitemap: false,
  title: 'Page Not Found | Bridger Bayworks',
  description: 'That page is not here. Head back to the Bridger Bayworks DIY Garage home page, or reserve a bay and tell us what you are working on today.',
  bodyClass: 'page-inner',
  body: (ctx) => `<section class="page-hero page-hero-short">
  <div class="wrap page-hero-inner">
    <p class="kicker kicker-light">404</p>
    <h1>Wrong <span class="blue-light">bay</span>.</h1>
    <p class="lead">That page isn’t here. The shop still is.</p>
    <div class="btn-row">
      <a class="btn btn-yellow btn-lg" href="${ctx.reserve()}"><span>Reserve a Bay</span></a>
      <a class="btn btn-ghost-light btn-lg" href="${ctx.link('')}"><span>Home</span></a>
    </div>
  </div>
  ${ridge('dark')}
</section>`,
};

export const PAGES = [home, lift, tools, diag, rates, how, about, bozeman, reserve, notFound];
