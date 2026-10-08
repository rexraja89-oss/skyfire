'use strict';
// ============ ECONOMY + PRODUCTS ============
// Gameplay only ever talks to SF.wallet ("can I afford / spend / grant") and SF.ent ("does the player have X").
// Real-money products are described here as DATA ONLY: what a product grants, never its price.
// Prices, purchase flow, verification and restore live in a billing provider (js/economy.js),
// so Google Play Billing (or any other store) plugs in later without touching progression code.
//
// FAIR-PLAY RULES (keep these when adding products or tuning numbers):
//  1. A free player can finish every stage, every mode and max every upgrade through play alone.
//  2. Everything that costs Cores can also be reached with Cores earned in play (medals, first clears,
//     achievements, sortie orders). Paying only gets there sooner.
//  3. Paid items are convenience, faster progression, cosmetics, optional extra content or support.
//     No paid-only weapon power, no paid-only stages in the main campaign, no pay-to-continue.
//  4. Never sell randomised rewards for real money.
SF.ECON={
 currencies:{
  gears:{name:'Gears',kind:'soft',icon:'cog'},     // normal currency: stages, missions, medals, rewards
  cores:{name:'Cores',kind:'premium',icon:'core'}, // rare: limited gameplay drip + optional purchase
 },
 // gameplay sources of Cores (amounts used from Checkpoint 6; listed here so the full free supply is visible)
 objectiveGears:{base:120,perStage:40}, // gears for completing an objective the first time (× mode reward)
 coreSources:{firstClear:3,medalTier:[0,1,2,3,5],achievement:[2,10],sortieOrder:1,bossFirstKill:2},
 // products: id -> what it grants. type: consumable (can buy again) | nonconsumable (owned forever, restorable)
 products:{
  core_pack_small: {type:'consumable',   grants:{cores:40},  title:'Pouch of Cores'},
  core_pack_medium:{type:'consumable',   grants:{cores:120}, title:'Crate of Cores'},
  core_pack_large: {type:'consumable',   grants:{cores:300}, title:'Vault of Cores'},
  gear_pack:       {type:'consumable',   grants:{gears:25000},title:'Gear Shipment'},
  starter_pack:    {type:'nonconsumable',grants:{cores:60,gears:15000},entitlements:['starter_pack'],title:'Starter Pack',once:true},
  remove_ads:      {type:'nonconsumable',entitlements:['remove_ads'],title:'Remove Ads'},
  premium_upgrade_pack:{type:'nonconsumable',entitlements:['premium_upgrade_pack'],title:'Hangar Plus'},
 },
 // entitlements: what owning something means in game. Gameplay reads these via SF.ent.has(id) / SF.ent.perk(name).
 entitlements:{
  starter_pack:{desc:'Starter Pack owner',perks:{}},
  remove_ads:{desc:'No ads (Skyfire has none yet; reserved)',perks:{noAds:true}},
  premium_upgrade_pack:{desc:'+25% gears from missions',perks:{gearBonus:.25}},
 },
};
