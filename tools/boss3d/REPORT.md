# Mega-boss prototype: validation and performance report (rounds 2–5)

Prototype only: nothing here is loaded by the game. Round 2 answers the Codex review (`skyforce-analysis`, branch `skyfire-phase1-review`, `skyfire-megaboss-review/megaboss-review.md`).

Source: Rex's Meshy 6 Lite GLB, SHA-256 `39cf4e83…231d`, **unchanged**. Every build checks it.

Reproduce: `cd tools/boss3d && npm i && npm run all`, then `node capture.cjs hq 10` and `node capture.cjs smooth 6`.

All logs are written before any non-zero exit:
- `out/validation.log`
- `out/fixture/validation.log` (negative test)
- `out/game_scene.log`

## 0. Round 3: Rex's concept painted onto the 3D hull
Rex preferred his concept's detail (panels, cockpit glass, red/violet light lines) over the plain white hull, so the concept top view is now the boss's texture.
1. **Cut-out and fit:** `concept_tex.py` cuts the ship out of concept sheet B (GrabCut) and turns it nose-down. A plain scale/offset fit onto the model's top-down outline reached only 80% overlap, because the concept and the Meshy model differ in proportions. So the concept is warped with a thin-plate spline through 15 matched features: nose, nose spikes, wing tips, fin tips, 3 engines, cockpit ends. Result: 84.5% overlap. 91% of the model's top area is covered by concept detail; the rest (mostly thin rear fins) is plain hull white, feathered in.
2. **Textures:** base colour and a glow map (the concept's red/violet lines plus a soft halo), 1024² for HQ and 512² for Smooth, projected from above via planar UVs. GLB size: HQ about 1.0 MB, Smooth about 0.42 MB.
3. **Look layer, concept mode:**
   - steep faces fade to plain hull colour, so the top-down paint doesn't smear down the sides
   - the procedural canopy and panel seams are off (the concept has its own)
   - the glow pulses
   - a "self-lit" share keeps the painted colours readable under Stage 10's orange light; in-game preset 0.6, an art-directed fill
   - the extra strip meshes are off by default
   - boss draw calls: **4** (HQ and Smooth)
4. **Limits:**
   - The concept's top view is only about 390 × 480 px, so it is soft when enlarged. A larger original from Rex would sharpen it.
   - The concept was drawn with its own lighting, which is now part of the paint.
   - The painted look is only correct from above, which is the game's camera.
5. Validation was extended to concept mode: the canopy is checked as an area average, and nozzle heat must render violet in both LODs. This caught a real bug in my edit (a comment had swallowed the line that sets the key light and nozzle heat), which is now fixed.

## 0b. Round 4: sharper, and tuned to match the concept
1. **Sharper:** the concept top view is upscaled 4× with the EDSR super-resolution model (offline, Apache-2.0 weights), then lightly sharpened. The warp stays on the original pixel grid. Base-colour texture: HQ 2048 px (was 1024), Smooth 1024 px (was 512). Glow textures stay at 1024 / 512. Texture sharpness (Laplacian variance, cockpit and wing area): 25 → 42. GLB size: HQ 1.33 MB, Smooth 0.53 MB.
2. **Closer to the concept, measured:**
   - `tune.cjs` renders the boss straight down over exactly the texture area. `tune_score.py` compares each render with the warped concept, using mean CIE ΔE (colour) and edge-map correlation (detail).
   - 288 settings over 2 rounds. The best is a mostly self-lit, matte, slightly dimmed hull with gentle glow, since the concept already has its lighting painted in.
   - Chosen: selfLit 0.85, roughness 0.85, reflections 0.25, tint #b8b8b8, glow 0.8. **ΔE 11.3 → 7.1, edge match 0.785 → 0.866**, within 0.1 of the best score. A little real lighting is kept so the boss still shows depth when it moves.
   - Engine flames: violet core (was near-white), length 5.5 (was 7), closer to the concept's glowing purple nozzles.
3. **Cost after round 4 (asserting in-game test, passed):** fixed frame HQ +4 draw calls / +24,252 triangles, Smooth +4 / +8,318. Steady frame-time median change on SwiftShader: HQ +10.0–17.2%, Smooth +8.3–13.0%; no slow frames; resources back to baseline. One-file phone viewer: 3.2 MB (was 2.1 MB) because of the larger textures.
4. **Stage 10:** 4 colour variants were compared in-game. The current preset keeps the most detail. Brighter or cooler variants wash out to pink under the stage's colour grade.

## 0c. Round 5: first retractable weapon bay (left wing missile bay)
Rex approved the weapon-bay design (warning → doors → weapon up → fire → retract; hittable only while up; destroyed bays stay dead) and asked for the first bay. Viewer and test pages only; **no game integration** (no hit boxes, damage, score or sound wired into the game).

**How it is built** (`viewer/megaboss_bays.js`, all at runtime from the loaded hull, so it fits both LODs):
- **Doors:** two leaves cut from the hull surface (ray-sampled over the bay footprint) and painted with the hull's own concept texture, UVs and shader, so a closed bay is invisible apart from a faint seam. They hinge open in the vertex shader, so all doors of all bays are one draw call.
- **Bay interior:** a patch over the opening whose shader ray-traces a box under the surface (walls with ribs, floor plates, red lip lights, violet uplight, and the lower part of the weapon still in the bay). The hull is not cut and stays watertight.
- **Weapon:** a vertical launch block with 2 × 3 tubes and missile noses. Fired missiles hide, red tube rings charge before a launch, and violet edge strips match the concept.
- **Placement:** on the clean white wing panel beside the violet wing stripe, centre (±12.7, 1.0), long side parallel to the stripe. The `wb_missile_L/R` markers in the GLBs were moved there (rebuild + validation passed).
- **Events:** the bay reports events (warn, open, deploy, missile, hold, retract, close, hit, dead, smoke, spark) with world positions. The host turns them into effects. In the viewer that is `viewer/bay_demo.js` (3D homing missiles, particles, synth sounds); in Stage 10, `bays_game.cjs` uses the game's own homing enemy missile and its explosion and smoke effects.

**Cycle:** warn 0.8 s (red edge pulse on the doors) → open 0.4 s → deploy 0.45 s → salvo of 6 (0.13 s apart) → hold 0.6 s → retract 0.45 s → close 0.35 s. HP 60. The weapon can be hit only while it is up. At 0 HP: doors blown back and scorched, charred stump left tilted in the hole, embers and smoke for the rest of the fight. All values live in `BAYS_CFG`.

**Asserted** (`bays_test.cjs`, virtual 30 fps clock; `out/bays/bays_test.log`):
- **Closed bay vs no doors, same frozen frame:** mean difference 2.25 (HQ) / 2.11 (Smooth) out of 255. Pixels differing by more than 24: 3.2% / 2.7%, which is the seam.
- **Cycle:** state order and durations match `BAYS_CFG.timing` within one frame; 6 missiles fired.
- **Hits:** refused while hidden; the weapon can be hit only while up; hits while firing destroy the bay; a destroyed bay stays dead, can't be re-triggered and keeps smoking.
- **Draw calls:** closed bay +1 (doors), open bay +3 (doors, interior, weapon).
- **Cleanup:** 4 build/dispose cycles leave no geometry behind. Marker sits at the bay centre. No page or shader errors. GLSL lint covers the new shaders.

**Videos:**
- `out/bays/bay_closeup.mp4` (close-up cycle + destruction) and `out/bays/bay_game_view.mp4` (game camera).
- `bays_game.cjs` → `out/bays/bay_stage10_hq.mp4`: the real Stage 10 with the game's own missiles. Not committed, 5.4 MB.
- Stills: `review/bay_*.png`.

**Viewer:** "Weapon bays" section with Fire salvo, Auto cycle, Hit weapon, Repair and Sound buttons, and tap-to-hit on the raised rack. New camera option "Bay close-up".

**Open:**
- In the game view the bay is small (about 29 CSS px), so the warning pulse and missile trails carry the read. Rex to judge on the phone.
- Next bays (drones, cannons, central lance) reuse the same layers; batching all bays keeps the plan's extra 4–6 draw calls.

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

## 5. Performance (development evidence only; round 3 numbers, concept texture on)
**Setup**
- Real game, Stage 10, headless Chromium at the S22 Ultra's CSS size (412 × 915) and DPR 2.625. The game caps the canvas at 2 (HQ) and 1.25 (Smooth).
- Seeded workload: the stage's own waves, plus 10 extra enemy bullets and 1 explosion every 8 frames.
- Per mode: 1 boss-free control run, then 3 runs with the boss shown on alternate frame pairs.

**Frames are drawn by SwiftShader on the CPU (about 0.35–0.9 s per frame), so nothing here predicts phone FPS. The mobile gate stays pending until Rex measures on the S22.**

| | HQ | Smooth |
|---|---|---|
| Fixed-frame boss cost (same frame with and without the boss; scene render incl. shadow pass; 5 identical repeats) | **+4 draw calls, +24,252 triangles** (round 1: +17) | **+4 draw calls, +8,318 triangles** (round 1: +15) |
| Full-frame draw calls added (median of all passes per frame, A/B) | +4, +4, +4 | +4, +4, +4 |
| Samples per bucket (without / with), 3 runs | 10/10, 9/11, 10/11 | 24/25, 24/24, 23/24 |
| Steady-state frame time, median change | +11.5%, +16.0%, +10.0% | +14.3%, +14.2%, +9.1% |
| Slow frames (> 2.5× median) during sampling | none in 3 runs; none in the control | none in 3 runs; none in the control |

**Load (important for integration).**
- With the concept textures, GLB fetch + parse + texture decode takes about 6.6–6.8 s (HQ) and 2.7–2.9 s (Smooth) in this CPU browser (round 2 without textures: 0.8 s and 0.4 s). Look-layer build 1–15 ms.
- The phone decodes JPEG far faster, but the boss **must be loaded at stage start (or behind the mission title), never when it appears**.

**First appearance.**
- Round 2 (no textures) showed one slow first gameplay frame (HQ about 3.3 s vs 0.85 s; Smooth about 1.5 s vs 0.35 s).
- Round 3 measured from the moment the boss is in the scene: first 4 frames HQ 0.92–1.03 s and Smooth 0.37–0.43 s, which is the normal steady cost. No hitch frame was measured.
- I can't fully explain why it went away (the textured model loads through a different path). **Pre-loading and a pre-warm render through the game's own frame stay integration requirements**, to be measured on the S22.

**Resources:** paused-frame cycles, measured in a paused frame because the running game creates its own objects.
- 8 load/unload cycles: 64 geometries → 68 while shown → back to 64 every time. Textures back to baseline.
- 6 HQ/Smooth switches: 0 geometry and 0 texture left behind.

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
