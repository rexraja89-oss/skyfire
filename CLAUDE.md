# Skyfire Squadron — notes for Claude

## About the owner
Rex works from a Samsung S22 Ultra only (no laptop/PC). He tests every change by opening the GitHub Pages link on his phone. Keep explanations short and practical; don't hand him long copy-paste tasks.

## Project rules
- The whole game lives in `index.html`: one self-contained file, no build step, no external assets except Google Fonts (and libraries from a CDN if truly needed, e.g. three.js from cdnjs).
- Must run smoothly in mobile Chrome at phone width; touch drag is the main control.
- Keep Rex's Workshop working (unlimited gears, max upgrades, unlock all stages, invincible mode).
- Save data uses localStorage key `skyfire-rex-v1`; wrap storage in try/catch and migrate rather than wipe when the save shape changes.

## Keep it original
Skyfire is Rex's own game in the vertical-shooter genre. Its names, jet, enemies, bosses, stages, art and sound must stay original. Don't recreate or closely imitate any existing commercial game (its title, characters, level layouts, boss designs, UI, art, music or text), even with small changes. Genre-standard mechanics (upgrades, bosses, pickups, medals) are fine; new content should be invented fresh for Skyfire. Use only self-made or properly licensed free assets (e.g. CC0 packs) and note their source and licence in the README.

## After each change
Commit with a clear message and push to `main` so GitHub Pages updates.
