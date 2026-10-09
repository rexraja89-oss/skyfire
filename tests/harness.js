// Headless test harness: serves the Skyfire repo through Playwright routing (no network) and returns a ready page.
// Needs: npm i (playwright, three@0.128.0) in this folder; Chromium from PLAYWRIGHT_BROWSERS_PATH or CHROMIUM=path.
const fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const ROOT=process.env.ROOT||path.join(__dirname,'..');
const THREE=require.resolve('three/build/three.min.js');
const types={'.html':'text/html','.js':'application/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webmanifest':'application/manifest+json','.css':'text/css'};
async function open(opts={}){
  const exe=process.env.CHROMIUM||(fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':undefined);
  const browser=await chromium.launch({executablePath:exe,args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});
  const ctx=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:(opts.dpr||1),hasTouch:true,isMobile:true});
  if(opts.save)await ctx.addInitScript(s=>{try{localStorage.setItem('skyfire-rex-v1',s)}catch(e){}},opts.save);
  await ctx.route('**/*',async r=>{const u=new URL(r.request().url());
    if(u.hostname==='cdnjs.cloudflare.com')return r.fulfill({body:fs.readFileSync(THREE),contentType:'application/javascript'});
    if(u.hostname!=='skyfire.test')return r.fulfill({status:200,body:'',contentType:'text/css'});
    let p=decodeURIComponent(u.pathname);if(p.endsWith('/'))p+='index.html';const f=path.join(ROOT,p);
    if(!fs.existsSync(f))return r.fulfill({status:404,body:'nf'});
    r.fulfill({body:fs.readFileSync(f),contentType:types[path.extname(f)]||'application/octet-stream'});});
  const page=await ctx.newPage();const errors=[];
  page.on('console',m=>{if(m.type()==='error'&&!/404|Failed to load resource/.test(m.text()))errors.push(m.text());});page.on('pageerror',e=>errors.push('PAGEERROR '+e.message));
  await page.goto('http://skyfire.test/index.html');await page.waitForTimeout(opts.wait||3000);
  return {browser,page,errors};}
module.exports={open};
