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

test('hero: Higgsfield clip with poster-first loading, text over the clip, scroll-scrubbed; h1 and both CTAs intact', () => {
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
  assert.ok(v && v.getAttribute('data-src').includes('shop-lift-hero-scrub.mp4'), 'keyframe-dense encode for scrubbing');
  assert.ok(!v.hasAttribute('src') && !v.hasAttribute('autoplay'), 'video downloads only after JS checks reduced-motion');
  assert.ok(!v.hasAttribute('loop'), 'the scroll is the play head; the clip never loops on its own');
  for (const a of ['muted', 'playsinline']) assert.ok(v.hasAttribute(a), a);
  assert.equal(v.getAttribute('tabindex'), '-1');
  assert.ok(media.querySelector('canvas[data-hero-canvas]'), 'frames are drawn to a canvas (Safari play-icon fix)');
  assert.ok(hero.querySelector('.hero-inner .hero-copy h1'), 'copy sits in the overlay layer');
  assert.ok(!hero.querySelector('.hero-film-label'), 'no "shop in motion / AI visualization" label');
  assert.ok(!d.querySelector('[data-video-toggle]'), 'no pause button: nothing autoplays');
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
  assert.ok(form.querySelector('.hp input[name="company"]'), 'honeypot');
  assert.equal(form.querySelector('button').getAttribute('type'), 'submit');
  if (!SITE.leadEndpoint) assert.ok(!form.hasAttribute('action'), 'no endpoint: form must not post anywhere');
  else assert.equal(form.getAttribute('action'), SITE.leadEndpoint);
});

// ---------- core logic ----------

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

test('validation refuses what site-qa throws at it', () => {
  const ok = { service: 'lift', name: 'Sam', phone: '406-555-0100', email: '', vehicle: '2006 Silverado', details: 'Brakes' };
  assert.deepEqual(Core.validate(ok), {});
  assert.ok(Core.validate({ ...ok, phone: 'abc' }).phone);
  assert.ok(Core.validate({ ...ok, phone: '12345' }).phone);
  assert.ok(Core.validate({ ...ok, email: 'not-an-email' }).email);
  assert.deepEqual(Object.keys(Core.validate({})).sort(), ['details', 'name', 'phone', 'service', 'vehicle']);
});

test('the message Max receives has everything', () => {
  const m = Core.message({ service: 'tools', name: ' Sam ', phone: '406-555-0100', vehicle: 'Tacoma', hours: '3', tools: true, details: 'Struts' });
  for (const s of ['Tool rental', 'Sam', '406-555-0100', 'Tacoma', '3 hr', 'tool access', 'Struts']) assert.ok(m.includes(s), s);
  assert.ok(Core.smsHref('+14062336598', m).startsWith('sms:+14062336598?&body='));
});

// ---------- form behaviour in a DOM shim ----------

function bootReserve({ search = '', endpoint = '', fetchImpl } = {}) {
  let html = readFileSync(join(DOCS, 'reserve/index.html'), 'utf8');
  if (endpoint) html = html.replace('data-endpoint=""', `data-endpoint="${endpoint}"`);
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
  const calls = [];
  const ctx = vm.createContext({
    window, document, console, URLSearchParams, Date, JSON, Object, Math, Promise, String, parseInt, isFinite,
    requestAnimationFrame: (f) => f(0),
    fetch: (url, opts) => { calls.push({ url, opts }); return fetchImpl ? fetchImpl(url, opts) : Promise.resolve({ ok: true, status: 200 }); },
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
  const submit = () => form.dispatchEvent(new window.Event('submit', { cancelable: true }));
  return { document, form, fill, submit, calls };
}
const GOOD = { service: 'lift', name: 'QA Probe', phone: '406-555-0123', vehicle: '2010 F-150', details: 'Front brakes' };
const tick = () => new Promise((r) => setTimeout(r, 0));

test('form: prefills from a plan link', () => {
  const { form } = bootReserve({ search: '?service=lift&hours=3&tools=1' });
  assert.equal(form.querySelector('[name="service"]').value, 'lift');
  assert.equal(form.querySelector('[name="hours"]').value, '3');
  assert.equal(form.querySelector('[name="tools"]').checked, true);
  if (SITE.showPrices) assert.match(form.querySelector('[name="details"]').value, /estimate \$/);
});

test('form: empty submit shows errors and sends nothing', () => {
  const b = bootReserve();
  b.submit();
  assert.equal(b.calls.length, 0);
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
  b.fill({ ...GOOD, company: 'spam co' });
  b.submit();
  await tick();
  assert.equal(b.calls.length, 0);
});
