#!/usr/bin/env bash
# Render icon PNGs from a game's icon.svg using headless Chrome (macOS).
# Usage: tools/render-icons.sh <game-folder>      e.g. tools/render-icons.sh valka-statu
#        tools/render-icons.sh .                  (landing page)
# Produces icon-512.png, icon-192.png and apple-touch-icon.png (180) next to icon.svg.
# The SVG must be full-bleed (square, no rounded corners, no transparency): phones round the corners themselves.
set -euo pipefail

dir="$(cd "${1:?usage: $0 <game-folder>}" && pwd)"
svg="$dir/icon.svg"
[ -f "$svg" ] || { echo "missing $svg" >&2; exit 1; }

chrome="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

render() { # <out-file> <size>
  printf '<html><body style="margin:0"><img src="file://%s" width="%s" height="%s" style="display:block"></body></html>' \
    "$svg" "$2" "$2" > "$tmp/r.html"
  "$chrome" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files \
    --user-data-dir="$tmp/profile" --force-device-scale-factor=1 --window-size="$2,$2" \
    --screenshot="$dir/$1" "file://$tmp/r.html" >/dev/null 2>&1
}

render icon-512.png 512
render icon-192.png 192
render apple-touch-icon.png 180
sips -g pixelWidth "$dir"/icon-512.png "$dir"/icon-192.png "$dir"/apple-touch-icon.png | grep pixelWidth
