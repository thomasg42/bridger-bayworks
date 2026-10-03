// Reusable page sections. The lift story is this site's signature move: scrolling through
// "How it works" raises a car on a two-post lift, one step at a time.

export const STEPS = [
  ['Tell Max your plan', 'Choose your job and hours. Send your request to Max.'],
  ['Confirm your bay', 'Max confirms your time and price. Then bring your vehicle and parts.'],
  ['Use our equipment', 'Lifts, tools, and a clean workspace.'],
  ['Get it done', 'Work at your own pace with our crew nearby if you need help.'],
];

const liftSvg = `<svg class="lift-svg" viewBox="0 0 400 260" role="img" aria-labelledby="lift-svg-title">
  <title id="lift-svg-title">A car rising on a two-post lift</title>
  <ellipse class="lift-shadow" cx="203" cy="238" rx="140" ry="6"/>
  <g class="lift-post">
    <rect x="28" y="18" width="344" height="9" rx="2"/>
    <rect x="34" y="24" width="16" height="212"/><rect x="26" y="232" width="32" height="6" rx="2"/>
    <rect x="350" y="24" width="16" height="212"/><rect x="342" y="232" width="32" height="6" rx="2"/>
  </g>
  <line class="lift-floor" x1="6" y1="238" x2="394" y2="238"/>
  <g class="lift-load" data-lift-load>
    <g class="lift-arms">
      <rect x="31" y="194" width="22" height="26" rx="3"/><rect x="347" y="194" width="22" height="26" rx="3"/>
      <rect x="50" y="205" width="78" height="7" rx="2"/><rect x="272" y="205" width="78" height="7" rx="2"/>
      <rect x="112" y="200" width="14" height="6" rx="1"/><rect x="274" y="200" width="14" height="6" rx="1"/>
    </g>
    <g class="lift-car">
      <path class="car-body" d="M74 200L74 182Q76 170 92 167L132 162Q152 136 182 128L246 126Q270 128 292 154L318 160Q332 164 332 180L332 200Z"/>
      <path class="car-glass" d="M141 160Q157 141 182 134L209 133L209 160Z M215 133L244 132Q261 134 279 158L215 160Z"/>
      <line class="car-line" x1="212" y1="163" x2="212" y2="198"/>
      <rect class="car-lamp" x="323" y="169" width="9" height="6" rx="1.5"/>
      <circle class="car-tire" cx="122" cy="214" r="22"/><circle class="car-hub" cx="122" cy="214" r="9"/>
      <circle class="car-tire" cx="284" cy="214" r="22"/><circle class="car-hub" cx="284" cy="214" r="9"/>
    </g>
  </g>
</svg>`;

export function liftStory(ctx, { heading = 'How it <span class="blue">works</span>', headingTag = 'h2', ctaText = 'Start with step one' } = {}) {
  const steps = STEPS.map(([t, d], i) =>
    `<li class="lift-step${i === 0 ? ' is-active' : ''}" data-step="${i}"><span class="lift-n" aria-hidden="true">${i + 1}</span><div><h3>${t}</h3><p>${d}</p></div><span class="step-arrow" aria-hidden="true">→</span></li>`).join('');
  return `<section class="lift-story" data-lift-story aria-labelledby="lift-title">
  <div class="lift-sticky">
    <div class="wrap">
      <div class="lift-head">
        <p class="kicker">Simple steps. Real progress.</p>
        <${headingTag} id="lift-title">${heading}</${headingTag}>
      </div>
      <div class="lift-grid">
        <div class="lift-visual"><img class="process-photo" src="${ctx.asset('photos/shop-lift.jpg')}" alt="The professional blue lift at Bridger Bayworks" width="1050" height="1400" loading="lazy"><span class="photo-label">Your workspace in Belgrade</span><div class="lift-blueprint" aria-hidden="true">${liftSvg}</div><div class="lift-meter" aria-hidden="true"><span data-lift-meter></span></div></div>
        <div class="lift-copy">
          <ol class="lift-steps">${steps}</ol>
          <a class="btn btn-royal" href="${ctx.reserve()}"><span>${ctaText}</span>${ctx.icon('arrow')}</a>
        </div>
      </div>
    </div>
  </div>
</section>`;
}

