#!/usr/bin/env bash
# Downloads the CC0 Poly Haven assets for the cinematic into cinematic/assets/ (not committed):
#  - HDRI "Industrial Sunset (Pure Sky)" (Jarod Guest sky edits, Sergej Majboroda original), 2k .hdr
#  - texture "aerial_rocks_02" (Rob Tuytel), 2k: diffuse, roughness, normal (GL), displacement
# Licence: CC0 (https://polyhaven.com/license). URLs come from the Poly Haven API.
set -euo pipefail
cd "$(dirname "$0")"; mkdir -p assets
get(){ curl -sSfL -A "skyfire-boss3d/1.0" "https://api.polyhaven.com/files/$1" | python3 -c "import json,sys;d=json.load(sys.stdin)
for k in sys.argv[1].split('/'):d=d[k]
print(d['url'])" "$2"; }
dl(){ [ -s "assets/$2" ] || curl -sSfL -A "skyfire-boss3d/1.0" -o "assets/$2" "$1"; echo "assets/$2"; }
dl "$(get industrial_sunset_puresky hdri/2k/hdr)" sky_2k.hdr
for m in Diffuse:diff Rough:rough nor_gl:nor Displacement:disp; do k=${m%%:*}; n=${m##*:}; dl "$(get aerial_rocks_02 $k/2k/jpg)" rock_${n}_2k.jpg; done
