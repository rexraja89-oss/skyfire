'use strict';
// ================= UI =================
const SCREENS=['title','select','hangar','settings','pause','result'];
function show(name){SCREENS.forEach(s=>$(s).hidden=s!==name);$('hud').hidden=!(name==='play'||name==='pause');}
let lastShown=-1,lastChain=-1;
function updScore(force){if(!G)return;const v=Math.floor(G.shown),m=G.chain>=5?1+Math.min(7,Math.floor(G.chain/5)):0;
 if(force||v!==lastShown){lastShown=v;$('hudS').textContent=fmt(v);}if(force||m!==lastChain){lastChain=m;$('hudChain').textContent=m?'×'+m+' CHAIN':'';}}
function updHud(){if(!G)return;const f=G.p.hp/G.p.max;$('hp').style.width=(f*100)+'%';$('hp').classList.toggle('low',f<.3);$('hudG').textContent=fmt(G.earned);$('bombN').textContent=G.bombs;}
function updWeap(){$('weapName').textContent=WEAPONS[save.weapon].name+' · Lv '+save.wl[save.weapon];$('pwPips').innerHTML=[0,1].map(i=>`<i class="${i<G.p.pw?'on':''}"></i>`).join('');}
function finish(){const si=G.si,M=G.M,mk_=M.k,pct=G.spawned?G.killed/G.spawned:0,got=[],m=save.medals[mk_][si]||{};let bonus=0;const msgs=[];
 if(G.win){got.push('clear');if(G.hits===0)got.push('untouched');if(pct>=.85)got.push('hunter');
  if(si+1<STAGES.length&&save.prog[mk_]<si+2)save.prog[mk_]=si+2;
  if(si===STAGES.length-1){const i=MODES.indexOf(M);if(i<MODES.length-1&&!save.prog[MODES[i+1].k]){save.prog[MODES[i+1].k]=1;msgs.push(`${MODES[i+1].name} mode unlocked!`);}}}
 const freshM=got.filter(k=>!m[k]);freshM.forEach(k=>{m[k]=1;bonus+=Math.round(100*(si+1)*M.gear);});save.medals[mk_][si]=m;
 let reward=null;if(G.win){const r=STAGES[si].reward;if(!save.own[r]){save.own[r]=1;reward=r;}}
 const best=save.best[mk_][si]||0,nb=G.score>best;if(nb)save.best[mk_][si]=G.score;
 SF.wallet.grant('gears',Math.round(G.earned*(1+SF.ent.perk('gearBonus'))),'mission');SF.wallet.grant('gears',bonus,'medal');
 $('resTitle').textContent=G.win?'Mission complete':'Shot down';$('resTitle').style.color=G.win?'':'var(--danger)';
 $('resS').textContent=fmt(G.score)+(nb&&G.score>0?' · NEW BEST':' · best '+fmt(best));
 $('resG').textContent=fmt(G.earned)+(bonus?' + '+fmt(bonus)+' medal bonus':'');
 $('resK').textContent=Math.round(pct*100)+'%';
 $('resMedals').innerHTML=MEDALS.map(([k,l])=>`<div class="medal ${m[k]?'got':''} ${freshM.includes(k)?'new':''}">${m[k]?'★':'☆'} ${l}</div>`).join('');
 let rw='';if(reward)rw+=`<div class="reward"><img src="${preview(reward)}" alt=""><div><small>REWARD UNLOCKED</small><div style="font-size:17px;font-weight:700">${REWARD_NAME(reward)}</div><div class="hint" style="text-align:left">Equip it in the Hangar.</div></div></div>`;
 for(const t of msgs)rw+=`<div class="reward"><div class="orb"></div><div><small>NEW MODE</small><div style="font-size:17px;font-weight:700">${t}</div></div></div>`;$('resReward').innerHTML=rw;
 const next=G.win&&si+1<STAGES.length;$('resNext').textContent=next?'Next mission':'Fly again';$('resNext').onclick=()=>startRun(next?si+1:si,mk_);
 state='result';show('result');try{speechSynthesis.cancel();}catch(e){}if(reward&&save.voice)speak(`New hardware unlocked: ${REWARD_NAME(reward)}.`);
 musicStop();musicStart(45);}
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
 else{const icons={armor:'🛡',engine:'🔥',missile:'🚀',magnet:'🧲',bomb:'💣'};g.font='64px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(icons[k]||'⚙',0,4);}
 return PV[k]=c.toDataURL();}
