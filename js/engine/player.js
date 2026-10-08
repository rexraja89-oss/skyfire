'use strict';
// ============ PLAYER (new engine) ============
// Relative-drag control: the finger moves a target point, the jet follows it with a critically damped
// smoothing step (snappy, never overshoots, frame-rate independent). Small real hitbox, i-frames,
// death sequence with slow motion, and the Skyburst special attack.
(()=>{
const B=()=>SF.BAL.player,S=()=>SF.BAL.special;
// critically damped smoothing (per axis); returns new position, stores velocity in o[vk]
function smooth(o,k,vk,target,st,maxV,dt){const om=2/st,x=om*dt,ex=1/(1+x+.48*x*x+.235*x*x*x);let ch=o[k]-target;const mc=maxV*st;ch=clamp(ch,-mc,mc);
 const tgt=o[k]-ch,tmp=(o[vk]+om*ch)*dt;o[vk]=(o[vk]-om*tmp)*ex;let out=tgt+(ch+tmp)*ex;if((target-o[k]>0)===(out>target)){out=target;o[vk]=(out-target)/dt;}o[k]=out;}
const P=SF.player={
 create(R){const pl=PLANES[save.plane],pt=save.parts,b=B(),max=b.baseHp*pl.hp/100+b.armorPerLevel*pt.armor,y=lyAt(.8);
  const s=S(),ch=Math.min(s.maxCharges,s.startCharges+Math.floor(pt.bomb*s.bonusChargesPerBombPart)+(pl.bombs||0));
  const p={x:W/2,y,ox:W/2,oy:y,tx:W/2,ty:y,vx:0,vy:0,hp:max,max,inv:1.5,bank:0,dying:0,alive:true,hurtT:0,fc:0,mc:0,muzzle:0,
   lvl:SF.weapons.startLevel(),meter:0,charges:ch,beam:null,burst:null,deaths:0,pl};
  R.p=p;return p;},
 // finger drag in logic px (already scaled for perspective by the caller)
 drag(R,dx,dy){const p=R.p,b=B(),g=b.dragGain*(save.sens||1);p.tx+=dx*g;p.ty+=dy*g*1.1;P.clampTarget(p);},
 clampTarget(p){const b=B();p.tx=clamp(p.tx,b.edge,W-b.edge);p.ty=clamp(p.ty,lyAt(b.topFrac),H-b.bottomPad);},
 step(R,dt){const p=R.p,b=B(),pl=p.pl;p.ox=p.x;p.oy=p.y;
  if(p.inv>0)p.inv-=dt;if(p.hurtT>0)p.hurtT-=dt;if(p.muzzle>0)p.muzzle-=dt;
  if(p.dying>0){p.dying-=dt;p.y+=40*dt;if(Math.random()<dt*10)SF.fx.explode(p.x+rnd(-14,14),p.y+rnd(-14,14),rnd(.6,1.2));
   if(p.dying<=0)P.respawn(R);return;}
  const kx=(keys.ArrowRight||keys.d?1:0)-(keys.ArrowLeft||keys.a?1:0),ky=(keys.ArrowDown||keys.s?1:0)-(keys.ArrowUp||keys.w?1:0);
  if(kx||ky){p.tx+=kx*b.keySpeed*pl.spd*dt;p.ty+=ky*b.keySpeed*pl.spd*dt;P.clampTarget(p);}
  const st=b.smoothTime/Math.sqrt(pl.spd),mv=b.maxSpeed*pl.spd;smooth(p,'x','vx',p.tx,st,mv,dt);smooth(p,'y','vy',p.ty,st,mv,dt);
  p.bank+=(clamp(p.vx/360,-1,1)-p.bank)*Math.min(1,dt*12);
  if(p.burst)P.stepBurst(R,dt);},
 hurt(R,dmg){const p=R.p,b=B();if(save.god||p.inv>0||!p.alive||p.dying>0)return false;
  p.hp-=dmg*SF.BAL.mul.enemyDamage;p.inv=b.iframes;p.hurtT=.35;SF.fx.hurt=.35;SF.fx.addShake(b.hitShake);SF.fx.spark(p.x,p.y,'#ffffff',10,1.3);sfx('hurt');vib(40);
  SF.emit('playerHit',{dmg});
  if(p.hp<=0){p.hp=0;P.die(R);}return true;},
 die(R){const p=R.p,b=B();p.alive=false;p.dying=b.deathTime;p.deaths++;R.slow=b.deathSlowmo;SF.fx.explode(p.x,p.y,2.6);SF.fx.flash=.35;SF.fx.addShake(.6);sfx('boom');vib(200);
  p.beam=null;SF.emit('playerDown',{});},
 respawn(R){const p=R.p,b=B();p.alive=true;p.hp=p.max;p.inv=b.respawnInv;p.x=p.tx=W/2;p.y=p.ty=lyAt(.8);p.ox=p.x;p.oy=p.y;p.vx=p.vy=0;
  p.lvl=Math.max(SF.weapons.startLevel(),p.lvl-SF.BAL.weapon.deathLevelLoss);SF.emit('respawn',{});},
 heal(R,f){const p=R.p;p.hp=Math.min(p.max,p.hp+p.max*f);},
 // ---- Skyburst special ----
 addMeter(R,v){const p=R.p,s=S();if(p.charges>=s.maxCharges){p.meter=s.meterMax;return;}p.meter+=v;
  while(p.meter>=s.meterMax&&p.charges<s.maxCharges){p.meter-=s.meterMax;p.charges++;SF.emit('specialReady',{charges:p.charges});}
  if(p.charges>=s.maxCharges)p.meter=Math.min(p.meter,s.meterMax);},
 special(R){const p=R.p,s=S();if(!p.alive||p.dying>0||p.charges<=0||p.burst)return false;p.charges--;
  p.burst={x:p.x,y:p.y,t:0,hit:new Set()};p.inv=Math.max(p.inv,s.inv);SF.fx.flash=.5;SF.fx.addShake(.5);sfx('bomb');vib(120);flashLight(p.x,p.y,3,false);
  SF.emit('special',{});return true;},
 stepBurst(R,dt){const p=R.p,s=S(),bu=p.burst;bu.t+=dt;const f=Math.min(1,bu.t/s.expandTime),r=s.radius*(1-(1-f)*(1-f));bu.r=r;bu.x=p.x;bu.y=p.y;
  const eb=SF.enemies.ebPool.live;for(let i=eb.length-1;i>=0;i--){const b=eb[i];if((b.x-bu.x)**2+(b.y-bu.y)**2<r*r){if(Math.random()<.35)SF.fx.spark(b.x,b.y,'#ffffff',1);SF.enemies.ebPool.kill(b);}}
  const dmg=s.damage*(1+.1*save.parts.bomb);
  for(const e of SF.enemies.list()){if(!e.alive||bu.hit.has(e)||e.untargetable)continue;if((e.x-bu.x)**2+(e.y-bu.y)**2<(r+e.r)**2){bu.hit.add(e);SF.enemies.hit(e,dmg,{special:1});}}
  if(f>=1)p.burst=null;},
};
})();
