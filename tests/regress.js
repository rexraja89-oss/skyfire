// Skyfire regression test with assertions. Exit code 1 on any failed check or unexpected page error.
// Run: cd tests && npm i && node regress.js
const {open}=require('./harness');
const results=[];const check=(name,ok,info)=>{results.push({name,ok:!!ok,info});console.log((ok?'PASS ':'FAIL ')+name+(info!==undefined?'  '+JSON.stringify(info):''));};
(async()=>{const {browser,page,errors}=await open({wait:3500});
 const ev=(f,a)=>page.evaluate(f,a);
 // 0. pregame soundtrack lifecycle (music bus)
 check('UI usable before audio is allowed',await ev(()=>{go('select');const ok=state==='select'&&!PG.src;goTitle();return ok;}));
 await ev(()=>{save.music=true;audioOn();});for(let i=0;i<40&&!(await ev(()=>!!PG.src));i++)await page.waitForTimeout(250);
 check('pregame track plays in menus',await ev(()=>!!PG.src&&MUS.mode==='pregame'&&PG.starts===1));
 check('pregame track loops seamlessly (64 s buffer, loop on)',await ev(()=>PG.src.loop&&PG.buf.duration>60));
 const one=await ev(()=>{const s=PG.src;go('select');go('hangar');goTitle();go('settings');goTitle();audioOn();audioOn();return PG.src===s&&PG.starts===1;});
 check('single instance across menu navigation',one);
 await ev(()=>document.querySelector('.tog[data-k="music"]').click());check('music OFF stops the track',await ev(()=>!PG.src&&!save.music));
 await ev(()=>document.querySelector('.tog[data-k="music"]').click());await page.waitForTimeout(300);check('music ON restarts it once',await ev(()=>!!PG.src&&PG.starts===2));
 await ev(()=>{AC.suspend();});await page.waitForTimeout(200);await ev(()=>AC.resume());await page.waitForTimeout(200);check('background suspend/resume keeps the same instance',await ev(()=>!!PG.src&&PG.starts===2));
 await ev(()=>{save.god=true;SF.run.start({kind:'stage',si:0,mode:'easy'});});for(let i=0;i<40&&!(await ev(()=>state==='run'));i++)await page.waitForTimeout(250);await page.waitForTimeout(600);
 check('track faded out when the flight starts',await ev(()=>!PG.src&&MUS.mode==='combat'&&!!MUS.iv));
 await ev(()=>goTitle());await page.waitForTimeout(300);check('fresh pregame playback after returning to the main menu',await ev(()=>!!PG.src&&PG.starts===3));
 // audio probe: analyser on the master output, RMS over ~0.3 s
 await ev(()=>{save.god=true;save.sfx=true;save.music=false;audioOn();const an=AC.createAnalyser();an.fftSize=2048;OUT.connect(an);window.__an=an;
  window.__rms=async()=>{let m=0;for(let k=0;k<6;k++){await new Promise(r=>setTimeout(r,50));const d=new Float32Array(an.fftSize);an.getFloatTimeDomainData(d);let s=0;for(const v of d)s+=v*v;m=Math.max(m,Math.sqrt(s/d.length));}return m;};});
 for(let i=0;i<50&&!(await ev(()=>SF.sfxBank.ready));i++)await page.waitForTimeout(200);
 check('sound bank rendered',await ev(()=>SF.sfxBank.ready));
 // 1. SFX on: engine + ambience audible during a flight
 await ev(()=>SF.run.start({kind:'stage',si:4,mode:'easy'}));
 for(let i=0;i<40&&!(await ev(()=>state==='run'));i++)await page.waitForTimeout(250);
 await page.waitForTimeout(2500);
 const on=await ev(()=>__rms());check('loops audible with SFX on',on>.002,{rms:on});
 // 2. SFX off through the real settings toggle: silent
 await ev(()=>document.querySelector('.tog[data-k="sfx"]').click());await page.waitForTimeout(600);
 const off=await ev(()=>__rms());check('silent after SFX off toggle',off<.0005&&!(await ev(()=>save.sfx)),{rms:off});
 // 3. SFX back on mid-flight: loops return
 await ev(()=>document.querySelector('.tog[data-k="sfx"]').click());await page.waitForTimeout(800);
 const back=await ev(()=>__rms());check('loops return after SFX on',back>.002,{rms:back});
 // 4. pause silences loops, resume restores
 await ev(()=>pause());await page.waitForTimeout(600);const pz=await ev(()=>__rms());check('pause silences loops',pz<.0005,{rms:pz});
 await ev(()=>$('resume').click());await page.waitForTimeout(800);const rs=await ev(()=>__rms());check('resume restores loops',rs>.002,{rms:rs});
 // 5. a flight started with SFX off stays silent, then SFX on works
 await ev(()=>{goTitle();save.sfx=false;SF.sfxBank.applyMute();SF.run.start({kind:'stage',si:4,mode:'easy'});});await page.waitForTimeout(2500);
 const s0=await ev(()=>__rms());check('flight started with SFX off is silent',s0<.0005,{rms:s0});
 await ev(()=>document.querySelector('.tog[data-k="sfx"]').click());await page.waitForTimeout(900);
 const s1=await ev(()=>__rms());check('SFX on after silent start',s1>.002,{rms:s1});
 // 6. scene grade pass: on in HQ for a graded biome, off in Smooth
 await ev(()=>{save.hq=true;applyQuality();});await page.waitForTimeout(500);check('grade pass active in HQ',await ev(()=>SF.grade.on));
 await ev(()=>{save.hq=false;applyQuality();});await page.waitForTimeout(500);check('grade pass off in Smooth',await ev(()=>!SF.grade.on));
 await ev(()=>{save.hq=true;applyQuality();});
 // 7. Focus: lift after touch slows time
 await ev(()=>{SF.feel.touchDown();SF.feel.touchUp();});await page.waitForTimeout(800);const ts=await ev(()=>SF.run.timeScale());check('Focus slows time when finger lifted',ts<.6,{scale:ts});
 await ev(()=>SF.feel.touchDown());
 // 8. every stage boots and flies 3 s (HQ) without errors
 for(let si=0;si<10;si++){const n0=errors.length;await ev(si=>{goTitle();SF.run.start({kind:'stage',si,mode:'easy'});},si);
  for(let i=0;i<40&&!(await ev(si=>state==='run'&&SF.R&&SF.R.si===si,si));i++)await page.waitForTimeout(250);
  await page.waitForTimeout(3000);const t=await ev(()=>SF.R?SF.R.t:-1);check('stage '+(si+1)+' runs',t>.15&&errors.length===n0,{t:+t.toFixed(1),errors:errors.slice(n0)});}
 check('no unexpected page errors',errors.length===0,errors.slice(0,5));
 await browser.close();const bad=results.filter(r=>!r.ok);console.log(`\n${results.length-bad.length}/${results.length} passed`);process.exit(bad.length?1:0);})().catch(e=>{console.error(e);process.exit(1);});
