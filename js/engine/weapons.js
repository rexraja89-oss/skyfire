'use strict';
// ============ WEAPONS (new engine) ============
// Reads level rows from SF.WEAPONS. In-run level 1-10 comes from power cells; the hangar level sets the
// starting level and a damage bonus. Projectiles are pooled; hits go through SF.enemies.hit().
(()=>{
const pool=new SF.Pool(()=>({}),400);
const Wp=SF.weapons={pool,
 def(){return SF.WEAPONS[save.weapon]||SF.WEAPONS.vulcan;},
 hangarLevel(){return save.wl[save.weapon]|0;},
 startLevel(){return clamp(1+Math.floor(Wp.hangarLevel()/SF.BAL.weapon.hangarStartPer),1,SF.BAL.weapon.maxLevel);},
 // effective level = power-cell level + overdrive bonus (capped at the table length)
 level(R){const od=R.eff&&R.eff.overdrive?SF.PICKUPS.overdrive.levels:0;return R.p.lvl+od;},
 row(R){const L=Wp.def().levels;return L[clamp(Wp.level(R),1,L.length)-1];},
 dmgMul(R){return R.p.pl.dmg*(1+SF.BAL.weapon.hangarDamagePer*Wp.hangarLevel())*SF.BAL.mul.weaponDamage;},
 rateMul(R){return (R.p.pl.fire||1)*(1+SF.BAL.weapon.hangarRatePart*save.parts.engine)*SF.BAL.mul.fireRate*(R.eff&&R.eff.overdrive?SF.PICKUPS.overdrive.rate:1);},
 levelUp(R){const p=R.p,mx=SF.BAL.weapon.maxLevel;if(p.lvl>=mx)return false;p.lvl++;SF.emit('levelUp',{lvl:p.lvl});return true;},
 reset(){pool.clear();},
};
const cap=()=>SF.BAL.caps.pb[save.hq?0:1];
function shot(k,x,y,vx,vy,dmg,r,row,extra){if(pool.live.length>=cap())return null;const b=pool.get();if(!b)return null;
 b.k=k;b.x=b.ox=x;b.y=b.oy=y;b.vx=vx;b.vy=vy;b.dmg=dmg;b.r=r;b.pierce=row?row.pierce:0;b.size=row?row.size:1;b.tier=row?row.tier:1;
 b.life=0;b.m=0;b.splash=0;b.last=null;b.t=0;b.dead=false;if(extra)Object.assign(b,extra);return b;}
Wp.shotPublic=(...a)=>shot(...a);
Wp.fire=(R,dt)=>{const p=R.p;if(!p.alive||p.dying>0)return;const D=Wp.def(),row=Wp.row(R),dm=Wp.dmgMul(R);
 if(D.kind==='beam'){p.beam={w:row.width,dps:row.dmg*dm,pierce:row.pierce,end:-20,tier:row.tier};}
 else{p.beam=null;p.fc-=dt*row.rate*Wp.rateMul(R);let guard=0;
  while(p.fc<=0&&guard++<4){p.fc+=1;p.muzzle=.05;const n=row.count,T=SF.TIERS[row.tier];
   if(D.kind==='stream'){for(let i=0;i<n;i++){const o=n>1?(i/(n-1)-.5)*row.spread:0;shot('v',p.x+o,p.y-24,o*2.2,-row.speed,row.dmg*dm,3.5+row.size,row);}}
   else if(D.kind==='fan'){const arc=row.spread*Math.PI/180;for(let i=0;i<n;i++){const a=-Math.PI/2+(n>1?(i/(n-1)-.5)*arc:0);shot('s',p.x,p.y-20,Math.cos(a)*row.speed,Math.sin(a)*row.speed,row.dmg*dm,4+row.size,row);}}
   else if(D.kind==='flame'){const arc=row.spread*Math.PI/180;for(let i=0;i<n*(save.hq?2:1);i++){const a=-Math.PI/2+rnd(-.5,.5)*arc,v=row.speed*rnd(.9,1.1);
     shot('f',p.x+rnd(-4,4),p.y-24,Math.cos(a)*v+p.vx*.25,Math.sin(a)*v,row.dmg*dm,8*row.size,row,{life:row.life,m:row.life,pierce:99});}}
   else if(D.kind==='orb'){const arc=row.spread*Math.PI/180;for(let i=0;i<n;i++){const a=-Math.PI/2+(n>1?(i/(n-1)-.5)*arc:0);shot('p',p.x,p.y-24,Math.cos(a)*row.speed,Math.sin(a)*row.speed,row.dmg*dm,7*row.size,row,{splash:row.splash});}}
   sfx(D.sfx);}}
 // side weapons from hangar parts and drones
 const ml=save.parts.missile;if(ml>0){const M=SF.SIDEARMS.missile;p.mc-=dt;if(p.mc<=0){p.mc=M.interval(ml);sfx('missile');for(const sd of[-1,1])shot('m',p.x+sd*SF.loadout.railX(R,0),p.y+6,sd*120,-120,M.dmg(ml)*dm,4,null,{t:0});}}
 // wing pods: green wave bolts from the effective weapon level
 {const WV=SF.SIDEARMS.wave,L=Wp.level(R);if(p.podFlash>0)p.podFlash-=dt;if(L>=WV.fromLevel){p.wc=(p.wc||0)-dt;if(p.wc<=0){p.wc=WV.interval;p.podFlash=.06;const dmg=WV.dmg(L)*dm,px=SF.loadout.podX(R);
  for(const sd of[-1,1]){const x=p.x+sd*px;shot('w',x,p.y-12,0,-WV.speed,dmg,4,null,{t:0,x0:x,ph:0,tier:2});if(L>=WV.twinLevel)shot('w',x,p.y-12,0,-WV.speed,dmg,4,null,{t:0,x0:x,ph:Math.PI,tier:2});}}}}
 for(const d of R.drones){const lv=save.dl[R.drone]||0;
  if(R.drone==='shielddrone'){const S=SF.SIDEARMS.shielddrone;d.a+=dt*3.2;d.x=p.x+Math.cos(d.a)*S.orbit;d.y=p.y+Math.sin(d.a)*S.orbit;const rr=S.radius(lv),eb=SF.enemies.ebPool.live;
   for(let i=eb.length-1;i>=0;i--){const b=eb[i];if((b.x-d.x)**2+(b.y-d.y)**2<rr*rr){SF.fx.spark(b.x,b.y,'#bff4ff',3);SF.enemies.ebPool.kill(b);}}
   for(const e of SF.enemies.list())if(e.alive&&!e.untargetable&&(e.x-d.x)**2+(e.y-d.y)**2<(e.r+8)**2&&e.ft<=0){SF.enemies.hit(e,S.contactDmg(lv)*dm,d);e.ft=.1;}}
  else{d.x+=(p.x+d.s*32-d.x)*Math.min(1,dt*9);d.y+=(p.y+14-d.y)*Math.min(1,dt*9);d.fc-=dt;
   if(R.drone==='gundrone'&&d.fc<=0){const G2=SF.SIDEARMS.gundrone;d.fc=G2.interval;shot('v',d.x,d.y-10,0,-G2.speed,G2.dmg(lv)*dm,3,null);}
   if(R.drone==='laserdrone'&&d.fc<=0){const L2=SF.SIDEARMS.laserdrone;let best=null,bd=L2.range*L2.range;for(const t of SF.enemies.list()){if(!t.alive||t.untargetable||t.y<-10)continue;const q=(t.x-d.x)**2+(t.y-d.y)**2;if(q<bd&&t.y<d.y){bd=q;best=t;}}
    if(best){d.fc=L2.interval(lv);SF.enemies.hit(best,L2.dmg(lv)*dm,d);d.zap=.12;d.zx=best.x;d.zy=best.y;SF.fx.spark(best.x,best.y,'#9fe8ff',4);sfx('zap');}else d.fc=.2;}
   if(d.zap>0)d.zap-=dt;}}};
// move projectiles and resolve hits against the enemy grid
Wp.step=(R,dt)=>{const grid=SF.enemies.grid,L=pool.live;
 for(let i=L.length-1;i>=0;i--){const b=L[i];b.ox=b.x;b.oy=b.y;
  if(b.k==='m'){b.t+=dt;const M=SF.SIDEARMS.missile;let tg=null,best=1e9;for(const e of SF.enemies.list()){if(!e.alive||e.untargetable||e.y<-20)continue;const d=(e.x-b.x)**2+(e.y-b.y)**2;if(d<best){best=d;tg=e;}}
   const sp=Math.min(M.speed,140+b.t*900);let a=Math.atan2(b.vy,b.vx);if(tg&&b.t>.12){let da=Math.atan2(tg.y-b.y,tg.x-b.x)-a;while(da>Math.PI)da-=TAU;while(da<-Math.PI)da+=TAU;a+=clamp(da,-M.turn*dt,M.turn*dt);}
   b.vx=Math.cos(a)*sp;b.vy=Math.sin(a)*sp;if(Math.random()<.7)SF.fx.add('s',b.x-b.vx*.01,b.y-b.vy*.01,rnd(-6,6),rnd(-6,6),rnd(.6,.9),'#d6dbe0',2.6,{d:.4,drag:.92});}
  if(b.k==='w'){b.t+=dt;const WV=SF.SIDEARMS.wave;b.x=b.x0+Math.sin(b.t*WV.freq+b.ph)*WV.amp*Math.min(1,b.t*5);}
  if(b.k==='f'){b.life-=dt;b.vx*=.97;b.vy*=.97;if(b.life<=0){pool.kill(b);continue;}}
  b.x+=b.vx*dt;b.y+=b.vy*dt;
  if(b.y<-30||b.y>H+30||b.x<-60||b.x>W+60){pool.kill(b);continue;}
  const cell=grid.at(b.x,b.y);let gone=false;
  for(let j=0;j<cell.length;j++){const e=cell[j];if(!e.alive||e.untargetable||e===b.last)continue;const rr=e.r+b.r+(e.sh>0?6:0);if((e.x-b.x)**2+(e.y-b.y)**2>=rr*rr)continue;
   if(b.k==='f'){if(e.ft<=0){SF.enemies.hit(e,b.dmg,b);e.ft=.06;}continue;}
   SF.enemies.hit(e,b.dmg,b);SF.fx.impact(b.x,b.y,b.tier,e.sh>0?'#9fe8ff':null);sfx('hit');
   if(b.splash){SF.fx.explode(b.x,b.y,.7);for(const o of SF.enemies.list())if(o!==e&&o.alive&&!o.untargetable&&(o.x-b.x)**2+(o.y-b.y)**2<b.splash*b.splash)SF.enemies.hit(o,b.dmg*.5,b);}
   if(b.pierce>0){b.pierce--;b.last=e;}else{gone=true;break;}}
  if(!gone&&b.k!=='f'&&SF.boss.list.length&&SF.boss.absorb(b.x,b.y)){if(Math.random()<.5)SF.fx.spark(b.x,b.y,'#ffe2a8',2);gone=true;}
  if(gone)pool.kill(b);}
 // beam
 const p=R.p,bm=p.beam;if(bm&&p.alive&&p.dying<=0){const hw=bm.w/2,hits=[];for(const e of SF.enemies.list()){if(!e.alive||e.untargetable||e.invuln)continue;if(Math.abs(e.x-p.x)<e.r+hw&&e.y<p.y&&e.y>-20)hits.push(e);}
  hits.sort((a,b)=>b.y-a.y);let end=-20;const n=Math.min(hits.length,1+bm.pierce);for(let i=0;i<n;i++){SF.enemies.hit(hits[i],bm.dps*dt,{x:p.x,beam:1});if(Math.random()<.3)SF.fx.impact(hits[i].x+rnd(-4,4),hits[i].y+hits[i].r*.5,bm.tier,'#7fe0ff');}
  if(n&&n===1+bm.pierce)end=hits[n-1].y;bm.end=end;if(n)sfx('hit');}};
// ---- drawing ----
Wp.draw=(R,A)=>{const p=R.p;cx.globalCompositeOperation='lighter';
 for(const b of pool.live){const x=b.ox+(b.x-b.ox)*A,y=b.oy+(b.y-b.oy)*A,T=SF.TIERS[b.tier]||SF.TIERS[1],s=b.size;
  if(b.k==='v'){pdg(x,y,7*s+b.tier*1.5,T.glow);pspr(SP.pv,x,y,Math.atan2(b.vx,-b.vy),s);}
  else if(b.k==='s'){pdg(x,y,8*s+b.tier*1.5,T.glow);pspr(SP.ps,x,y,0,s);}
  else if(b.k==='p'){pdg(x,y,16*s,b.tier>=3?'#7fe0ff':'#3c8cff');pspr(SP.pp,x,y,0,s*(1+Math.random()*.15));}
  else if(b.k==='w'){pdg(x,y,14*s,'#3dff8a');pdg(x,y,6*s,'#eafff0');pj(x,y);const x0=PX,y0=PY;pj(b.ox,b.oy+10);cx.strokeStyle='rgba(120,255,170,.75)';cx.lineWidth=3.4;cx.beginPath();cx.moveTo(x0,y0);cx.lineTo(PX,PY);cx.stroke();}
  else if(b.k==='m'){cx.globalCompositeOperation='source-over';pspr(SP.pm,x,y,Math.atan2(b.vx,-b.vy));cx.globalCompositeOperation='lighter';pdg(x-b.vx*.02,y-b.vy*.02,6,'#ff9d2e');}
  else if(b.k==='f'){const a=b.life/b.m,c=a>.75?'#fff3c4':a>.45?(b.tier>=3?'#9fe8ff':'#ffb347'):a>.2?'#ff5a1a':'#a02a10';cx.globalAlpha=Math.min(1,a*1.6);pdg(x,y,b.r*(1.9-a),c);cx.globalAlpha=1;}}
 const px=p.ox+(p.x-p.ox)*A,py=p.oy+(p.y-p.oy)*A;
 if(p.beam&&p.alive){const L=p.beam,T=SF.TIERS[L.tier];pj(px,py-26);const x0=PX,y0=PY;pj(px,L.end);cx.lineCap='round';
  for(const[w,c2]of[[L.w*3.2,'rgba(40,200,255,.22)'],[L.w*1.6,L.tier>=4?'rgba(190,120,255,.6)':'rgba(70,215,255,.6)'],[L.w*.5,'#ffffff']]){cx.strokeStyle=c2;cx.lineWidth=w*PS;cx.beginPath();cx.moveTo(x0,y0);cx.lineTo(PX,PY);cx.stroke();}
  cx.lineCap='butt';pdg(px,py-28,14+L.tier*2,T.glow);pdg(px,L.end,18+Math.random()*6+L.tier*2,'#9fe8ff');}
 if(p.muzzle>0&&p.alive&&!p.beam){const T=SF.TIERS[Wp.row(R).tier];pdg(px,py-26,T.flash*(.7+Math.random()*.5),T.glow);pdg(px,py-26,T.flash*.45,'#ffffff');}
 for(const d of R.drones)if(d.zap>0){pj(d.x,d.y);const x0=PX,y0=PY;pj(d.zx,d.zy);cx.strokeStyle='#bff4ff';cx.lineWidth=2;cx.globalAlpha=d.zap/.12;cx.beginPath();cx.moveTo(x0,y0);cx.lineTo(PX,PY);cx.stroke();cx.globalAlpha=1;}
 if(R.drone==='shielddrone'&&p.alive)for(const d of R.drones)pdg(d.x,d.y,14+save.dl.shielddrone,'#5fc8ff');
 cx.globalCompositeOperation='source-over';};
})();