export function serviceCards(ctx) {
  const cards = [
    ['lift', 'Lift Rental', 'Work on your own car or truck in a professional space. Same lifts the pros use.', ctx.price('lift', '/hr'), 'lift-rental', 'See lift rental'],
    ['wrench', 'Tool Rental', 'Quality tools on site, plus 1/2" and 3/8" impact guns when the bolts fight back.', ctx.price('tools', '/hr'), 'tool-rental', 'See tool rental'],
    ['engine', 'Diagnostics', 'Scan tools and equipment to find the problem, then fix it on the lift.', 'Ask Max', 'diagnostics', 'See diagnostics'],
    ['gear', 'A Clean, Well-Equipped Shop', 'Lifts, workbenches, compressors and more. Spacious bays for any size project.', '7 days a week', 'how-it-works', 'See how it works'],
  ];
  return `<div class="cards">${cards.map(([ic, t, d, chip, href, more], i) => `
    <a class="card service-card reveal" style="--i:${i}" href="${ctx.link(href)}">
      <div class="card-photo"><img src="${ctx.asset('photos/' + ['shop-lift', 'tools', 'diagnostics', 'shop-door'][i] + '.jpg')}" alt="${['Blue two-post lift at Bridger Bayworks', 'Illustration of workshop tools and impact guns', 'Illustration of a brake inspection', 'Bridger Bayworks shop entrance'][i]}" width="768" height="512" loading="lazy"><span class="photo-label">${[ 'The actual shop', 'Illustrative equipment', 'Illustrative scene', 'The actual shop'][i]}</span><span class="card-photo-icon">${ctx.icon(ic)}</span></div>
      <h3>${t}</h3>
      <p>${d}</p>
      <span class="card-foot"><span class="chip">${chip}</span><span class="card-more">${more}${ctx.icon('arrow')}</span></span>
    </a>`).join('')}
  </div>`;
}

export function diagnosticScene(ctx) {
  return `<section class="section diagnostic-section" aria-label="Tell Max what your car is doing">
    <div class="wrap diagnostic-grid">
      <figure class="diagnostic-photo reveal">
        <img src="${ctx.asset('photos/diagnostics.jpg')}" alt="Illustrative scene of two people pointing out a worn brake rotor, with oil draining into a catch pan" width="1536" height="1024" loading="lazy">
        <figcaption>Illustrative diagnostic scene</figcaption>
        <span class="inspection-marker marker-brake" aria-hidden="true"></span>
        <span class="inspection-marker marker-oil" aria-hidden="true"></span>
      </figure>
      <div class="diagnostic-copy reveal">
        <p class="kicker kicker-light">A sound. A leak. A warning light.</p>
        <h2>See what’s <span class="blue-light">going on.</span></h2>
        <p>Tell Max what you’re noticing. Find out which bay, tools, and support fit your project.</p>
        <div class="symptom-list">
          <a href="${ctx.reserve({service:'diagnostics', symptom:'rattle'})}"><span class="symptom-icon rattle">${ctx.icon('engine')}</span><span><strong>Rattles &amp; noises</strong><small>When does it happen?</small></span>${ctx.icon('arrow')}</a>
          <a href="${ctx.reserve({service:'diagnostics', symptom:'leak'})}"><span class="symptom-icon oil-drop">${ctx.icon('drop')}</span><span><strong>Oil spots &amp; leaks</strong><small>What are you seeing underneath?</small></span>${ctx.icon('arrow')}</a>
          <a href="${ctx.reserve({service:'diagnostics', symptom:'brakes'})}"><span class="symptom-icon brake-ring">${ctx.icon('gear')}</span><span><strong>Worn brakes</strong><small>Describe the noise or feel.</small></span>${ctx.icon('arrow')}</a>
        </div>
        <a class="btn btn-yellow" href="${ctx.reserve({service:'diagnostics'})}"><span>Talk through your project</span>${ctx.icon('arrow')}</a>
      </div>
    </div>
  </section>`;
}

export function communityScene(ctx) {
  return `<section class="community-feature section" aria-label="A place for local mechanics and DIYers">
    <div class="wrap community-feature-grid">
      <div class="reveal"><p class="kicker kicker-light">Good people. Shared know-how.</p><h2>Local mechanics.<br>Weekend wrenchers.<br><span class="blue-light">Your kind of people.</span></h2><p class="section-lead">We support our local mechanics and the people who want to work on their own cars. Bring your project, share what you know, and learn something along the way.</p><a class="btn btn-yellow" href="${ctx.reserve()}"><span>Find your bay</span>${ctx.icon('arrow')}</a></div>
      <figure class="community-photo reveal"><img src="${ctx.asset('photos/community.jpg')}" alt="Illustration of three car enthusiasts sharing knowledge around a pickup engine" width="1536" height="1024" loading="lazy"><figcaption>Illustrative community scene</figcaption></figure>
    </div>
  </section>`;
}

