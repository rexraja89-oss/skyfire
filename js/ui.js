'use strict';
// ================= UI =================
const SCREENS=['title','select','hangar','settings','pause','result','records','brief'];
function show(name){SCREENS.forEach(s=>$(s).hidden=s!==name);$('hud').hidden=!(name==='play'||name==='pause');}
const PV={};
function preview(k){if(PV[k])return PV[k];const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.translate(64,64);
 if(PLANES[k]){const s=SP[k];const f=Math.min(110/s.width,110/s.height);g.drawImage(s,-s.width*f/2,-s.height*f/2,s.width*f,s.height*f);}
 else if(DRONES[k]){const s=SP[k];for(const d of[-28,28])g.drawImage(s,d-s.width*1.1/2,-s.height*1.1/2,s.width*1.1,s.height*1.1);}
 else if(WEAPONS[k]){g.globalCompositeOperation='lighter';const gl=(x,y,r,c)=>g.drawImage(glow(c),x-r,y-r,r*2,r*2);
  if(k==='vulcan')for(const x of[-14,0,14])for(let y=-40;y<40;y+=26)g.drawImage(SP.pv,x-6,y-16,12,32);
  if(k==='spread')for(let i=0;i<7;i++){const a=-Math.PI/2+(i/6-.5)*1.2;for(let d=20;d<60;d+=18)g.drawImage(SP.ps,Math.cos(a)*d-9,40+Math.sin(a)*d*1.4-9,18,18);}
  if(k==='flamer')for(let i=0;i<26;i++){const y=50-i*4,x=(Math.random()-.5)*i*1.2;gl(x,y,6+i*.7,i<6?'#fff3c4':i<14?'#ffb347':'#ff5a1a');}
  if(k==='laser'){const gr=g.createLinearGradient(-14,0,14,0);gr.addColorStop(0,'rgba(40,200,255,0)');gr.addColorStop(.5,'#fff');gr.addColorStop(1,'rgba(40,200,255,0)');g.fillStyle=gr;g.fillRect(-14,-60,28,120);}
  if(k==='plasma'){gl(0,-10,34,'#3c8cff');g.drawImage(SP.pp,-30,-40,60,60);gl(-26,30,14,'#9fe8ff');gl(26,30,14,'#9fe8ff');}}
 else{const icons={armor:'🛡',engine:'🔥',missile:'🚀',magnet:'🧲',bomb:'💥',regen:'🔧'};g.font='64px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(icons[k]||'⚙',0,4);}
 return PV[k]=c.toDataURL();}
function rewardStage(k){return STAGES.findIndex(s=>s.reward===k)+1;}
let hTab='planes',hFlash='';
const cogI='<i class="cog s"></i>',coreI='<i class="core s"></i>';
const costTxt=c=>c?`${cogI} ${fmt(c.gears)}${c.cores?` ${coreI} ${c.cores}`:''}`:'MAX';
const pips=l=>`<div class="pips lv10">${Array.from({length:SF.UPGRADES.maxLevel},(_,i)=>`<i class="${i<l?'on':''}"></i>`).join('')}</div>`;
function upCard(kind,k,name,desc,img,own,eqBtn){const l=SF.prog.level(kind,k),max=l>=SF.UPGRADES.maxLevel,c=SF.prog.cost(kind,k),can=own&&SF.prog.canBuy(kind,k);
 const lockLine=own?'':(()=>{const st=STAGES.findIndex(s=>s.reward===k),uc=SF.prog.unlockCost(k);return `<div class="lock">🔒 Mission ${st+1} reward${uc?` · or unlock now for ${coreI} ${uc.cores}`:''}</div>`;})();
 return `<div class="item up ${hFlash===kind+':'+k?'bought':''} ${eqBtn&&eqBtn.eq?'eq':''}">${img?`<img src="${img}" alt="">`:''}<b>${name}</b><p>${desc}</p>
  ${own?`${pips(l)}<p class="val"><span>Lv ${l}</span> ${SF.prog.value(kind,k,l)}${max?'':`<br><span class="nx">Lv ${l+1}</span> ${SF.prog.value(kind,k,l+1)}`}</p>`:lockLine}
  <div class="acts">${eqBtn&&own?`<button data-eq="${eqBtn.attr}:${k}" ${eqBtn.eq?'disabled':''}>${eqBtn.eq?'Equipped':'Equip'}</button>`:''}${own?`<button class="buy" data-up="${kind}:${k}" ${max||!can?'disabled':''}>${costTxt(c)}</button>`:(SF.prog.unlockCost(k)?`<button class="buy" data-unlock="${k}" ${SF.wallet.canAfford(SF.prog.unlockCost(k))?'':'disabled'}>${coreI} ${SF.prog.unlockCost(k).cores}</button>`:'')}</div></div>`;}
function renderHangar(){$('bankH').textContent=fmt(SF.wallet.balance('gears'));$('coreH').textContent=fmt(SF.wallet.balance('cores'));$('hTabs').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.t===hTab));
 let h='';
 if(hTab==='planes'){for(const k in PLANES){const p=PLANES[k],own=save.own[k],eq=save.plane===k,uc=SF.prog.unlockCost(k),st=STAGES.findIndex(s=>s.reward===k);
  h+=`<div class="item ${eq?'eq':''}"><img src="${preview(k)}" alt=""><b>${p.name}</b><p>${p.desc}</p>
  <div class="bars"><span style="background:none;height:auto">Hull</span><span><i style="width:${p.hp/1.6}%"></i></span><span style="background:none;height:auto">Speed</span><span><i style="width:${p.spd*70}%"></i></span><span style="background:none;height:auto">Power</span><span><i style="width:${p.dmg*72}%"></i></span></div>
  <div class="acts">${own?`<button data-eq="plane:${k}" ${eq?'disabled':''}>${eq?'Equipped':'Equip'}</button>`:uc?`<button class="buy" data-unlock="${k}" ${SF.wallet.canAfford(uc)?'':'disabled'}>${coreI} ${uc.cores}</button>`:''}</div>${own?'':`<div class="lock">🔒 Mission ${st+1} reward${uc?' · or unlock now with Cores':''}</div>`}</div>`;}}
 else if(hTab==='weapons'){for(const k in WEAPONS)h+=upCard('weapons',k,WEAPONS[k].name,WEAPONS[k].desc,preview(k),save.own[k],{attr:'weapon',eq:save.weapon===k});}
 else if(hTab==='drones'){h+=`<div class="item ${!save.drone?'eq':''}" style="grid-template-columns:1fr auto"><div><b>No drones</b><p>Fly solo.</p></div><div class="acts" style="grid-column:2"><button data-eq="drone:" ${!save.drone?'disabled':''}>${!save.drone?'Selected':'Select'}</button></div></div>`;
  for(const k in DRONES)h+=upCard('drones',k,DRONES[k].name,DRONES[k].desc,preview(k),save.own[k],{attr:'drone',eq:save.drone===k});}
 else{const P=SF.UPGRADES.parts;for(const k in P)h+=upCard('parts',k,P[k].name,P[k].desc,preview(k),true,null);}
 $('hList').innerHTML=h;hFlash='';
 $('hList').querySelectorAll('[data-eq]').forEach(b=>b.onclick=()=>{const[a,k]=b.dataset.eq.split(':');save[a]=k;store();sfx('ui');if(a==='plane')showPlayerModel();renderHangar();});
 $('hList').querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{const[kind,k]=b.dataset.up.split(':');if(SF.prog.buy(kind,k)){sfx('lvl');vib(30);hFlash=kind+':'+k;renderHangar();}});
 $('hList').querySelectorAll('[data-unlock]').forEach(b=>b.onclick=()=>{const k=b.dataset.unlock;if(SF.prog.unlock(k)){sfx('bonus');vib(40);renderHangar();}});}
