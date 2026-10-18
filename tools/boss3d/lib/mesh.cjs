// Mesh helpers for the mega-boss pipeline: GLB read/write, transform, compaction, hard-edge normals, checks.
// Plain CommonJS, no build step. Coordinates are Skyfire world units (K=0.1: 1 world unit = 10 logic px).
'use strict';
const fs=require('fs');
const {Document,NodeIO}=require('@gltf-transform/core');
const {quantize}=require('@gltf-transform/functions');
const {KHRMeshQuantization}=require('@gltf-transform/extensions');

// read the first primitive of the first mesh (positions + indices)
function readGLB(file){
  const b=fs.readFileSync(file),jl=b.readUInt32LE(12),J=JSON.parse(b.slice(20,20+jl).toString()),B=b.slice(20+jl+8);
  const acc=i=>{const a=J.accessors[i],bv=J.bufferViews[a.bufferView],n={SCALAR:1,VEC3:3}[a.type];
    const T={5126:Float32Array,5125:Uint32Array,5123:Uint16Array}[a.componentType];
    const o=B.byteOffset+(bv.byteOffset||0)+(a.byteOffset||0);return new T(B.buffer.slice(o,o+a.count*n*T.BYTES_PER_ELEMENT));};
  const p=J.meshes[0].primitives[0];return {P:new Float32Array(acc(p.attributes.POSITION)),I:new Uint32Array(acc(p.indices))};}

function bbox(P){const mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];for(let i=0;i<P.length;i+=3)for(let k=0;k<3;k++){const v=P[i+k];if(v<mn[k])mn[k]=v;if(v>mx[k])mx[k]=v;}
  return {min:mn,max:mx,size:mx.map((v,k)=>v-mn[k]),center:mx.map((v,k)=>(v+mn[k])/2)};}

// Meshy output: nose -X, engines +X, Y up. Skyfire: nose toward the player = +Z (screen down), engines -Z.
// Rotate +90 deg about Y: (x,y,z) -> (z, y, -x); then centre on the bbox and scale to the target wingspan.
function toGameFrame(P,span){const Q=new Float32Array(P.length);for(let i=0;i<P.length;i+=3){Q[i]=P[i+2];Q[i+1]=P[i+1];Q[i+2]=-P[i];}
  const b=bbox(Q),s=span/b.size[0];for(let i=0;i<Q.length;i+=3)for(let k=0;k<3;k++)Q[i+k]=(Q[i+k]-b.center[k])*s;return {P:Q,scale:s};}

// drop unused vertices after simplification
function compact(P,I){const map=new Int32Array(P.length/3).fill(-1);let n=0;const out=new Uint32Array(I.length);
  for(let i=0;i<I.length;i++){const v=I[i];if(map[v]<0)map[v]=n++;out[i]=map[v];}
  const Q=new Float32Array(n*3);for(let v=0;v<map.length;v++)if(map[v]>=0)Q.set(P.subarray(v*3,v*3+3),map[v]*3);return {P:Q,I:out};}

function faceNormals(P,I){const F=I.length/3,N=new Float32Array(F*3),A=new Float32Array(F);
  for(let f=0;f<F;f++){const a=I[f*3]*3,b=I[f*3+1]*3,c=I[f*3+2]*3;
    const ux=P[b]-P[a],uy=P[b+1]-P[a+1],uz=P[b+2]-P[a+2],vx=P[c]-P[a],vy=P[c+1]-P[a+1],vz=P[c+2]-P[a+2];
    const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,l=Math.hypot(nx,ny,nz)||1e-20;N[f*3]=nx/l;N[f*3+1]=ny/l;N[f*3+2]=nz/l;A[f]=l/2;}
  return {N,A};}

// smooth vertex normals (area weighted), used as a simplifier attribute
function vertexNormals(P,I){const {N,A}=faceNormals(P,I),V=new Float32Array(P.length);
  for(let f=0;f<I.length/3;f++)for(let k=0;k<3;k++){const v=I[f*3+k]*3;for(let j=0;j<3;j++)V[v+j]+=N[f*3+j]*A[f];}
  for(let i=0;i<V.length;i+=3){const l=Math.hypot(V[i],V[i+1],V[i+2])||1;V[i]/=l;V[i+1]/=l;V[i+2]/=l;}return V;}

// Hard-edge normals: each triangle corner averages only the neighbouring faces within `crease` degrees of its own
// face, then identical corner normals are merged. Edges sharper than the crease angle split into separate vertices.
function creaseNormals(P,I,crease){const {N,A}=faceNormals(P,I),nv=P.length/3,F=I.length/3,cos=Math.cos(crease*Math.PI/180);
  const start=new Uint32Array(nv+1);for(const v of I)start[v+1]++;for(let v=0;v<nv;v++)start[v+1]+=start[v];
  const fill=start.slice(0,nv),inc=new Uint32Array(I.length);for(let f=0;f<F;f++)for(let k=0;k<3;k++)inc[fill[I[f*3+k]]++]=f;
  const outP=[],outN=[],outI=new Uint32Array(I.length);let hard=0;
  for(let v=0;v<nv;v++){const fs=inc.subarray(start[v],start[v+1]),keys=new Map();
    for(const f of fs){let x=0,y=0,z=0;for(const g of fs){const d=N[f*3]*N[g*3]+N[f*3+1]*N[g*3+1]+N[f*3+2]*N[g*3+2];if(d>=cos){x+=N[g*3]*A[g];y+=N[g*3+1]*A[g];z+=N[g*3+2]*A[g];}}
      const l=Math.hypot(x,y,z)||1;x/=l;y/=l;z/=l;const key=Math.round(x*1e4)+','+Math.round(y*1e4)+','+Math.round(z*1e4);
      let id=keys.get(key);if(id===undefined){id=outP.length/3;keys.set(key,id);outP.push(P[v*3],P[v*3+1],P[v*3+2]);outN.push(x,y,z);}
      for(let k=0;k<3;k++)if(I[f*3+k]===v)outI[f*3+k]=id;}
    if(keys.size>1)hard++;}
  return {P:new Float32Array(outP),N:new Float32Array(outN),I:outI,hardVerts:hard};}

