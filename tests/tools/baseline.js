// Baseline: bytes loaded at boot and per stage; per stage HQ+Smooth: draw calls, triangles, geometries, textures, est. texture GPU MB, JS heap.
const fs=require('fs'),path=require('path');const {chromium}=require(require('path').join(__dirname,'..','node_modules','playwright'));
const ROOT=process.env.ROOT||require('path').join(__dirname,'..','..'),THREE=require.resolve(require('path').join(__dirname,'..','node_modules','three','build','three.min.js'));
const types={'.html':'text/html','.js':'application/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.ogg':'audio/ogg','.webmanifest':'application/manifest+json'};
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM||(fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':undefined),args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required','--enable-precise-memory-info']});
 const ctx=await browser.newContext({viewport:{width:412,height:915},hasTouch:true,isMobile:true});let bytes=0;const seen=new Set();
 await ctx.route('**/*',async r=>{const u=new URL(r.request().url());if(u.hostname==='cdnjs.cloudflare.com'){const b=fs.readFileSync(THREE);if(!seen.has('three')){seen.add('three');bytes+=b.length;}return r.fulfill({body:b,contentType:'application/javascript'});}
  if(u.hostname!=='skyfire.test')return r.fulfill({status:200,body:''});let p=decodeURIComponent(u.pathname);if(p.endsWith('/'))p+='index.html';const f=path.join(ROOT,p);if(!fs.existsSync(f))return r.fulfill({status:404,body:''});
  const b=fs.readFileSync(f);if(!seen.has(p)){seen.add(p);bytes+=b.length;}r.fulfill({body:b,contentType:types[path.extname(f)]||'application/octet-stream'});});
 const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));await page.goto('http://skyfire.test/index.html');await page.waitForTimeout(5000);
 const out={bootBytes:bytes,stages:[]};const ev=(f,a)=>page.evaluate(f,a);
 const probe=()=>{const tx=new Set();const add=t=>{if(t&&t.isTexture)tx.add(t);};scene.traverse(o=>{const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];for(const m of ms){for(const k of['map','normalMap','emissiveMap','bumpMap','roughnessMap','alphaMap','envMap'])add(m[k]);if(m.userData&&m.userData.U)for(const u of Object.values(m.userData.U))add(u&&u.value);if(m.uniforms)for(const u of Object.values(m.uniforms))add(u&&u.value);}});
  if(SF.terrain&&LV.B&&LV.B.pbr){const M=SF.terrain.mat(LV.B);if(M.userData&&M.userData.U)for(const u of Object.values(M.userData.U))add(u.value);}add(scene.environment);
  let mb=0;for(const t of tx){const i=t.image;if(!i)continue;const w=i.width||(i[0]&&i[0].width)||0,h=i.height||(i[0]&&i[0].height)||0;mb+=w*h*4*(t.generateMipmaps!==false?1.33:1)*(t.isCubeTexture?6:1)/1048576;}
  renderer.info.reset();renderer.render(scene,camera);const r=renderer.info;return{calls:r.render.calls,tris:r.render.triangles,geoms:r.memory.geometries,textures:r.memory.textures,texMB:+mb.toFixed(1),heapMB:performance.memory?+(performance.memory.usedJSHeapSize/1048576).toFixed(0):null};};
 for(let si=0;si<10;si++){const b0=bytes;const row={si,name:await ev(si=>STAGES[si].name,si)};
  for(const hq of[true,false]){await ev(([si,hq])=>{save.god=true;save.focus=false;save.hq=hq;applyQuality();resize();goTitle();SF.run.start({kind:'stage',si,mode:'easy'});},[si,hq]);
   for(let i=0;i<40&&!(await ev(si=>state==='run'&&SF.R&&SF.R.si===si,si));i++)await page.waitForTimeout(250);await ev(()=>{SF.R.dir.hold=()=>true;});await page.waitForTimeout(3500);
   row[hq?'hq':'smooth']=await ev(`(${probe.toString()})()`);}
  row.newBytes=bytes-b0;out.stages.push(row);console.error(JSON.stringify(row));}
 out.totalBytes=bytes;out.errors=errs;fs.writeFileSync(process.argv[2],JSON.stringify(out,null,1));await browser.close();})();
