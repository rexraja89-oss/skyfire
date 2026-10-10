# Skyfire Asset Management System — Read-only Catalog v1

Status: planning/catalog only. Branch: `skyfire-asset-catalog-lab`. No game code, APK, main branch, or releases changed.

## Purpose
Track candidate and existing art, VFX, shaders, models, and textures for a hyper-realistic Earth + futuristic sci-fi vertical shooter. Asset discovery does not grant permission to import or redistribute files.

## Existing repository evidence (README and transformation plan)
- Engine: Three.js r128, HTML5/JavaScript, Capacitor Android wrapper.
- Existing assets: original procedural aircraft/terrain, KayKit CC0 city models, Kenney CC0 sound, Poly Haven CC0 terrain textures, custom synthesized sound.
- Preserve existing asset pipelines, mobile controls, saves, and gameplay. Verify current files/versions again before implementation.

## Approved reference domains (catalog only; no automated downloading)
| Domain | Role | License caution |
|---|---|---|
| https://threejs.org | Rendering, shaders, water, postprocessing | Library MIT; example assets can differ |
| https://www.blender.org | Model authoring | Software free; model licenses independent |
| https://gltf-transform.dev | GLB optimization | Verify individual dependencies |
| https://github.com/KhronosGroup/KTX-Software | Compressed texture pipeline | Check toolchain and device support |
| https://polyhaven.com | Photoreal PBR textures/HDRI | CC0; track each asset URL |
| https://ambientcg.com | PBR textures | Check asset-specific terms |
| https://www.fab.com | Aircraft, vehicles, environments | License and file format vary |
| https://sketchfab.com | Models | Each model license differs |
| https://quaternius.com | Starter game models | Often stylized; verify specific pack |
| https://opengameart.org | 2D VFX and sprites | Varies per asset |
| https://godboyhappy.itch.io/scorch-fire-explosion-burn-vfx | Explosion candidate | Verify demo/full commercial terms before use |

## Asset register schema
Each candidate should have:
- ID, category, subcategory, display name, source domain, exact source URL, author
- License name, license URL, commercial use (yes/no/unknown), attribution text, redistribution restrictions
- Format (GLB/glTF/PNG/KTX2/audio/shader), triangles, draw calls, texture dimensions, download size, GPU memory estimate
- Target view (top-down), aesthetic (realistic/futuristic/hybrid), color variants, LOD, animation support
- Mobile tier (performance/balanced/ultra/cinematic), test FPS and device
- State (candidate/license-review/approved/tested/rejected/integrated)
- Provenance, review date, reviewer, notes

## Category taxonomy
1. Player jets, enemy jets, stealth fighters, bombers, sci-fi aircraft
2. Drones, helicopters, futuristic choppers
3. Engines, afterburners, thrusters, exhaust
4. Bullets, missiles, rockets, laser beams, plasma, energy weapons
5. Turrets, defensive shields, fictional anti-missile systems
6. Tanks, war trucks, ground defenses, military bases
7. Battleships, naval carriers, ocean effects
8. Cities, industrial facilities, bridges, destroyed buildings
9. Mountains, valleys, forests, deserts, snow, islands, coastlines
10. Explosions, fire, smoke, sparks, shockwaves, debris
11. Lighting, clouds, atmosphere, weather, cinematic postprocessing
12. Audio, UI feedback, impact sounds

## Candidate review gates
1. Source and licensing verified from original publisher; unknown = blocked.
2. Preview with top-down camera; reject unreadable silhouettes.
3. Convert/optimize only in isolated lab; never overwrite existing assets.
4. Benchmark mobile GPU/CPU, draw calls, memory, APK footprint.
5. Confirm attribution and offline bundling obligations.
6. Ask owner approval before integration, deployment, publishing, purchases or main merge.

## Implementation order
A. Inventory existing art and pipeline; capture baseline FPS and size.
B. Prototype isolated asset browser with category filters, provenance and license badges.
C. Add side-by-side comparison of jet silhouettes, engines, terrain, lasers and explosions.
D. Add graphics preset controls and mobile benchmarks.
E. Only after approval, integrate selected assets in a dedicated feature branch.

## Claude Code handoff
Read this catalog, README.md, SKYFIRE_TRANSFORMATION_PLAN.md and current project files. Produce an evidence-backed inventory of existing assets and identify missing categories. Do not assume README details are current. Do not install dependencies, download third-party assets, change game code, touch main, build/release APKs, or deploy any site until explicit approval. Propose the smallest phone-friendly interactive catalog prototype with data stored separately from game logic.
