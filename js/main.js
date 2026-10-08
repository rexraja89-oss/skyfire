'use strict';
// ================= LOOP =================
// Fixed 60 Hz simulation (same feel at any frame rate) with interpolated rendering for the new engine.
let last=performance.now(),acc=0,pausedFrom='';
function frame(now){requestAnimationFrame(frame);let dt=(now-last)/1000;last=now;if(dt>.1)dt=.1;
 const STEP=SF.BAL.sim.step,MAXS=SF.BAL.sim.maxSteps;let alpha=1;
 try{
  if(state==='play'&&G){acc+=dt;let n=0;while(acc>=STEP&&n<MAXS){update(STEP);acc-=STEP;n++;}if(n>=MAXS)acc=0;}
  else if(state==='range'){SF.range.realTick(dt);acc+=dt*SF.range.timeScale();let n=0;while(acc>=STEP&&n<MAXS&&state==='range'){SF.range.step(STEP);acc-=STEP;n++;}if(n>=MAXS)acc=0;alpha=clamp(acc/STEP,0,1);}
  else if(state!=='pause'&&state!=='none'){acc=0;gz3+=C3.v*(state==='result'?.3:.8)*dt;stepWeather(dt);}
  if(LV.si>=0){updTerrain(false);
   if(state==='range'||(state==='pause'&&pausedFrom==='range'))SF.range.render(state==='pause'?0:dt,state==='pause'?1:alpha,now/1000);
   else{sync3D(state==='pause'?0:dt,now/1000);renderer.render(scene,camera);updProj();drawOverlay();}}}catch(err){console.error(err);}}
// ================= BOOT =================
let ok3D=true;try{init3D();}catch(err){ok3D=false;$('loading').hidden=false;$('loading').textContent='3D graphics are not available on this device.';console.error(err);}
if(ok3D){buildSprites();buildProps();initTerrain();buildModels();
 resize();applyQuality();buildLevel(clamp(save.prog.easy-1,0,9));
 goTitle();requestAnimationFrame(frame);setTimeout(checkUpdate,1500);}
window.__sky={rangeStep(n){for(let i=0;i<n;i++)if(state==='range')SF.range.step(1/60);},get R(){return SF.R},get pausedFrom(){return pausedFrom},get PLM(){return PLM},addEnemy:(t,o)=>addEnemy(t,o),step(n){for(let i=0;i<n;i++)if(state==='play'&&G)update(1/30);},get T(){return{scene,TER,renderer,camera,sun,hemi,LV}},get G(){return G},get save(){return save},startRun,STAGES,get state(){return state},C3,LV};
