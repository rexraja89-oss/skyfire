'use strict';
// ============ PICKUPS ============
// Every pickup type: look, sound, effect and (for timed ones) duration. Drop odds live in SF.DROPS.
// effect: levelUp | overdrive | shield | repair | charge | multiplier | gears | chip
SF.PICKUPS={
 cell:      {name:'Power cell', color:'#ff9d2e',icon:'P',  effect:'levelUp',sfx:'lvl'},
 overdrive: {name:'Overdrive',  color:'#ff4d3d',icon:'bolt',effect:'overdrive',sfx:'over',duration:8,levels:3,rate:1.25},
 shield:    {name:'Shield',     color:'#38c8ff',icon:'ring',effect:'shield',sfx:'shieldUp',duration:12,hits:2},
 repair:    {name:'Repair',     color:'#3ddc84',icon:'+',  effect:'repair',sfx:'power',amount:.35},
 charge:    {name:'Skyburst charge',color:'#7fa8ff',icon:'S',effect:'charge',sfx:'power',amount:45},
 multiplier:{name:'Score ×2',   color:'#ffd23f',icon:'x2', effect:'multiplier',sfx:'power',duration:10,mult:2},
 gearCache: {name:'Gear cache', color:'#ffb347',icon:'gear',effect:'gears',sfx:'power',gears:20},
 chip:      {name:'Medal chip', color:'#c07bff',icon:'gem',effect:'chip',sfx:'chip'},
};
// Drop tables. 'chance' = chance that a kill drops anything from the table; 'items' = relative weights.
// Power cells are separate (rubber-band odds in SF.BAL.pickup). Enemies pick a table with dropTable (default 'standard').
SF.DROPS={
 standard: {chance:.05,items:{repair:3,charge:3,shield:1.5,multiplier:1.5,overdrive:1,gearCache:1}},
 heavy:    {chance:.5, items:{repair:3,shield:2,overdrive:2,multiplier:2,gearCache:2}},
 ground:   {chance:.1, items:{repair:2,charge:3,gearCache:3,multiplier:1,shield:1}},
 formation:{chance:.65,items:{overdrive:3,shield:2,multiplier:3,charge:2,gearCache:2}},   // whole formation destroyed
 setup:    {chance:1,  items:{overdrive:2,repair:2,multiplier:2,gearCache:3,shield:1}},   // whole ground setup destroyed
 chip:     {chance:.004},                                                                  // rare collectible, any kill
};
