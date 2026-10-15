// Headless Chromium serving a folder at http://boss.test/ (and optionally the Skyfire repo at http://skyfire.test/).
'use strict';
const fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const THREE=require.resolve('three/build/three.min.js');
const types={'.html':'text/html','.js':'application/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.css':'text/css','.webmanifest':'application/manifest+json','.ogg':'audio/ogg'};
async function open({root,game,viewport={width:412,height:915},dpr=1}={}){
  const exe=fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':undefined;
  const browser=await chromium.launch({executablePath:exe,args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});
  const ctx=await browser.newContext({viewport,deviceScaleFactor:dpr,hasTouch:true,isMobile:true});
  await ctx.route('**/*',async r=>{const u=new URL(r.request().url());
    if(u.hostname==='cdnjs.cloudflare.com')return r.fulfill({body:fs.readFileSync(THREE),contentType:'application/javascript'});
    const base=u.hostname==='boss.test'?root:u.hostname==='skyfire.test'?game:null;
    if(!base)return r.fulfill({status:200,body:'',contentType:'text/css'});
    let p=decodeURIComponent(u.pathname);if(p.endsWith('/'))p+='index.html';const f=path.join(base,p);
    if(!f.startsWith(base)||!fs.existsSync(f))return r.fulfill({status:404,body:'nf'});
    r.fulfill({body:fs.readFileSync(f),contentType:types[path.extname(f)]||'application/octet-stream'});});
  const page=await ctx.newPage();const errors=[];
  page.on('console',m=>{if(m.type()==='error'&&!/404|Failed to load resource/.test(m.text()))errors.push(m.text());});page.on('pageerror',e=>errors.push('PAGEERROR '+e.message));
  return {browser,ctx,page,errors};}
module.exports={open};
