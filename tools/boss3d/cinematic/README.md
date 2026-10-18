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
