'use strict';
// ============ TEST RANGE (Checkpoint 2 preview of the new engine) ============
// Endless practice over the current scenery: cycles through every enemy type so the new controls,
// weapons, enemies and special can be tried on a phone. Gears here are practice only (not banked).
// The real stage director replaces this in Checkpoint 4.
(()=>{
let R=null;
const Rg=SF.range={get R(){return R;}};
Rg.timeScale=()=>R&&R.slow>0?SF.BAL.player.deathSlowScale:1;
function layout(w,group){const n=w.n,t=w.t,list=[];const x0=rnd(110,290);
 for(let i=0;i<n;i++){const d=i-(n-1)/2;let o={group};
  if(w.lay==='v')o={x:x0+d*30,y:-30-Math.abs(d)*26,x0:x0+d*30,group};
  else if(w.lay==='line')o={x:W/2+d*48,y:-30,x0:W/2+d*48,group};
  else if(w.lay==='left'||w.lay==='right'){const s=w.lay==='left'?-1:1;o={x:s<0?-20:W+20,y:lyAt(.06)+(t==='swift'?0:i*40),delay:i*.28,side:s,group};}
  else if(w.lay==='spread')o={x:(i+1)*W/(n+1)+rnd(-15,15),y:-30-i*30,x0:(i+1)*W/(n+1),group};
  else o={x:W/2,y:-40,x0:W/2,group};
  o.ph=i;list.push(o);}
 return list;}
function spawnWave(){const w=SF.RANGE_WAVES[R.wi%SF.RANGE_WAVES.length],g=SF.enemies.newGroup();R.wi++;
 for(const o of layout(w,g))SF.enemies.spawn(w.t,o);
 if(w.escort){const e=w.escort;for(const o of layout({t:e.t,n:e.n,lay:'v'},g)){o.y-=50;SF.enemies.spawn(e.t,o);}}
 R.waveT=0;R.banner={t:SF.ENEMIES[w.t].name.toUpperCase()+(w.n>1?' ×'+w.n:''),l:1.4,sub:'WAVE '+R.wi};}
Rg.start=()=>{audioOn();clearRun();G=null;
 SF.enemies.reset();SF.weapons.reset();SF.pickups.reset();SF.fx.reset();
 R=SF.R={t:0,slow:0,score:0,shown:0,gears:0,gp:0,kills:0,spawned:0,sinceCell:0,wi:0,waveT:0,gap:1.5,beams:[],banner:null,drone:save.own[save.drone]?save.drone:'',drones:[],p:null,hud:{}};
 SF.enemies.R=R;SF.player.create(R);
 if(R.drone)for(const s of[-1,1])R.drones.push({x:W/2+s*30,y:R.p.y+20,s,a:s<0?0:Math.PI,fc:rnd(0,.2),zap:0,zx:0,zy:0});
 showPlayerModel();for(const m of DRM)scene.remove(m);DRM.length=0;if(R.drone)for(let i=0;i<2;i++){const m=MODELS['dr_'+R.drone].clone();scene.add(m);DRM.push(m);}
 gz3=0;updTerrain(true);resetCopilot();
 $('bombBtn').classList.add('sp');$('bombL').textContent='SKYBURST';$('pwPips').classList.add('lv');
 state='range';show('play');musicStop();musicStart(STAGES[LV.si].key);
 say('range','Test Range. Every enemy type is coming through. Grab power cells to level up your gun, and tap Skyburst when it glows.',3,0);
 updHud(true);};
Rg.stop=()=>{SF.enemies.reset();SF.weapons.reset();SF.pickups.reset();SF.fx.reset();for(const m of DRM)scene.remove(m);DRM.length=0;
 if(R&&R.score>(save.range.best||0)){save.range.best=Math.floor(R.score);store();}R=SF.R=null;SF.enemies.R=null;
 $('bombBtn').classList.remove('sp','ready');$('bombL').textContent='BOMB';$('pwPips').classList.remove('lv');};
Rg.drag=(dx,dy)=>{if(R)SF.player.drag(R,dx,dy);};
Rg.special=()=>{if(R&&SF.player.special(R))updHud();};
// score + meter from kills
SF.on('kill',({e})=>{if(!R)return;R.kills++;const pts=Math.round(e.d.score*SF.BAL.mul.score);R.score+=pts;if(R.p)SF.player.addMeter(R,(e.d.charge||2)*SF.BAL.special.perKill/2);
 SF.fx.pop(e.x,e.y,fmt(pts),e.d.score>=600);SF.pickups.onKill(R,e);});
SF.on('captainDown',({e,bonus})=>{if(!R)return;R.score+=bonus;SF.fx.pop(e.x,e.y-36,'+'+fmt(bonus),true);});
SF.on('levelUp',({lvl})=>{if(!R)return;R.score+=SF.BAL.score.levelUpBonus;if(lvl===SF.BAL.weapon.maxLevel)say('maxlv','Weapon at maximum power!',1,20);else if(lvl===5)say('lv5','Weapon level five. Feel that?',1,60);});
SF.on('specialReady',()=>{if(R)sfx('ui');});
SF.on('playerDown',()=>{if(R)say('rdown','Down! Respawning. You keep most of your weapon power.',2,8);});
// ---------- step ----------
Rg.step=dt=>{if(!R)return;R.t+=dt;gz3+=C3.v*dt;
 SF.player.step(R,dt);SF.enemies.step(R,dt);SF.weapons.fire(R,dt);SF.weapons.step(R,dt);SF.pickups.step(R,dt);SF.fx.step(dt);
 R.gp=Math.max(0,R.gp-dt*4);
 // waves
 R.waveT+=dt;let alive=0;for(const e of SF.enemies.list())if(e.alive&&!e.d.noCount)alive++;
 if(R.t>1.2&&(alive<=1&&R.waveT>R.gap||R.waveT>14))spawnWave();
 if(R.banner){R.banner.l-=dt;if(R.banner.l<=0)R.banner=null;}
 stepWeather(dt);stepCopilot(dt);
 R.shown+=Math.max(1,(R.score-R.shown)*Math.min(1,dt*8));if(R.shown>R.score)R.shown=R.score;
 updHud();};
Rg.realTick=dt=>{if(R&&R.slow>0)R.slow-=dt;};
// ---------- HUD ----------
function updHud(force){const p=R.p,h=R.hud,f=p.hp/p.max;
 const set=(k,v,fn)=>{if(force||h[k]!==v){h[k]=v;fn(v);}};
 set('hp',Math.round(f*200),()=>{$('hp').style.width=(f*100)+'%';$('hp').classList.toggle('low',f<.3);});
 set('s',Math.floor(R.shown),v=>$('hudS').textContent=fmt(v));
 set('g',R.gears,v=>$('hudG').textContent=fmt(v));
 set('lv',p.lvl+':'+save.weapon,()=>{const L=SF.weapons.def().levels;$('weapName').textContent=SF.weapons.def().name+' · Lv '+p.lvl+'/'+L.length;
  $('pwPips').innerHTML=L.map((r,i)=>`<i class="${i<p.lvl?'on t'+r.tier:''}"></i>`).join('');});
 const S=SF.BAL.special,pc=p.charges>=S.maxCharges?100:Math.round(p.meter/S.meterMax*100);
 set('sp',p.charges+':'+pc,()=>{$('bombN').textContent=p.charges;$('bombBtn').style.setProperty('--c',pc+'%');$('bombBtn').classList.toggle('ready',p.charges>0);});
 set('ch','',()=>$('hudChain').textContent='');}
// ---------- render ----------
Rg.render=(dt,A,tnow)=>{if(!R)return;const p=R.p;syncEnv(dt,tnow);gameCam(SF.fx.shake);
 const px=p.ox+(p.x-p.ox)*A,py=p.oy+(p.y-p.oy)*A;
 if(PLM){const blink=p.inv>0&&p.alive&&Math.floor(R.t*20)%2===0&&!save.god;PLM.visible=(p.alive||p.dying>0)&&!blink;
  place(PLM,px,py,false,p.dying>0?-(SF.BAL.player.deathTime-p.dying)*2:0);PLM.rotation.set(-.08+(p.dying>0?(SF.BAL.player.deathTime-p.dying)*.6:0),p.dying>0?(SF.BAL.player.deathTime-p.dying)*5:0,-p.bank*.75);}
 R.drones.forEach((d,i)=>{const m=DRM[i];if(!m)return;m.visible=p.alive;place(m,d.x,d.y,false,.2);m.rotation.y+=dt*3;});
 SF.enemies.sync(A,dt);if(LV.boss)LV.boss.g.visible=false;
 renderer.render(scene,camera);updProj();
 // overlay
 cx.setTransform(oS,0,0,oS,0,0);cx.clearRect(0,0,OW,OH);drawWeather();
 if(SF.fx.shake>0)cx.translate(rnd(-4,4)*SF.fx.shake*1.6,rnd(-4,4)*SF.fx.shake*1.6);
 SF.fx.drawBack();SF.enemies.drawTele(R,A);SF.pickups.draw(R,A);
 // engine glow
 cx.globalCompositeOperation='lighter';
 if(p.alive&&PLM&&PLM.visible){const J=p.pl.jet,n=J.eng||1,f=.8+Math.sin(R.t*50)*.2+Math.min(.4,Math.max(0,-p.vy)/900);for(let i=0;i<n;i++){const ex=px+(n===1?0:(i-.5)*J.fw*1.2);pdg(ex,py+J.L/2+4,10*f,'#ff9d2e');pdg(ex,py+J.L/2+2,5,'#fff3c4');}}
 cx.globalCompositeOperation='source-over';
 SF.weapons.draw(R,A);SF.enemies.drawFlash(A);SF.fx.drawFront();SF.enemies.drawBullets(A);
 // Skyburst shockwave
 if(p.burst){const b=p.burst,a=1-b.t/SF.BAL.special.expandTime;pj(b.x,b.y);cx.globalCompositeOperation='lighter';cx.strokeStyle=`rgba(255,220,140,${.3+.6*a})`;cx.lineWidth=(6+10*a)*PS;cx.beginPath();cx.ellipse(PX,PY,b.r*PS,b.r*PS*.85,0,0,TAU);cx.stroke();
  cx.strokeStyle=`rgba(255,255,255,${.5*a})`;cx.lineWidth=2;cx.stroke();cx.globalCompositeOperation='source-over';}
 // real hitbox: always visible, brighter when bullets are close
 if(p.alive&&p.dying<=0){let near=0;for(const b of SF.enemies.ebPool.live){if((b.x-p.x)**2+(b.y-p.y)**2<3600){near=1;break;}}
  pj(px,py);const hr=SF.BAL.player.hitR*PS;cx.fillStyle='#ffffff';cx.beginPath();cx.arc(PX,PY,hr*.9,0,TAU);cx.fill();
  cx.strokeStyle=near?'rgba(255,90,110,.95)':'rgba(43,209,192,.6)';cx.lineWidth=near?2:1.4;cx.beginPath();cx.arc(PX,PY,hr+(near?3.5:2.5),0,TAU);cx.stroke();}
 if(save.god&&p.alive){pj(px,py);cx.strokeStyle='rgba(43,209,192,.45)';cx.lineWidth=2;cx.beginPath();cx.arc(PX,PY,32*PS,0,TAU);cx.stroke();}
 SF.fx.drawPops();
 cx.setTransform(oS,0,0,oS,0,0);
 const vg=cx.createRadialGradient(OW/2,OH/2,OH*.35,OW/2,OH/2,OH*.8);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,SF.fx.hurt>0?`rgba(200,0,30,${.25+SF.fx.hurt})`:'rgba(0,0,0,.35)');cx.fillStyle=vg;cx.fillRect(0,0,OW,OH);
 if(R.slow>0){cx.fillStyle='rgba(20,0,10,.18)';cx.fillRect(0,0,OW,OH);}
 if(SF.fx.flash>0){cx.fillStyle=`rgba(255,250,235,${Math.min(1,SF.fx.flash)})`;cx.fillRect(0,0,OW,OH);}
 if(R.banner){const b=R.banner,a=Math.min(1,b.l*3);cx.globalAlpha=a;cx.textAlign='center';cx.fillStyle='rgba(0,0,0,.45)';cx.fillRect(0,OH*.3-34,OW,b.sub?58:44);
  if(b.sub){cx.fillStyle='#ffb352';cx.font='600 12px "Chakra Petch", sans-serif';cx.fillText(b.sub,OW/2,OH*.3-16);}
  cx.fillStyle='#fff';cx.font='22px Bungee, Impact, sans-serif';cx.fillText(b.t,OW/2,OH*.3+(b.sub?12:-4));cx.globalAlpha=1;}};
})();
