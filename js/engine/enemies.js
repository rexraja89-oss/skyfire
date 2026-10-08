'use strict';
// ============ ENEMIES (new engine) ============
// Runtime for SF.ENEMIES definitions (air + ground): movement modules + fire patterns + abilities, a single damage
// pipeline (hit -> armour/shields -> hp -> kill) and pooled enemy bullets.
(()=>{
const pool=new SF.Pool(()=>({}),140),ebPool=new SF.Pool(()=>({}),420),grid=new SF.Grid(48,W,1400);
const deg=Math.PI/180;
const En=SF.enemies={pool,ebPool,grid,list:()=>pool.live,R:null};
const BAL=()=>SF.BAL;
const fireY=e=>e.y>BAL().enemy.fireMinY&&e.y<H*BAL().enemy.fireMaxFrac;
const aimA=(e,R)=>Math.atan2(R.p.y-e.y,R.p.x-e.x);
let gid=1;En.newGroup=()=>gid++;
// ---------- spawning ----------
En.spawn=(type,o={})=>{const d=SF.ENEMIES[type];if(!d){console.warn('unknown enemy',type);return null;}
 if(pool.live.length>=BAL().caps.enemies)return null;const e=pool.get();if(!e)return null;
 const hp=d.hp*SF.dm('enemyHp')*(o.hpMul||1);
 Object.assign(e,{type,d,mv:null,invuln:false,guard:0,x:W/2,y:-30,vx:0,vy:0,t:0,st:0,stT:0,hp,max:hp,r:d.r,alive:true,flash:0,armorT:0,ft:0,delay:0,group:0,fgroup:0,shots:0,burst:0,burstT:0,
  fireT:d.fire&&d.fire.first!==undefined?d.fire.first:rnd(.6,1.4),hd:Math.PI/2,rot:0,roll:0,ang:Math.PI/2,untargetable:false,cloaked:false,sh:0,shMax:0,shHit:0,lastHit:-9,
  side:0,x0:0,ty:0,tx:0,lockX:0,la:0,vol:0,jumps:0,tp:0,healT:0,m:null,scatter:false,leave:false,ground:!!d.ground,parent:null,kids:null,dx:0,dy:0,
  buff:0,domed:false,wx0:20,wx1:W-20,open:false,spawnT:0,called:false,smokeT:0,seen:-1,path:null,ps:0,slot:null,spin:0,then:'',hold:0},o);
 e.ox=e.x;e.oy=e.y;e.x0=o.x0!==undefined?o.x0:e.x;
 const A=d.abilities||{};if(A.shield){e.shMax=e.sh=hp*A.shield.mult;}
 if(A.spawner)e.spawnT=A.spawner.first||A.spawner.every;
 if(d.parts){e.kids=[];for(const pt of d.parts){const k=En.spawn(pt.type,{x:e.x+pt.dx,y:e.y+pt.dy,parent:e,dx:pt.dx,dy:pt.dy,group:e.group,fgroup:e.fgroup,hpMul:o.hpMul});if(k)e.kids.push(k);}}
 if(!d.noCount&&En.R)En.R.spawned++;SF.emit('spawn',{e});return e;};
// enemy bullet
const ebCap=()=>BAL().caps.eb[save.hq?0:1];
En.shoot=(x,y,a,spd,kind)=>{if(ebPool.live.length>=ebCap())return null;const B=SF.BULLETS[kind]||SF.BULLETS.pellet,b=ebPool.get();if(!b)return null;
 const s=spd*SF.dm('bulletSpeed');b.x=b.ox=x;b.y=b.oy=y;b.vx=Math.cos(a)*s;b.vy=Math.sin(a)*s;b.k=kind;b.B=B;b.r=B.r;b.dmg=B.dmg;b.life=B.life||0;return b;};
// ---------- movement modules ----------
const MOVE={
 none(){},
 dive(e,m,dt,R){e.y+=m.speed*dt;if(e.t<(m.home||0))e.x+=(R.p.x-e.x)*m.homeK*dt;e.hd=Math.PI/2;},
 sideEntry(e,m,dt){if(!e.side)e.side=e.x<W/2?-1:1;if(!e.st){e.st=1;e.vx=-e.side*m.vx;e.vy=m.vy;}e.vx+=e.side*m.curve*dt;e.x+=e.vx*dt;e.y+=e.vy*dt;e.hd=Math.atan2(e.vy,e.vx);},
 strafe(e,m,dt){if(!e.side)e.side=e.x<W/2?-1:1;if(!e.st){e.st=1;e.y=e.ty||lyAt(m.y);}e.x+=-e.side*m.vx*dt;e.y+=Math.sin(e.t*2)*10*dt;e.hd=e.side<0?0:Math.PI;},
 hover(e,m,dt){if(!e.ty)e.ty=lyAt(m.y)+rnd(-30,30);if(e.t<m.hold){e.y+=(e.ty-e.y)*Math.min(1,1.6*dt);if(m.sway)e.x+=Math.sin(e.t*.9)*m.sway*dt;}else{e.vy=Math.min(150,e.vy+120*dt);e.y+=e.vy*dt;}e.hd=Math.PI/2;e.rot=clamp(Math.cos(e.t*.9)*.15,-.2,.2);},
 drift(e,m,dt){if(!e.ty)e.ty=lyAt(m.y);if(e.t<m.hold){e.y+=Math.min(m.speed*dt,Math.max(0,e.ty-e.y)*1.2*dt+m.speed*.15*dt);e.x=e.x0+Math.sin(e.t*.5)*m.sway;}else e.y+=m.speed*dt;e.hd=Math.PI/2;},
 sine(e,m,dt){e.y+=m.speed*dt;e.x=e.x0+Math.sin(e.t*m.freq+(e.ph||0))*m.amp;e.hd=Math.PI/2;},
 hawk(e,m,dt,R){if(e.st===0){if(!e.ty)e.ty=lyAt(m.y)+rnd(-25,25);e.y+=(e.ty-e.y)*2.4*dt;e.x+=(R.p.x-e.x)*.9*dt;if(e.t>1.3){e.st=1;e.stT=m.lock*Math.max(SF.DIFF_MIN_TELE,SF.BAL.run.tele||1);e.lockX=R.p.x;e.lockY=R.p.y;sfx('lance');}}
  else if(e.st===1){e.stT-=dt;e.x+=Math.sin(e.t*60)*.6;if(e.stT<=0){e.st=2;const a=Math.atan2(e.lockY-e.y,e.lockX-e.x);e.vx=Math.cos(a)*m.dive;e.vy=Math.sin(a)*m.dive;}}
  else{e.x+=e.vx*dt;e.y+=e.vy*dt;}e.hd=e.st===2?Math.atan2(e.vy,e.vx):Math.PI/2;},
 kamikaze(e,m,dt,R){const a=aimA(e,R),sp=(m.speed||130)*(e.scatter?1.6:1);e.vx+=(Math.cos(a)*sp-e.vx)*dt*(m.accel||1.4);e.vy+=(Math.sin(a)*sp-e.vy)*dt*(m.accel||1.4);if(e.t>(m.giveUp||7))e.vy=Math.max(e.vy,120);e.x+=e.vx*dt;e.y+=e.vy*dt;e.rot+=dt*4;e.hd=Math.atan2(e.vy,e.vx);},
 fall(e,m,dt){if(!e.vy)e.vy=m.speed;e.y+=e.vy*dt;e.vy*=m.drag;e.rot+=dt;},
 scatter(e,m,dt){e.x+=e.vx*dt;e.y+=e.vy*dt;e.vy+=40*dt;e.hd=Math.atan2(e.vy,e.vx);},
 exit(e,m,dt){e.x+=e.vx*dt;e.y+=e.vy*dt;e.hd=Math.atan2(e.vy,e.vx);},
 // formation path: follow a compiled path; rigid shapes add a (spinning) slot offset
 path(e,m,dt){const P=e.path;e.ps+=m.speed*dt;const q=SF.formations.sample(P,e.ps);let ox=0,oy=0;
  if(e.slot){const a=e.spin*e.t,c=Math.cos(a),s=Math.sin(a);ox=e.slot[0]*c-e.slot[1]*s;oy=e.slot[0]*s+e.slot[1]*c;}
  e.x=q.x+ox;e.y=q.y+oy;e.hd=e.slot&&e.spin?Math.PI/2:q.a;
  if(e.ps>=P.len){const th=e.then||P.then||'exit';
   if(th==='hover'){e.mv={type:'hover',y:0,hold:e.t+(e.hold||4),sway:30};e.ty=e.y;}
   else if(th==='dive'){e.mv={type:'dive',speed:Math.max(160,m.speed)};}
   else if(th==='kamikaze'){e.mv={type:'kamikaze',speed:140,accel:1.4,giveUp:6};}
   else{e.vx=Math.cos(q.a)*m.speed;e.vy=Math.sin(q.a)*m.speed;e.mv={type:'exit'};}}},
 // ground: scrolls with the landscape
 ground(e,m,dt){e.y+=SCROLL*dt;},
 patrol(e,m,dt){e.y+=SCROLL*m.scroll*dt;if(!e.vx)e.vx=(Math.random()<.5?-1:1)*m.vx;e.x+=e.vx*dt;if(e.x<e.wx0||e.x>e.wx1)e.vx=-e.vx;e.x=clamp(e.x,e.wx0,e.wx1);e.hd=e.vx>0?0:Math.PI;
  if(Math.random()<dt*12)SF.fx.add('w',e.x-Math.sign(e.vx)*18,e.y+rnd(-3,3),0,SCROLL*m.scroll,1.2,'#ffffff',rnd(2,4));},
 convoy(e,m,dt){e.y+=(SCROLL+m.vy)*dt;e.hd=Math.PI/2;},
 attached(e,m,dt){const p=e.parent;if(p&&p.alive){e.x=p.x+e.dx;e.y=p.y+e.dy;}else e.y+=SCROLL*dt;},
};
En.MOVE=MOVE;
// ---------- fire patterns ----------
function firePattern(e,R){const f=e.d.fire,a=aimA(e,R),k=f.bullet||'pellet';e.ang=a;
 switch(f.pattern){
  case 'aimed':En.shoot(e.x,e.y+(e.ground?0:10),a,f.speed,k);break;
  case 'fan':{const n=f.count,arc=f.spread*deg;for(let i=0;i<n;i++)En.shoot(e.x,e.y+10,a+(n>1?(i/(n-1)-.5)*arc:0),f.speed,k);break;}
  case 'burst':e.burst=f.burst;e.burstT=0;break;
  case 'ring':{const n=f.count,o=e.t;for(let i=0;i<n;i++)En.shoot(e.x,e.y,o+i*TAU/n,f.speed,k);break;}
  case 'spiral':{for(let i=0;i<f.arms;i++)En.shoot(e.x,e.y,e.t*2.1+i*TAU/f.arms,f.speed,k);break;}
  case 'mines':if(e.x>20&&e.x<W-20){En.spawn(f.spawn,{x:e.x,y:e.y+10});sfx('mine');}break;
  case 'mortar':{const dl=f.delay*Math.max(SF.DIFF_MIN_TELE,SF.BAL.run.tele||1);R.marks.push({x:R.p.x,y:R.p.y,t:dl,m:dl,r:f.radius,dmg:f.damage});sfx('mine');break;}}}
En.firePattern=firePattern;
function stepFire(e,dt,R){const f=e.d.fire;if(!f||f.pattern==='none'||e.scatter)return;
 if(e.burst>0){e.burstT-=dt;if(e.burstT<=0){e.burst--;e.burstT=f.gap;e.ang=aimA(e,R);En.shoot(e.x,e.y+(e.ground?0:10),e.ang,f.speed,f.bullet);}}
 if(f.pattern==='sniper'){stepSniper(e,f,dt,R);return;}
 if(e.ground)e.ang+=(((aimA(e,R)-e.ang+Math.PI*3)%TAU)-Math.PI)*Math.min(1,dt*4); // turrets track the player
 if(f.on)return; // fired by an ability (reveal / arrive / open)
 if(!fireY(e)||e.cloaked)return;
 if(f.maxShots&&e.shots>=f.maxShots)return;
 e.fireT-=dt*SF.dm('enemyFire')*(1+e.buff);if(e.fireT<=0){e.fireT=f.every*rnd(.85,1.15);e.shots++;firePattern(e,R);}}
function stepSniper(e,f,dt,R){ // aim (telegraph line) -> needle volley -> re-aim -> leave
 if(e.st===0){e.fireT-=dt;if(e.fireT<=0&&fireY(e)){e.st=1;e.stT=f.aim*Math.max(SF.DIFF_MIN_TELE,SF.BAL.run.tele||1);e.la=aimA(e,R);sfx('lance');}}
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
 if(A.fuse&&e.t>A.fuse.time){const f=A.fuse;for(let i=0;i<f.ring;i++)En.shoot(e.x,e.y,e.t+i*TAU/f.ring,f.speed,'ring');SF.fx.explode(e.x,e.y,1.1);sfx('pop');En.remove(e);return;}
 if(A.bunker){const b=A.bunker,c=b.closed+b.open,ph=e.t%c,was=e.open;e.open=ph>=b.closed;if(e.open&&!was&&fireY(e)){firePattern(e,R);sfx('mine');}}
 if(A.spawner&&e.y>20&&e.y<H*.75){e.spawnT-=dt;if(e.spawnT<=0){const s=A.spawner;e.spawnT=s.every;En.spawn(s.enemy,{x:e.x,y:e.y+(s.ground?e.r:0),group:0});SF.fx.smoke(e.x,e.y,6,'#555',.6);}}
 if(A.reinforce&&!e.called&&e.y>40&&e.t>A.reinforce.after){e.called=true;const r=A.reinforce;SF.formations.spawn(r.formation,{enemy:r.enemy});SF.fx.pop(e.x,e.y-24,r.label,true);say('reinf','The comms mast called in reinforcements! Hit those masts early.',1,30);}}
// auras (radar fire boost, shield domes) recomputed every step
function stepAuras(){for(const e of pool.live){e.buff=0;e.domed=0;}
 for(const s of pool.live){if(!s.alive||s.y<-20)continue;const A=s.d.abilities;if(!A)continue;
  if(A.buffAura){const r2=A.buffAura.range**2;for(const e of pool.live)if(e!==s&&(e.x-s.x)**2+(e.y-s.y)**2<r2)e.buff=Math.max(e.buff,A.buffAura.fire);}
  if(A.dome){const r2=A.dome.range**2;for(const e of pool.live)if(e!==s&&e.ground&&(e.x-s.x)**2+(e.y-s.y)**2<r2)e.domed=Math.max(e.domed||0,A.dome.reduce);}}}
// ---------- damage pipeline ----------
En.hit=(e,dmg,src)=>{if(!e.alive||e.untargetable)return 0;const A=e.d.abilities||{};
 if(e.invuln){if(Math.random()<.25&&src&&src.x!==undefined)SF.fx.spark(src.x,src.y||e.y,'#c9d2db',1);return 0;}
 if(e.guard)dmg*=1-e.guard;
 if(e.domed)dmg*=1-e.domed;
 if(A.bunker&&!e.open)dmg*=1-A.bunker.armor;
 if(A.guarded&&e.kids&&e.kids.some(k=>k.alive))dmg*=1-A.guarded.reduce;
 if(A.frontArmor&&src&&src.x!==undefined&&!src.special){if(Math.abs(src.x-e.x)<e.r*A.frontArmor.sideFrac){dmg*=1-A.frontArmor.reduce;e.armorT=.08;if(Math.random()<.3)SF.fx.spark(src.x,e.y+e.r*.6,'#c9d2db',1);}}
 if(e.sh>0){e.sh-=dmg;e.shHit=.12;e.lastHit=e.t;if(e.sh>=0)return 0;dmg=-e.sh;e.sh=0;SF.fx.spark(e.x,e.y,'#9fe8ff',6);sfx('zap');}
 e.hp-=dmg;e.flash=.06;if(e.hp<=0)En.kill(e,src);return dmg;};
En.kill=(e,src)=>{if(!e.alive)return;e.alive=false;const d=e.d,R=En.R,A=d.abilities||{},size=d.size||1;
 SF.fx.explode(e.x,e.y,size,e.ground);SF.fx.addShake(size>1.4?.2:.06);sfx(size>1.4?'boom':'pop');
 if(e.ground){addDecal(e.x,e.y,e.r*1.6);SF.fx.wreck(e.x,e.y,size);}
 if(A.split){const s=A.split;for(let i=0;i<s.count;i++){const a=i/s.count*TAU;En.spawn(s.into,{x:e.x+Math.cos(a)*20,y:e.y+Math.sin(a)*20,vx:Math.cos(a)*s.speed,vy:Math.sin(a)*s.speed,group:e.group});}}
 if(A.captain&&e.group){let n=0;for(const o of pool.live)if(o.alive&&o!==e&&o.group===e.group&&!o.ground){o.scatter=true;o.vx=(o.x<e.x?-1:1)*rnd(120,200);o.vy=rnd(-40,40);n++;}
  if(n){SF.fx.pop(e.x,e.y-20,'LEADER DOWN',true);SF.emit('captainDown',{e,n,bonus:A.captain.bonus});}}
 if(A.chain){const c=A.chain;SF.fx.explode(e.x,e.y,2.4,true);SF.fx.ring(e.x,e.y,c.radius,'#ffb347',.4);
  for(const o of pool.live)if(o!==e&&o.alive&&(o.x-e.x)**2+(o.y-e.y)**2<c.radius**2)setTimeoutChain(o,c.damage);}
 if(A.buffAura&&A.buffAura.label)SF.fx.pop(e.x,e.y-24,A.buffAura.label,true);
 if(A.dome&&A.dome.label)SF.fx.pop(e.x,e.y-24,A.dome.label,true);
 SF.emit('kill',{e,src});
 if(e.kids)for(const k of e.kids)if(k.alive)En.kill(k,src);
 En.remove(e);};
// chain explosions land a moment later so the chain reads as a ripple
const chainQ=[];function setTimeoutChain(o,dmg){chainQ.push({o,dmg,t:.12});}
En.remove=e=>{if(e.alive){e.alive=false;SF.emit('escape',{e});}if(e.m){release(e.m);e.m=null;}pool.kill(e);};
En.reset=()=>{for(const e of pool.live)if(e.m){release(e.m);e.m=null;}pool.clear();ebPool.clear();grid.reset();chainQ.length=0;};
// ---------- step ----------
En.step=(R,dt)=>{const p=R.p,L=pool.live,mv=SF.dm('enemySpeed'),pad=BAL().enemy.offscreenPad,GB=BAL().ground;
 for(let i=chainQ.length-1;i>=0;i--){const c=chainQ[i];c.t-=dt;if(c.t<=0){chainQ.splice(i,1);if(c.o.alive)En.hit(c.o,c.dmg,{special:1,chain:1});}}
 stepAuras();
 for(let i=L.length-1;i>=0;i--){const e=L[i];if(!e.alive)continue;e.ox=e.x;e.oy=e.y;
  if(e.delay>0){e.delay-=dt;continue;}
  const edt=e.ground?dt:dt*mv;e.t+=edt;if(e.flash>0)e.flash-=dt;if(e.armorT>0)e.armorT-=dt;if(e.ft>0)e.ft-=dt;
  if(e.seen<0&&e.y>0)e.seen=e.t;
  const m=e.mv||e.d.move;(e.scatter?MOVE.scatter:MOVE[m.type]||MOVE.none)(e,m,edt,R);
  stepAbilities(e,edt,R);if(!e.alive)continue;
  stepFire(e,dt,R);
  e.roll+=(clamp(-(e.vx||0)/300,-.6,.6)-e.roll)*Math.min(1,dt*6);
  if(e.ground&&e.hp<e.max*GB.smokeBelow&&Math.random()<dt*6)SF.fx.add('s',e.x+rnd(-6,6),e.y,rnd(-6,6),-30,rnd(.8,1.3),'#3a3430',rnd(4,7),{scroll:1,drag:.98});
  // ram the player (air units only)
  if(!e.ground&&p.alive&&p.dying<=0&&!e.untargetable&&(e.x-p.x)**2+(e.y-p.y)**2<(e.r*.8+BAL().player.hitR+4)**2){
   if(SF.player.hurt(R,e.d.ram||BAL().player.collideDamage)){if(e.d.dieOnRam)En.kill(e);else En.hit(e,BAL().enemy.collideRam,null);}}
  if(e.alive&&!e.d.bossPart&&(e.y>H+pad||e.x<-pad-60||e.x>W+pad+60||(e.y<-260&&e.t>6)))En.remove(e);}
 // grid for player bullets
 // sealed (invulnerable) boss parts are skipped so shots fly past them to the parts behind
 grid.reset();for(const e of L)if(e.alive&&!e.delay&&!e.untargetable&&!e.invuln&&e.y>-40)grid.add(e,e.x,e.y,e.r+10);
 // mortar marks
 for(const mk of R.marks){mk.t-=dt;if(mk.t<=0){mk.dead=1;SF.fx.explode(mk.x,mk.y,1.5,true);addDecal(mk.x,mk.y,mk.r*.8);sfx('boom');SF.fx.addShake(.15);
  if(p.alive&&(p.x-mk.x)**2+(p.y-mk.y)**2<mk.r*mk.r)SF.player.hurt(R,mk.dmg);}}prune(R.marks,m=>!m.dead);
 // enemy bullets
 const B=ebPool.live,hr=BAL().player.hitR;
 for(let i=B.length-1;i>=0;i--){const b=B[i];b.ox=b.x;b.oy=b.y;
  if(b.B.homing){b.life-=dt;if(b.life>1){let a=Math.atan2(b.vy,b.vx),da=Math.atan2(p.y-b.y,p.x-b.x)-a;while(da>Math.PI)da-=TAU;while(da<-Math.PI)da+=TAU;a+=clamp(da,-b.B.homing*dt,b.B.homing*dt);const sp=Math.hypot(b.vx,b.vy);b.vx=Math.cos(a)*sp;b.vy=Math.sin(a)*sp;}if(Math.random()<.5)SF.fx.smoke(b.x,b.y,2.5,'#bbb',.4);}
  b.x+=b.vx*dt;b.y+=b.vy*dt;
  if(p.alive&&p.dying<=0&&(b.x-p.x)**2+(b.y-p.y)**2<(b.r+hr)**2){if(SF.player.hurt(R,b.dmg)||p.inv>0){ebPool.kill(b);continue;}}
  if(b.y<-40||b.y>H+30||b.x<-60||b.x>W+60)ebPool.kill(b);}
 for(const bm of R.beams)bm.t-=dt;prune(R.beams,b=>b.t>0);};
// ---------- 3D sync ----------
En.sync=(A,dt)=>{for(const e of pool.live){if(!e.alive||!e.d.model)continue;if(!e.m)e.m=acquire(e.d.model);const m=e.m;m.visible=!e.delay;if(!m.visible)continue;
 const x=e.ox+(e.x-e.ox)*A,y=e.oy+(e.y-e.oy)*A,T=e.d.model;place(m,x,y,e.ground,T==='mine'?-.5:0);if(e.d.scale)m.scale.multiplyScalar(e.d.scale);
 const a=e.hd!==undefined?e.hd:Math.PI/2+(e.rot||0);m.rotation.set(0,e.ground&&e.d.move.type!=='convoy'&&e.d.move.type!=='patrol'?0:yawFrom(a),e.ground?0:e.roll);
 if(T==='drone'||T==='sower'||T==='hydra'||T==='mine')m.rotation.y=e.rot;
 if(T==='heli'||T==='hornet'||T==='mender')m.rotation.set(.12,yawFrom(Math.PI/2),e.rot);
 for(const r of m.R.rotor)r.rotation.y+=dt*30;if(m.R.trot)m.R.trot.rotation.x+=dt*40;
 if(m.R.tur)m.R.tur.rotation.y=T==='radar'?e.t*2.2:yawFrom(e.ang)-m.rotation.y;
 if(m.R.door)m.R.door.position.y=e.open?.9:.2;
 if(m.R.ring.length){m.R.ring.forEach((r,i)=>{r.rotation.z+=dt*(i?-3:3);});if(T==='blink'){const s=e.tp>0?Math.max(.05,e.tp/.35*.3):Math.min(1,e.stT*4);m.scale.multiplyScalar(s);}}
 if(m.R.shield){if(T==='aegis'){m.R.shield.visible=e.sh>0;m.R.shield.material.opacity=.18+(e.shHit>0?.4:0)+.1*Math.sin(e.t*6);}else m.R.shield.material.opacity=.14+.06*Math.sin(e.t*3);}
 if(m.R.light){if(T==='mine')m.R.light.visible=e.t<3?Math.floor(e.t*3)%2===0:Math.floor(e.t*12)%2===0;else m.R.light.scale.setScalar(1+.25*Math.sin(e.t*(e.d.abilities&&e.d.abilities.reinforce?14:6)));}
 if(T==='wraith'){const op=e.cloaked?.1:1;m.traverse(o=>{if(o.isMesh){o.material.opacity+=(op-o.material.opacity)*Math.min(1,dt*8);o.castShadow=!e.cloaked;}});}}};
// ---------- overlay ----------
En.drawTele=(R,A)=>{for(const e of pool.live){if(!e.alive)continue;
 if(e.d.fire&&e.d.fire.pattern==='sniper'&&e.st===1){const L=clipLen(e.x,e.y,Math.cos(e.la),Math.sin(e.la));pj(e.x,e.y);const x0=PX,y0=PY;pj(e.x+Math.cos(e.la)*L,e.y+Math.sin(e.la)*L);
  cx.strokeStyle=`rgba(255,40,60,${.35+.45*Math.abs(Math.sin(e.stT*30))})`;cx.lineWidth=1.6;cx.setLineDash([8,6]);cx.beginPath();cx.moveTo(x0,y0);cx.lineTo(PX,PY);cx.stroke();cx.setLineDash([]);}
 if(e.d.move.type==='hawk'&&e.st===1){pj(e.x,e.y);const x0=PX,y0=PY;pj(e.lockX,e.lockY);cx.strokeStyle=`rgba(255,180,60,${.3+.5*Math.abs(Math.sin(e.stT*24))})`;cx.lineWidth=2;cx.setLineDash([4,6]);cx.beginPath();cx.moveTo(x0,y0);cx.lineTo(PX,PY);cx.stroke();cx.setLineDash([]);}
 const Ab=e.d.abilities;if(Ab&&(Ab.buffAura||Ab.dome)&&e.y>-20){const r=(Ab.buffAura||Ab.dome).range;pj(e.x,e.y);cx.strokeStyle=Ab.dome?'rgba(95,200,255,.28)':'rgba(255,90,90,.22)';cx.lineWidth=1.5;cx.setLineDash([3,7]);cx.beginPath();cx.ellipse(PX,PY,r*PS,r*PS*.85,0,0,TAU);cx.stroke();cx.setLineDash([]);}}
 for(const mk of R.marks){pj(mk.x,mk.y);const a=1-mk.t/mk.m;cx.strokeStyle=`rgba(255,60,70,${.4+.5*Math.abs(Math.sin(mk.t*14))})`;cx.lineWidth=2;cx.beginPath();cx.ellipse(PX,PY,mk.r*PS,mk.r*PS*.8,0,0,TAU);cx.stroke();cx.fillStyle=`rgba(255,60,70,${.12+a*.25})`;cx.beginPath();cx.ellipse(PX,PY,mk.r*PS*a,mk.r*PS*.8*a,0,0,TAU);cx.fill();
  cx.beginPath();cx.moveTo(PX-8,PY);cx.lineTo(PX+8,PY);cx.moveTo(PX,PY-8);cx.lineTo(PX,PY+8);cx.stroke();}
 for(const b of R.beams){pj(b.a.x,b.a.y);const x0=PX,y0=PY;pj(b.b.x,b.b.y);cx.strokeStyle='#7fffb0';cx.globalAlpha=b.t/.45;cx.lineWidth=3;cx.beginPath();cx.moveTo(x0,y0);cx.lineTo(PX,PY);cx.stroke();cx.lineWidth=8;cx.globalAlpha*=.3;cx.stroke();cx.globalAlpha=1;}};
En.drawFlash=A=>{cx.globalCompositeOperation='lighter';for(const e of pool.live){if(!e.alive||e.delay)continue;const x=e.ox+(e.x-e.ox)*A,y=e.oy+(e.y-e.oy)*A;
 if(e.flash>0&&e.m&&e.m.visible)pdg(x,y,e.r*1.3,'#ffffff');if(e.armorT>0)pdg(x,y+e.r*.5,e.r*.9,'#c9d2db');
 if(e.domed&&e.flash>0)pdg(x,y,e.r*1.6,'#5fc8ff');
 if(e.buff>0&&Math.floor(e.t*4)%2===0)pdg(x,y-e.r,6,'#ff5a5a');
 if(e.d.abilities&&e.d.abilities.teleport&&e.tp>0)pdg(x,y,30,'#c07bff');
 if(e.d.abilities&&e.d.abilities.reinforce&&!e.called)pdg(x,y-e.r,8+4*Math.sin(e.t*14),'#ff3c50');
 if(e.d.fire&&e.d.fire.pattern==='sniper'&&e.st===1)pdg(x+Math.cos(e.la)*16,y+Math.sin(e.la)*16,8+Math.random()*5,'#ff3c50');
 if(e.d.move.type==='hawk'&&e.st===1)pdg(x,y,e.r*1.4,'#ffb347');}cx.globalCompositeOperation='source-over';};
En.drawBullets=A=>{for(const b of ebPool.live){const x=b.ox+(b.x-b.ox)*A,y=b.oy+(b.y-b.oy)*A,img=SP[b.B.sprite];
 if(b.B.orient){pspr(img,x,y,Math.atan2(b.vx,-b.vy)+Math.PI);if(b.B.homing){cx.globalCompositeOperation='lighter';pdg(x-b.vx*.04,y-b.vy*.04,7,'#ff7a2e');cx.globalCompositeOperation='source-over';}}
 else pspr(img,x,y);}};
})();
