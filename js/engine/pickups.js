'use strict';
// ============ PICKUPS (new engine, minimal for Checkpoint 2) ============
// Power cells (+1 weapon level, rubber-band odds), repair, special charge and gears.
// Checkpoint 3 extends this into the full data-driven pickup framework.
(()=>{
const pool=new SF.Pool(()=>({}),160);
const Pk=SF.pickups={pool};
const BP=()=>SF.BAL.pickup;
function drop(k,x,y,v){const q=pool.get();if(!q)return;q.k=k;q.x=q.ox=x;q.y=q.oy=y;q.vx=k==='gear'?rnd(-60,60):rnd(-20,20);q.vy=k==='gear'?rnd(-90,-20):-40;q.t=0;q.v=v||1;}
Pk.drop=drop;
Pk.reset=()=>pool.clear();
Pk.onKill=(R,e)=>{const d=e.d,b=BP(),mul=SF.BAL.mul.dropRate;
 for(let i=0;i<(d.gears||0);i++)drop('gear',e.x+rnd(-12,12),e.y+rnd(-12,12),1);
 if(d.noCount)return;R.sinceCell++;
 const lvl=R.p.lvl,ch=(b.cellChanceByLevel[lvl]||0)*mul;
 if(lvl<SF.BAL.weapon.maxLevel&&(R.sinceCell>=b.guaranteeEveryKills||Math.random()<ch*(d.size>1.4?2:1))){R.sinceCell=0;drop('cell',e.x,e.y);return;}
 const rep=Math.max(b.repairChance,(d.drops&&d.drops.repair)||0)*mul;if(Math.random()<rep){drop('repair',e.x,e.y);return;}
 if(Math.random()<b.chargeChance*mul)drop('charge',e.x,e.y);};
Pk.step=(R,dt)=>{const p=R.p,b=BP(),pl=p.pl,mag=b.magnetRange*(1+.35*save.parts.magnet)*(pl.mag||1),L=pool.live;
 for(let i=L.length-1;i>=0;i--){const g=L[i];g.ox=g.x;g.oy=g.y;g.t+=dt;const dx=p.x-g.x,dy=p.y-g.y,d=Math.hypot(dx,dy)||1;
  if(g.k==='gear'){if(p.alive&&d<mag){g.vx=dx/d*480;g.vy=dy/d*480;}else{g.vx*=.96;g.vy=g.vy*.96+320*dt;}}
  else{if(p.alive&&d<70){g.vx=dx/d*300;g.vy=dy/d*300;}else{g.vx=Math.sin(g.t*2)*30;g.vy=Math.min(b.fall,g.vy+60*dt);}}
  g.x+=g.vx*dt;g.y+=g.vy*dt;
  if(p.alive&&p.dying<=0&&d<SF.BAL.player.pickupR){collect(R,g);pool.kill(g);continue;}
  if(g.y>H+30)pool.kill(g);}};
function collect(R,g){const p=R.p;
 if(g.k==='gear'){R.gears+=g.v;R.score+=10;sfx('gear',Math.floor(R.gp));R.gp=Math.min(14,R.gp+1);return;}
 if(g.k==='cell'){if(SF.weapons.levelUp(R)){sfx('lvl');SF.fx.ring(p.x,p.y,40,SF.TIERS[SF.weapons.row(R).tier].glow,.45);SF.fx.glow(p.x,p.y,40,'#ffb347',.3);R.banner={t:'POWER UP · LV '+p.lvl,l:1.2};}
  else{sfx('power');R.score+=SF.BAL.pickup.cellBonusAtMax;SF.fx.pop(p.x,p.y-20,fmt(SF.BAL.pickup.cellBonusAtMax),true);}}
 else if(g.k==='repair'){sfx('power');SF.player.heal(R,BP().repairAmount);SF.fx.glow(p.x,p.y,30,'#3ddc84',.3);}
 else if(g.k==='charge'){sfx('power');SF.player.addMeter(R,BP().chargeAmount);SF.fx.glow(p.x,p.y,30,'#38c8ff',.3);}
 SF.emit('pickup',{k:g.k});}
Pk.draw=(R,A)=>{for(const g of pool.live){const x=g.ox+(g.x-g.ox)*A,y=g.oy+(g.y-g.oy)*A;
 if(g.k==='gear'){pspr(SP.gear,x,y,R.t*4);continue;}
 const img=g.k==='cell'?SP.P:g.k==='repair'?SP.Hp:SP.S,c=g.k==='cell'?'#ff9d2e':g.k==='repair'?'#3ddc84':'#38c8ff';
 cx.globalCompositeOperation='lighter';pdg(x,y,22+Math.sin(g.t*8)*3,c);cx.globalCompositeOperation='source-over';pspr(img,x,y,0,1+Math.sin(g.t*6)*.08);}};
})();
