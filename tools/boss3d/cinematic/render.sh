#!/usr/bin/env bash
# Renders the boss-entrance cinematic (resumable: finished frames are skipped) and encodes the MP4.
# Usage: cinematic/render.sh [samples] [res]   (from tools/boss3d; needs setup_blender.sh, fetch_assets.sh, node cine_glb.cjs)
set -euo pipefail
cd "$(dirname "$0")/.."
B="$HOME/tools/blender-4.5.14-linux-x64/blender"; S=${1:-32}; R=${2:-576x1024}
"$B" -b -P cinematic/boss_entrance.py -- --frames 1-192 --samples "$S" --res "$R" --out cinematic/frames 2>&1 | grep --line-buffered -E "FRAME|Error|Traceback"
ffmpeg -y -loglevel error -framerate 24 -i cinematic/frames/%04d.png -c:v libx264 -pix_fmt yuv420p -crf 18 -preset slow -movflags +faststart cinematic/megaboss_entrance.mp4
echo "cinematic/megaboss_entrance.mp4 $(du -h cinematic/megaboss_entrance.mp4 | cut -f1)"