export function whyList(ctx) {
  const items = [
    ['lift', 'Professional lifts', 'Same equipment the pros use.'],
    ['wrench', 'Quality tools on site', 'Get the job done right.'],
    ['toolbox', 'Clean and spacious bays', 'Room to work on any size project.'],
    ['people', 'DIY-friendly environment', 'Work at your own pace.'],
    ['cap', 'Knowledgeable crew', 'Here to help when you need it.'],
    ['truck', 'Cars and trucks welcome', 'All makes and models.'],
  ];
  return `<ul class="why">${items.map(([ic, t, d], i) =>
    `<li class="reveal" style="--i:${i}">${ctx.icon(ic)}<div><h3>${t}</h3><p>${d}</p></div></li>`).join('')}</ul>`;
}

export function ratesStrip(ctx) {
  const { SITE } = ctx;
  if (!SITE.showPrices) {
    return `<div class="rates-strip reveal"><p class="rates-ask">Simple hourly pricing. Ask Max for current rates.</p></div>`;
  }
  const r = SITE.rates;
  return `<ul class="rates-strip">
    <li class="reveal" style="--i:0"><strong>${ctx.count('lift')}<small>/hr</small></strong><span>Lift and shop time</span></li>
    <li class="reveal" style="--i:1"><strong>${ctx.count('tools')}<small>/hr</small></strong><span>Tool access</span></li>
    <li class="reveal" style="--i:2"><strong>${ctx.count('impact')}<small>/hr</small></strong><span>3/8" and 1/2" impact guns</span></li>
    <li class="reveal" style="--i:3"><strong>${ctx.count('oilDisposal')}</strong><span>Used oil disposal</span></li>
  </ul>
  <p class="rates-note reveal">Here more than ${r.regularHours} hours a month, month after month? Your lift rate drops to <strong>$${r.liftRegular}/hr</strong>.</p>`;
}

export function planBuilder(ctx) {
  const { SITE } = ctx;
  if (!SITE.showPrices) return '';
  const r = SITE.rates;
  const hours = 3;
  return `<div class="plan" id="plan" data-plan>
  <div class="plan-controls">
    <h2 class="plan-h">Plan your bay time</h2>
    <label class="plan-hours" for="plan-hours">Hours on the lift <output id="plan-hours-out" for="plan-hours">${hours}</output></label>
    <input type="range" id="plan-hours" min="1" max="12" step="1" value="${hours}">
    <fieldset class="plan-adds">
      <legend>Add-ons</legend>
      <label class="check"><input type="checkbox" id="plan-tools"><span>Tool access</span><em>+$${r.tools}/hr</em></label>
      <label class="check"><input type="checkbox" id="plan-impact"><span>Impact guns</span><em>+$${r.impact}/hr</em></label>
      <label class="check"><input type="checkbox" id="plan-coolant"><span>Coolant disposal</span><em>+$${r.coolantDisposal}</em></label>
    </fieldset>
    <p class="plan-free">${ctx.icon('drop')}<span>Used oil disposal is free.</span></p>
  </div>
  <div class="plan-total">
    <p class="plan-label">Estimated total</p>
    <p class="plan-amount"><output id="plan-total">$${hours * r.lift}</output></p>
    <p class="plan-break" id="plan-break">${hours} hrs lift and shop time</p>
    <a class="btn btn-yellow btn-lg" id="plan-send" href="${ctx.reserve({ service: 'lift', hours })}"><span>Send this plan to Max</span></a>
    <p class="fine">Estimate only. Max confirms your price when he books your bay.</p>
  </div>
</div>`;
}

export function rateTable(ctx) {
  const { SITE } = ctx;
  const rows = [
    ['lift', 'Lift and shop time', ctx.price('lift', ' per hour')],
    ['wrench', 'Tool access', ctx.price('tools', ' per hour')],
    ['impact', '3/8" and 1/2" impact guns', ctx.price('impact', ' per hour')],
    ['drop', 'Used oil disposal', ctx.price('oilDisposal')],
    ['drop', 'Coolant disposal', ctx.price('coolantDisposal')],
  ];
  return `<table class="rate-table">
    <caption class="sr-only">${SITE.shortName} shop rates</caption>
    <thead><tr><th scope="col">What you get</th><th scope="col">Rate</th></tr></thead>
    <tbody>${rows.map(([ic, t, p]) => `<tr><th scope="row">${ctx.icon(ic)}<span>${t}</span></th><td>${p}</td></tr>`).join('')}</tbody>
  </table>`;
}
