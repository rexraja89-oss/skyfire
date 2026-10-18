// Weapon bay in the real Stage 10 (game files unmodified; boss + bays added from this test page only), captured like
// capture.cjs. Bay events become the game's own effects: 'missile' -> SF.enemies.shoot(...,'missile') (the game's homing
// enemy missile, 2D overlay) from the tube's screen position, 'dead' -> SF.fx.explode, 'smoke' -> SF.fx.smoke,
// 'hit' -> small explosion. Cycle 1 fires a salvo; cycle 2 is shot down while firing (simulated player hits).
// Not integration: no hit boxes, damage, scoring or sound are wired into the game.
// Original header of capture.cjs:
// Normal-speed motion capture of the mega-boss in the real Stage 10 (files unmodified). The page runs on a virtual
// clock: performance.now/Date.now and requestAnimationFrame advance exactly 1/30 s per captured frame, so the clip plays
// back at true game speed even though the headless CPU renderer is slow. Seeded workload as in game_scene.cjs.
// No audio is captured (the boss adds no sound in this phase).
// Run: node bays_game.cjs [hq|smooth] [seconds]   -> out/bays/bay_stage10_<lod>.mp4 (+ contact strip .jpg)
'use strict';
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');const {open}=require('./lib/browser.cjs');
const GAME=path.resolve(__dirname,'../..'),LOD=process.argv[2]||'hq',SECS=+(process.argv[3]||11),FPS=30,SEED=20261018,DPR=1.5;
(async()=>{const {browser,ctx,page,errors}=await open({root:__dirname,game:GAME,viewport:{width:412,height:915},dpr:DPR});
 await ctx.addInitScript(seed=>{let s=seed>>>0;Math.random=()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
  let vt=0;const t0=Date.now(),q=[];performance.now=()=>vt;Date.now=()=>t0+vt;window.requestAnimationFrame=cb=>{q.push(cb);return q.length;};window.cancelAnimationFrame=()=>{};
  window.__step=ms=>{vt+=ms;const run=q.splice(0);for(const cb of run)try{cb(vt);}catch(e){console.error(e);}};
  window.__F={frame:0};const tick=now=>{const mb=window.__mb;window.__F.frame++;if(mb){const t=now/1000;mb.A.update(t);mb.g.position.x=Math.sin(t*.6)*5;if(mb.W)mb.W.update(1/30,camera);}
   if(window.__busy&&window.__F.frame%4===0)window.__busy();requestAnimationFrame(tick);};requestAnimationFrame(tick);},SEED);
 const ev=(f,a)=>page.evaluate(f,a),step=async(n,ms=1000/FPS)=>{for(let i=0;i<n;i++)await ev(ms=>__step(ms),ms);};
 await page.goto('http://skyfire.test/index.html');for(let i=0;i<40;i++){await step(5);await page.waitForTimeout(50);}
 await ev(hq=>{save.god=true;save.hq=hq;save.sfx=false;save.music=false;applyQuality();resize();goTitle();SF.run.start({kind:'stage',si:9,mode:'easy'});
  window.__busy=()=>{if(state!=='run')return;for(let i=0;i<4;i++)SF.enemies.shoot(40+Math.random()*320,120+Math.random()*200,Math.PI/2+(Math.random()-.5)*1.2,160,'pellet');if(Math.random()<.25)SF.fx.explode(60+Math.random()*280,200+Math.random()*400,1+Math.random());};},LOD==='hq');
 for(let i=0;i<60&&!(await ev(()=>state==='run'));i++){await step(3);await page.waitForTimeout(100);}
 if(!(await ev(()=>state==='run')))throw new Error('stage 10 did not start');
 await step(FPS*5);   // 5 s of flight before the boss appears
 await ev(async lod=>{const L=src=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s);});
  await L('/tools/boss3d/viewer/vendor/GLTFLoader.js');await L('/tools/boss3d/viewer/megaboss_fx.js');await L('/tools/boss3d/viewer/megaboss_bays.js');
  const g=await new Promise((ok,no)=>new THREE.GLTFLoader().load('/tools/boss3d/out/megaboss_'+lod+'.glb',x=>ok(x.scene),null,no));
  const A=MegaBossFX.build(g,MegaBossFX.merge(MegaBossFX.CFG,MegaBossFX.INGAME),{hq:lod==='hq'});g.traverse(o=>{if(o.isMesh&&o.name==='hull')o.castShadow=!!save.hq;});
  g.position.set(0,0,C3.Zt+.26*H*KZ);scene.add(g);
  // world point -> game logic coords: the camera ray through it, met with the ground plane the overlay uses (y = 0)
  const toLogic=p=>{const d=p.clone().sub(camera.position),k=-camera.position.y/d.y,X=camera.position.x+d.x*k,Z=camera.position.z+d.z*k;return {x:X/K+W/2,y:(Z-C3.Zt)/KZ};};
  const W2=MegaBossBays.build(A,{on:(t,d)=>{const q=d.pos&&toLogic(d.pos);if(!q)return;
   if(t==='missile')SF.enemies.shoot(q.x,q.y,Math.PI/2+(d.tube%3-1)*.35,120,'missile');else if(t==='dead')SF.fx.explode(q.x,q.y,2.2);
   else if(t==='hit')SF.fx.explode(q.x,q.y,.5);else if(t==='smoke')SF.fx.smoke(q.x,q.y,d.heavy?7:5,d.heavy?'#333':'#666',1.4);else if(t==='spark')SF.fx.explode(q.x,q.y,.3);}});
  window.__mb={g,A,W:W2};},LOD);
 const dir=`out/bays/game_${LOD}`;fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync(dir,{recursive:true});fs.mkdirSync('out/shots',{recursive:true});
 const N=SECS*FPS;await ev(()=>{window.__bayLog=[];});for(let i=0;i<N;i++){
  if(i===15||i===Math.round(FPS*5.2))await ev(()=>__mb.W.trigger('missile_L'));
  if(i>FPS*5.2)await ev(()=>{const W=__mb.W;if(W.state('missile_L')==='fire'&&W.hittable('missile_L'))W.hit('missile_L',12);});
  await step(1);await page.screenshot({path:`${dir}/f${String(i).padStart(4,'0')}.png`});if(i%30===0)process.stdout.write(`frame ${i}/${N}\n`);}
 // matched pair on one frozen gameplay frame: the virtual clock does not advance (step of 0 ms re-renders the same state)
 for(const [vis,name] of[[false,'off'],[true,'boss']]){await ev(v=>{window.__mb.g.visible=v;__step(0);},vis);await page.screenshot({path:`out/shots/bays_game_${LOD}_${name}.png`});}
 await browser.close();
 const mp4=`out/bays/bay_stage10_${LOD}.mp4`;
 execFileSync('ffmpeg',['-y','-loglevel','error','-framerate',String(FPS),'-i',`${dir}/f%04d.png`,'-vf','scale=trunc(iw/2)*2:trunc(ih/2)*2','-c:v','libx264','-pix_fmt','yuv420p','-crf','23','-movflags','+faststart',mp4]);
 execFileSync('ffmpeg',['-y','-loglevel','error','-i',mp4,'-vf',`select='not(mod(n\\,${Math.round(N/6)}))',scale=206:-2,tile=6x1`,'-frames:v','1',`out/bays/bay_stage10_${LOD}_strip.jpg`]);
 fs.rmSync(dir,{recursive:true,force:true});
 console.log(mp4,(fs.statSync(mp4).size/1e6).toFixed(2)+' MB',`${N} frames @ ${FPS} fps = ${SECS}s game time`,'errors:',JSON.stringify(errors));process.exitCode=errors.length?1:0;})()
 .catch(e=>{console.error(e);process.exitCode=1;});
