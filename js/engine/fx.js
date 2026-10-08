'use strict';
// ============ EFFECTS (new engine) ============
// Pooled particles drawn on the 2D overlay through the same camera projection as the 3D world.
// Kinds: f fire glow, k spark streak, s smoke, d debris, o shock ring, g soft glow, w water wake
(()=>{
const parts=new SF.Pool(()=>({}),900),pops=new SF.Pool(()=>({}),40);
const fx=SF.fx={shake:0,flash:0,hurt:0,parts,pops};
const cap=()=>SF.BAL.caps.parts[save.hq?0:1];
function add(k,x,y,vx,vy,l,c,r,extra){if(parts.live.length>=cap())return null;const q=parts.get();if(!q)return null;
 q.k=k;q.x=x;q.y=y;q.vx=vx;q.vy=vy;q.l=l;q.m=l;q.c=c;q.r=r;q.a=0;q.va=0;q.drag=.94;q.scroll=0;if(extra)Object.assign(q,extra);return q;}
fx.add=add;
fx.reset=()=>{parts.clear();wrecks.length=0;pops.clear();fx.shake=0;fx.flash=0;fx.hurt=0;};
fx.explode=(x,y,size=1,ground)=>{const hq=save.hq,n=Math.min(40,(hq?8:4)+size*(hq?10:5));
 for(let i=0;i<n;i++){const a=Math.random()*TAU,v=Math.random()*90*size+30;add('f',x,y,Math.cos(a)*v,Math.sin(a)*v,rnd(.25,.6),Math.random()<.4?'#ffe08a':'#ff7a2e',rnd(6,12)*Math.sqrt(size));}
 for(let i=0;i<n/2;i++){const a=Math.random()*TAU,v=rnd(150,400)*Math.sqrt(size);add('k',x,y,Math.cos(a)*v,Math.sin(a)*v,rnd(.2,.45),'#fff3c4',1.6);}
 for(let i=0;i<size*(hq?3:1.5);i++)add('s',x+rnd(-8,8)*size,y+rnd(-8,8)*size,rnd(-20,20),rnd(-20,20),rnd(.7,1.3),'#2a2420',rnd(6,10)*size,{scroll:.6});
 for(let i=0;i<size*2.2;i++){const a=Math.random()*TAU,v=rnd(60,220);add('d',x,y,Math.cos(a)*v,Math.sin(a)*v,rnd(.4,.9),pick(['#2a2c30','#4a4d52','#6b5a44']),rnd(1.5,3.5),{a:Math.random()*6,va:rnd(-12,12),drag:.95});}
 add('o',x,y,0,0,.35,'#ffffff',14*size);add('g',x,y,0,0,.18,'#fff3c4',26*size);
 if(size>=1.4)flashLight(x,y,size,ground);};
fx.spark=(x,y,c='#fff3c4',n=2,spd=1)=>{for(let i=0;i<n;i++){const a=Math.random()*TAU,v=rnd(60,200)*spd;add('k',x,y,Math.cos(a)*v,Math.sin(a)*v,rnd(.1,.25),c,1.2);}};
fx.impact=(x,y,tier,c)=>{const T=SF.TIERS[tier];add('g',x,y,0,-20,.08,c||T.glow,6+T.flash*.6);if(Math.random()<.55)fx.spark(x,y,T.core,1+(tier>>1),T.impact);};
fx.ring=(x,y,r,c='#ffffff',l=.35)=>add('o',x,y,0,0,l,c,r);
fx.glow=(x,y,r,c,l=.2)=>add('g',x,y,0,0,l,c,r);
fx.smoke=(x,y,r=3,c='#cfd6dc',l=.35)=>add('s',x,y,0,0,l,c,r);
fx.pop=(x,y,t,big)=>{const q=pops.get();if(!q)return;q.x=x;q.y=y;q.t=t;q.l=.8;q.big=!!big;};
// burning wreck: a smoke column that scrolls with the ground for a few seconds
const wrecks=[];
fx.wreck=(x,y,size)=>{if(wrecks.length<12)wrecks.push({x,y,t:SF.BAL.ground.wreckSmoke*(save.hq?1:.5),s:size});};
fx.addShake=v=>{fx.shake=Math.max(fx.shake,v);};
fx.step=dt=>{if(fx.shake>0)fx.shake-=dt;
 for(let i=wrecks.length-1;i>=0;i--){const w=wrecks[i];w.t-=dt;w.y+=SCROLL*dt;if(w.t<=0||w.y>H+40){wrecks.splice(i,1);continue;}
  if(Math.random()<dt*(save.hq?9:4)){add('s',w.x+rnd(-5,5),w.y,rnd(-8,8),-35,rnd(1,1.6),'#2e2a28',rnd(4,7)*Math.sqrt(w.s),{scroll:1,drag:.985});if(Math.random()<.3)add('f',w.x+rnd(-4,4),w.y,0,-20,.3,'#ff7a2e',5);}}if(fx.flash>0)fx.flash-=dt;if(fx.hurt>0)fx.hurt-=dt;
 const L=parts.live;for(let i=L.length-1;i>=0;i--){const q=L[i];q.x+=q.vx*dt;q.y+=q.vy*dt;q.l-=dt;
  if(q.k!=='w'){q.vx*=q.drag;q.vy*=q.drag;}if(q.k==='d')q.a+=q.va*dt;if(q.scroll)q.y+=SCROLL*dt*q.scroll;if(q.l<=0)parts.kill(q);}
 const P=pops.live;for(let i=P.length-1;i>=0;i--){const q=P[i];q.y-=40*dt;q.l-=dt;if(q.l<=0)pops.kill(q);}};
// ---- drawing ----
fx.drawBack=()=>{const L=parts.live;
 for(const q of L){if(q.k==='s'){pj(q.x,q.y);cx.globalAlpha=Math.max(0,q.l/q.m)*.5;cx.fillStyle=q.c;cx.beginPath();cx.arc(PX,PY,q.r*(1.7-q.l/q.m*.7)*PS,0,TAU);cx.fill();}
  else if(q.k==='d'){pj(q.x,q.y);cx.globalAlpha=Math.max(0,q.l/q.m);cx.save();cx.translate(PX,PY);cx.rotate(q.a);cx.fillStyle=q.c;cx.fillRect(-q.r*PS,-q.r*.6*PS,q.r*2*PS,q.r*1.2*PS);cx.restore();}
  else if(q.k==='w'){pj(q.x,q.y);cx.globalAlpha=Math.max(0,q.l/q.m)*.55;cx.fillStyle=q.c;cx.beginPath();cx.arc(PX,PY,q.r*(2-q.l/q.m)*PS*.8,0,TAU);cx.fill();}}
 cx.globalAlpha=1;};
fx.drawFront=()=>{cx.globalCompositeOperation='lighter';
 for(const q of parts.live){if(q.k==='s'||q.k==='d'||q.k==='w')continue;const a=Math.max(0,q.l/q.m);cx.globalAlpha=a;pj(q.x,q.y);
  if(q.k==='f')dg(PX,PY,q.r*(.6+a*.6)*PS,q.c);
  else if(q.k==='g')dg(PX,PY,q.r*(1.4-a*.4)*PS,q.c);
  else if(q.k==='k'){const x0=PX,y0=PY;pj(q.x-q.vx*.04,q.y-q.vy*.04);cx.strokeStyle=q.c;cx.lineWidth=1.8;cx.beginPath();cx.moveTo(x0,y0);cx.lineTo(PX,PY);cx.stroke();}
  else if(q.k==='o'){cx.strokeStyle=q.c;cx.lineWidth=3*a+1;cx.beginPath();cx.ellipse(PX,PY,q.r*(1.2-a)*PS,q.r*(1.2-a)*PS*.85,0,0,TAU);cx.stroke();}}
 cx.globalAlpha=1;cx.globalCompositeOperation='source-over';};
fx.drawPops=()=>{cx.textAlign='center';for(const q of pops.live){pj(q.x,q.y);cx.globalAlpha=Math.min(1,q.l*2);cx.font=(q.big?'16px':'12px')+' Bungee, Impact, sans-serif';
 cx.fillStyle='rgba(0,0,0,.55)';cx.fillText(q.t,PX+1,PY+2);cx.fillStyle=q.big?'#ffd27a':'#fff';cx.fillText(q.t,PX,PY);}cx.globalAlpha=1;};
})();
