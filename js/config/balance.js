'use strict';
// ============ GLOBAL BALANCE ============
// One place for the tunables of the new engine. The debug/balance panel (later checkpoint) edits the
// multipliers in SF.BAL.mul at runtime; nothing else in the code should hold magic balance numbers.
SF.BAL={
 sim:{step:1/60,maxSteps:5},
 // global multipliers (balance panel)
 mul:{enemyHp:1,enemySpeed:1,enemyDamage:1,enemyFire:1,bulletSpeed:1,spawn:1,weaponDamage:1,fireRate:1,dropRate:1,score:1},
 player:{
  dragGain:1.35,          // finger movement -> ship target movement
  smoothTime:.055,        // seconds for the jet to catch its target (lower = snappier); critically damped, no overshoot
  maxSpeed:1500,          // logic px/s, scaled by plane speed
  keySpeed:360,           // keyboard target speed
  edge:14,topFrac:.16,bottomPad:30,
  hitR:4.5,               // real hitbox radius (the bright core)
  pickupR:22,
  iframes:1.2,            // invulnerability after a hit
  hitShake:.3,
  collideDamage:20,
  deathSlowmo:.45,deathSlowScale:.3,deathTime:2.4,respawnInv:2.5,
  baseHp:100,armorPerLevel:20,
  regenPerLevel:.6,regenDelay:3,   // Repair nanites: hull per second per level after this many seconds without a hit
  gearValueStage:.3,               // each gear pickup is worth 1 + this × stage index
 },
 special:{                // Skyburst: tap the special button
  meterMax:100,perKill:4,perDamage:.12,startCharges:1,maxCharges:3,bonusChargesPerBombPart:.5,
  radius:250,expandTime:.55,damage:70,bulletClear:true,inv:1.1,
 },
 weapon:{
  maxLevel:10,
  hangarStartPer:2,       // every 2 hangar levels = +1 starting level in a run
  hangarDamagePer:.04,    // +4% damage per hangar level
  hangarRatePart:.05,     // Afterburner part: +5% fire rate per level
  deathLevelLoss:2,       // levels lost when shot down in the Test Range
 },
 enemy:{fireMinY:30,fireMaxFrac:.72,offscreenPad:90,collideRam:5},
 pickup:{                 // power cells: rubber-band odds (chance falls as the weapon level climbs)
  cellChanceByLevel:[0,.3,.25,.21,.17,.14,.11,.09,.07,.055,.045],
  guaranteeEveryKills:18, // pity: a cell is guaranteed after this many kills without one
  repairChance:.03,repairAmount:.35,chargeChance:.035,chargeAmount:35,
  cellBonusAtMax:1500,magnetRange:75,fall:60,
 },
 caps:{pb:[300,200],eb:[340,260],parts:[700,280],enemies:80,pops:30},
 score:{levelUpBonus:500},
 combo:{                 // combo meter: kills inside the window keep it alive; steps raise the multiplier
  hitRefresh:.8,           // landing hits keeps at least this much time on the combo timer (kills reset it to the full window)
  window:3,steps:[0,5,12,22,35,50,70,100],mults:[1,1.5,2,2.5,3,4,5,6],
  hitKeep:.5,             // fraction of the combo kept when you take damage
  groundCount:2,          // a ground kill adds this many to the combo
  milestoneEvery:25,milestoneBonus:1000,
  fastKillWithin:1.2,fastKillMult:1.5, // kill an enemy within this many seconds of it appearing
  formationPerMember:200,setupPerPiece:400,
  noHitEvery:25,noHitBonus:2000,
 },
 ground:{wreckSmoke:4,smokeBelow:.5},
};
// per-run difficulty multipliers (set from difficulty.js when a stage starts) combined with the balance-panel multipliers
SF.BAL.run={};
SF.dm=k=>SF.BAL.mul[k]*(SF.BAL.run[k]||1);
