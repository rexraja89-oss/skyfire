'use strict';
// Shared scene state and helpers: app state, keys, weather, player model, world animation, menu camera,
// and overlay projection helpers. (The old campaign code was retired in Checkpoint 4: missions run in js/engine/run.js.)
let state='title';
const keys={};
const G=null; // kept so old references stay harmless
const toLogicX=gx=>W/2+gx/(C3.t*K);
const HQ=()=>save.hq;
function vib(ms){if(save.vib&&navigator.vibrate)try{navigator.vibrate(ms);}catch(e){}}
function clearRun(){if(SF.R)SF.run.stop();}
function startRun(si,mode){SF.run.start({kind:'stage',si,mode});}
const WX=[];
function stepWeather(dt){const st=STAGES[LV.si];if(!st||!HQ())return;const w=st.weather;
 if(w==='snow'&&WX.length<110)WX.push({x:rnd(-20,OW+20),y:-10,vx:rnd(-20,20),vy:rnd(60,130),r:rnd(1,2.6)});
 else if(w==='rain'&&WX.length<80)WX.push({x:rnd(0,OW+60),y:-20,vx:-90,vy:rnd(650,850),r:1});
 else if(w==='embers'&&WX.length<60)WX.push({x:rnd(0,OW),y:OH+10,vx:rnd(-20,20),vy:-rnd(40,110),r:rnd(1,2.5)});
 for(const q of WX){q.x+=q.vx*dt;q.y+=q.vy*dt;if(w==='snow')q.x+=Math.sin(q.y*.03)*20*dt;}prune(WX,q=>q.y>-30&&q.y<OH+30);}

let PLM=null,DRM=[];
function showPlayerModel(){for(const k in PLANES){const m=MODELS['pl_'+k];if(!m.parent)scene.add(m);m.visible=false;}PLM=MODELS['pl_'+save.plane];PLM.visible=true;
 for(const m of DRM)scene.remove(m);DRM=[];}
// world animation shared by the legacy campaign and the new engine
function syncEnv(dt,tnow){
 for(const l of FXL){if(l.intensity>0)l.intensity=Math.max(0,l.intensity-dt*l.userData.d*3);}
 // clouds drift with the world
 for(const c of LV.clouds){if(!c.visible)continue;c.position.z+=C3.v*dt*.95;if(c.position.z>C3.z+30)spawnCloud(c,false);}
 TER.water.material.normalMap.offset.y+=C3.v*dt*36/900;TER.water.material.normalMap.offset.x=Math.sin(tnow*.2)*.02;if(TER.lava.visible){LAVA.offset.y+=C3.v*dt*40/900+dt*.01;LAVA.offset.x=Math.sin(tnow*.3)*.03;}}
// top-down gameplay camera (shake in seconds of remaining shake)
function gameCam(shake,zoom=1){fill.intensity=0;camera.position.set(0,C3.y*zoom,C3.z*zoom);camera.lookAt(0,0,0);
 if(shake>0){camera.position.x+=rnd(-.5,.5)*shake*2.2;camera.position.z+=rnd(-.5,.5)*shake*2.2;}
 {const fd=Math.hypot(C3.y,C3.z)/141.8;scene.fog.near=240*fd;scene.fog.far=580*fd*(LV.B.fogN||1);}
 sun.position.copy(LV.sunDir).multiplyScalar(220).add(new T3.Vector3(0,GY,(C3.Zt+C3.Zb)/2*C3.t));sun.target.position.set(0,GY,(C3.Zt+C3.Zb)/2*C3.t);}
function drawWeather(){if(WX.length&&LV.si>=0){const w=STAGES[LV.si].weather;if(w==='snow'){cx.fillStyle='rgba(255,255,255,.85)';for(const q of WX){cx.beginPath();cx.arc(q.x,q.y,q.r,0,TAU);cx.fill();}}
  else if(w==='rain'){cx.strokeStyle='rgba(190,210,230,.35)';cx.lineWidth=1;cx.beginPath();for(const q of WX){cx.moveTo(q.x,q.y);cx.lineTo(q.x+q.vx*.03,q.y+q.vy*.03);}cx.stroke();}
  else if(w==='embers'){cx.globalCompositeOperation='lighter';for(const q of WX)dg(q.x,q.y,q.r*3,'#ff7a2e');cx.globalCompositeOperation='source-over';}}}
// menu screens: low cinematic flyby with the horizon in view
function sync3D(dt,tnow){syncEnv(dt,tnow);
 {
  // menu flyby: low cinematic camera with the horizon in view
  camera.position.set(Math.sin(tnow*.15)*5,GY+21,C3.z-6);camera.lookAt(Math.sin(tnow*.15)*2.5,GY+5,C3.z-100);
  if(PLM){PLM.visible=true;PLM.position.set(1+Math.sin(tnow*.6)*2.5,GY+15.4+Math.sin(tnow*1.3)*.4,C3.z-40);PLM.rotation.set(.35,-.75+Math.sin(tnow*.6)*.15,.45+Math.cos(tnow*.6)*.2);PLM.scale.setScalar(1.1);}
  fill.intensity=1.1;fill.position.copy(camera.position);fill.target.position.copy(PLM?PLM.position:camera.position);
  for(const m of DRM)m.visible=false;if(LV.boss)LV.boss.g.visible=false;
  sun.position.copy(LV.sunDir).multiplyScalar(200).add(new T3.Vector3(0,GY,C3.z-60));sun.target.position.set(0,GY,C3.z-60);
  scene.fog.near=60;scene.fog.far=430*(LV.B.fogN||1);return;}
}
function pspr(img,x,y,rot=0,s=1){pj(x,y);spr(img,PX,PY,rot,s*PS);}
function pdg(x,y,r,c){pj(x,y);dg(PX,PY,r*PS,c);}
function clipLen(x,y,ax,ay){let t=2000;const x0=-80,x1=W+80,y0=-80,y1=H+80;if(ax>0)t=Math.min(t,(x1-x)/ax);else if(ax<0)t=Math.min(t,(x0-x)/ax);if(ay>0)t=Math.min(t,(y1-y)/ay);else if(ay<0)t=Math.min(t,(y0-y)/ay);return Math.max(0,t);}
function drawOverlay(){cx.setTransform(oS,0,0,oS,0,0);cx.clearRect(0,0,OW,OH);drawWeather();}
