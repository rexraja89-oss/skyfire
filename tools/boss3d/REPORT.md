# Mega-boss prototype: validation and performance report (round 2)

Prototype only: nothing here is loaded by the game. Round 2 answers the Codex review (`skyforce-analysis`, branch `skyfire-phase1-review`, `skyfire-megaboss-review/megaboss-review.md`).

Source: Rex's Meshy 6 Lite GLB, SHA-256 `39cf4e83…231d`, **unchanged**. Every build checks it.

Reproduce: `cd tools/boss3d && npm i && npm run all`, then `node capture.cjs hq 10` and `node capture.cjs smooth 6`.

All logs are written before any non-zero exit:
- `out/validation.log`
- `out/fixture/validation.log` (negative test)
- `out/game_scene.log`

## 1. Models
| | HQ | Smooth |
|---|---|---|
| Hull triangles | 24,000 | 8,066 (target 8k; pinch repair locks some vertices) |
| Manifold / watertight | **0 non-manifold**, 0 boundary edges | **0 non-manifold** (was 21), 0 boundary edges |
| Pinch repair | not needed | 4 retries, about 250 vertices locked |
| Degenerate triangles / bad or flipped normals | 0 / 0 / 0 | 0 / 0 / 0 |
| Outward winding (ray parity, 1,200 sampled faces) | 99.67% | 99.58% |
| File size (KHR_mesh_quantization) | 0.72 MB | 0.29 MB |
| glTF validator | 0 errors / 0 warnings | 0 errors / 0 warnings |

The pinches came from aggressive simplification folding thin fins and spikes onto themselves. The repair: when a simplify pass creates edges shared by more than two faces, those vertices and their neighbours in the source mesh are locked and the pass is redone, until there are none.

The outward-winding checks are run on the exported GLB, as the r128 loader delivers it. 99.6% is not 100%: the AI mesh has small overlapping shells, so self-intersection is not ruled out.

## 2. Shape against the full 188k original
Outline overlap (IoU), 1024 px masks:

| View | HQ | Smooth | Limit |
|---|---|---|---|
| Top | 99.74% | 99.31% | ≥ 98% |
| Game camera | 99.79% | 99.37% | ≥ 98% |
| Rear | 99.15% | 96.17% | ≥ 95% |
| Side | 99.26% | 95.42% | ≥ 95% |
| Low rear-quarter | 99.54% | 98.65% | ≥ 95% |
| Bottom | 99.74% | 99.32% | ≥ 93% |

Per region: overlap / missing pixels / top-surface height error (mean · p95 · max), in world units (0.1 = 1 game px).

| Region | HQ | Smooth |
|---|---|---|
| Cockpit | 100% / 0% / 0.016 · 0.043 · 0.97 | 100% / 0% / 0.042 · 0.115 · 1.01 |
| Wing L | 99.80% / 0.17% / 0.010 · 0.027 · 2.02 | 99.47% / 0.38% / 0.030 · 0.090 · 1.57 |
| Wing R | 99.78% / 0.17% / 0.012 · 0.032 · 1.63 | 99.44% / 0.45% / 0.030 · 0.082 · 1.95 |
| Thrusters | 99.24% / 0.56% / 0.020 · 0.053 · 1.54 | 97.97% / 1.58% / 0.059 · 0.157 · 1.90 |
| Nose spikes | 99.30% / 0.61% / 0.017 · 0.042 · 3.52 | 98.16% / 1.58% / 0.045 · 0.123 · 3.73 |

Limits: overlap ≥ 95%, missing < 2%, mean < 0.1, p95 < 0.3, at least 500 pixels covered in the region.

- **Max errors** (1–3.7 units) are single pixels on outline edges and thin spike tips, where one surface is replaced by the one below it. They are reported but not asserted, since p95 is the robust measure.
- **Underside** (thinned on purpose): mean error 0.03 (HQ) and 0.14 (Smooth), p95 0.09 and 0.44.

## 3. Placement, strips, anchors, look layer (asserted)
- **Nose direction**, checked in Skyfire's real camera: nose at screen y +0.37, engines at −0.36.
- **Strips:** 409 sampled vertices per model, all on the hull. Buried: 2 (HQ) and 1 (Smooth). Floating: 2 and 2. Limits: < 1% buried, < 3% floating.
- **Engine anchors:** 3, at the rear, pointing −Z.
- **Weapon-bay markers:** 7, hidden, each with a deploy direction. Gap to the hull < 0.05, and L/R pairs mirror within 0.01.
- **Look layer**, rendered and sampled in a test render:
  - Canopy: dark violet glass (148,68,220) against white hull (243,243,243).
  - Nozzle interior heat, with the engine effects hidden: violet.
  - Engine discs: violet.
- **Draw objects:** HQ 6, Smooth 5 (were 17 and 15).

## 4. Fixes for the Codex findings
| # | Finding | Fix | Proof |
|---|---|---|---|
| 1 | Reversed `smoothstep` edges (undefined GLSL) | All 5 now `1.-smoothstep(lo,hi,x)` with the same falloff. New `lint_glsl.cjs` rejects reversed literal or same-expression edges | Lint fails on the old file (5 hits, exit 1) and passes the new one. Compile errors are fatal in validation. Mask colours asserted |
| 2 | Validation exited 0 on failures | `validate.cjs` and `game_scene.cjs` assert every check (validator errors, outlines incl. game camera, regions with coverage, finite values, run state, sample counts, browser and shader errors) and exit 1. Logs are written first | `npm run test:negative`: the broken fixture (hull 10% narrower, one marker lifted) fails 17 checks, exit 1 |
| 3 | Performance numbers not a safety bound | "Upper bound" wording removed. New method: §5 | — |
| 4 | 21 non-manifold edges (Smooth) | Pinch repair in `build.cjs` | 0 in both models; manifold and watertight asserted on the exported GLB |
| 5 | Per-frame `Matrix4` allocation, no disposal | Scratch matrix reused. `A.dispose()` releases all per-instance geometry, materials and the light; the glow texture is shared on purpose. Ownership is documented in `megaboss_fx.js` | 8 load/unload cycles and 6 quality switches: geometry and texture counts return to baseline (§5) |

