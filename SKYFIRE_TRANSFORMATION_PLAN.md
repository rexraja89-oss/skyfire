# Skyfire Transformation Plan

**Status:** Checkpoint 1 (plan) and Checkpoint 2 (player, weapons, enemy engine, economy architecture) Checkpoint 3 (formations, ground combat, pickups, combo) and Checkpoint 4 (stage engine, missions, campaign on the new engine) are done. Rex asked to run Checkpoints 4-8 back to back and test only the finished, polished version. Checkpoint 5 (10 part-based bosses, 10 mini-bosses, boss presentation) is done. Checkpoint 6 (upgrade hangar, medal tiers, achievements, sortie orders, save v3) is done. Checkpoint 7 (briefing/loadout screen, animated results, HUD objectives, damage trail, transitions) is done. Checkpoint 8 (CC0 KayKit city models + engine visuals, audio mixer and music states, Balance lab, balance and performance pass) is done: the rebuild is complete (v4.0).

**Goal:** turn Skyfire from a good-looking prototype into a polished, replayable vertical arcade shooter. It should match the depth and feel of the best games in the genre, using only original Skyfire code, content, names, art and sound.

**Reference:** the private `skyforce-analysis/ANALYSIS.md` is used only for *system-level* ideas: difficulty tables per stage and mode, rubber-band power-up drops, medal-driven replay, and boss resistances. No names, layouts, bosses, numbers, art, sound or UI are copied. Every stage, enemy, boss and economy value below is new for Skyfire.

---

## 1. Current architecture (v3.1, build 4)

### Files

| File | Role |
|---|---|
| `index.html` (1,314 lines, ~151 KB) | The whole game: CSS, HTML screens and one big script wrapped in an IIFE |
| `sw.js` | Offline cache. The page is network-first; everything else is cache-first. |
| `manifest.webmanifest`, `icons/` | Installable app |
| `version.json` | Build number for the in-game update notice |
| `.github/workflows/android.yml` + `tools/` | Capacitor APK build on push to `main`. Copies **only** `index.html`, the manifest, `version.json` and `icons/`, and swaps the three.js CDN link for a bundled copy. |

### Script sections inside `index.html`

| Lines | Section | What it does |
|---|---|---|
| 234–297 | DATA | `MODES` (3 flat multipliers), `STAGES` (10 biomes, enemy list, boss kind, reward), `PLANES` (4), `WEAPONS` (5), `DRONES` (3), `PARTS` (5), `ET` (21 enemy stat rows), `cost()` = `base × 1.55^level`, 3 medals |
| 299–320 | SAVE | localStorage `skyfire-rex-v1`, `ver:2`, migrates v1, merges missing keys |
| 322–362 | 2D helpers | Canvas sprites for bullets, pickups, hangar previews and glow cache |
| 364–635 | 3D core | three.js r128 renderer, sky shader, `envCube()` reflections, camera fit, **`pj()` projection (2D logic → screen)**, `place()` (2D logic → 3D on terrain), 10 procedural biomes (height function, colours, props), 5 recycled terrain tiles with instanced props, water, lava, decals, clouds, explosion lights |
| 637–756 | 3D models | Code-built jets, helicopters, tanks, ships, drones and specials. 4 boss body kinds (ship / wing / land / gunship), each with turrets and a core. Pool with `acquire()` / `release()` |
| 758–798 | Audio | Web Audio synth effects (throttled per sound), step-sequenced music per stage key |
| 800–810 | ORION | Copilot text and voice queue |
| 811–1063 | Game state + update | `G` run object, `spawnWave()` random weighted spawner, `spawnBoss()`, effects, `kill()` / `hurt()` / `hurtPlayer()` / `bomb()`. **One ~150-line `update()`** with every enemy's behaviour in a single if/else chain, the boss logic, collisions, pickups, particles and weather |
| 1071–1164 | Render | `sync3D()` moves 3D models to match logic. `drawOverlay()` draws bullets, particles, telegraphs, popups, the boss bar and banners on the 2D canvas |
| 1166–1172 | Loop | One `requestAnimationFrame`. Variable time step capped at 50 ms. Simulation and render run together. |
| 1174–1303 | UI | Screens (title, select, hangar, settings, pause, result) built from HTML strings, Workshop, save codes, sizing, input, PWA install, update check |

