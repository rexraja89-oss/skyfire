// In-game test with assertions: boots the real game (files unmodified) headless at the S22's CSS size and DPR, flies
// Stage 10 with a seeded random workload (terrain streaming, the stage's own waves, extra bullets and explosions),
// and adds the mega-boss from the test page only.
//  - 3 repeated runs per quality mode; the boss is shown on alternate frame pairs inside each run (A/B in the same
//    flight); per bucket: sample count, median and p95 frame time, full-frame draw calls/triangles (all render passes:
//    shadow map, scene, colour-grade quad)
//  - fixed-frame cost: the same frame rendered with and without the boss (main scene render incl. shadow pass)
//  - first-load hitch: GLB fetch+parse, look-layer build, first (cold, shader compile) and second (warm) render
//  - resources: 8 load/build/remove/dispose cycles and 6 HQ<->Smooth switches; geometry/texture counts must return to
//    baseline; JS heap reported
// Exit code 1 on: run state not reached, page/shader errors, too few samples, non-finite numbers, resource growth,
// fixed-frame cost over budget. Diagnostics are always written first.
// SwiftShader (CPU) renders these frames: frame times are development evidence only, not phone FPS.
// Run: node game_scene.cjs   -> out/game_scene.json, out/game_scene.log, out/shots/game_*.png
'use strict';
const fs=require('fs'),path=require('path');const {open}=require('./lib/browser.cjs');
const GAME=path.resolve(__dirname,'../..'),RUNS=3,WARM_MS=4000,MEASURE_MS=18000,MIN_SAMPLES=8,SEED=20261018;
const BUDGET={hq:{calls:7,tris:27000},smooth:{calls:5,tris:10000}};   // fixed-frame boss cost (HQ adds the shadow-map draw)
const log=[],fails=[];const say=s=>{log.push(s);console.log(s);};
const check=(name,ok,val)=>{const fin=v=>typeof v!=='number'||Number.isFinite(v),flat=v=>v&&typeof v==='object'?Object.values(v).flatMap(flat):[v];
  const good=!!ok&&flat(val).every(fin);say((good?'PASS ':'FAIL ')+name+(val!==undefined?'  '+JSON.stringify(val):''));if(!good)fails.push(name);return good;};
