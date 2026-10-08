'use strict';
// ============ UPGRADES ============
// Every upgrade track has 10 levels. Cost of the next level: gears = base × growth^level (the last two levels
// cost extra), plus Cores from level 7 up. 'value' shows what the current and next level do in the hangar.
// Effects are read by the engine from save.wl (weapons), save.dl (drones) and save.parts (everything else).
SF.UPGRADES={
 maxLevel:10,growth:1.45,topLevelsMul:1.4,topLevelsFrom:8,
 coresFrom:7,coreCost:[3,5,8,12],   // cores for levels 7, 8, 9, 10
 // weapons (one track per family, save.wl)
 weapons:{
  vulcan:{base:120},spread:{base:150},flamer:{base:190},laser:{base:230},plasma:{base:260},
  value:l=>`Starts at gun Lv ${1+Math.floor(l/SF.BAL.weapon.hangarStartPer)} · +${Math.round(l*SF.BAL.weapon.hangarDamagePer*100)}% damage`},
 // drones (save.dl)
 drones:{
  gundrone:{base:200,value:l=>`${(SF.SIDEARMS.gundrone.dmg(l)).toFixed(1)} damage per shot`},
  laserdrone:{base:240,value:l=>`${SF.SIDEARMS.laserdrone.dmg(l)} damage, every ${SF.SIDEARMS.laserdrone.interval(l).toFixed(2)} s`},
  shielddrone:{base:260,value:l=>`Blocks bullets in a ${SF.SIDEARMS.shielddrone.radius(l)} px field`}},
 // jet systems (save.parts)
 parts:{
  armor:  {name:'Hull plating',     desc:'Extra hull',                      base:140,value:l=>`+${SF.BAL.player.armorPerLevel*l} hull`},
  regen:  {name:'Repair nanites',   desc:'Repairs hull when you avoid hits', base:180,value:l=>l?`${(SF.BAL.player.regenPerLevel*l).toFixed(1)} hull/s after ${SF.BAL.player.regenDelay} s untouched`:'Not fitted'},
  engine: {name:'Afterburner core', desc:'Faster fire rate',                base:170,value:l=>`+${Math.round(SF.BAL.weapon.hangarRatePart*100*l)}% fire rate`},
  missile:{name:'Homing missiles',  desc:'Seekers launch from the wings',   base:220,value:l=>l?`${SF.SIDEARMS.missile.dmg(l)} damage every ${SF.SIDEARMS.missile.interval(l).toFixed(2)} s`:'Not fitted'},
  magnet: {name:'Gear magnet',      desc:'Pulls gears from further away',   base:90, value:l=>`${Math.round(SF.BAL.pickup.magnetRange*(1+.35*l))} px reach`},
  bomb:   {name:'Skyburst core',    desc:'More Skyburst charges and power', base:200,value:l=>`${Math.min(SF.BAL.special.maxCharges,SF.BAL.special.startCharges+Math.floor(l*SF.BAL.special.bonusChargesPerBombPart))} starting charge(s) · +${10*l}% blast`}},
 // locked hardware can be unlocked early with Cores (it still unlocks free as a mission reward)
 unlockCores:{viper:40,titan:60,phantom:90,spread:20,flamer:35,laser:50,plasma:70,gundrone:25,laserdrone:40,shielddrone:50},
};