function renderSelect(){const mk_=save.mode;
 $('modeTabs').innerHTML=MODES.map((m,i)=>{const open=save.prog[m.k]>0;return`<button data-m="${m.k}" class="${m.k===mk_?'on':''}" ${open?'':'disabled'}>${m.name}${open?'':`<span class="lk">🔒 Beat ${MODES[i-1].name}</span>`}</button>`;}).join('');
 $('modeTabs').querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{save.mode=b.dataset.m;store();sfx('ui');renderSelect();});
 const M=MODES.find(m=>m.k===mk_);$('modeHint').textContent={easy:'Learn the ropes. Clear all 10 missions to open Hard.',hard:'Tougher armour, faster bullets, double gears. Clear all 10 to open Extreme.',extreme:'Brutal. Triple score, 3.5× gears. Only for aces.'}[mk_];
 SF.prog.sortieRefresh();$('sortie').innerHTML='<h3>Today\'s sortie orders</h3>'+save.sortie.list.map(o=>`<div class="sortie ${o.done?'done':''}"><span>${o.done?'✓':'◦'} ${SF.prog.sortieText(o)}</span><b>${o.done?'Done':Math.floor(o.p)+'/'+o.goal}</b></div>`).join('')+`<p class="hint" style="text-align:left">Each order pays <i class="cog s"></i> ${fmt(SF.SORTIE_REWARD.gears)} and <i class="core s"></i> ${SF.SORTIE_REWARD.cores}. New orders every day.</p>`;
 $('stageList').innerHTML=STAGES.map((s,i)=>{const lock=i>=save.prog[mk_],objs=SF.missions.forStage(i,mk_),got=SF.missions.saved(i,mk_),b=save.best[mk_][i],t=SF.prog.savedTier(i,mk_),T=SF.MEDAL_TIERS[t];
  return`<button class="stagec" data-s="${i}" ${lock?'disabled':''}><span class="num">${lock?'🔒':i+1}</span><b>${s.name}</b><small>${s.place}</small><div class="meta"><span class="stars">${objs.map(o=>`<span style="opacity:${got[o.id]?1:.25}">★</span>`).join('')}</span>${T?`<span class="tier" style="color:${T.color}">${T.name.toUpperCase()}</span>`:''}</div>${b?`<small>Best ${fmt(b)}</small>`:''}</button>`;}).join('');
 $('stageList').querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{sfx('ui');openBrief(+b.dataset.s,mk_);});}
