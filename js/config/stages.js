'use strict';
// ============ STAGES ============
// One entry per mission (same order as STAGES in data.js, which keeps the name, biome, boss name and reward).
// Timeline events run on the stage clock in seconds (the clock stops while a mini-boss or boss is fighting).
// Event fields:
//   at       seconds on the stage clock
//   mode     'hard' = only on Hard and Extreme, 'extreme' = only on Extreme (gameplay difficulty)
//   f + e    formation name (formations.js) + enemy type     | x (-0.5..0.5 shift), mirror
//   g + x    ground setup (ground.js) at x = fraction of width, or x:'road' for the stage road
//   w + n    loose wave of n enemies of type w               | lay: 'spread' (default) or 'v'
//   boats    n gunboats on the stage water
//   mini     mini-boss id (bosses.js)                        | the clock waits until it is destroyed
//   say      ORION line          banner / sub   big centre text      zone   new area name
// After the last event and once the sky is clear, the boss arrives. Objectives use missions.js strings.
const _O=(easy,hard,extreme)=>({easy,hard,extreme});
SF.STAGE_DEFS=[
 // 1 · Harbor Dawn ─ coast on the left, open water on the right
 {len:96,road:null,timeline:[
  {at:3,f:'vDrop',e:'dart'},{at:9,f:'pincer',e:'swift'},{at:15,boats:2},{at:18,f:'lineHover',e:'gunboat'},
  {at:24,g:'coastGuns',x:.14},{at:27,f:'snake',e:'dart'},{at:33,f:'vDrop',e:'swift',mode:'hard'},{at:36,boats:3},
  {at:40,say:'Gunboats moving up the bay. Sink them before they reach the harbor.'},{at:42,f:'crossing',e:'swift'},
  {at:48,mini:'harborWarden'},{at:52,zone:'Outer harbor'},{at:54,f:'wedgeLeader'},{at:60,boats:2},{at:61,g:'coastGuns',x:.14},
  {at:64,banner:'BOAT RUSH',sub:'SPECIAL EVENT',say:'Fast boats breaking out of the harbor! Stop the rush!'},{at:65,boats:3},{at:68,boats:3},{at:71,boats:3,mode:'hard'},
  {at:74,f:'swoop',e:'swift'},{at:78,f:'stagger',e:'dart'},{at:82,f:'pincer',e:'swift',mode:'hard'},{at:84,f:'lineHover',e:'gunboat'},
  {at:90,f:'mixedRaid',mode:'extreme'}],
  obj:_O(['killPct:70','formations:3','combo:20','noHit','bossParts'],['killPct:80','formations:5','combo:30','hull:70','bossParts'],['killPct:90','formations:6','combo:45','noHit','bossTime:75'])},
 // 2 · Storm Fleet ─ open ocean in a storm front: escorts, destroyer screens, battleships, then the flagship
 {len:100,road:null,timeline:[
  {at:3,f:'vDrop',e:'dart'},{at:7,boats:3},{at:10,f:'swoop',e:'swift'},{at:13,g:'escortGroup',x:.32},
  {at:16,say:'Storm front ahead. Ashen Fleet escorts below, low and fast.'},{at:18,f:'lineHover',e:'gunboat'},{at:22,g:'destroyerPair',x:.6},
  {at:26,f:'snake',e:'dart'},{at:30,boats:3},{at:32,w:'brute',n:1},{at:36,f:'pincer',e:'swift',mode:'hard'},{at:38,g:'escortGroup',x:.7},
  {at:44,mini:'squallRunner'},
  {at:48,zone:'Fleet anchorage'},{at:50,f:'stagger',e:'dart'},
  {at:54,banner:'BATTLE GROUP',sub:'SPECIAL EVENT',say:'Battleship dead ahead with destroyer escort. Break its turrets before it can bring them to bear!'},{at:55,g:'battleGroup',x:.5},
  {at:62,f:'converge',e:'swift'},{at:66,boats:4,mode:'hard'},{at:68,f:'wedgeLeader'},{at:72,g:'destroyerPair',x:.4},
  {at:76,f:'crossing',e:'dart'},{at:80,g:'battleGroup',x:.5,mode:'hard'},{at:84,f:'boxEscort'},{at:88,g:'escortGroup',x:.3,mode:'extreme'},{at:90,f:'vDropWide',e:'dart'}],
  obj:_O(['killPct:70','setups:3','leaders:1','combo:20','bossParts'],['killPct:80','setups:5','combo:35','noHit','bossParts'],['groundPct:95','setups:6','combo:50','noSpecial','bossTime:75'])},
 // 3 · Desert Highway ─ dunes, a highway on the left
 {len:104,road:-6,timeline:[
  {at:3,f:'pincer',e:'swift'},{at:8,g:'convoy',x:'road'},{at:12,f:'vDrop',e:'dart'},{at:18,w:'hornet',n:2},
  {at:24,g:'outpost',x:.7},{at:26,f:'swoop',e:'swift'},{at:32,w:'hawk',n:3},{at:38,g:'depotYard',x:.62},{at:40,f:'snake',e:'swift',mode:'hard'},
  {at:46,mini:'duneSkimmer'},{at:50,zone:'Oil fields'},{at:52,g:'missileSite',x:.65},{at:54,f:'stagger',e:'dart'},
  {at:62,banner:'AMBUSH',sub:'SPECIAL EVENT',say:'Hawks diving out of the sun! Watch the orange lines!'},{at:63,w:'hawk',n:3},{at:66,w:'hawk',n:4},{at:69,w:'hawk',n:4,mode:'hard'},
  {at:72,g:'armorColumn',x:'road'},{at:74,f:'wedgeLeader'},{at:80,w:'hornet',n:2},{at:84,g:'depotYard',x:.7},{at:86,f:'crossing',e:'swift'},
  {at:92,f:'mixedRaid',mode:'hard'},{at:94,w:'brute',n:1,mode:'extreme'}],
  obj:_O(['killPct:70','killType:hawk*6','setups:3','combo:15','bossParts'],['killPct:80','killType:hawk*10','setups:5','hull:60','bossParts'],['killPct:90','setups:6','combo:50','noHit','bossTime:75'])},
 // 4 · Jungle Ridge ─ jungle valley with a river
 {len:108,road:null,timeline:[
  {at:3,f:'lineHover',e:'gunboat'},{at:9,f:'snake',e:'dart'},{at:14,g:'towerPair',x:.3},{at:16,w:'drone',n:6},
  {at:22,f:'ringSpin',e:'aegis'},{at:28,g:'missileSite',x:.7},{at:30,w:'hornet',n:2},{at:36,f:'pincer',e:'swift'},
  {at:40,g:'relay',x:.3},{at:44,f:'boxEscort',mode:'hard'},{at:48,mini:'ridgeStalker'},{at:52,zone:'High ridge'},
  {at:54,f:'stagger',e:'aegis'},{at:60,g:'radarPost',x:.68},
  {at:64,banner:'TREE-LINE AMBUSH',sub:'SPECIAL EVENT',say:'Gun emplacements hidden in the trees! They are opening up!'},{at:65,g:'towerPair',x:.25},{at:66,g:'towerPair',x:.75},{at:68,w:'gunboat',n:3},{at:71,w:'drone',n:8,mode:'hard'},
  {at:76,f:'wedgeLeader'},{at:82,g:'relay',x:.7},{at:84,f:'converge',e:'swift'},{at:90,w:'hornet',n:3},{at:94,f:'ringSpin',e:'aegis',mode:'extreme'}],
  obj:_O(['killPct:70','setups:3','killType:aegis*6','combo:15','bossParts'],['killPct:80','setups:5','combo:35','noSpecial','bossParts'],['killPct:90','setups:7','combo:55','noHit','bossTime:75'])},
 // 5 · Steel Docks ─ container port (land on the left, water on the right)
 {len:112,road:null,timeline:[
  {at:3,f:'swoop',e:'siderunner'},{at:9,boats:2},{at:10,g:'flakNest',x:.3},{at:15,w:'lancer',n:1},{at:19,f:'vDrop',e:'swift'},
  {at:24,g:'depotYard',x:.3},{at:27,w:'sower',n:1},{at:32,f:'strafeRun',e:'siderunner'},{at:36,boats:3},{at:38,g:'missileSite',x:.32},
  {at:42,w:'lancer',n:2,mode:'hard'},{at:46,mini:'craneJack'},{at:50,zone:'Container yards'},{at:52,g:'factory',x:.32},{at:54,f:'snake',e:'dart'},
  {at:62,banner:'CRANE GAUNTLET',sub:'SPECIAL EVENT',say:'Snipers on the cranes and missiles below. Keep moving!'},{at:63,w:'lancer',n:2},{at:64,g:'missileSite',x:.3},{at:68,w:'lancer',n:2},{at:70,boats:3,mode:'hard'},
  {at:74,f:'wedgeLeader'},{at:80,w:'sower',n:1},{at:82,g:'depotYard',x:.28},{at:86,f:'crossing',e:'swift'},{at:92,f:'boxEscort'},{at:96,f:'mixedRaid',mode:'extreme'}],
  obj:_O(['killPct:70','killType:lancer*4','setups:3','combo:20','bossParts'],['killPct:80','setups:5','combo:40','hull:60','bossParts'],['killPct:90','setups:7','combo:55','noHit','bossTime:75'])},
 // 6 · Coral Isles ─ open sea with small islands (no land targets: boats and air)
 {len:112,road:null,timeline:[
  {at:3,f:'vDropWide',e:'dart'},{at:9,boats:3},{at:12,f:'ringSpin',e:'aegis'},{at:18,w:'hydra',n:2},{at:24,boats:3},
  {at:26,f:'snake',e:'swift'},{at:32,w:'sower',n:1},{at:36,f:'pincer',e:'swift'},{at:40,w:'lancer',n:2},{at:44,mini:'reefWarden'},
  {at:48,zone:'Lagoon'},{at:50,f:'wedgeLeader'},{at:54,boats:4},
  {at:58,banner:'CARRIER LAUNCH',sub:'SPECIAL EVENT',say:'The carrier is launching everything it has!'},{at:59,f:'swoop',e:'swift'},{at:61,f:'swoop',e:'swift',mirror:true},{at:64,f:'loop',e:'dart'},{at:67,f:'crossing',e:'swift',mode:'hard'},
  {at:72,w:'hydra',n:3},{at:78,f:'boxEscort'},{at:82,boats:4},{at:84,w:'brute',n:1},{at:90,f:'vDropWide',e:'dart'},{at:94,f:'mixedRaid',mode:'hard'}],
  obj:_O(['killPct:70','formations:4','killType:boat*8','combo:25','bossParts'],['killPct:80','formations:6','combo:40','noSpecial','bossParts'],['killPct:90','formations:8','combo:55','noHit','bossTime:75'])},
 // 7 · Red Canyon ─ cliffs on both sides of a river
 {len:116,road:null,timeline:[
  {at:3,f:'swoop',e:'swift'},{at:8,g:'bunkerLine',x:.5},{at:12,w:'wraith',n:2},{at:18,f:'vDrop',e:'dart'},{at:20,g:'missileSite',x:.5},
  {at:26,w:'hornet',n:2},{at:30,f:'snake',e:'swift'},{at:34,g:'radarPost',x:.3},{at:38,w:'hydra',n:2},{at:42,w:'wraith',n:2,mode:'hard'},
  {at:46,mini:'canyonCrawler'},{at:50,zone:'Deep gorge'},{at:52,g:'bunkerLine',x:.5},{at:54,f:'stagger',e:'dart'},
  {at:62,banner:'RIVER RUN',sub:'SPECIAL EVENT',say:'Mortars on both rims! Read the circles and weave!'},{at:63,g:'domeBunkers',x:.3},{at:66,g:'domeBunkers',x:.7},{at:68,w:'hawk',n:3},
  {at:74,f:'wedgeLeader'},{at:80,w:'wraith',n:3},{at:84,g:'missileSite',x:.5},{at:88,f:'crossing',e:'swift'},{at:94,w:'brute',n:1},{at:98,f:'mixedRaid',mode:'hard'}],
  obj:_O(['killPct:70','setups:4','killType:wraith*4','combo:25','bossParts'],['killPct:80','setups:6','combo:45','hull:60','bossParts'],['killPct:90','setups:8','combo:60','noHit','bossTime:75'])},
 // 8 · Frozen Outpost ─ ice shelf on the left, frozen sea on the right
 {len:120,road:null,timeline:[
  {at:3,f:'vDrop',e:'dart'},{at:8,g:'domeBunkers',x:.35},{at:12,w:'tender',n:1},{at:14,f:'lineHover',e:'gunboat'},{at:20,w:'wraith',n:2},
  {at:24,g:'radarPost',x:.4},{at:28,f:'snake',e:'swift'},{at:32,w:'bulwark',n:2},{at:36,g:'factory',x:.38},{at:40,f:'ringSpin',e:'aegis',mode:'hard'},
  {at:46,mini:'frostWarden'},{at:50,zone:'Polar airbase'},{at:52,f:'wedgeLeader'},{at:56,g:'bunkerLine',x:.38},
  {at:62,banner:'DOME FIELD',sub:'SPECIAL EVENT',say:'Shield generators everywhere. Kill the domes, then the guns.'},{at:63,g:'domeBunkers',x:.3},{at:66,g:'domeBunkers',x:.55},{at:68,w:'tender',n:1},{at:70,w:'gunboat',n:3,mode:'hard'},
  {at:76,w:'bulwark',n:2},{at:80,f:'crossing',e:'swift'},{at:84,g:'factory',x:.38},{at:88,w:'wraith',n:3},{at:94,f:'boxEscort'},{at:100,f:'mixedRaid',mode:'hard'}],
  obj:_O(['killPct:70','setups:4','killType:tender*2','combo:25','bossParts'],['killPct:80','setups:6','combo:45','noSpecial','bossParts'],['killPct:90','setups:8','combo:60','noHit','bossTime:75'])},
 // 9 · Neon Metropolis ─ city blocks at night
 {len:124,road:3.6,timeline:[
  {at:3,f:'snake',e:'swift'},{at:8,g:'relay',x:.5},{at:12,w:'blink',n:2},{at:18,f:'vDrop',e:'dart'},{at:22,w:'drone',n:8},
  {at:26,g:'outpost',x:.3},{at:28,w:'lancer',n:2},{at:34,f:'ringSpin',e:'aegis'},{at:38,w:'sower',n:1},{at:40,g:'radarPost',x:.7},{at:42,w:'blink',n:2,mode:'hard'},
  {at:46,mini:'neonSentry'},{at:50,zone:'Downtown'},{at:52,f:'wedgeLeader'},{at:56,g:'armorColumn',x:'road'},
  {at:62,banner:'BLACKOUT',sub:'SPECIAL EVENT',say:'They cut the lights! Cloaked and teleporting craft all around!'},{at:63,w:'wraith',n:3},{at:66,w:'blink',n:3},{at:70,w:'wraith',n:2,mode:'hard'},
  {at:76,w:'tender',n:1},{at:78,f:'crossing',e:'swift'},{at:84,g:'relay',x:.3},{at:88,w:'lancer',n:3},{at:94,f:'boxEscort'},{at:100,f:'mixedRaid'},{at:104,w:'brute',n:1,mode:'extreme'}],
  obj:_O(['killPct:70','killType:blink*4','setups:3','combo:30','bossParts'],['killPct:80','setups:5','combo:50','hull:60','bossParts'],['killPct:90','setups:6','combo:65','noHit','bossTime:75'])},
 // 10 · Magma Citadel ─ the final fortress
 {len:132,road:null,timeline:[
  {at:3,f:'vDropWide',e:'dart'},{at:8,g:'outpost',x:.3},{at:10,f:'pincer',e:'swift'},{at:16,w:'hornet',n:2},{at:20,g:'missileSite',x:.7},
  {at:24,f:'ringSpin',e:'aegis'},{at:28,w:'hydra',n:2},{at:32,g:'domeBunkers',x:.5},{at:36,w:'wraith',n:2},{at:40,f:'wedgeLeader'},
  {at:44,g:'factory',x:.5},{at:48,mini:'magmaGuard'},{at:52,zone:'Lava gates'},{at:54,w:'blink',n:2},{at:58,g:'depotYard',x:.3},
  {at:62,banner:'THE GAUNTLET',sub:'SPECIAL EVENT',say:'This is everything they have left. Hold nothing back!'},{at:63,f:'swoop',e:'swift'},{at:64,g:'relay',x:.7},{at:66,w:'lancer',n:2},{at:68,w:'hawk',n:4},{at:71,f:'loop',e:'dart',mode:'hard'},
  {at:76,w:'tender',n:1},{at:78,w:'bulwark',n:2},{at:82,g:'bunkerLine',x:.5},{at:86,f:'crossing',e:'swift'},{at:90,w:'sower',n:1},{at:94,g:'radarPost',x:.3},
  {at:98,f:'boxEscort'},{at:104,f:'mixedRaid'},{at:108,w:'brute',n:2,mode:'hard'}],
  obj:_O(['killPct:70','setups:5','formations:4','combo:30','bossParts'],['killPct:80','setups:7','combo:50','noSpecial','bossParts'],['killPct:90','setups:9','combo:70','noHit','bossTime:75'])},
];

