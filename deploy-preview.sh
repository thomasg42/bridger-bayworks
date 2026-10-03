#!/usr/bin/env bash
# Publishes the Bridger Bayworks site to GitHub Pages:
#   https://thomasg42.github.io/bridger-bayworks/
# Run from Thomas's own Terminal (Claude Code has no GitHub push credentials):
#   bash ~/Documents/FGA-Brain/FGA-AIOS/clients/bridger-bayworks/website/deploy-preview.sh
#
# Safe to re-run: it rebuilds, re-tests, and pushes only what changed.
# The preview is noindex + robots Disallow until site.config.mjs says launched: true.
set -euo pipefail

SRC="$HOME/Documents/FGA-Brain/FGA-AIOS/clients/bridger-bayworks/website"
REPO="thomasg42/bridger-bayworks"
WORK="$HOME/Documents/bridger-bayworks-site"   # deploy clone, kept OUTSIDE FGA-Brain
URL="https://thomasg42.github.io/bridger-bayworks/"

cd "$SRC"
echo "1/5 Building..."
node build.mjs
echo "2/5 Testing (stops here if anything fails)..."
node --test tests/site.test.mjs > /tmp/bridger-tests.txt 2>&1 || { tail -40 /tmp/bridger-tests.txt; echo "Tests failed. Nothing was published."; exit 1; }
grep -E "^# (pass|fail)" /tmp/bridger-tests.txt || true

echo "3/5 GitHub repo..."
gh auth status >/dev/null 2>&1 || { echo "GitHub CLI is not logged in. Run: gh auth login   then run this script again."; exit 1; }
if gh repo view "$REPO" >/dev/null 2>&1; then
  echo "   Repo exists: https://github.com/$REPO"
else
  gh repo create "$REPO" --public --description "Bridger Bayworks DIY Garage website, Belgrade MT"
  echo "   Created https://github.com/$REPO"
fi
if [ ! -d "$WORK/.git" ]; then
  gh repo clone "$REPO" "$WORK" -- -q 2>/dev/null || {
    mkdir -p "$WORK" && git -C "$WORK" init -q && git -C "$WORK" remote add origin "https://github.com/$REPO.git"
  }
fi
gh auth setup-git >/dev/null 2>&1 || true   # lets git push over HTTPS with the gh login

echo "4/5 Pushing..."
rsync -a --delete --exclude .git --exclude node_modules --exclude .DS_Store "$SRC/" "$WORK/"
cd "$WORK"
git checkout -q -B main   # a fresh empty clone may start on "master"
git add -A
if git diff --cached --quiet && git rev-parse -q --verify HEAD >/dev/null; then
  echo "   No changes since the last deploy."
else
  git commit -q -m "Deploy $(date +%Y-%m-%d\ %H:%M)"
fi
git push -u origin main

echo "5/5 GitHub Pages (main branch, /docs folder)..."
if gh api "repos/$REPO/pages" >/dev/null 2>&1; then
  echo "   Pages already on."
else
  gh api -X POST "repos/$REPO/pages" -f "source[branch]=main" -f "source[path]=/docs" >/dev/null
  echo "   Pages turned on. First build takes 1 to 3 minutes."
fi

code=000
for _ in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$URL" || true)
  [ "$code" = "200" ] && break
  sleep 10
done
if [ "$code" = "200" ]; then
  echo "LIVE (preview, hidden from Google): $URL"
else
  echo "Pushed, but Pages answered HTTP $code after 5 minutes. Check https://github.com/$REPO/settings/pages"
fi