function renderSettings(){document.querySelectorAll('.tog[data-k]').forEach(b=>{const k=b.dataset.k,on=!!save[k];b.classList.toggle('on',on);b.textContent=k==='hq'?(on?'High':'Smooth'):(on?'On':'Off');});
 $('sensBtn').textContent='×'+(save.sens||1).toFixed(1);$('wGod').textContent='Invincible: '+(save.god?'on':'off');$('wGod').classList.toggle('on',save.god);$('verTxt').textContent='v'+VERSION+' (build '+BUILD+')';$('notes').innerHTML=NOTES.map(n=>'• '+n).join('<br>');if(SF.dev)SF.dev.renderLab();}
document.querySelectorAll('.tog[data-k]').forEach(b=>b.onclick=()=>{const k=b.dataset.k;save[k]=!save[k];store();sfx('ui');renderSettings();
 if(k==='music'){if(save.music){audioOn();musicStart(SF.R?STAGES[SF.R.si].key:45,state==='run'?'combat':'calm');}else musicStop();}
 if(k==='hq'){applyQuality();resize();}if(k==='voice'&&!save.voice)try{speechSynthesis.cancel();}catch(e){}});
function goTitle(){if(SF.R)SF.run.stop();state='title';clearRun();showPlayerModel();$('bankT').textContent=fmt(SF.wallet.balance('gears'));$('coreT').textContent=fmt(SF.wallet.balance('cores'));show('title');resetCopilot();musicSet('calm',45);WX.length=0;}
function go(name){sfx('ui');if(name==='title')return goTitle();state=name;if(name==='select')renderSelect();if(name==='hangar')renderHangar();if(name==='settings')renderSettings();if(name==='records')renderRecords();show(name);}
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
$('goPlay').onclick=()=>{audioOn();go('select');};$('goRecords').onclick=()=>{audioOn();go('records');};$('goRange').onclick=()=>{sfx('ui');SF.range.start();};$('goHangar').onclick=()=>{audioOn();go('hangar');};$('goSettings').onclick=()=>{audioOn();go('settings');};
$('hTabs').querySelectorAll('button').forEach(b=>b.onclick=()=>{hTab=b.dataset.t;sfx('ui');renderHangar();});
$('resHangar').onclick=()=>{clearRun();showPlayerModel();const r=SF.run.lastResult;if(r)briefAt={si:r.won&&r.si+1<STAGES.length?r.si+1:r.si,mode:r.mode};hangarReturn=r?'brief':'';go('hangar');};$('resMenu').onclick=()=>{clearRun();showPlayerModel();go('select');};
$('resRetry').onclick=()=>{const r=SF.run.lastResult;if(r)startRun(r.si,r.mode);};
$('hBack').onclick=()=>{if(hangarReturn==='brief'&&briefAt){hangarReturn='';openBrief(briefAt.si,briefAt.mode);}else go('title');};
$('wGears').onclick=()=>{SF.wallet.grant('gears',10000,'workshop');SF.wallet.grant('cores',100,'workshop');sfx('power');$('wGears').textContent='Added ✓';setTimeout(()=>$('wGears').textContent='+10k gears, +100 cores',900);};
$('wMax').onclick=()=>{for(const k in save.wl)save.wl[k]=MAXL;for(const k in save.dl)save.dl[k]=MAXL;for(const k in SF.UPGRADES.parts)save.parts[k]=MAXL;store();sfx('power');$('wMax').textContent='All maxed ✓';};
$('wUnlock').onclick=()=>{for(const m of MODES)save.prog[m.k]=STAGES.length;for(const s of STAGES)save.own[s.reward]=1;store();sfx('power');$('wUnlock').textContent='Everything open ✓';};
$('wGod').onclick=()=>{save.god=!save.god;store();renderSettings();};
// save code backup / restore (moves progress between the app and the browser, or survives a reinstall)
const flashBtn=(id,t,orig)=>{$(id).textContent=t;setTimeout(()=>$(id).textContent=orig,1600);};
$('saveOut').onclick=()=>{const code='SKY1:'+btoa(unescape(encodeURIComponent(JSON.stringify(save))));
 const manual=()=>{try{window.prompt('Copy this save code and keep it somewhere safe:',code);}catch(e){}};
 try{navigator.clipboard.writeText(code).then(()=>flashBtn('saveOut','Copied ✓','Back up'),manual);}catch(e){manual();}};
