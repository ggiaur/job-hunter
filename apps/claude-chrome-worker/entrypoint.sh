#!/usr/bin/env bash
set -euo pipefail

: "${VNC_PASSWORD:?VNC_PASSWORD must be set}"

export DISPLAY="${DISPLAY:-:99}"
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/tmp/runtime-worker}"
export HOME="${HOME:-/home/worker}"

mkdir -p "$XDG_RUNTIME_DIR" "$HOME/.config/google-chrome" "$HOME/.claude" /tmp/vnc /tmp/local-test
chmod 700 "$XDG_RUNTIME_DIR"

cp /opt/claude-chrome-worker/local-test.html /tmp/local-test/index.html

cleanup() {
  set +e
  [[ -n "${CHROME_PID:-}" ]] && kill "$CHROME_PID" 2>/dev/null
  [[ -n "${NOVNC_PID:-}" ]] && kill "$NOVNC_PID" 2>/dev/null
  [[ -n "${VNC_PID:-}" ]] && kill "$VNC_PID" 2>/dev/null
  [[ -n "${OPENBOX_PID:-}" ]] && kill "$OPENBOX_PID" 2>/dev/null
  [[ -n "${HTTP_PID:-}" ]] && kill "$HTTP_PID" 2>/dev/null
  [[ -n "${XVFB_PID:-}" ]] && kill "$XVFB_PID" 2>/dev/null
}
trap cleanup EXIT INT TERM

Xvfb "$DISPLAY" -screen 0 1920x1080x24 -nolisten tcp &
XVFB_PID=$!

for _ in $(seq 1 50); do
  if xdpyinfo -display "$DISPLAY" >/dev/null 2>&1; then
    break
  fi
  sleep 0.1
done

openbox-session >/tmp/openbox.log 2>&1 &
OPENBOX_PID=$!

python3 -m http.server 8080 --bind 127.0.0.1 --directory /tmp/local-test >/tmp/local-test-http.log 2>&1 &
HTTP_PID=$!

x11vnc -display "$DISPLAY" -forever -shared -rfbport 5900 -localhost \
  -passwd "$VNC_PASSWORD" >/tmp/x11vnc.log 2>&1 &
VNC_PID=$!

websockify --web /usr/share/novnc/ 6080 localhost:5900 >/tmp/novnc.log 2>&1 &
NOVNC_PID=$!

# IMPORTANT: this is ordinary official Chrome, launched directly. No Playwright,
# Selenium, remote-debugging flag, headless mode, stealth plugin or proxy.
google-chrome-stable \
  --user-data-dir="$HOME/.config/google-chrome" \
  --window-size=1600,900 \
  --start-maximized \
  http://127.0.0.1:8080/ >/tmp/chrome.log 2>&1 &
CHROME_PID=$!

echo "Claude Chrome worker started."
echo "noVNC: container port 6080 (compose binds it to host 127.0.0.1 only)."
echo "Chrome profile: $HOME/.config/google-chrome"
echo "Claude state: $HOME/.claude"
echo "Local browser-control test page: http://127.0.0.1:8080/"
echo "Google Search remains forbidden until a later explicit Product Owner directive."

wait "$CHROME_PID"
