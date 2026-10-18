#!/usr/bin/env bash
# Installs Blender 4.5 LTS (GPL, free) for the cinematic renders, outside the repo: ~/tools/blender-4.5.14-linux-x64.
# The download is checked against blender.org's published SHA-256. Cloud containers are temporary: rerun after a restart.
set -euo pipefail
V=4.5.14; D="$HOME/tools"; F="blender-$V-linux-x64.tar.xz"; U="https://download.blender.org/release/Blender4.5"
mkdir -p "$D"; cd "$D"
[ -x "blender-$V-linux-x64/blender" ] && { echo "already installed: $D/blender-$V-linux-x64/blender"; exit 0; }
curl -sSfL -o "$F" "$U/$F"; curl -sSfL -o "blender-$V.sha256" "$U/blender-$V.sha256"
grep " $F\$" "blender-$V.sha256" | sha256sum -c -
tar -xJf "$F" && rm "$F"; "$D/blender-$V-linux-x64/blender" --version | head -1