$('saveIn').onclick=()=>{let t=null;try{t=window.prompt('Paste your save code:');}catch(e){}if(!t)return;t=t.trim();
 try{if(!t.startsWith('SKY1:'))throw 0;const d=JSON.parse(decodeURIComponent(escape(atob(t.slice(5)))));if(!d||typeof d!=='object'||!d.prog)throw 0;
  localStorage.setItem(KEY,JSON.stringify(d));save=load();store();renderSettings();flashBtn('saveIn','Restored ✓','Restore');}
 catch(e){flashBtn('saveIn','Invalid code','Restore');}};
let resetArm=0;$('wReset').onclick=()=>{if(!resetArm){resetArm=1;$('wReset').textContent='Tap again to wipe everything';setTimeout(()=>{resetArm=0;$('wReset').textContent='Reset all progress';},3000);return;}
 save=fresh();store();resetArm=0;$('wReset').textContent='Reset all progress';renderSettings();};
function pause(){if(state!=='run')return;pausedFrom=state;state='pause';renderPauseObj();$('quit').textContent=SF.R&&SF.R.kind==='range'?'Leave Test Range':'Leave mission (keep gears)';renderSettings();show('pause');try{speechSynthesis.cancel();}catch(e){}}
$('pauseBtn').onclick=pause;
$('resume').onclick=()=>{state=pausedFrom||'run';pausedFrom='';show('play');last=performance.now();};
$('quit').onclick=()=>{pausedFrom='';if(SF.R&&SF.R.kind==='range'){goTitle();return;}state='run';SF.run.finish(false,true);};
$('bombBtn').addEventListener('pointerdown',e=>{e.stopPropagation();if(state==='run')SF.run.special();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();if(AC)AC.suspend();}else if(AC)AC.resume();});

