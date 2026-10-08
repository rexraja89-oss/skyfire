'use strict';
// ================= SAVE =================
const KEY='skyfire-rex-v1';
function fresh(){return{ver:2,gears:0,god:false,sfx:true,music:true,voice:true,vib:true,hq:true,mode:'easy',
 prog:{easy:1,hard:0,extreme:0},medals:{easy:{},hard:{},extreme:{}},best:{easy:{},hard:{},extreme:{}},
 own:{falcon:1,vulcan:1},plane:'falcon',weapon:'vulcan',drone:'',
 wl:{vulcan:0,spread:0,flamer:0,laser:0,plasma:0},dl:{gundrone:0,laserdrone:0,shielddrone:0},
 parts:{armor:0,engine:0,missile:0,magnet:0,bomb:0},
 cores:0,ent:{},txn:{},sens:1,range:{best:0}};}
function load(){let d=null;try{d=JSON.parse(localStorage.getItem(KEY));}catch(e){}
 const s=fresh();if(!d||typeof d!=='object')return s;
 if(!d.ver){ // migrate v1 (6-stage version) without wiping
  s.gears=(+d.gears||0)+(((d.lv&&d.lv.wing)|0)*300);s.god=!!d.god;s.sfx=!d.mute;
  const lv=d.lv||{};s.wl.vulcan=Math.min(MAXL,lv.cannon|0);s.parts.armor=Math.min(MAXL,lv.shield|0);s.parts.magnet=Math.min(MAXL,lv.magnet|0);s.parts.bomb=Math.min(MAXL,lv.bomb|0);s.parts.missile=Math.min(MAXL,lv.missile|0);
  s.prog.easy=clamp((d.unlocked|0)||1,1,STAGES.length);
  for(const k in d.medals||{})s.medals.easy[k]=d.medals[k];for(const k in d.best||{})s.best.easy[k]=d.best[k];
  for(let i=0;i<s.prog.easy-1;i++)s.own[STAGES[i].reward]=1;
  return s;}
 for(const k in s){if(d[k]===undefined)continue;
  if(s[k]&&typeof s[k]==='object'){for(const j in d[k])s[k][j]=d[k][j];}else s[k]=d[k];}
 return s;}
let save=load();
const store=()=>{try{localStorage.setItem(KEY,JSON.stringify(save));}catch(e){}};
store();
