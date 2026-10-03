#!/usr/bin/env python3
"""Renders the social share image and icons into src/assets/. Run once; rerun if the brand changes.
Swap og-image.png for a frame of the Higgsfield hero once it exists (keep 1200x630)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ASSETS = Path(__file__).resolve().parent.parent / "src" / "assets"
FONT = "/System/Library/Fonts/Supplemental/DIN Condensed Bold.ttf"
NAVY_900, NAVY_800 = (20, 28, 51), (27, 37, 65)
ROYAL, ROYAL_300, ICE, ICE_200 = (61, 90, 168), (91, 116, 189), (169, 185, 227), (220, 227, 245)
YELLOW, WHITE = (242, 194, 48), (251, 250, 247)
S = 2  # supersample


def font(px):
    return ImageFont.truetype(FONT, px * S)


def peaks(draw, w, h, pts, color):
    draw.polygon([(x * w / 1440, h - (220 - y) * S * 1.0) for x, y in pts] + [(w, h), (0, h)], fill=color)


def og():
    W, H = 1200 * S, 630 * S
    img = Image.new("RGB", (W, H), NAVY_800)
    d = ImageDraw.Draw(img)
    for y in range(H):  # vertical gradient
        t = y / H
        c = tuple(int(NAVY_800[i] * (1 - t) + NAVY_900[i] * t) for i in range(3))
        d.line([(0, y), (W, y)], fill=c)
    far = [(0, 150), (120, 104), (210, 132), (330, 70), (420, 118), (540, 84), (640, 128), (760, 58), (880, 112), (990, 80), (1100, 126), (1220, 66), (1330, 112), (1440, 92)]
    mid = [(0, 176), (150, 120), (250, 160), (380, 96), (470, 150), (600, 110), (720, 164), (860, 92), (960, 150), (1080, 118), (1200, 166), (1320, 120), (1440, 150)]
    peaks(d, W, H, far, (42, 55, 102))
    peaks(d, W, H, mid, (34, 48, 92))
    mark(d, 690 * S, 120 * S, 7 * S)
    x0 = 80 * S
    d.text((x0, 70 * S), "DIY GARAGE  ·  BELGRADE, MONTANA", font=font(34), fill=ICE)
    d.text((x0, 112 * S), "BRIDGER", font=font(150), fill=WHITE)
    d.text((x0, 252 * S), "BAYWORKS", font=font(150), fill=ROYAL_300)
    d.text((x0, 400 * S), "LIFT RENTAL  ·  TOOL RENTAL  ·  DIAGNOSTICS", font=font(36), fill=ICE_200)
    # yellow brush-ish CTA
    bx, by, bw, bh = x0, 462 * S, 330 * S, 64 * S
    d.polygon([(bx + 10 * S, by), (bx + bw, by + 4 * S), (bx + bw - 10 * S, by + bh), (bx, by + bh - 4 * S)], fill=YELLOW)
    d.text((bx + 26 * S, by + 14 * S), "RESERVE A BAY TODAY", font=font(40), fill=NAVY_800)
    img.resize((1200, 630), Image.LANCZOS).save(ASSETS / "og-image.png", optimize=True)


def mark(d, ox, oy, k):
    pts = [(0, 40), (17, 15), (23, 23), (32, 3), (41, 17), (48, 10), (64, 40)]
    d.polygon([(ox + x * k, oy + y * k) for x, y in pts], fill=ROYAL_300)
    for cap in ([(32, 3), (26.5, 14), (30, 11.5), (32, 15), (34.5, 11), (37.5, 13)],
                [(48, 10), (44.5, 16.5), (47, 15), (48.5, 17.5), (50.5, 15.5)],
                [(17, 15), (13.6, 20), (16, 19), (17.6, 21), (19.4, 19.6)]):
        d.polygon([(ox + x * k, oy + y * k) for x, y in cap], fill=WHITE)


def touch_icon():
    N = 180 * S
    img = Image.new("RGB", (N, N), NAVY_800)
    d = ImageDraw.Draw(img)
    k = 2.2 * S
    mark(d, (N - 64 * k) / 2, 34 * S, k)
    f = font(30)
    t = "BAYWORKS"
    tw = d.textlength(t, font=f)
    d.text(((N - tw) / 2, 128 * S), t, font=f, fill=ICE)
    img.resize((180, 180), Image.LANCZOS).save(ASSETS / "apple-touch-icon.png", optimize=True)


FAVICON = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1B2541"/><g transform="translate(4 14) scale(.875)"><path fill="#5B74BD" d="M0 40L17 15L23 23L32 3L41 17L48 10L64 40Z"/><path fill="#FBFAF7" d="M32 3L26.5 14L30 11.5L32 15L34.5 11L37.5 13Z M48 10L44.5 16.5L47 15L48.5 17.5L50.5 15.5Z"/></g></svg>
"""

if __name__ == "__main__":
    ASSETS.mkdir(parents=True, exist_ok=True)
    og()
    touch_icon()
    (ASSETS / "favicon.svg").write_text(FAVICON)
    print("wrote og-image.png, apple-touch-icon.png, favicon.svg to", ASSETS)
