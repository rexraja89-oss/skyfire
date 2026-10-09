'use strict';
// ================= SAVE =================
// localStorage key stays 'skyfire-rex-v1'. Shape version 3. Older saves are migrated, never wiped.
// A copy of the last good save is kept under KEY+'-bak' and used automatically if the main save is damaged.
const KEY='skyfire-rex-v1',BAK=KEY+'-bak';
function fresh(){return{ver:3,gears:0,god:false,sfx:true,music:true,voice:true,vib:true,hq:true,focus:true,mode:'easy',
 prog:{easy:1,hard:0,extreme:0},medals:{easy:{},hard:{},extreme:{}},best:{easy:{},hard:{},extreme:{}},
 own:{falcon:1,vulcan:1},plane:'falcon',weapon:'vulcan',drone:'',
 wl:{vulcan:0,spread:0,flamer:0,laser:0,plasma:0},dl:{gundrone:0,laserdrone:0,shielddrone:0},
 parts:{armor:0,engine:0,missile:0,magnet:0,bomb:0,regen:0},
 cores:0,ent:{},txn:{},sens:1,range:{best:0},obj:{easy:{},hard:{},extreme:{}},
 tiers:{easy:{},hard:{},extreme:{}},stats:{},ach:{},sortie:{day:'',list:[]},refund:0,dev:{}}}
function readJSON(k){try{const t=localStorage.getItem(k);if(!t)return null;const d=JSON.parse(t);return d&&typeof d==='object'?d:null;}catch(e){return null;}}
// v2 -> v3: refund old upgrade purchases as gears (new upgrade system, new prices), turn old medals into objectives
const OLD_COST=(base,l)=>Math.round(base*Math.pow(1.55,l));
const OLD_BASE={weapons:{vulcan:120,spread:160,flamer:220,laser:260,plasma:300},drones:{gundrone:250,laserdrone:300,shielddrone:320},parts:{armor:150,engine:180,missile:320,magnet:90,bomb:260}};
function migrate2to3(s){let refund=0;
 const take=(obj,bases)=>{for(const k in bases){const l=obj[k]|0;for(let i=0;i<l;i++)refund+=OLD_COST(bases[k],i);obj[k]=0;}};
 take(s.wl,OLD_BASE.weapons);take(s.dl,OLD_BASE.drones);take(s.parts,OLD_BASE.parts);
 s.gears=(+s.gears||0)+refund;s.refund=refund;
 for(const m of ['easy','hard','extreme'])for(const si in s.medals[m]||{}){const md=s.medals[m][si]||{},defs=(SF.STAGE_DEFS[si]||{}).obj;if(!defs)continue;
  const o=s.obj[m][si]=s.obj[m][si]||{};const list=defs[m]||[];
  if(md.untouched&&list.includes('noHit'))o.noHit=1;
  if(md.hunter){const k=list.find(x=>x.startsWith('killPct:'));if(k)o[k]=1;}
  if(md.clear){const done=list.filter(x=>o[x]).length;let t=0;SF.MEDAL_TIERS.forEach((T,i)=>{if(done>=T.objectives)t=i;});s.tiers[m][si]=Math.max(s.tiers[m][si]??-1,t);}}
 s.ver=3;return s;}
function load(){const raw=localStorage.getItem?(()=>{try{return localStorage.getItem(KEY);}catch(e){return null;}})():null;
 let d=readJSON(KEY);const mainOK=!!d;if(!d&&raw){d=readJSON(BAK);}       // main save damaged: fall back to the backup
 const s=fresh();if(!d)return s;
 try{if(mainOK)localStorage.setItem(BAK,raw);}catch(e){}       // keep the last good save before changing anything
 if(!d.ver){ // migrate v1 (6-stage version) without wiping
  s.gears=(+d.gears||0)+(((d.lv&&d.lv.wing)|0)*300);s.god=!!d.god;s.sfx=!d.mute;
  const lv=d.lv||{};s.wl.vulcan=Math.min(8,lv.cannon|0);s.parts.armor=Math.min(8,lv.shield|0);s.parts.magnet=Math.min(8,lv.magnet|0);s.parts.bomb=Math.min(8,lv.bomb|0);s.parts.missile=Math.min(8,lv.missile|0);
  s.prog.easy=clamp((d.unlocked|0)||1,1,STAGES.length);
  for(const k in d.medals||{})s.medals.easy[k]=d.medals[k];for(const k in d.best||{})s.best.easy[k]=d.best[k];
  for(let i=0;i<s.prog.easy-1;i++)s.own[STAGES[i].reward]=1;
  return migrate2to3(s);}
 for(const k in s){if(d[k]===undefined)continue;
  if(s[k]&&typeof s[k]==='object'&&!Array.isArray(s[k])){for(const j in d[k])s[k][j]=d[k][j];}else s[k]=d[k];}
 if((d.ver|0)<3)migrate2to3(s);
 return s;}
let save=load();
let storeT=0;
const store=()=>{try{localStorage.setItem(KEY,JSON.stringify(save));const n=Date.now();if(n-storeT>60000){storeT=n;localStorage.setItem(BAK,JSON.stringify(save));}}catch(e){}};
store();
