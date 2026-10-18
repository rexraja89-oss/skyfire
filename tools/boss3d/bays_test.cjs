// Weapon bay test with assertions (viewer page, virtual 30 fps clock, so timings are exact on the slow CPU renderer):
//  - closed doors are invisible: the same frozen frame with and without the door mesh, compared over the bay area
//  - full cycle: state order and durations (BAYS_CFG.timing), 6 missile events, weapon hittable only while it is up
//  - destruction: hits while hidden are refused, enough hits destroy the bay, it stays dead and can't fire again
//  - draw calls: closed bay adds 1 (doors), open bay adds 3 (doors, cavity, weapon)
//  - both LODs build; build/dispose cycles leave no geometry behind
//  - capture: game-camera and close-up videos of a cycle + destruction -> out/bays/*.mp4, stills in review/
// Exit code 1 on any failed check. Run: node bays_test.cjs  (after build.cjs)
'use strict';
const fs=require('fs'),{execFileSync}=require('child_process');const {open}=require('./lib/browser.cjs');
const FPS=30,OUT='out/bays',log=[],fails=[];const say=s=>{log.push(s);console.log(s);};
const check=(n,ok,v)=>{say((ok?'PASS ':'FAIL ')+n+(v!==undefined?'  '+JSON.stringify(v):''));if(!ok)fails.push(n);return ok;};
(async()=>{let browser;fs.mkdirSync(OUT,{recursive:true});fs.mkdirSync('review',{recursive:true});fs.rmSync('review/bay_fire_close.png',{force:true});const res={};
 try{const o=await open({root:__dirname,viewport:{width:412,height:915},dpr:1.5});browser=o.browser;const {ctx,page,errors}=o;
  await ctx.addInitScript(()=>{let vt=0;const t0=Date.now(),q=[];performance.now=()=>vt;Date.now=()=>t0+vt;window.requestAnimationFrame=cb=>{q.push(cb);return q.length;};window.cancelAnimationFrame=()=>{};
   window.__step=ms=>{vt+=ms;const run=q.splice(0);for(const cb of run)try{cb(vt);}catch(e){console.error(e);}};Math.random=(()=>{let s=7;return()=>{s=(s*16807)%2147483647;return(s-1)/2147483646;};})();});
  const ev=(f,a)=>page.evaluate(f,a),step=async(n=1,ms=1000/FPS)=>{for(let i=0;i<n;i++)await ev(ms=>__step(ms),ms);};
  await page.goto('http://boss.test/viewer/index.html');for(let i=0;i<200&&!(await ev(()=>!!window.__ready));i++){await ev(()=>__step(16));await page.waitForTimeout(50);}
  check('viewer ready',await ev(()=>!!window.__ready));
  const cam=v=>ev(v=>document.querySelector(`.seg[data-k=cam] button[data-v=${v}]`).click(),v);
  await ev(()=>document.querySelector('.seg[data-k=motion] button[data-v=still]').click());   // bay checks on a still boss
  // event log
  await ev(()=>{const V=__viewer,W=V.W;window.__ev=[];const orig=W.on;W.on=(t,d)=>{__ev.push({t,at:+(W.time).toFixed(3)});orig(t,d);};});
  await cam('game');await step(3);
  // bay screen rect (projected footprint corners)
  const rect=await ev(()=>{const V=__viewer,W=V.W,b=W.bays[0],T=THREE,pts=[];for(const s of[-1,1])for(const t of[-1,1]){const p=W.worldPos(0,0,s*b.cfg.len/2,t*b.cfg.wid/2).project(V.cam);pts.push([(p.x*.5+.5)*innerWidth,(.5-p.y*.5)*innerHeight]);}
   const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);return {x:Math.floor(Math.min(...xs))-3,y:Math.floor(Math.min(...ys))-3,w:Math.ceil(Math.max(...xs)-Math.min(...xs))+6,h:Math.ceil(Math.max(...ys)-Math.min(...ys))+6};});
  say('INFO bay rect on screen (CSS px) '+JSON.stringify(rect));
  const mk=await ev(()=>{const b=__viewer.W.bays[0];if(!b.marker)return null;const p=b.marker.getWorldPosition(new THREE.Vector3()),c=__viewer.W.worldPos(0,0);return +p.distanceTo(c).toFixed(3);});
  check('GLB marker wb_missile_L sits at the bay centre (< 0.3 units)',mk!==null&&mk<.3,mk);
  // closed doors vs no doors, same frozen frame, compared in the page (canvas pixels)
  const diff=()=>ev(r=>{const V=__viewer,W=V.W,c=V.R.domElement,k=c.width/innerWidth;
   // __step(0) re-renders the same state; the canvas is read in the same task, before it is presented
   const shot=vis=>{W.doors.visible=vis;__step(0);const g=document.createElement('canvas');g.width=Math.round(r.w*k);g.height=Math.round(r.h*k);const x=g.getContext('2d');x.drawImage(c,r.x*k,r.y*k,r.w*k,r.h*k,0,0,g.width,g.height);return x.getImageData(0,0,g.width,g.height).data;};
   const a=shot(true),b=shot(false);W.doors.visible=true;let sum=0,big=0,n=a.length/4;for(let i=0;i<a.length;i+=4){const d=(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]))/3;sum+=d;if(d>24)big++;}
   return {meanDiff:+(sum/n).toFixed(2),pctOver24:+(100*big/n).toFixed(2),px:n};},rect);
  for(const lod of['hq','smooth']){await ev(l=>document.querySelector(`.seg[data-k=lod] button[data-v=${l}]`).click(),lod);await step(2);
   const d=await diff();res['closed_'+lod]=d;check(`${lod}: closed bay blends into the hull (mean diff < 4, < 4% of bay pixels differ by > 24)`,d.meanDiff<4&&d.pctOver24<4,d);}
  await ev(()=>document.querySelector('.seg[data-k=lod] button[data-v=hq]').click());await step(2);
  await page.screenshot({path:'review/bay_closed_game.png'});
  // draw calls (main render, same frame): closed vs open
  const dc=()=>ev(()=>{const V=__viewer,R=V.R,W=V.W,sc=W.A.root.parent.parent;let s=sc;while(s.parent)s=s.parent;const n=()=>{R.render(s,V.cam);return R.info.render.calls;};
   const vis=[W.doors.visible,W.cav.visible,W.bays[0].rack.visible];const all=n();W.doors.visible=W.cav.visible=W.bays[0].rack.visible=false;const none=n();[W.doors.visible,W.cav.visible,W.bays[0].rack.visible]=vis;return all-none;});
  const dClosed=await dc();check('closed bay adds 1 draw call (doors)',dClosed===1,dClosed);
  // ---- full cycle on the virtual clock, recorded ----
  const T0=await ev(()=>__viewer.W.time);await ev(()=>{__ev.length=0;__viewer.W.trigger('missile_L');});
  const frames=[];let dOpen=null,hitWhileHidden=null;const dir=OUT+'/f_game';fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync(dir);
  hitWhileHidden=await ev(()=>__viewer.W.hit('missile_L',10));
  const hitOk=[];for(let i=0;i<Math.round(FPS*4.6);i++){await step(1);const s=await ev(()=>{const W=__viewer.W;return {st:W.state('missile_L'),hit:W.hittable('missile_L'),t:W.time};});frames.push(s);
   if(s.st==='fire'&&dOpen===null)dOpen=await dc();if(i%2===0)await page.screenshot({path:`${dir}/f${String(frames.length).padStart(4,'0')}.png`});}
  const evs=await ev(()=>__ev.slice());res.cycleEvents=evs;
  const order=evs.filter(e=>!['missile'].includes(e.t)).map(e=>e.t),want=['warn','open','deploy','fire','hold','retract','close','hidden'];
  check('cycle state order',JSON.stringify(order)===JSON.stringify(want),order);
  const at=k=>(evs.find(e=>e.t===k)||{}).at,TM=await ev(()=>MegaBossBays.CFG.timing),t0=at('warn');
  const dur={warn:at('open')-t0,open:at('deploy')-at('open'),deploy:at('fire')-at('deploy'),retract:at('close')-at('retract'),close:at('hidden')-at('close')};
  check('state durations match BAYS_CFG.timing within one frame',Object.keys(dur).every(k=>Math.abs(dur[k]-TM[k])<=1/FPS+1e-3),dur);
  const nm=evs.filter(e=>e.t==='missile').length;check('salvo fires 6 missiles',nm===6,nm);
  check('open bay adds 3 draw calls (doors, cavity, weapon)',dOpen===3,dOpen);
  check('weapon cannot be hit while the bay is hidden',hitWhileHidden===false);
  const badHit=frames.filter(f=>f.hit&&!['deploy','fire','hold','retract'].includes(f.st));check('hittable only while the weapon is up',badHit.length===0&&frames.some(f=>f.hit),badHit.slice(0,3));
  // ---- destruction (second cycle): hit it while it fires ----
  await ev(()=>{__ev.length=0;__viewer.W.trigger('missile_L');});let dead=false;
  for(let i=0;i<Math.round(FPS*5.5);i++){await step(1);const s=await ev(()=>{const W=__viewer.W;if(W.hittable('missile_L')&&W.state('missile_L')==='fire')W.hit('missile_L',12);return W.state('missile_L');});
   if(s==='dead')dead=true;if(i%2===0)await page.screenshot({path:`${dir}/f${String(frames.length+i+1).padStart(4,'0')}.png`});}
  const evs2=await ev(()=>__ev.slice());check('bay destroyed by hits while firing',dead&&evs2.some(e=>e.t==='dead'),evs2.filter(e=>e.t==='hit').length+' hits');
  await page.screenshot({path:'review/bay_destroyed_game.png'});
  const after=await ev(()=>{const W=__viewer.W,ok=W.trigger('missile_L');return {ok,st:W.state('missile_L'),smoke:__ev.filter(e=>e.t==='smoke').length};});
  check('destroyed bay stays dead and keeps smoking',after.ok===false&&after.st==='dead'&&after.smoke>10,after);
  // ---- close-up video: repair, one cycle, destroy ----
  await ev(()=>{__viewer.W.reset();__viewer.demo.clear();});await cam('bay');await step(4);
  const dir2=OUT+'/f_close';fs.rmSync(dir2,{recursive:true,force:true});fs.mkdirSync(dir2);let k=0;
  await ev(()=>__viewer.W.trigger('missile_L'));
  for(let i=0;i<Math.round(FPS*4.4);i++){await step(1);await page.screenshot({path:`${dir2}/f${String(k++).padStart(4,'0')}.png`});
   const st=await ev(()=>__viewer.W.state('missile_L'));if(i===Math.round(FPS*1.45))await page.screenshot({path:'review/bay_open_close.png'});if(st==='fire'&&!fs.existsSync('review/bay_fire_close.png'))await page.screenshot({path:'review/bay_fire_close.png'});}
  await ev(()=>__viewer.W.trigger('missile_L'));
  for(let i=0;i<Math.round(FPS*4.5);i++){await step(1);await ev(()=>{const W=__viewer.W;if(W.state('missile_L')==='fire')W.hit('missile_L',15);});await page.screenshot({path:`${dir2}/f${String(k++).padStart(4,'0')}.png`});}
  await page.screenshot({path:'review/bay_destroyed_close.png'});
  // ---- resources: rebuild/dispose cycles ----
  const geo=await ev(()=>{const V=__viewer,R=V.R,A=V.A,r=[];let s=A.root;while(s.parent)s=s.parent;for(let i=0;i<4;i++){const a=R.info.memory.geometries;const W2=MegaBossBays.build(A,{});W2.update(1/30,V.cam);R.render(s,V.cam);const mid=R.info.memory.geometries;W2.dispose();R.render(s,V.cam);r.push([a,mid,R.info.memory.geometries]);}return r;});
  check('4 build/dispose cycles leave no geometry behind',geo.every(([a,m,b])=>m>a&&b===a),geo);
  res.errors=errors;check('no page or shader errors',errors.length===0,errors.slice(0,3));
  await browser.close();browser=null;
  // videos
  const enc=(d,fps,name)=>{execFileSync('ffmpeg',['-y','-loglevel','error','-framerate',String(fps),'-pattern_type','glob','-i',`${d}/f*.png`,'-vf','scale=trunc(iw/2)*2:trunc(ih/2)*2','-c:v','libx264','-pix_fmt','yuv420p','-crf','22','-movflags','+faststart',`${OUT}/${name}.mp4`]);fs.rmSync(d,{recursive:true,force:true});say(`video ${OUT}/${name}.mp4`);};
  enc(dir,FPS/2,'bay_game_view');enc(dir2,FPS,'bay_closeup');
 }catch(e){check('bay test ran to completion',false);say(String(e&&e.stack||e));}
 finally{if(browser)await browser.close();res.failed=fails;res.passed=!fails.length;fs.writeFileSync(OUT+'/bays_test.json',JSON.stringify(res,null,1));fs.writeFileSync(OUT+'/bays_test.log',log.join('\n')+'\n');
  say(fails.length?`BAY TEST FAILED: ${fails.length} check(s)`:'BAY TEST PASSED');process.exitCode=fails.length?1:0;}})();
