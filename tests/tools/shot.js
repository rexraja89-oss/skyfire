// usage: node shot.js <si> <name> [waitms]
const {open}=require(require('path').join(__dirname,'..','harness.js'));
(async()=>{const [si,name,w]=process.argv.slice(2);const {browser,page,errors}=await open({wait:3500});const ev=(f,a)=>page.evaluate(f,a);
 await ev(si=>{save.god=true;save.hq=true;save.focus=false;applyQuality();SF.run.start({kind:'stage',si:+si,mode:'easy'});},si);
 for(let i=0;i<40&&!(await ev(()=>state==='run'));i++)await page.waitForTimeout(250);
 await ev(()=>{SF.R.dir.hold=()=>true;SF.R.banner=null;SF.enemies.reset();});await page.waitForTimeout(+w||3000);
 await page.screenshot({path:(process.env.OUT||__dirname)+'/'+name+'.png'});console.log('errors',errors.slice(0,5));await browser.close();})();
