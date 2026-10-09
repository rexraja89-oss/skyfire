'use strict';
// ============ VISIBLE LOADOUT ============
// What the jet carries is visible on it and grows with power:
//  - wing pods (small 3D gun pods on the wings) appear when the wave guns come online (SIDEARMS.wave.fromLevel)
//  - missile racks (one missile per Missile-part level, up to 3 a side) when the Missile system is fitted
//  - two wingmen join at the top weapon level (SIDEARMS.wingman.fromLevel), flying in formation and firing
//  - the shield is drawn as a glass bubble around the jet
// Meshes are added to each jet model on first use (after Rex's art has been swapped in).
(()=>{
const T3=THREE,Lo=SF.loadout={};
let MAT=null;
function mats(){if(MAT)return MAT;MAT={
 gun:new T3.MeshStandardMaterial({color:0x3a4048,metalness:.75,roughness:.32}),
 dark:new T3.MeshStandardMaterial({color:0x1c2026,metalness:.6,roughness:.45}),
 glow:new T3.MeshBasicMaterial({color:0x7dffb0}),
 body:new T3.MeshStandardMaterial({color:0xe8ebee,metalness:.3,roughness:.4}),
 nose:new T3.MeshStandardMaterial({color:0xd8342c,metalness:.2,roughness:.45})};return MAT;}
function cyl(r0,r1,len,m){const g=new T3.CylinderGeometry(r0,r1,len,10);g.rotateX(Math.PI/2);return new T3.Mesh(g,m);}   // along Z (nose = -Z)
function pod(){const M=mats(),g=new T3.Group();
 const b=cyl(.17,.19,1.25,M.gun);g.add(b);const n=cyl(.06,.17,.32,M.dark);n.position.z=-.78;g.add(n);
 const m=cyl(.075,.075,.08,M.glow);m.position.z=-.95;g.add(m);g.userData.muzzle=m;const t=cyl(.19,.12,.22,M.dark);t.position.z=.72;g.add(t);
 for(const s of[-1,1]){const f=new T3.Mesh(new T3.BoxGeometry(.02,.22,.34),M.dark);f.position.set(s*.12,.12,.45);f.rotation.z=s*.5;g.add(f);}
 g.traverse(o=>{if(o.isMesh)o.castShadow=true;});return g;}
function missile(){const M=mats(),g=new T3.Group();const b=cyl(.07,.07,.7,M.body);g.add(b);const n=cyl(0,.07,.2,M.nose);n.position.z=-.45;g.add(n);
 for(const s of[-1,1]){const f=new T3.Mesh(new T3.BoxGeometry(.2,.015,.12),M.dark);f.position.set(0,0,.3);f.rotation.z=s>0?0:Math.PI/2;g.add(f);}
 g.traverse(o=>{if(o.isMesh)o.castShadow=true;});return g;}
// attach the hardpoints to a jet model once
function rig(model,k){if(model.userData.rig)return model.userData.rig;const J=PLANES[k].jet,w=(J.artW||J.S),l=(J.artL||J.L),rg={pods:[],rails:[]};
 for(const s of[-1,1]){const p=pod();p.scale.setScalar(1.6);p.position.set(s*w*.3*K,.3,l*.06*K);model.add(p);p.visible=false;rg.pods.push(p);
  const side=[];for(let i=0;i<3;i++){const m=missile();m.scale.setScalar(1.5);m.position.set(s*(w*.17+i*3.2)*K,.24,l*.2*K);model.add(m);m.visible=false;side.push(m);}rg.rails.push(side);}
 model.userData.rig=rg;return rg;}
Lo.podX=R=>{const J=R.p.pl.jet;return (J.artW||J.S)*.3;};
Lo.railX=(R,i)=>{const J=R.p.pl.jet;return (J.artW||J.S)*.17+i*3.2;};
Lo.start=R=>{R.wing=[];for(const m of WGM)scene.remove(m);WGM.length=0;
 if(!PLM)return;rig(PLM,save.plane);
 const keep=PLM.userData.rig;delete PLM.userData.rig;   // userData is deep-copied by clone(); keep mesh references out of it
 for(let i=0;i<2;i++){const m=PLM.clone(true);m.scale.setScalar(.55);m.visible=false;scene.add(m);WGM.push(m);}PLM.userData.rig=keep;};
const WGM=[];
// per step: wingmen formation and fire
Lo.step=(R,dt)=>{const p=R.p,WN=SF.SIDEARMS.wingman,on=p.alive&&p.dying<=0&&SF.weapons.level(R)>=WN.fromLevel;
 if(on&&!R.wing.length){for(const s of[-1,1])R.wing.push({s,x:p.x+s*20,y:H+40,ox:p.x,oy:H+40,fc:rnd(0,.1),bank:0});SF.fx.pop(p.x,p.y-30,'WINGMEN',true);say('wing','Wingmen formed up on you, Rex!',1,60);}
 if(!on&&R.wing.length){for(const w of R.wing)SF.fx.explode(w.x,w.y,.4);R.wing.length=0;}
 for(const w of R.wing){w.ox=w.x;w.oy=w.y;const tx=p.x+w.s*WN.dx,ty=p.y+WN.dy,vx=(tx-w.x)*Math.min(1,dt*WN.follow);w.x+=vx;w.y+=(ty-w.y)*Math.min(1,dt*WN.follow);
  w.bank+=(clamp(vx/dt/300,-1,1)-w.bank)*Math.min(1,dt*8);w.fc-=dt;if(w.fc<=0&&w.y<H){w.fc=WN.interval;SF.weapons.shotPublic('v',w.x,w.y-10,0,-WN.speed,WN.dmg*SF.weapons.dmgMul(R),3,null);}}};
// per frame: show pods/rails/wingmen
Lo.sync=(R,A)=>{if(!PLM)return;const rg=rig(PLM,save.plane),p=R.p,L=SF.weapons.level(R),WV=SF.SIDEARMS.wave;
 const pods=L>=WV.fromLevel;for(const q of rg.pods){q.visible=pods;const f=p.podFlash>0;q.userData.muzzle.scale.setScalar(f?2.2:1);}
 const ml=save.parts.missile|0,per=Math.min(3,Math.ceil(ml/2)),since=ml?SF.SIDEARMS.missile.interval(ml)-(p.mc||0):9;   // the front missile leaves the rail when fired
 rg.rails.forEach(side=>side.forEach((m,i)=>{m.visible=i<per&&!(i===0&&since<.3);}));
 R.wing.forEach((w,i)=>{const m=WGM[i];if(!m)return;m.visible=p.alive;const x=w.ox+(w.x-w.ox)*A,y=w.oy+(w.y-w.oy)*A;place(m,x,y,false,-.6);m.scale.setScalar(.55);m.rotation.set(-.08,0,-w.bank*.7);});
 for(let i=R.wing.length;i<WGM.length;i++)WGM[i].visible=false;};
Lo.stop=()=>{for(const m of WGM)scene.remove(m);WGM.length=0;};
// thrust flames for the wingmen (overlay)
Lo.drawThrust=(R,A)=>{for(const w of R.wing){const x=w.ox+(w.x-w.ox)*A,y=w.oy+(w.y-w.oy)*A;pdg(x,y+11,7,'#ff9a3a');pdg(x,y+9,3.5,'#fff3c4');}};
// glass shield bubble (overlay)
Lo.drawShield=(R,px,py)=>{const sh=R.eff.shield;if(!sh||!R.p.alive)return;pj(px,py);const r=30*PS,t=R.t,low=sh.t<2.5&&Math.floor(t*8)%2===0;
 cx.save();cx.globalCompositeOperation='lighter';
 const g=cx.createRadialGradient(PX-r*.25,PY-r*.3,r*.1,PX,PY,r);g.addColorStop(0,'rgba(200,240,255,.10)');g.addColorStop(.7,'rgba(80,190,255,.08)');g.addColorStop(.93,`rgba(110,215,255,${low?.15:.42})`);g.addColorStop(1,'rgba(110,215,255,0)');
 cx.fillStyle=g;cx.beginPath();cx.arc(PX,PY,r,0,TAU);cx.fill();
 // hex shimmer band
 cx.strokeStyle=`rgba(150,230,255,${low?.08:.22})`;cx.lineWidth=1;for(let i=0;i<6;i++){const a=t*.8+i*TAU/6;cx.beginPath();cx.ellipse(PX,PY,r*.98,r*.98*Math.abs(Math.cos(a)),0,0,TAU);cx.stroke();}
 // specular highlight
 cx.strokeStyle='rgba(255,255,255,.55)';cx.lineWidth=2.2;cx.beginPath();cx.arc(PX,PY,r*.82,Math.PI*1.12,Math.PI*1.42);cx.stroke();
 cx.fillStyle='rgba(255,255,255,.35)';cx.beginPath();cx.arc(PX-r*.42,PY-r*.45,r*.08,0,TAU);cx.fill();
 // hits left
 for(let i=0;i<sh.hits;i++){const a=-Math.PI/2+(i-(sh.hits-1)/2)*.35;cx.fillStyle='rgba(160,235,255,.9)';cx.beginPath();cx.arc(PX+Math.cos(a)*(r+5),PY+Math.sin(a)*(r+5),2.2,0,TAU);cx.fill();}
 cx.restore();};
})();
