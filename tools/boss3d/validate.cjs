// Mega-boss validation: glTF validator, top-down silhouette IoU (overall + cockpit / wings / thrusters),
// rear-view nozzle IoU, game-camera IoU, nose direction in Skyfire's real camera, and labelled shots.
// Run after build.cjs: node validate.cjs   -> out/validation.json + out/shots/*.png
'use strict';
const fs=require('fs'),path=require('path');const {open}=require('./lib/browser.cjs');const V=require('gltf-validator');
const LODS=['hq','smooth'],PX=1024,HALF=20;          // top mask: 1024 px over 40 world units = 25.6 px/unit
const REGIONS={cockpit:{x:[-3,3],z:[-10,6]},wingL:{x:[8,15.6],z:[-9,6]},wingR:{x:[-15.6,-8],z:[-9,6]},thrusters:{x:[-9,9],z:[-18.6,-13]},noseSpikes:{x:[-12,12],z:[8,18.6]}};
// readPixels rows run bottom-up; the top camera has screen-up = -Z, so row 0 is z=+HALF
const toPx=(x,z)=>[Math.round((x+HALF)/(2*HALF)*PX),Math.round((HALF-z)/(2*HALF)*PX)];
function iou(a,b,box){let i=0,u=0,x0=0,x1=PX,y0=0,y1=PX;if(box){[x0,y1]=toPx(box.x[0],box.z[0]);[x1,y0]=toPx(box.x[1],box.z[1]);}
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const k=y*PX+x;const A=a[k],B=b[k];if(A&&B)i++;if(A||B)u++;}return u?i/u:1;}
const dec=s=>Buffer.from(s,'base64');
(async()=>{const out={validator:{},lods:{}};
  for(const f of['out/ref/megaboss_full.glb',...LODS.map(l=>`out/megaboss_${l}.glb`)]){const r=await V.validateBytes(new Uint8Array(fs.readFileSync(f)));
    out.validator[path.basename(f)]={errors:r.issues.numErrors,warnings:r.issues.numWarnings,infos:r.issues.numInfos,messages:r.issues.messages.filter(m=>m.severity<2).slice(0,5).map(m=>m.code+': '+m.message)};}
  const {browser,page,errors}=await open({root:__dirname,viewport:{width:PX,height:PX}});
  await page.goto('http://boss.test/lab/lab.html');await page.waitForFunction(()=>window.ready);
  const urls={ref:'/out/ref/megaboss_full.glb',hq:'/out/megaboss_hq.glb',smooth:'/out/megaboss_smooth.glb'};
  for(const u of Object.values(urls))await page.evaluate(u=>load(u),u);
  const m={};for(const [k,u] of Object.entries(urls))m[k]={top:dec(await page.evaluate(a=>mask(...a),[u,'top',PX,HALF])),rear:dec(await page.evaluate(a=>mask(...a),[u,'rear',PX,HALF])),game:dec(await page.evaluate(a=>mask(...a),[u,'game',PX,HALF]))};
  // relief check: mean |height difference| (world units) of the top surface inside each region, where both cover
  const H={};for(const [k,u] of Object.entries(urls))H[k]=await page.evaluate(a=>height(...a),[u,512,HALF]);
  const relief=(a,b,box)=>{const P=512,tp=(x,z)=>[Math.round((x+HALF)/(2*HALF)*P),Math.round((HALF-z)/(2*HALF)*P)];let x0=0,x1=P,y0=0,y1=P;if(box){[x0,y1]=tp(box.x[0],box.z[0]);[x1,y0]=tp(box.x[1],box.z[1]);}
    let s=0,n=0,big=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const A=a[y*P+x],B=b[y*P+x];if(A===null||B===null||isNaN(A)||isNaN(B))continue;const d=Math.abs(A-B);s+=d;n++;if(d>.25)big++;}return {meanAbs:+(s/n).toFixed(3),over025pct:+(100*big/n).toFixed(2)};};
  for(const l of LODS){const r={topIoU:+iou(m.ref.top,m[l].top).toFixed(4),rearIoU:+iou(m.ref.rear,m[l].rear).toFixed(4),gameCamIoU:+iou(m.ref.game,m[l].game).toFixed(4),regions:{}};
    for(const [k,b] of Object.entries(REGIONS))r.regions[k]={iou:+iou(m.ref.top,m[l].top,b).toFixed(4),relief:relief(H.ref,H[l],b)};r.relief=relief(H.ref,H[l]);
    r.pass=r.topIoU>=.98&&Object.values(r.regions).every(v=>v.iou>=.95&&v.relief.meanAbs<.1)&&r.rearIoU>=.95;out.lods[l]=r;console.log(l,JSON.stringify(r));}
  // nose direction in Skyfire's actual gameplay camera (world.js fitCamera: 30 deg tilt from +Z side, looking at origin)
  out.noseCheck=await page.evaluate(()=>{const c=new THREE.PerspectiveCamera(40,412/915,2,2400),t=30*Math.PI/180;c.position.set(0,Math.cos(t),Math.sin(t)).multiplyScalar(110);c.lookAt(0,0,0);c.updateMatrixWorld();
    const p=v=>{const q=new THREE.Vector3(...v).project(c);return +(-q.y).toFixed(3);};return {noseScreenY:p([0,0,15.8]),enginesScreenY:p([0,0,-18.2]),noseBelowEngines:p([0,0,15.8])>p([0,0,-18.2]),leftWingScreenX:+new THREE.Vector3(15,0,0).project(c).x.toFixed(3)};});
  console.log('nose',JSON.stringify(out.noseCheck));
  fs.mkdirSync('out/shots',{recursive:true});
  // diff images: white = both, red = only original, cyan = only LOD
  for(const l of LODS){const a=m.ref.top,b=m[l].top,img=new Uint8Array(PX*PX*4);for(let i=0;i<PX*PX;i++){const A=a[i],B=b[i];const c=A&&B?[200,200,205]:A?[255,40,40]:B?[0,220,255]:[18,20,26];img[i*4]=c[0];img[i*4+1]=c[1];img[i*4+2]=c[2];img[i*4+3]=255;}
    const d=await page.evaluate(([b64,px])=>{const c=document.createElement('canvas');c.width=c.height=px;const g=c.getContext('2d'),id=g.createImageData(px,px),s=atob(b64);for(let i=0;i<s.length;i++)id.data[i]=s.charCodeAt(i);
      // readPixels rows are bottom-up: flip
      const f=g.createImageData(px,px);for(let y=0;y<px;y++)f.data.set(id.data.subarray((px-1-y)*px*4,(px-y)*px*4),y*px*4);g.putImageData(f,0,0);return c.toDataURL();},[Buffer.from(img).toString('base64'),PX]);
    fs.writeFileSync(`out/shots/silhouette_diff_${l}.png`,Buffer.from(d.split(',')[1],'base64'));}
  out.errors=errors;fs.writeFileSync('out/validation.json',JSON.stringify(out,null,1));console.log('validator',JSON.stringify(out.validator));await browser.close();})();
