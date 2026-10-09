'use strict';
// Campaign data used by the current (legacy) mission flow. New engine data lives in js/config/.
// ================= DATA =================
const MODES=[
 {k:'easy',name:'Easy',hp:1,fire:1,spd:1,dmg:1,gear:1,score:1},
 {k:'hard',name:'Hard',hp:1.9,fire:1.35,spd:1.17,dmg:1.6,gear:2,score:2},
 {k:'extreme',name:'Extreme',hp:3,fire:1.8,spd:1.33,dmg:2.3,gear:3.5,score:3},
];
const STAGES=[
 {name:'Harbor Dawn',place:'Coastal harbor',biome:'harbor',brief:'Enemy gunboats are raiding the harbor at dawn. Clear the bay.',boss:{name:'Tidebreaker',kind:'ship',hull:'#59606b'},enemies:['fighter','heli','boat','aa'],land:[22,88],water:[185,380],weather:'',reward:'spread',key:45},
 {name:'Storm Fleet',place:'Open ocean, storm front',biome:'storm',brief:'An Ashen Fleet battle group is running through a storm front. Sink the escorts, break the battleships and stop the flagship.',boss:{name:'Tempest Dreadnought',kind:'ship',hull:'#3a4148'},enemies:['fighter','heli','bomber'],water:[10,390],weather:'storm',reward:'gundrone',key:47},
 {name:'Desert Highway',place:'Open desert',biome:'desert',brief:'A supply convoy is running the desert highway under heavy escort. New contacts: Hornet missile gunships.',boss:{name:'Dune Crawler',kind:'land',hull:'#8a6a3c'},enemies:['fighter','fighter2','tank','truck','aa','hornet','bomber'],land:[30,370],weather:'sand',reward:'viper',key:43},
 {name:'Jungle Ridge',place:'Mountain jungle',biome:'forest',brief:'Gunships and shielded fighters are hiding in the jungle valleys. Watch the tree line.',boss:{name:'Ridge Gunship',kind:'gunship',hull:'#3f4b3c'},enemies:['fighter','heli','aa','tank','drone','hornet','aegis','sam'],land:[30,370],weather:'mist',reward:'flamer',key:50},
 {name:'Steel Docks',place:'Industrial port',biome:'port',brief:'The enemy fleet is refuelling at the container port. Snipers and minelayers spotted.',boss:{name:'Iron Leviathan',kind:'ship',hull:'#3d4450'},enemies:['fighter2','heli','boat','aa','truck','drone','lancer','sower','sam'],land:[30,240],water:[305,385],weather:'rain',reward:'laserdrone',key:45},
 {name:'Coral Isles',place:'Tropical archipelago',biome:'islands',brief:'A carrier group is anchored among the coral isles. Hydra craft split when destroyed.',boss:{name:'Reef Carrier',kind:'ship',hull:'#5d6874'},enemies:['fighter','heli','boat','bomber','drone','hydra','aegis','sower','lancer'],water:[30,370],weather:'',reward:'laser',key:48},
 {name:'Red Canyon',place:'Desert canyon',biome:'canyon',brief:'The canyon walls hide artillery and stealth Wraith fighters. Fly the river and burn them out.',boss:{name:'Canyon Colossus',kind:'land',hull:'#6b3a28'},enemies:['fighter2','heli','tank','aa','artillery','wraith','hornet','hydra','sam'],land:[30,370],weather:'',reward:'titan',key:41},
 {name:'Frozen Outpost',place:'Arctic ice shelf',biome:'arctic',brief:'A polar airbase protected by shield domes and Mender repair craft. Kill the healers first.',boss:{name:'Polar Talon',kind:'wing',hull:'#6c7a8a'},enemies:['fighter','heli','tank','aa','drone','bomber','mender','wraith','artillery','dome'],land:[30,280],weather:'snow',reward:'plasma',key:46},
 {name:'Neon Metropolis',place:'City at night',biome:'city',brief:'Night raid over the metropolis. Blink teleporters and drone swarms guard the skyline.',boss:{name:'Skyline Sentinel',kind:'gunship',hull:'#2b303c'},enemies:['fighter2','heli','drone','aa','bomber','blink','lancer','mender','sower','dome'],land:[30,370],weather:'rain',reward:'shielddrone',key:44},
 {name:'Magma Citadel',place:'Volcanic fortress',biome:'volcano',brief:'This is their last stronghold, built on a live volcano. Every enemy type is here.',boss:{name:'Inferno Throne',kind:'wing',hull:'#3a2420'},enemies:['fighter','fighter2','heli','tank','aa','bomber','drone','hornet','aegis','lancer','hydra','wraith','sower','mender','blink','sam','artillery','dome'],land:[30,370],weather:'embers',reward:'phantom',key:40},
];
const PLANES={
 falcon:{name:'Falcon',desc:'Balanced all-rounder. Reliable and easy to fly.',hp:100,spd:1,dmg:1,fire:1,body:'#dfe5ec',accent:'#1fb5a8',jet:{L:48,S:44,sweep:.55,wl:.36,chord:.38,tip:.1,fw:5,tailS:.36,fins:1,eng:2}},
 viper:{name:'Viper',desc:'Light delta interceptor. Very fast and quick on the trigger.',hp:80,spd:1.3,dmg:1.05,fire:1.15,body:'#c42433',accent:'#ffd23f',jet:{L:50,S:38,sweep:.95,wl:.3,chord:.56,tip:.05,fw:4.5,tailS:0,canard:1}},
 titan:{name:'Titan',desc:'Heavy armoured gunship with an extra bomb bay.',hp:150,spd:.85,dmg:1.12,fire:1,bombs:1,body:'#5d6b45',accent:'#ff9d2e',jet:{L:52,S:56,sweep:.22,wl:.38,chord:.32,tip:.16,fw:7,tailS:.4,eng:2}},
 phantom:{name:'Phantom',desc:'Stealth ace. +25% damage and a stronger gear magnet.',hp:115,spd:1.15,dmg:1.25,fire:1.05,mag:1.4,body:'#2a2e36',accent:'#a46bff',jet:{L:50,S:50,sweep:.8,wl:.24,chord:.6,tip:.2,fw:6,tailS:0,fins:1}},
};
const WEAPONS={
 vulcan:{name:'Vulcan Cannon',desc:'Rapid streams of armour-piercing rounds.',base:120},
 spread:{name:'Spread Shot',desc:'A wide fan of shells that covers the whole sky.',base:160},
 flamer:{name:'Flamethrower',desc:'Short-range torrent of fire that melts everything in front.',base:220},
 laser:{name:'Laser Lance',desc:'Continuous beam. Pierces through every target at level 6+.',base:260},
 plasma:{name:'Plasma Cannon',desc:'Heavy orbs that explode and splash nearby enemies.',base:300},
};
const DRONES={
 gundrone:{name:'Gun Drones',desc:'Two escort drones with auto-cannons.',base:250},
 laserdrone:{name:'Laser Drones',desc:'Lock on and zap the nearest enemy.',base:300},
 shielddrone:{name:'Shield Drones',desc:'Orbit your jet and block enemy bullets.',base:320},
};
const PARTS=[
 {k:'armor',name:'Armour Plating',desc:'+20 hull per level',base:150},
 {k:'engine',name:'Afterburner Core',desc:'+5% fire rate per level',base:180},
 {k:'missile',name:'Homing Missiles',desc:'Seekers launch from the wings',base:320},
 {k:'magnet',name:'Gear Magnet',desc:'Pull gears from further away',base:90},
 {k:'bomb',name:'Mega Bombs',desc:'+1 bomb per mission',base:260},
];
// enemy roster: hp, hit radius, gears, points, ground?, ORION intro for special abilities
const ET={
 fighter:{hp:4,r:13,g:1,pts:150},fighter2:{hp:5,r:13,g:1,pts:180},heli:{hp:12,r:17,g:3,pts:300},bomber:{hp:70,r:40,g:10,pts:1500},drone:{hp:3,r:11,g:1,pts:120},
 hornet:{hp:16,r:18,g:4,pts:500,intro:'New threat: Hornet gunships. They launch homing missiles, so keep moving or shoot them down.'},
 aegis:{hp:9,r:15,g:3,pts:450,intro:'Aegis fighters carry energy shields. Break the blue shield, then the hull. It recharges if you stop firing.'},
 lancer:{hp:12,r:15,g:3,pts:500,intro:'Lancer snipers! When you see a red targeting line, get out of it.'},
 hydra:{hp:22,r:19,g:4,pts:600,intro:'Hydra craft split into three drones when destroyed. Be ready.'},
 wraith:{hp:10,r:15,g:3,pts:600,intro:'Wraith stealth fighters. They cannot be hit while cloaked. Strike when they shimmer into view.'},
 sower:{hp:20,r:21,g:4,pts:550,intro:'Sower minelayers. Their mines burst into bullet rings. Shoot the mines before they blow.'},
 mine:{hp:2.5,r:10,g:0,pts:50},
 mender:{hp:18,r:18,g:5,pts:700,intro:'A Mender is repairing enemy craft. Take it out first!'},
 blink:{hp:14,r:16,g:4,pts:650,intro:'Blink teleporters. They jump around and fire bullet rings. Hit them between jumps.'},
 tank:{hp:14,r:15,g:3,pts:400,ground:1},aa:{hp:10,r:15,g:3,pts:350,ground:1},truck:{hp:5,r:11,g:2,pts:200,ground:1},boat:{hp:16,r:16,g:4,pts:450,ground:1},
 sam:{hp:16,r:16,g:4,pts:500,ground:1,intro:'SAM launchers on the ground. Expect homing missiles from below.'},
 artillery:{hp:20,r:17,g:5,pts:600,ground:1,intro:'Artillery is targeting your position. Move when you see the red circle.'},
 dome:{hp:32,r:20,g:6,pts:800,ground:1,intro:'A shield generator is protecting nearby ground units. Destroy it to drop their shields.'},
};
const MAXL=10;
const cost=(base,l)=>Math.round(base*Math.pow(1.55,l));
const REWARD_NAME=k=>(PLANES[k]||WEAPONS[k]||DRONES[k]).name;
const MEDALS=[['clear','Mission cleared'],['untouched','No damage taken'],['hunter','85% enemies downed']];
