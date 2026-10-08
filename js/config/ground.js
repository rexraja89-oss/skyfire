'use strict';
// ============ GROUND TARGETS ============
// Ground targets use the same enemy pipeline (damage, scoring, drops) with ground:true:
// they scroll with the landscape, sit on the terrain, never ram the player and leave scorch marks.
// Extra movement:  ground (fixed, scrolls with the world), convoy (drives down the road), attached (part of a parent)
// Extra abilities: buffAura (radar), chain (fuel depot), reinforce (comms mast), bunker (armoured until it opens),
//                  dome (shields nearby ground units), guarded (takes less damage while its parts stand), spawner (part that launches units)
// Extra fire:      mortar (marks the player's spot, explodes after a delay)
const GROUND={
 gunTower:{name:'Gun tower',model:'tower',hp:24,r:16,score:500,gears:3,charge:5,size:1.5,dropTable:'ground',
  move:{type:'ground'},fire:{pattern:'burst',every:2.2,first:1,speed:190,bullet:'shell',burst:3,gap:.14}},
 flak:{name:'Flak gun',model:'aa',hp:12,r:15,score:350,gears:2,charge:4,size:1.3,dropTable:'ground',
  move:{type:'ground'},fire:{pattern:'fan',every:1.7,first:.8,speed:200,bullet:'pellet',count:2,spread:5}},
 tank:{name:'Tank',model:'tank',hp:14,r:15,score:400,gears:3,charge:4,size:1.4,dropTable:'ground',
  move:{type:'convoy',vy:16},fire:{pattern:'aimed',every:2.3,first:1.2,speed:170,bullet:'shell'}},
 armoredCar:{name:'Armoured car',model:'truck',hp:7,r:12,score:250,gears:2,charge:3,size:1.1,dropTable:'ground',
  move:{type:'convoy',vy:36},fire:{pattern:'aimed',every:1.8,first:.9,speed:180,bullet:'pellet'}},
 radar:{name:'Radar',model:'radar',hp:20,r:18,score:700,gears:4,charge:6,size:1.5,dropTable:'ground',abilities:{buffAura:{range:170,fire:.6,label:'RADAR DOWN'}},
  move:{type:'ground'},fire:{pattern:'none'}},
 missileBattery:{name:'Missile battery',model:'sam',hp:18,r:16,score:550,gears:4,charge:5,size:1.5,dropTable:'ground',
  move:{type:'ground'},fire:{pattern:'aimed',every:3.4,first:1.5,speed:130,bullet:'missile'}},
 mortar:{name:'Mortar',model:'artillery',hp:20,r:17,score:600,gears:4,charge:5,size:1.5,dropTable:'ground',
  move:{type:'ground'},fire:{pattern:'mortar',every:3.8,first:1.8,delay:1.35,radius:36,damage:20}},
 boat:{name:'Gunboat',model:'boat',hp:16,r:16,score:450,gears:4,charge:5,size:1.5,dropTable:'ground',
  move:{type:'patrol',vx:34,scroll:.8},fire:{pattern:'aimed',every:2.4,first:1.2,speed:160,bullet:'shell'}},
 depot:{name:'Fuel depot',model:'depot',hp:10,r:18,score:400,gears:3,charge:4,size:2,dropTable:'ground',abilities:{chain:{radius:95,damage:45}},
  move:{type:'ground'},fire:{pattern:'none'}},
 commsMast:{name:'Comms mast',model:'mast',hp:16,r:14,score:650,gears:4,charge:5,size:1.4,dropTable:'ground',abilities:{reinforce:{after:6,formation:'vDrop',enemy:'dart',label:'REINFORCEMENTS CALLED'}},
  move:{type:'ground'},fire:{pattern:'none'}},
 bunker:{name:'Bunker',model:'bunker',hp:30,r:19,score:800,gears:5,charge:6,size:1.8,dropTable:'ground',abilities:{bunker:{closed:2.4,open:1.4,armor:.85}},
  move:{type:'ground'},fire:{pattern:'ring',on:'open',speed:140,bullet:'shell',count:8}},
 shieldDome:{name:'Shield generator',model:'dome',hp:32,r:20,score:800,gears:6,charge:6,size:1.8,dropTable:'ground',abilities:{dome:{range:130,reduce:.75,label:'GROUND SHIELDS DOWN'}},
  move:{type:'ground'},fire:{pattern:'none'}},
 factory:{name:'Factory',model:'factory',hp:60,r:30,score:2000,gears:10,charge:10,size:2.6,dropTable:'heavy',abilities:{guarded:{reduce:.6}},
  move:{type:'ground'},fire:{pattern:'none'},
  parts:[{type:'factoryStack',dx:-18,dy:-8},{type:'factoryStack',dx:18,dy:-8},{type:'factoryGate',dx:0,dy:18}]},
 factoryStack:{name:'Exhaust stack',model:'stack',hp:16,r:9,score:400,gears:2,charge:3,size:1.2,abilities:{spawner:{every:4.5,enemy:'drone',first:2}},
  move:{type:'attached'},fire:{pattern:'none'}},
 factoryGate:{name:'Factory gate',model:'gate',hp:20,r:12,score:500,gears:2,charge:3,size:1.3,abilities:{spawner:{every:6,enemy:'armoredCar',first:3,ground:1}},
  move:{type:'attached'},fire:{pattern:'none'}},
};
for(const k in GROUND){GROUND[k].ground=true;SF.ENEMIES[k]=GROUND[k];}
// Ground setups: pieces placed around an anchor x (fraction of width) as one group.
// Destroying a whole setup pays a bonus. y offsets are in logic px above the anchor (it scrolls in from the top).
SF.GROUND_SETUPS={
 outpost:{name:'Outpost',pieces:[{t:'gunTower',dx:0,dy:0},{t:'flak',dx:-46,dy:30},{t:'flak',dx:46,dy:30},{t:'radar',dx:0,dy:-60}]},
 convoy:{name:'Convoy',road:true,pieces:[{t:'armoredCar',dx:0,dy:0},{t:'tank',dx:0,dy:-48},{t:'tank',dx:0,dy:-96},{t:'armoredCar',dx:0,dy:-144}]},
 depotYard:{name:'Fuel depot',pieces:[{t:'depot',dx:-30,dy:0},{t:'depot',dx:30,dy:0},{t:'depot',dx:0,dy:-36},{t:'flak',dx:-70,dy:-20}]},
 missileSite:{name:'Missile site',pieces:[{t:'missileBattery',dx:-40,dy:0},{t:'missileBattery',dx:40,dy:0},{t:'shieldDome',dx:0,dy:-40}]},
 bunkerLine:{name:'Bunker line',pieces:[{t:'bunker',dx:-60,dy:0},{t:'bunker',dx:60,dy:0},{t:'mortar',dx:0,dy:-50}]},
 relay:{name:'Comms relay',pieces:[{t:'commsMast',dx:0,dy:0},{t:'gunTower',dx:-50,dy:20},{t:'gunTower',dx:50,dy:20}]},
 factory:{name:'Factory',pieces:[{t:'factory',dx:0,dy:0},{t:'flak',dx:-70,dy:40},{t:'flak',dx:70,dy:40}]},
 coastGuns:{name:'Coastal guns',pieces:[{t:'gunTower',dx:0,dy:0},{t:'flak',dx:0,dy:-46},{t:'flak',dx:0,dy:46}]},
 towerPair:{name:'Gun towers',pieces:[{t:'gunTower',dx:-40,dy:0},{t:'gunTower',dx:40,dy:0}]},
 flakNest:{name:'Flak nest',pieces:[{t:'flak',dx:-36,dy:0},{t:'flak',dx:36,dy:0},{t:'flak',dx:0,dy:-34}]},
 armorColumn:{name:'Armour column',road:true,pieces:[{t:'tank',dx:0,dy:0},{t:'tank',dx:0,dy:-46},{t:'tank',dx:0,dy:-92},{t:'tank',dx:0,dy:-138},{t:'armoredCar',dx:0,dy:-184}]},
 domeBunkers:{name:'Shielded bunkers',pieces:[{t:'shieldDome',dx:0,dy:0},{t:'bunker',dx:-56,dy:24},{t:'bunker',dx:56,dy:24},{t:'mortar',dx:0,dy:-50}]},
 radarPost:{name:'Radar post',pieces:[{t:'radar',dx:0,dy:0},{t:'flak',dx:-40,dy:20},{t:'gunTower',dx:40,dy:20}]},
};
