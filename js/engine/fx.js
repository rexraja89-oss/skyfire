'use strict';
// ============ EFFECTS (new engine) ============
// Pooled particles drawn on the 2D overlay through the same camera projection as the 3D world.
// Kinds: f fire glow, b fireball, e ember, k spark streak, s smoke, d debris, o shock ring, g soft glow, w water wake
// Explosions are layered: white flash → fireballs → sparks and embers → smoking debris → smoke that lingers → shock ring.
(()=>{
const parts=new SF.Pool(()=>({}),900),pops=new SF.Pool(()=>({}),40);
const fx=SF.fx={shake:0,flash:0,hurt:0,parts,pops};
const cap=()=>SF.BAL.caps.parts[save.hq?0:1];
function add(k,x,y,vx,vy,l,c,r,extra){if(parts.live.length>=cap())return null;const q=parts.get();if(!q)return null;
 q.k=k;q.x=x;q.y=y;q.vx=vx;q.vy=vy;q.l=l;q.m=l;q.c=c;q.r=r;q.a=0;q.va=0;q.drag=.94;q.scroll=0;q.rot=Math.random()*TAU;if(extra)Object.assign(q,extra);return q;}
fx.add=add;
fx.reset=()=>{parts.clear();wrecks.length=0;pops.clear();fx.shake=0;fx.flash=0;fx.hurt=0;};
fx.explode=(x,y,size=1,ground)=>{SF.sndX=x;   // the next sound plays from this side
 const hq=save.hq,q=Math.sqrt(size),sc=ground?1:.35,E=SF.BAL.fx;
 // 1 flash
 add('g',x,y,0,0,.1,'#ffffff',30*size);add('g',x,y,0,0,.22,'#fff3c4',24*size);
 // 2 fireballs: rolling balls of flame that swell and cool
 const bl=fbReady(FB.blast);if(bl){add('X',x,y,rnd(-6,6),rnd(-6,6),rnd(.62,.78)*(.9+.1*q),'',(hq?34:30)*q*(.9+Math.random()*.2),{drag:.92,scroll:sc});if(size>1.3)add('X',x+rnd(-9,9)*q,y+rnd(-9,9)*q,0,0,.85,'',20*q,{drag:.92,scroll:sc});}   // main blast
 const nb=Math.min(14,Math.round(((hq?4:2)+size*(hq?3:1.5))*(bl?.55:1)));
 for(let i=0;i<nb;i++){const a=Math.random()*TAU,v=rnd(15,75)*q,o=rnd(0,7)*q;add('b',x+Math.cos(a)*o,y+Math.sin(a)*o,Math.cos(a)*v,Math.sin(a)*v,rnd(.55,.95)*(.85+.15*q),'',rnd(12,19)*q,{drag:.9,scroll:sc});}
 // 3 hot glow under the fire + sparks + embers
 const n=Math.min(30,(hq?6:3)+size*(hq?6:3));
 for(let i=0;i<n;i++){const a=Math.random()*TAU,v=Math.random()*80*size+25;add('f',x,y,Math.cos(a)*v,Math.sin(a)*v,rnd(.2,.45),Math.random()<.4?'#ffe08a':'#ff7a2e',rnd(5,10)*q);}
 for(let i=0;i<n*.8;i++){const a=Math.random()*TAU,v=rnd(180,480)*q;add('k',x,y,Math.cos(a)*v,Math.sin(a)*v,rnd(.18,.5),Math.random()<.5?'#fff3c4':'#ffc46b',1.6,{drag:.92});}
 if(hq)for(let i=0;i<3+size*3;i++){const a=Math.random()*TAU,v=rnd(40,140)*q;add('e',x,y,Math.cos(a)*v,Math.sin(a)*v-20,rnd(.8,1.6),Math.random()<.5?'#ffb347':'#ff6a2a',rnd(1.6,2.6),{drag:.96,scroll:sc});}
 // 4 debris: chunks that tumble outwards, bigger blasts trail smoke
 for(let i=0;i<2+size*2.5;i++){const a=Math.random()*TAU,v=rnd(70,240)*q;add('d',x,y,Math.cos(a)*v,Math.sin(a)*v,rnd(.5,1.1),pick(['#2a2c30','#4a4d52','#6b5a44','#3a3026']),rnd(1.5,3.8),{a:Math.random()*6,va:rnd(-14,14),drag:.95,trail:size>=1.2&&Math.random()<.6?.022:0,tt:0});}
 // 5 smoke that lingers (dark, grows slowly, drifts with the ground for ground blasts)
 const ns=Math.round(size*(hq?3:1.5)+1);
 for(let i=0;i<ns;i++)add('s',x+rnd(-9,9)*q,y+rnd(-9,9)*q,rnd(-18,18),rnd(-24,6),rnd(1.6,2.8)*E.smokeLife*(hq?1:.7),pick(['#231f1c','#2e2924','#3b342d','#4a4038']),rnd(10,16)*q,{scroll:ground?1:.5,drag:.97,d:.62});
 // 6 shock ring (+ dust ring on the ground)
 add('o',x,y,0,0,.32,'#ffffff',16*size);if(ground)add('o',x,y,0,0,.6,'#c9b48a',22*size);
 if(size>=1.4)flashLight(x,y,size,ground);};
fx.spark=(x,y,c='#fff3c4',n=2,spd=1)=>{for(let i=0;i<n;i++){const a=Math.random()*TAU,v=rnd(60,200)*spd;add('k',x,y,Math.cos(a)*v,Math.sin(a)*v,rnd(.1,.25),c,1.2);}};
fx.impact=(x,y,tier,c)=>{const T=SF.TIERS[tier];add('g',x,y,0,-20,.08,c||T.glow,6+T.flash*.6);if(Math.random()<.55)fx.spark(x,y,T.core,1+(tier>>1),T.impact);};
fx.ring=(x,y,r,c='#ffffff',l=.35)=>add('o',x,y,0,0,l,c,r);
fx.glow=(x,y,r,c,l=.2)=>add('g',x,y,0,0,l,c,r);
fx.smoke=(x,y,r=3,c='#cfd6dc',l=.35)=>add('s',x,y,0,0,l,c,r);
fx.pop=(x,y,t,big)=>{const q=pops.get();if(!q)return;q.x=x;q.y=y;q.t=t;q.l=.8;q.big=!!big;};
// burning wreck: a smoke column that scrolls with the ground for a few seconds
const wrecks=[];
fx.wreck=(x,y,size)=>{if(wrecks.length<14){const t=SF.BAL.ground.wreckSmoke*(save.hq?1:.5);wrecks.push({x,y,t,m:t,s:size,ph:Math.random()*9});}};
fx.addShake=v=>{fx.shake=Math.max(fx.shake,v);};
fx.step=dt=>{if(fx.shake>0)fx.shake-=dt;
 for(let i=wrecks.length-1;i>=0;i--){const w=wrecks[i];w.t-=dt;w.y+=SCROLL*dt;if(w.t<=0||w.y>H+40){wrecks.splice(i,1);continue;}
  const k=Math.min(1,w.t/w.m*1.6);   // fire dies down over the wreck's life, smoke keeps going
  if(Math.random()<dt*(save.hq?9:4)){add('s',w.x+rnd(-5,5),w.y,rnd(-8,8),-35,rnd(1.2,2),'#2e2a28',rnd(4,7)*Math.sqrt(w.s),{scroll:1,drag:.985,d:.55});if(Math.random()<.45*k)add('f',w.x+rnd(-4,4),w.y,0,-20,.3,'#ff7a2e',5*Math.sqrt(w.s));}
  if(save.hq&&Math.random()<dt*2.5*k)add('e',w.x+rnd(-4,4),w.y,rnd(-15,15),rnd(-50,-25),rnd(.6,1.1),'#ffb347',1.6,{scroll:1,drag:.98});}if(fx.flash>0)fx.flash-=dt;if(fx.hurt>0)fx.hurt-=dt;
 const L=parts.live;for(let i=L.length-1;i>=0;i--){const q=L[i];q.x+=q.vx*dt;q.y+=q.vy*dt;q.l-=dt;
  if(q.k!=='w'){const dr=Math.pow(q.drag,dt*60);q.vx*=dr;q.vy*=dr;}if(q.k==='d'){q.a+=q.va*dt;if(q.trail&&(q.tt-=dt)<=0){q.tt=q.trail;add('s',q.x,q.y,0,0,.75,'#3a332c',3.6,{d:.5});}}if(q.scroll)q.y+=SCROLL*dt*q.scroll;if(q.l<=0)parts.kill(q);}
 const P=pops.live;for(let i=P.length-1;i>=0;i--){const q=P[i];q.y-=40*dt;q.l-=dt;if(q.l<=0)pops.kill(q);}};
// ---- drawing ----
// animated flipbooks (art/fx_smoke.png, art/fx_fire.png from tools/fx_tex.py): 4x4 frames of 128 px played over each
// particle's life with a fixed random rotation; smoke is tinted per colour (cached). Until they load, soft sprites below.
const FB={smoke:new Image(),fire:new Image(),blast:new Image()},TINT={};
FB.smoke.src='art/fx_smoke.png?v='+BUILD;FB.fire.src='art/fx_fire.png?v='+BUILD;
FB.blast.src='art/fx_blast.png?v='+BUILD;   // v5.23: explosion sheet by Soluna Software (OpenGameArt, CC0), 4x4 frames of 128 px
const fbReady=im=>im.complete&&im.naturalWidth>0;
function tinted(c){if(TINT[c])return TINT[c];const im=FB.smoke,W2=im.naturalWidth,H2=im.naturalHeight,s=document.createElement('canvas');s.width=W2;s.height=H2;const g=s.getContext('2d');
 const[r,gg,b]=hexRGB(c).map(v=>Math.min(255,Math.round(v*1.9+18)));   // lift the colour: lit sides show it, shaded sides go darker
 g.drawImage(im,0,0);g.globalCompositeOperation='multiply';g.fillStyle=`rgb(${r},${gg},${b})`;g.fillRect(0,0,W2,H2);g.globalCompositeOperation='destination-in';g.drawImage(im,0,0);return TINT[c]=s;}
function frame(img,u,x,y,r,rot){const i=Math.min(15,Math.floor(u*16)),fs=img.width/4,sx=(i%4)*fs,sy=(i>>2)*fs;
 if(rot){cx.save();cx.translate(x,y);cx.rotate(rot);cx.drawImage(img,sx,sy,fs,fs,-r,-r,r*2,r*2);cx.restore();}else cx.drawImage(img,sx,sy,fs,fs,x-r,y-r,r*2,r*2);}
// soft smoke puff and fireball sprites (fallback, built once per colour)
const SPR={};
function puff(c){if(SPR[c])return SPR[c];const N=64,s=document.createElement('canvas');s.width=s.height=N;const g=s.getContext('2d');
 for(let i=0;i<9;i++){const a=i/9*TAU,o=i?rnd(6,13):0,x=N/2+Math.cos(a)*o,y=N/2+Math.sin(a)*o,r=i?rnd(11,17):20,gr=g.createRadialGradient(x,y,0,x,y,r);
  gr.addColorStop(0,c+'cc');gr.addColorStop(.55,c+'66');gr.addColorStop(1,c+'00');g.fillStyle=gr;g.fillRect(0,0,N,N);}return SPR[c]=s;}
function fireball(){if(SPR.fb)return SPR.fb;const N=96,s=document.createElement('canvas');s.width=s.height=N;const g=s.getContext('2d');
 const st=[[0,'rgba(255,252,235,1)'],[.18,'rgba(255,224,140,.95)'],[.4,'rgba(255,150,50,.8)'],[.68,'rgba(200,60,20,.45)'],[1,'rgba(120,30,10,0)']];
 for(let i=0;i<7;i++){const a=i/7*TAU,o=i?rnd(8,16):0,x=N/2+Math.cos(a)*o,y=N/2+Math.sin(a)*o,r=i?rnd(20,28):34,gr=g.createRadialGradient(x,y,0,x,y,r);
  for(const[k,c]of st)gr.addColorStop(k,c);g.fillStyle=gr;g.fillRect(0,0,N,N);}return SPR.fb=s;}
fx.drawBack=()=>{const L=parts.live;
 const fbS=fbReady(FB.smoke);
 for(const q of L){if(q.k==='s'){pj(q.x,q.y);const f=q.l/q.m;
   if(fbS){const r=q.r*(1.7-f*.5)*PS;cx.globalAlpha=Math.min(1,(q.d||.5)*1.9*Math.min(1,(1-f)*10));frame(tinted(q.c),1-f,PX,PY,r,save.hq?q.rot:0);}
   else{const r=q.r*(2.2-f*1.2)*PS,sp=puff(q.c);cx.globalAlpha=Math.min(1,Math.max(0,Math.min(1,f*1.8,(1-f)*8))*(q.d||.5)*1.5);cx.drawImage(sp,PX-r,PY-r,r*2,r*2);}}
  else if(q.k==='d'){pj(q.x,q.y);cx.globalAlpha=Math.max(0,q.l/q.m);cx.save();cx.translate(PX,PY);cx.rotate(q.a);cx.fillStyle=q.c;cx.fillRect(-q.r*PS,-q.r*.6*PS,q.r*2*PS,q.r*1.2*PS);cx.restore();}
  else if(q.k==='w'){pj(q.x,q.y);cx.globalAlpha=Math.max(0,q.l/q.m)*.55;cx.fillStyle=q.c;cx.beginPath();cx.arc(PX,PY,q.r*(2-q.l/q.m)*PS*.8,0,TAU);cx.fill();}}
 cx.globalAlpha=1;};
fx.drawFront=()=>{cx.globalCompositeOperation='lighter';
 for(const w of wrecks){const k=Math.min(1,w.t/w.m*1.6);if(k<=.02)continue;w.ph+=.016;const fl=.7+.3*Math.sin(w.ph*13)*Math.sin(w.ph*7.3);pj(w.x,w.y);cx.globalAlpha=.55*k*fl;dg(PX,PY,(9+5*Math.sqrt(w.s))*PS,'#ff8a3a');}
 cx.globalAlpha=1;
 for(const q of parts.live){if(q.k==='s'||q.k==='d'||q.k==='w')continue;const a=Math.max(0,q.l/q.m);cx.globalAlpha=a;pj(q.x,q.y);
  if(q.k==='f')dg(PX,PY,q.r*(.6+a*.6)*PS,q.c);
  else if(q.k==='b'){if(fbReady(FB.fire)){const r=q.r*(1.5-a*.4)*PS;cx.globalCompositeOperation='source-over';cx.globalAlpha=.97;frame(FB.fire,1-a,PX,PY,r,save.hq?q.rot:0);cx.globalCompositeOperation='lighter';}
   else{const r=q.r*(1.6-a*.8)*PS,sp=fireball();cx.globalAlpha=a*a*.95;cx.drawImage(sp,PX-r,PY-r,r*2,r*2);}}
  else if(q.k==='X'){const r=q.r*(1.05+(1-a)*.35)*PS;cx.globalCompositeOperation='source-over';cx.globalAlpha=Math.min(1,a*1.6);frame(FB.blast,1-a,PX,PY,r,save.hq?q.rot:0);cx.globalCompositeOperation='lighter';cx.globalAlpha=a*a*.5;frame(FB.blast,1-a,PX,PY,r*.8,0);}
  else if(q.k==='e'){dg(PX,PY,q.r*3*PS,q.c);}
  else if(q.k==='g')dg(PX,PY,q.r*(1.4-a*.4)*PS,q.c);
  else if(q.k==='k'){const x0=PX,y0=PY;pj(q.x-q.vx*.04,q.y-q.vy*.04);cx.strokeStyle=q.c;cx.lineWidth=1.8;cx.beginPath();cx.moveTo(x0,y0);cx.lineTo(PX,PY);cx.stroke();}
  else if(q.k==='o'){cx.strokeStyle=q.c;cx.lineWidth=3*a+1;cx.beginPath();cx.ellipse(PX,PY,q.r*(1.2-a)*PS,q.r*(1.2-a)*PS*.85,0,0,TAU);cx.stroke();}}
 cx.globalAlpha=1;cx.globalCompositeOperation='source-over';};
fx.drawPops=()=>{cx.textAlign='center';for(const q of pops.live){pj(q.x,q.y);cx.globalAlpha=Math.min(1,q.l*2);cx.font=(q.big?'16px':'12px')+' Bungee, Impact, sans-serif';
 cx.fillStyle='rgba(0,0,0,.55)';cx.fillText(q.t,PX+1,PY+2);cx.fillStyle=q.big?'#ffd27a':'#fff';cx.fillText(q.t,PX,PY);}cx.globalAlpha=1;};
})();