// ---------- sizing ----------
function applyQuality(){renderer.shadowMap.enabled=save.hq;sun.castShadow=save.hq;scene.traverse(o=>{if(o.material)o.material.needsUpdate=true;});}
function resize(){const vw=innerWidth,vh=innerHeight;let w=vw,h=vh;if(vw/vh>.62){w=Math.round(vh*.5625);}
 stageEl.style.width=w+'px';stageEl.style.height=h+'px';cssS=w/W;OW=W;OH=h/cssS;
 const dpr=Math.min(window.devicePixelRatio||1,save.hq?2:1.25);renderer.setPixelRatio(dpr);renderer.setSize(w,h,false);
 cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);oS=cssS*dpr;
 fitCamera(w/h);if(SF.R&&SF.R.p)SF.player.clampTarget(SF.R.p);}
addEventListener('resize',()=>resize());

// ---------- input ----------
let drag=null;
function gp(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*OW,y:(e.clientY-r.top)/r.height*OH};}
cv.addEventListener('pointerdown',e=>{audioOn();if(state!=='run')return;drag=gp(e);try{cv.setPointerCapture(e.pointerId);}catch(_){} });
cv.addEventListener('pointermove',e=>{if(!drag)return;if(state==='run'){const q=gp(e),R=SF.R;pj(R.p.x,R.p.y);const f=1/Math.max(.5,PS);SF.run.drag((q.x-drag.x)*f,(q.y-drag.y)*f);drag=q;return;}});
const endDrag=()=>drag=null;cv.addEventListener('pointerup',endDrag);cv.addEventListener('pointercancel',endDrag);
addEventListener('keydown',e=>{audioOn();keys[e.key]=true;if(e.key===' '){e.preventDefault();if(state==='run')SF.run.special();}if(e.key==='Escape')pause();});
addEventListener('keyup',e=>keys[e.key]=false);

