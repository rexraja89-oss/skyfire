// Renders the full-resolution reference hull straight down (game frame) -> out/ref/top_mask.png and top_shaded.png,
// the target outline used by concept_tex.py. Needs out/ref/megaboss_full.glb from build.cjs.
'use strict';
const fs=require('fs');const {open}=require('./lib/browser.cjs');
(async()=>{const {browser,page}=await open({root:__dirname,viewport:{width:1024,height:1024}});
 await page.goto('http://boss.test/lab/lab.html');await page.waitForFunction(()=>window.ready);await page.evaluate(()=>load('/out/ref/megaboss_full.glb'));
 const b=Buffer.from(await page.evaluate(()=>mask('/out/ref/megaboss_full.glb','top',1024,20)),'base64');
 const s=await page.evaluate(()=>shot('/out/ref/megaboss_full.glb','top',1024,20,0));fs.writeFileSync('out/ref/top_shaded.png',Buffer.from(s.split(',')[1],'base64'));
 // mask bytes are bottom-up (readPixels); write a top-down 8-bit PNG through the page canvas
 const png=await page.evaluate(b64=>{const s=atob(b64),n=1024,c=document.createElement('canvas');c.width=c.height=n;const g=c.getContext('2d'),id=g.createImageData(n,n);
   for(let y=0;y<n;y++)for(let x=0;x<n;x++){const v=s.charCodeAt((n-1-y)*n+x)?255:0,i=(y*n+x)*4;id.data[i]=id.data[i+1]=id.data[i+2]=v;id.data[i+3]=255;}g.putImageData(id,0,0);return c.toDataURL('image/png');},b.toString('base64'));
 fs.writeFileSync('out/ref/top_mask.png',Buffer.from(png.split(',')[1],'base64'));await browser.close();console.log('out/ref/top_mask.png');})();
