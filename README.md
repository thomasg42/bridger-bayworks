# Bridger Bayworks DIY Garage — website

Multi-page SEO site for a rent-a-bay DIY garage at 201 S Weaver St, Building A, Belgrade, MT. Built on `wiki/builds/local-business-website-seo-blueprint.md` (FGA-Brain).

- **Live (noindex until launch):** https://bridgerbayworks.com/ (the old github.io address redirects here)
- **Repo:** `thomasg42/bridger-bayworks`, Pages from `main` → `/docs`
- **Deploy:** `bash deploy-preview.sh` from Thomas's Terminal (builds, tests, pushes, then waits until bridgerbayworks.com serves the new `assetVersion`)

## Current: "Same job, shop vs here" savings cards (2026-11-03, Lane 1 Claude Code)

Built and tested (39/39), **not deployed. Thomas: "I don't want to push out this live site right now."** assetVersion `20261103-savings`. He asked for the DIY-garage savings comparison he saw on another shop's site, as the first thing under the hero.

- Home page, directly after the hero's yellow strip: three cards, biggest saving first. Tacoma clutch: shop $1,969 vs $612 here (save about $1,357). Honda Pilot timing belt: $1,323 vs $503 (about $820). F-150 spark plugs: $345 vs $226 (about $119).
- Shop side = middle of RepairPal's national average range (parts + labor). Our side = parts at store prices + bay time at $40/hr (Thomas's revision, 2026-11-03: "all you're paying for is the bay and the parts"). Tool access shown as $5/hr extra in the fine print. Stacked bars: parts + shop labor vs parts + your bay time. Bars grow in on scroll; dollar figures never animate.
- Data in `site.config.mjs` `savings` (`shop`, `parts`, `diyParts`, `bayHours`, source URL); math in `components.mjs` `jobSavings`. Claims status and parts sources in `../context/product-facts.md`. `showPrices: false` removes the whole section.
- Real customer job = one config entry: `shop: [quote, quote]`, `diyParts: [paid, paid]`, `bayHours`, `badge: 'Real Bridger Bayworks customer'`.
- Tests: section is the element right after `.shop-strip`; saving = shop minus here; here = parts + hours x lift; every source link present; no "real customer" badge.

## Looping hero + online booking (2026-11-02, Lane 1 Claude Code)

Built and tested (37/37), **site not deployed yet**; the booking backend in n8n is live. Record: `review/00-CURRENT-2026-11-02-hero-and-reserve.md`. Before-snapshot: `review/2026-11-02-before-hero-reserve/`.

