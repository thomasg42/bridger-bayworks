// Run: node --test tests/   (from website/). No install needed; linkedom is borrowed from cortana-ui.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import vm from 'node:vm';
import { SITE } from '../site.config.mjs';
import { PAGES } from '../src/pages.mjs';
import { makeCtx, renderPage } from '../src/layout.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const WEB = resolve(here, '..');
const DOCS = join(WEB, 'docs');
const require = createRequire(import.meta.url);
const Core = require('../src/assets/bb-core.js');

function loadLinkedom() {
  for (const p of ['linkedom', resolve(WEB, '../../../../cortana-ui/node_modules/linkedom')]) {
    try { return require(p); } catch { /* try next */ }
  }
  return null;
}
const linkedom = loadLinkedom();
const parse = (html) => linkedom.parseHTML(html);

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const htmlFiles = walk(DOCS).filter((p) => p.endsWith('.html'));
const pages = htmlFiles.map((file) => {
  const html = readFileSync(file, 'utf8');
  return { file, rel: relative(DOCS, file), html, document: linkedom ? parse(html).document : null };
});
const visibleText = (document) => {
  const body = document.querySelector('body').cloneNode(true);
  body.querySelectorAll('script, style, svg').forEach((n) => n.remove());
  return body.textContent;
};

test('linkedom is available (DOM checks need it)', () => assert.ok(linkedom, 'linkedom not found; run npm i linkedom or keep cortana-ui/node_modules'));

test('docs/ is exactly what build.mjs produces (nobody hand-edited the output)', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'bb-build-'));
  try {
    execFileSync(process.execPath, [join(WEB, 'build.mjs'), '--out', tmp], { stdio: 'pipe' });
    const a = walk(tmp).map((p) => relative(tmp, p)).sort();
    const b = walk(DOCS).map((p) => relative(DOCS, p)).sort();
    assert.deepEqual(b, a, 'file list differs; run node build.mjs');
    for (const f of a) assert.ok(readFileSync(join(tmp, f)).equals(readFileSync(join(DOCS, f))), `${f} is stale; run node build.mjs`);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});

test('every page: one h1, title <= 60, description 110-160, canonical, og image, valid JSON-LD', () => {
  const titles = new Set(), descs = new Set();
  for (const p of pages) {
    const d = p.document;
    assert.equal(d.querySelectorAll('h1').length, 1, `${p.rel}: needs exactly one h1`);
    const title = d.querySelector('title').textContent;
    assert.ok(title.length <= 60, `${p.rel}: title ${title.length} chars: ${title}`);
    const desc = d.querySelector('meta[name="description"]').getAttribute('content');
    assert.ok(desc.length >= 110 && desc.length <= 160, `${p.rel}: description ${desc.length} chars`);
    assert.ok(!titles.has(title), `${p.rel}: duplicate title`); titles.add(title);
    assert.ok(!descs.has(desc), `${p.rel}: duplicate description`); descs.add(desc);
    const canon = d.querySelector('link[rel="canonical"]').getAttribute('href');
    assert.ok(canon.startsWith(SITE.url), `${p.rel}: canonical ${canon}`);
    assert.ok(d.querySelector('meta[property="og:image"]'), `${p.rel}: og:image`);
    assert.equal(d.querySelector('html').getAttribute('lang'), 'en-US');
    d.querySelectorAll('script[type="application/ld+json"]').forEach((s) => assert.doesNotThrow(() => JSON.parse(s.textContent), `${p.rel}: bad JSON-LD`));
    const robots = d.querySelector('meta[name="robots"]');
    if (!SITE.launched || p.rel === '404.html') assert.ok(robots && /noindex/.test(robots.getAttribute('content')), `${p.rel}: preview must be noindex`);
    else assert.ok(!robots, `${p.rel}: launched page must be indexable`);
  }
});

test('home page carries the full LocalBusiness schema with the real NAP', () => {
  const d = pages.find((p) => p.rel === 'index.html').document;
  const ld = [...d.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent));
  const biz = ld.find((o) => o['@type'] === 'AutomotiveBusiness');
  assert.ok(biz);
  assert.equal(biz.telephone, '+14062336598');
  assert.equal(biz.address.streetAddress, '201 S Weaver St, Building A');
  assert.equal(biz.address.postalCode, '59714');
  assert.ok(!('openingHoursSpecification' in biz), 'exact hours are UNCONFIRMED; do not invent them');
});

