# Home hero slot (Higgsfield)

**Status 2026-10-03: DONE (v1).** Lane 2 Codex rendered a 6 s, 1280x720 silent clip from Max's real shop (IMG_7028 viewpoint, Kling v3.0 standard, 17 credits, logged). Deck + QA: `../marketing/shop-lift-hero/`. Lane 1 Claude Code inserted it as `src/assets/hero/shop-lift-hero.mp4` + `shop-lift-poster.jpg` (SHA256 matches Codex's QA). How it behaves:

- The poster `<img>` paints first (no JS needed). JS attaches the video source only when reduced-motion is off and Save-Data is off, then fades it in over the poster. It pauses when the hero leaves the screen, and it drops back to the poster if playback is rejected or the motion preference changes.
- Desktop: the text block sits right, over Max's plain wall, behind a navy scrim; the lift action on the left stays clear.
- Phones (760 px and narrower): the full 16:9 clip sits above the text instead of being cropped to the middle third.
- The clip is illustrative (AI-varied hands, clothing, plates). Never caption it as a real job or as staffed repair service.

The rest of this file is the original spec, kept for a v2 (for example 1080p, or a mobile portrait cut).

## Where it lives

- Source: `src/pages.mjs`, the `home` page, `<section class="hero" data-hero-slot="higgsfield">`.
- **Replace only what is inside `<div class="hero-media">`.** Then run `node build.mjs` and `node --test tests/site.test.mjs`. Never edit `docs/` by hand; a test fails if `docs/` and the source disagree.
- Put media files in `src/assets/hero/`. The build copies them to `docs/assets/hero/`.

## Keep these, whatever the visual

- The `h1` text **"DIY Garage & Lift Rental in Belgrade, MT"**. It is the page's main SEO signal. Styling is yours; the words stay.
- The kicker, the lead line, and both buttons: **Reserve a Bay** (goes to `reserve/`) and **Call or text Max**.
- Text contrast. Over video, add a navy scrim (for example `linear-gradient(180deg, rgba(20,28,51,.55), rgba(20,28,51,.85))`) so white text stays readable on every frame.
- The ridge SVG at the bottom can stay or go. If it goes, keep a clean edge into the paper-colored section below.

## Media spec

| File | Spec |
|---|---|
| `hero-desktop.mp4` | 1920x1080, H.264 High, 6 to 10 s seamless loop, no audio track, 6 MB max |
| `hero-mobile.mp4` | 1080x1920 portrait crop of the same shot, 4 MB max |
| `hero-poster.jpg` | First frame of desktop, 1920x1080, 200 KB max. Also export a 1200x630 crop and replace `src/assets/og-image.png` with it. |

Snippet for `.hero-media`:

```html
<video autoplay muted loop playsinline preload="metadata" poster="assets/hero/hero-poster.jpg">
  <source media="(max-width: 760px)" src="assets/hero/hero-mobile.mp4" type="video/mp4">
  <source src="assets/hero/hero-desktop.mp4" type="video/mp4">
</video>
```

Respect `prefers-reduced-motion`: pause the video and show the poster. If you want the GMM-style scroll scrub instead of a loop, reuse that build (`FGA-AIOS/forever-gold-agency/gold-mobile-mechanic/website/customer-site/docs/assets/site.js`, encoded with a keyframe every 6 frames). Don't build a second scrubber.

## Truth rules for the visual (claims gate)

- A generated shop interior must not pass as Max's actual building, bays, or lift count. Either use **real footage Max sends**, or keep the generated shot clearly atmospheric (mountains, a garage door rolling up, a car rising on a lift) without implying "this is the shop."
- No logos of tool brands, no readable text, no people's faces.
- Brand: navy `#1B2541`, royal `#3D5AA8`, ice `#A9B9E3`, yellow `#F2C230` accent. Bridger Mountains. The flyer's own imagery is a dark blue 1990s BMW sedan at the shop door and a pickup on a two-post lift.

## Ready-to-paste prompt for Codex (visual lane)

> Build the home hero for the Bridger Bayworks DIY Garage site. Repo source: `~/Documents/FGA-Brain/FGA-AIOS/clients/bridger-bayworks/website/`. Read `HERO-SLOT.md` (this spec), `../context/three-ps.md` and `../context/product-facts.md` first. The rest of the site is finished and tested; touch only the hero.
>
> 1. Read-only first. Check your Higgsfield balance and quote the credits for: one 16:9 Seedance clip, 8 s, plus one Nano Banana Pro still. **Stop and report the quote to Thomas before generating anything.** The per-job credit allowance is UNCONFIRMED.
> 2. After Thomas OKs the spend: generate one continuous clip. Prompt starting point: "Cinematic 16:9, early morning over snow-capped Montana mountains, cool navy and royal-blue grade, slow push through a rolling garage door into a clean, bright DIY auto shop, a dark blue 1990s BMW sedan rises smoothly on a two-post lift, workbenches and tool chests soft in the background, no people's faces, no text, no logos, seamless loop." Log the run with its real cost in `FGA-AIOS/marketing/generation-log.csv` (read `HOW-TO-READ-THE-GENERATION-LOG.md` first).
> 3. Encode per the media spec table, drop the files in `src/assets/hero/`, replace only the inside of `.hero-media` in `src/pages.mjs`, add the navy scrim, keep the h1 words and both buttons. Replace `src/assets/og-image.png` with a 1200x630 frame.
> 4. Run `node build.mjs && node --test tests/site.test.mjs`. All tests must pass. Then check the home page at 390 px and 1440 px wide: text readable on every frame, no horizontal scroll, buttons reachable.
> 5. Do not deploy or publish. Thomas runs `deploy-preview.sh`. Report: files changed, credits spent, screenshots at both widths.
>
> Done = hero video in, tests green, screenshots delivered, nothing published, spend logged.
