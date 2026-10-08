'use strict';
// ============ WALLET, ENTITLEMENTS, BILLING SERVICE ============
// Three layers, kept apart on purpose:
//  SF.wallet   currencies (gears, cores). Gameplay asks canAfford/spend/grant. Knows nothing about money.
//  SF.ent      entitlements (owned products/perks). Gameplay asks has(id) or perk(name).
//  SF.billing  real-money store. Talks to ONE pluggable provider (Google Play later), verifies, then
//              fulfils products by granting currency/entitlements through the two layers above.
// No prices exist in game code: the provider supplies localised prices at runtime.
(()=>{
const C=SF.ECON;
// ---------- wallet ----------
function bal(c){return Math.max(0,Math.floor(+save[c]||0));}
SF.wallet={
 balance:bal,
 canAfford(cost){for(const c in cost)if(bal(c)<cost[c])return false;return true;},
 spend(cost,reason){if(!this.canAfford(cost))return false;for(const c in cost)save[c]=bal(c)-cost[c];store();SF.emit('wallet',{kind:'spend',cost,reason});return true;},
 grant(c,n,source){if(!C.currencies[c]||!(n>0))return 0;n=Math.floor(n);save[c]=bal(c)+n;store();SF.emit('wallet',{kind:'grant',c,n,source});return n;},
};
// ---------- entitlements ----------
SF.ent={
 has(id){return !!(save.ent&&save.ent[id]);},
 grant(id,source){if(!C.entitlements[id])return;save.ent[id]={at:Date.now(),source};store();SF.emit('entitlement',{id,source});},
 revoke(id){if(save.ent[id]){delete save.ent[id];store();SF.emit('entitlement',{id,revoked:1});}},
 // combined perk value from everything owned, e.g. SF.ent.perk('gearBonus') -> .25
 perk(name){let v=0;for(const id in save.ent){const p=(C.entitlements[id]||{}).perks||{};if(p[name]===true)return true;if(typeof p[name]==='number')v+=p[name];}return v;},
};
// ---------- billing ----------
// Provider interface (implement this for Google Play Billing later):
//  id                          short name
//  init()                      -> Promise<bool> ready
//  available()                 -> bool
//  queryProducts(ids)          -> Promise<[{id, price, currency, title}]>   (localised prices come from the store)
//  purchase(id)                -> Promise<receipt {txnId, productId, token}> or reject
//  verify(receipt)             -> Promise<bool>   (later: server-side verification)
//  finish(receipt, consumable) -> Promise         (acknowledge / consume with the store)
//  restore()                   -> Promise<[receipt]> owned non-consumables
const NullProvider={id:'none',init:()=>Promise.resolve(false),available:()=>false,queryProducts:()=>Promise.resolve([]),
 purchase:()=>Promise.reject(new Error('store unavailable')),verify:()=>Promise.resolve(false),finish:()=>Promise.resolve(),restore:()=>Promise.resolve([])};
// Test provider: no money involved. Used by automated tests and Rex's Workshop to exercise the full pipeline.
const DevProvider={id:'dev',owned:{},init:()=>Promise.resolve(true),available:()=>true,
 queryProducts:ids=>Promise.resolve(ids.map(id=>({id,price:'TEST',currency:'',title:(C.products[id]||{}).title||id}))),
 purchase(id){if(!C.products[id])return Promise.reject(new Error('unknown product'));const r={txnId:'dev-'+id+'-'+Date.now()+'-'+Math.floor(Math.random()*1e6),productId:id,token:'dev'};if(C.products[id].type==='nonconsumable')this.owned[id]=r;return Promise.resolve(r);},
 verify:r=>Promise.resolve(!!(r&&r.token==='dev')),finish:()=>Promise.resolve(),restore(){return Promise.resolve(Object.values(this.owned));}};
let provider=NullProvider;
// fulfil a verified receipt exactly once (txn ids are remembered in the save)
function fulfil(r,restoring){const P=C.products[r.productId];if(!P)return false;
 if(save.txn[r.txnId])return false;
 if(P.type==='nonconsumable'&&(P.entitlements||[]).every(e=>SF.ent.has(e))&&restoring)return false;
 save.txn[r.txnId]={p:r.productId,at:Date.now()};
 if(!(restoring&&P.type==='nonconsumable'&&P.once))for(const c in P.grants||{})SF.wallet.grant(c,P.grants[c],'purchase:'+r.productId);
 for(const e of P.entitlements||[])SF.ent.grant(e,'purchase:'+r.productId);
 store();SF.emit('purchase',{productId:r.productId,restored:!!restoring});return true;}
SF.billing={
 register(p){provider=p||NullProvider;return provider.init();},
 get provider(){return provider.id;},
 available(){return provider.available();},
 products(){return provider.queryProducts(Object.keys(C.products));},
 async purchase(id){const P=C.products[id];if(!P)throw new Error('unknown product');
  if(P.type==='nonconsumable'&&(P.entitlements||[]).length&&P.entitlements.every(e=>SF.ent.has(e)))return {ok:false,reason:'owned'};
  const r=await provider.purchase(id);if(!(await provider.verify(r)))return {ok:false,reason:'verify'};
  const done=fulfil(r,false);await provider.finish(r,P.type==='consumable');return {ok:done};},
 async restore(){const rs=await provider.restore();let n=0;for(const r of rs)if(await provider.verify(r))n+=fulfil(r,true)?1:0;return n;},
 providers:{none:NullProvider,dev:DevProvider},
};
})();
