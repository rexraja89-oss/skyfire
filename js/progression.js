'use strict';
// ============ PROGRESSION ============
// Upgrades (cost / value / buy), early unlocks with Cores, medal tiers, lifetime stats, achievements and daily
// sortie orders. Prices and rewards come from config/upgrades.js, config/achievements.js and economy.js.
// All spending goes through SF.wallet; nothing here knows about real money.
(()=>{
const U=()=>SF.UPGRADES;
const Pg=SF.prog={};
// ---------- upgrades ----------
// track kind: 'weapons' (save.wl) | 'drones' (save.dl) | 'parts' (save.parts)
const store_=kind=>kind==='weapons'?save.wl:kind==='drones'?save.dl:save.parts;
Pg.level=(kind,k)=>store_(kind)[k]|0;
Pg.base=(kind,k)=>(U()[kind][k]||{}).base||100;
Pg.cost=(kind,k,l=Pg.level(kind,k))=>{const u=U();if(l>=u.maxLevel)return null;
 let g=Pg.base(kind,k)*Math.pow(u.growth,l);if(l+1>=u.topLevelsFrom)g*=u.topLevelsMul;const c=l+1>=u.coresFrom?u.coreCost[l+1-u.coresFrom]||0:0;
 const disc=1-(save.cards&&save.cards.cheaper?.1:0);const o={gears:Math.round(g*disc/10)*10};if(c)o.cores=c;return o;};
Pg.value=(kind,k,l)=>{const u=U();const f=kind==='weapons'?u.weapons.value:(u[kind][k]||{}).value;return f?f(l):'';};
Pg.canBuy=(kind,k)=>{const c=Pg.cost(kind,k);return !!c&&SF.wallet.canAfford(c)&&(kind==='parts'||save.own[k]);};
Pg.buy=(kind,k)=>{const c=Pg.cost(kind,k);if(!c||!Pg.canBuy(kind,k))return false;if(!SF.wallet.spend(c,'upgrade:'+kind+':'+k))return false;store_(kind)[k]=Pg.level(kind,k)+1;
 Pg.stat('upgrades',1);if(kind==='weapons')Pg.statMax('maxWeapon',store_(kind)[k]);store();SF.emit('upgrade',{kind,k,l:store_(kind)[k]});Pg.checkAch();return true;};
Pg.unlockCost=k=>U().unlockCores[k]?{cores:U().unlockCores[k]}:null;
Pg.unlock=k=>{const c=Pg.unlockCost(k);if(!c||save.own[k]||!SF.wallet.spend(c,'unlock:'+k))return false;save.own[k]=1;store();Pg.checkAch();return true;};
// ---------- stats ----------
Pg.stat=(k,n)=>{save.stats[k]=(save.stats[k]||0)+n;};
Pg.statMax=(k,v)=>{if(v>(save.stats[k]||0))save.stats[k]=v;};
// live counters during a mission (Test Range does not count)
const inStage=()=>SF.R&&SF.R.kind==='stage';
SF.on('kill',({e})=>{if(!inStage())return;Pg.stat('kills',1);if(e.ground)Pg.stat('groundKills',1);Pg.sortieAdd(e.ground?['kills','groundKills']:['kills'],1);});
SF.on('formationClear',()=>{if(inStage()){Pg.stat('formations',1);Pg.sortieAdd(['formations'],1);}});
SF.on('setupClear',()=>{if(inStage()){Pg.stat('setups',1);Pg.sortieAdd(['setups'],1);}});
SF.on('pickup',({k})=>{if(!inStage())return;Pg.stat('pickups',1);if(k==='chip')Pg.stat('chips',1);Pg.sortieAdd(['pickups'],1);});
SF.on('special',()=>{if(inStage())Pg.stat('specials',1);});
SF.on('bossPart',()=>{if(inStage()){Pg.stat('bossParts',1);Pg.sortieAdd(['bossParts'],1);}});
SF.on('bossDown',({mini})=>{if(!inStage())return;if(mini)Pg.stat('minis',1);else{Pg.stat('bosses',1);Pg.sortieAdd(['bosses'],1);}});
// ---------- medal tiers ----------
Pg.tierFor=(cleared,objDone)=>{let t=-1;if(!cleared)return t;SF.MEDAL_TIERS.forEach((T,i)=>{if(objDone>=T.objectives)t=i;});return t;};
Pg.savedTier=(si,mode)=>{const v=(save.tiers[mode]||{})[si];return v===undefined?-1:v;};
// ---------- end of mission: stats, medal tier, achievements, sortie ----------
Pg.onRunEnd=(R,res)=>{const out={tier:-1,prevTier:Pg.savedTier(R.si,R.mode),tierGears:0,tierCores:0,ach:[],sortie:[]};
 Pg.stat('flights',1);Pg.statMax('bestCombo',R.combo.best);Pg.sortieMax('runCombo',R.combo.best);
 if(res.won){Pg.stat('wins',1);Pg.sortieAdd(['wins'],1);if(R.hits===0)Pg.stat('noHitWins',1);
  const done=SF.missions.count(R.si,R.mode),t=Pg.tierFor(true,done);out.tier=Math.max(t,out.prevTier);
  for(let i=out.prevTier+1;i<=t;i++){const T=SF.MEDAL_TIERS[i];out.tierGears+=Math.round(T.gears*R.reward);out.tierCores+=T.cores;}
  if(t>out.prevTier){save.tiers[R.mode][R.si]=t;SF.wallet.grant('gears',out.tierGears,'medal');if(out.tierCores)SF.wallet.grant('cores',out.tierCores,'medal');}}
 else out.tier=out.prevTier;
 // derived stats for achievements
 for(const m of ['easy','hard','extreme']){let n=0;for(let i=0;i<STAGES.length;i++)if(Pg.savedTier(i,m)>=0)n++;save.stats[m+'Clears']=n;}
 let sk=0;for(const m in save.tiers)for(const i in save.tiers[m])if(save.tiers[m][i]>=3)sk++;save.stats.skyfireMedals=sk;
 out.ach=Pg.checkAch();out.sortie=Pg.sortieClaim();store();return out;};
Pg.checkAch=()=>{save.stats.planes=Object.keys(PLANES).filter(k=>save.own[k]).length;const got=[];
 for(const A of SF.ACHIEVEMENTS){if(save.ach[A.id])continue;if((save.stats[A.stat]||0)>=A.goal){save.ach[A.id]=Date.now();got.push(A);if(A.cores)SF.wallet.grant('cores',A.cores,'achievement');if(A.gears)SF.wallet.grant('gears',A.gears,'achievement');SF.emit('achievement',{A});}}
 if(got.length)store();return got;};
// ---------- sortie orders (3 per day, date-seeded, offline) ----------
const today=()=>{const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();};
Pg.sortieRefresh=()=>{const day=today();if(save.sortie.day===day&&save.sortie.list.length)return save.sortie.list;
 let seed=0;for(const ch of day)seed=(seed*31+ch.charCodeAt(0))>>>0;const R=srng(seed),T=SF.SORTIE_TEMPLATES.slice(),list=[];
 while(list.length<3&&T.length){const i=Math.floor(R()*T.length),t=T.splice(i,1)[0],goal=t.goals[Math.floor(R()*t.goals.length)];list.push({id:t.id,goal,p:0,done:false,claimed:false});}
 save.sortie={day,list};store();return list;};
Pg.sortieAdd=(stats,n)=>{if(!save.sortie||!save.sortie.list)return;for(const s of save.sortie.list){const T=SF.SORTIE_TEMPLATES.find(t=>t.id===s.id);if(!T||s.done||T.max)continue;if(stats.includes(T.stat)){s.p=Math.min(s.goal,s.p+n);if(s.p>=s.goal)s.done=true;}}};
Pg.sortieMax=(stat,v)=>{if(!save.sortie||!save.sortie.list)return;for(const s of save.sortie.list){const T=SF.SORTIE_TEMPLATES.find(t=>t.id===s.id);if(T&&T.max&&T.stat===stat&&!s.done){s.p=Math.max(s.p,Math.min(s.goal,v));if(s.p>=s.goal)s.done=true;}}};
Pg.sortieClaim=()=>{const out=[];for(const s of save.sortie.list||[]){if(s.done&&!s.claimed){s.claimed=true;SF.wallet.grant('gears',SF.SORTIE_REWARD.gears,'sortie');SF.wallet.grant('cores',SF.SORTIE_REWARD.cores,'sortie');out.push(s);}}return out;};
Pg.sortieText=s=>{const T=SF.SORTIE_TEMPLATES.find(t=>t.id===s.id);return T?T.text(s.goal):s.id;};
})();
