'use strict';
// ============ PICKUPS (new engine) ============
// Data-driven from SF.PICKUPS + SF.DROPS. Power cells keep their rubber-band odds (SF.BAL.pickup);
// everything else rolls on the killer's drop table. Timed effects live in R.eff and show on the HUD.
(()=>{
const pool=new SF.Pool(()=>({}),160);
const Pk=SF.pickups={pool};
const BP=()=>SF.BAL.pickup;
function drop(k,x,y,v){const q=pool.get();if(!q)return null;q.k=k;q.x=q.ox=x;q.y=q.oy=y;q.vx=k==='gear'?rnd(-60,60):rnd(-30,30);q.vy=k==='gear'?rnd(-90,-20):-60;q.t=0;q.v=v||1;return q;}
Pk.drop=drop;
Pk.reset=()=>pool.clear();
function rollTable(name,x,y,force){const T=SF.DROPS[name];if(!T)return false;if(!force&&Math.random()>=T.chance*SF.BAL.mul.dropRate)return false;
 let tot=0;for(const k in T.items)tot+=T.items[k];let r=Math.random()*tot;for(const k in T.items){r-=T.items[k];if(r<=0){drop(k,x,y);return true;}}return false;}
Pk.rollTable=rollTable;
Pk.onKill=(R,e)=>{const d=e.d,b=BP(),mul=SF.BAL.mul.dropRate;
 const gv=R.kind==='stage'?1+SF.BAL.player.gearValueStage*R.si:1;for(let i=0;i<(d.gears||0);i++)drop('gear',e.x+rnd(-12,12),e.y+rnd(-12,12),gv);
 if(d.noCount)return;R.sinceCell++;
 if(Math.random()<SF.DROPS.chip.chance*mul){drop('chip',e.x,e.y);return;}
 const lvl=R.p.lvl,ch=(b.cellChanceByLevel[lvl]||0)*mul;
 if(lvl<SF.BAL.weapon.maxLevel&&(R.sinceCell>=b.guaranteeEveryKills||Math.random()<ch*(d.size>1.4?2:1))){R.sinceCell=0;drop('cell',e.x,e.y);return;}
 if(d.drops&&d.drops.repair&&Math.random()<d.drops.repair*mul){drop('repair',e.x,e.y);return;}
 rollTable(d.dropTable||'standard',e.x,e.y);};
Pk.step=(R,dt)=>{const p=R.p,b=BP(),pl=p.pl,mag=b.magnetRange*(1+.35*save.parts.magnet)*(pl.mag||1),L=pool.live;
 for(let i=L.length-1;i>=0;i--){const g=L[i];g.ox=g.x;g.oy=g.y;g.t+=dt;const dx=p.x-g.x,dy=p.y-g.y,d=Math.hypot(dx,dy)||1;
  if(g.k==='gear'){if(p.alive&&d<mag){g.vx=dx/d*480;g.vy=dy/d*480;}else{g.vx*=.96;g.vy=g.vy*.96+320*dt;}}
  else{if(p.alive&&d<70){g.vx=dx/d*320;g.vy=dy/d*320;}else{g.vx=Math.sin(g.t*2)*30;g.vy=Math.min(b.fall,g.vy+70*dt);}}
  g.x+=g.vx*dt;g.y+=g.vy*dt;
  if(p.alive&&p.dying<=0&&d<SF.BAL.player.pickupR){collect(R,g);pool.kill(g);continue;}
  if(g.y>H+30)pool.kill(g);}
 // timed effects
 for(const k in R.eff){const f=R.eff[k];f.t-=dt;if(f.t<=0||(k==='shield'&&f.hits<=0)){delete R.eff[k];SF.emit('effectEnd',{k});if(k==='overdrive')say('odEnd','Overdrive spent.',1,10);}}};
function collect(R,g){const p=R.p;
 if(g.k==='gear'){R.gears+=g.v;R.score+=10;sfx('gear',Math.floor(R.gp));R.gp=Math.min(14,R.gp+1);return;}
 const D=SF.PICKUPS[g.k];if(!D)return;sfx(D.sfx||'power');SF.fx.ring(p.x,p.y,36,D.color,.4);SF.fx.glow(p.x,p.y,34,D.color,.3);
 switch(D.effect){
  case 'levelUp':if(SF.weapons.levelUp(R)){SF.fx.ring(p.x,p.y,50,SF.TIERS[SF.weapons.row(R).tier].glow,.5);R.banner={t:'POWER UP · LV '+p.lvl,l:1.2};}
   else{R.score+=BP().cellBonusAtMax;SF.fx.pop(p.x,p.y-20,'+'+fmt(BP().cellBonusAtMax),true);}break;
  case 'overdrive':R.eff.overdrive={t:D.duration,max:D.duration};R.banner={t:'OVERDRIVE',l:1.1,sub:'+'+D.levels+' WEAPON LEVELS'};say('od','Overdrive! Unload everything.',1,12);break;
  case 'shield':R.eff.shield={t:D.duration,max:D.duration,hits:D.hits};SF.fx.pop(p.x,p.y-22,'SHIELD',true);break;
  case 'repair':SF.player.heal(R,D.amount);SF.fx.pop(p.x,p.y-22,'REPAIR',false);break;
  case 'charge':SF.player.addMeter(R,D.amount);SF.fx.pop(p.x,p.y-22,'CHARGE',false);break;
  case 'multiplier':R.eff.multiplier={t:D.duration,max:D.duration,mult:D.mult};SF.fx.pop(p.x,p.y-22,'SCORE ×'+D.mult,true);break;
  case 'gears':R.gears+=D.gears;R.score+=D.gears*10;SF.fx.pop(p.x,p.y-22,'+'+D.gears+' GEARS',true);for(let i=0;i<6;i++)SF.fx.spark(p.x,p.y,'#ffd27a',2);break;
  case 'chip':R.chips=(R.chips||0)+1;SF.fx.pop(p.x,p.y-22,'MEDAL CHIP',true);say('chip','A medal chip! Those are rare.',1,30);break;}
 SF.emit('pickup',{k:g.k});}
// ---------- drawing ----------
Pk.draw=(R,A)=>{for(const g of pool.live){const x=g.ox+(g.x-g.ox)*A,y=g.oy+(g.y-g.oy)*A;
 if(g.k==='gear'){pspr(SP.gear,x,y,R.t*4);continue;}
 const D=SF.PICKUPS[g.k],pop=Math.min(1,g.t*5),s=(.4+.6*pop)*(1+Math.sin(g.t*6)*.08);
 cx.globalCompositeOperation='lighter';pdg(x,y,(22+Math.sin(g.t*8)*3)*pop,D.color);if(g.t<.25)pdg(x,y,40*(1-g.t*4),'#ffffff');cx.globalCompositeOperation='source-over';
 pspr(SP['pk_'+g.k],x,y,0,s);}};
// pickup sprites: coloured capsule + a simple drawn icon (no fonts or emoji needed)
Pk.buildSprites=()=>{for(const k in SF.PICKUPS){const D=SF.PICKUPS[k];SP['pk_'+k]=mk(28,28,g=>{const gr=g.createRadialGradient(-3,-4,1,0,0,12);gr.addColorStop(0,'#fff');gr.addColorStop(.35,D.color);gr.addColorStop(1,shade(D.color,-.55));
 g.fillStyle=gr;g.beginPath();if(D.icon==='gem'){g.moveTo(0,-12);g.lineTo(11,0);g.lineTo(0,12);g.lineTo(-11,0);g.closePath();}else g.arc(0,0,12,0,TAU);g.fill();g.strokeStyle='rgba(255,255,255,.85)';g.lineWidth=1.5;g.stroke();
 g.fillStyle='#fff';g.strokeStyle='#fff';g.lineWidth=2.2;g.lineCap='round';
 if(D.icon==='bolt'){g.beginPath();g.moveTo(2,-8);g.lineTo(-4,1);g.lineTo(1,1);g.lineTo(-2,8);g.lineTo(5,-2);g.lineTo(0,-2);g.closePath();g.fill();}
 else if(D.icon==='ring'){g.beginPath();g.arc(0,0,6.5,0,TAU);g.stroke();g.beginPath();g.arc(0,0,2.5,0,TAU);g.fill();}
 else if(D.icon==='gear'){for(let i=0;i<8;i++){g.save();g.rotate(i/8*TAU);g.fillRect(-1.3,-8,2.6,3.5);g.restore();}g.beginPath();g.arc(0,0,5,0,TAU);g.fill();g.fillStyle=shade(D.color,-.5);g.beginPath();g.arc(0,0,2,0,TAU);g.fill();}
 else if(D.icon==='gem'){g.beginPath();g.moveTo(0,-5);g.lineTo(5,0);g.lineTo(0,5);g.lineTo(-5,0);g.closePath();g.fill();}
 else{g.font='bold '+(D.icon.length>1?11:14)+'px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText(D.icon==='x2'?'×2':D.icon,0,1);}});}};
})();
