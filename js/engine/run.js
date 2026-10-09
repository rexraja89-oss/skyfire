'use strict';
// ============ RUN (a flight in the new engine) ============
// kind 'stage': a campaign mission driven by the stage director (timeline, mini-boss, boss, objectives, rewards).
// kind 'range': endless Test Range practice (respawns, nothing banked).
(()=>{
let R=null;
const Rn=SF.run={get R(){return R;}};
Rn.timeScale=()=>R?Math.min(R.slow>0?SF.BAL.player.deathSlowScale:1,SF.feel.scale(R)):1;
Rn.start=(o={})=>{audioOn();if(typeof clearRun==='function')clearRun();
 const kind=o.kind||'stage',si=kind==='range'?1:o.si,mode=o.mode||save.mode||'easy';
 if(LV.si!==si){$('loading').hidden=false;show('none');setTimeout(()=>{buildLevel(si);$('loading').hidden=true;Rn.start(o);},40);return;}
 if(kind==='stage'){save.mode=mode;store();}
 SF.enemies.reset();SF.weapons.reset();SF.pickups.reset();SF.fx.reset();SF.formations.reset();SF.boss.reset();
 const MD=SF.DIFFICULTY[mode],row=kind==='range'?{hp:1,spd:1,bullet:1,fire:1,dmg:1,boss:1,extra:0,tele:1}:MD.rows[si];
 SF.BAL.run={enemyHp:row.hp,enemySpeed:row.spd,bulletSpeed:row.bullet,enemyFire:row.fire,enemyDamage:row.dmg,tele:row.tele};
 R=SF.R={kind,si,mode,diff:row,reward:kind==='range'?0:MD.reward,modeScore:kind==='range'?1:MD.score,st:STAGES[si],def:SF.STAGE_DEFS[si],respawn:kind==='range',
  t:0,slow:0,score:0,shown:0,gears:0,gp:0,kills:0,spawned:0,groundSpawned:0,groundKills:0,hits:0,specials:0,pickups:0,typeKills:{},formationsCleared:0,setupsCleared:0,
  sinceCell:0,beams:[],marks:[],eff:{},banner:null,toasts:[],zoom:1,camZ:1,bossCard:null,warnT:0,endT:-1,won:false,over:false,boss:null,bossTime:0,bossPartsTotal:0,bossPartsKilled:0,seen:{},
  drone:save.own[save.drone]?save.drone:'',drones:[],p:null,hud:{}};
 SF.enemies.R=R;SF.player.create(R);SF.scoring.reset(R);SF.feel.start(R);
 if(kind==='stage'){SF.director.start(R);SF.missions.start(R);}else SF.director.rangeStart(R);
 if(R.drone)for(const s of[-1,1])R.drones.push({x:W/2+s*30,y:R.p.y+20,s,a:s<0?0:Math.PI,fc:rnd(0,.2),zap:0,zx:0,zy:0});
 showPlayerModel();for(const m of DRM)scene.remove(m);DRM.length=0;if(R.drone)for(let i=0;i<2;i++){const m=MODELS['dr_'+R.drone].clone();scene.add(m);DRM.push(m);}
 gz3=0;updTerrain(true);resetCopilot();WX.length=0;SF.loadout.start(R);
 $('bombBtn').classList.add('sp');$('bombL').textContent='SKYBURST';$('pwPips').classList.add('lv');
 state='run';show('play');musicSet('combat',R.st.key);
 if(kind==='range')say('range','Test Range. Formations, ground targets and power-ups are all live. Chain your kills to build the combo.',3,0);
 else{say('brief',`${R.st.name}. ${R.st.brief}`,3,0);if(mode!=='easy')say('mode',`${MD===SF.DIFFICULTY.hard?'Hard':'Extreme'} mode. They have more of everything. Stay sharp.`,1,0);}
 updHud(true);};
Rn.stop=()=>{SF.loadout.stop();SF.enemies.reset();SF.weapons.reset();SF.pickups.reset();SF.fx.reset();SF.formations.reset();SF.boss.reset();$('combo').hidden=true;$('effRow').innerHTML='';for(const m of DRM)scene.remove(m);DRM.length=0;
 if(R&&R.kind==='range'&&R.score>(save.range.best||0)){save.range.best=Math.floor(R.score);store();}R=SF.R=null;SF.enemies.R=null;SF.BAL.run={};
 $('bombBtn').classList.remove('sp','ready');$('bombL').textContent='BOMB';$('pwPips').classList.remove('lv');};
Rn.drag=(dx,dy)=>{if(R)SF.player.drag(R,dx,dy);};
Rn.special=()=>{if(R&&!R.over&&SF.player.special(R))updHud();};
// ---------- events ----------
SF.on('spawn',({e})=>{if(!R)return;if(e.ground&&!e.d.noCount)R.groundSpawned++;
 const intro=SF.INTROS[e.type];if(intro&&!R.seen[e.type]){R.seen[e.type]=1;say('in_'+e.type,intro,2,999);}});
SF.on('kill',({e})=>{if(R)R.typeKills[e.type]=(R.typeKills[e.type]||0)+1;});
SF.on('formationClear',()=>{if(R)R.formationsCleared++;});
SF.on('setupClear',()=>{if(R)R.setupsCleared++;});
SF.on('pickup',()=>{if(R)R.pickups++;});
SF.on('bonus',()=>{if(!R)return;const el=$('hudS');el.classList.remove('pulse');void el.offsetWidth;el.classList.add('pulse');});
SF.on('levelUp',({lvl})=>{if(!R)return;if(lvl===SF.BAL.weapon.maxLevel)say('maxlv','Weapon at maximum power!',1,20);else if(lvl===5)say('lv5','Weapon level five. Feel that?',1,60);});
SF.on('specialReady',()=>{if(R)sfx('ui');});
SF.on('playerDown',()=>{if(!R)return;if(R.respawn)say('rdown','Down! Respawning. You keep most of your weapon power.',2,8);else say('down',"We're hit! Ejecting. I've got you, Rex.",3,0);});
SF.on('playerDead',()=>{if(R&&!R.respawn&&!R.over){R.over=true;R.won=false;R.endT=.6;}});
SF.on('bossDown',({B,mini})=>{if(!R)return;if(!mini){SF.scoring.bonus(R,B.D.score||25000,B.x,B.y,'BOSS');say('won','Target destroyed. Outstanding flying, Rex!',3,0);}else SF.scoring.bonus(R,5000*(R.si+1),B.x,B.y,'MINI-BOSS');});
SF.on('bossGone',({mini})=>{if(!R||mini)return;R.won=true;R.over=true;R.endT=3.2;sfx('win');R.banner={t:'MISSION COMPLETE',l:3,sub:R.st.name.toUpperCase()};});
// ---------- step ----------
Rn.step=dt=>{if(!R)return;R.t+=dt;gz3+=C3.v*dt;
 SF.player.step(R,dt);
 if(R.kind==='stage'){if(!R.over)SF.director.step(R,dt);}else SF.director.rangeStep(R,dt);
 SF.enemies.step(R,dt);SF.boss.step(R,dt);SF.boss.stepPending(R,dt);
 if(!R.over||R.won)SF.weapons.fire(R,dt);SF.loadout.step(R,dt);SF.weapons.step(R,dt);SF.pickups.step(R,dt);SF.fx.step(dt);
 R.gp=Math.max(0,R.gp-dt*4);SF.scoring.step(R,dt);SF.feel.step(R,dt);if(R.kind==='stage')SF.missions.step(R);
 if(R.warnT>0){R.warnT-=dt;R.camZ=1.1;}
 if(R.bossCard&&R.bossCard.l>0)R.bossCard.l-=dt;
 if(R.banner){R.banner.l-=dt;if(R.banner.l<=0)R.banner=null;}
 for(const t of R.toasts)t.l-=dt;prune(R.toasts,t=>t.l>0);
 if(R.over&&R.won)for(const g of SF.pickups.pool.live)if(g.k==='gear'){const dx=R.p.x-g.x,dy=R.p.y-g.y,d=Math.hypot(dx,dy)||1;g.vx=dx/d*520;g.vy=dy/d*520;}
 if(R.endT>=0){R.endT-=dt;if(R.endT<0){Rn.finish(R.won);return;}}
 stepWeather(dt);stepCopilot(dt);
 R.shown+=Math.max(1,(R.score-R.shown)*Math.min(1,dt*8));if(R.shown>R.score)R.shown=R.score;
 updHud();};
Rn.realTick=dt=>{if(!R)return;if(R.slow>0)R.slow-=dt;SF.feel.realTick(R,dt);};
// ---------- end of a stage: objectives, rewards, progression, results ----------
Rn.finish=(won,quit)=>{if(!R)return;if(R.kind==='range'){goTitle();return;}
 const si=R.si,mode=R.mode,E=SF.ECON,first=won&&save.prog[mode]<si+2;
 const objs=SF.missions.finish(R,won);
 let gears=Math.round(R.gears*R.reward*(1+SF.ent.perk('gearBonus'))),bonus=0,cores=0;const msgs=[];
 for(const o of objs)if(o.fresh)bonus+=Math.round((E.objectiveGears.base+E.objectiveGears.perStage*si)*R.reward);
 if(first)cores+=E.coreSources.firstClear;
 let reward=null;
 if(won){if(si+1<STAGES.length&&save.prog[mode]<si+2)save.prog[mode]=si+2;
  if(si===STAGES.length-1){const i=MODES.findIndex(m=>m.k===mode);if(i<MODES.length-1&&!save.prog[MODES[i+1].k]){save.prog[MODES[i+1].k]=1;msgs.push(`${MODES[i+1].name} mode unlocked!`);}}
  const r=STAGES[si].reward;if(!save.own[r]){save.own[r]=1;reward=r;}}
 const best=save.best[mode][si]||0,nb=R.score>best;if(nb)save.best[mode][si]=Math.floor(R.score);
 SF.wallet.grant('gears',gears,'mission');SF.wallet.grant('gears',bonus,'objectives');if(cores)SF.wallet.grant('cores',cores,'firstClear');store();
 const res={won,quit,score:Math.floor(R.score),best,nb,gears,bonus,cores,kills:R.kills,spawned:R.spawned,objs,reward,msgs,si,mode,combo:R.combo.best,time:R.t};
 res.prog=SF.prog.onRunEnd(R,res);
 Rn.lastResult=res;Rn.stop();state='result';showResults(res);try{speechSynthesis.cancel();}catch(e){}if(reward&&save.voice)speak(`New hardware unlocked: ${REWARD_NAME(reward)}.`);musicSet(res.won?'win':'calm',45);};
function showResults(r){$('resTitle').textContent=r.won?'Mission complete':r.quit?'Mission aborted':'Shot down';$('resTitle').style.color=r.won?'':'var(--danger)';
 $('resS').textContent=fmt(r.score)+(r.nb&&r.score>0?' · NEW BEST':' · best '+fmt(r.best));
 $('resG').textContent=fmt(r.gears)+(r.bonus?' + '+fmt(r.bonus)+' objectives':'')+(r.cores?` · +${r.cores} cores`:'');
 $('resK').textContent=(r.spawned?Math.round(r.kills/r.spawned*100):0)+'% · best combo '+r.combo;
 $('resMedals').innerHTML=r.objs.map((o,i)=>`<div class="medal ${o.done||o.had?'got':''} ${o.fresh?'new':''}" style="animation-delay:${.25+i*.18}s">${o.done||o.had?'★':'☆'} ${o.text}</div>`).join('');
 const tip=upgradeTip();$('resTip').innerHTML=tip?`<div class="tip"><span>You can afford <b>${tip.name} Lv ${tip.l+1}</b></span><button id="tipGo">Upgrade</button></div>`:'';if(tip)$('tipGo').onclick=()=>$('resHangar').onclick();
 {const el=$('resS'),tgt=r.score,suf=(r.nb&&r.score>0?' · NEW BEST':' · best '+fmt(r.best)),t0=performance.now();const tick=()=>{const f=Math.min(1,(performance.now()-t0)/900),v=Math.floor(tgt*(1-Math.pow(1-f,3)));el.textContent=fmt(v)+(f>=1?suf:'');if(f<1)sfx('count',Math.floor(f*12));if(f<1&&state==='result')requestAnimationFrame(tick);};tick();}
 let rw='';if(r.reward)rw+=`<div class="reward"><img src="${preview(r.reward)}" alt=""><div><small>REWARD UNLOCKED</small><div style="font-size:17px;font-weight:700">${REWARD_NAME(r.reward)}</div><div class="hint" style="text-align:left">Equip it in the Hangar.</div></div></div>`;
 for(const t of r.msgs)rw+=`<div class="reward"><div class="orb"></div><div><small>NEW MODE</small><div style="font-size:17px;font-weight:700">${t}</div></div></div>`;
 const P=r.prog||{};if(P.tier>=0){const T=SF.MEDAL_TIERS[P.tier],nw=P.tier>P.prevTier;rw=`<div class="tierbox" style="border-color:${T.color}"><small style="color:var(--dim);letter-spacing:.2em;font-weight:700">${nw?'NEW MEDAL':'MEDAL'}</small><b style="color:${T.color}">${T.name.toUpperCase()}</b>${nw&&(P.tierGears||P.tierCores)?`<small><i class="cog s"></i> ${fmt(P.tierGears)}${P.tierCores?` <i class="core s"></i> ${P.tierCores}`:''}</small>`:''}</div>`+rw;}
 for(const A of P.ach||[])rw+=`<div class="reward"><div class="orb"></div><div><small>ACHIEVEMENT</small><div style="font-size:16px;font-weight:700">${A.name}</div><div class="hint" style="text-align:left">${A.desc}${A.cores?` · +${A.cores} cores`:''}</div></div></div>`;
 for(const o of P.sortie||[])rw+=`<div class="reward"><div class="orb"></div><div><small>SORTIE ORDER COMPLETE</small><div style="font-size:15px;font-weight:700">${SF.prog.sortieText(o)}</div><div class="hint" style="text-align:left">+${fmt(SF.SORTIE_REWARD.gears)} gears · +${SF.SORTIE_REWARD.cores} core</div></div></div>`;
 $('resReward').innerHTML=rw;
 const next=r.won&&r.si+1<STAGES.length;$('resNext').textContent=next?'Next mission':'Try again';$('resRetry').hidden=!next;$('resNext').onclick=()=>{if(next)openBrief(r.si+1,r.mode);else Rn.start({kind:'stage',si:r.si,mode:r.mode});};
 show('result');}
// ---------- HUD ----------
function updHud(force){const p=R.p,h=R.hud,f=p.hp/p.max;
 const set=(k,v,fn)=>{if(force||h[k]!==v){h[k]=v;fn(v);}};
 set('hp',Math.round(f*200),()=>{$('hp').style.width=(f*100)+'%';$('hpTrail').style.width=(f*100)+'%';$('hp').classList.toggle('low',f<.3);});
 set('obj',R.objs?R.objs.map(o=>o.done?1:o.failed?2:0).join(''):'',v=>$('objRow').innerHTML=v.split('').map(c=>c==='1'?'<i class="ok">★</i>':c==='2'?'<i class="no">✕</i>':'<i>☆</i>').join(''));
 set('s',Math.floor(R.shown),v=>$('hudS').textContent=fmt(v));
 set('g',R.gears,v=>$('hudG').textContent=fmt(v));
 set('lv',p.lvl+':'+save.weapon,()=>{const L=SF.weapons.def().levels;$('weapName').textContent=SF.weapons.def().name+' · Lv '+p.lvl+'/'+L.length;
  $('pwPips').innerHTML=L.map((r,i)=>`<i class="${i<p.lvl?'on t'+r.tier:''}"></i>`).join('');});
 const S=SF.BAL.special,pc=p.charges>=S.maxCharges?100:Math.round(p.meter/S.meterMax*100);
 set('sp',p.charges+':'+pc,()=>{$('bombN').textContent=p.charges;$('bombBtn').style.setProperty('--c',pc+'%');$('bombBtn').classList.toggle('ready',p.charges>0);});
 set('ch','',()=>$('hudChain').textContent='');
 const c=R.combo,CF=SF.BAL.combo,mult=SF.scoring.mult(R);
 set('cv',c.n>=2,v=>$('combo').hidden=!v);
 if(c.n>=2){set('cn',c.n,v=>$('comboN').textContent=v+' COMBO');set('cm',mult,v=>{$('comboM').textContent='×'+(Math.round(v*10)/10);const el=$('combo');el.classList.remove('up');void el.offsetWidth;el.classList.add('up');});
  set('ct',Math.round(c.t/CF.window*40),v=>$('comboBar').style.width=(v*2.5)+'%');}
 const keys=Object.keys(R.eff).sort().join(',');
 set('ek',keys,()=>{$('effRow').innerHTML=Object.keys(R.eff).sort().map(k=>{const D=SF.PICKUPS[k];return `<div class="eff" style="--c:${D.color}"><img src="${SP['pk_'+k].toDataURL()}" alt=""><i id="eb_${k}"></i></div>`;}).join('');});
 for(const k in R.eff){const f2=R.eff[k],el=document.getElementById('eb_'+k);if(el)el.style.width=Math.max(0,f2.t/f2.max*100)+'%';}
 set('lvx',SF.weapons.level(R),()=>{const od=R.eff.overdrive;$('weapName').classList.toggle('od',!!od);if(od)$('weapName').textContent=SF.weapons.def().name+' · Lv '+Math.min(10,SF.weapons.level(R))+' OVERDRIVE';else h.lv=null;});}
Rn.updHud=()=>{if(R)updHud(true);};
// ---------- render ----------
Rn.render=(dt,A,tnow)=>{if(!R)return;const p=R.p;syncEnv(dt,tnow);R.zoom+=((R.camZ||1)-R.zoom)*Math.min(1,dt*1.5);gameCam(SF.fx.shake,R.zoom);
 const px=p.ox+(p.x-p.ox)*A,py=p.oy+(p.y-p.oy)*A;
 if(PLM){const blink=p.inv>0&&p.alive&&Math.floor(R.t*20)%2===0&&!save.god;PLM.visible=(p.alive||p.dying>0)&&!blink&&!p.dead;
  place(PLM,px,py,false,p.dying>0?-(SF.BAL.player.deathTime-p.dying)*2:0);PLM.rotation.set(-.08+(p.dying>0?(SF.BAL.player.deathTime-p.dying)*.6:0),p.dying>0?(SF.BAL.player.deathTime-p.dying)*5:0,-p.bank*.75);}
 SF.loadout.sync(R,A);
 R.drones.forEach((d,i)=>{const m=DRM[i];if(!m)return;m.visible=p.alive;place(m,d.x,d.y,false,.2);m.rotation.y+=dt*3;});
 SF.enemies.sync(A,dt);if(LV.boss&&!SF.boss.list.some(B=>B.legacy))LV.boss.g.visible=false;SF.boss.sync(A,dt);
 renderer.render(scene,camera);updProj();
 cx.setTransform(oS,0,0,oS,0,0);cx.clearRect(0,0,OW,OH);drawWeather();
 if(SF.fx.shake>0){const k=Math.min(1.2,SF.fx.shake)*SF.BAL.fx.shake*6,u=tnow*1;cx.translate((Math.sin(u*61)+.6*Math.sin(u*37.3))*k,(Math.cos(u*53)+.6*Math.sin(u*29.1))*k);}   // smooth shake (no random jitter)
 SF.fx.drawBack();SF.enemies.drawTele(R,A);SF.pickups.draw(R,A);
 cx.globalCompositeOperation='lighter';
 if(p.alive&&PLM&&PLM.visible&&p.dying<=0)SF.thrust.draw(R,px,py);
 SF.loadout.drawThrust(R,A);
 cx.globalCompositeOperation='source-over';
 SF.boss.draw(R,A);SF.weapons.draw(R,A);SF.enemies.drawFlash(A);SF.fx.drawFront();SF.enemies.drawBullets(A);
 if(p.burst){const b=p.burst,a=1-b.t/SF.BAL.special.expandTime;pj(b.x,b.y);cx.globalCompositeOperation='lighter';cx.strokeStyle=`rgba(255,220,140,${.3+.6*a})`;cx.lineWidth=(6+10*a)*PS;cx.beginPath();cx.ellipse(PX,PY,b.r*PS,b.r*PS*.85,0,0,TAU);cx.stroke();
  cx.strokeStyle=`rgba(255,255,255,${.5*a})`;cx.lineWidth=2;cx.stroke();cx.globalCompositeOperation='source-over';}
 if(p.alive&&p.dying<=0){let near=0;for(const b of SF.enemies.ebPool.live){if((b.x-p.x)**2+(b.y-p.y)**2<3600){near=1;break;}}
  pj(px,py);const hr=SF.BAL.player.hitR*PS;cx.fillStyle='rgba(255,255,255,.6)';cx.beginPath();cx.arc(PX,PY,hr*.7,0,TAU);cx.fill();
  cx.strokeStyle=near?'rgba(255,90,110,.95)':'rgba(43,209,192,.6)';cx.lineWidth=near?2:1.4;cx.beginPath();cx.arc(PX,PY,hr+(near?3.5:2.5),0,TAU);cx.stroke();}
 SF.loadout.drawShield(R,px,py);
 if(save.god&&p.alive){pj(px,py);cx.strokeStyle='rgba(43,209,192,.45)';cx.lineWidth=2;cx.beginPath();cx.arc(PX,PY,32*PS,0,TAU);cx.stroke();}
 SF.fx.drawPops();SF.feel.draw(R,px,py);SF.dev.draw(R,A);
 cx.setTransform(oS,0,0,oS,0,0);
 const vg=cx.createRadialGradient(OW/2,OH/2,OH*.35,OW/2,OH/2,OH*.8);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,SF.fx.hurt>0?`rgba(200,0,30,${.25+SF.fx.hurt})`:'rgba(0,0,0,.35)');cx.fillStyle=vg;cx.fillRect(0,0,OW,OH);
 if(R.slow>0){cx.fillStyle='rgba(20,0,10,.18)';cx.fillRect(0,0,OW,OH);}
 if(SF.fx.flash>0){cx.fillStyle=`rgba(255,250,235,${Math.min(1,SF.fx.flash)})`;cx.fillRect(0,0,OW,OH);}
 SF.boss.drawBar(R);SF.boss.drawCard(R);
 if(R.kind==='stage'&&R.t<3.2){cx.globalAlpha=Math.min(1,(3.2-R.t)*1.5);cx.textAlign='center';cx.fillStyle='rgba(0,0,0,.5)';cx.fillRect(0,OH*.4-50,OW,78);cx.fillStyle='#ffb352';cx.font='600 13px "Chakra Petch", sans-serif';cx.fillText(`MISSION ${R.si+1} · ${R.mode.toUpperCase()}`,OW/2,OH*.4-26);cx.fillStyle='#fff';cx.font='26px Bungee, Impact, sans-serif';cx.fillText(R.st.name.toUpperCase(),OW/2,OH*.4+6);cx.globalAlpha=1;}
 if(R.warnT>0){const a=.5+.5*Math.sin(R.warnT*12);cx.fillStyle=`rgba(255,40,70,${.12*a})`;cx.fillRect(0,0,OW,OH);cx.textAlign='center';cx.fillStyle=`rgba(255,77,109,${a})`;cx.font='30px Bungee, Impact, sans-serif';cx.fillText('WARNING',OW/2,OH*.42);cx.fillStyle='#fff';cx.font='600 14px "Chakra Petch", sans-serif';cx.fillText(R.st.boss.name.toUpperCase()+' APPROACHING',OW/2,OH*.42+26);}
 if(R.banner){const b=R.banner,a=Math.min(1,b.l*3);cx.globalAlpha=a;cx.textAlign='center';cx.fillStyle='rgba(0,0,0,.45)';cx.fillRect(0,OH*.3-34,OW,b.sub?58:44);
  if(b.sub){cx.fillStyle='#ffb352';cx.font='600 12px "Chakra Petch", sans-serif';cx.fillText(b.sub,OW/2,OH*.3-16);}
  cx.fillStyle='#fff';cx.font='22px Bungee, Impact, sans-serif';cx.fillText(b.t,OW/2,OH*.3+(b.sub?12:-4));cx.globalAlpha=1;}
 SF.feel.drawWord(R);
 R.toasts.forEach((t,i)=>{const a=Math.min(1,t.l*2,(2.6-t.l)*4);cx.globalAlpha=a;cx.textAlign='center';const y=OH*.2+i*30;cx.fillStyle='rgba(10,40,30,.8)';cx.fillRect(OW*.12,y-17,OW*.76,26);cx.strokeStyle='#3ddc84';cx.lineWidth=1;cx.strokeRect(OW*.12,y-17,OW*.76,26);
  cx.fillStyle='#3ddc84';cx.font='600 12px "Chakra Petch", sans-serif';cx.fillText('✓ OBJECTIVE · '+t.t.toUpperCase(),OW/2,y);cx.globalAlpha=1;});};
// Test Range compatibility
SF.range={start:()=>Rn.start({kind:'range'}),special:()=>Rn.special(),drag:(dx,dy)=>Rn.drag(dx,dy)};
})();
