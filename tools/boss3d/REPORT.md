# Mega-boss prototype: validation and performance report

Source: `Meshy_AI_Neon_Valkyrie_1015062249_generate.glb`, SHA-256 `39cf4e83…231d`, **unchanged**.

## 1. Source model
| Check | Result |
|---|---|
| Format | glTF 2.0 binary, 3.39 MB. Validator: 0 errors, 0 warnings |
| Geometry | 188,372 triangles, 94,136 vertices; one closed watertight piece: 0 boundary edges, 0 non-manifold edges, 0 degenerate triangles |
| Missing | No materials, UVs, normals or textures (Meshy's "generate" stage) |
| Orientation | Y up, nose −X. Turned +90° about Y so the nose faces +Z, toward the player |
| Size | Scaled ×19.22 to a 30-unit wingspan (30 × 9.5 × 36.5 world units) |
| Underside | 38% of triangles face down |

## 2. LODs
| | HQ | Smooth |
|---|---|---|
| Hull triangles | **24,000** (target 24k) | **8,000** (target 8k) |
| Hull vertices (welded → after hard-edge split) | 11,950 → 32,143 | 3,955 → 12,462 |
| Hard-edge crease angle | 38° | 42° |
| Watertight | yes (0 boundary, 0 non-manifold) | 0 boundary, **21 non-manifold edges** (simplifier artefact on the underside, not visible) |
| Bad or flipped normals | 0 / 0 | 0 / 0 |
| Underside (share of faces pointing down) | 38% → 24% | 38% → 24% |
| Strip ribbons | 2,416 triangles (core + halo) | 1,206 triangles (core only) |
| File size (quantized) | **0.72 MB** | **0.29 MB** |
| glTF validator | 0 errors / 0 warnings | 0 errors / 0 warnings |

Method: meshoptimizer `simplifyWithAttributes` (normals as an attribute) over the whole hull, then a second pass. The second pass locks every vertex touching a non-underside face, so only the hidden underside is thinned. The underside stays closed.

## 3. Silhouette and region checks (against the full 188k mesh)
Top-down masks are 1024 px over 40 units. Relief is the mean height difference of the top surface, in world units (0.01 = 0.1 game px).

| | HQ | Smooth | Requirement |
|---|---|---|---|
| Top-down silhouette overlap (IoU) | **99.74%** | **99.34%** | ≥ 98% ✅ |
| Game-camera silhouette overlap | 99.79% | 99.39% | |
| Rear view (3 nozzles) overlap | 99.15% | 96.52% | |
| Cockpit: overlap / relief | 100% / 0.016 | 100% / 0.041 | ✅ |
| Left wing | 99.80% / 0.010 | 99.47% / 0.028 | ✅ |
| Right wing | 99.78% / 0.012 | 99.44% / 0.030 | ✅ |
| Thrusters | 99.24% / 0.020 | 98.15% / 0.059 | ✅ |
| Nose spikes | 99.30% / 0.017 | 98.20% / 0.043 | ✅ |

The cockpit lies inside the outline, so its overlap score is always 100%; the relief (height) check is what validates its shape. Difference images: `review/silhouette_diff_*.jpg`.

**Nose direction** in Skyfire's real camera (fov 40, 30° tilt): nose at screen y +0.37 (lower half), engines at −0.36 (upper half). ✅

## 4. Enhancement layer (`viewer/megaboss_fx.js`, one config)
- **Hull:** MeshStandardMaterial, glossy white (roughness 0.22, metalness 0.08), lit by a painted env cube (no PMREM). Clearcoat (MeshPhysicalMaterial) is a separate HQ-only toggle.
- **Object-local shader details:**
  - dark glass canopy with a violet core line
  - swept panel seams
  - violet heat inside the nozzles
  - optional boss-only cool key light (`details.key`)
- **Strips:** separate geometry projected onto each LOD's own surface (9 red and 9 violet runs). Unlit, with a pulse; HQ adds additive halo ribbons. Paths are in `rig_src.json`.
- **Engines:** 3 anchors found automatically (radius about 1.2; centre engine 2.7 units further back). Each has a disc, a hot core, a flickering additive flame and a glow sprite.
- **Weapon bays:** 7 hidden markers on the hull surface: wing missile L/R, drone bay L/R, cannon storage L/R, central weapon system. Each has a deploy direction for future animations.

## 5. Performance
Exact cost of the boss in a Stage 10 frame (same frame rendered with and without it, 5 samples, identical each time):

| | Added draw calls | Added triangles |
|---|---|---|
| HQ | **+17** | **+26,674** |
| Smooth | **+15** | **+9,464** |

For scale: the Stage 10 scene itself is about 34–114 draw calls and about 270k triangles (mostly terrain).

Frame time, measured as the boss toggled on and off every other frame during busy combat (about 250–290 enemy bullets, 250–650 particles, explosions every 0.25 s):
- HQ: +11% frame time
- Smooth: +7% frame time

⚠️ The test browser renders on the CPU (SwiftShader), so these percentages are only a rough upper-bound signal, not phone FPS. **The real number has to come from the viewer's FPS counter on the S22.**

Mobile notes:
- No textures are added except one 64 px glow sprite and a 64² env cube.
- The in-game test adds **no new light**. A new light makes three.js recompile every material in the game; the boss can borrow one of the game's 3 explosion point lights instead. The viewer's HQ engine light is optional.
- Shader programs added: hull, halo, flame and sprite (about 4–9, compiled once).

## 6. Visual findings (review/)
- In the studio views the hull reads as glossy white, with crisp red and violet strips and purple engines (`viewer_*.jpg`).
- **In Stage 10 (Magma Citadel)**, the orange sun plus the colour grade turn a plain white hull **peach/orange**, and the red strips get lost (`ingame_colour_presets.jpg`, left). The `INGAME` preset fixes most of this: cooler base, softer reflections, boss-only key light, brighter strips (`game_*_boss.jpg`, `ingame_colour_presets.jpg` 3rd panel). A slight pink cast remains from the stage grade. Fully neutral white would need a Stage 10 grade tweak, which is an art-direction choice for Rex.
- At game size the boss spans about 75% of the lane width and about 40% of the screen height, with the nose toward the player and flames off the top.

## 7. Open items before game integration
1. Rex checks FPS and the look on the S22 with `out/megaboss_viewer.html`.
2. Decide on the Stage 10 look: keep it warm-lit, use the `INGAME` preset, or tweak the grade.
3. Tune the strip paths and marker positions in `rig_src.json` if wanted.
4. Integration plan (separate approval): a loader in `js/`, a boss data entry in `config/bosses.js`, parts mapped to the `wb_*` markers, bay-door meshes for deployment, the GLB added to `sw.js` and the APK copy, a version bump.