### Core systems as they stand

- **Coordinates:** game logic runs in a 400-wide logical space (`x 0–400`, `y 0–H`). The 3D world and the 2D overlay are both projected from those coordinates. This is a strong base and stays.
- **Game loop:** variable `dt`, not fixed. Logic and render are coupled.
- **Controls:** relative drag. The finger moves a target point (×1.3 gain) and the ship chases it at up to 1,100 px/s. Keyboard WASD / arrows. One BOMB button.
- **Weapons:** one primary weapon per run (5 types). Level = hangar level (0–8) + in-run power (0–2) × 2. Optional homing missiles part and one drone type.
- **Enemies:** 21 types with good special abilities (shield, sniper line, cloak, split, heal, teleport, mines, SAM, artillery, shield dome). Each behaviour is hard-coded in `update()`.
- **Spawning:** a random weighted pick about every 2 s. The stage is a timer (68 s + 3 s per stage), then the boss.
- **Bosses:** one template. Turrets shield the core; phases switch at 66% and 33% HP; patterns come from a fixed list per body kind; drones and mines are summoned from stage 5.
- **Scoring:** chain counter with up to ×8 multiplier and a 1.8 s timeout. Gears drop as currency.
- **Progression:** gears buy 8 levels per weapon, drone and part. Planes, weapons and drones are unlocked as mission rewards. Modes unlock in order.
- **Save:** one JSON blob with migration and backup codes. Stores no settings version, statistics or achievements.

---

## 2. What is already good (keep it)

1. **The 3D world.** The biome height maps, instanced props, weather, sky and water make it look far beyond a typical web shooter. It is the main visual asset and stays.
2. **Logic-space projection** (`pj()` / `place()`). Gameplay stays in simple 2D while the screen shows 3D. Every new system builds on this.
3. **Original enemy ideas.** Aegis shields, Lancer sniper line, Wraith cloak, Hydra split, Mender healer, Blink teleport, Sower mines, artillery circles and shield domes are good archetype *behaviours*. They become reusable modules in the new enemy framework.
4. **Fair telegraphs.** The red sniper line, artillery circle and boss laser charge warn the player before damage lands. This becomes a project-wide rule.
5. **Model pooling, the Smooth graphics mode, save migration, backup codes, the update notice and the APK pipeline.** All of this is solid plumbing.
6. **ORION copilot.** It gives Skyfire its own voice. It stays and is driven by game events.
7. **Relative-drag control.** It's the right model for a phone. It needs tuning, not replacement.
8. **Fully generated audio.** No licensing risk. It needs a proper mixer and more sounds, but the method stays.

## 3. What makes Skyfire feel "average" today

| # | Problem | Why it hurts |
|---|---|---|
| 1 | **No authored stages.** Waves are random picks on a timer. | No pacing arc, no set pieces, no memorable moments. Every stage feels the same apart from its scenery, and replays don't reward learning. |
| 2 | **No formations.** Groups are hard-coded (`dive` line, `swoop` stream). | Destroying a group doesn't feel like an achievement, and there are no formation bonuses. |
| 3 | **Weak in-run power curve.** Only 2 power pickups per run, and level mostly comes from the hangar. | The "I'm getting stronger" feeling during a run is missing. Weapon level is not visually obvious. |
| 4 | **Bosses are one template.** HP thresholds switch phases; turrets only gate the core. | Destroying a part doesn't change the fight in a way players can read. No vulnerable/invulnerable states, no desperation attack. |
| 5 | **Flat difficulty.** One multiplier per mode plus scattered `1+.32*si`, `170+8*s` formulas. | Hard modes feel like "same but spongier". Values are spread through the code and can't be tuned in one place. |
| 6 | **Thin rewards.** 3 yes/no medals, one currency, linear 8-level tracks. | There is little reason to replay a cleared stage and little to plan for between runs. |
| 7 | **Little moment-to-moment feedback.** The chain counter is small; hit flashes, impact effects, kill bonuses and HUD reactions are minimal. | Kills feel quiet. There's no "one more kill" pull. |
| 8 | **Ground combat is shallow.** Ground units scroll by and shoot, but there are no ground objectives, installations or structures with parts. | Half of the genre's satisfaction (levelling a base) is missing. |
| 9 | **Monolithic code.** Behaviour lives in one `update()`; data and logic are mixed. | Every new enemy or boss risks breaking others, and it's hard to tune from a phone. |
| 10 | **Variable time step and per-frame allocation.** `filter()`, object literals for each bullet and particle, O(bullets × targets) collisions. | Dense waves would stutter on mid-range Android phones. Movement feel changes with frame rate. |
| 11 | **Basic flow.** Result screen is a static list; there's no loadout step, no objectives screen, no reward reveal. | The player doesn't clearly see what they earned or what to improve. |