**New defect found while fixing #5 (and in Codex's question D).** three.js r128's `BufferAttribute` getters return raw integers for normalized (quantized) attributes. The GPU path is correct. Any CPU-side use of the quantized GLB therefore gets integer-scale coordinates: merging, raycasts, hit tests, computed bounds. The new strip merge de-normalizes (`rd()` in `megaboss_fx.js`), and so do all lab checks (`deq()`).

The validation log records it: position[0].x reads as raw Int16 `5336` instead of a de-normalized value. Game integration must never raycast the raw quantized mesh.

## 5. Performance (development evidence only)
**Setup**
- Real game, stage 10, headless Chromium at the S22 Ultra's CSS size (412 × 915) and DPR 2.625. The game caps the canvas at 2 (HQ) and 1.25 (Smooth).
- Seeded workload: the stage's own waves, plus 10 extra enemy bullets and 1 explosion every 8 frames.
- Per mode: 1 boss-free control run, then 3 runs with the boss shown on alternate frame pairs.

**Frames are drawn by SwiftShader on the CPU (about 0.35–0.9 s per frame), so nothing here predicts phone FPS. The mobile gate stays pending until Rex measures on the S22.**

| | HQ | Smooth |
|---|---|---|
| Fixed-frame boss cost (same frame with and without the boss; scene render incl. shadow pass; 5 identical repeats) | **+6 draw calls, +26,668 triangles** (was +17) | **+5 draw calls, +9,464 triangles** (was +15) |
| Full-frame draw calls added (median of all passes per frame, A/B) | +6, +6, +6 | −3, −7, −17 |
| Samples per bucket (without / with), 3 runs | 10/11, 10/11, 10/11 | 25/25, 23/25, 24/25 |
| Steady-state frame time, median change | +7.8%, +12.0%, +14.0% | +9.5%, +9.5%, +9.5% |
| Steady-state frame time, p95 change | +13.2%, +19.2%, +17.3% | +8.7%, +21.7%, +8.7% |
| Slow frames (> 2.5× median) during sampling | none in 3 runs; none in the control | none in 3 runs; none in the control |

Smooth's full-frame call counts swing because the game's own object count varies frame to frame. The fixed-frame row is the exact boss cost.

**First-appearance hitch (real issue for integration).**
- The first gameplay frame with the boss takes about 3.2–3.4 s (HQ, vs about 0.85 s normal) and about 1.4–1.55 s (Smooth, vs about 0.35 s), in every run.
- three.js compiles all 6 boss programs during the warm-up render (HQ 19 → 25, Smooth 28 → 33 before that frame), so the extra time is the driver (here SwiftShader) setting up pipelines the first time the boss is drawn through the game's real path: grade render target, shadow pass, additive blending.
- Phones have the same kind of first-use cost, though much shorter.
- **Integration requirement:** pre-warm the boss through the game's own render path during the stage intro or mission title, before it can be seen. Then measure the first-appearance frame on the S22.

**Load:** GLB fetch + parse about 0.82–0.95 s (HQ) and 0.34–0.39 s (Smooth) on this CPU renderer. Look-layer build 1–8 ms.

**Resources:** paused-frame cycles, measured in a paused frame because the running game creates its own objects.
- 8 load/unload cycles: 64 geometries → 69–70 while shown → back to 64 every time. Textures stay at 22.
- 6 HQ/Smooth switches: 0 geometry and 0 texture left behind.
- JS heap 31–36 MB throughout.

## 6. Visual evidence (`review/`)
- **`megaboss_hq_stage10.mp4`** (10 s) and **`megaboss_smooth_stage10.mp4`** (6 s), in the review share folder (kept out of this repo; regenerate with `capture.cjs`): normal-speed motion in the real stage 10. A virtual 30 fps clock makes playback match game time. No audio; the boss adds no sound in this phase.
- **`compare_concept_viewer_game.jpg`:** concept top view (nose down) | HQ straight down | stage 10 gameplay camera | the identical frozen frame without the boss.
- Viewer shots, outline difference images, colour presets.
- **Stage 10 colour (Codex B):** the boss-local in-game preset is kept, and the stage grade is unchanged. The hull still reads slightly pink in stage 10. The final choice is Rex's, from the matched frames and motion.

## 7. Licence (Codex F)
Meshy Terms of Use (https://www.meshy.ai/terms-of-use, last updated 19 Sep 2026, section 3.2): free-plan output is owned by Meshy and licensed CC BY 4.0 with credit. It is not Skyfire's property.

Credit text and the modification notice are in `README.md`. An in-game credits screen is required at integration. Rex still has to confirm where the concept sheets come from.

## 8. Gates (unchanged by this round unless stated)
- **Correctness:** all confirmed findings fixed and asserted. Ready for Codex re-review.
- **Visual target:** pending a direct comparison by Rex and Codex (matched frames + motion supplied).
- **Phone performance:** pending S22 measurement, plus the first-appearance pre-warm at integration.
- **Licence:** source verified (Meshy ToS §3.2); the concept-sheet origin is pending Rex.
- **Gameplay integration:** not implemented, not approved.
