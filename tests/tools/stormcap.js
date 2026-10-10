// Storm Fleet combat capture at fixed 1/30 s game steps (software GPU is slow, so time is stepped, not real).
const {open}=require(require('path').join(__dirname,'..','harness.js'));const out=process.argv[2],N1=+process.argv[3]||210,N2=+process.argv[4]||210;
(async()=>{const {browser,page,errors}=await open({wait:4500,dpr:1});
 await page.evaluate(()=>{const s=window.__sky;s.save.god=true;s.save.hq=true;s.save.focus=false;applyQuality();showPlayerModel();SF.run.start({kind:'stage',si:1,mode:'hard'});});
 for(let k=0;k<40;k++){await page.waitForTimeout(250);if(await page.evaluate(()=>window.__sky.state==='run'))break;}
 await page.waitForTimeout(2500);
 await page.evaluate(()=>{SF.run.timeScale=()=>0;const s=window.__sky,R=s.R;R.p.lvl=6;
  window.__bot=()=>{let b=null,bd=1e9;for(const e of SF.enemies.list()){if(!e.alive||e.y<0)continue;const d=Math.abs(e.x-R.p.x)+Math.max(0,R.p.y-e.y)*.2;if(d<bd){bd=d;b=e;}}R.p.tx=b?clamp(b.x,40,360):200+60*Math.sin(R.t*.7);R.p.ty=lyAt(.78);};
  for(let n=0;n<60*50;n++){__bot();s.runStep(1);}});   // into the battle-group section
 let f=0;const shot=async()=>{await page.screenshot({path:out+'/f'+String(f++).padStart(4,'0')+'.png'});};
 for(let i=0;i<N1;i++){await page.evaluate(()=>{const s=window.__sky;for(let k=0;k<2;k++){__bot();s.runStep(1);}});await page.waitForTimeout(30);await shot();}
 await page.evaluate(()=>{const s=window.__sky,R=s.R;for(const e of [...SF.enemies.list()])SF.enemies.remove(e);R.dir.hold=null;for(const B of [...SF.boss.list])SF.boss.list.splice(SF.boss.list.indexOf(B),1);R.dir.i=1e9;R.dir.phase='warn';R.dir.warnT=.1;R.p.lvl=8;for(let n=0;n<60*7;n++){__bot();s.runStep(1);}});
 for(let i=0;i<N2;i++){await page.evaluate(()=>{const s=window.__sky,R=s.R;for(let k=0;k<2;k++){const B=SF.boss.list[0];if(B){const q=B.parts.find(q=>q.e.alive&&!q.e.invuln);if(q){R.p.tx=q.e.x;R.p.ty=lyAt(.78);}}else __bot();s.runStep(1);}});await page.waitForTimeout(30);await shot();}
 console.log('frames',f,'errors',errors.filter(e=>!/404/.test(e)).slice(0,5));await browser.close();})();
