# Skyfire Squadron

An original vertical arcade shooter by Rex. Runs in a phone browser, installs as an app, and ships as an Android APK.

**Play:** https://rexraja89-oss.github.io/skyfire/
**Android APK (always the newest build):** https://github.com/rexraja89-oss/skyfire/releases/latest/download/Skyfire-Squadron.apk

## Features
- Full 3D: height-mapped landscapes with mountains, rivers, coastlines, forests, cities and lava; 3D jets, enemies and part-based bosses with lighting, shadows and reflections
- 10 missions over real-world-style places: harbor, farmland, desert highway, pine forest, container port, tropical islands, red canyon, arctic base, night city and volcano, each with its own hand-built timeline of formations, ground sites, mini-boss and boss
- Easy, Hard and Extreme modes, unlocked in order (beat mission 10 on Easy to open Hard, then Hard to open Extreme)
- 10-level weapons that power up in flight with power cells: Vulcan, Spread Shot, Flamethrower, Laser Lance, Plasma Cannon, plus drones, homing missiles and the Skyburst special
- Air and ground enemies with special abilities (shields, cloaking, teleporting, healing, splitting, sniping, minelaying), data-driven formations and ground sites
- 10 bosses and 10 mini-bosses with breakable turrets, shields, weak points and attack phases
- Combo meter, score bonuses, power-ups, gear pickups and rare medal chips
- 5 objectives per mission and mode; medals Spark, Flare, Blaze and Skyfire; achievements and three daily sortie orders
- Upgrade hangar: 10 levels for every weapon, drone and jet system, paid with Gears (and a few Cores at the top levels). Everything can be earned by playing
- ORION copilot gives live callouts (text plus optional voice) and announces new app updates
- Synthesized music that changes between menus, combat, boss fights and victory
- Rex's Workshop (Settings): unlimited gears and cores, max upgrades, unlock everything, invincible mode, Test Range, and the Balance lab (live difficulty/damage/drop multipliers, start missions at the middle or the boss, FPS counter, hitboxes)

## Install
- **Android APK:** open the APK link on your phone and allow your browser to install unknown apps when asked.
- **App from the browser:** open the Play link in Chrome and tap **Install app** on the title screen (or ⋮ → Add to Home screen).

Controls: drag anywhere to fly (guns fire automatically), tap SKYBURST to clear bullets. On desktop: arrow keys / WASD, Space for bomb, Esc to pause.

## Assets
Most graphics, the music and all sound effects are generated in code by this project.

Third-party assets:
- **KayKit City Builder Bits 1.0** by Kay Lousberg (www.kaylousberg.com), licensed **CC0 1.0 Universal** (public domain, no attribution required; credited anyway). Source: https://github.com/KayKit-Game-Assets/KayKit-City-Builder-Bits-1.0 . Used: buildings A, C, E, G, three cars and the water tower, converted to compact vertex-coloured meshes in `js/assets/kaykit.js` by `tools/kaykit_convert.py`.
- **Kenney sound effects** (explosion1, explosion2, rockHit2) by Kenney (www.kenney.nl), licensed **CC0 1.0 Universal**; taken from the CC0 Kenney subset shipped in the Python Arcade package (PyPI `arcade` 2.6.17, `arcade/resources/sounds`, licence file copied to `art/snd/LICENSE-Kenney-CC0.txt`). Converted to Ogg in `art/snd/` and layered with Skyfire's own generated sound in `js/sfxbank.js`.
- **Menu soundtrack** (`art/snd/pregame.ogg`): an original Skyfire composition rendered by `tools/pregame_music.py` (no samples). It follows the trailer-sound style of a reference Rex supplied; none of that reference audio is used.
- **Storm ambience** (`art/snd/storm.ogg`, Storm Fleet stage): original, synthesised by `tools/storm_sound.py` (wind, rain, sea and ship machinery from filtered noise and tones; no recordings). It follows a storm recording Rex supplied as direction only; none of that audio is used.
- **Photo-scanned terrain textures** (`art/ter_ph_*.jpg`): from [Poly Haven](https://polyhaven.com), licensed CC0 (https://polyhaven.com/license). Downloaded and colour-matched by `tools/photo_tex.py`; assets: rocky_terrain_02, brown_mud_leaves_01, aerial_rocks_02, aerial_grass_rock, rocks_ground_05. Authors: Amal Kumar (rocky_terrain_02), Rob Tuytel (the others).
- Fonts: Bungee and Chakra Petch from Google Fonts (SIL Open Font License).
- three.js r128 (MIT) for 3D rendering; Capacitor (MIT) for the Android wrapper.