## 4. What needs replacement

| System | Decision | Reason |
|---|---|---|
| `update()` monolith | **Replace** with separate systems (player, weapons, enemies, formations, ground, boss, pickups, scoring, director, effects) | Needed for every later checkpoint |
| Random `spawnWave()` + timer stage | **Replace** with a data-driven stage director that runs a timeline by scroll distance | Core of the authored experience |
| Enemy behaviours | **Rebuild** as archetypes: movement module + fire pattern module + optional ability, configured from data. Existing specials are ported as abilities. | Reuse without copy-paste |
| Boss logic | **Replace** with a boss engine: a part tree, a phase state machine, and attacks bound to parts | Mandatory destructible components |
| Bullets and particles | **Replace** with pooled, fixed-capacity arrays and a spatial grid for collisions | Performance with dense waves |
| Game loop | **Replace** with a fixed 60 Hz simulation step plus render interpolation | Same feel at any frame rate; responsive input |
| `MODES` flat multipliers | **Replace** with a stage × mode difficulty table plus mode-specific gameplay rules | Difficulty from gameplay, not just HP |
| Weapon code | **Rebuild** as weapon definitions with level tables (damage, rate, speed, count, spread, pierce, visual tier) | Configurable and visibly scaling |
| Economy, medals, missions | **Rebuild** with new configurable data | A real progression loop |
| Hangar and result UI | **Rebuild** (loadout, upgrade cards with current → next values, reward reveal) | Clear flow |
| HUD | **Rebuild** (animated score, combo meter, weapon level, special charge, objectives, boss bar with part markers) | Arcade polish |
| Audio | **Extend** into a mixer with buses, more effects and music states (calm, combat, boss, victory) | Feedback |
| Save | **Extend**: version 3 with migration from v2, statistics, achievements, settings and a backup slot | No progress loss |

## 5. What can be preserved

- three.js world: renderer setup, sky, `envCube()`, terrain tiles, biomes and props, water, lava, clouds and decals. It is wrapped in a `World` module, and its art direction is extended per stage zone.
- `pj()` / `place()` projection and the logic coordinate system.
- All 3D model builders. These are extended with damage states, and boss models become part-based.
- Enemy *ideas* listed in §2, reimplemented as abilities.
- ORION, re-wired to an event bus.
- Settings, Smooth mode, Workshop, save codes, update check, PWA and APK pipeline.
- The 10 stage names, biomes and boss names, which are Rex's originals. Their content is re-authored with the new stage format.
- The 4 planes and 5 weapon families, rebalanced on the new tables.

---

## 6. Proposed architecture

### 6.1 Files (no build step, still works from GitHub Pages and the APK)

The game moves from one file into a few plain script files loaded in order. They share one namespace, `SF`. There is still no build tool.

```
index.html            shell: CSS, screen markup, <script> tags
js/
  core.js             SF namespace, math, seeded RNG, event bus, pools, fixed-step loop
  config/
    balance.js        ONE place for global tunables (debug/balance mode edits these)
    difficulty.js     stage × mode tables
    weapons.js        weapon families + level tables
    enemies.js        enemy archetype definitions
    formations.js     formation shapes + paths
    ground.js         ground target definitions (incl. multi-part installations)
    pickups.js        pickup types + drop tables
    bosses.js         boss definitions (parts, phases, attacks)
    stages.js         10 stage timelines
    missions.js       objective templates + per-stage objectives
    economy.js        currency, upgrade tracks, costs, rewards, medal tiers, achievements
  world.js            three.js scene, biomes, terrain, props, models (moved from current code)
  fx.js               particle/decal/light pools, screen shake, flashes, layered effects
  audio.js            mixer, synth SFX bank, music states
  input.js            touch + keyboard, smoothing, dead-zone, sensitivity setting
  player.js           ship controller, health, i-frames, death, special attack
  weapons.js          firing, projectiles (pooled), hit resolution
  enemies.js          enemy runtime: movement modules, fire patterns, abilities
  formations.js       formation spawner
  ground.js           ground targets + installations
  boss.js             boss engine (parts tree, phase machine, attacks)
  pickups.js          drops, magnet, timed effects
  scoring.js          combo/multiplier, bonuses, popups
  director.js         stage timeline runner, checkpoints, mini-boss/boss triggers
  missions.js         objective tracking + medals
  progression.js      economy, upgrades, unlocks, achievements
  save.js             versioned save, migration, backup slot, codes
  hud.js              in-run HUD
  ui.js               menus and flow screens
  debug.js            balance panel (inside Rex's Workshop)
  main.js             boot
```