// topology + normal checks
function check(P,I,Nrm){const F=I.length/3,edges=new Map();let degen=0;const {N,A}=faceNormals(P,I);
  for(let f=0;f<F;f++){if(A[f]<1e-10)degen++;for(let k=0;k<3;k++){const a=I[f*3+k],b=I[f*3+(k+1)%3],key=a<b?a+'_'+b:b+'_'+a;edges.set(key,(edges.get(key)||0)+1);}}
  let boundary=0,nonman=0;for(const c of edges.values()){if(c===1)boundary++;else if(c>2)nonman++;}
  // signed volume > 0 means the winding faces outward
  let vol=0;for(let f=0;f<F;f++){const a=I[f*3]*3,b=I[f*3+1]*3,c=I[f*3+2]*3;vol+=(P[a]*(P[b+1]*P[c+2]-P[b+2]*P[c+1])-P[a+1]*(P[b]*P[c+2]-P[b+2]*P[c])+P[a+2]*(P[b]*P[c+1]-P[b+1]*P[c]))/6;}
  const r={tris:F,verts:P.length/3,boundaryEdges:boundary,nonManifoldEdges:nonman,degenerate:degen,signedVolume:+vol.toFixed(3),downFacingPct:0};
  let down=0;for(let f=0;f<F;f++)if(N[f*3+1]<-.3)down++;r.downFacingPct=+(100*down/F).toFixed(1);
  if(Nrm){let bad=0,flip=0;for(let i=0;i<Nrm.length;i+=3){const l=Math.hypot(Nrm[i],Nrm[i+1],Nrm[i+2]);if(!(Math.abs(l-1)<1e-3))bad++;}
    // corner normal vs its face normal: should never point away from the face
    for(let f=0;f<F;f++)for(let k=0;k<3;k++){const v=I[f*3+k]*3;if(Nrm[v]*N[f*3]+Nrm[v+1]*N[f*3+1]+Nrm[v+2]*N[f*3+2]<0)flip++;}
    r.badNormals=bad;r.flippedCorners=flip;}
  return r;}

// write a GLB: hull + optional extra meshes (strips) + empty nodes (anchors/markers)
async function writeGLB(file,{hull,extras=[],empties=[],hullMat,quant=false}){const doc=new Document(),buf=doc.createBuffer(),scene=doc.createScene('MegaBoss');
  const root=doc.createNode('megaboss');scene.addChild(root);
  const add=(name,g,mat)=>{const prim=doc.createPrimitive().setMaterial(mat)
      .setAttribute('POSITION',doc.createAccessor().setType('VEC3').setArray(g.P).setBuffer(buf))
      .setIndices(doc.createAccessor().setType('SCALAR').setArray(g.P.length/3<65536?Uint16Array.from(g.I):g.I).setBuffer(buf));
    if(g.N)prim.setAttribute('NORMAL',doc.createAccessor().setType('VEC3').setArray(g.N).setBuffer(buf));
    if(g.UV)prim.setAttribute('TEXCOORD_0',doc.createAccessor().setType('VEC2').setArray(g.UV).setBuffer(buf));
    root.addChild(doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(prim)));};
  const hm=doc.createMaterial('hull_white').setBaseColorFactor(hullMat.color).setRoughnessFactor(hullMat.roughness).setMetallicFactor(hullMat.metalness);
  // concept texture (top-down projected): base colour + glow (emissive) maps, JPEG, sampled with the hull's TEXCOORD_0
  if(hullMat.tex){const t=k=>doc.createTexture(k).setImage(fs.readFileSync(hullMat.tex[k])).setMimeType('image/jpeg').setURI(k+'.jpg');
    hm.setBaseColorFactor([1,1,1,1]).setBaseColorTexture(t('albedo'));if(hullMat.tex.glow)hm.setEmissiveTexture(t('glow')).setEmissiveFactor([1,1,1]);}
  add('hull',hull,hm);
  for(const e of extras){const m=doc.createMaterial(e.name).setBaseColorFactor([0,0,0,1]).setEmissiveFactor(e.emissive).setRoughnessFactor(1).setMetallicFactor(0);add(e.name,e.geo,m);}
  for(const e of empties){const n=doc.createNode(e.name).setTranslation(e.pos);if(e.extras)n.setExtras(e.extras);root.addChild(n);}
  const asset=doc.getRoot().getAsset();asset.generator='skyfire tools/boss3d (from Meshy AI base mesh)';
  asset.copyright='Base model "Neon Valkyrie" generated with Meshy AI (meshy.ai), free plan: licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Modified for Skyfire Squadron: re-oriented, re-scaled, simplified, re-shaded, strips/engine/weapon-bay anchors added.';
  // KHR_mesh_quantization (supported by the r128 GLTFLoader): 14-bit positions, 10-bit normals, about half the bytes
  if(quant)await doc.transform(quantize({quantizePosition:14,quantizeNormal:10,quantizeTexcoord:12}));
  fs.writeFileSync(file,await new NodeIO().registerExtensions([KHRMeshQuantization]).writeBinary(doc));}

module.exports={readGLB,bbox,toGameFrame,compact,vertexNormals,creaseNormals,check,writeGLB,faceNormals};
