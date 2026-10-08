'use strict';
// ================= LOOP =================
let last=performance.now();
function frame(now){requestAnimationFrame(frame);let dt=(now-last)/1000;last=now;if(dt>.05)dt=.05;
 try{if(state==='play'&&G)update(dt);
  else if(state!=='pause'&&state!=='none'){gz3+=C3.v*(state==='result'?.3:.8)*dt;stepWeather(dt);}
  if(LV.si>=0){updTerrain(false);sync3D(state==='pause'?0:dt,now/1000);renderer.render(scene,camera);updProj();
   drawOverlay();}}catch(err){console.error(err);}}
// ================= BOOT =================
let ok3D=true;try{init3D();}catch(err){ok3D=false;$('loading').hidden=false;$('loading').textContent='3D graphics are not available on this device.';console.error(err);}
if(ok3D){buildSprites();buildProps();initTerrain();buildModels();
 resize();applyQuality();buildLevel(clamp(save.prog.easy-1,0,9));
 goTitle();requestAnimationFrame(frame);setTimeout(checkUpdate,1500);}
window.__sky={get PLM(){return PLM},addEnemy:(t,o)=>addEnemy(t,o),step(n){for(let i=0;i<n;i++)if(state==='play'&&G)update(1/30);},get T(){return{scene,TER,renderer,camera,sun,hemi,LV}},get G(){return G},get save(){return save},startRun,STAGES,get state(){return state},C3,LV};