**Consequences to handle in the same change:**
- `android.yml`: copy `js/`, and add `js/**` to the trigger paths.
- `sw.js`: make `.js` files network-first, like the page, and bump `CACHE`. Otherwise a phone could run a new `index.html` with old scripts.
- `CLAUDE.md`: update the project layout section.

### 6.2 Runtime model

- **Fixed 60 Hz simulation** with an accumulator (max 4 steps per frame). The render step interpolates positions. Input is read every frame, so the ship always responds on the next step.
- **Event bus** (`SF.on('kill', …)`). Scoring, missions, ORION, audio, HUD and achievements listen to events instead of being called from inside combat code. Adding a mission type never touches combat code.
- **Entity data as flat records in pools.** Enemies, bullets, pickups and particles live in fixed-capacity arrays that are reused. There is no allocation per shot.
- **Spatial grid** (40 px cells) for collisions: player bullets vs targets, enemy bullets vs player and shield drones.
- **Damage pipeline:** `hit(target, dmg, source)` → resistances (shield, armour, part rules, boss vulnerability) → flash/spark → events. One place decides what damage does.

### 6.3 Data formats (examples, values illustrative)

**Weapon level table**
```js
vulcan: { family:'stream', levels:[
  { dmg:1.0, rate:11, speed:820, count:1, spread:0,   pierce:0, tier:1 },
  { dmg:1.1, rate:12, speed:840, count:2, spread:8,   pierce:0, tier:1 },
  …
  { dmg:1.6, rate:16, speed:900, count:5, spread:34,  pierce:1, tier:4 } ] }
```
`tier` selects the visual: bullet size, colour, muzzle flash, impact size and sound layer, so a stronger weapon visibly looks stronger.

**Enemy archetype**
```js
dart: { hp:3, r:12, speed:210, move:'dive', fire:{ pattern:'aimed', every:1.4, bullet:'pellet', speed:190 },
        score:150, gears:1, onDeath:'pop_s', model:'fighter' }
```
Movement modules: `dive, swoop, sine, hover, strafe, orbit, kamikaze, sideEntry, path`.
Fire patterns: `aimed, spread, ring, burst, spiral, laserLine, missile, mineDrop, mortar`.
Abilities (ported from today): `shield, cloak, split, heal, teleport, shieldDome`.

**Formation**
```js
v5:   { slots:[[0,0],[-28,-22],[28,-22],[-56,-44],[56,-44]], entry:'top', path:'dive', delay:0 },
pincer: { groups:[ {from:'left', path:'arcRight', count:4, gap:.25}, {from:'right', path:'arcLeft', count:4, gap:.25} ] }
```
Shapes: V, line, column, staggered, converging, crossing, ring (surround), wedge, and mixed (groups of different enemies). A **formation bonus** is paid when every member is destroyed.

**Stage timeline** (by scroll distance, so pacing is stable on any device)
```js
{ id:'harbor', biome:'harbor', music:'harbor', length:5200, zones:[…],
  timeline:[
   { at:  80, banner:'intro' },
   { at: 200, formation:'v5', enemy:'dart', x:.5 },
   { at: 520, ground:'gunTower', x:.25 },
   { at: 900, formation:'pincer', enemy:'skiff' },
   { at:1500, event:'convoy', count:6 },
   { at:2600, miniboss:'harborWarden' },
   …
   { at:4800, boss:'tidebreaker' } ],
  pickups:{ table:'standard', guaranteed:[{at:700,type:'power'}] },
  objectives:['killPct:80','groundAll','noHit','comboReach:40'] }
```