test('home page town chips keep names readable inside their white boxes', () => {
  const d = pages.find((p) => p.rel === 'index.html').document;
  const towns = d.querySelector('.towns');
  assert.ok(towns, 'home page needs the local towns section');
  assert.deepEqual([...towns.querySelectorAll('li')].map((li) => li.textContent.trim()),
    ['Bozeman', 'Manhattan', 'Three Forks', 'Four Corners', 'Gallatin Gateway']);
  const css = readFileSync(join(WEB, 'src/assets/site.css'), 'utf8');
  assert.match(css, /\.towns li a \{ color: var\(--navy-800\);/);
  assert.match(css, /\.towns li \{[^}]*padding: 6px 10px/);
});

test('every internal link and asset resolves to a built file', () => {
  const base = SITE.url.replace(/\/$/, '') + '/';
  for (const p of pages) {
    const refs = [...p.document.querySelectorAll('a[href], link[href], script[src], img[src], video[data-src], video[poster]')]
      .flatMap((n) => ['href', 'src', 'data-src', 'poster'].map((a) => n.getAttribute(a)).filter(Boolean));
    for (let ref of refs) {
      if (/^(tel:|sms:|mailto:|#)/.test(ref)) continue;
      const isAbs = ref.startsWith(base);
      if (isAbs) ref = ref.slice(base.length) || './';
      else if (/^https?:/.test(ref)) continue;
      const clean = ref.split('#')[0].split('?')[0];
      if (!clean) continue;
      let target = isAbs || p.rel === '404.html' ? join(DOCS, clean) : resolve(dirname(p.file), clean);
      if (clean.endsWith('/') || clean === '.' || clean === './') target = join(target, 'index.html');
      assert.ok(existsSync(target), `${p.rel}: broken link ${ref}`);
    }
  }
});

test('every page gives a path to Max: reserve link, call, and text', () => {
  for (const p of pages) {
    const hrefs = [...p.document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
    assert.ok(hrefs.some((h) => /reserve\/(\?|$)/.test(h)), `${p.rel}: no reserve link`);
    assert.ok(hrefs.includes('tel:+14062336598'), `${p.rel}: no call link`);
    assert.ok(hrefs.some((h) => h.startsWith('sms:+14062336598')), `${p.rel}: no text link`);
    for (const h of hrefs.filter((x) => x.startsWith('tel:'))) assert.equal(h, 'tel:+14062336598');
  }
});

test('copy rules: no em or en dashes anywhere a visitor reads', () => {
  for (const p of pages) {
    const text = visibleText(p.document) + p.document.querySelector('title').textContent
      + p.document.querySelector('meta[name="description"]').getAttribute('content');
    assert.ok(!/[—–]/.test(text), `${p.rel}: contains an em/en dash`);
  }
});

test('nothing UNCONFIRMED leaks: no motorcycle lifts, no invented hours, no referral numbers', () => {
  for (const p of pages) {
    const t = visibleText(p.document).toLowerCase();
    assert.ok(!/\b\d{1,2}(:\d\d)?\s?(am|pm)\b/.test(t), `${p.rel}: shows clock hours`);
    assert.ok(!/(\d+ free hours|earn \d+|refer \d+)/.test(t), `${p.rel}: publishes referral terms`);
    assert.ok(!/motorcycle (lift|repair|service)/.test(t), `${p.rel}: claims motorcycle lift work`);
    assert.ok(!/(insured|licensed|certified|warranty|guarantee)/.test(t), `${p.rel}: unconfirmed claim`);
  }
});

test('prices come from config, and showPrices:false removes every one', () => {
  const rates = pages.find((p) => p.rel === 'rates/index.html');
  if (SITE.showPrices) assert.ok(visibleText(rates.document).includes(`$${SITE.rates.lift}`));
  const hidden = { ...SITE, showPrices: false };
  for (const page of PAGES) {
    const html = renderPage(makeCtx(hidden, page.slug, { absolute: page.slug === '404' }), page);
    const { document } = parse(html);
    const t = visibleText(document);
    assert.ok(!/\$\d/.test(t), `${page.slug || 'home'}: price visible with showPrices:false`);
    assert.ok(!/"price":/.test(html), `${page.slug || 'home'}: price left in JSON-LD`);
  }
});

test('sitemap lists every indexable page; robots blocks the preview', () => {
  const sm = readFileSync(join(DOCS, 'sitemap.xml'), 'utf8');
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.equal(locs.length, PAGES.filter((p) => p.inSitemap !== false && !p.noindex).length);
  assert.ok(!locs.some((l) => l.includes('404')));
  const robots = readFileSync(join(DOCS, 'robots.txt'), 'utf8');
  if (!SITE.launched) assert.match(robots, /Disallow: \//);
  else assert.match(robots, /Sitemap:/);
});

test('signature move: the lift story is on home and how-it-works with four steps', () => {
  for (const rel of ['index.html', 'how-it-works/index.html']) {
    const d = pages.find((p) => p.rel === rel).document;
    assert.ok(d.querySelector('[data-lift-story] [data-lift-load]'), `${rel}: lift story missing`);
    assert.equal(d.querySelectorAll('.lift-step').length, 4);
  }
});

test('hero: the shop clip plays on a loop behind the text, poster first; h1 and both CTAs intact', () => {
  const d = pages.find((p) => p.rel === 'index.html').document;
  const hero = d.querySelector('[data-hero-slot="higgsfield"]');
  assert.ok(hero && hero.querySelector('.hero-media'));
  assert.equal(hero.querySelector('h1').textContent, 'DIY Garage & Lift Rental in Belgrade, MT');
  assert.ok(hero.querySelector('a[href^="./reserve/"]'), 'Reserve a Bay button');
  assert.ok(hero.querySelector('a[href="tel:+14062336598"]'), 'Call or text Max button');
  const media = hero.querySelector('.hero-media');
  assert.equal(media.getAttribute('aria-hidden'), 'true', 'decorative');
  assert.ok(media.querySelector('img.hero-poster[src*="shop-lift-poster.jpg"]'), 'poster renders with no JS');
  const v = media.querySelector('video[data-hero-video]');
  // The 1 MB, 6 s original (loop endpoints QA'd), not the 3.2 MB scrub encode.
  assert.ok(v && /hero\/shop-lift-hero\.mp4\?/.test(v.getAttribute('data-src')), 'plays the original loop clip');
  assert.ok(statSync(join(DOCS, 'assets/hero/shop-lift-hero.mp4')).size < 1.5e6, 'hero clip stays small');
  assert.ok(!v.hasAttribute('src'), 'video downloads only after JS checks reduced motion and Save-Data');
  for (const a of ['autoplay', 'muted', 'loop', 'playsinline']) assert.ok(v.hasAttribute(a), a);
  assert.equal(v.getAttribute('tabindex'), '-1');
  assert.ok(!media.querySelector('canvas'), 'no scrub canvas left behind');
  assert.ok(hero.querySelector('.hero-inner .hero-copy h1'), 'copy sits in the overlay layer');
  assert.ok(!hero.querySelector('.hero-film-label'), 'no "shop in motion / AI visualization" label');
  const toggle = hero.querySelector('button[data-video-toggle]');
  assert.ok(toggle && toggle.hasAttribute('hidden') && toggle.getAttribute('aria-label'), 'pause button, shown by JS once the clip plays');
  const css = readFileSync(join(WEB, 'src/assets/site.css'), 'utf8');
  assert.match(css, /\[hidden\] \{ display: none !important; \}/, 'hidden beats the toggle grid');
  assert.ok(!/is-scrub|--hero-scrub/.test(css), 'no scroll-scrub track left in the CSS');
  const js = readFileSync(join(WEB, 'src/assets/site.js'), 'utf8');
  assert.match(js, /classList\.add\('is-playing'\)/, 'video fades in only once it is really playing');
});

test('reserve form contract (what site-qa will hammer)', () => {
  const d = pages.find((p) => p.rel === 'reserve/index.html').document;
  const form = d.querySelector('form#reserve-form');
  assert.ok(form);
  for (const n of ['service', 'name', 'phone', 'vehicle', 'details']) assert.ok(form.querySelector(`[name="${n}"]`).hasAttribute('required'), `${n} required`);
  for (const n of ['name', 'phone', 'email', 'vehicle', 'details']) assert.ok(form.querySelector(`[name="${n}"]`).getAttribute('maxlength'), `${n} maxlength`);
  const pat = form.querySelector('[name="phone"]').getAttribute('pattern');
  assert.doesNotThrow(() => new RegExp(`^(?:${pat})$`, 'v'), 'phone pattern must compile in v-mode or browsers ignore it');
  assert.ok(new RegExp(`^(?:${pat})$`, 'v').test('(406) 233-6598'));
  assert.ok(!new RegExp(`^(?:${pat})$`, 'v').test('abc'));
  // AutoFill fills a field called "company" from the visitor's contact card, which would trip the trap.
  assert.ok(form.querySelector('.hp input[name="bb_check"]'), 'honeypot');
  assert.ok(!form.querySelector('[name="company"]'), 'no AutoFill-bait honeypot name');
  assert.equal(form.querySelector('button').getAttribute('type'), 'submit');
  if (!SITE.leadEndpoint) assert.ok(!form.hasAttribute('action'), 'no endpoint: form must not post anywhere');
  else assert.equal(form.getAttribute('action'), SITE.leadEndpoint);
});

test('reserve form: the fields Thomas asked for on 2026-11-02', () => {
  const d = pages.find((p) => p.rel === 'reserve/index.html').document;
  const form = d.querySelector('form#reserve-form');
  const opts = (name) => [...form.querySelectorAll(`select[name="${name}"] option`)].map((o) => [o.getAttribute('value'), o.textContent.trim()]);
  // Three choices, lift time first.
  assert.deepEqual(opts('service'), [['', 'Choose one'], ['lift', 'Lift time'], ['diagnostics', 'Diagnostics and scan tools'], ['quote', 'Just get a quote']]);
  assert.deepEqual(Object.keys(Core.SERVICE_LABELS), ['lift', 'diagnostics', 'quote'], 'labels Max reads match the form');
  // Name, phone, email (optional), vehicle, in that order after the choice.
  const order = [...form.querySelectorAll('[name]')].map((n) => n.getAttribute('name')).filter((n) => n !== 'bb_check');
  assert.deepEqual(order.slice(0, 5), ['service', 'name', 'phone', 'email', 'vehicle']);
  assert.ok(!form.querySelector('[name="email"]').hasAttribute('required'), 'email optional');
  assert.equal(form.querySelector('[name="vehicle"]').getAttribute('autocomplete'), 'off', 'vehicle is not AutoFill material');
  // Job presets show the time that goes on the calendar; anything else, we call.
  assert.deepEqual(opts('job'), [['', 'Not sure yet'], ['oil-change', 'Oil change (1 hr)'], ['wheel-bearings', 'Wheel bearings (6 hrs)'], ['other', 'Something else']]);
  assert.ok(!form.querySelector('[name="hours"]'), 'no do-it-yourself hours list any more');
  const picker = form.querySelector('fieldset#slot-picker[name="slot"]');
  assert.ok(picker && picker.hasAttribute('hidden'), 'day/time picker, shown by JS');
  assert.ok(form.querySelector('#callback [name="date"]'), 'call-back path keeps an optional preferred day');
  assert.match(form.querySelector('#callback-note').textContent, /call you to set a time/);
  // Add-ons: tool access, impact guns, coolant disposal.
  assert.deepEqual([...form.querySelectorAll('.checks input')].map((i) => i.getAttribute('name')), ['tools', 'impact', 'coolant']);
  assert.match(form.querySelector('label[for="f-details"]').textContent, /Describe what’s going on with your car/);
  const consent = form.querySelector('.consent').textContent;
  assert.match(consent, /email notifications/);
  assert.ok(!/text message/i.test(consent), 'no text-message consent');
  // "Rather talk now?" is one bubble with the number, Call and Text inside it.
  const card = d.querySelector('.reserve-side .side-card');
  assert.equal(card.querySelector('.side-h').textContent, 'Rather talk now?');
  assert.equal(card.querySelectorAll('.side-link').length, 1);
  assert.match(card.querySelector('.side-link').textContent, /Call or text\s*406-233-6598/);
  assert.deepEqual([...card.querySelectorAll('a')].map((a) => a.getAttribute('href')), ['tel:+14062336598', 'sms:+14062336598']);
});

test('old ?service= links still land on a real choice', () => {
  assert.equal(Core.parsePlan('?service=tools').service, 'lift');
  assert.equal(Core.parsePlan('?service=tools').tools, true, 'tool rental = lift time + tool access');
  assert.equal(Core.parsePlan('?service=regular').service, 'quote');
  assert.equal(Core.parsePlan('?service=other').service, 'quote');
  for (const p of pages) {
    for (const a of p.document.querySelectorAll('a[href*="reserve/?"]')) {
      const svc = new URLSearchParams(a.getAttribute('href').split('?')[1]).get('service');
      if (svc) assert.ok(Object.prototype.hasOwnProperty.call(Core.SERVICE_LABELS, svc), `${p.rel}: links to retired service=${svc}`);
    }
  }
});

test('disposal fees read from config everywhere (oil disposal is free)', () => {
  const r = SITE.rates;
  assert.equal(r.oilDisposal, 0, 'Max: used oil disposal is free');
  const rates = visibleText(pages.find((p) => p.rel === 'rates/index.html').document);
  if (SITE.showPrices) {
    assert.match(rates, /Used oil disposal\s*Free/);
    assert.match(rates, /Used oil disposal is free\./, 'plan builder line');
  }
  const how = visibleText(pages.find((p) => p.rel === 'how-it-works/index.html').document);
  if (SITE.showPrices) assert.match(how, new RegExp(`Used oil disposal is free and coolant disposal is \\$${r.coolantDisposal}`));
});

test('estimate math', () => {
  const r = SITE.rates;
  assert.equal(Core.estimate(r, { hours: 3 }).total, 3 * r.lift);
  assert.equal(Core.estimate(r, { hours: 2, tools: true, impact: true, coolant: true }).total, 2 * r.lift + 2 * r.tools + 2 * r.impact + r.coolantDisposal);
  assert.equal(Core.estimate(r, { hours: 99 }).hours, 12);
  assert.equal(Core.estimate(r, { hours: 'x' }).hours, 1);
});

test('URL plan parsing ignores junk and round-trips', () => {
  assert.deepEqual(Core.parsePlan('?service=drop%20table&hours=<b>'), { service: '', hours: null, tools: false, impact: false, coolant: false });
  const p = { service: 'lift', hours: 4, tools: true, impact: false, coolant: true };
  assert.deepEqual(Core.parsePlan('?' + Core.planQuery(p)), p);
});

// ---------- booking rules (Thomas, 2026-11-02) ----------

const B = SITE.booking;
const DENVER = 'America/Denver';
const at = (iso) => Date.parse(iso);

test('booking: what books a slot, and for how long', () => {
  const cfg = { jobs: SITE.jobs, booking: B };
  assert.equal(Core.bookingHours({ service: 'lift', job: 'oil-change' }, cfg), 1, 'oil change: 1 hour max');
  assert.equal(Core.bookingHours({ service: 'lift', job: 'wheel-bearings' }, cfg), 6, 'wheel bearings: 5 hr job + 1');
  assert.equal(Core.bookingHours({ service: 'diagnostics', job: '' }, cfg), 1, 'a diagnosis books one hour');
  assert.equal(Core.bookingHours({ service: 'lift', job: 'other' }, cfg), null, 'any other job: we call');
  assert.equal(Core.bookingHours({ service: 'lift', job: '' }, cfg), null);
  assert.equal(Core.bookingHours({ service: 'quote', job: 'oil-change' }, cfg), null, 'a quote never books');
  assert.match(Core.jobHint(Core.findJob(SITE.jobs, 'wheel-bearings')), /about 5 hrs of work\. We book 6 hrs/);
  assert.equal(Core.jobHint(Core.findJob(SITE.jobs, 'oil-change')), 'Oil change: we book 1 hr.');
  assert.deepEqual([B.timeZone, B.openHour, B.closeHour, B.firstDay], [DENVER, 9, 18, 2]);
});

test('booking: Monday offers Wednesday first, on the shop clock', () => {
  // Monday Nov 2, 2026 at 10 PM in Belgrade is already Tuesday in UTC.
  const days = Core.bookingDays(at('2026-11-03T05:00:00Z'), B);
  assert.equal(days[0], '2026-11-04');
  assert.equal(days.length, B.days);
  assert.equal(days[days.length - 1], Core.addDaysKey('2026-11-04', B.days - 1));
  assert.equal(Core.bookingDays(at('2026-12-31T17:00:00Z'), B)[0], '2027-01-02', 'rolls the year');
  assert.equal(Core.dayLabel('2026-11-04'), 'Wed Nov 4, 2026');
  assert.equal(Core.dayShort('2026-11-04'), 'Wed Nov 4');
});

test('booking: wall-clock times convert right in winter, summer and on change days', () => {
  assert.equal(new Date(Core.zonedToUtc('2026-11-04', 9, DENVER)).toISOString(), '2026-11-04T16:00:00.000Z', 'MST');
  assert.equal(new Date(Core.zonedToUtc('2027-06-15', 9, DENVER)).toISOString(), '2027-06-15T15:00:00.000Z', 'MDT');
  assert.equal(new Date(Core.zonedToUtc('2026-11-01', 9, DENVER)).toISOString(), '2026-11-01T16:00:00.000Z', 'clocks fell back that night');
  assert.equal(new Date(Core.zonedToUtc('2027-03-14', 9, DENVER)).toISOString(), '2027-03-14T15:00:00.000Z', 'clocks sprang forward that night');
  assert.equal(Core.dateKeyInZone(at('2026-11-03T05:00:00Z'), DENVER), '2026-11-02');
  assert.deepEqual([9, 12, 17, 18, 0].map(Core.hourLabel), ['9:00 AM', '12:00 PM', '5:00 PM', '6:00 PM', '12:00 AM']);
});

test('booking: open times fit inside 9 to 6 and never overlap the calendar', () => {
  const day = '2026-11-04';
  assert.deepEqual(Core.openStarts(day, 1, [], B), [9, 10, 11, 12, 13, 14, 15, 16, 17], 'last 1 hr start ends at 6 PM');
  assert.deepEqual(Core.openStarts(day, 6, [], B), [9, 10, 11, 12], 'wheel bearings must finish by 6 PM');
  const vip = Core.normalizeBusy([{ start: '2026-11-04T11:00:00-07:00', end: '2026-11-04T12:30:00-07:00' }], DENVER);
  assert.deepEqual(Core.openStarts(day, 1, vip, B), [9, 10, 13, 14, 15, 16, 17], 'a VIP from 11 to 12:30 blocks 11 and 12');
  assert.deepEqual(Core.openStarts(day, 6, vip, B), [], 'no 6 hr window left');
  const allDay = Core.normalizeBusy([{ allDay: true, start: '2026-11-04', end: '2026-11-05' }], DENVER);
  assert.deepEqual(Core.openStarts(day, 1, allDay, B), [], 'an all-day entry closes the day');
  assert.deepEqual(Core.openStarts('2026-11-05', 1, allDay, B).length, 9, 'and only that day');
  assert.equal(Core.slotLabel(day, 9, 6), 'Wed Nov 4, 9:00 AM to 3:00 PM');
  assert.deepEqual(Core.slotRange(day, 9, 1, DENVER), { start: '2026-11-04T16:00:00.000Z', end: '2026-11-04T17:00:00.000Z' });
});

test('validation refuses what site-qa throws at it', () => {
  const ok = { service: 'lift', name: 'Sam', phone: '406-555-0100', email: '', vehicle: '2006 Silverado', details: 'Brakes' };
  assert.deepEqual(Core.validate(ok), {});
  assert.ok(Core.validate({ ...ok, phone: 'abc' }).phone);
  assert.ok(Core.validate({ ...ok, phone: '12345' }).phone);
  assert.ok(Core.validate({ ...ok, email: 'not-an-email' }).email);
  assert.deepEqual(Object.keys(Core.validate({})).sort(), ['details', 'name', 'phone', 'service', 'vehicle']);
  assert.equal(Core.validate(ok, { needSlot: true }).slot, 'Pick a day and time.');
  assert.equal(Core.validate({ ...ok, date: '2026-11-03' }, { minDate: '2026-11-04' }).date, 'Pick Wed Nov 4 or later.');
  assert.deepEqual(Core.validate({ ...ok, date: '11/04/2026' }, { minDate: '2026-11-04' }), {}, 'free-text date from an old browser is not misread');
});

test('the message Max receives has everything', () => {
  const booked = Core.message({ service: 'lift', name: ' Sam ', phone: '406-555-0100', email: 's@example.test', emailOk: true, vehicle: 'Tacoma', job: 'wheel-bearings', slotLabel: 'Wed Nov 4, 9:00 AM to 3:00 PM', slotHours: 6, tools: true, details: 'Grinding from the front left' }, { jobs: SITE.jobs });
  for (const s of ['Need: Lift time', 'Name: Sam', '406-555-0100', 'Vehicle: Tacoma', 'Job: Wheel bearings (about 5 hrs of work)', 'Booked online: Wed Nov 4, 9:00 AM to 3:00 PM (6 hrs)', 'Add-ons: tool access', "What's going on: Grinding from the front left", 'Email updates OK: yes']) assert.ok(booked.includes(s), s);
  const call = Core.message({ service: 'quote', name: 'Al', phone: '406-555-0101', vehicle: 'Civic', job: '', date: '2026-11-06', details: 'Noise' });
  assert.ok(call.includes('Time: call them to set one. Preferred day: Fri Nov 6, 2026'));
  assert.ok(!call.includes('Email updates OK'), 'no consent line without an email');
  assert.ok(Core.smsHref('+14062336598', booked).startsWith('sms:+14062336598?&body='));
});

// ---------- form behaviour in a DOM shim ----------

// availability: the JSON the n8n endpoint answers with, or a status number to fail with.
function bootReserve({ search = '', endpoint = '', fetchImpl, availability = { ok: true, busy: [] } } = {}) {
  let html = readFileSync(join(DOCS, 'reserve/index.html'), 'utf8');
  // Force the endpoint under test (empty = the text/email handoff path), whatever the build shipped.
  html = html.replace(/ action="[^"]*"/, '').replace(/data-endpoint="[^"]*"/, `data-endpoint="${endpoint}"`);
  const { window, document } = parse(html);
  const form = document.getElementById('reserve-form');
  // linkedom gaps: form.elements and <select>.value.
  form.elements = { namedItem: (n) => form.querySelector(`[name="${n}"]`) };
  form.querySelectorAll('select').forEach((sel) => {
    let v = '';
    Object.defineProperty(sel, 'value', { get: () => v, set: (x) => { v = String(x); } });
  });
  const proto = Object.getPrototypeOf(document.body);
  if (!proto.scrollIntoView) proto.scrollIntoView = () => {};
  const calls = [], lookups = [];
  const ctx = vm.createContext({
    window, document, console, URLSearchParams, Date, JSON, Object, Math, Promise, String, parseInt, isFinite,
    requestAnimationFrame: (f) => f(0),
    fetch: (url, opts) => {
      if (url.startsWith(SITE.booking.availabilityEndpoint)) {
        lookups.push(url);
        if (typeof availability === 'number') return Promise.resolve({ ok: false, status: availability });
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(availability) });
      }
      calls.push({ url, opts });
      return fetchImpl ? fetchImpl(url, opts) : Promise.resolve({ ok: true, status: 200 });
    },
  });
  window.location = { search, href: 'https://example.test/reserve/' + search };
  window.matchMedia = () => ({ matches: false });
  window.scrollY = 0;
  window.addEventListener = window.addEventListener || (() => {});
  window.BB_CONFIG = JSON.parse(readFileSync(join(DOCS, 'assets/config.js'), 'utf8').match(/BB_CONFIG = (.*);/)[1]);
  window.BBCore = Core;
  vm.runInContext(readFileSync(join(DOCS, 'assets/site.js'), 'utf8'), ctx);
  const fill = (vals) => Object.entries(vals).forEach(([k, v]) => {
    const el = form.querySelector(`[name="${k}"]`);
    if (el.type === 'checkbox') el.checked = !!v; else el.value = v;
  });
  const choose = (name, value) => { const el = form.querySelector(`[name="${name}"]`); el.value = value; el.dispatchEvent(new window.Event('change')); };
  const pick = (name, value) => {
    const el = form.querySelector(`input[name="${name}"][value="${value}"]`);
    el.checked = true;
    el.dispatchEvent(new window.Event('change', { bubbles: true }));
  };
  const submit = () => form.dispatchEvent(new window.Event('submit', { cancelable: true }));
  return { window, document, form, fill, choose, pick, submit, calls, lookups };
}
const GOOD = { service: 'lift', name: 'QA Probe', phone: '406-555-0123', vehicle: '2010 F-150', details: 'Front brakes' };
const tick = () => new Promise((r) => setTimeout(r, 0));
const settle = async () => { for (let i = 0; i < 4; i++) await tick(); };

test('form: prefills from a plan link', () => {
  const { form } = bootReserve({ search: '?service=lift&hours=3&tools=1' });
  assert.equal(form.querySelector('[name="service"]').value, 'lift');
  assert.equal(form.querySelector('[name="tools"]').checked, true);
  if (SITE.showPrices) assert.match(form.querySelector('[name="details"]').value, /estimate \$/);
});

test('form: empty submit shows errors and sends nothing', () => {
  const b = bootReserve();
  b.submit();
  assert.equal(b.calls.length, 0);
  assert.equal(b.lookups.length, 0, 'no calendar lookup until something bookable is picked');
  assert.ok(b.document.querySelectorAll('.field.is-invalid').length >= 5);
  assert.equal(b.document.getElementById('form-handoff').hidden, true);
});

test('form: no endpoint hands the visitor a prefilled text and email to Max', () => {
  const b = bootReserve();
  b.fill(GOOD);
  b.submit();
  assert.equal(b.calls.length, 0);
  assert.equal(b.document.getElementById('form-handoff').hidden, false);
  const sms = b.document.getElementById('handoff-sms').getAttribute('href');
  assert.ok(sms.startsWith('sms:+14062336598?&body=') && decodeURIComponent(sms).includes('QA Probe'));
  assert.ok(b.document.getElementById('handoff-mail').getAttribute('href').startsWith('mailto:BridgerBayworks@gmail.com?subject='));
  assert.equal(b.form.querySelector('[name="name"]').value, 'QA Probe', 'values stay in the form');
});

test('form: with an endpoint, success shows thanks; double submit posts once', async () => {
  const b = bootReserve({ endpoint: 'https://hooks.example.test/bb' });
  b.fill(GOOD);
  b.submit(); b.submit();
  await tick();
  assert.equal(b.calls.length, 1);
  assert.equal(JSON.parse(b.calls[0].opts.body).name, 'QA Probe');
  assert.equal(b.document.getElementById('form-thanks').hidden, false);
});

test('form: oil change books a 1 hr slot straight from the calendar, and says so', async () => {
  const days = Core.bookingDays(Date.now(), B);
  // A VIP already holds 9 to 10 on the first day.
  const busy = [{ start: new Date(Core.zonedToUtc(days[0], 9, DENVER)).toISOString(), end: new Date(Core.zonedToUtc(days[0], 10, DENVER)).toISOString() }];
  const b = bootReserve({ endpoint: 'https://hooks.example.test/bb', availability: { ok: true, busy } });
  b.fill({ ...GOOD, email: 'qa@example.test', notify: true });
  b.choose('service', 'lift');
  assert.equal(b.document.getElementById('job-row').hidden, false, 'job question for lift time');
  b.choose('job', 'oil-change');
  assert.equal(b.lookups.length, 1);
  assert.match(b.lookups[0], new RegExp(`\\?from=${days[0]}&to=${Core.addDaysKey(days[days.length - 1], 1)}$`));
  await settle();
  const picker = b.document.getElementById('slot-picker');
  assert.equal(picker.hidden, false);
  assert.equal(b.document.getElementById('callback').hidden, true);
  assert.equal(b.form.querySelectorAll('input[name="slotDay"]').length, B.days);
  const times = [...b.form.querySelectorAll('input[name="slotTime"]')].map((i) => i.value);
  assert.deepEqual(times, ['10', '11', '12', '13', '14', '15', '16', '17'], 'VIP hour left out');
  b.submit();
  assert.equal(b.calls.length, 0, 'no time picked yet');
  assert.ok(b.document.getElementById('err-slot'));
  b.pick('slotTime', '10');
  b.submit();
  await settle();
  assert.equal(b.calls.length, 1);
  const body = JSON.parse(b.calls[0].opts.body);
  assert.equal(body.slotStart, new Date(Core.zonedToUtc(days[0], 10, DENVER)).toISOString());
  assert.equal(body.slotEnd, new Date(Core.zonedToUtc(days[0], 11, DENVER)).toISOString());
  assert.equal(body.slotLabel, Core.slotLabel(days[0], 10, 1));
  assert.equal(body.jobLabel, 'Oil change');
  assert.equal(body.emailOk, true);
  // The old n8n line printed "Texts/emails OK" from body.notify. The box only covers email.
  assert.ok(!('notify' in body), 'no notify key');
  assert.match(body.message, /Booked online: .* \(1 hr\)/);
  assert.equal(b.document.getElementById('thanks-h').textContent, 'You’re booked.');
  assert.equal(b.document.getElementById('thanks-slot').textContent, body.slotLabel);
  assert.equal(b.document.getElementById('thanks-booked').hidden, false);
});

test('form: a diagnosis books one hour; a quote or another job gets a call instead', async () => {
  const b = bootReserve({ endpoint: 'https://hooks.example.test/bb' });
  b.choose('service', 'diagnostics');
  await settle();
  assert.equal(b.document.getElementById('job-row').hidden, true);
  assert.equal(b.document.getElementById('slot-picker').hidden, false);
  assert.equal(b.form.querySelectorAll('input[name="slotTime"]').length, 9, '9 AM to 5 PM starts');
  b.choose('service', 'quote');
  assert.equal(b.document.getElementById('slot-picker').hidden, true);
  assert.equal(b.document.getElementById('callback').hidden, false);
  b.choose('service', 'lift');
  b.choose('job', 'other');
  assert.equal(b.document.getElementById('slot-picker').hidden, true);
  assert.equal(b.document.getElementById('callback').hidden, false);
  assert.equal(b.lookups.length, 1, 'the calendar is read once per visit');
  assert.equal(b.form.querySelector('[name="date"]').min, Core.bookingDays(Date.now(), B)[0], 'call-back day: same Monday -> Wednesday rule');
  b.fill({ ...GOOD, job: 'other', date: Core.bookingDays(Date.now(), B)[2] });
  b.submit();
  await settle();
  const body = JSON.parse(b.calls[0].opts.body);
  assert.ok(!body.slotStart, 'nothing goes on the calendar');
  assert.match(body.message, /Time: call them to set one\. Preferred day:/);
});

test('form: calendar down = call-back request, never a dead end', async () => {
  const b = bootReserve({ endpoint: 'https://hooks.example.test/bb', availability: 503 });
  b.fill(GOOD);
  b.choose('service', 'lift');
  b.choose('job', 'wheel-bearings');
  await settle();
  assert.equal(b.document.getElementById('slot-picker').hidden, true);
  assert.equal(b.document.getElementById('callback').hidden, false);
  assert.match(b.document.getElementById('callback-note').textContent, /couldn’t load our calendar/);
  b.submit();
  await settle();
  assert.equal(b.calls.length, 1, 'the request still goes to Max');
});

test('form: someone else took the time = pick again, calendar reloaded', async () => {
  const b = bootReserve({ endpoint: 'https://hooks.example.test/bb', fetchImpl: () => Promise.resolve({ ok: false, status: 409 }) });
  b.fill(GOOD);
  b.choose('service', 'diagnostics');
  await settle();
  b.pick('slotTime', '9');
  b.submit();
  await settle();
  assert.equal(b.document.getElementById('form-thanks').hidden, true);
  assert.match(b.document.getElementById('err-slot').textContent, /just booked/);
  assert.equal(b.lookups.length, 2, 'fresh calendar read');
  assert.equal(b.form.querySelector('button[type="submit"]').disabled, false);
});

test('rates plan builder: oil disposal is free, add-ons ride along to the form', { skip: !SITE.showPrices }, () => {
  const { window, document } = parse(readFileSync(join(DOCS, 'rates/index.html'), 'utf8'));
  const ctx = vm.createContext({ window, document, console, URLSearchParams, Date, JSON, Object, Math, Promise, String, parseInt, isFinite, requestAnimationFrame: (f) => f(0) });
  window.matchMedia = () => ({ matches: false });
  window.BB_CONFIG = JSON.parse(readFileSync(join(DOCS, 'assets/config.js'), 'utf8').match(/BB_CONFIG = (.*);/)[1]);
  window.BBCore = Core;
  vm.runInContext(readFileSync(join(DOCS, 'assets/site.js'), 'utf8'), ctx);
  assert.ok(!document.getElementById('plan-oil'), 'no oil add-on');
  assert.match(document.querySelector('[data-plan]').textContent, /Used oil disposal is free\./);
  const coolant = document.getElementById('plan-coolant');
  coolant.checked = true;
  coolant.dispatchEvent(new window.Event('change'));
  const r = SITE.rates;
  assert.equal(document.getElementById('plan-total').textContent, '$' + (3 * r.lift + r.coolantDisposal));
  assert.match(document.getElementById('plan-send').getAttribute('href'), /coolant=1/);
});

test('form: an old tool-rental link prefills lift time with tool access', () => {
  const { form } = bootReserve({ search: '?service=tools' });
  assert.equal(form.querySelector('[name="service"]').value, 'lift');
  assert.equal(form.querySelector('[name="tools"]').checked, true);
});

test('form: a 500 from the backend shows the error and keeps every value', async () => {
  const b = bootReserve({ endpoint: 'https://hooks.example.test/bb', fetchImpl: () => Promise.resolve({ ok: false, status: 500 }) });
  b.fill(GOOD);
  b.submit();
  await tick(); await tick();
  assert.equal(b.document.getElementById('form-thanks').hidden, true, 'never say thanks on a failure');
  assert.equal(b.document.getElementById('form-error').hidden, false);
  assert.equal(b.form.querySelector('[name="details"]').value, 'Front brakes');
  assert.equal(b.form.querySelector('button[type="submit"]').disabled, false);
});

test('form: honeypot filled = quiet fake success, nothing posted', async () => {
  const b = bootReserve({ endpoint: 'https://hooks.example.test/bb' });
  b.fill({ ...GOOD, bb_check: 'spam co' });
  b.submit();
  await tick();
  assert.equal(b.calls.length, 0);
});
