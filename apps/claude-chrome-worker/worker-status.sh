#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--health" ]]; then
  pgrep -x Xvfb >/dev/null
  pgrep -f 'google-chrome.*google-chrome' >/dev/null || pgrep -f google-chrome-stable >/dev/null
  curl -fsS http://127.0.0.1:8080/ >/dev/null
  exit 0
fi

echo "== Claude Chrome worker =="
printf 'Chrome: '; google-chrome-stable --version || true
printf 'Claude Code: '; claude --version || true
printf 'Display: %s\n' "${DISPLAY:-unset}"
printf 'Chrome process: '; pgrep -af google-chrome | head -n 3 || true
printf 'X server: '; pgrep -af Xvfb | head -n 1 || true
printf 'Extension policy: '
if grep -q 'fcoeoabgfenejglbffodgkkbkcdhcgfn' /etc/opt/chrome/policies/managed/claude-in-chrome.json; then
  echo 'official Anthropic extension configured'
else
  echo 'MISSING'
fi

EXT_ROOT="$HOME/.config/google-chrome/Default/Extensions/fcoeoabgfenejglbffodgkkbkcdhcgfn"
if [[ -d "$EXT_ROOT" ]]; then
  echo "Extension profile state: installed ($EXT_ROOT)"
else
  echo "Extension profile state: not downloaded yet / profile not initialized"
fi

echo "Google Search safety: NO automated Google request is authorized by this status command."
