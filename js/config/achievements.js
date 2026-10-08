'use strict';
// ============ MEDALS, ACHIEVEMENTS, SORTIE ORDERS ============
// Medal tiers per stage and mode, earned by clearing the stage and completing its objectives.
// Each tier pays once: gears × mode reward, plus Cores.
SF.MEDAL_TIERS=[
 {id:'spark',  name:'Spark',  color:'#c9a27a',objectives:0,gears:150,cores:0},
 {id:'flare',  name:'Flare',  color:'#c9d6e3',objectives:2,gears:300,cores:1},
 {id:'blaze',  name:'Blaze',  color:'#ffb347',objectives:4,gears:500,cores:2},
 {id:'skyfire',name:'Skyfire',color:'#7fe0ff',objectives:5,gears:800,cores:3},
];
// Lifetime achievements. stat = a save.stats counter (or a special check), goal = target. Rewards are one-off.
const _ach=(id,name,desc,stat,goal,cores,gears)=>({id,name,desc,stat,goal,cores,gears:gears||0});
SF.ACHIEVEMENTS=[
 _ach('first_blood','First Blood','Destroy your first enemy','kills',1,1,100),
 _ach('kills_500','Air Superiority','Destroy 500 enemies','kills',500,3,500),
 _ach('kills_3000','Sky Sweeper','Destroy 3,000 enemies','kills',3000,6,2000),
 _ach('kills_10000','Skyfire Legend','Destroy 10,000 enemies','kills',10000,10,5000),
 _ach('ground_200','Ground Pounder','Destroy 200 ground targets','groundKills',200,3,500),
 _ach('ground_1500','Scorched Earth','Destroy 1,500 ground targets','groundKills',1500,6,2000),
 _ach('form_10','Formation Breaker','Wipe out 10 full formations','formations',10,2,300),
 _ach('form_100','Pattern Recognition','Wipe out 100 full formations','formations',100,6,2000),
 _ach('setup_10','Demolition Crew','Destroy 10 complete ground sites','setups',10,2,300),
 _ach('setup_80','Siege Breaker','Destroy 80 complete ground sites','setups',80,6,2000),
 _ach('boss_1','Giant Slayer','Defeat your first boss','bosses',1,2,300),
 _ach('boss_10','Boss Hunter','Defeat 10 bosses','bosses',10,4,1000),
 _ach('boss_30','Titan Breaker','Defeat 30 bosses','bosses',30,8,3000),
 _ach('mini_10','Warden Down','Defeat 10 mini-bosses','minis',10,3,600),
 _ach('parts_50','Surgical Strike','Destroy 50 boss components','bossParts',50,4,1000),
 _ach('combo_25','Chain Reaction','Reach a 25 combo','bestCombo',25,2,300),
 _ach('combo_50','Unbroken','Reach a 50 combo','bestCombo',50,4,1000),
 _ach('combo_100','Perfect Storm','Reach a 100 combo','bestCombo',100,8,3000),
 _ach('nohit_1','Untouchable','Clear a mission without taking damage','noHitWins',1,3,500),
 _ach('nohit_10','Ghost Pilot','Clear 10 missions without taking damage','noHitWins',10,8,3000),
 _ach('easy_all','Squadron Ready','Clear all 10 missions on Easy','easyClears',10,5,1500),
 _ach('hard_all','Hardened','Clear all 10 missions on Hard','hardClears',10,8,3000),
 _ach('extreme_all','Ace of Aces','Clear all 10 missions on Extreme','extremeClears',10,12,6000),
 _ach('skyfire_1','White Hot','Earn a Skyfire medal','skyfireMedals',1,3,800),
 _ach('skyfire_10','Blinding','Earn 10 Skyfire medals','skyfireMedals',10,8,3000),
 _ach('chips_5','Collector','Find 5 medal chips','chips',5,4,1000),
 _ach('pickups_200','Scavenger','Collect 200 power-ups','pickups',200,3,600),
 _ach('special_50','Shockwave','Use Skyburst 50 times','specials',50,3,600),
 _ach('maxgun','Fully Loaded','Raise any gun to hangar level 10','maxWeapon',10,5,0),
 _ach('fleet','Full Hangar','Own all 4 jets','planes',4,5,0),
 _ach('flights_100','Veteran','Fly 100 missions','flights',100,5,1500),
];
// Sortie orders: 3 per day, picked from these templates with a date seed. Progress counts in missions only.
// Each completed order pays gears plus one Core.
SF.SORTIE_TEMPLATES=[
 {id:'kills',text:n=>`Destroy ${n} enemies`,stat:'kills',goals:[150,250,400]},
 {id:'ground',text:n=>`Destroy ${n} ground targets`,stat:'groundKills',goals:[40,70,110]},
 {id:'formations',text:n=>`Wipe out ${n} formations`,stat:'formations',goals:[5,9,14]},
 {id:'setups',text:n=>`Destroy ${n} ground sites`,stat:'setups',goals:[4,7,10]},
 {id:'bosses',text:n=>`Defeat ${n} bosses`,stat:'bosses',goals:[1,2,3]},
 {id:'pickups',text:n=>`Collect ${n} power-ups`,stat:'pickups',goals:[10,18,28]},
 {id:'wins',text:n=>`Clear ${n} missions`,stat:'wins',goals:[2,3,5]},
 {id:'combo',text:n=>`Reach a ${n} combo in one mission`,stat:'runCombo',goals:[20,35,50],max:true},
 {id:'parts',text:n=>`Destroy ${n} boss components`,stat:'bossParts',goals:[4,8,12]},
];
SF.SORTIE_REWARD={gears:600,cores:1};