function rewardStage(k){return STAGES.findIndex(s=>s.reward===k)+1;}
let hTab='planes';
function renderHangar(){$('bankH').textContent=fmt(SF.wallet.balance('gears'));$('coreH').textContent=fmt(SF.wallet.balance('cores'));$('hTabs').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.t===hTab));
 const pips=l=>`<div class="pips">${Array.from({length:MAXL},(_,i)=>`<i class="${i<l?'on':''}"></i>`).join('')}</div>`;
 const lockTxt=k=>`<div class="lock">🔒 Reward for clearing Mission ${rewardStage(k)}</div>`;
 let h='';
 if(hTab==='planes'){for(const k in PLANES){const p=PLANES[k],own=save.own[k],eq=save.plane===k;
  h+=`<div class="item ${eq?'eq':''}"><img src="${preview(k)}" alt=""><b>${p.name}</b><p>${p.desc}</p>
  <div class="bars"><span style="background:none;height:auto">Hull</span><span><i style="width:${p.hp/1.6}%"></i></span><span style="background:none;height:auto">Speed</span><span><i style="width:${p.spd*70}%"></i></span><span style="background:none;height:auto">Power</span><span><i style="width:${p.dmg*72}%"></i></span></div>
  <div class="acts">${own?`<button data-eqp="${k}" ${eq?'disabled':''}>${eq?'Equipped':'Equip'}</button>`:''}</div>${own?'':lockTxt(k)}</div>`;}}
 else if(hTab==='weapons'||hTab==='drones'){const D=hTab==='weapons'?WEAPONS:DRONES,lv=hTab==='weapons'?save.wl:save.dl,cur=hTab==='weapons'?save.weapon:save.drone;
  if(hTab==='drones')h+=`<div class="item ${!save.drone?'eq':''}" style="grid-template-columns:1fr auto"><div><b>No drones</b><p>Fly solo.</p></div><div class="acts" style="grid-column:2"><button data-eqd="" ${!save.drone?'disabled':''}>${!save.drone?'Selected':'Select'}</button></div></div>`;
  for(const k in D){const it=D[k],own=save.own[k],l=lv[k],eq=cur===k,c=cost(it.base,l),max=l>=MAXL;
   h+=`<div class="item ${eq?'eq':''}"><img src="${preview(k)}" alt=""><b>${it.name}</b><p>${it.desc}</p>${own?pips(l):lockTxt(k)}
   <div class="acts">${own?`<button data-${hTab==='weapons'?'eqw':'eqd'}="${k}" ${eq?'disabled':''}>${eq?'Equipped':'Equip'}</button><button data-up="${hTab}:${k}" ${max||!SF.wallet.canAfford({gears:c})?'disabled':''}>${max?'MAX':'<i class="cog s"></i> '+fmt(c)}</button>`:''}</div></div>`;}}
 else{for(const it of PARTS){const l=save.parts[it.k],c=cost(it.base,l),max=l>=MAXL;
  h+=`<div class="item"><img src="${preview(it.k)}" alt=""><b>${it.name}</b><p>${it.desc}</p>${pips(l)}<div class="acts"><button data-up="parts:${it.k}" ${max||!SF.wallet.canAfford({gears:c})?'disabled':''}>${max?'MAX':'<i class="cog s"></i> '+fmt(c)}</button></div></div>`;}}
 $('hList').innerHTML=h;
 $('hList').querySelectorAll('[data-eqp]').forEach(b=>b.onclick=()=>{save.plane=b.dataset.eqp;store();sfx('ui');showPlayerModel();renderHangar();});
 $('hList').querySelectorAll('[data-eqw]').forEach(b=>b.onclick=()=>{save.weapon=b.dataset.eqw;store();sfx('ui');renderHangar();});
 $('hList').querySelectorAll('[data-eqd]').forEach(b=>b.onclick=()=>{save.drone=b.dataset.eqd;store();sfx('ui');renderHangar();});
 $('hList').querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{const[t,k]=b.dataset.up.split(':');const obj=t==='weapons'?save.wl:t==='drones'?save.dl:save.parts;const base=(t==='weapons'?WEAPONS[k]:t==='drones'?DRONES[k]:PARTS.find(p=>p.k===k)).base,c=cost(base,obj[k]);
  if(obj[k]<MAXL&&SF.wallet.spend({gears:c},'upgrade:'+t+':'+k)){obj[k]++;store();sfx('power');renderHangar();}});}