// S22 Ultra default display: 412 x 915 CSS px at DPR 2.625; the game caps the canvas at 2 (HQ) / 1.25 (Smooth)
(async()=>{const out={note:'SwiftShader software GL: frame times are development evidence only, not phone FPS',seed:SEED,runs:[]};let browser;
 try{const o=await open({root:__dirname,game:GAME,viewport:{width:412,height:915},dpr:2.625});browser=o.browser;const {ctx,page,errors}=o;
  // seeded Math.random (same workload every run) + a frame clock that runs before the game's own rAF callback
  await ctx.addInitScript(seed=>{let s=seed>>>0;const rnd=()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
    Math.random=rnd;window.__reseed=v=>{s=v>>>0;};
    window.__F={calls:0,tris:0,renders:0,frame:0,last:0,on:false,ab:false,b:1,rec:null,all:[],hist:[]};
    const tick=now=>{const F=window.__F;if(F.on&&F.last&&F.rec){const r=F.rec[F.b];r.dt.push(now-F.last);r.calls.push(F.calls);r.tris.push(F.tris);r.passes.push(F.renders);F.all.push([+(now-F.last).toFixed(0),F.b,window.SF&&SF.R?+SF.R.t.toFixed(2):null]);}
      if(F.last){F.hist.push({frame:F.frame,dt:+(now-F.last).toFixed(0),programs:typeof renderer!=='undefined'?renderer.info.programs.length:0});if(F.hist.length>60)F.hist.shift();}
      F.last=now;F.calls=F.tris=F.renders=0;F.frame++;const mb=window.__mb;
      if(mb){F.b=F.on&&F.ab?((F.frame>>1)&1):(mb.vis===false?0:1);mb.g.visible=!!F.b;const t=now/1000;mb.A.update(t);mb.g.position.x=Math.sin(t*.6)*5;}else F.b=0;
      if(F.on&&window.__busy&&F.frame%8===0)window.__busy();requestAnimationFrame(tick);};requestAnimationFrame(tick);},SEED);
  const ev=(f,a)=>page.evaluate(f,a);
  await page.goto('http://skyfire.test/index.html');await page.waitForTimeout(3500);
  // count every render pass of a frame (shadow + scene + grade quad all go through renderer.render)
  await ev(()=>{const R=renderer,orig=R.render.bind(R);window.__orig=orig;R.render=(s,c)=>{orig(s,c);const F=window.__F;F.calls+=R.info.render.calls;F.tris+=R.info.render.triangles;F.renders++;};
   window.__busy=()=>{if(state!=='run')return;for(let i=0;i<10;i++)SF.enemies.shoot(40+Math.random()*320,120+Math.random()*200,Math.PI/2+(Math.random()-.5)*1.2,160,'pellet');SF.fx.explode(60+Math.random()*280,200+Math.random()*400,1+Math.random());};});
  const start=async hq=>{await ev(([hq,seed])=>{__reseed(seed);save.god=true;save.hq=hq;save.sfx=false;save.music=false;if(typeof applyQuality==='function')applyQuality();if(typeof resize==='function')resize();goTitle();SF.run.start({kind:'stage',si:9,mode:'easy'});},[hq,SEED]);
   let ok=false;for(let i=0;i<80&&!(ok=await ev(()=>state==='run'));i++)await page.waitForTimeout(250);return ok;};
  const loadScripts=()=>ev(async()=>{const L=src=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>no(new Error('load '+src));document.head.appendChild(s);});
   if(!THREE.GLTFLoader)await L('/tools/boss3d/viewer/vendor/GLTFLoader.js');if(typeof MegaBossFX==='undefined')await L('/tools/boss3d/viewer/megaboss_fx.js');});
  // add the boss; returns load timings. In-game preset, no extra light (a new light recompiles every material).
  const addBoss=lod=>ev(async lod=>{const t0=performance.now();const g=await new Promise((ok,no)=>new THREE.GLTFLoader().load('/tools/boss3d/out/megaboss_'+lod+'.glb',x=>ok(x.scene),null,no));
   const t1=performance.now();const A=MegaBossFX.build(g,MegaBossFX.merge(MegaBossFX.CFG,MegaBossFX.INGAME),{hq:lod==='hq'});g.traverse(o=>{if(o.isMesh&&o.name==='hull')o.castShadow=!!save.hq;});
   g.position.set(0,0,C3.Zt+.26*H*KZ);scene.add(g);window.__mb={g,A,lod,vis:true};const t2=performance.now();
   g.visible=true;window.__orig(scene,camera);const t3=performance.now();window.__orig(scene,camera);const t4=performance.now();
   return {lod,loadParseMs:+(t1-t0).toFixed(1),buildMs:+(t2-t1).toFixed(1),firstRenderMs:+(t3-t2).toFixed(1),secondRenderMs:+(t4-t3).toFixed(1),zWorld:+g.position.z.toFixed(2)};},lod);
  const removeBoss=()=>ev(()=>{const mb=window.__mb;if(!mb)return;scene.remove(mb.g);mb.A.dispose();window.__mb=null;});
  const stats=a=>{const b=[...a].sort((x,y)=>x-y),q=f=>b.length?+b[Math.min(b.length-1,Math.floor(f*b.length))].toFixed(1):NaN;return {n:b.length,median:q(.5),p95:q(.95)};};
  const measure=async(label,ab=true)=>{await ev(ab=>{window.__F.rec=[0,1].map(()=>({dt:[],calls:[],tris:[],passes:[]}));window.__F.all=[];window.__F.ab=ab;window.__F.on=true;},ab);await page.waitForTimeout(MEASURE_MS);
   const rec=await ev(()=>{const F=window.__F;F.on=false;F.ab=false;return {rec:F.rec,all:F.all,enemies:SF.enemies.list().length,bullets:SF.enemies.ebPool.live.length,particles:SF.fx.parts.live.length,dpr:renderer.getPixelRatio(),programs:renderer.info.programs.length,state};});
   const side=r=>({frames:r.dt.length,frameMs:stats(r.dt),fullFrameCalls:stats(r.calls),fullFrameTris:stats(r.tris),passesPerFrame:stats(r.passes)});
   const r={label,without:side(rec.rec[0]),with:side(rec.rec[1]),workload:{enemies:rec.enemies,bullets:rec.bullets,particles:rec.particles},dpr:rec.dpr,programs:rec.programs};
   // slow frames (> 2.5x the run's median) with bucket and stage time, so game-side hitches can be told apart
   const allMed=stats(rec.all.map(x=>x[0])).median;r.slowFrames=rec.all.filter(x=>x[0]>2.5*allMed).map(([dt,b,t])=>({dt,boss:b===1,stageT:t}));
   const trim=a=>{const m=stats(a).median;return stats(a.filter(x=>x<=2.5*m));};r.without.frameMsNoHitch=trim(rec.rec[0].dt);r.with.frameMsNoHitch=trim(rec.rec[1].dt);
   if(!ab){r.control=true;out.runs.push(r);say(`${label} (control, no boss): slow frames ${JSON.stringify(r.slowFrames)} median ${r.without.frameMs.median}`);return r;}
   r.delta={fullFrameCallsMedian:r.with.fullFrameCalls.median-r.without.fullFrameCalls.median,frameMsMedianPct:+((r.with.frameMs.median/r.without.frameMs.median-1)*100).toFixed(1),frameMsP95Pct:+((r.with.frameMs.p95/r.without.frameMs.p95-1)*100).toFixed(1)};
   out.runs.push(r);say(`${label}: ${JSON.stringify({without:r.without.frameMs,with:r.with.frameMs,calls:[r.without.fullFrameCalls.median,r.with.fullFrameCalls.median],delta:r.delta,dpr:r.dpr,slow:r.slowFrames})}`);
   check(`${label}: run state held and enough samples (>= ${MIN_SAMPLES} per bucket)`,rec.state==='run'&&r.without.frames>=MIN_SAMPLES&&r.with.frames>=MIN_SAMPLES,[r.without.frames,r.with.frames]);
   check(`${label}: measurements finite`,true,[r.without.frameMs,r.with.frameMs,r.delta]);return r;};
  fs.mkdirSync('out/shots',{recursive:true});await loadScripts();
  for(const [hq,lod] of[[true,'hq'],[false,'smooth']]){
   check(`${lod} control: stage 10 reached run state`,await start(hq));await page.waitForTimeout(WARM_MS+1500);await measure(`${lod} control`,false);
   for(let run=1;run<=RUNS;run++){check(`${lod} run ${run}: stage 10 reached run state`,await start(hq));await page.waitForTimeout(WARM_MS);
    const f0=await ev(()=>window.__F.frame);const ld=await addBoss(lod);
    // first game frames after the boss appears: HQ renders through the colour-grade target, which needs its own shader
    // variants, so the first full frame compiles them (first-appearance hitch). Wait until 4 frames have passed.
    for(let i=0;i<120&&(await ev(f0=>window.__F.frame-f0,f0))<5;i++)await page.waitForTimeout(250);
    ld.firstGameFrames=await ev(f0=>window.__F.hist.filter(h=>h.frame>f0).slice(0,4),f0);
    const steady=await ev(f0=>window.__F.hist.filter(h=>h.frame<=f0).slice(-6).map(h=>h.dt),f0);ld.steadyFrameMsBefore=steady;
    if(run===1){out['load_'+lod]=ld;}say(`INFO ${lod} run ${run} boss appears: ${JSON.stringify(ld)}`);
    out['hitch_'+lod]=(out['hitch_'+lod]||[]).concat([{firstFrameMs:ld.firstGameFrames[0]&&ld.firstGameFrames[0].dt,programsAfter:ld.firstGameFrames.map(h=>h.programs),framesBefore:steady}]);
    await page.waitForTimeout(1000);
    await measure(`${lod} run ${run}`);
    if(run===1){out['exact_'+lod]=await ev(()=>{const R=renderer,g=window.__mb.g,c=v=>{g.visible=v;window.__orig(scene,camera);return {calls:R.info.render.calls,tris:R.info.render.triangles};};
      const r=[];for(let i=0;i<5;i++){const a=c(false),b=c(true);r.push({calls:b.calls-a.calls,tris:b.tris-a.tris});}g.visible=true;return r;});
     const e=out['exact_'+lod],same=e.every(x=>x.calls===e[0].calls&&x.tris===e[0].tris);
     check(`${lod}: fixed-frame boss cost within budget (<= ${BUDGET[lod].calls} calls, <= ${BUDGET[lod].tris} tris), stable over 5 repeats`,same&&e[0].calls<=BUDGET[lod].calls&&e[0].tris<=BUDGET[lod].tris,e[0]);
     // live gameplay screenshot (pausing would switch the game to its menu fly-by camera; matched with/without-boss
     // frames come from capture.cjs, which can freeze its virtual clock on one gameplay frame)
     await page.screenshot({path:`out/shots/game_${lod}_boss.png`});}
    await removeBoss();}}
  // resources: the boss's own geometry/texture footprint, measured in a paused frame (the running game creates and frees
  // its own objects, and quality switches rebuild terrain). Each cycle: count -> add+render -> remove+dispose -> count.
  const mem=()=>ev(()=>({geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,programs:renderer.info.programs.length,heapMB:performance.memory?+(performance.memory.usedJSHeapSize/1048576).toFixed(1):null}));
  await ev(()=>{state='pause';});await page.waitForTimeout(300);await addBoss('hq');await removeBoss();   // shared glow texture is created once
  const cyc=[];for(let i=0;i<8;i++){const lod=i%2?'smooth':'hq';const a=await mem();await addBoss(lod);const mid=await mem();await removeBoss();await ev(()=>window.__orig(scene,camera));const b=await mem();
   cyc.push({lod,before:a.geometries,whileShown:mid.geometries,after:b.geometries,texBefore:a.textures,texAfter:b.textures,heapMB:b.heapMB});}
  const sw=[];for(let i=0;i<6;i++){const hq=i%2===0;await ev(hq=>{save.hq=hq;applyQuality();resize();window.__orig(scene,camera);},hq);await page.waitForTimeout(200);
   const a=await mem();const ld=await addBoss(hq?'hq':'smooth');await removeBoss();await ev(()=>window.__orig(scene,camera));const b=await mem();sw.push({hq,firstRenderMs:ld.firstRenderMs,geoDelta:b.geometries-a.geometries,texDelta:b.textures-a.textures});}
  await ev(()=>{state='run';});
  out.resources={cycles:cyc,switches:sw};say('INFO resources '+JSON.stringify(out.resources));
  check('8 load/unload cycles (paused frame): boss adds geometry while shown and leaves none behind',cyc.every(c=>c.whileShown>c.before&&c.after===c.before&&c.texAfter===c.texBefore),cyc.map(c=>c.after-c.before));
  check('6 HQ/Smooth switches: boss load/unload leaves no geometry or textures behind',sw.every(x=>x.geoDelta===0&&x.texDelta===0),sw.map(x=>x.geoDelta));
  out.errors=errors;check('no page, shader or loader errors',errors.length===0,errors.length);errors.slice(0,5).forEach(e=>say('  '+e));
  // summary across runs
  for(const lod of['hq','smooth']){const rs=out.runs.filter(r=>r.label.startsWith(lod)&&!r.control);out['summary_'+lod]={runs:rs.length,
    frameMsMedianPct:rs.map(r=>r.delta.frameMsMedianPct),frameMsP95Pct:rs.map(r=>r.delta.frameMsP95Pct),frameMsNoHitchMedianPct:rs.map(r=>+((r.with.frameMsNoHitch.median/r.without.frameMsNoHitch.median-1)*100).toFixed(1)),slowFrames:rs.map(r=>r.slowFrames),control:out.runs.filter(r=>r.control&&r.label.startsWith(lod)).map(r=>r.slowFrames),fullFrameCallsAdded:rs.map(r=>r.delta.fullFrameCallsMedian),
    samples:rs.map(r=>[r.without.frames,r.with.frames])};say(`SUMMARY ${lod} ${JSON.stringify(out['summary_'+lod])}`);}
 }catch(e){check('game test ran to completion',false);say(String(e&&e.stack||e));}
 finally{if(browser)await browser.close();out.failed=fails;out.passed=!fails.length;fs.writeFileSync('out/game_scene.json',JSON.stringify(out,null,1));fs.writeFileSync('out/game_scene.log',log.join('\n')+'\n');
  say(fails.length?`GAME TEST FAILED: ${fails.length} check(s)`:'GAME TEST PASSED');process.exitCode=fails.length?1:0;}})();
