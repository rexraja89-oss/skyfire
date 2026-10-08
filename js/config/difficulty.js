'use strict';
// ============ STAGE × MODE DIFFICULTY ============
// One row per stage (1-10) for each mode. Values multiply the base enemy data.
//  hp      enemy health          spd   enemy movement speed     bullet  enemy bullet speed
//  fire    enemy fire rate       dmg   damage the player takes  boss    boss health
//  reward  gears multiplier      score score multiplier
//  extra   how many extra members stream formations get (gameplay density, not just HP)
//  tele    telegraph time multiplier (sniper lines, hawk locks, mortar circles); never below SF.DIFF_MIN_TELE
// Hard/Extreme rows start high on the early stages and converge later: a player who reaches Hard stage 1
// already has late-game upgrades, so early Hard stages must still bite. Events in a stage timeline can also be
// limited to harder modes (mode:'hard' / 'extreme'), which is where most of the extra difficulty comes from.
SF.DIFF_MIN_TELE=.7;
const _row=(hp,spd,bullet,fire,dmg,boss,extra,tele)=>({hp,spd,bullet,fire,dmg,boss,extra,tele});
SF.DIFFICULTY={
 easy:{reward:1,score:1,rows:[
  _row(1.00,1.00,1.00,1.00,1.00,1.00,0,1.15),_row(1.05,1.00,1.00,1.03,1.00,1.05,0,1.15),_row(1.10,1.02,1.03,1.06,1.05,1.10,0,1.1),
  _row(1.20,1.03,1.05,1.08,1.05,1.20,0,1.1),_row(1.30,1.04,1.07,1.10,1.10,1.30,0,1.05),_row(1.40,1.05,1.08,1.12,1.10,1.40,0,1.05),
  _row(1.50,1.06,1.10,1.14,1.15,1.50,0,1),_row(1.60,1.07,1.12,1.16,1.15,1.60,0,1),_row(1.75,1.08,1.14,1.18,1.20,1.75,0,1),_row(1.90,1.10,1.16,1.20,1.20,1.90,0,1)]},
 hard:{reward:2,score:2,rows:[
  _row(2.40,1.08,1.10,1.30,1.50,2.30,1,.95),_row(2.40,1.08,1.11,1.31,1.50,2.35,1,.95),_row(2.45,1.09,1.12,1.32,1.55,2.40,1,.95),
  _row(2.50,1.10,1.13,1.33,1.55,2.50,1,.9),_row(2.60,1.11,1.14,1.34,1.60,2.60,1,.9),_row(2.70,1.12,1.15,1.36,1.60,2.70,1,.9),
  _row(2.80,1.13,1.16,1.38,1.65,2.80,1,.85),_row(2.90,1.14,1.17,1.40,1.65,2.90,1,.85),_row(3.00,1.15,1.18,1.42,1.70,3.00,1,.85),_row(3.10,1.17,1.20,1.45,1.70,3.20,1,.85)]},
 extreme:{reward:3.5,score:3,rows:[
  _row(4.20,1.15,1.18,1.60,2.10,3.80,2,.8),_row(4.10,1.15,1.18,1.61,2.10,3.80,2,.8),_row(4.00,1.16,1.19,1.62,2.15,3.80,2,.8),
  _row(4.00,1.17,1.20,1.64,2.15,3.90,2,.78),_row(4.00,1.18,1.21,1.66,2.20,4.00,2,.78),_row(4.10,1.19,1.22,1.68,2.20,4.10,2,.75),
  _row(4.20,1.20,1.23,1.70,2.25,4.20,2,.75),_row(4.30,1.21,1.24,1.72,2.25,4.30,2,.72),_row(4.40,1.22,1.25,1.75,2.30,4.40,2,.72),_row(4.60,1.25,1.27,1.80,2.30,4.60,2,.7)]},
};
