'use strict';
// ============ WEAPONS ============
// Each family has 10 levels. A level row sets every value the firing code uses, so tuning never touches code.
//  dmg      damage per projectile (laser: damage per second)
//  rate     shots per second
//  speed    projectile speed (logic px/s)
//  count    projectiles per shot
//  spread   total fan angle in degrees (or lateral spacing in px for 'stream')
//  pierce   extra targets a projectile passes through
//  size     visual scale of the projectile
//  tier     1-4 visual/sound tier (muzzle flash, impact size, colour, sound layer)
// Family extras: flamer life/width, laser width, plasma splash radius.
SF.WEAPONS={
 vulcan:{name:'Vulcan Cannon',kind:'stream',sfx:'shot',levels:[
  {dmg:1.0,rate:10,speed:820,count:1,spread:0, pierce:0,size:1.0,tier:1},
  {dmg:1.1,rate:11,speed:840,count:2,spread:10,pierce:0,size:1.0,tier:1},
  {dmg:1.15,rate:12,speed:850,count:2,spread:12,pierce:0,size:1.05,tier:1},
  {dmg:1.2,rate:12,speed:860,count:3,spread:20,pierce:0,size:1.1,tier:2},
  {dmg:1.25,rate:13,speed:870,count:3,spread:22,pierce:0,size:1.15,tier:2},
  {dmg:1.3,rate:13,speed:880,count:4,spread:30,pierce:0,size:1.2,tier:2},
  {dmg:1.35,rate:14,speed:890,count:4,spread:32,pierce:1,size:1.25,tier:3},
  {dmg:1.4,rate:14,speed:900,count:5,spread:40,pierce:1,size:1.3,tier:3},
  {dmg:1.5,rate:15,speed:910,count:5,spread:42,pierce:1,size:1.4,tier:4},
  {dmg:1.6,rate:16,speed:930,count:6,spread:50,pierce:1,size:1.5,tier:4}]},
 spread:{name:'Spread Shot',kind:'fan',sfx:'shot',levels:[
  {dmg:.8,rate:6.5,speed:640,count:3,spread:24,pierce:0,size:1.0,tier:1},
  {dmg:.85,rate:6.8,speed:650,count:4,spread:30,pierce:0,size:1.0,tier:1},
  {dmg:.9,rate:7,speed:660,count:5,spread:36,pierce:0,size:1.05,tier:1},
  {dmg:.95,rate:7.2,speed:670,count:5,spread:38,pierce:0,size:1.1,tier:2},
  {dmg:1.0,rate:7.4,speed:680,count:6,spread:44,pierce:0,size:1.15,tier:2},
  {dmg:1.05,rate:7.6,speed:690,count:7,spread:50,pierce:0,size:1.2,tier:2},
  {dmg:1.1,rate:7.8,speed:700,count:7,spread:52,pierce:1,size:1.25,tier:3},
  {dmg:1.15,rate:8,speed:710,count:8,spread:58,pierce:1,size:1.3,tier:3},
  {dmg:1.2,rate:8.2,speed:720,count:9,spread:64,pierce:1,size:1.4,tier:4},
  {dmg:1.3,rate:8.5,speed:740,count:10,spread:70,pierce:1,size:1.5,tier:4}]},
 flamer:{name:'Flamethrower',kind:'flame',sfx:'flame',levels:[
  {dmg:2.0,rate:30,speed:420,count:1,spread:20,pierce:9,size:1.0,tier:1,life:.26},
  {dmg:2.2,rate:30,speed:430,count:1,spread:22,pierce:9,size:1.05,tier:1,life:.28},
  {dmg:2.4,rate:32,speed:440,count:1,spread:24,pierce:9,size:1.1,tier:1,life:.3},
  {dmg:2.6,rate:32,speed:450,count:2,spread:26,pierce:9,size:1.15,tier:2,life:.31},
  {dmg:2.8,rate:34,speed:460,count:2,spread:28,pierce:9,size:1.2,tier:2,life:.32},
  {dmg:3.0,rate:34,speed:470,count:2,spread:30,pierce:9,size:1.25,tier:2,life:.34},
  {dmg:3.2,rate:36,speed:480,count:2,spread:32,pierce:9,size:1.3,tier:3,life:.35},
  {dmg:3.4,rate:36,speed:490,count:3,spread:34,pierce:9,size:1.35,tier:3,life:.36},
  {dmg:3.7,rate:38,speed:500,count:3,spread:36,pierce:9,size:1.45,tier:4,life:.38},
  {dmg:4.0,rate:40,speed:520,count:3,spread:40,pierce:9,size:1.55,tier:4,life:.4}]},
 laser:{name:'Laser Lance',kind:'beam',sfx:'zap',levels:[
  {dmg:22,rate:0,speed:0,count:1,spread:0,pierce:0,size:1.0,tier:1,width:5},
  {dmg:25,rate:0,speed:0,count:1,spread:0,pierce:0,size:1.0,tier:1,width:6},
  {dmg:28,rate:0,speed:0,count:1,spread:0,pierce:0,size:1.05,tier:1,width:7},
  {dmg:31,rate:0,speed:0,count:1,spread:0,pierce:0,size:1.1,tier:2,width:8},
  {dmg:34,rate:0,speed:0,count:1,spread:0,pierce:0,size:1.15,tier:2,width:9},
  {dmg:37,rate:0,speed:0,count:1,spread:0,pierce:1,size:1.2,tier:2,width:10},
  {dmg:40,rate:0,speed:0,count:1,spread:0,pierce:2,size:1.25,tier:3,width:11},
  {dmg:44,rate:0,speed:0,count:1,spread:0,pierce:3,size:1.3,tier:3,width:12},
  {dmg:48,rate:0,speed:0,count:1,spread:0,pierce:9,size:1.4,tier:4,width:14},
  {dmg:54,rate:0,speed:0,count:1,spread:0,pierce:9,size:1.5,tier:4,width:16}]},
 plasma:{name:'Plasma Cannon',kind:'orb',sfx:'plasma',levels:[
  {dmg:8,rate:2.4,speed:470,count:1,spread:0, pierce:0,size:1.0,tier:1,splash:40},
  {dmg:9,rate:2.5,speed:480,count:1,spread:0, pierce:0,size:1.05,tier:1,splash:44},
  {dmg:9.5,rate:2.6,speed:490,count:2,spread:10,pierce:0,size:1.05,tier:1,splash:46},
  {dmg:10,rate:2.7,speed:500,count:2,spread:12,pierce:0,size:1.1,tier:2,splash:50},
  {dmg:11,rate:2.8,speed:510,count:2,spread:14,pierce:0,size:1.15,tier:2,splash:54},
  {dmg:11.5,rate:2.9,speed:520,count:3,spread:20,pierce:0,size:1.2,tier:2,splash:58},
  {dmg:12,rate:3.0,speed:530,count:3,spread:22,pierce:1,size:1.25,tier:3,splash:62},
  {dmg:13,rate:3.1,speed:540,count:3,spread:24,pierce:1,size:1.3,tier:3,splash:66},
  {dmg:14,rate:3.2,speed:550,count:4,spread:30,pierce:1,size:1.4,tier:4,splash:72},
  {dmg:15,rate:3.4,speed:570,count:5,spread:36,pierce:1,size:1.5,tier:4,splash:80}]},
};
// side weapons from hangar parts/drones (values per hangar level 0-8)
SF.SIDEARMS={
 missile:{interval:l=>Math.max(.35,1.1-.09*l),dmg:l=>3+l,speed:560,turn:7},
 gundrone:{interval:.2,dmg:l=>1+.4*l,speed:760},
 laserdrone:{interval:l=>Math.max(.45,1-.06*l),dmg:l=>6+3*l,range:320},
 shielddrone:{radius:l=>11+l,orbit:36,contactDmg:l=>2+l},
};
// visual tiers: projectile colours and impact feel
SF.TIERS=[null,
 {core:'#ffe08a',glow:'#ff9d2e',impact:.6,flash:8},
 {core:'#fff3c4',glow:'#ffb347',impact:.8,flash:11},
 {core:'#ffffff',glow:'#7fe0ff',impact:1.0,flash:14},
 {core:'#ffffff',glow:'#c07bff',impact:1.25,flash:18}];
