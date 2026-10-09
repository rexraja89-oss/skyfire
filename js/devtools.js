'use strict';
// ============ BALANCE LAB (Rex's Workshop) ============
// Debug tools for tuning on the phone: live balance multipliers (SF.BAL.mul), start a mission at its middle or
// at the boss, an FPS / sim-time / entity counter, and hitbox circles. Settings are kept in save.dev.
(()=>{
const Dv=SF.dev={fps:60,sim:0,frames:0,acc:0,simAcc:0};
const MUL={enemyHp:'Enemy HP',enemyDamage:'Enemy damage',enemyFire:'Enemy fire rate',bulletSpeed:'Enemy bullet speed',enemySpeed:'Enemy speed',
 spawn:'Spawn amount',weaponDamage:'Your damage',fireRate:'Your fire rate',dropRate:'Drop rate',score:'Score'};
const D=()=>{if(!save.dev||typeof save.dev!=='object')save.dev={};const d=save.dev;d.mul=d.mul||{};return d;};
Dv.apply=()=>{const d=D();for(const k in MUL)SF.BAL.mul[k]=clamp(+d.mul[k]||1,.2,3);};
Dv.apply();
// ---- timing (called from the main loop) ----
Dv.frame=(dt,simMs)=>{Dv.frames++;Dv.acc+=dt;Dv.simAcc+=simMs;if(Dv.acc>=.5){Dv.fps=Math.round(Dv.frames/Dv.acc);Dv.sim=Dv.simAcc/Dv.frames;Dv.frames=0;Dv.acc=0;Dv.simAcc=0;}};
// ---- mission start position ----
Dv.jump=(R,dir)=>{const j=D().jump;if(R.kind!=='stage'||!j)return;const tl=R.def.timeline,at=j==='boss'?R.def.len:R.def.len/2;
 while(dir.i<tl.length&&tl[dir.i].at<at)dir.i++;dir.clock=at;R.banner={t:j==='boss'?'JUMP TO BOSS':'JUMP TO MIDDLE',l:1.4,sub:'BALANCE LAB'};};
// ---- overlay ----
Dv.draw=(R,A)=>{const d=D();if(!d.stats&&!d.hit)return;
 if(d.hit){cx.lineWidth=1;
  for(const e of SF.enemies.list()){if(!e.alive)continue;const x=e.ox!==undefined?e.ox+(e.x-e.ox)*A:e.x,y=e.oy!==undefined?e.oy+(e.y-e.oy)*A:e.y;pj(x,y);
   cx.strokeStyle=e.invuln?'rgba(160,160,160,.8)':e.ground?'rgba(255,200,60,.85)':'rgba(255,80,80,.85)';cx.beginPath();cx.arc(PX,PY,e.r*PS,0,TAU);cx.stroke();}
  cx.strokeStyle='rgba(255,120,255,.9)';for(const b of SF.enemies.ebPool.live){pj(b.x,b.y);cx.beginPath();cx.arc(PX,PY,Math.max(1.5,(b.r||4)*PS),0,TAU);cx.stroke();}
  const p=R.p;if(p.alive){pj(p.x,p.y);cx.strokeStyle='rgba(80,255,140,.95)';cx.beginPath();cx.arc(PX,PY,SF.BAL.player.hitR*PS,0,TAU);cx.stroke();
   cx.strokeStyle='rgba(80,255,140,.35)';cx.beginPath();cx.arc(PX,PY,SF.BAL.player.pickupR*PS,0,TAU);cx.stroke();}}
 if(d.stats){const lines=[`${Dv.fps} fps · sim ${Dv.sim.toFixed(2)} ms`,`enemies ${SF.enemies.list().length} · bullets ${SF.enemies.ebPool.live.length}/${SF.weapons.pool.live.length}`,
   `particles ${SF.fx.parts.live.length} · t ${R.t.toFixed(0)} s`+(R.dir?` · ${R.dir.phase} ${R.dir.clock.toFixed(0)}/${R.def?R.def.len:0}`:'')];if(SF.terrain&&SF.terrain.path())lines.push(SF.terrain.path());
  cx.font='11px monospace';cx.textAlign='left';cx.textBaseline='top';const y0=OH-150;cx.fillStyle='rgba(0,0,0,.55)';cx.fillRect(6,y0-4,230,lines.length*14+8);
  cx.fillStyle='#9ff7c8';lines.forEach((l,i)=>cx.fillText(l,10,y0+i*14));}};
// ---- Workshop panel ----
Dv.renderLab=()=>{const el=$('lab');if(!el)return;const d=D();
 const row=k=>`<div class="labRow"><span>${MUL[k]}</span><button data-lm="${k}:-1">−</button><b>×${SF.BAL.mul[k].toFixed(1)}</b><button data-lm="${k}:1">+</button></div>`;
 const jl={'':'Start of mission',mid:'Middle of mission',boss:'Straight to boss'};
 el.innerHTML=`<details${d.open?' open':''} id="labD"><summary>Balance lab</summary>
  <div class="grid"><button class="tog${d.stats?' on':''}" data-lt="stats">FPS & counts: ${d.stats?'on':'off'}</button><button class="tog${d.hit?' on':''}" data-lt="hit">Hitboxes: ${d.hit?'on':'off'}</button></div>
  <button id="labJump">Missions start at: ${jl[d.jump||'']}</button>
  ${Object.keys(MUL).map(row).join('')}
  <button id="labReset">Reset balance to normal</button></details>`;
 $('labD').ontoggle=()=>{d.open=$('labD').open;store();};
 el.querySelectorAll('[data-lm]').forEach(b=>b.onclick=()=>{const[k,s]=b.dataset.lm.split(':');d.mul[k]=clamp(Math.round(((+d.mul[k]||1)+s*.1)*10)/10,.2,3);Dv.apply();store();sfx('ui');Dv.renderLab();});
 el.querySelectorAll('[data-lt]').forEach(b=>b.onclick=()=>{const k=b.dataset.lt;d[k]=!d[k];store();sfx('ui');Dv.renderLab();});
 $('labJump').onclick=()=>{const o=['','mid','boss'];d.jump=o[(o.indexOf(d.jump||'')+1)%3];store();sfx('ui');Dv.renderLab();};
 $('labReset').onclick=()=>{d.mul={};d.jump='';Dv.apply();store();sfx('ui');Dv.renderLab();};};
})();