function renderSelect(){const mk_=save.mode;
 $('modeTabs').innerHTML=MODES.map((m,i)=>{const open=save.prog[m.k]>0;return`<button data-m="${m.k}" class="${m.k===mk_?'on':''}" ${open?'':'disabled'}>${m.name}${open?'':`<span class="lk">🔒 Beat ${MODES[i-1].name}</span>`}</button>`;}).join('');
 $('modeTabs').querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{save.mode=b.dataset.m;store();sfx('ui');renderSelect();});
 const M=MODES.find(m=>m.k===mk_);$('modeHint').textContent={easy:'Learn the ropes. Clear all 10 missions to open Hard.',hard:'Tougher armour, faster bullets, double gears. Clear all 10 to open Extreme.',extreme:'Brutal. Triple score, 3.5× gears. Only for aces.'}[mk_];
 $('stageList').innerHTML=STAGES.map((s,i)=>{const lock=i>=save.prog[mk_],m=save.medals[mk_][i]||{},b=save.best[mk_][i],d=clamp(Math.round(1+i*.45+MODES.indexOf(M)*1.5),1,7);
  return`<button class="stagec" data-s="${i}" ${lock?'disabled':''}><span class="num">${lock?'🔒':i+1}</span><b>${s.name}</b><small>${s.place}</small><div class="meta"><span class="stars">${MEDALS.map(([k])=>`<span style="opacity:${m[k]?1:.25}">★</span>`).join('')}</span><span class="diff">${[1,2,3,4,5,6,7].map(j=>`<i class="${j<=d?'on':''}"></i>`).join('')}</span></div>${b?`<small>Best ${fmt(b)}</small>`:''}</button>`;}).join('');
 $('stageList').querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{sfx('ui');startRun(+b.dataset.s,mk_);});}
function renderSettings(){document.querySelectorAll('.tog[data-k]').forEach(b=>{const k=b.dataset.k,on=!!save[k];b.classList.toggle('on',on);b.textContent=k==='hq'?(on?'High':'Smooth'):(on?'On':'Off');});
 $('sensBtn').textContent='×'+(save.sens||1).toFixed(1);$('wGod').textContent='Invincible: '+(save.god?'on':'off');$('wGod').classList.toggle('on',save.god);$('verTxt').textContent='v'+VERSION+' (build '+BUILD+')';$('notes').innerHTML=NOTES.map(n=>'• '+n).join('<br>');}
document.querySelectorAll('.tog[data-k]').forEach(b=>b.onclick=()=>{const k=b.dataset.k;save[k]=!save[k];store();sfx('ui');renderSettings();
 if(k==='music'){if(save.music){audioOn();musicStart(state==='play'||state==='pause'?STAGES[G.si].key:45);}else musicStop();}
 if(k==='hq'){applyQuality();resize();}if(k==='voice'&&!save.voice)try{speechSynthesis.cancel();}catch(e){}});