**Difficulty table** (`difficulty.js`)
```js
//            enemyHp  enemySpd bulletSpd density fireRate reward bossHp extra
easy:    [ [1.0,1.00,1.00,1.0,1.0,1.0,1.0,{}], …10 stages ],
hard:    [ [2.2,1.08,1.10,1.2,1.3,1.8,2.0,{aimedRings:1}], … ],
extreme: [ [3.6,1.15,1.18,1.4,1.6,3.0,3.2,{aimedRings:1,bossDesperation:1,extraSlots:1}], … ]
```
Multipliers converge across the campaign, so early stages on hard modes stay tense once the player is upgraded. The `extra` flags add *gameplay* changes on harder modes: extra formation members, aimed rings, more boss attacks and shorter telegraph-to-fire time, which is never shorter than a fair minimum.

**Boss**
```js
tidebreaker: { hp:0, model:'ship', parts:[
   { id:'deckGunL', hp:90,  hitbox:[-120,0,22], attacks:['aimedBurst'] },
   { id:'deckGunR', hp:90,  hitbox:[ 120,0,22], attacks:['aimedBurst'] },
   { id:'launcher', hp:140, hitbox:[ -60,10,26], attacks:['missileVolley'] },
   { id:'shieldGen',hp:120, hitbox:[ 60,10,24], grants:'coreShield' },
   { id:'core',     hp:400, hitbox:[ 0,0,30], vulnerableWhen:'!shieldGen', isKill:true } ],
  phases:[
   { until:'always', attacks:['wake'] },
   { when:'parts<=3', attacks:['+fanSweep'], banner:'Deck guns down' },
   { when:'!shieldGen', attacks:['+coreLaser'], say:'Core exposed!' },
   { when:'coreHp<.25', attacks:['desperationRing'], speed:1.4 } ],
  resist:{ bomb:.25, special:.5 }, death:'shipSink', reward:{ gears:400 } }
```
Destroying a part removes its attacks, changes the model (smoke, missing gun) and can switch the phase. The player can see that the weapon is gone and its attack stopped.

### 6.4 Original content plan

All names below are new for Skyfire, and the final list is Rex's call.

