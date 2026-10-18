// Stage 10 mega-boss build: Meshy base mesh -> game frame -> HQ/Smooth LODs with hard-edge normals,
// engine anchors, projected red/violet strip geometry and hidden weapon-bay markers.
// Run: cd tools/boss3d && npm i && node build.cjs     (reads src/ + rig_src.json, writes out/)
'use strict';
const fs=require('fs'),crypto=require('crypto');
const THREE=require('three');
const {MeshoptSimplifier:S}=require('meshoptimizer');
const M=require('./lib/mesh.cjs');
const SRC='src/megaboss_meshy_original.glb',SHA='39cf4e83269db6dbcd4b70bb30886efa5ec5798edaa2c9cf39f1ec3e21c5231d';
const RIG=JSON.parse(fs.readFileSync('rig_src.json','utf8'));
const HULL={color:[.94,.95,.97,1],roughness:.22,metalness:.08};
const COL={red:[1,.12,.16],violet:[.62,.22,1]};

// vertices on edges shared by more than two faces (a "pinch": thin fins/spikes folded onto themselves by a collapse)
function pinchVerts(I){const e=new Map();for(let f=0;f<I.length;f+=3)for(let k=0;k<3;k++){const a=I[f+k],b=I[f+(k+1)%3],key=a<b?a+'_'+b:b+'_'+a;e.set(key,(e.get(key)||0)+1);}
  const v=new Set();for(const [k,c] of e)if(c>2)for(const x of k.split('_'))v.add(+x);return v;}
// simplify, and if any pinch appears, lock those vertices and their 1-ring in the source mesh and redo the pass
function simplifyNoPinch(I,P,Nv,lock,targetIdx,err,src,log){let out,e,it=0;
  for(;it<12;it++){[out,e]=S.simplifyWithAttributes(I,P,3,Nv,3,[.5,.5,.5],lock,targetIdx,err,[]);const pv=pinchVerts(out);if(!pv.size)break;
    log.push({iter:it,pinchVerts:pv.size,at:[...pv].slice(0,6).map(v=>[P[v*3],P[v*3+1],P[v*3+2]].map(x=>+x.toFixed(1)))});
    for(const v of pv)lock[v]=1;for(let f=0;f<src.length;f+=3)if(pv.has(src[f])||pv.has(src[f+1])||pv.has(src[f+2]))for(let k=0;k<3;k++)lock[src[f+k]]=1;}
  if(pinchVerts(out).size)throw new Error('could not remove non-manifold pinches after '+it+' retries');return [out,e];}
function simplifyLOD(P,I,Nv,target){const repairs={passA:[],passB:[]};
  // pass A: whole mesh, normals as a light attribute so creases survive
  const frac=1-(RIG.underside.keepFrac);const down=r=>r.downFacingPct/100;
  const est=M.check(P,I);const tA=Math.round(target/(1-down(est)*frac));
  const lockA=new Uint8Array(P.length/3);const [IA,eA]=simplifyNoPinch(I,P,Nv,lockA,tA*3,.02,I,repairs.passA);
  // pass B: lock every vertex that touches a face which is not underside (plus pass-A repairs), then thin the underside only
  const {N}=M.faceNormals(P,IA),lock=lockA.slice();
  for(let f=0;f<IA.length/3;f++)if(N[f*3+1]>RIG.underside.downNy)for(let k=0;k<3;k++)lock[IA[f*3+k]]=1;
  const [IB,eB]=simplifyNoPinch(IA,P,Nv,lock,target*3,.05,IA,repairs.passB);
  return {I:IB,errA:eA*S.getScale(P,3),errB:eB*S.getScale(P,3),repairs,lockedForRepair:lockA.reduce((a,b)=>a+b,0)};}

