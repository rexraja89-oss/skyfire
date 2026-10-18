// Mega-boss validation with assertions (exit code 1 on any failed check; diagnostics are always written first).
//  - glTF validator on every GLB (0 errors)
//  - coverage masks vs the full 188k reference: top, game camera, rear, side, low rear-quarter, bottom; per region
//    (cockpit, wings, thrusters, nose spikes): overlap, missing/extra pixels, non-empty coverage
//  - top and bottom height maps: mean / p95 / max surface error per region
//  - exported (quantized) GLB as the r128 loader delivers it: watertight, manifold, normals, outward winding,
//    strips sitting on the hull, engine anchors, weapon-bay markers (on surface, mirrored, hidden)
//  - look layer: shader compile without errors, canopy / nozzle masks render as intended, draw-call budget
//  - nose direction in Skyfire's real camera; no browser errors
// Run after build.cjs: node validate.cjs            -> out/validation.json, out/validation.log, out/shots/*.png
//      negative test:  node fixture.cjs && node validate.cjs --fixture   (must exit 1)
'use strict';
const fs=require('fs'),path=require('path');const {open}=require('./lib/browser.cjs');const V=require('gltf-validator');
const FIXTURE=process.argv.includes('--fixture');
const LODS=FIXTURE?['fixture']:['hq','smooth'],PX=1024,HALF=20,HP=512;     // masks: 1024 px over 40 units (25.6 px/unit)
const URL={ref:'/out/ref/megaboss_full.glb',hq:'/out/megaboss_hq.glb',smooth:'/out/megaboss_smooth.glb',fixture:'/out/fixture/megaboss_broken.glb'};
const REGIONS={cockpit:{x:[-3,3],z:[-10,6]},wingL:{x:[8,15.6],z:[-9,6]},wingR:{x:[-15.6,-8],z:[-9,6]},thrusters:{x:[-9,9],z:[-18.6,-13]},noseSpikes:{x:[-12,12],z:[8,18.6]}};
// Thresholds, fixed before measuring. Top/game outline is Rex's requirement; other views allow for the thinned underside.
const LIM={top:.98,game:.98,rear:.95,side:.95,glance:.95,bottom:.93,regionIoU:.95,regionMissPct:2,regionMinPx:500,reliefMean:.1,reliefP95:.3,
  outwardPct:97,stripBuriedPct:1,stripFloatPct:3,markerGap:.05,mirror:.01,drawCalls:{hq:6,smooth:5,fixture:6}};
const log=[],fails=[];const say=s=>{log.push(s);console.log(s);};
const check=(name,ok,val)=>{const fin=v=>typeof v!=='number'||Number.isFinite(v);const good=!!ok&&(val===undefined||(Array.isArray(val)?val.every(fin):fin(val)));
  say((good?'PASS ':'FAIL ')+name+(val!==undefined?'  '+JSON.stringify(val):''));if(!good)fails.push(name);return good;};
const toPx=(x,z,P)=>[Math.round((x+HALF)/(2*HALF)*P),Math.round((HALF-z)/(2*HALF)*P)];   // readPixels rows run bottom-up
const boxPx=(b,P)=>{const [x0,y1]=toPx(b.x[0],b.z[0],P),[x1,y0]=toPx(b.x[1],b.z[1],P);return {x0,x1,y0,y1};};
function cover(a,b,box){let i=0,u=0,miss=0,extra=0,n=0,x0=0,x1=PX,y0=0,y1=PX;if(box)({x0,x1,y0,y1}=boxPx(box,PX));
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const k=y*PX+x,A=a[k],B=b[k];if(A)n++;if(A&&B)i++;if(A||B)u++;if(A&&!B)miss++;if(B&&!A)extra++;}
  return {iou:u?+(i/u).toFixed(4):NaN,refPx:n,missPct:n?+(100*miss/n).toFixed(2):NaN,extraPct:n?+(100*extra/n).toFixed(2):NaN};}
