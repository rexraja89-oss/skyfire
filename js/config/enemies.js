'use strict';
// ============ ENEMIES ============
// An enemy = stats + a movement module + a fire pattern + optional abilities. All of it is data.
// Movement modules: dive, sideEntry, strafe, hover, drift, sine, hawk, kamikaze, fall, path
// Fire patterns:    aimed, fan, burst, ring, spiral, sniper, mines, none
// Abilities:        shield, cloak, teleport, split, heal, frontArmor, captain, fuse
// Speeds are logic px/s, times in seconds, angles in degrees. "y" values below 1 are fractions of the visible screen.
SF.BULLETS={
 pellet:{r:4.5,dmg:11,sprite:'eo'},
 heavy: {r:7,dmg:15,sprite:'ebig'},
 shell: {r:5,dmg:12,sprite:'esh'},
 ring:  {r:4.5,dmg:11,sprite:'ering'},
 needle:{r:5,dmg:14,sprite:'el',orient:1},
 missile:{r:6,dmg:18,sprite:'em',orient:1,homing:1.7,life:4},
};
SF.ENEMIES={
 dart:{name:'Dart',model:'fighter',hp:3,r:13,score:150,gears:1,charge:3,size:1,
  move:{type:'dive',speed:200,home:1.1,homeK:.55},
  fire:{pattern:'aimed',every:1.5,first:.5,speed:190,bullet:'pellet',maxShots:1}},
 swift:{name:'Swift',model:'fighter2',scale:.9,hp:2.5,r:12,score:180,gears:1,charge:3,size:1,
  move:{type:'sideEntry',vx:270,vy:115,curve:150},
  fire:{pattern:'aimed',every:1.1,first:.4,speed:220,bullet:'pellet',maxShots:1}},
 brute:{name:'Brute',model:'bomber',scale:.55,hp:42,r:30,score:1200,gears:8,charge:10,size:2.2,drops:{repair:.5},
  move:{type:'drift',speed:60,y:.24,hold:9,sway:40},
  fire:{pattern:'fan',every:2.2,first:1,speed:150,bullet:'heavy',count:5,spread:50}},
 wingleader:{name:'Wing-leader',model:'fighter2',scale:1.25,hp:14,r:17,score:600,gears:3,charge:6,size:1.3,abilities:{captain:{bonus:1000}},
  move:{type:'dive',speed:140,home:.6,homeK:.4},
  fire:{pattern:'burst',every:2,first:.8,speed:210,bullet:'pellet',burst:3,gap:.12}},
 hawk:{name:'Hawk',model:'fighter',scale:1.05,hp:5,r:13,score:300,gears:1,charge:4,size:1,ram:22,
  move:{type:'hawk',y:.2,lock:.65,dive:540},fire:{pattern:'none'}},
 siderunner:{name:'Side-runner',model:'fighter2',hp:6,r:14,score:300,gears:2,charge:4,size:1,
  move:{type:'strafe',y:.22,vx:170},
  fire:{pattern:'aimed',every:.85,first:.5,speed:200,bullet:'pellet',maxShots:4}},
 gunboat:{name:'Gunboat',model:'heli',hp:16,r:18,score:450,gears:3,charge:5,size:1.5,
  move:{type:'hover',y:.24,hold:7,sway:50},
  fire:{pattern:'fan',every:1.8,first:1,speed:170,bullet:'pellet',count:3,spread:14}},
 bulwark:{name:'Bulwark',model:'bulwark',hp:30,r:21,score:800,gears:5,charge:7,size:1.7,abilities:{frontArmor:{reduce:.85,sideFrac:.5}},
  move:{type:'sine',speed:45,amp:40,freq:.7},
  fire:{pattern:'ring',every:3,first:1.5,speed:120,bullet:'ring',count:10}},
 tender:{name:'Tender',model:'mender',hp:18,r:18,score:700,gears:5,charge:6,size:1.5,drops:{repair:.4},abilities:{heal:{every:1.6,range:180,amount:.35}},
  move:{type:'hover',y:.16,hold:13,sway:40},
  fire:{pattern:'aimed',every:2.6,first:1.2,speed:150,bullet:'heavy'}},
 aegis:{name:'Aegis',model:'aegis',hp:9,r:15,score:450,gears:3,charge:5,size:1,abilities:{shield:{mult:1.2,delay:2.4,regen:.45}},
  move:{type:'sine',speed:95,amp:55,freq:1.3},
  fire:{pattern:'aimed',every:1.5,first:.6,speed:170,bullet:'pellet'}},
 wraith:{name:'Wraith',model:'wraith',hp:10,r:15,score:600,gears:3,charge:5,size:1,abilities:{cloak:{cycle:3.8,hidden:2.2,leave:11}},
  move:{type:'none'},
  fire:{pattern:'fan',on:'reveal',speed:180,bullet:'pellet',count:5,spread:32}},
 blink:{name:'Blink',model:'blink',hp:14,r:16,score:650,gears:4,charge:6,size:1.2,abilities:{teleport:{stay:1.9,gone:.35,jumps:4}},
  move:{type:'none'},
  fire:{pattern:'ring',on:'arrive',delay:.85,speed:140,bullet:'heavy',count:12}},
 hydra:{name:'Hydra',model:'hydra',hp:22,r:19,score:600,gears:4,charge:6,size:1.5,abilities:{split:{into:'drone',count:3,speed:150}},
  move:{type:'sine',speed:48,amp:60,freq:.8},
  fire:{pattern:'fan',every:1.7,first:1,speed:160,bullet:'pellet',count:3,spread:25}},
 drone:{name:'Drone',model:'drone',hp:3,r:11,score:120,gears:1,charge:2,size:.8,ram:14,dieOnRam:1,
  move:{type:'kamikaze',speed:125,accel:1.4,giveUp:7},fire:{pattern:'none'}},
 lancer:{name:'Lancer',model:'lancer',hp:12,r:15,score:500,gears:3,charge:5,size:1,
  move:{type:'hover',y:.18,hold:99,sway:0},
  fire:{pattern:'sniper',first:1.6,aim:1.1,speed:620,bullet:'needle',count:6,volleys:2}},
 sower:{name:'Sower',model:'sower',hp:20,r:21,score:550,gears:4,charge:6,size:1.5,
  move:{type:'strafe',y:.16,vx:60},
  fire:{pattern:'mines',every:1.15,first:.6,spawn:'mine'}},
 mine:{name:'Mine',model:'mine',hp:2.5,r:10,score:50,gears:0,charge:1,size:.8,noCount:1,abilities:{fuse:{time:4.2,ring:10,speed:130}},
  move:{type:'fall',speed:35,drag:.995},fire:{pattern:'none'}},
};
// Test Range script (Checkpoints 2-3 only; the stage director replaces it in Checkpoint 4).
// f = formation (with enemy type), g = ground setup (x = anchor as a fraction of the width), w = loose wave.
SF.RANGE_SCRIPT=[
 {f:'vDrop',enemy:'dart'},{f:'pincer',enemy:'swift'},{g:'outpost',x:.3},{f:'snake',enemy:'dart'},
 {f:'lineHover',enemy:'gunboat'},{g:'convoy',road:1},{f:'wedgeLeader'},{f:'crossing',enemy:'swift'},
 {g:'depotYard',x:.65},{f:'swoop',enemy:'siderunner'},{f:'stagger',enemy:'dart'},{g:'missileSite',x:.4},
 {w:'hawk',n:3},{f:'ringSpin',enemy:'aegis'},{g:'relay',x:.6},{f:'converge',enemy:'swift'},{f:'boxEscort'},
 {g:'bunkerLine',x:.5},{w:'bulwark',n:2},{f:'loop',enemy:'dart'},{g:'factory',x:.5},{f:'column',enemy:'swift'},
 {w:'lancer',n:2},{f:'mixedRaid'},{w:'hydra',n:2},{f:'strafeRun',enemy:'siderunner'},{w:'tender',n:1,escort:'gunboat'},
 {w:'wraith',n:2},{f:'vDropWide',enemy:'dart'},{w:'sower',n:1},{w:'blink',n:2},{w:'brute',n:1,escort:'swift'},
];
