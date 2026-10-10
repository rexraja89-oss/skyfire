# Test tools (headless Chromium + SwiftShader, not shipped)

Run from `tests/` after `npm i`. Output goes next to the script unless `OUT=<dir>` is set.

| Script | What it does |
|---|---|
| `node tools/shot.js <stage 0-9> <name> [ms]` | One HQ screenshot of a stage with the timeline frozen |
| `ROOT=<checkout> node tools/ba.js <prefix>` | Same scenes (Jungle, Canyon, Harbor, darts, explosion) from any checkout, for before/after comparisons |
| `node tools/stormcap.js <outdir> 210 210` | Storm Fleet combat capture at fixed 1/30 s steps (encode with `ffmpeg -framerate 30 -i f%04d.png`) |
| `node tools/baseline.js <out.json>` | Per-stage draw calls, triangles, scene texture MB, heap, bytes downloaded (`ROOT` = checkout) |

Software rendering runs ~10 fps, so the tools freeze game time (`SF.run.timeScale=()=>0`) and step it with `window.__sky.runStep(n)` instead of relying on wall-clock waits.
