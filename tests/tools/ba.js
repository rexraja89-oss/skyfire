// same scenes from two game versions (ROOT env selects the checkout); output prefix argv[2]
const {open}=require(require('path').join(__dirname,'..','harness.js'));const P=(process.env.OUT||__dirname)+'/'+process.argv[2]+'_';
(async()=>{const {browser,page,errors}=await open({wait:4500});const ev=(f,a)=>page.evaluate(f,a);
 for(let i=0;i<30&&!(await ev(()=>!SF.a3d||Object.keys(SF.a3d.ok).length>=7));i++)await page.waitForTimeout(500);
 for(const [si,n] of [[3,'jungle'],[6,'canyon'],[0,'harbor']]){
  await ev(si=>{save.god=true;save.hq=true;save.focus=false;applyQuality();goTitle();SF.run.start({kind:'stage',si,mode:'easy'});},si);
  for(let i=0;i<40&&!(await ev(si=>state==='run'&&SF.R.si===si,si));i++)await page.waitForTimeout(250);
  await ev(()=>{SF.run.timeScale=()=>0;SF.R.dir.hold=()=>true;SF.enemies.reset();window.__sky.runStep(240);SF.R.banner=null;});await page.waitForTimeout(1200);
  await page.screenshot({path:P+n+'.png'});}
 await ev(()=>{SF.enemies.reset();for(let i=0;i<3;i++)SF.enemies.spawn('dart',{x:120+i*80,y:lyAt(.4),mv:{type:'none'}});window.__sky.runStep(2);});await page.waitForTimeout(1200);
 await page.screenshot({path:P+'dart.png',clip:{x:80,y:300,width:260,height:180}});
 await ev(()=>{SF.enemies.reset();SF.fx.explode(150,lyAt(.55),1.6,true);SF.fx.explode(260,lyAt(.6),1,false);window.__sky.runStep(12);});await page.waitForTimeout(900);
 await page.screenshot({path:P+'boom.png',clip:{x:60,y:430,width:300,height:220}});
 console.log(process.argv[2],'errors',errors.slice(0,3));await browser.close();})();