// ---------- app install & updates ----------
let deferredPrompt=null;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('installBtn').hidden=false;});
$('installBtn').onclick=async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();try{await deferredPrompt.userChoice;}catch(e){}deferredPrompt=null;$('installBtn').hidden=true;};
addEventListener('appinstalled',()=>{$('installBtn').hidden=true;});
if(!IN_APP&&/Android/i.test(navigator.userAgent))$('apkLink').hidden=false;
if(!IN_APP&&'serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{});
function checkUpdate(){const url=(IN_APP||location.protocol==='file:'?PAGES:'')+'version.json?t='+Date.now();
 fetch(url,{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{if(!j||!(j.build>BUILD))return;
  $('updText').textContent=`Version ${j.version} is ready: ${(j.notes||[])[0]||'new content'}.`;$('updBanner').hidden=false;
  $('updBtn').textContent=IN_APP?'Download':'Update';$('updBtn').onclick=()=>{if(IN_APP)window.open(j.apk||$('apkLink').href,'_system');else location.reload();};}).catch(()=>{});}

$('sensBtn').onclick=()=>{const L=[.8,1,1.2,1.5],i=L.indexOf(save.sens||1);save.sens=L[(i+1)%L.length];store();sfx('ui');renderSettings();};

// ---------- records: stats + achievements ----------
function renderRecords(){const S=save.stats,got=Object.keys(save.ach).length;
 const rows=[['Missions flown',S.flights],['Missions cleared',S.wins],['Enemies destroyed',S.kills],['Ground targets',S.groundKills],['Formations wiped out',S.formations],['Ground sites destroyed',S.setups],['Bosses defeated',S.bosses],['Mini-bosses defeated',S.minis],['Boss components',S.bossParts],['Best combo',S.bestCombo],['Untouched clears',S.noHitWins],['Medal chips',S.chips]];
 $('recStats').innerHTML=rows.map(([l,v])=>`<div class="stat"><span>${l}</span><b>${fmt(v||0)}</b></div>`).join('');
 $('recAchT').textContent=`Achievements · ${got}/${SF.ACHIEVEMENTS.length}`;
 $('recAch').innerHTML=SF.ACHIEVEMENTS.map(A=>{const have=!!save.ach[A.id],p=Math.min(1,(S[A.stat]||0)/A.goal);return `<div class="ach ${have?'got':''}"><div><b>${A.name}</b><p>${A.desc}</p>${have?'':`<span class="bar"><i style="width:${p*100}%"></i></span>`}</div><small>${A.cores?`<i class="core s"></i> ${A.cores}`:''}${A.gears?` <i class="cog s"></i> ${fmt(A.gears)}`:''}</small></div>`;}).join('');}

// ---------- mission briefing + loadout ----------
let briefAt=null,hangarReturn='';
function objRows(list,R){return list.map(o=>{const st=o.state;return `<div class="obj ${st==='ok'?'ok':st==='no'?'no':''}"><i>${st==='ok'?'★':st==='no'?'✕':'☆'}</i><span>${o.text}</span>${o.prog?`<em>${o.prog}</em>`:''}</div>`;}).join('');}
function openBrief(si,mode){briefAt={si,mode};const st=STAGES[si],objs=SF.missions.forStage(si,mode),got=SF.missions.saved(si,mode),t=SF.prog.savedTier(si,mode),T=SF.MEDAL_TIERS[t],done=objs.filter(o=>got[o.id]).length;
 $('brName').textContent=`${si+1} · ${st.name}`;$('brSub').textContent=`${st.place.toUpperCase()} · ${MODES.find(m=>m.k===mode).name.toUpperCase()}`;$('brText').textContent=st.brief;
 const next=SF.MEDAL_TIERS.find((M,i)=>i>t&&(i>0||t<0));
 $('brTier').innerHTML=(T?`Medal: <b style="color:${T.color}">${T.name.toUpperCase()}</b>`:'No medal yet')+(next?` · Next: <b style="color:${next.color}">${next.name.toUpperCase()}</b> ${next.objectives>done?`(complete ${next.objectives-done} more objective${next.objectives-done>1?'s':''})`:'(clear the mission)'}`:' · Top medal earned');
 $('brObj').innerHTML=objRows(objs.map(o=>({text:o.T.text(o.v),state:got[o.id]?'ok':''})));
 const pl=PLANES[save.plane],wp=WEAPONS[save.weapon],dr=DRONES[save.drone];
 $('brLoad').innerHTML=`<div class="ld"><img src="${preview(save.plane)}" alt=""><b>${pl.name}</b><small>Jet</small></div><div class="ld"><img src="${preview(save.weapon)}" alt=""><b>${wp.name}</b><small>Hangar Lv ${save.wl[save.weapon]|0}</small></div><div class="ld">${dr?`<img src="${preview(save.drone)}" alt="">`:'<div style="height:56px;display:grid;place-items:center;color:var(--dim)">—</div>'}<b>${dr?dr.name:'No drones'}</b><small>${dr?'Hangar Lv '+(save.dl[save.drone]|0):'Support'}</small></div>`;
 $('brGo').onclick=()=>{sfx('ui');vib(15);startRun(si,mode);};$('brHangar').onclick=()=>{hangarReturn='brief';go('hangar');};
 state='brief';show('brief');}
// ---------- pause: live objective progress ----------
function renderPauseObj(){const R=SF.R;if(!R||R.kind!=='stage'||!R.objs){$('pauseObj').innerHTML='';return;}
 $('pauseObj').innerHTML=objRows(R.objs.map(o=>{const pr=o.T&&o.T.progress?Math.round(o.T.progress(R,o.v)*100)+'%':o.type==='combo'?`${R.combo.best}/${o.v}`:o.type==='score'?`${fmt(R.score)}`:'';return {text:o.T?o.T.text(o.v):o.id,state:o.done?'ok':o.failed?'no':'',prog:o.done||o.failed?'':pr};}));}
// ---------- results: what to improve next ----------
function upgradeTip(){const c=[];for(const k in SF.UPGRADES.parts)c.push(['parts',k,SF.UPGRADES.parts[k].name]);if(save.own[save.weapon])c.push(['weapons',save.weapon,WEAPONS[save.weapon].name]);if(save.drone&&save.own[save.drone])c.push(['drones',save.drone,DRONES[save.drone].name]);
 let best=null;for(const [kind,k,name] of c){const cost=SF.prog.cost(kind,k);if(cost&&SF.wallet.canAfford(cost)&&(!best||cost.gears<best.cost.gears))best={kind,k,name,cost,l:SF.prog.level(kind,k)};}
 return best;}
