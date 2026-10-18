# Mega-boss cinematic entrance (Blender)

An 8-second pre-rendered shot (portrait 576×1024, 24 fps).
1. The Stage 10 mega-boss dives out of a dusk sky over a volcanic lava plain.
2. It banks through a sweeping turn and brakes.
3. It settles facing the camera, with its glow lines powering up.

Not part of the game yet.

| File | What |
|---|---|
| `boss_entrance.py` | Builds the whole scene in Blender 4.5 from scratch and renders frames: boss, sky, terrain, lava, engines, lights, camera, animation, haze, bloom, grade. Options: `--frames a-b`, `--samples N`, `--res WxH`, `--out DIR`, `--save file.blend` |
| `render.sh` | Full render (resumable: finished frames are skipped) + H.264 encode → `megaboss_entrance.mp4` |
| `fetch_assets.sh` | Downloads the CC0 Poly Haven assets into `assets/` |

Setup (from `tools/boss3d`):
```
./setup_blender.sh && cinematic/fetch_assets.sh && node cine_glb.cjs
cinematic/render.sh 32 576x1024
```
Render time on this 4-core cloud CPU (no GPU): about 40–50 s per frame at 576×1024 with 32 samples + OpenImageDenoise, so about 2.5 h for 192 frames.

## Assets and licences
- **Boss:** `out/megaboss_cine.glb` from `cine_glb.cjs`. It is the full 188k-triangle Meshy mesh (CC BY 4.0, credit Meshy AI) with Rex's concept texture. See `../README.md`.
- **Sky:** "Industrial Sunset (Pure Sky)" HDRI, Poly Haven, CC0 (original by Sergej Majboroda, sky edits by Jarod Guest).
- **Ground:** "Aerial Rocks 02" texture, Poly Haven, CC0 (Rob Tuytel).
- Lava, mountains, flames, haze and grade are procedural, made in this script.
- **Blender** 4.5 LTS (GPL), used as a tool only.

## Rise cinematic (`boss_rise.py`, Rex's storyboard)
A mountain ridge at dusk shakes (camera shake, rubble particles, lava cracks flare). Dust clouds billow behind the ridge, lit violet from below, with lightning flashes inside. The boss rises from behind the range, dwarfing it: rocks slide off its hull, its lights flicker on, chase waves run along its light lines, wingtip and fin strobes blink, and the wings flap (an armature with smooth wing weights). The camera pulls back from the ridge until the boss fills the frame. Finale: engines ignite, the lights flash, and a dust shockwave rolls out.

Render: `cinematic/render_rise.sh [samples=24] [res=540x960]` → `cinematic/megaboss_rise.mp4`, 264 frames, 11 s at 24 fps. Resumable. About 3–4 h on 4 CPU cores.
