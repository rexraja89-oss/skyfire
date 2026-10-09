'use strict';
// ============ ATMOSPHERE LAYERS ============
// Per-biome mood on the 2D overlay (data: SF.ATMOS in config/atmos.js): drifting cloud shadows under the action,
// clouds and mist passing over it, sun shafts, searchlights, aurora and water glints. The colour grade of the 3D
// frame itself is a render pass in engine/grade.js.
// Cheap by design: a handful of cached sprites per frame. Smooth mode keeps shadows and over-clouds, drops the rest.
(()=>{
const At=SF.atmos={};
let A=null,S=null;const SPR={};
function blob(c,soft){const k=c+soft;if(SPR[k])return SPR[k];const N=128,s=document.createElement('canvas');s.width=s.height=N;const g=s.getContext('2d');const R2=srng(c.length*31+soft*7);
 for(let i=0;i<11;i++){const a=i/11*TAU,o=i?R2()*30+8:0,x=N/2+Math.cos(a)*o,y=N/2+Math.sin(a)*o,r=i?R2()*20+24:44,gr=g.createRadialGradient(x,y,0,x,y,r);
  gr.addColorStop(0,c+(soft?'aa':'ff'));gr.addColorStop(.6,c+'44');gr.addColorStop(1,c+'00');g.fillStyle=gr;g.fillRect(0,0,N,N);}return SPR[k]=s;}
At.start=si=>{const st=STAGES[si];A=st?SF.ATMOS[st.biome]||null:null;S={sh:[],ov:[],gl:[],sl:[],t:0};if(!A)return;
 if(A.shadows)for(let i=0;i<A.shadows.n;i++)S.sh.push({x:rnd(-40,W+40),y:rnd(-200,H),r:A.shadows.size*rnd(.75,1.3),vx:rnd(-6,6),s:rnd(.6,1)});
 if(A.over)for(let i=0;i<A.over.n;i++)S.ov.push(newOver(true));
 if(A.search)for(let i=0;i<A.search.n;i++)S.sl.push({x:rnd(30,W-30),y:rnd(-100,H),ph:rnd(0,TAU),sp:rnd(.4,.8)*(Math.random()<.5?-1:1)});};
function newOver(any){const o=A.over;return{x:rnd(-60,OW+60),y:any?rnd(-OH*.5,OH):-o.size*1.4-rnd(0,OH*.8),r:o.size*rnd(.8,1.3),s:rnd(.7,1)};}
At.step=dt=>{if(!A||!S)return;S.t+=dt;
 for(const c of S.sh){c.y+=SCROLL*dt*.85;c.x+=c.vx*dt;if(c.y-c.r>H+60){c.y=-c.r-rnd(40,300);c.x=rnd(-40,W+40);}}
 if(A.over)for(let i=0;i<S.ov.length;i++){const c=S.ov[i];c.y+=SCROLL*dt*A.over.speed*c.s;if(c.y-c.r>OH+40)S.ov[i]=newOver(false);}
 for(const l of S.sl){l.y+=SCROLL*dt;if(l.y>H+80){l.y=-rnd(60,300);l.x=rnd(30,W-30);}}
 if(A.glints&&save.hq&&S.gl.length<A.glints.n&&Math.random()<dt*A.glints.n)S.gl.push({x:rnd(10,OW-10),y:rnd(OH*.1,OH*.9),l:rnd(.25,.5),m:.5});
 for(const g of S.gl)g.l-=dt;prune(S.gl,g=>g.l>0);};
// under the action: cloud shadows on the ground
At.drawUnder=()=>{if(!A||!S||!S.sh.length)return;const sp=blob('#000000',1);cx.globalAlpha=A.shadows.a;
 for(const c of S.sh){pj(c.x,c.y);const r=c.r*PS;cx.drawImage(sp,PX-r,PY-r*.8,r*2,r*1.6);}cx.globalAlpha=1;};
// over the action: clouds and mist, glints, rays, searchlights, aurora (screen space)
At.drawOver=()=>{if(!A||!S)return;const hq=save.hq;
 if(hq&&A.search){cx.save();cx.globalCompositeOperation='lighter';for(const l of S.sl){pj(l.x,l.y);const a=Math.sin(S.t*l.sp+l.ph)*.9-Math.PI/2,w=.13,L=A.search.len;
   const g=cx.createLinearGradient(PX,PY,PX+Math.cos(a)*L,PY+Math.sin(a)*L);g.addColorStop(0,A.search.c+'cc');g.addColorStop(1,A.search.c+'00');cx.globalAlpha=A.search.a*3;cx.fillStyle=g;
   cx.beginPath();cx.moveTo(PX,PY);cx.lineTo(PX+Math.cos(a-w)*L,PY+Math.sin(a-w)*L);cx.lineTo(PX+Math.cos(a+w)*L,PY+Math.sin(a+w)*L);cx.closePath();cx.fill();dg(PX,PY,10,A.search.c);}cx.restore();}
 if(hq&&A.glints&&S.gl.length){cx.save();cx.globalCompositeOperation='lighter';cx.strokeStyle='rgba(255,255,255,.9)';cx.lineWidth=1.2;
  for(const g of S.gl){const f=Math.sin(g.l/g.m*Math.PI),r=7*f;cx.globalAlpha=f;cx.beginPath();cx.moveTo(g.x-r,g.y);cx.lineTo(g.x+r,g.y);cx.moveTo(g.x,g.y-r);cx.lineTo(g.x,g.y+r);cx.stroke();dg(g.x,g.y,5*f,'#ffffff');}cx.restore();}
 if(A.over){const o=A.over,sp=blob(o.c,1);cx.globalAlpha=o.a;for(const c of S.ov){const r=c.r;cx.drawImage(sp,c.x-r,c.y-r*o.flat,r*2,r*2*o.flat);}cx.globalAlpha=1;}
 if(hq&&A.rays){cx.save();cx.globalCompositeOperation='lighter';for(let i=0;i<A.rays.n;i++){const x0=-60+i*OW*.32+Math.sin(S.t*.15+i*2)*30,w=40+i%2*30,a=A.rays.a*(.7+.3*Math.sin(S.t*.4+i));
   const g=cx.createLinearGradient(x0,0,x0+OH*.5,OH);g.addColorStop(0,A.rays.c+'00');g.addColorStop(.3,A.rays.c+'ff');g.addColorStop(1,A.rays.c+'00');cx.globalAlpha=a;cx.fillStyle=g;
   cx.beginPath();cx.moveTo(x0,0);cx.lineTo(x0+w,0);cx.lineTo(x0+w+OH*.5,OH);cx.lineTo(x0+OH*.5,OH);cx.closePath();cx.fill();}cx.restore();}
 if(hq&&A.aurora){cx.save();cx.globalCompositeOperation='lighter';for(let k=0;k<3;k++){const c=['#40ffb0','#60ffd0','#b070ff'][k];cx.globalAlpha=A.aurora.a*(.6+.4*Math.sin(S.t*.5+k));
   const g=cx.createLinearGradient(0,0,0,OH*.32);g.addColorStop(0,c+'00');g.addColorStop(.5,c+'88');g.addColorStop(1,c+'00');cx.fillStyle=g;cx.beginPath();cx.moveTo(0,OH*.05);
   for(let x=0;x<=OW;x+=20)cx.lineTo(x,OH*(.06+.05*k)+Math.sin(x*.018+S.t*.6+k*2)*22+Math.sin(x*.05-S.t*.9)*8);for(let x=OW;x>=0;x-=20)cx.lineTo(x,OH*(.16+.05*k)+Math.sin(x*.015+S.t*.5+k)*26);cx.closePath();cx.fill();}cx.restore();}};
})();