// v5.5: new ground sites (stilt batteries, rail guns, pop-up turrets, minefields, power lines) and the rescue objective
(()=>{const add=[
 [[57,'stiltBattery',.24]],
 [[60,'destroyerPair',.3]],   // Storm Fleet: at sea, no land sites
 [[28,'minefield',.5],[52,'stiltBattery',.7],[76,'railLine',.7]],
 [[35,'popField',.5],[66,'stiltBattery',.3]],
 [[25,'railLine',.35],[60,'stiltBattery',.3]],
 [[33,'stiltBattery',.5],[70,'stiltBattery',.4]],
 [[30,'popField',.5],[62,'minefield',.5]],
 [[28,'popField',.35],[58,'railLine',.3],[80,'pylonLine',.4]],
 [[32,'railLine',.5],[64,'popField',.5]],
 [[30,'stiltBattery',.6],[55,'minefield',.5],[85,'popField',.4],[100,'railLine',.5]]];
 SF.STAGE_DEFS.forEach((D,i)=>{for(const[at,g,x]of add[i]||[])if(at<D.len-5)D.timeline.push({at,g,x});D.timeline.sort((a,b)=>a.at-b.at);
  for(const m of['easy','hard','extreme'])if(D.obj[m]&&!D.obj[m].includes('rescue'))D.obj[m].push('rescue');});})();