- Hero plays the 6 s shop clip on a loop (was scroll-scrubbed). See `HERO-SLOT.md`.
- Reserve form: "What do you need?" is Lift time / Diagnostics and scan tools / Just get a quote. Lift time asks "What's the job?": a job with a known length books straight onto the owner's Google Calendar from the open times, and so does a diagnosis (1 hr). Anything else gets "We'll call you to set a time" with an optional preferred day.
- Booking rules live in `site.config.mjs` (`jobs[].bayHours`, `booking`): 9 AM to 6 PM shop time (America/Denver, whatever zone the visitor's phone is in), first day = the day after tomorrow, 14 days ahead. Slot maths in `bb-core.js` (`bookingDays`, `openStarts`, `zonedToUtc`), all unit-tested including DST days.
- The picker reads busy times from the n8n availability webhook (`booking.availabilityEndpoint`; it returns when the owner is busy, never what the entry is). If that call fails or the window is full, the form falls back to a call-back request, never a dead end. A 409 from the lead webhook means someone just took the slot: the form reloads the calendar and asks for another time.
- Add-ons: tool access, impact guns, coolant disposal. Used oil disposal is free. "Describe what's going on with your car." Consent is email only. Sidebar "Rather talk now?" is one bubble: Call or text 406-233-6598.
- Old `?service=tools|regular|other` links still work (mapped in `bb-core.js`).
- Honeypot renamed from `company` to `bb_check`: AutoFill can fill a field named "company" from a visitor's contact card and silently drop a real request.

## Photo and brand update (2026-10-04, Lane 2 Codex)

Local build only: supplied BMW, engine hoist, transmission and working-under-car photos replace prior shop/illustrative images. Supplied navy/white circular logo replaces our placeholder in header/footer, icons and social preview. Straight-on raised BMW excluded. Lane 1 wording and scrolling hero preserved. 23 tests pass; nine routes checked at phone/desktop sizes. Review: `review/00-CURRENT-photo-brand-update.md`. Not published by this task.

## Scroll-scrub hero (2026-10-03, Lane 1 Claude Code, superseded 2026-11-02 by the loop)

At Thomas's request: the home hero text now sits over the full-bleed shop clip on desktop and phones, the "shop in motion / AI visualization" label is gone, and scrolling scrubs the clip (GMM scrubber port, keyframe-dense re-encode, no autoplay, so the pause button is gone). Nothing else on the site changed. Details and tuning: `HERO-SLOT.md`. Split-layout version kept at `review/2026-10-03-before-hero-overlay/`.

## Visual refresh (2026-10-03, Lane 2 Codex)

Published to the GitHub Pages review preview with Thomas’s approval on 2026-10-03. Local review records, generation prompts, and before snapshots are retained privately and excluded from deployment. Photo-led sections, real Bridger Mountains, compact connected steps, clear Call/Text buttons, stable rates, and symptom-to-reservation prefills. Existing v1 hero video now has a split layout and pause control. Backend still unconfigured; text/email handoff is explicit.

## How it is built

Static HTML generated by a zero-dependency Node script, so the header, footer, phone number, address, and every price live in one place.

```
site.config.mjs     every fact the site prints: NAP, rates, domain, launch flag, lead endpoint
build.mjs           writes docs/ (node build.mjs)
src/layout.mjs      <head> SEO + Open Graph + JSON-LD, header, footer, CTA band, icons
src/components.mjs  lift story (signature move), cards, rates strip, plan builder, rate table
src/pages.mjs       all 10 pages
src/assets/         site.css, site.js (behaviour), bb-core.js (pure logic), images
tests/site.test.mjs node --test tests/site.test.mjs
tools/make-images.py resizes supplied logo into og-image.png + apple-touch-icon.png + favicon.png
docs/               GENERATED. What GitHub Pages serves. Never edit by hand (a test catches it).
HERO-SLOT.md        hero status, behaviour, and the v2 spec/prompt
```

Edit, then `node build.mjs && node --test tests/site.test.mjs`.

## Pages

| URL | Purpose / main search target |
|---|---|
| `/` | DIY garage and lift rental, Belgrade MT. Hero: Higgsfield clip of Max's real shop (see HERO-SLOT.md). |
| `/lift-rental/` | lift rental Belgrade / Bozeman |
| `/tool-rental/` | tool and impact gun rental |
| `/diagnostics/` | DIY diagnostics, scan tools |
| `/rates/` | DIY garage rates + "Plan your bay time" estimate builder |
| `/how-it-works/` | 4 steps (lift story) + full FAQ with FAQPage schema |
| `/about/` | community page |
| `/diy-garage-bozeman/` | "DIY garage near Bozeman" (the bigger search market) |
| `/reserve/` | the conversion page: reserve a bay / get a quote |
| `/404.html` | wrong-bay page, links back to reserve |

**Every page ends in a path to Max.** Reserve buttons on every page; call and text links in the header, footer, CTA band and the mobile bottom bar. Service pages prefill the form (`reserve/?service=lift`), and the rates builder carries the whole plan (`?service=lift&hours=3&tools=1`) into the form's job description. A test fails if any page lacks a reserve, call, or text link.

## SEO pass (blueprint step 3)

Unique title (60 chars max) and description (110 to 160) per page, canonical, Open Graph + Twitter card with a 1200x1200 supplied-logo image, `AutomotiveBusiness` JSON-LD with NAP, area served, social profiles and per-hour `UnitPriceSpecification` offers, `Service` schema per service page, `BreadcrumbList` on inner pages, `FAQPage` on how-it-works, sitemap.xml, robots.txt, one h1 per page, semantic landmarks, skip link, internal linking between service pages, a dedicated Bozeman page. No opening hours in schema because exact hours are UNCONFIRMED.

## Scroll mechanism (standing rule) and signature move

- Sections move into place while remaining visible; prices stay fixed and readable.
- **Signature move: the lift rises.** Scrolling through "How it works" raises a car on a two-post lift step by step (home + how-it-works). Compact photo panel and connected step cards, scroll-driven via `requestAnimationFrame`; no long sticky spacer.
- All motion is off under `prefers-reduced-motion`, and the car simply sits raised. If `site.js` fails to run, a 3 s head-script fallback un-hides all content.
- **The reserve form never animates.** Motion sells on the way in; it costs on the way through.

## Lead path

`site.config.mjs → leadEndpoint` is the n8n webhook `bridger-bayworks-lead`, which emails the written-up request to BridgerBayworks@gmail.com (workflow details live in the vault, not in this public repo). Kraken failure pattern: only `r.ok` shows thanks; a 4xx/5xx shows an error, keeps every value, and offers a text to Max. If the endpoint is ever emptied, a valid submission shows "Last step: send it to us" with a prefilled text and email instead, so nothing is silently dropped.

The email-only consent travels as `emailOk` and as the line "Email updates OK: yes/no" inside the message. A booked slot travels as `slotStart`/`slotEnd` (UTC instants) plus `slotLabel` and `jobLabel`; the lead workflow checks the owner's calendar for a clash (409 if taken), adds the event, then emails the request with a note saying whether the calendar entry worked.

**Not "live" until the blocking gate passes** (blueprint step 6b): `tools/site-qa/site-qa.mjs` against a local build with the endpoint set, zero FAILs, happy path confirmed reaching the backend, then rejection paths on the deployed URL, then one deliberate test lead Max confirms receiving.

## Launch checklist (after Max approves)

1. Max picks the domain and buys it. Set `url` and `customDomain` in `site.config.mjs`.
2. Max OKs publishing the rates, or set `showPrices: false` (every price becomes "Ask Max").
3. Wire `leadEndpoint`, run the site-qa gate above.
4. `launched: true` (removes noindex, opens robots.txt, publishes the sitemap). Bump `assetVersion`.
5. Rebuild, test, `deploy-preview.sh`, point DNS at GitHub Pages, enforce HTTPS.
6. Submit the sitemap in Google Search Console; claim/verify the Google Business Profile with the same NAP.
7. Update the `bridger-site` entry in `FGA-AIOS/command-center/registry.json` with the real URL.

## Verification status

- **2026-11-02:** 37 automated tests pass: the three service choices and field order, legacy links, free oil disposal everywhere, booking rules (what books and for how long, Monday to Wednesday, DST-safe times, 9 to 6 fit, no overlap with busy or all-day entries), the booking form end to end in a DOM shim (slot picked and posted, call-back paths, calendar down, slot taken = 409), the one-bubble sidebar and the looping hero. Rendered in Chrome at 390/1040/1440 px, the picker against the live availability endpoint. Hero video playback and a real booking are not verified yet.
- 23 automated tests pass (2026-10-03): build reproducibility, SEO contract per page, link integrity, path-to-Max on every page, no em/en dashes, no UNCONFIRMED claims, price switch, sitemap/robots, signature move, hero (poster-first, no autoplay before the motion check, scrub clip + canvas, no film label or pause button, h1 + CTAs intact), form contract, core logic, and form behaviour (empty submit, no-backend handoff, success, 500 failure, double submit, honeypot) in a DOM shim.
- **Browser-verified locally by Codex on 2026-10-03.** Nine routes at desktop/mobile sizes; no overflow or broken loaded images. Required site-qa has 24 PASS, 2 SKIP and 2 backend happy-path FAILs because this is still an explicit text/email handoff. See the current review record; production launch is not verified.
