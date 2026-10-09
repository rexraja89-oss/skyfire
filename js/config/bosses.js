'use strict';
// ============ BOSSES + MINI-BOSSES ============
// Each boss: model (body + colour), hull size (rx, ry: bullets hitting the armoured hull are absorbed),
// movement, PARTS and PHASES. All original Skyfire designs.
//
// Part fields: id, name, mesh (see bossmodels.js), dx/dy (offset in logic px; dy down), r (hit radius), hp,
//   score, gears, attacks:[...] (stop when the part is destroyed), kill:true (destroying it kills the boss),
//   vulnerableWhen (condition; invulnerable until true), guard (damage reduction while other parts stand),
//   shield:true (a shield generator: while any stands, the core shows a shield and is invulnerable if it says so),
//   wave:{amp,freq,lag} (part sways sideways; segment bodies).
// Attack fields: p pattern, every (s), speed, count, spread (deg), bullet, plus pattern extras.
//   Patterns: aimed, fan, ring, spiral, rain, missiles, burst, laser, sweep, wall, lane, spawn, mines, mortar, cross, flame
// Phase fields: when (condition), attacks (added to the boss), rage (speed/aggression), say, banner.
// Conditions: always | !part | parts<=N | hp<0.5 | a&b (all) | a|b (any)
// HP are base values; the stage × mode table (difficulty.js 'boss') scales them.
const _A=(p,every,o)=>Object.assign({p,every},o||{});
SF.BOSSES={
 tidebreaker:{name:'Tidebreaker',title:'Coastal dreadnought',model:{body:'ship',color:'#59606b'},rx:160,ry:42,ground:true,move:{type:'sway',amp:40,freq:.4,y:.2},score:30000,gears:40,
  parts:[
   {id:'gunL',name:'Bow gun',mesh:'turret',dx:-115,dy:0,r:20,hp:110,score:2500,gears:5,attacks:[_A('burst',2,{count:3,gap:.12,speed:180})]},
   {id:'gunR',name:'Stern gun',mesh:'turret',dx:115,dy:0,r:20,hp:110,score:2500,gears:5,attacks:[_A('burst',2.2,{count:3,gap:.12,speed:180})]},
   {id:'launcher',name:'Missile rack',mesh:'launcher',dx:-55,dy:-8,r:22,hp:130,score:3000,gears:6,attacks:[_A('missiles',3.4,{count:4,speed:115})]},
   {id:'shieldGen',name:'Shield generator',mesh:'shieldGen',dx:55,dy:-8,r:22,hp:120,score:3000,gears:6,shield:true},
   {id:'core',name:'Reactor',dx:5,dy:6,r:26,hp:260,kill:true,vulnerableWhen:'!shieldGen'}],
  phases:[{when:'always',attacks:[_A('rain',.22,{speed:140})]},
   {when:'parts<=2',banner:'DECK GUNS DOWN',attacks:[_A('sweep',1.1,{count:10,speed:160,from:'core'})],say:'Its guns are down. Now it is sweeping the deck!'},
   {when:'!shieldGen',attacks:[_A('laser',5.5,{charge:1.1,fire:.7,dmg:16,from:'core'})],say:'Shield generator destroyed! The reactor is exposed!'},
   {when:'hp<.3',rage:1.4,attacks:[_A('ring',1,{count:18,speed:130,bullet:'heavy',from:'core'})],say:'It is going down fighting. Weave!'}]},
 harvestReaper:{name:'Harvest Reaper',title:'Armoured combine',model:{body:'land',color:'#6a6238'},rx:130,ry:84,ground:true,move:{type:'sway',amp:55,freq:.35,y:.22},score:32000,gears:45,
  parts:[
   {id:'scytheL',name:'Left scythe',mesh:'scythe',dx:-115,dy:30,r:22,hp:175,score:3000,gears:6,attacks:[_A('lane',4.6,{width:60,warn:1.1})]},
   {id:'scytheR',name:'Right scythe',mesh:'scythe',dx:115,dy:30,r:22,hp:175,score:3000,gears:6,ry:Math.PI,attacks:[_A('lane',4.6,{width:60,warn:1.1,offset:2.3})]},
   {id:'silo',name:'Mortar silo',mesh:'launcher',dx:0,dy:-55,r:22,hp:120,score:3000,gears:6,attacks:[_A('mortar',3.6,{delay:1.3,radius:40,damage:20})]},
   {id:'nose',name:'Nose cannon',mesh:'twin',dx:0,dy:62,r:20,hp:110,score:2500,gears:5,attacks:[_A('fan',1.6,{count:5,spread:40,speed:170})]},
   {id:'core',name:'Engine core',dx:0,dy:0,r:26,hp:380,kill:true,vulnerableWhen:'parts<=2'}],
  phases:[{when:'always',attacks:[]},
   {when:'parts<=2',banner:'HARVESTER EXPOSED',attacks:[_A('ring',1.3,{count:16,speed:125,from:'core'})],say:'Its engine core is open. Hit it!'},
   {when:'hp<.4',rage:1.35,attacks:[_A('spiral',.11,{arms:3,speed:130,from:'core'})],say:'It is overheating. Expect spirals!'}]},
 duneCrawler:{name:'Dune Crawler',title:'Segmented sand serpent',model:{body:'segment',color:'#8a6a3c'},rx:50,ry:40,ground:true,move:{type:'sway',amp:90,freq:.55,y:.2},score:34000,gears:45,
  parts:[
   {id:'seg1',name:'Segment',mesh:'segment',dx:0,dy:-42,r:20,hp:95,score:2000,gears:4,wave:{amp:26,freq:2.2,lag:.6},attacks:[_A('aimed',2.2,{speed:170})]},
   {id:'seg2',name:'Segment',mesh:'segment',dx:0,dy:-82,r:20,hp:95,score:2000,gears:4,wave:{amp:36,freq:2.2,lag:1.2},attacks:[_A('aimed',2.4,{speed:170,count:2,spread:10})]},
   {id:'seg3',name:'Segment',mesh:'segment',dx:0,dy:-122,r:20,hp:95,score:2000,gears:4,wave:{amp:44,freq:2.2,lag:1.8},attacks:[_A('aimed',2.6,{speed:170})]},
   {id:'tail',name:'Tail launcher',mesh:'launcher',dx:0,dy:-160,r:20,hp:110,score:3000,gears:6,wave:{amp:50,freq:2.2,lag:2.4},attacks:[_A('missiles',3.6,{count:3,speed:115})]},
   {id:'head',name:'Head',mesh:'none',dx:0,dy:0,r:30,hp:300,kill:true,vulnerableWhen:'parts<=0'}],
  phases:[{when:'always',attacks:[_A('fan',2,{count:5,spread:45,speed:160,from:'head'})]},
   {when:'parts<=2',rage:1.2,attacks:[_A('rain',.25,{speed:150})],say:'It is breaking apart. Keep cutting!'},
   {when:'parts<=0',rage:1.4,banner:'HEAD EXPOSED',attacks:[_A('ring',1.1,{count:16,speed:135,from:'head'})],say:'Only the head is left. Finish it!'}]},
 ridgeGunship:{name:'Ridge Gunship',title:'Twin-rotor heavy gunship',model:{body:'gunship',color:'#3f4b3c'},rx:72,ry:100,move:{type:'sway',amp:70,freq:.45,y:.25},score:36000,gears:50,
  parts:[
   {id:'rotorF',name:'Front rotor',mesh:'rotor',dx:0,dy:-72,r:22,hp:165,score:3000,gears:6,y:2.2},
   {id:'rotorB',name:'Rear rotor',mesh:'rotor',dx:0,dy:62,r:22,hp:165,score:3000,gears:6,y:2.2},
   {id:'podL',name:'Left rocket pod',mesh:'launcher',dx:-82,dy:8,r:20,hp:110,score:2500,gears:5,attacks:[_A('missiles',3.2,{count:3,speed:120})]},
   {id:'podR',name:'Right rocket pod',mesh:'launcher',dx:82,dy:8,r:20,hp:110,score:2500,gears:5,attacks:[_A('missiles',3.5,{count:3,speed:120})]},
   {id:'chin',name:'Chin cannon',mesh:'twin',dx:0,dy:96,r:20,hp:120,score:3000,gears:6,y:-1,attacks:[_A('laser',5,{charge:1.1,fire:.7,dmg:16}),_A('fan',1.5,{count:5,spread:36,speed:175})]},
   {id:'core',name:'Engine core',dx:0,dy:-10,r:24,hp:380,kill:true,vulnerableWhen:'!rotorF&!rotorB|parts<=1'}],
  phases:[{when:'always',attacks:[]},
   {when:'parts<=3',attacks:[_A('spiral',.12,{arms:3,speed:130,from:'core'})],say:'It is wobbling. Keep on those rotors!'},
   {when:'!rotorF&!rotorB',rage:1.4,banner:'GOING DOWN',sink:.06,attacks:[_A('ring',1.2,{count:18,speed:130,from:'core'})],say:'Both rotors gone! It is going down. Hit the core!'}]},
 ironLeviathan:{name:'Iron Leviathan',title:'Assault submarine',model:{body:'sub',color:'#3d4450'},rx:150,ry:30,ground:true,move:{type:'sway',amp:45,freq:.35,y:.22},submerge:{every:11,time:3.2},score:38000,gears:55,
  parts:[
   {id:'tower',name:'Conning tower gun',mesh:'twin',dx:0,dy:-18,r:22,hp:140,score:3000,gears:6,y:3.8,attacks:[_A('burst',1.8,{count:4,gap:.1,speed:190})]},
   {id:'tubeL',name:'Port missile tube',mesh:'launcher',dx:-80,dy:6,r:20,hp:120,score:2500,gears:5,y:1.9,attacks:[_A('missiles',3.4,{count:3,speed:120})]},
   {id:'tubeR',name:'Starboard missile tube',mesh:'launcher',dx:80,dy:6,r:20,hp:120,score:2500,gears:5,y:1.9,attacks:[_A('missiles',3.6,{count:3,speed:120})]},
   {id:'core',name:'Reactor',dx:0,dy:22,r:24,hp:320,kill:true,vulnerableWhen:'parts<=1',y:1.9}],
  phases:[{when:'always',attacks:[_A('wall',4.2,{gap:80,speed:130,from:'core'})]},
   {when:'parts<=1',rage:1.3,attacks:[_A('sweep',1,{count:12,speed:160,from:'core'})],say:'Its reactor is open when it surfaces!'},
   {when:'hp<.35',rage:1.5,attacks:[_A('ring',1.1,{count:20,speed:125,bullet:'heavy',from:'core'})]}]},
 reefCarrier:{name:'Reef Carrier',title:'Island carrier',model:{body:'carrier',color:'#5d6874'},rx:170,ry:48,ground:true,move:{type:'sway',amp:30,freq:.3,y:.2},score:40000,gears:60,
  parts:[
   {id:'deckL',name:'Port launch deck',mesh:'hangar',dx:-85,dy:0,r:24,hp:150,score:3500,gears:7,attacks:[_A('spawn',7,{formation:'swoop',enemy:'swift'})]},
   {id:'deckR',name:'Starboard launch deck',mesh:'hangar',dx:85,dy:0,r:24,hp:150,score:3500,gears:7,attacks:[_A('spawn',8,{formation:'vDrop',enemy:'dart',offset:3})]},
   {id:'ciwsL',name:'Bow defence gun',mesh:'turret',dx:-145,dy:-22,r:18,hp:100,score:2000,gears:4,attacks:[_A('aimed',1.1,{count:2,spread:8,speed:200})]},
   {id:'ciwsR',name:'Stern defence gun',mesh:'turret',dx:145,dy:22,r:18,hp:100,score:2000,gears:4,attacks:[_A('aimed',1.2,{count:2,spread:8,speed:200})]},
   {id:'bridge',name:'Radar bridge',mesh:'dish',dx:30,dy:-38,r:20,hp:110,score:3000,gears:6},
   {id:'core',name:'Engine room',dx:0,dy:18,r:26,hp:330,kill:true,vulnerableWhen:'parts<=2'}],
  phases:[{when:'always',attacks:[_A('rain',.3,{speed:140})]},
   {when:'!bridge',rage:.85,say:'Radar bridge down. Their fire control is slower!'},
   {when:'parts<=3',banner:'FLIGHT DECKS FAILING',attacks:[_A('fan',1.4,{count:7,spread:50,speed:165,from:'core'})]},
   {when:'hp<.35',rage:1.4,attacks:[_A('ring',1,{count:20,speed:130,from:'core'})],say:'The carrier is burning. Finish it!'}]},
 canyonColossus:{name:'Canyon Colossus',title:'Four-legged siege walker',model:{body:'walker',color:'#6b3a28'},rx:110,ry:80,ground:true,move:{type:'sway',amp:40,freq:.3,y:.22},score:42000,gears:65,
  parts:[
   {id:'legL1',name:'Front left leg',mesh:'leg',dx:-95,dy:-55,r:18,hp:110,score:2000,gears:4,y:0},
   {id:'legL2',name:'Rear left leg',mesh:'leg',dx:-95,dy:55,r:18,hp:110,score:2000,gears:4,y:0},
   {id:'legR1',name:'Front right leg',mesh:'leg',dx:95,dy:-55,r:18,hp:110,score:2000,gears:4,y:0},
   {id:'legR2',name:'Rear right leg',mesh:'leg',dx:95,dy:55,r:18,hp:110,score:2000,gears:4,y:0},
   {id:'cannon',name:'Siege cannon',mesh:'twin',dx:0,dy:-58,r:22,hp:140,score:3500,gears:7,attacks:[_A('fan',1.8,{count:7,spread:50,speed:165,bullet:'shell'})]},
   {id:'mortarBay',name:'Mortar bay',mesh:'launcher',dx:0,dy:48,r:22,hp:130,score:3000,gears:6,attacks:[_A('mortar',3.2,{delay:1.3,radius:40,damage:20})]},
   {id:'core',name:'Heart reactor',dx:0,dy:0,r:26,hp:340,kill:true,vulnerableWhen:'!legL1&!legL2|!legR1&!legR2|parts<=1'}],
  phases:[{when:'always',attacks:[]},
   {when:'!legL1&!legL2|!legR1&!legR2',rage:1.25,banner:'IT IS BUCKLING',tilt:.18,attacks:[_A('ring',1.4,{count:16,speed:130,from:'core'})],say:'It is down on one side! The heart reactor is open!'},
   {when:'hp<.35',rage:1.5,attacks:[_A('cross',.08,{speed:140,from:'core'})],say:'Desperation fire. Stay calm and weave.'}]},
 polarTalon:{name:'Polar Talon',title:'Arctic strike wing',model:{body:'wing',color:'#6c7a8a'},rx:160,ry:52,move:{type:'strafe',amp:70,freq:.5,y:.2},score:44000,gears:70,
  parts:[
   {id:'pylonL',name:'Left shield pylon',mesh:'shieldGen',dx:-125,dy:-6,r:20,hp:130,score:3000,gears:6,shield:true},
   {id:'pylonR',name:'Right shield pylon',mesh:'shieldGen',dx:125,dy:-6,r:20,hp:130,score:3000,gears:6,shield:true},
   {id:'engineL',name:'Left engine',mesh:'engine',dx:-50,dy:-44,r:20,hp:120,score:2500,gears:5,attacks:[_A('rain',.35,{speed:150})]},
   {id:'engineR',name:'Right engine',mesh:'engine',dx:50,dy:-44,r:20,hp:120,score:2500,gears:5,attacks:[_A('rain',.35,{speed:150})]},
   {id:'cannon',name:'Nose cannon',mesh:'twin',dx:0,dy:42,r:20,hp:130,score:3000,gears:6,attacks:[_A('fan',1.5,{count:7,spread:46,speed:175}),_A('laser',6,{charge:1.1,fire:.7,dmg:16})]},
   {id:'core',name:'Core',dx:0,dy:-8,r:24,hp:350,kill:true,vulnerableWhen:'!pylonL&!pylonR'}],
  phases:[{when:'always',attacks:[]},
   {when:'!engineL|!engineR',rage:.9,say:'Engine hit! It is slowing down.'},
   {when:'parts<=3',attacks:[_A('spiral',.1,{arms:4,speed:130,from:'core'})]},
   {when:'!pylonL&!pylonR',banner:'SHIELD DOWN',attacks:[_A('ring',1.3,{count:18,speed:130,from:'core'})],say:'Both pylons down. Its shield is gone!'},
   {when:'hp<.35',rage:1.5,attacks:[_A('cross',.08,{speed:145,from:'core'})]}]},
 skylineSentinel:{name:'Skyline Sentinel',title:'Phase-shift gunship',model:{body:'gunship',color:'#2b303c'},rx:72,ry:100,move:{type:'blink',every:6.5,gone:.5,y:.24},score:46000,gears:75,
  parts:[
   {id:'emitterL',name:'Left emitter',mesh:'dish',dx:-78,dy:6,r:20,hp:140,score:3000,gears:6,attacks:[_A('ring',2.2,{count:14,speed:130})]},
   {id:'emitterR',name:'Right emitter',mesh:'dish',dx:78,dy:6,r:20,hp:140,score:3000,gears:6,attacks:[_A('spiral',.13,{arms:2,speed:125})]},
   {id:'eye',name:'Lens cannon',mesh:'twin',dx:0,dy:92,r:20,hp:140,score:3000,gears:6,y:-1,attacks:[_A('laser',4.6,{charge:1,fire:.7,dmg:16}),_A('aimed',.9,{count:3,spread:10,speed:190})]},
   {id:'hangar',name:'Drone bay',mesh:'hangar',dx:0,dy:-62,r:22,hp:130,score:3000,gears:6,attacks:[_A('spawn',8,{enemy:'drone',count:4})]},
   {id:'core',name:'Phase core',dx:0,dy:-10,r:24,hp:360,kill:true,vulnerableWhen:'parts<=1'}],
  phases:[{when:'always',attacks:[]},
   {when:'parts<=2',rage:1.2,banner:'PHASE CORE UNSTABLE',attacks:[_A('fan',1.3,{count:9,spread:60,speed:165,from:'core'})]},
   {when:'hp<.4',rage:1.5,attacks:[_A('cross',.08,{speed:145,from:'core'})],say:'It is phasing faster. Keep your eyes on it!'}]},
 infernoThrone:{name:'Inferno Throne',title:'Command fortress',model:{body:'throne',color:'#3a2420'},rx:180,ry:66,move:{type:'strafe',amp:50,freq:.35,y:.22},score:60000,gears:100,
  parts:[
   {id:'flameL',name:'Left flame cannon',mesh:'twin',dx:-140,dy:0,r:22,hp:150,score:3500,gears:7,attacks:[_A('flame',1.2,{count:9,spread:36,speed:175})]},
   {id:'flameR',name:'Right flame cannon',mesh:'twin',dx:140,dy:0,r:22,hp:150,score:3500,gears:7,attacks:[_A('flame',1.3,{count:9,spread:36,speed:175})]},
   {id:'launchL',name:'Left missile bank',mesh:'launcher',dx:-75,dy:-44,r:20,hp:130,score:3000,gears:6,attacks:[_A('missiles',3.4,{count:4,speed:120})]},
   {id:'launchR',name:'Right missile bank',mesh:'launcher',dx:75,dy:-44,r:20,hp:130,score:3000,gears:6,attacks:[_A('missiles',3.7,{count:4,speed:120})]},
   {id:'haloGen',name:'Halo generator',mesh:'shieldGen',dx:0,dy:-62,r:22,hp:160,score:4000,gears:8,shield:true},
   {id:'bay',name:'Escort bay',mesh:'hangar',dx:0,dy:40,r:22,hp:140,score:3000,gears:6,attacks:[_A('spawn',9,{formation:'pincer',enemy:'swift'})]},
   {id:'core',name:'Throne core',dx:0,dy:0,r:28,hp:420,kill:true,vulnerableWhen:'!haloGen&parts<=3'}],
  phases:[{when:'always',attacks:[_A('fan',1.8,{count:7,spread:54,speed:165,from:'core'})]},
   {when:'parts<=4',banner:'THE THRONE IS CRACKING',attacks:[_A('rain',.2,{speed:150})],say:'Its outer weapons are failing. Keep pressing!'},
   {when:'!haloGen',attacks:[_A('spiral',.1,{arms:3,speed:130,from:'core'}),_A('laser',6,{charge:1.1,fire:.8,dmg:18,from:'core'})],say:'Halo generator destroyed!'},
   {when:'hp<.5',rage:1.3,attacks:[_A('ring',1.2,{count:20,speed:130,bullet:'heavy',from:'core'})]},
   {when:'hp<.2',rage:1.6,banner:'LAST STAND',attacks:[_A('cross',.07,{speed:150,from:'core'})],say:'This is its last stand. Everything you have, Rex!'}]},
};
// mini-bosses: smaller part-based enemies mid-stage (body = a scaled enemy model)
SF.MINIBOSSES={
 harborWarden:{name:'Harbor Warden',title:'Patrol gunship',model:{body:'enemy:heli',scale:2.2,top:1.6},rx:40,ry:50,move:{type:'sway',amp:80,freq:.6,y:.2},score:8000,gears:12,
  parts:[{id:'gunL',name:'Left gun',mesh:'turret',dx:-34,dy:4,r:14,hp:45,score:1000,gears:2,attacks:[_A('aimed',1.4,{count:2,spread:8,speed:180})]},{id:'gunR',name:'Right gun',mesh:'turret',dx:34,dy:4,r:14,hp:45,score:1000,gears:2,attacks:[_A('aimed',1.5,{count:2,spread:8,speed:180})]},
   {id:'core',name:'Hull',mesh:'none',dx:0,dy:-4,r:22,hp:110,kill:true,guard:.6}],
  phases:[{when:'always',attacks:[_A('fan',2.2,{count:5,spread:40,speed:160,from:'core'})]},{when:'parts<=0',rage:1.4,attacks:[_A('ring',1.4,{count:12,speed:130,from:'core'})]}]},
 harvestHound:{name:'Harvest Hound',title:'Heavy tank',model:{body:'enemy:tank',scale:2.4,top:2.4},rx:40,ry:48,ground:true,move:{type:'sway',amp:60,freq:.5,y:.24},score:8000,gears:12,
  parts:[{id:'gun',name:'Main gun',mesh:'twin',dx:0,dy:10,r:16,hp:60,score:1200,gears:2,attacks:[_A('burst',1.8,{count:3,gap:.12,speed:180,bullet:'shell'})]},{id:'mortar',name:'Mortar',mesh:'launcher',dx:0,dy:-30,r:14,hp:50,score:1200,gears:2,attacks:[_A('mortar',3.4,{delay:1.3,radius:36,damage:18})]},
   {id:'core',name:'Hull',mesh:'none',dx:0,dy:0,r:24,hp:120,kill:true,guard:.6}],
  phases:[{when:'always',attacks:[]},{when:'parts<=0',rage:1.4,attacks:[_A('ring',1.4,{count:12,speed:130,from:'core'})]}]},
 duneSkimmer:{name:'Dune Skimmer',title:'Desert interceptor',model:{body:'enemy:fighter2',scale:2.4,top:.4},rx:40,ry:44,move:{type:'strafe',amp:110,freq:.7,y:.18},score:9000,gears:13,
  parts:[{id:'engL',name:'Left engine',mesh:'engine',dx:-30,dy:20,r:13,hp:50,score:1000,gears:2,attacks:[_A('missiles',3.2,{count:2,speed:120})]},{id:'engR',name:'Right engine',mesh:'engine',dx:30,dy:20,r:13,hp:50,score:1000,gears:2,attacks:[_A('missiles',3.4,{count:2,speed:120})]},
   {id:'core',name:'Cockpit',mesh:'none',dx:0,dy:-6,r:20,hp:130,kill:true,guard:.6}],
  phases:[{when:'always',attacks:[_A('spiral',.16,{arms:2,speed:125,from:'core'})]},{when:'parts<=0',rage:1.5}]},
 ridgeStalker:{name:'Ridge Stalker',title:'Rocket gunship',model:{body:'enemy:hornet',scale:2.2,top:1.6},rx:40,ry:50,move:{type:'sway',amp:90,freq:.55,y:.2},score:9000,gears:13,
  parts:[{id:'podL',name:'Left pod',mesh:'launcher',dx:-34,dy:4,r:14,hp:55,score:1200,gears:2,attacks:[_A('missiles',3,{count:2,speed:120})]},{id:'podR',name:'Right pod',mesh:'launcher',dx:34,dy:4,r:14,hp:55,score:1200,gears:2,attacks:[_A('missiles',3.3,{count:2,speed:120})]},
   {id:'core',name:'Hull',mesh:'none',dx:0,dy:-4,r:22,hp:140,kill:true,guard:.6}],
  phases:[{when:'always',attacks:[_A('fan',2,{count:5,spread:40,speed:165,from:'core'})]},{when:'parts<=0',rage:1.4,attacks:[_A('ring',1.3,{count:14,speed:130,from:'core'})]}]},
 craneJack:{name:'Crane Jack',title:'Armoured dock gunship',model:{body:'enemy:bulwark',scale:2.2,top:.8},rx:44,ry:46,move:{type:'sway',amp:70,freq:.45,y:.2},score:10000,gears:14,
  parts:[{id:'plate',name:'Nose plate',mesh:'armor',dx:0,dy:36,r:18,hp:80,score:1500,gears:3},{id:'gunL',name:'Left cannon',mesh:'turret',dx:-36,dy:0,r:14,hp:55,score:1200,gears:2,attacks:[_A('burst',2,{count:3,gap:.1,speed:185})]},
   {id:'gunR',name:'Right cannon',mesh:'turret',dx:36,dy:0,r:14,hp:55,score:1200,gears:2,attacks:[_A('burst',2.1,{count:3,gap:.1,speed:185})]},{id:'core',name:'Core',mesh:'none',dx:0,dy:0,r:22,hp:150,kill:true,vulnerableWhen:'!plate'}],
  phases:[{when:'always',attacks:[_A('ring',3,{count:12,speed:120,from:'core'})]},{when:'!plate',rage:1.3,say:'Nose plate gone. Now hit the core!'}]},
 reefWarden:{name:'Reef Warden',title:'Tri-arm hunter',model:{body:'enemy:hydra',scale:2.4,top:1},rx:50,ry:50,move:{type:'sway',amp:80,freq:.5,y:.2},score:10000,gears:14,
  parts:[{id:'arm1',name:'Arm',mesh:'turret',dx:0,dy:-44,r:14,hp:55,score:1100,gears:2,attacks:[_A('ring',2.6,{count:10,speed:125})]},{id:'arm2',name:'Arm',mesh:'turret',dx:-38,dy:22,r:14,hp:55,score:1100,gears:2,attacks:[_A('aimed',1.4,{count:2,spread:10,speed:180})]},
   {id:'arm3',name:'Arm',mesh:'turret',dx:38,dy:22,r:14,hp:55,score:1100,gears:2,attacks:[_A('aimed',1.5,{count:2,spread:10,speed:180})]},{id:'core',name:'Core',mesh:'none',dx:0,dy:0,r:22,hp:150,kill:true,guard:.6}],
  phases:[{when:'always',attacks:[]},{when:'parts<=0',rage:1.5,attacks:[_A('spiral',.12,{arms:3,speed:130,from:'core'})]}]},
 canyonCrawler:{name:'Canyon Crawler',title:'Twin-turret tank',model:{body:'enemy:tank',scale:2.6,top:2.6},rx:42,ry:50,ground:true,move:{type:'sway',amp:70,freq:.45,y:.24},score:11000,gears:15,
  parts:[{id:'gunL',name:'Left turret',mesh:'twin',dx:-24,dy:-6,r:15,hp:70,score:1300,gears:3,attacks:[_A('burst',2,{count:3,gap:.12,speed:180,bullet:'shell'})]},{id:'gunR',name:'Right turret',mesh:'twin',dx:24,dy:-6,r:15,hp:70,score:1300,gears:3,attacks:[_A('mortar',3.2,{delay:1.3,radius:36,damage:18})]},
   {id:'core',name:'Hull',mesh:'none',dx:0,dy:10,r:24,hp:160,kill:true,guard:.6}],
  phases:[{when:'always',attacks:[]},{when:'parts<=0',rage:1.4,attacks:[_A('ring',1.3,{count:14,speed:130,from:'core'})]}]},
 frostWarden:{name:'Frost Warden',title:'Shielded interceptor',model:{body:'enemy:aegis',scale:2.4,top:.4},rx:44,ry:44,move:{type:'strafe',amp:100,freq:.6,y:.18},score:11000,gears:15,
  parts:[{id:'gen',name:'Shield generator',mesh:'shieldGen',dx:0,dy:-34,r:15,hp:80,score:1500,gears:3,shield:true},{id:'gunL',name:'Left gun',mesh:'turret',dx:-36,dy:10,r:13,hp:55,score:1100,gears:2,attacks:[_A('aimed',1.2,{count:2,spread:8,speed:185})]},
   {id:'gunR',name:'Right gun',mesh:'turret',dx:36,dy:10,r:13,hp:55,score:1100,gears:2,attacks:[_A('aimed',1.3,{count:2,spread:8,speed:185})]},{id:'core',name:'Core',mesh:'none',dx:0,dy:0,r:22,hp:160,kill:true,vulnerableWhen:'!gen'}],
  phases:[{when:'always',attacks:[_A('spiral',.15,{arms:2,speed:125,from:'core'})]},{when:'!gen',rage:1.3,say:'Its shield is down!'}]},
 neonSentry:{name:'Neon Sentry',title:'Teleport drone',model:{body:'enemy:blink',scale:2.2,top:.6},rx:42,ry:42,move:{type:'blink',every:5,gone:.45,y:.22},score:12000,gears:16,
  parts:[{id:'emL',name:'Left emitter',mesh:'dish',dx:-34,dy:0,r:14,hp:65,score:1300,gears:3,attacks:[_A('ring',2.2,{count:12,speed:125})]},{id:'emR',name:'Right emitter',mesh:'dish',dx:34,dy:0,r:14,hp:65,score:1300,gears:3,attacks:[_A('ring',2.4,{count:12,speed:125})]},
   {id:'core',name:'Core',mesh:'none',dx:0,dy:0,r:22,hp:170,kill:true,guard:.6}],
  phases:[{when:'always',attacks:[_A('aimed',1,{count:3,spread:10,speed:185,from:'core'})]},{when:'parts<=0',rage:1.5}]},
 magmaGuard:{name:'Magma Guard',title:'Heavy bomber',model:{body:'enemy:bomber',scale:1.1,top:.4},rx:64,ry:40,move:{type:'sway',amp:60,freq:.4,y:.2},score:13000,gears:18,
  parts:[{id:'engL',name:'Left engines',mesh:'engine',dx:-48,dy:-6,r:15,hp:80,score:1500,gears:3,attacks:[_A('rain',.4,{speed:150})]},{id:'engR',name:'Right engines',mesh:'engine',dx:48,dy:-6,r:15,hp:80,score:1500,gears:3,attacks:[_A('rain',.4,{speed:150})]},
   {id:'bay',name:'Bomb bay',mesh:'hangar',dx:0,dy:16,r:16,hp:70,score:1500,gears:3,attacks:[_A('mines',4,{count:2})]},{id:'core',name:'Cockpit',mesh:'none',dx:0,dy:-20,r:22,hp:180,kill:true,guard:.6}],
  phases:[{when:'always',attacks:[_A('fan',2,{count:7,spread:50,speed:165,from:'core'})]},{when:'parts<=0',rage:1.5,attacks:[_A('cross',.1,{speed:140,from:'core'})]}]},
};
// which boss each stage uses
['tidebreaker','harvestReaper','duneCrawler','ridgeGunship','ironLeviathan','reefCarrier','canyonColossus','polarTalon','skylineSentinel','infernoThrone'].forEach((b,i)=>{if(SF.STAGE_DEFS&&SF.STAGE_DEFS[i])SF.STAGE_DEFS[i].boss=b;});
// ---------- extra weapon modules (v5.3): every main boss carries 6-10 weapons ----------
// New part meshes: gatling (spinning barrels), beam (charge lance), orb (spiral pod), mortar (lobbed shells).
// Inserted before the core; every 'parts<=N' condition of that boss is raised by the number of extras, so the
// original pacing (how many weapons must fall before a phase) stays the same.
SF.BOSS_TAUNTS={};
(()=>{const G=(id,name,dx,dy,hp,o)=>Object.assign({id,name,mesh:'gatling',dx,dy,r:17,hp,score:2200,gears:4,attacks:[_A('aimed',1.1,{count:3,spread:7,speed:200})]},o||{}),
 L=(id,name,dx,dy,hp,o)=>Object.assign({id,name,mesh:'beam',dx,dy,r:18,hp,score:2800,gears:5,attacks:[_A('laser',6.5,{charge:1.2,fire:.6,dmg:14,offset:2})]},o||{}),
 O=(id,name,dx,dy,hp,o)=>Object.assign({id,name,mesh:'orb',dx,dy,r:17,hp,score:2500,gears:5,attacks:[_A('spiral',.16,{arms:3,speed:120})]},o||{}),
 M=(id,name,dx,dy,hp,o)=>Object.assign({id,name,mesh:'mortar',dx,dy,r:17,hp,score:2400,gears:4,attacks:[_A('mortar',4.2,{delay:1.4,radius:34,damage:18,offset:1.5})]},o||{});
 const X={
  tidebreaker:[G('gatF','Fore gatling',-80,-22,80),G('gatA','Aft gatling',80,22,80),L('lance','Bow lance',140,-6,95),M('mortar','Deck mortar',-145,12,85)],
  harvestReaper:[G('gatL','Left gatling',-62,42,110),G('gatR','Right gatling',62,42,110),O('orb','Thresher orb',-72,-52,100),M('mortar','Grain mortar',72,-52,100)],
  duneCrawler:[G('gatL','Flank gatling',-36,-82,75,{dy:-82}),G('gatR','Flank gatling',36,-122,75)],
  ridgeGunship:[G('gatL','Door gun L',-50,40,95),G('gatR','Door gun R',50,40,95),L('lance','Spine lance',0,28,110)],
  ironLeviathan:[G('deckL','Fore deck gun',-120,0,90,{mesh:'turret'}),G('deckR','Aft deck gun',120,0,90,{mesh:'turret'}),O('orb','Sonar orb',-40,12,95),M('mortar','Deck mortar',40,12,95)],
  reefCarrier:[G('gat1','Island gatling',-40,-30,90),G('gat2','Stern gatling',130,-22,90),L('lance','Island lance',-140,20,105)],
  canyonColossus:[G('gatL','Hip gatling L',-55,-22,95),G('gatR','Hip gatling R',55,-22,95)],
  polarTalon:[G('gatL','Wing gatling L',-92,-18,100),G('gatR','Wing gatling R',92,-18,100),L('lance','Frost lance',0,-46,115)],
  skylineSentinel:[G('gatL','Flank gun L',-45,45,100),G('gatR','Flank gun R',45,45,100),O('orbL','Pulse orb L',-42,-40,105),O('orbR','Pulse orb R',42,-40,105,{attacks:[_A('spiral',.16,{arms:3,speed:120,offset:.5})]})],
  infernoThrone:[G('gatL','Throne gatling L',-110,30,120),G('gatR','Throne gatling R',110,30,120),L('lanceL','Magma lance L',-38,46,130),L('lanceR','Magma lance R',38,46,130,{attacks:[_A('laser',6.5,{charge:1.2,fire:.6,dmg:16,offset:5})]})],
 };
 const up=(s,n)=>s&&s.replace(/parts<=(\d+)/g,(m,v)=>'parts<='+(+v+n));
 for(const k in X){const D=SF.BOSSES[k];if(!D)continue;const n=X[k].length,ci=D.parts.findIndex(p=>p.kill);D.parts.splice(ci<0?D.parts.length:ci,0,...X[k]);
  for(const p of D.parts)if(p.vulnerableWhen)p.vulnerableWhen=up(p.vulnerableWhen,n);for(const ph of D.phases)ph.when=up(ph.when,n);}
 // the enemy commander (an original Skyfire villain) taunts at each main boss; ORION answers
 const T=SF.BOSS_TAUNTS;
 T.tidebreaker=['Admiral Varn here. Your little harbor is mine, pilot.','Varn again. Ignore her, Rex. Sink that ship.'];
 T.harvestReaper=['The fields will feed my Ashen Fleet. Turn back.','Big blades, slow turns. Stay on its flanks.'];
 T.duneCrawler=['The desert swallows everything. You are next.','Hit the segments first. The head opens when they fall.'];
 T.ridgeGunship=['From the ridge I see every move you make.','Take out the rotors and it falls.'];
 T.ironLeviathan=['My Leviathan hunts beneath you. You will never see it coming.','Watch the water. Strike when it surfaces.'];
 T.reefCarrier=['Every wing I own is coming for you.','Knock out the launch decks before it fills the sky.'];
 T.canyonColossus=['The Colossus has never fallen. Not once.','Legs first. Make it limp.'];
 T.polarTalon=['Cold out here, pilot. Colder when you fall.','Its shield pylons first, then the core.'];
 T.skylineSentinel=['My city, my rules. Light them up!','It blinks around. Track the core when it lands.'];
 T.infernoThrone=['You made it to my throne. This is where your flight ends.','This is it, Rex. Bring everything you have.'];
})();
