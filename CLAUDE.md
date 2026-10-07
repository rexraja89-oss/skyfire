# Skyfire Squadron — notes for Claude

## About the owner
Rex works from a Samsung S22 Ultra only (no laptop/PC). He tests every change by opening the GitHub Pages link on his phone, or by installing the Android APK. Keep explanations short and practical; don't hand him long copy-paste tasks.

## Project layout
- `index.html` — the whole game (one self-contained file, no build step, no external assets except Google Fonts; libraries from a CDN only if truly needed).
- `manifest.webmanifest`, `sw.js`, `icons/` — installable app (PWA) + offline support.
- `version.json` — in-game update notice. **Bump `build` here and `BUILD`/`VERSION`/`NOTES` in `index.html` together** on every release so ORION tells players an update is ready.
- `.github/workflows/android.yml` + `tools/` — GitHub Actions builds the Android APK with Capacitor on every push to `main` and publishes it as the latest release. `tools/debug.keystore` is a public debug key (keeps APK updates installable over each other).
- APK link: https://github.com/rexraja89-oss/skyfire/releases/latest/download/Skyfire-Squadron.apk

## Project rules
- Must run smoothly in mobile Chrome at phone width; touch drag is the main control. Keep the "Smooth" graphics option working.
- Keep Rex's Workshop working (in Settings: unlimited gears, max upgrades, unlock everything, invincible mode).
- Save data uses localStorage key `skyfire-rex-v1`; wrap storage in try/catch and migrate rather than wipe when the save shape changes (current shape has `ver:2`).
- Difficulty modes unlock in sequence: Easy → Hard → Extreme (beat mission 10 of the previous mode).

## Keep it original
Skyfire is Rex's own game in the vertical-shooter genre. Its names, jet, enemies, bosses, stages, art and sound must stay original. Don't recreate or closely imitate any existing commercial game (its title, characters, level layouts, boss designs, UI, art, music or text), even with small changes. Genre-standard mechanics (upgrades, bosses, pickups, medals) are fine; new content should be invented fresh for Skyfire. Use only self-made or properly licensed free assets (e.g. CC0 packs) and note their source and licence in the README.

## After each change
Commit with a clear message and push to `main` so GitHub Pages updates and a new APK is built.
