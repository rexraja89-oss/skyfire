# Realistic graphics — Phase 1 (Jungle Ridge terrain only)

## Rollback point
- Branch `baseline-v4.8` on GitHub = commit `2a8ece5` (v4.8, build 19), the last release before Phase 1.
  (Git tags cannot be pushed from the build environment, so the rollback point is a branch.)
- Phase 1 was released in v4.9 after Rex approved it (with the review fixes below).

## Baseline (before)
- Renderer: three.js r128 WebGL, ACES tone mapping, one 1024² PCF-soft sun shadow map over a fixed 120×220-unit box
  (0.117 × 0.215 units per texel), no post-processing.
- Jungle Ridge terrain: smooth noise height field (5 streamed tiles, 121×55 vertices each), colour = one flat colour per
  vertex (`paint()` + `cf()`), one tiled grass texture, normals from `computeVertexNormals()` per tile.
- Screenshot method (identical for before/after): `p1shots.js` in the test harness — Jungle Ridge, Easy, invincible,
  enemies removed, jet parked at the centre, screenshots at t ≈ 4.8 s, 15.8 s, 25.8 s, 412×915 CSS px at 2× pixel ratio,
  headless Chromium with SwiftShader (software GPU).
- Draw stats in those frames: 38–39 draw calls, 464k–486k triangles, 14 textures.

## Phase 1 changes (Jungle Ridge only; other missions render the same as before)
1. Terrain silhouette: rocky uplands that rise in terraced ledges with steep, irregular cliff faces; river valley kept.
2. Five tileable material layers generated locally (`tools/terrain_tex.py` → `art/ter_*.jpg`): grass, soil, rock, moss,
   gravel, plus ground and rock normal maps and a macro-variation map. Layers are chosen per vertex by slope, height,
   distance to the river, "under a cliff" and noise (`BIOME.forest.splat`), and blended per pixel using each texture's
   own height so stones and rock break through grass naturally.
3. Restrained colours: olive/straw grass, grey-beige rock, brown soil; large-scale brightness and dry/damp variation.
4. Ambient occlusion per tile: horizon sampling of the height field (8 directions, 4 steps) plus contact occlusion under
   trees, boulders and ruins. Applied to indirect light (and half of direct light).
5. Steep terrain: triplanar rock (no stretching on cliff faces); the side projections are only sampled on steep pixels;
   large-scale rock weathering comes from the macro map.
6. Sun shadows fitted to the visible ground every frame, 2048² in HQ: 0.086 × 0.069 units per texel
   (≈1.4× / 3.1× sharper per axis, ≈4.3× more texels per area). Smooth mode keeps shadows off and uses a lighter shader.

Code: `js/terrain_pbr.js` (material, tile fill, AO, shadow fitting), `BIOME.forest` in `js/world.js` (`pbr:1`, height
field, `splat`, `wet`, `occ`, props), small hooks in `fillTile()`, `buildLevel()`, `gameCam()` and `sync3D()`.

## Verification (headless Chromium + SwiftShader — not a phone)
- Tile seams: shared edge rows of neighbouring tiles compared exactly — position, normal, colour, splat weights and AO
  differ by 0; texture coordinates differ only by whole 600-unit periods. Every layer scale is written as n/600, so
  textures repeat exactly over 600 units (up to floating-point precision).
- Popping: 60 s of scrolling, every tile rebuild checked against the camera frustum — 0 rebuilds inside the view.
- Tile build time (desktop CPU, software GL): ≈14 ms new path vs ≈11 ms old path on the same terrain
  (Harbor ≈5 ms, Desert ≈8 ms). One tile is rebuilt about every 4–5 s of flight.
- Draw stats after: 34–39 draw calls, 131k–139k triangles, 20 textures.
- Gameplay: Jungle Ridge completed by the test bot on Easy and Hard; boot, flow, death/respawn and performance tests pass.
- Other missions: Harbor, Red Canyon and Desert rendered with the baseline and the new code — same scenery
  (remaining pixel differences come from time-based water and sandstorm animation).

## Review fixes (Codex review, v4.9)
1. Normal maps: the horizontal projections now add the map's green channel to world +Z (the sign was flipped before).
2. Sampler budget: lite shader on GPUs with fewer than 12 texture units; path shown in the FPS overlay.
3. Exact periods: all scales written as n/600 (e.g. 22/600 instead of 0.036667).
4. Fetch count corrected above (the earlier report said 13; it was 15 in HQ). Reduced to 12–14 by dropping the second
   rock scale and sampling side projections only on steep pixels.
5. Visual: shaded cliffs lifted (AO floor 0.28 → 0.45, sky fill 0.42 → 0.55), fine normal detail calmer in the
   distance (less shimmer), shadow band extends above the tallest terrain filled.
Files: `fix_a/b/c.jpg` (same frames as before/after), `fix_compare_b.jpg` (v4.8-Phase-1 left, fixed right),
`moving_hq.mp4` and `moving_smooth.mp4` (8 s each, jet weaving over the ridge).

## Not verified
- Android performance has NOT been measured. No real device is available here; the headless browser uses a software
  GPU, so frame rates and shader cost on phones are unknown. The new terrain shader samples up to 13 textures per pixel
  Texture fetches per pixel (custom, plus three.js shadow/environment sampling): HQ 12 on flat ground, 14 on steep
  pixels; Smooth/lite 8. Samplers bound: HQ 8 custom + environment + shadow map = 10. GPUs with fewer than 12 texture
  units automatically get the lite shader (no extra rock projections, no fitted shadows). The Balance lab FPS overlay
  shows which path is running. Check frame rate on the phone before rolling out further.

## Files
`before_a/b/c.jpg`, `after_a/b/c.jpg` (same frames), `compare_a/b/c.jpg` (side by side), `zoom_b/c.jpg`
(2× crops of the same areas), `after_b_smooth.jpg` (Smooth graphics mode).
