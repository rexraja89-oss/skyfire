'use strict';
// ============ ENEMIES (new engine) ============
// Runtime for SF.ENEMIES definitions: movement modules + fire patterns + abilities, a single damage
// pipeline (hit -> armour/shield -> hp -> kill) and pooled enemy bullets.
(()=>{
const pool=new SF.Pool(()=>({}),120),ebPool=new SF.Pool(()=>({}),420),grid=new SF.Grid(48,W,1400);
const deg=Math.PI/180;
const En=SF.enemies={pool,ebPool,grid,list:()=>pool.live,R:null};
const BAL=()=>SF.BAL;
const fireY=e=>e.y>BAL().enemy.fireMinY&&e.y<H*BAL().enemy.fireMaxFrac;
const aimA=(e,R)=>Math.atan2(R.p.y-e.y,R.p.x-e.x);
let gid=1;En.newGroup=()=>gid++;
// ---------- spawning ----------
En.spawn=(type,o={})=>{const d=SF.ENEMIES[type];if(!d){console.warn('unknown enemy',type);return null;}
 if(pool.live.length>=BAL().caps.enemies)return null;const e=pool.get();if(!e)return null;
 const hp=d.hp*BAL().mul.enemyHp*(o.hpMul||1);
 Object.assign(e,{type,d,x:W/2,y:-30,vx:0,vy:0,t:0,st:0,stT:0,hp,max:hp,r:d.r,alive:true,flash:0,armorT:0,ft:0,delay:0,group:0,shots:0,burst:0,burstT:0,
  fireT:d.fire&&d.fire.first!==undefined?d.fire.first:rnd(.6,1.4),hd:Math.PI/2,rot:0,roll:0,untargetable:false,cloaked:false,sh:0,shMax:0,shHit:0,lastHit:-9,
  side:0,x0:0,ty:0,tx:0,lockX:0,la:0,vol:0,jumps:0,tp:0,healT:0,m:null,scatter:false,leave:false,lastPat:0},o);
 e.ox=e.x;e.oy=e.y;e.x0=o.x0!==undefined?o.x0:e.x;
 const A=d.abilities||{};if(A.shield){e.shMax=e.sh=hp*A.shield.mult;}
 if(A.teleport){e.tp=0;e.stT=0;}
 if(!d.noCount&&En.R)En.R.spawned++;SF.emit('spawn',{e});return e;};
// enemy bullet
const ebCap=()=>BAL().caps.eb[save.hq?0:1];
En.shoot=(x,y,a,spd,kind)=>{if(ebPool.live.length>=ebCap())return null;const B=SF.BULLETS[kind]||SF.BULLETS.pellet,b=ebPool.get();if(!b)return null;
 const s=spd*BAL().mul.bulletSpeed;b.x=b.ox=x;b.y=b.oy=y;b.vx=Math.cos(a)*s;b.vy=Math.sin(a)*s;b.k=kind;b.B=B;b.r=B.r;b.dmg=B.dmg;b.life=B.life||0;return b;};
// ---------- movement modules ----------
const MOVE={
 none(){},
 dive(e,m,dt,R){e.y+=m.speed*dt;if(e.t<m.home)e.x+=(R.p.x-e.x)*m.homeK*dt;e.hd=Math.PI/2;},
 sideEntry(e,m,dt){if(!e.side)e.side=e.x<W/2?-1:1;if(!e.st){e.st=1;e.vx=-e.side*m.vx;e.vy=m.vy;}e.vx+=e.side*m.curve*dt;e.x+=e.vx*dt;e.y+=e.vy*dt;e.hd=Math.atan2(e.vy,e.vx);},
 strafe(e,m,dt){if(!e.side)e.side=e.x<W/2?-1:1;if(!e.st){e.st=1;e.y=e.ty||lyAt(m.y);}e.x+=-e.side*m.vx*dt;e.y+=Math.sin(e.t*2)*10*dt;e.hd=e.side<0?0:Math.PI;},
 hover(e,m,dt){if(!e.ty)e.ty=lyAt(m.y)+rnd(-30,30);if(e.t<m.hold){e.y+=(e.ty-e.y)*Math.min(1,1.6*dt);if(m.sway)e.x+=Math.sin(e.t*.9)*m.sway*dt;}else{e.vy=Math.min(150,e.vy+120*dt);e.y+=e.vy*dt;}e.hd=Math.PI/2;e.rot=clamp(Math.cos(e.t*.9)*.15,-.2,.2);},
 drift(e,m,dt){if(!e.ty)e.ty=lyAt(m.y);if(e.t<m.hold){e.y+=Math.min(m.speed*dt,Math.max(0,e.ty-e.y)*1.2*dt+m.speed*.15*dt);e.x=e.x0+Math.sin(e.t*.5)*m.sway;}else e.y+=m.speed*dt;e.hd=Math.PI/2;},
 sine(e,m,dt){e.y+=m.speed*dt;e.x=e.x0+Math.sin(e.t*m.freq+(e.ph||0))*m.amp;e.hd=Math.PI/2;},
 hawk(e,m,dt,R){if(e.st===0){if(!e.ty)e.ty=lyAt(m.y)+rnd(-25,25);e.y+=(e.ty-e.y)*2.4*dt;e.x+=(R.p.x+(e.ox0||0)-e.x)*.9*dt;if(e.t>1.3){e.st=1;e.stT=m.lock;e.lockX=R.p.x;e.lockY=R.p.y;sfx('lance');}}
  else if(e.st===1){e.stT-=dt;e.x+=Math.sin(e.t*60)*.6;if(e.stT<=0){e.st=2;const a=Math.atan2(e.lockY-e.y,e.lockX-e.x);e.vx=Math.cos(a)*m.dive;e.vy=Math.sin(a)*m.dive;}}
  else{e.x+=e.vx*dt;e.y+=e.vy*dt;}e.hd=e.st===2?Math.atan2(e.vy,e.vx):Math.PI/2;},
 kamikaze(e,m,dt,R){const a=aimA(e,R),sp=m.speed*(e.scatter?1.6:1);e.vx+=(Math.cos(a)*sp-e.vx)*dt*m.accel;e.vy+=(Math.sin(a)*sp-e.vy)*dt*m.accel;if(e.t>m.giveUp)e.vy=Math.max(e.vy,120);e.x+=e.vx*dt;e.y+=e.vy*dt;e.rot+=dt*4;e.hd=Math.atan2(e.vy,e.vx);},
 fall(e,m,dt){if(!e.vy)e.vy=m.speed;e.y+=e.vy*dt;e.vy*=m.drag;e.rot+=dt;},
 scatter(e,m,dt){e.x+=e.vx*dt;e.y+=e.vy*dt;e.vy+=40*dt;e.hd=Math.atan2(e.vy,e.vx);},
};
En.MOVE=MOVE;
// ---------- fire patterns ----------
function firePattern(e,R){const f=e.d.fire,a=aimA(e,R),k=f.bullet||'pellet';
 switch(f.pattern){
  case 'aimed':En.shoot(e.x,e.y+10,a,f.speed,k);break;
  case 'fan':{const n=f.count,arc=f.spread*deg;for(let i=0;i<n;i++)En.shoot(e.x,e.y+10,a+(n>1?(i/(n-1)-.5)*arc:0),f.speed,k);break;}
  case 'burst':e.burst=f.burst;e.burstT=0;break;
  case 'ring':{const n=f.count,o=e.t;for(let i=0;i<n;i++)En.shoot(e.x,e.y,o+i*TAU/n,f.speed,k);break;}
  case 'spiral':{for(let i=0;i<f.arms;i++)En.shoot(e.x,e.y,e.t*2.1+i*TAU/f.arms,f.speed,k);break;}
  case 'mines':if(e.x>20&&e.x<W-20){En.spawn(f.spawn,{x:e.x,y:e.y+10});sfx('mine');}break;}}
En.firePattern=firePattern;
function stepFire(e,dt,R){const f=e.d.fire;if(!f||f.pattern==='none'||e.scatter)return;
 if(e.burst>0){e.burstT-=dt;if(e.burstT<=0){e.burst--;e.burstT=f.gap;En.shoot(e.x,e.y+10,aimA(e,R),f.speed,f.bullet);}}
 if(f.pattern==='sniper'){stepSniper(e,f,dt,R);return;}
 if(f.on)return; // fired by an ability (reveal / arrive)
 if(!fireY(e)||e.cloaked)return;
 if(f.maxShots&&e.shots>=f.maxShots)return;
 e.fireT-=dt*BAL().mul.enemyFire;if(e.fireT<=0){e.fireT=f.every*rnd(.85,1.15);e.shots++;firePattern(e,R);}}
function stepSniper(e,f,dt,R){ // aim (telegraph line) -> needle volley -> re-aim -> leave
 if(e.st===0){e.fireT-=dt;if(e.fireT<=0&&fireY(e)){e.st=1;e.stT=f.aim;e.la=aimA(e,R);sfx('lance');}}
 else if(e.st===1){e.stT-=dt;if(e.stT<=0){for(let i=0;i<f.count;i++)En.shoot(e.x+Math.cos(e.la)*(18+i*16),e.y+Math.sin(e.la)*(18+i*16),e.la,f.speed,f.bullet);e.vol++;e.st=2;e.stT=.35;}}
 else if(e.st===2){e.stT-=dt;if(e.stT<=0){if(e.vol>=f.volleys){e.st=3;e.leave=true;}else{e.st=0;e.fireT=1.2;e.x0=clamp(e.x+rnd(-90,90),40,W-40);}}}
 if(e.st===0&&e.x0)e.x+=(e.x0-e.x)*2*dt;if(e.leave)e.y-=130*dt;e.hd=e.st===1||e.st===2?e.la:Math.PI/2;}
// ---------- abilities ----------
function stepAbilities(e,dt,R){const A=e.d.abilities;if(!A)return;
 if(A.shield){if(e.sh<e.shMax&&e.t-e.lastHit>A.shield.delay)e.sh=Math.min(e.shMax,e.sh+e.shMax*A.shield.regen*dt);if(e.shHit>0)e.shHit-=dt;}
 if(A.cloak){const c=A.cloak,ph=e.t%c.cycle,was=e.cloaked;e.cloaked=ph<c.hidden;e.untargetable=e.cloaked;
  if(e.cloaked&&!was){e.tx=clamp(R.p.x+rnd(-120,120),40,W-40);e.ty=rnd(lyAt(.1),lyAt(.4));}
  if(e.t<c.leave){e.x+=(e.tx-e.x)*dt*(e.cloaked?1.6:.3);e.y+=((e.ty||lyAt(.2))-e.y)*dt*(e.cloaked?1.6:.3);}else e.y+=170*dt;
  if(!e.cloaked&&was)sfx('blink');if(!e.cloaked&&ph>c.hidden+.5&&!e.firedC){e.firedC=1;firePattern(e,R);}if(e.cloaked)e.firedC=0;}
 if(A.teleport){const c=A.teleport;
  if(e.tp>0){e.tp-=dt;e.untargetable=true;if(e.tp<=0){e.x=rnd(60,W-60);e.y=rnd(lyAt(.1),lyAt(.38));e.stT=0;e.fired=0;e.untargetable=false;SF.fx.spark(e.x,e.y,'#c07bff',10);}}
  else{if(e.t<.05&&e.y<0){e.x=rnd(60,W-60);e.y=rnd(lyAt(.1),lyAt(.35));}e.stT+=dt;if(e.stT>(e.d.fire.delay||.85)&&!e.fired){e.fired=1;firePattern(e,R);}
   if(e.stT>c.stay){e.jumps++;if(e.jumps>=c.jumps){SF.fx.spark(e.x,e.y,'#c07bff',12);En.remove(e);return;}e.tp=c.gone;sfx('blink');SF.fx.spark(e.x,e.y,'#c07bff',10);}}}
 if(A.heal){e.healT-=dt;if(e.healT<=0){e.healT=A.heal.every;let best=null,bd=A.heal.range**2;for(const o of pool.live){if(o===e||!o.alive||o.hp>=o.max||o.d.abilities&&o.d.abilities.heal||o.type==='mine')continue;const q=(o.x-e.x)**2+(o.y-e.y)**2;if(q<bd){bd=q;best=o;}}
  if(best){best.hp=Math.min(best.max,best.hp+best.max*A.heal.amount);if(best.shMax)best.sh=best.shMax;R.beams.push({a:e,b:best,t:.45});sfx('heal');SF.fx.spark(best.x,best.y,'#7fffb0',5);}}}
 if(A.fuse&&e.t>A.fuse.time){const f=A.fuse;for(let i=0;i<f.ring;i++)En.shoot(e.x,e.y,e.t+i*TAU/f.ring,f.speed,'ring');SF.fx.explode(e.x,e.y,1.1);sfx('pop');En.remove(e);}}
// ---------- damage pipeline ----------
En.hit=(e,dmg,src)=>{if(!e.alive||e.untargetable)return 0;const A=e.d.abilities||{};
 if(A.frontArmor&&src&&src.x!==undefined&&!src.special){if(Math.abs(src.x-e.x)<e.r*A.frontArmor.sideFrac){dmg*=1-A.frontArmor.reduce;e.armorT=.08;if(Math.random()<.3)SF.fx.spark(src.x,e.y+e.r*.6,'#c9d2db',1);}}
 if(e.sh>0){e.sh-=dmg;e.shHit=.12;e.lastHit=e.t;if(e.sh>=0)return 0;dmg=-e.sh;e.sh=0;SF.fx.spark(e.x,e.y,'#9fe8ff',6);sfx('zap');}
 e.hp-=dmg;e.flash=.06;if(e.hp<=0)En.kill(e,src);return dmg;};
En.kill=(e,src)=>{if(!e.alive)return;e.alive=false;const d=e.d,R=En.R,A=d.abilities||{};
 SF.fx.explode(e.x,e.y,d.size||1,false);SF.fx.addShake((d.size||1)>1.4?.2:.06);sfx((d.size||1)>1.4?'boom':'pop');
 if(A.split){const s=A.split;for(let i=0;i<s.count;i++){const a=i/s.count*TAU;En.spawn(s.into,{x:e.x+Math.cos(a)*20,y:e.y+Math.sin(a)*20,vx:Math.cos(a)*s.speed,vy:Math.sin(a)*s.speed,group:e.group});}}
 if(A.captain&&e.group){let n=0;for(const o of pool.live)if(o.alive&&o!==e&&o.group===e.group){o.scatter=true;o.d0=o.d;o.vx=(o.x<e.x?-1:1)*rnd(120,200);o.vy=rnd(-40,40);n++;}
  if(n){SF.fx.pop(e.x,e.y-20,'LEADER DOWN',true);SF.emit('captainDown',{e,n,bonus:A.captain.bonus});}}
 SF.emit('kill',{e,src});En.remove(e);};
En.remove=e=>{e.alive=false;if(e.m){release(e.m);e.m=null;}pool.kill(e);};
En.reset=()=>{for(const e of pool.live)if(e.m){release(e.m);e.m=null;}pool.clear();ebPool.clear();grid.reset();};
// ---------- step ----------
En.step=(R,dt)=>{const p=R.p,L=pool.live,mv=BAL().mul.enemySpeed,pad=BAL().enemy.offscreenPad;
 for(let i=L.length-1;i>=0;i--){const e=L[i];if(!e.alive)continue;e.ox=e.x;e.oy=e.y;
  if(e.delay>0){e.delay-=dt;continue;}
  const edt=dt*mv;e.t+=edt;if(e.flash>0)e.flash-=dt;if(e.armorT>0)e.armorT-=dt;if(e.ft>0)e.ft-=dt;
  const m=e.d.move;(e.scatter?MOVE.scatter:MOVE[m.type]||MOVE.none)(e,m,edt,R);
  stepAbilities(e,edt,R);if(!e.alive)continue;
  stepFire(e,dt,R);
  e.roll+=(clamp(-(e.vx||0)/300,-.6,.6)-e.roll)*Math.min(1,dt*6);
  // ram the player
  if(p.alive&&p.dying<=0&&!e.untargetable&&(e.x-p.x)**2+(e.y-p.y)**2<(e.r*.8+BAL().player.hitR+4)**2){
   if(SF.player.hurt(R,e.d.ram||BAL().player.collideDamage)){if(e.d.dieOnRam)En.kill(e);else En.hit(e,BAL().enemy.collideRam,null);}}
  if(e.alive&&(e.y>H+pad||e.x<-pad-60||e.x>W+pad+60||(e.y<-200&&e.t>5)))En.remove(e);}
 // grid for player bullets
 grid.reset();for(const e of L)if(e.alive&&!e.delay&&!e.untargetable&&e.y>-40)grid.add(e,e.x,e.y,e.r+10);
 // enemy bullets
 const B=ebPool.live,hr=BAL().player.hitR;
 for(let i=B.length-1;i>=0;i--){const b=B[i];b.ox=b.x;b.oy=b.y;
  if(b.B.homing){b.life-=dt;if(b.life>1){let a=Math.atan2(b.vy,b.vx),da=Math.atan2(p.y-b.y,p.x-b.x)-a;while(da>Math.PI)da-=TAU;while(da<-Math.PI)da+=TAU;a+=clamp(da,-b.B.homing*dt,b.B.homing*dt);const sp=Math.hypot(b.vx,b.vy);b.vx=Math.cos(a)*sp;b.vy=Math.sin(a)*sp;}if(Math.random()<.5)SF.fx.smoke(b.x,b.y,2.5,'#bbb',.4);}
  b.x+=b.vx*dt;b.y+=b.vy*dt;
  if(p.alive&&p.dying<=0&&(b.x-p.x)**2+(b.y-p.y)**2<(b.r+hr)**2){if(SF.player.hurt(R,b.dmg)||p.inv>0){ebPool.kill(b);continue;}}
  if(b.y<-40||b.y>H+30||b.x<-60||b.x>W+60)ebPool.kill(b);}
 for(const bm of R.beams)bm.t-=dt;prune(R.beams,b=>b.t>0);};
// ---------- 3D sync ----------
En.sync=(A,dt)=>{for(const e of pool.live){if(!e.alive)continue;if(!e.m)e.m=acquire(e.d.model);const m=e.m;m.visible=!e.delay;if(!m.visible)continue;
 const x=e.ox+(e.x-e.ox)*A,y=e.oy+(e.y-e.oy)*A,T=e.d.model;place(m,x,y,false,T==='mine'?-.5:0);if(e.d.scale)m.scale.multiplyScalar(e.d.scale);
 const a=e.hd!==undefined?e.hd:Math.PI/2+(e.rot||0);m.rotation.set(0,yawFrom(a),e.roll);
 if(T==='drone'||T==='sower'||T==='hydra'||T==='mine')m.rotation.y=e.rot;
 if(T==='heli'||T==='hornet'||T==='mender')m.rotation.set(.12,yawFrom(Math.PI/2),e.rot);
 for(const r of m.R.rotor)r.rotation.y+=dt*30;if(m.R.trot)m.R.trot.rotation.x+=dt*40;
 if(m.R.ring.length){m.R.ring.forEach((r,i)=>{r.rotation.z+=dt*(i?-3:3);});if(T==='blink'){const s=e.tp>0?Math.max(.05,e.tp/.35*.3):Math.min(1,e.stT*4);m.scale.multiplyScalar(s);}}
 if(m.R.shield){if(T==='aegis'){m.R.shield.visible=e.sh>0;m.R.shield.material.opacity=.18+(e.shHit>0?.4:0)+.1*Math.sin(e.t*6);}else m.R.shield.material.opacity=.14+.06*Math.sin(e.t*3);}
 if(m.R.light){if(T==='mine')m.R.light.visible=e.t<3?Math.floor(e.t*3)%2===0:Math.floor(e.t*12)%2===0;else m.R.light.scale.setScalar(1+.25*Math.sin(e.t*6));}
 if(T==='wraith'){const op=e.cloaked?.1:1;m.traverse(o=>{if(o.isMesh){o.material.opacity+=(op-o.material.opacity)*Math.min(1,dt*8);o.castShadow=!e.cloaked;}});}}};
// ---------- overlay ----------
En.drawTele=(R,A)=>{for(const e of pool.live){if(!e.alive)continue;
 if(e.d.fire&&e.d.fire.pattern==='sniper'&&e.st===1){const L=clipLen(e.x,e.y,Math.cos(e.la),Math.sin(e.la));pj(e.x,e.y);const x0=PX,y0=PY;pj(e.x+Math.cos(e.la)*L,e.y+Math.sin(e.la)*L);
  cx.strokeStyle=`rgba(255,40,60,${.35+.45*Math.abs(Math.sin(e.stT*30))})`;cx.lineWidth=1.6;cx.setLineDash([8,6]);cx.beginPath();cx.moveTo(x0,y0);cx.lineTo(PX,PY);cx.stroke();cx.setLineDash([]);}
 if(e.d.move.type==='hawk'&&e.st===1){pj(e.x,e.y);const x0=PX,y0=PY;pj(e.lockX,e.lockY);cx.strokeStyle=`rgba(255,180,60,${.3+.5*Math.abs(Math.sin(e.stT*24))})`;cx.lineWidth=2;cx.setLineDash([4,6]);cx.beginPath();cx.moveTo(x0,y0);cx.lineTo(PX,PY);cx.stroke();cx.setLineDash([]);}}
 for(const b of R.beams){pj(b.a.x,b.a.y);const x0=PX,y0=PY;pj(b.b.x,b.b.y);cx.strokeStyle='#7fffb0';cx.globalAlpha=b.t/.45;cx.lineWidth=3;cx.beginPath();cx.moveTo(x0,y0);cx.lineTo(PX,PY);cx.stroke();cx.lineWidth=8;cx.globalAlpha*=.3;cx.stroke();cx.globalAlpha=1;}};
En.drawFlash=A=>{cx.globalCompositeOperation='lighter';for(const e of pool.live){if(!e.alive||e.delay)continue;const x=e.ox+(e.x-e.ox)*A,y=e.oy+(e.y-e.oy)*A;
 if(e.flash>0&&e.m&&e.m.visible)pdg(x,y,e.r*1.3,'#ffffff');if(e.armorT>0)pdg(x,y+e.r*.5,e.r*.9,'#c9d2db');
 if(e.d.abilities&&e.d.abilities.teleport&&e.tp>0)pdg(x,y,30,'#c07bff');
 if(e.d.fire&&e.d.fire.pattern==='sniper'&&e.st===1)pdg(x+Math.cos(e.la)*16,y+Math.sin(e.la)*16,8+Math.random()*5,'#ff3c50');
 if(e.d.move.type==='hawk'&&e.st===1)pdg(x,y,e.r*1.4,'#ffb347');}cx.globalCompositeOperation='source-over';};
En.drawBullets=A=>{for(const b of ebPool.live){const x=b.ox+(b.x-b.ox)*A,y=b.oy+(b.y-b.oy)*A,img=SP[b.B.sprite];
 if(b.B.orient){pspr(img,x,y,Math.atan2(b.vx,-b.vy)+Math.PI);if(b.B.homing){cx.globalCompositeOperation='lighter';pdg(x-b.vx*.04,y-b.vy*.04,7,'#ff7a2e');cx.globalCompositeOperation='source-over';}}
 else pspr(img,x,y);}};
})();