// engines: rear-most vertex clusters (3 nozzles), per-cluster rim -> centre + radius
function findEngines(P){const pts=[];for(let i=0;i<P.length;i+=3)if(P[i+2]<-13)pts.push([P[i],P[i+1],P[i+2]]);
  let c=[-6.5,0,6.5];for(let it=0;it<20;it++){const s=[0,0,0],n=[0,0,0];for(const p of pts){const k=c.map(v=>Math.abs(p[0]-v)).reduce((a,v,i,A)=>v<A[a]?i:a,0);s[k]+=p[0];n[k]++;}c=c.map((v,k)=>n[k]?s[k]/n[k]:v);}
  return c.map((cx,k)=>{const mine=pts.filter(p=>Math.abs(p[0]-cx)===Math.min(...c.map(v=>Math.abs(p[0]-v))));const zmin=Math.min(...mine.map(p=>p[2]));
    const rim=mine.filter(p=>p[2]<zmin+.6),ex=a=>[Math.min(...rim.map(p=>p[a])),Math.max(...rim.map(p=>p[a]))];const X=ex(0),Y=ex(1);
    return {id:'eng_'+['R','C','L'][k],pos:[(X[0]+X[1])/2,(Y[0]+Y[1])/2,zmin],radius:+Math.min((X[1]-X[0])/2,(Y[1]-Y[0])/2).toFixed(3),dir:[0,0,-1]};});}

// projected ribbons: sample a top-down polyline, raycast onto the hull, lift along the normal
function ribbons(mesh,strips,widthMul,lift){const rc=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0),out={red:[],violet:[]};
  const hit=(x,z)=>{rc.set(new THREE.Vector3(x,40,z),down);const h=rc.intersectObject(mesh,false)[0];return h?{p:h.point,n:h.face.normal.clone()}:null;};
  for(const s of strips){const paths=[];let pts=s.pts;
    if(s.ellipse){const e=s.ellipse;pts=[];for(let i=0;i<=e.n;i++){const a=i/e.n*Math.PI*2;pts.push([e.cx+Math.sin(a)*e.rx,e.cz+Math.cos(a)*e.rz]);}}
    paths.push(pts);if(s.mirror)paths.push(pts.map(([x,z])=>[-x,z]));
    for(const path of paths){const samp=[];for(let i=0;i<path.length-1;i++){const [x0,z0]=path[i],[x1,z1]=path[i+1],L=Math.hypot(x1-x0,z1-z0),n=Math.max(1,Math.ceil(L/.3));
        for(let j=0;j<(i===path.length-2?n+1:n);j++){const t=j/n;samp.push(hit(x0+(x1-x0)*t,z0+(z1-z0)*t));}}
      // split into runs at misses and at height jumps (strip would bridge two surfaces)
      let run=[];const runs=[];for(let i=0;i<samp.length;i++){const h=samp[i];if(!h||(run.length&&Math.abs(h.p.y-run[run.length-1].p.y)>2.2)){if(run.length>1)runs.push(run);run=h?[h]:[];}else run.push(h);}
      if(run.length>1)runs.push(run);
      for(const r of runs)out[s.color].push({run:r,w:s.w*widthMul});}}
  const geo=c=>{const P=[],N=[],UV=[],I=[];for(const {run,w} of out[c]){let len=0;const base=P.length/3;
      for(let i=0;i<run.length;i++){const a=run[Math.max(0,i-1)].p,b=run[Math.min(run.length-1,i+1)].p,t=b.clone().sub(a).normalize(),n=run[i].n;
        if(n.y<0)n.negate();const side=new THREE.Vector3().crossVectors(n,t).normalize(),p=run[i].p.clone().addScaledVector(n,lift);if(i)len+=run[i].p.distanceTo(run[i-1].p);
        for(const sg of[-1,1]){const q=p.clone().addScaledVector(side,sg*w/2);P.push(q.x,q.y,q.z);N.push(n.x,n.y,n.z);UV.push(len,sg<0?0:1);}}
      for(let i=0;i<run.length-1;i++){const a=base+i*2;I.push(a,a+2,a+1,a+1,a+2,a+3);}}
    // keep triangles facing up
    for(let f=0;f<I.length;f+=3){const a=I[f]*3,b=I[f+1]*3,cc=I[f+2]*3;const ny=(P[b+2]-P[a+2])*(P[cc]-P[a])-(P[b]-P[a])*(P[cc+2]-P[a+2]);if(ny<0){const t=I[f+1];I[f+1]=I[f+2];I[f+2]=t;}}
    return {P:new Float32Array(P),N:new Float32Array(N),UV:new Float32Array(UV),I:new Uint32Array(I)};};
  return {red:geo('red'),violet:geo('violet'),runs:{red:out.red.length,violet:out.violet.length}};}

