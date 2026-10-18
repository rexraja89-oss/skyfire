#!/usr/bin/env bash
# Renders the "rise" cinematic (resumable: finished frames are skipped) and encodes the MP4.
# Usage: cinematic/render_rise.sh [samples] [res]   (from tools/boss3d; needs setup_blender.sh, fetch_assets.sh, node cine_glb.cjs)
set -euo pipefail
cd "$(dirname "$0")/.."
B="$HOME/tools/blender-4.5.14-linux-x64/blender"; S=${1:-24}; R=${2:-540x960}
"$B" -b -P cinematic/boss_rise.py -- --frames 1-264 --samples "$S" --res "$R" --out cinematic/rise 2>&1 | grep --line-buffered -E "FRAME|Error|Traceback"
ffmpeg -y -loglevel error -framerate 24 -i cinematic/rise/%04d.png -c:v libx264 -pix_fmt yuv420p -crf 18 -preset slow -movflags +faststart cinematic/megaboss_rise.mp4
echo "cinematic/megaboss_rise.mp4 $(du -h cinematic/megaboss_rise.mp4 | cut -f1)"
