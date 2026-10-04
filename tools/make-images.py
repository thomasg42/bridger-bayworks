#!/usr/bin/env python3
"""Optimize the supplied client logo for share cards and browser icons; never redraw it."""
from pathlib import Path
import subprocess

ASSETS = Path(__file__).resolve().parent.parent / 'src' / 'assets'
LOGO = ASSETS / 'brand' / 'bridger-bayworks-logo.png'

if __name__ == '__main__':
    if not LOGO.is_file():
        raise SystemExit('Missing supplied Bridger Bayworks logo')
    for name, size in [('og-image.png', 1200), ('apple-touch-icon.png', 180), ('favicon.png', 64)]:
        subprocess.run(['sips', '-Z', str(size), str(LOGO), '--out', str(ASSETS / name)], check=True, stdout=subprocess.DEVNULL)
    print('Updated share image and icons from the supplied logo, intact.')
