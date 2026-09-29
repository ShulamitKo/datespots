#!/usr/bin/env bash
# בונה את סרטון ההדגמה מאפס: צילומי מסך מהאפליקציה -> אנימציה -> מוזיקה -> MP4 ו-GIF.
# הפלט נכתב ל-docs/demo.mp4 ול-docs/demo.gif.
#
# דרישות: Node 18+, Python 3 עם numpy, ffmpeg, ו-Playwright:
#   npm i -D playwright && npx playwright install chromium
#   pip install numpy
# משתני סביבה אופציונליים: FFMPEG (ברירת מחדל: ffmpeg), CHROMIUM_PATH, APP_URL
set -euo pipefail
cd "$(dirname "$0")"
ROOT=..
FFMPEG="${FFMPEG:-ffmpeg}"
mkdir -p out

echo "1/6 extracting spots"
python3 extract_spots.py "$ROOT/import_spots.sql" out/spots.json

echo "2/6 starting the app (placeholder Supabase keys; all requests are mocked)"
APP_URL="${APP_URL:-http://127.0.0.1:5173}"
if ! curl -s -o /dev/null "$APP_URL"; then
  (cd "$ROOT" && VITE_SUPABASE_URL=https://placeholder.supabase.co VITE_SUPABASE_ANON_KEY=placeholder \
    npx vite --port 5173 --host 127.0.0.1 --strictPort >/dev/null 2>&1) &
  VITE_PID=$!
  trap 'kill $VITE_PID 2>/dev/null || true' EXIT
  for _ in $(seq 1 60); do curl -s -o /dev/null "$APP_URL" && break; sleep 1; done
fi

echo "3/6 capturing screens"
APP_URL="$APP_URL" node capture.mjs

echo "4/6 rendering frames"
node render.mjs full
node render.mjs gif

echo "5/6 synthesizing music"
python3 demo_music.py out/music.wav

echo "6/6 encoding"
"$FFMPEG" -loglevel error -y -framerate 30 -i out/frames/f%04d.jpg -i out/music.wav \
  -map 0:v -map 1:a -c:v libx264 -pix_fmt yuv420p -crf 20 -preset slow \
  -af "loudnorm=I=-16:TP=-1.5:LRA=9" -ar 44100 -c:a aac -b:a 192k -shortest -movflags +faststart \
  "$ROOT/docs/demo.mp4"
"$FFMPEG" -loglevel error -y -framerate 10 -i out/gframes/f%04d.jpg \
  -vf "scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" \
  "$ROOT/docs/demo.gif"
ls -la "$ROOT/docs/demo.mp4" "$ROOT/docs/demo.gif"