- **Air archetypes (10):**
  - Dart (basic diver)
  - Swift (fast side-entry)
  - Brute (heavy, slow, armoured nose)
  - Wing-leader (formation captain; killing it scatters the formation)
  - Hawk-diver (dives at the player's lane)
  - Side-runner (crosses the screen while strafing)
  - Gunboat (hovers and shoots)
  - Bulwark (frontal armour; hit it from the side)
  - Tender (heals and buffs; today's Mender)
  - Phase-craft (special abilities; today's Wraith, Blink and Hydra)
- **Ground (8):**
  - gun tower
  - armoured car / tank column
  - radar dish (boosts nearby enemy fire rate until destroyed)
  - missile battery
  - factory: a multi-part building whose chimneys and doors spawn units until destroyed
  - fuel depot (chain explosion)
  - comms mast (calls reinforcements)
  - bunker (armour opens only while firing)
- **Pickups:**
  - power cell (weapon level +1)
  - overdrive (8 s super weapon)
  - shield bubble
  - repair
  - special charge
  - score ×2 (10 s)
  - gear cache
  - rare "medal chip" for the collection objective
- **Bosses:** keep the 10 current boss names. Each gets its own part layout and phase script:
  - Tidebreaker, a battleship with deck guns, launcher and shield generator
  - Harvest Reaper, a crawler with scythe arms that cut lanes
  - Dune Crawler, multi-segment, with segments destroyed one by one
  - Ridge Gunship, rotor pods and a chin cannon
  - Iron Leviathan, a sub that surfaces and dives (invulnerable while submerged)
  - Reef Carrier, with deck launchers that release fighters
  - Canyon Colossus, a walker whose legs drop it into a vulnerable stance
  - Polar Talon, a wing whose shield pylons must be cut
  - Skyline Sentinel, holo-decoys and a real core
  - Inferno Throne, a multi-stage final boss with a desperation phase
  - plus 4–5 **mini-bosses**

### 6.5 Economy (original, monetization-ready)

*Updated after Checkpoint 1 at Rex's request: Skyfire may be published on Google Play and monetized. The economy is built so real-money purchases can be added later without changing progression code. **No payment processing is implemented yet.***

**Currencies**
- **Gears** (normal currency) are earned from stages, missions, medals and rewards, and buy normal upgrades.
- **Cores** (rare premium currency) are earned in play in limited amounts (first clears, medal tiers, boss first kills, achievements, sortie orders) and can later be bought. They pay for high-tier upgrade levels and selected premium features.

**Layers (kept apart)**

| Layer | File | Gameplay may use it? | Responsibility |
|---|---|---|---|
| `SF.wallet` | `js/economy.js` | yes | `balance`, `canAfford({gears,cores})`, `spend(cost, reason)`, `grant(currency, n, source)` |
| `SF.ent` | `js/economy.js` | yes | `has(id)`, `perk(name)`: "does the player own this?" |
| `SF.billing` | `js/economy.js` | **no** (store UI only) | provider registry, product query (localised prices come from the store), purchase → verify → fulfil once per transaction → finish/consume, restore |
| Catalog | `js/config/economy.js` | data | product ids, consumable or non-consumable, what each grants. **No prices.** |

**Example products** (final list and prices decided later):
- `core_pack_small`, `core_pack_medium`, `core_pack_large`, `gear_pack` (consumable)
- `starter_pack`, `remove_ads`, `premium_upgrade_pack` (non-consumable, restorable)

**Provider interface.** Google Play Billing becomes a new provider object with these functions, registered via `SF.billing.register()`:
- `init`
- `available`
- `queryProducts`
- `purchase`
- `verify` (server-side later)
- `finish`
- `restore`

Today the game runs with a `none` provider, so no store shows. A `dev` provider with no money involved exists only so automated tests can exercise the full purchase → fulfil → restore path. Transactions are recorded in the save (`txn`) so a receipt is never granted twice.

**Fair-play rules** (also written at the top of `js/config/economy.js`):
1. A free player can finish every stage and mode and max every upgrade through play.
2. Anything that costs Cores is also reachable with Cores earned in play. Paying only makes it faster.
3. Paid items are convenience, faster progression, cosmetics, optional extra content or support. There is no paid-only power, no paid-only main-campaign stage and no pay-to-continue.
4. Randomised rewards are never sold for real money.

**Upgrades and rewards (Checkpoint 6):**
- **Upgrade tracks** (configurable, 10 levels each): main gun, wing weapon, hull, shield regen, special attack, magnet, drones.
- Each level shows *current value → next value* and a cost from `economy.js` (gears; plus cores from level 7). Cost curve about ×1.45 per level with a steeper final 2 levels.
- **Medal tiers per stage × mode:** Spark, Flare, Blaze, Skyfire. Each tier pays one-time gears and cores.
- **Repeatable:** sortie orders (3 rotating date-seeded objectives), lifetime statistics, about 30 achievements.
- **Unlocks:** stage N+1 on clearing stage N; modes as today (beat mission 10 to open the next mode); planes and weapon families via stage rewards and Cores.

### 6.6 Save v3

- Same key (`skyfire-rex-v1`), `ver:3`, migrated from v2:
  - Gears kept.
  - Each purchased level is refunded at the old price into the new system, so no value is lost.
  - Medals map to the Spark tier.
  - Best scores and owned items kept.
- Writes are throttled. A copy of the previous good save is kept under a second key, `skyfire-rex-v1-bak`, and restored automatically if the main save fails to parse.
- New fields: `stats`, `achievements`, `missions`, `cores`, `settings.sensitivity`, `settings.shake`, `debug`.

### 6.7 Debug / balance mode

Inside Rex's Workshop there's a **Balance** panel. Its sliders override `balance.js` multipliers at runtime and are saved separately:
- enemy HP, speed and damage
- spawn density
- weapon damage and fire rate
- upgrade cost and reward multipliers
- boss HP
- power-up drop rate
- stage difficulty offset

It also has:
- **Jump to stage section** (start at any timeline marker, including the boss)
- **Show hitboxes**
- **FPS / entity counter**

The existing Workshop buttons stay.

### 6.8 Performance budget (mid-range Android, Smooth mode)

| Item | Cap (HQ / Smooth) |
|---|---|
| Player projectiles | 260 / 180 |
| Enemy projectiles | 320 / 240 |
| Particles | 700 / 280 |
| Active enemies | 70 |
| Point lights for explosions | 3 / 0 |
| Shadows | on / off (as today) |
| Pixel ratio | ≤ 2 / ≤ 1.25 (as today) |

- Collision via a grid, and no allocation in the hot loop.
- Overlay draws are batched by type, with pre-rendered glow sprites (already used).
- The FPS counter in debug mode checks each checkpoint against these limits.

---

## 7. Implementation roadmap

**Ground rules for every checkpoint:**
- Work on a branch, run the automated checks (below), then push to `main` only when the game is playable and not worse than before.
- Every push to `main` bumps `BUILD` / `VERSION` / `NOTES` and `version.json`.
- Rex can always fall back to the previous APK release.
- Never touch `tools/debug.keystore`.
- Rex's Workshop, Smooth mode, save migration and the unlock order keep working at every checkpoint.

**Automated checks I run before each push** (headless Chromium, already in this environment):
1. The page boots with no console errors, in both Smooth and High graphics.
2. A scripted bot run of each stage section reaches the boss and the result screen.
3. Old v2 save fixtures migrate without losing gears, levels, medals or unlocks.
4. Frame-time sampling with max entities stays inside the budget.
5. Screenshots at phone size (412×915) are checked for layout.

### Checkpoint 1: inspection and plan *(this document)*
Deliverable: this file. **Stop for approval.**

### Checkpoint 2: player + weapons + enemy engine ✅ done (v3.2, build 5)
- Split into `js/` files and update `android.yml`, `sw.js` and `CLAUDE.md`. Move the 3D world code unchanged into `world.js`.
- Fixed-step loop, event bus, pools, spatial grid, damage pipeline.
- **Player:**
  - tuned relative drag (acceleration and deceleration curve, edge cushioning)
  - a sensitivity setting
  - small visible hitbox core
  - health, hit flash, knockback and shake
  - 1.2 s i-frames with blink
  - death sequence (spin, explode, slow-motion 0.4 s, eject)
  - special attack button with charge
- **Weapon engine** with level tables for all 5 families. In-run power cells raise level 1 → 10 inside a run, and the hangar level raises the *starting* level and caps. There are 4 visual tiers.
- **Enemy framework:** movement modules, fire patterns, abilities. The 10 air archetypes are defined in data, and today's specials are ported as abilities.
- **Test Range:** a temporary title-screen button that spawns waves to try the new controller, weapons and enemies. The old campaign keeps working until Checkpoint 4.
- **Stop.**

### Checkpoint 3: formations + ground combat + power-ups ✅ done (v3.3, build 6)
- Formation system (shapes, entry paths, mixed groups, captains, formation-clear bonus).
- **Ground system:**
  - towers, vehicles and columns
  - multi-part installations (factory, depot chain explosion, radar buff, comms reinforcements, bunker armour)
  - hit reactions, wreck states and scorch decals
- **Pickup framework:**
  - 8 pickup types
  - drop tables with rubber-band odds
  - magnet
  - pickup animation and sound
  - timed-effect icons on the HUD
- **Combo system:**
  - combo meter with a decay timer
  - multiplier steps
  - bonuses for formation clears, ground clears, no-hit streaks and fast kills
  - popups that scale with value
- Test Range gains formation and ground scenarios. **Stop.**

### Checkpoint 4: stage engine + missions + progression hook-up ✅ done (v3.4, build 7)
- Director runs timelines by scroll distance: zones, events, mini-boss, boss, reward. Includes a checkpoint marker for debug jumps.
- Author all 10 stages in the new format using the INTRO → … → BOSS → REWARD arc, with environment zones per stage (for example, harbour → open sea → cliffs).
- `difficulty.js` stage × mode tables with gameplay-based `extra` rules.
- Missions: about 12 objective templates, 3–4 per stage × mode, with live tracking and HUD toasts.
- The campaign switches to the new engine; the old spawner and the Test Range button are removed.
- Bosses temporarily use a simple placeholder version of the new boss engine. **Stop.**

### Checkpoint 5: boss framework + destructible parts ✅ done (v3.5, build 8)
- Boss engine: part tree, hitboxes, part HP, `grants` / `vulnerableWhen` rules, phase state machine, attack scheduler, invulnerable windows and telegraphs.
- Part-based boss models: a destroyed part visibly breaks (model swap, smoke, sparks) and its attack is removed.
- 10 bosses and 4–5 mini-bosses scripted.
- Boss presentation: warning, camera pull-back, name card, health bar with part markers, music switch, attack intro, multi-stage death and a reward shower. **Stop.**

### Checkpoint 6: upgrades + economy + rewards + save ✅ done (v3.6, build 9)
- `economy.js` with tracks, costs, Cores and rewards.
- Medal tiers (Spark / Flare / Blaze / Skyfire), achievements and sortie orders.
- Save v3 with migration from v2, a backup key, statistics and settings.
- New hangar:
  - loadout (plane, weapon, special, drone)
  - upgrade cards showing current → next values, cost and buy button
  - upgrade animation and sound
- **Stop.**

### Checkpoint 7: HUD + menus + presentation ✅ done (v3.7, build 10)
- HUD:
  - animated score
  - combo meter
  - health with damage trail
  - weapon level bar
  - special charge ring
  - objectives tracker
  - boss bar
  - timed-effect icons
- Flow: Title → Play → Stage select (medal tier, objectives, best) → Loadout/upgrades → Mission → Results (score breakdown, objectives ticked one by one, medal tier reveal) → Rewards → Upgrades → Next stage.
- Transitions, button feedback and haptics. **Stop.**

### Checkpoint 8: effects + audio + balance + performance
- **Visual upgrade toward a realistic 3D look (Rex, after Checkpoint 3):**
  - **A.** Replace code-built models with professionally made CC0 model packs (e.g. Kenney, Quaternius), recoloured and mixed so Skyfire keeps its own look. Sources and licences go in the README.
  - **B.** Engine visuals: bloom/glow, better lighting, textured terrain (fields, roads, rock, water detail), 3D explosions/smoke/trails instead of flat overlay sprites, a slightly tilted camera for depth.
  - **C.** Both (recommended). Rex picks A, B or C when this checkpoint starts. Everything must stay smooth on a phone (Smooth mode keeps working).
- Layered effects for explosions, impacts, sparks, smoke, fire, trails, debris, shockwaves, flashes, pickups, damage and specials. All within the particle caps and scaled down in Smooth mode.
- Environment: parallax cloud layers, ambient life per biome, zone transitions.
- Audio:
  - mixer (SFX, music, UI buses; ducking under explosions and boss roar)
  - more synth sounds covering every event in the brief
  - music states
- Full balance pass with bot runs and Rex's playtests. Tune `difficulty.js` and `economy.js` only.
- Performance pass on a mid-range profile; final version bump. **Stop.**

**Done (v4.0):** Rex chose C. Reachable CC0 source was KayKit City Builder Bits (buildings, cars, water tower) for harbor, farm, port and city; no CC0 aircraft packs were reachable, so jets, enemies and bosses stay code-built. Camera tilt 30°, fog scaled to camera distance, richer desert palette, vignette. Audio: sfx/music buses, ducking, calm/combat/boss/victory music, new event sounds. Balance lab in the Workshop. Balance: combo window 3 s and lower combo targets (bots reached 13-30), upgrade growth 1.38 (all tracks ≈195k gears), Core costs 2/3/5/8. Smooth mode uses fewer KayKit buildings in the city.

---

## 8. Decisions I need from Rex (my recommendation first)

1. **Split into several files under `js/`** (recommended) or keep everything in one big `index.html`. Several files make the game much easier to tune and maintain. It needs the small `android.yml` / `sw.js` changes described in §6.1.
2. **Second currency "Cores"** for top upgrades and medals (recommended), or gears only.
3. **Keep the 10 stage names, places and boss names** and re-author their content (recommended), or rename and redesign everything.
4. **Old progress:** refund purchased levels as gears into the new upgrade system (recommended), or start upgrades fresh while keeping unlocks.
5. **Test Range button** visible on the title screen during Checkpoints 2–3 (recommended so you can feel the new controls on your phone early), or hidden in the Workshop.