function goTitle(){if(SF.R)SF.range.stop();state='title';clearRun();G=null;showPlayerModel();$('bankT').textContent=fmt(SF.wallet.balance('gears'));$('coreT').textContent=fmt(SF.wallet.balance('cores'));show('title');resetCopilot();WX.length=0;}
function go(name){sfx('ui');if(name==='title')return goTitle();state=name;if(name==='select')renderSelect();if(name==='hangar')renderHangar();if(name==='settings')renderSettings();show(name);}
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
$('goPlay').onclick=()=>{audioOn();go('select');};$('goRange').onclick=()=>{sfx('ui');SF.range.start();};$('goHangar').onclick=()=>{audioOn();go('hangar');};$('goSettings').onclick=()=>{audioOn();go('settings');};
$('hTabs').querySelectorAll('button').forEach(b=>b.onclick=()=>{hTab=b.dataset.t;sfx('ui');renderHangar();});
$('resHangar').onclick=()=>{clearRun();G=null;showPlayerModel();go('hangar');};$('resMenu').onclick=()=>{clearRun();G=null;showPlayerModel();go('select');};
$('wGears').onclick=()=>{SF.wallet.grant('gears',10000,'workshop');SF.wallet.grant('cores',100,'workshop');sfx('power');$('wGears').textContent='Added ✓';setTimeout(()=>$('wGears').textContent='+10k gears, +100 cores',900);};
$('wMax').onclick=()=>{for(const k in save.wl)save.wl[k]=MAXL;for(const k in save.dl)save.dl[k]=MAXL;for(const k in save.parts)save.parts[k]=MAXL;store();sfx('power');$('wMax').textContent='All maxed ✓';};
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
function pause(){if(state!=='play'&&state!=='range')return;pausedFrom=state;state='pause';$('quit').textContent=pausedFrom==='range'?'Leave Test Range':'Leave mission (keep gears)';renderSettings();show('pause');try{speechSynthesis.cancel();}catch(e){}}
$('pauseBtn').onclick=pause;
$('resume').onclick=()=>{state=pausedFrom||'play';pausedFrom='';show('play');last=performance.now();};
$('quit').onclick=()=>{if(pausedFrom==='range'){pausedFrom='';goTitle();return;}pausedFrom='';G.win=false;state='play';finish();};
$('bombBtn').addEventListener('pointerdown',e=>{e.stopPropagation();if(state==='range')SF.range.special();else bomb();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();if(AC)AC.suspend();}else if(AC)AC.resume();});

// ---------- sizing ----------
function applyQuality(){renderer.shadowMap.enabled=save.hq;sun.castShadow=save.hq;scene.traverse(o=>{if(o.material)o.material.needsUpdate=true;});}
function resize(){const vw=innerWidth,vh=innerHeight;let w=vw,h=vh;if(vw/vh>.62){w=Math.round(vh*.5625);}
 stageEl.style.width=w+'px';stageEl.style.height=h+'px';cssS=w/W;OW=W;OH=h/cssS;
 const dpr=Math.min(window.devicePixelRatio||1,save.hq?2:1.25);renderer.setPixelRatio(dpr);renderer.setSize(w,h,false);
 cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);oS=cssS*dpr;
 fitCamera(w/h);if(G){G.p.ty=clamp(G.p.ty,lyAt(.16),H-30);}}
addEventListener('resize',()=>resize());

// ---------- input ----------
let drag=null;
function gp(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*OW,y:(e.clientY-r.top)/r.height*OH};}
cv.addEventListener('pointerdown',e=>{audioOn();if(state!=='play'&&state!=='range')return;drag=gp(e);try{cv.setPointerCapture(e.pointerId);}catch(_){} });
cv.addEventListener('pointermove',e=>{if(!drag)return;if(state==='range'){const q=gp(e),R=SF.R;pj(R.p.x,R.p.y);const f=1/Math.max(.5,PS);SF.range.drag((q.x-drag.x)*f,(q.y-drag.y)*f);drag=q;return;}if(state!=='play')return;const q=gp(e);pj(G.p.x,G.p.y);const f=1.3*(save.sens||1)/Math.max(.5,PS);G.p.tx=clamp(G.p.tx+(q.x-drag.x)*f,16,W-16);G.p.ty=clamp(G.p.ty+(q.y-drag.y)*f*1.1,lyAt(.16),H-30);drag=q;});
const endDrag=()=>drag=null;cv.addEventListener('pointerup',endDrag);cv.addEventListener('pointercancel',endDrag);
addEventListener('keydown',e=>{audioOn();keys[e.key]=true;if(e.key===' '){e.preventDefault();if(state==='range')SF.range.special();else bomb();}if(e.key==='Escape')pause();});
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