function relief(a,b,box){let x0=0,x1=HP,y0=0,y1=HP;if(box)({x0,x1,y0,y1}=boxPx(box,HP));const d=[];
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const A=a[y*HP+x],B=b[y*HP+x];if(A==null||B==null)continue;d.push(Math.abs(A-B));}
  d.sort((p,q)=>p-q);const at=f=>d.length?+d[Math.min(d.length-1,Math.floor(f*d.length))].toFixed(3):NaN;
  return {n:d.length,mean:d.length?+(d.reduce((s,v)=>s+v,0)/d.length).toFixed(3):NaN,p95:at(.95),max:d.length?+d[d.length-1].toFixed(3):NaN};}
const dec=s=>Buffer.from(s,'base64');
(async()=>{const out={fixture:FIXTURE,limits:LIM,validator:{},lods:{}};let browser;
 try{
  for(const k of['ref',...LODS]){const f='.'+URL[k];if(!check(`${k}: GLB exists`,fs.existsSync(f)))continue;
    const r=await V.validateBytes(new Uint8Array(fs.readFileSync(f)));out.validator[k]={errors:r.issues.numErrors,warnings:r.issues.numWarnings,messages:r.issues.messages.filter(m=>m.severity<2).slice(0,5).map(m=>m.code+': '+m.message)};
    check(`${k}: glTF validator 0 errors`,r.issues.numErrors===0,r.issues.numErrors);}
  const o=await open({root:__dirname,viewport:{width:PX,height:PX}});browser=o.browser;const {page,errors}=o;
  await page.goto('http://boss.test/lab/lab.html');await page.waitForFunction(()=>window.ready,null,{timeout:30000});
  for(const k of['ref',...LODS])await page.evaluate(u=>load(u),URL[k]);
  const VIEWS=['top','game','rear','side','glance','bottom'],m={},H={};
  for(const k of['ref',...LODS]){m[k]={};for(const v of VIEWS)m[k][v]=dec(await page.evaluate(a=>mask(...a),[URL[k],v,PX,HALF]));
    H[k]={top:await page.evaluate(a=>height(...a),[URL[k],HP,HALF,'top']),bottom:await page.evaluate(a=>height(...a),[URL[k],HP,HALF,'bottom'])};}
  for(const l of LODS){const r={views:{},regions:{},relief:{}};out.lods[l]=r;say(`--- ${l}`);
    for(const v of VIEWS){r.views[v]=cover(m.ref[v],m[l][v]);check(`${l}: ${v} outline overlap >= ${LIM[v]}`,r.views[v].iou>=LIM[v],r.views[v].iou);}
    for(const [k,b] of Object.entries(REGIONS)){const c=cover(m.ref.top,m[l].top,b),rt=relief(H.ref.top,H[l].top,b);r.regions[k]={...c,reliefTop:rt};
      check(`${l}: ${k} has coverage (>= ${LIM.regionMinPx} px)`,c.refPx>=LIM.regionMinPx,c.refPx);
      check(`${l}: ${k} overlap >= ${LIM.regionIoU}, missing < ${LIM.regionMissPct}%`,c.iou>=LIM.regionIoU&&c.missPct<LIM.regionMissPct,[c.iou,c.missPct]);
      check(`${l}: ${k} height error mean < ${LIM.reliefMean}, p95 < ${LIM.reliefP95}`,rt.n>0&&rt.mean<LIM.reliefMean&&rt.p95<LIM.reliefP95,[rt.mean,rt.p95,rt.max]);}
    r.relief.top=relief(H.ref.top,H[l].top);r.relief.bottom=relief(H.ref.bottom,H[l].bottom);
    check(`${l}: whole top surface height error p95 < ${LIM.reliefP95}`,r.relief.top.p95<LIM.reliefP95,[r.relief.top.mean,r.relief.top.p95,r.relief.top.max]);
    say(`INFO ${l}: underside height error (thinned on purpose) ${JSON.stringify(r.relief.bottom)}`);
    // exported GLB geometry as loaded
    const g=await page.evaluate(u=>geom(u),URL[l]);r.geometry=g;
    check(`${l}: watertight (0 boundary edges)`,g.boundary===0,g.boundary);check(`${l}: manifold (0 edges with >2 faces)`,g.nonManifold===0,g.nonManifold);
    check(`${l}: 0 degenerate triangles`,g.degenerate===0,g.degenerate);check(`${l}: normals unit length after dequantization`,g.badNormals===0,g.badNormals);
    check(`${l}: 0 corner normals facing away from their face`,g.flippedCorners===0,g.flippedCorners);
    check(`${l}: outward winding >= ${LIM.outwardPct}% (ray parity, ${g.outwardTested} faces)`,g.outwardPct>=LIM.outwardPct,g.outwardPct);
    const sb=100*g.strip.buried/Math.max(1,g.strip.n),sf=100*g.strip.floating/Math.max(1,g.strip.n);
    check(`${l}: strips sampled (${g.strip.n} verts)`,g.strip.n>100,g.strip.n);check(`${l}: strips buried < ${LIM.stripBuriedPct}%, floating < ${LIM.stripFloatPct}%`,sb<LIM.stripBuriedPct&&sf<LIM.stripFloatPct,[+sb.toFixed(2),+sf.toFixed(2)]);
    const E=g.anchors.eng,ez=E.map(e=>e.pos[2]);check(`${l}: 3 engine anchors at the rear, pointing -Z`,E.length===3&&E.every(e=>e.pos[2]<g.bbox.min[2]+3.5&&e.pos[2]>g.bbox.min[2]-.5&&JSON.stringify(e.dir)==='[0,0,-1]'&&e.radius>0),ez.map(z=>+z.toFixed(2)));
    const W=g.anchors.wb,by=n=>W.find(w=>w.name===n);check(`${l}: 7 weapon-bay markers, hidden, with deploy direction`,W.length===7&&W.every(w=>w.hidden===true&&Array.isArray(w.deploy)),W.length);
    check(`${l}: markers on the hull surface (gap < ${LIM.markerGap})`,W.every(w=>w.surfaceGap!==null&&Math.abs(w.surfaceGap)<LIM.markerGap),W.map(w=>w.surfaceGap));
    check(`${l}: L/R markers mirror each other`,['missile','drone','cannon'].every(b=>{const L=by('wb_'+b+'_L'),R=by('wb_'+b+'_R');return L&&R&&Math.abs(L.pos[0]+R.pos[0])<LIM.mirror&&Math.abs(L.pos[2]-R.pos[2])<LIM.mirror;}));
    // look layer: compile + masks + draw budget (canopy centre vs open hull; nozzle centre from behind)
    const nz=E.find(e=>e.name==='eng_C')||E[0];
    const np=nz?nz.pos:[0,0,-18],nr=nz?nz.radius:1.2;
    // canopy = mean over 15 points inside the canopy ellipse; hull = mean over 6 points on the wing/nacelle tops
    const canPts=[],hullPts=[];for(let i=0;i<5;i++)for(const dx of[-.5,0,.5])canPts.push([dx,8,-1.5+(i-2)*1.6]);for(const sx of[-1,1])for(const [x,z] of[[5.5,0],[9,-2],[6.5,4]])hullPts.push([sx*x,8,z]);
    const fx=await page.evaluate(([u,hq,s])=>fxCheck(u,hq,s),[URL[l],l!=='smooth',{top:canPts.concat(hullPts),rear:[[np[0],np[1],np[2]-.2]],ring:[[np[0]+nr*.6,np[1],np[2]-.3]]}]);r.fx=fx;
    const avg=a=>[0,1,2].map(k=>Math.round(a.reduce((s,c)=>s+c[k],0)/a.length)),lum=c=>.2126*c[0]+.7152*c[1]+.0722*c[2];
    const can=avg(fx.top.slice(0,canPts.length)),hull=avg(fx.top.slice(canPts.length));
    check(`${l}: canopy renders as dark violet glass (area mean darker than hull tops, blue > green)`,lum(can)<lum(hull)*.75&&can[2]>can[1],{canopy:can,hull});
    check(`${l}: nozzle heat (hull shader, engine FX hidden) renders violet`,fx.rear[0][2]>fx.rear[0][1]+40&&fx.rear[0][0]>fx.rear[0][1],fx.rear[0]);
    check(`${l}: engine disc renders violet from behind`,fx.ring[0][2]>fx.ring[0][1]+40,fx.ring[0]);
    check(`${l}: look layer draw objects <= ${LIM.drawCalls[l]}`,fx.drawables<=LIM.drawCalls[l],fx.drawables);}
  // nose direction in Skyfire's actual gameplay camera (world.js fitCamera: 30 deg tilt from +Z side, looking at origin)
  out.r128RawRead=await page.evaluate(u=>rawReadProblem(u),URL[LODS[0]]);say('INFO r128 CPU read of quantized position[0].x (raw, not de-normalized): '+JSON.stringify(out.r128RawRead));
  out.noseCheck=await page.evaluate(()=>{const c=new THREE.PerspectiveCamera(40,412/915,2,2400),t=30*Math.PI/180;c.position.set(0,Math.cos(t),Math.sin(t)).multiplyScalar(110);c.lookAt(0,0,0);c.updateMatrixWorld();
    const p=v=>{const q=new THREE.Vector3(...v).project(c);return +(-q.y).toFixed(3);};return {noseScreenY:p([0,0,15.8]),enginesScreenY:p([0,0,-18.2])};});
  check('nose toward the player (lower half), engines in the upper half',out.noseCheck.noseScreenY>0&&out.noseCheck.enginesScreenY<0,[out.noseCheck.noseScreenY,out.noseCheck.enginesScreenY]);
  // diff images: grey = both, red = only original, cyan = only LOD
  fs.mkdirSync('out/shots',{recursive:true});
  for(const l of LODS){const a=m.ref.top,b=m[l].top,img=new Uint8Array(PX*PX*4);for(let i=0;i<PX*PX;i++){const A=a[i],B=b[i];const c=A&&B?[200,200,205]:A?[255,40,40]:B?[0,220,255]:[18,20,26];img.set([...c,255],i*4);}
    const d=await page.evaluate(([b64,px])=>{const c=document.createElement('canvas');c.width=c.height=px;const g=c.getContext('2d'),id=g.createImageData(px,px),s=atob(b64);for(let i=0;i<s.length;i++)id.data[i]=s.charCodeAt(i);
      const f=g.createImageData(px,px);for(let y=0;y<px;y++)f.data.set(id.data.subarray((px-1-y)*px*4,(px-y)*px*4),y*px*4);g.putImageData(f,0,0);return c.toDataURL();},[Buffer.from(img).toString('base64'),PX]);
    fs.writeFileSync(`out/shots/silhouette_diff_${l}.png`,Buffer.from(d.split(',')[1],'base64'));}
  out.browserErrors=errors;check('no browser, shader or loader errors',errors.length===0,errors.length);if(errors.length)errors.slice(0,5).forEach(e=>say('  '+e));
 }catch(e){check('validation ran to completion',false);say(String(e&&e.stack||e));}
 finally{if(browser)await browser.close();
  out.failed=fails;out.passed=fails.length===0;const base=FIXTURE?'out/fixture/validation':'out/validation';fs.mkdirSync(path.dirname(base),{recursive:true});
  fs.writeFileSync(base+'.json',JSON.stringify(out,null,1));fs.writeFileSync(base+'.log',log.join('\n')+'\n');
  say(fails.length?`VALIDATION FAILED: ${fails.length} check(s)`:'VALIDATION PASSED');process.exitCode=fails.length?1:0;}})();