(async()=>{await S.ready;S.useExperimentalFeatures=true;
  const raw=fs.readFileSync(SRC),sha=crypto.createHash('sha256').update(raw).digest('hex');if(sha!==SHA)throw new Error('original GLB changed: '+sha);
  const o=M.readGLB(SRC),g=M.toGameFrame(o.P,RIG.span),Nv=M.vertexNormals(g.P,o.I);
  const report={source:{file:SRC,sha256:sha,...M.check(g.P,o.I),scaleToGame:+g.scale.toFixed(4),bbox:M.bbox(g.P)},lods:{}};
  const engines=findEngines(g.P);
  fs.mkdirSync('out/ref',{recursive:true});
  // full-resolution reference in the game frame (validation only, not committed)
  await M.writeGLB('out/ref/megaboss_full.glb',{hull:{P:g.P,I:o.I,N:Nv},hullMat:HULL});
  for(const [name,L] of Object.entries(RIG.lods)){
    const s=simplifyLOD(g.P,o.I,Nv,L.targetTris),c=M.compact(g.P,s.I),topo=M.check(c.P,c.I);
    const n=M.creaseNormals(c.P,c.I,L.crease),nchk=M.check(n.P,n.I,n.N);
    // raycast target for strips/markers: this LOD's own surface
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(n.P,3));geo.setIndex(new THREE.BufferAttribute(n.I,1));
    const mesh=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));mesh.updateMatrixWorld();
    const core=ribbons(mesh,RIG.strips,1,.06),glow=name==='hq'?ribbons(mesh,RIG.strips,4,.04):null;
    const rc=new THREE.Raycaster();const markers=RIG.markers.map(m=>{rc.set(new THREE.Vector3(m.xz[0],40,m.xz[1]),new THREE.Vector3(0,-1,0));const h=rc.intersectObject(mesh)[0];
      return {id:m.id,bay:m.bay,side:m.side,pos:[m.xz[0],h?+h.point.y.toFixed(3):0,m.xz[1]],onSurface:!!h,deploy:[0,1,0]};});
    const extras=[{name:'strip_red',geo:core.red,emissive:COL.red},{name:'strip_violet',geo:core.violet,emissive:COL.violet}];
    if(glow)extras.push({name:'glow_red',geo:glow.red,emissive:COL.red},{name:'glow_violet',geo:glow.violet,emissive:COL.violet});
    const empties=[...engines.map(e=>({name:e.id,pos:e.pos,extras:{kind:'engine',radius:e.radius,dir:e.dir}})),...markers.map(m=>({name:m.id,pos:m.pos,extras:{kind:'weaponBay',bay:m.bay,side:m.side,deploy:m.deploy,hidden:true}}))];
    const file=`out/megaboss_${name}.glb`;await M.writeGLB(file,{hull:{P:n.P,N:n.N,I:n.I},extras,empties,hullMat:HULL,quant:true});
    const stripTris=extras.reduce((a,e)=>a+e.geo.I.length/3,0);
    report.lods[name]={file,bytes:fs.statSync(file).size,targetTris:L.targetTris,creaseDeg:L.crease,hull:{...topo,vertsAfterNormalSplit:n.P.length/3,hardEdgeVerts:n.hardVerts,badNormals:nchk.badNormals,flippedCorners:nchk.flippedCorners},
      simplifyError:{passA:+s.errA.toFixed(4),passB:+s.errB.toFixed(4)},pinchRepairs:s.repairs,strips:{runs:{red:core.runs.red,violet:core.runs.violet},tris:stripTris},markers};
    console.log(name,JSON.stringify(report.lods[name].hull),'strip tris',stripTris,'bytes',report.lods[name].bytes);}
  report.engines=engines;
  fs.writeFileSync('out/rig.json',JSON.stringify({about:'Mega-boss rig (game frame: +X right, +Z nose/screen-down, +Y up; world units, K=0.1)',engines,markers:report.lods.hq.markers,strips:RIG.strips.map(s=>({id:s.id,color:s.color}))},null,1));
  fs.writeFileSync('out/build_report.json',JSON.stringify(report,null,1));console.log('engines',JSON.stringify(engines));})();
