#!/usr/bin/env bash
# verify-build.sh — Smoke-tests the LEGO Batman: Boardwalk Bash preview build.
#
# Run after the preview server is up (python3 -m http.server 8000) and Claude
# Code has produced index.html / game.js / style.css. Exits non-zero if any
# expected artifact, screen state, or localStorage hook is missing.

set -uo pipefail

HOST="${HOST:-http://127.0.0.1:8000}"
REQUIRED_FILES=("index.html" "game.js" "style.css")
REQUIRED_STATES=("TITLE" "PLAYING" "GAMEOVER" "VICTORY" "HIGHSCORE")

pass=0
fail=0
note() { printf "  %s\n" "$1"; }
ok()   { printf "  \033[32mPASS\033[0m %s\n" "$1"; pass=$((pass+1)); }
bad()  { printf "  \033[31mFAIL\033[0m %s\n" "$1"; fail=$((fail+1)); }

echo "==> Preview server reachable?"
if curl -sf -o /dev/null "$HOST/"; then ok "GET $HOST/ -> 200"; else bad "server not responding at $HOST"; fi

echo "==> Required files served?"
for f in "${REQUIRED_FILES[@]}"; do
  if curl -sf -o /dev/null "$HOST/$f"; then ok "$f served"; else bad "$f missing or 404"; fi
done

echo "==> Screen states declared in game.js?"
if [[ -f game.js ]]; then
  for s in "${REQUIRED_STATES[@]}"; do
    if grep -qE "\b$s\b" game.js; then ok "state $s referenced"; else bad "state $s not found in game.js"; fi
  done
else
  bad "game.js not on disk yet"
fi

echo "==> Persistence hooks present?"
if [[ -f game.js ]] && grep -q "localStorage" game.js; then
  ok "localStorage referenced in game.js"
else
  bad "no localStorage usage detected (high scores requirement)"
fi

echo "==> Canvas mounted in index.html?"
if [[ -f index.html ]] && grep -qi "<canvas" index.html; then
  ok "<canvas> element present"
else
  bad "no <canvas> tag found in index.html"
fi

echo
echo "Summary: $pass passed, $fail failed"
[[ $fail -eq 0 ]]
