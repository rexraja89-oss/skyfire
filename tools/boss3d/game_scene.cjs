// Representative in-game test: boots the real game (unmodified files) headless, flies Stage 10 with terrain, enemies,
// extra bullets and explosions, and adds the mega-boss into the live scene from the test only. Compares draw calls,
// triangles and frame time with/without the boss in HQ and Smooth, and saves screenshots.
// Run: node game_scene.cjs   -> out/game_scene.json + out/shots/game_*.png
// Note: headless Chromium renders with SwiftShader (CPU), so frame times are only a relative signal; draw calls and
// triangles are exact.
'use strict';
const fs=require('fs'),path=require('path');const {open}=require('./lib/browser.cjs');
const GAME=path.resolve(__dirname,'../..');
(async()=>{const {browser,page,errors}=await open({root:__dirname,game:GAME,viewport:{width:412,height:915},dpr:1});
 const ev=(f,a)=>page.evaluate(f,a);const out={note:'SwiftShader software GL: frame ms are relative only',runs:[]};
 await page.goto('http://skyfire.test/index.html');await page.waitForTimeout(3500);
 // per-frame render stats + mega-boss hook (runtime patch in the test page only)
 await ev(()=>{const R=renderer,orig=R.render.bind(R);window.__orig=orig;window.__st={on:false};
  // Interleaved A/B in the same flight: the boss is shown on alternate pairs of frames, so stage drift (enemies, props,
  // particles) affects both buckets equally. Only the main scene render is counted (the HQ grade pass is a separate quad).
  let n=0,lastT=0,lastB=-1;
  R.render=(s,c)=>{const st=window.__st,mb=window.__mb;let b=-1;
   if(s===scene){const now=performance.now();if(st.on&&lastB>=0&&lastT)st.dt[lastB].push(now-lastT);lastT=now;
    if(mb){b=st.on&&st.ab?((n++>>1)&1):1;mb.g.visible=!!b;const t=now/1000;mb.A.update(t);mb.g.position.x=Math.sin(t*.6)*5;}else b=0;lastB=b;}
   orig(s,c);if(st.on&&s===scene){st.calls[b].push(R.info.render.calls);st.tris[b].push(R.info.render.triangles);}};});
 const start=async(hq)=>{await ev(hq=>{save.god=true;save.hq=hq;save.sfx=false;save.music=false;if(typeof applyQuality==='function')applyQuality();if(typeof resize==='function')resize();goTitle();SF.run.start({kind:'stage',si:9,mode:'easy'});},hq);
  for(let i=0;i<60&&!(await ev(()=>state==='run'));i++)await page.waitForTimeout(250);await page.waitForTimeout(12000);};
 // busy combat: extra enemy bullets + explosions every 250 ms on top of the stage's own waves
 await ev(()=>{window.__busy=setInterval(()=>{if(state!=='run')return;for(let i=0;i<10;i++)SF.enemies.shoot(40+Math.random()*320,120+Math.random()*200,Math.PI/2+(Math.random()-.5)*1.2,160,'pellet');
  SF.fx.explode(60+Math.random()*280,200+Math.random()*400,1+Math.random());},250);});
 const measure=async(label,ab,ms=16000)=>{await ev(ab=>{Object.assign(window.__st,{calls:[[],[]],tris:[[],[]],dt:[[],[]],on:true,ab});},ab);await page.waitForTimeout(ms);
  const r=await ev(()=>{const s=window.__st;s.on=false;const med=a=>{const b=[...a].sort((x,y)=>x-y);return b.length?b[b.length>>1]:null;};
   const side=k=>({frames:s.dt[k].length,frameMsMed:med(s.dt[k]),drawCalls:med(s.calls[k]),triangles:med(s.tris[k])});
   return {without:side(0),with:side(1),enemies:SF.enemies.list().length,bullets:SF.enemies.ebPool.live.length,particles:SF.fx.parts.live.length,hq:!!save.hq,dpr:renderer.getPixelRatio(),programs:renderer.info.programs.length};});
  if(r.without.frames&&r.with.frames)r.delta={drawCalls:r.with.drawCalls-r.without.drawCalls,triangles:r.with.triangles-r.without.triangles,frameMsPct:+((r.with.frameMsMed/r.without.frameMsMed-1)*100).toFixed(1)};
  r.label=label;out.runs.push(r);console.log(label,JSON.stringify(r));return r;};
 const addBoss=async lod=>ev(async lod=>{const load=src=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s);});
  if(!THREE.GLTFLoader)await load('/tools/boss3d/viewer/vendor/GLTFLoader.js');if(typeof MegaBossFX==='undefined')await load('/tools/boss3d/viewer/megaboss_fx.js');
  if(window.__mb){scene.remove(window.__mb.g);}
  const g=await new Promise((ok,no)=>new THREE.GLTFLoader().load('/tools/boss3d/out/megaboss_'+lod+'.glb',x=>ok(x.scene),null,no));
  const C=MegaBossFX.merge(MegaBossFX.CFG,MegaBossFX.INGAME);   // warm-stage preset; no extra light (a new light recompiles every material)
  const A=MegaBossFX.build(g,C,{hq:lod==='hq'});g.traverse(o=>{if(o.isMesh&&o.name==='hull')o.castShadow=!!save.hq;});
  // boss sits near the top of the lane like the other bosses (logic y ~ 0.26 H), flying at the air plane y=0
  g.position.set(0,0,C3.Zt+.26*H*KZ);scene.add(g);window.__mb={g,A};
  return {zWorld:+g.position.z.toFixed(2),Zt:+C3.Zt.toFixed(2),Zb:+C3.Zb.toFixed(2)};},lod);
 const shot=async n=>page.screenshot({path:`out/shots/game_${n}.png`});
 fs.mkdirSync('out/shots',{recursive:true});
 for(const [hq,lod] of[[true,'hq'],[false,'smooth']]){
  await start(hq);out['place_'+lod]=await addBoss(lod);await page.waitForTimeout(1500);
  await measure(`${lod}: stage 10, boss on alternate frames`,true);
  // exact cost: render the same frame with and without the boss (includes the HQ shadow pass)
  out['exact_'+lod]=await ev(()=>{const R=renderer,g=window.__mb.g,c=v=>{g.visible=v;window.__orig(scene,camera);return {calls:R.info.render.calls,tris:R.info.render.triangles};};
   const r=[];for(let i=0;i<5;i++){const a=c(false),b=c(true);r.push({calls:b.calls-a.calls,tris:b.tris-a.tris});}return r;});console.log('exact',lod,JSON.stringify(out['exact_'+lod]));
  await ev(()=>{window.__st.on=false;window.__mb.g.visible=true;});await page.waitForTimeout(400);await shot(lod+'_boss');
  await ev(()=>{scene.remove(window.__mb.g);window.__mb=null;});}
 await ev(()=>clearInterval(window.__busy));
 out.delta={hq:out.runs[0].delta,smooth:out.runs[1].delta};out.errors=errors;console.log('delta',JSON.stringify(out.delta),'errors',JSON.stringify(errors));
 fs.writeFileSync('out/game_scene.json',JSON.stringify(out,null,1));await browser.close();})();
