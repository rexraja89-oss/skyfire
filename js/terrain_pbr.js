'use strict';
// ============ REALISTIC TERRAIN (Phase 1) ============
// Opt-in per biome with `pbr:1` (Jungle Ridge's set) or `pbr:{tex:[base,soil,rock,moss,gravel],tint:[...5 rgb],strata,ns}`
// to pick other layer textures (art/ter_*.jpg), tint them per layer and add coloured rock strata (canyon walls). Replaces the flat vertex-colour terrain with:
//  - five blended material layers (grass, soil, rock, moss, gravel; art/ter_*.jpg from tools/terrain_tex.py), chosen per
//    vertex by slope, height and noise (biome.splat) and blended per pixel by the textures' own heights (no hard edges)
//  - triplanar rock on steep faces (no stretching), strata on cliff faces, macro variation against visible tiling
//  - per-vertex ambient occlusion from the height field (horizon sampling) plus contact occlusion under trees and rocks
//  - normals from one continuous height field, so neighbouring tiles share identical edges (no seams)
//  - a sun shadow camera fitted to the visible ground every frame, 2048 px in HQ mode
// The renderer, camera, tile streaming and gameplay are unchanged; other biomes keep the old path.
(()=>{
const T3=THREE,Tr=SF.terrain={};
const E=4;                         // border cells sampled around each tile (normals and AO stay continuous across tiles)
const PERIOD=600;                  // texture coordinates wrap every 600 units; every layer scale is a multiple of 1/600
// ---------- material ----------
function tex(f){const t=new T3.TextureLoader().load('art/'+f+'?v='+BUILD);t.wrapS=t.wrapT=T3.RepeatWrapping;t.anisotropy=8;return t;}
const HEAD=`
uniform sampler2D tG,tS,tR,tM,tV,nG,nR,tX;uniform vec3 uT0,uT1,uT2,uT3,uT4,uSC;uniform float uStrata,uNS;
varying vec4 vSplat;varying float vAO;varying vec3 vTP;varying vec3 vTN;
vec3 L(vec4 c){return pow(c.rgb,vec3(2.2));}
#define RS (54./600.)
`;
const MAPF=`
vec3 n0=normalize(vTN);vec2 P=vTP.xz;
vec3 mac=texture2D(tX,P*(3./600.)).rgb;float brk=texture2D(tX,P*(22./600.)+.5).g;
vec3 tw=pow(abs(n0),vec3(8.));tw/=tw.x+tw.y+tw.z;
vec3 cG=mix(L(texture2D(tG,P*(102./600.))),L(texture2D(tG,P*(28./600.)+vec2(.31,.17))),.2+.6*mac.g)*uT0;
vec3 cS=L(texture2D(tS,P*(126./600.)))*uT1,cM=L(texture2D(tM,P*(114./600.)))*uT3,cV=L(texture2D(tV,P*(156./600.)))*uT4;
#ifdef SF_LITE
vec3 cR=L(texture2D(tR,P*RS));
#else
vec3 cR=tw.y*L(texture2D(tR,P*RS));
if(tw.x+tw.z>.02)cR+=tw.x*L(texture2D(tR,vTP.zy*RS))+tw.z*L(texture2D(tR,vTP.xy*RS));   // side projections only on steep pixels
#endif
// weights: per-vertex splat, rock forced on steep pixels, noise breaks up the vertex grid
vec4 w=vSplat;w.y=max(w.y,smoothstep(.36,.62,1.-n0.y));cR*=(.86+.3*mix(mac.r,brk,.5))*uT2;   // large-scale weathering from the macro map (no extra fetch)
if(uStrata>0.){float sb=.5+.5*sin(vTP.y*2.3+brk*2.5);cR*=mix(vec3(1.),uSC,uStrata*sb);}   // coloured rock bands follow height
w.x*=.55+.9*brk;w.z*=.55+.9*(1.-brk);
float wg=max(0.,1.-w.x-w.y-w.z-w.w);
// height-based blending: each layer's brightness acts as its height, so pebbles and rock poke through grass
float a0=wg+dot(cG,vec3(.9))*.35-step(wg,.01),a1=w.x+dot(cS,vec3(.9))*.35-step(w.x,.01),a2=w.y+dot(cR,vec3(.9))*.3-step(w.y,.01),
      a3=w.z+dot(cM,vec3(.9))*.35-step(w.z,.01),a4=w.w+dot(cV,vec3(.9))*.35-step(w.w,.01);
float mx=max(max(max(a0,a1),max(a2,a3)),a4)-.14;
float b0=max(a0-mx,0.),b1=max(a1-mx,0.),b2=max(a2-mx,0.),b3=max(a3-mx,0.),b4=max(a4-mx,0.),bs=b0+b1+b2+b3+b4+1e-4;
b0/=bs;b1/=bs;b2/=bs;b3/=bs;b4/=bs;
vec3 alb=cG*b0+cS*b1+cR*b2+cM*b3+cV*b4;
alb*=mix(.8,1.14,mac.r);alb=mix(alb,alb*vec3(1.07,1.,.84),mac.b*.45);   // large-scale brightness and dry/damp variation
diffuseColor.rgb*=alb*1.9;
float bRock=b2;
`;
const ROUGHF=`float roughnessFactor=mix(.97,.8,bRock);`;
const NORMF=`
#ifndef SF_LITE
// normal maps store green = +V; on the horizontal projection (P = xz) +V is world +Z
vec3 ng=texture2D(nG,P*(102./600.)).xyz*2.-1.;
vec3 nr=texture2D(nR,P*RS).xyz*2.-1.;
vec3 pr=tw.y*vec3(nr.x,0.,nr.y);
if(tw.x+tw.z>.02){vec3 nrx=texture2D(nR,vTP.zy*RS).xyz*2.-1.,nrz=texture2D(nR,vTP.xy*RS).xyz*2.-1.;pr+=tw.x*vec3(0.,nrx.y,nrx.x)+tw.z*vec3(nrz.x,nrz.y,0.);}
float fade=1.-.45*smoothstep(110.,190.,length(vViewPosition));   // calmer fine detail further away (less shimmer)
vec3 nW=normalize(n0+mix(vec3(ng.x,0.,ng.y)*1.1*uNS,pr*1.,bRock)*fade);
#else
vec3 nW=n0;
#endif
normal=normalize((viewMatrix*vec4(nW,0.)).xyz);
`;
const AOF=`reflectedLight.indirectDiffuse*=vAO;reflectedLight.indirectSpecular*=vAO;reflectedLight.directDiffuse*=mix(1.,vAO,.55);`;
// HQ needs 8 terrain samplers + environment + shadow map; GPUs with fewer than 12 texture units use the lite shader
Tr.hq=()=>!!save.hq&&renderer.capabilities.maxTextures>=12;
Tr.path=()=>LV.B&&LV.B.pbr?(Tr.hq()?'terrain HQ':'terrain lite')+' · '+renderer.capabilities.maxTextures+' tex units':'';
const MATS={},TEXC={};
const DEF_SET={tex:['grass','soil','rock','moss','gravel'],tint:[[1,1,1],[1,1,1],[1,1,1],[1,1,1],[1,1,1]],strata:0,sc:[1,1,1],ns:1};
const texc=f=>TEXC[f]||(TEXC[f]=tex(f));
Tr.mat=B=>{const S=Object.assign({},DEF_SET,B&&typeof B.pbr==='object'?B.pbr:{}),key=S.tex.join(',')+'|'+JSON.stringify(S.tint)+S.strata+S.ns;if(MATS[key])return MATS[key];
 const v3=a=>({value:new T3.Vector3(a[0],a[1],a[2])});
 const U={tG:{value:texc('ter_'+S.tex[0]+'.jpg')},tS:{value:texc('ter_'+S.tex[1]+'.jpg')},tR:{value:texc('ter_'+S.tex[2]+'.jpg')},tM:{value:texc('ter_'+S.tex[3]+'.jpg')},tV:{value:texc('ter_'+S.tex[4]+'.jpg')},
  nG:{value:texc('ter_ground_n.jpg')},nR:{value:texc('ter_rock_n.jpg')},tX:{value:texc('ter_macro.png')},
  uT0:v3(S.tint[0]),uT1:v3(S.tint[1]),uT2:v3(S.tint[2]),uT3:v3(S.tint[3]),uT4:v3(S.tint[4]),uSC:v3(S.sc),uStrata:{value:S.strata},uNS:{value:S.ns}};
 const MAT=MATS[key]=new T3.MeshStandardMaterial({vertexColors:true,roughness:.95,metalness:0});
 MAT.customProgramCacheKey=()=>(Tr.hq()?'terrain-hq':'terrain-lite');
 MAT.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
  sh.vertexShader='attribute vec4 splat;attribute float aoA;attribute vec3 tp;\nvarying vec4 vSplat;varying float vAO;varying vec3 vTP;varying vec3 vTN;\n'+
   sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSplat=splat;vAO=aoA;vTP=tp;vTN=normal;');
  sh.fragmentShader=(Tr.hq()?'':'#define SF_LITE\n')+HEAD+sh.fragmentShader.replace('#include <map_fragment>',MAPF).replace('#include <roughnessmap_fragment>',ROUGHF)
   .replace('#include <normal_fragment_maps>',NORMF).replace('#include <aomap_fragment>',AOF);};
 return MAT;};
// ---------- tile fill ----------
function ensure(g){const n=g.attributes.position.count;
 if(!g.attributes.splat)g.setAttribute('splat',new T3.BufferAttribute(new Float32Array(n*4),4));
 if(!g.attributes.aoA)g.setAttribute('aoA',new T3.BufferAttribute(new Float32Array(n),1));
 if(!g.attributes.tp)g.setAttribute('tp',new T3.BufferAttribute(new Float32Array(n*3),3));
 if(!g.attributes.normal)g.setAttribute('normal',new T3.BufferAttribute(new Float32Array(n*3),3));}
let EXT=null;Tr.top=0;   // highest terrain filled so far (the shadow band reaches above it)
const DIRS=[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
Tr.fill=(t,n)=>{const B=LV.B,HF=B.HF,z0=TZ0-n*TL,g=t.geo;ensure(g);
 const dx=TW/NX,dz=TL/NZT,W1=NX+1+2*E,H1=NZT+1+2*E;if(!EXT||EXT.length!==W1*H1)EXT=new Float32Array(W1*H1);
 const X=i=>-TW/2+i*dx,Z=j=>z0-j*dz;
 for(let j=-E;j<=NZT+E;j++)for(let i=-E;i<=NX+E;i++){const v=EXT[(j+E)*W1+i+E]=HF(X(i),Z(j));if(v>Tr.top)Tr.top=v;}
 const H=(i,j)=>EXT[(j+E)*W1+i+E];
 const pos=g.attributes.position.array,nor=g.attributes.normal.array,cl=g.attributes.color.array,sp=g.attributes.splat.array,ao=g.attributes.aoA.array,tp=g.attributes.tp.array,hs=t.hs;
 const off=Math.round(z0/PERIOD)*PERIOD,o=[0,0,0,0];
 for(let j=0;j<=NZT;j++)for(let i=0;i<=NX;i++){const k=j*(NX+1)+i,x=X(i),z=Z(j),h=H(i,j);hs[k]=h;
  pos[k*3]=x;pos[k*3+1]=GY+h;pos[k*3+2]=z;tp[k*3]=x;tp[k*3+1]=h;tp[k*3+2]=z-off;
  const gx=(H(i+1,j)-H(i-1,j))/(2*dx),gz=(H(i,j-1)-H(i,j+1))/(2*dz),nl=Math.hypot(gx,1,gz);   // dh/dx, dh/dz (j grows toward -z)
  nor[k*3]=-gx/nl;nor[k*3+1]=1/nl;nor[k*3+2]=-gz/nl;const sl=Math.hypot(gx,gz);
  // horizon-based ambient occlusion: how much of the sky the surrounding terrain hides
  let occ=0,under=0;for(const[a,b]of DIRS){const dl=Math.hypot(a*dx,b*dz);let mt=0;
   for(let s=1;s<=E;s++){const d=H(i+a*s,j+b*s)-h,tn=d/(dl*s);if(tn>mt)mt=tn;if(d>under)under=d;}occ+=mt/Math.sqrt(1+mt*mt);}
  ao[k]=clamp(1-occ/8*1.35,.45,1);
  B.splat(o,x,z,h,sl,under);sp[k*4]=o[0];sp[k*4+1]=o[1];sp[k*4+2]=o[2];sp[k*4+3]=o[3];
  if(B.tint){B.tint(o,x,z,h,sl);cl[k*3]=o[0];cl[k*3+1]=o[1];cl[k*3+2]=o[2];}   // per-vertex colour multiplier (e.g. lava glow, wet shores)
  else{const wet=B.wet?B.wet(x,z,h):0;cl[k*3]=1-.3*wet;cl[k*3+1]=1-.26*wet;cl[k*3+2]=1-.2*wet;}}
 // contact occlusion under props (faded out near the tile's top/bottom rows so shared edges stay identical)
 for(const q in t.inst)t.inst[q].count=0;
 const R=srng(LV.si*7919+n*104729+3),foot=[];
 const put=(type,x,z,s,ry,c,sy=1,yoff=0,dims)=>{const im=t.inst[type],P=PROPS[type];if(!im||im.count>=P.cap)return;const h=HF(x,z);
  tmpO.position.set(x,GY+h+yoff,z);tmpO.rotation.set(0,ry,0);if(dims)tmpO.scale.set(dims[0]*s,dims[1]*s,dims[2]*s);else tmpO.scale.set(s,s*sy,s);tmpO.updateMatrix();
  im.setMatrixAt(im.count,tmpO.matrix);tmpC.set(c?col(c):0xffffff);im.setColorAt(im.count,tmpC);im.count++;
  const oc=B.occ&&B.occ[type];if(oc)foot.push(x,z,(dims?Math.max(dims[0],dims[2]):1)*s*oc[0],oc[1]);};
 // props test slopes many times; give them a bilinear sampler over this tile's height grid (exact HF outside it)
 const HFfast=(x,z)=>{const fi=(x+TW/2)/dx,fj=(z0-z)/dz;if(fi<-E||fi>NX+E-1||fj<-E||fj>NZT+E-1)return HF(x,z);
  const i=Math.floor(fi),j=Math.floor(fj),u=fi-i,v=fj-j;return (H(i,j)*(1-u)+H(i+1,j)*u)*(1-v)+(H(i,j+1)*(1-u)+H(i+1,j+1)*u)*v;};
 B.props(R,z0,put,HFfast);
 for(let f=0;f<foot.length;f+=4){const fx=foot[f],fz=foot[f+1],r=foot[f+2],st=foot[f+3],rr=r*1.7;
  const i0=Math.max(0,Math.floor((fx-rr+TW/2)/dx)),i1=Math.min(NX,Math.ceil((fx+rr+TW/2)/dx)),j0=Math.max(0,Math.floor((z0-fz-rr)/dz)),j1=Math.min(NZT,Math.ceil((z0-fz+rr)/dz));
  for(let j=j0;j<=j1;j++){const edge=Math.min(1,j/3,(NZT-j)/3);if(edge<=0)continue;for(let i=i0;i<=i1;i++){const d=Math.hypot(X(i)-fx,Z(j)-fz)/r;if(d>1.7)continue;
   ao[j*(NX+1)+i]*=1-st*edge*(1-sst(.35,1.7,d));}}}
 for(const q in t.inst){const im=t.inst[q];im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;}
 for(const a of ['position','normal','color','splat','aoA','tp'])g.attributes[a].needsUpdate=true;
 g.computeBoundingSphere();};
// ---------- sun shadows fitted to the visible ground ----------
const DEF={l:-60,r:60,t:110,b:-110,n:1,f:500,size:1024,bias:-.0008,nb:.04};
let fitted=false;const _v=new T3.Vector3(),_c=new T3.Vector3(),_m=new T3.Matrix4(),_q=new T3.Quaternion(),_inv=new T3.Matrix4(),_up=new T3.Vector3(0,1,0),_ray=new T3.Vector3(),pts=[];
function setSize(s){if(sun.shadow.mapSize.x===s)return;sun.shadow.mapSize.set(s,s);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}}
Tr.shadowDefault=()=>{if(!fitted)return;fitted=false;const sc=sun.shadow.camera;sc.left=DEF.l;sc.right=DEF.r;sc.top=DEF.t;sc.bottom=DEF.b;sc.near=DEF.n;sc.far=DEF.f;sc.updateProjectionMatrix();
 sun.shadow.bias=DEF.bias;sun.shadow.normalBias=DEF.nb;setSize(DEF.size);};
Tr.shadows=()=>{if(!(LV.B&&LV.B.pbr&&Tr.hq())){Tr.shadowDefault();return;}
 fitted=true;setSize(2048);camera.updateMatrixWorld();pts.length=0;
 // screen corners → rays → ground band (lowest valley to the tops of trees and cliffs)
 for(const nx of[-1.04,1.04])for(const ny of[-1.04,1.04]){_ray.set(nx,ny,.5).unproject(camera).sub(camera.position).normalize();
  for(const y of[GY-6,GY+Math.max(26,Tr.top+12)]){const t=(y-camera.position.y)/_ray.y;pts.push(camera.position.clone().addScaledVector(_ray,t));}}
 _c.set(0,0,0);for(const p of pts)_c.add(p);_c.multiplyScalar(1/pts.length);
 sun.position.copy(_c).addScaledVector(LV.sunDir,200);sun.target.position.copy(_c);sun.target.updateMatrixWorld();
 _m.lookAt(sun.position,_c,_up);_q.setFromRotationMatrix(_m);_inv.compose(sun.position,_q,_v.set(1,1,1)).invert();
 let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9,z0=1e9,z1=-1e9;for(const p of pts){_v.copy(p).applyMatrix4(_inv);x0=Math.min(x0,_v.x);x1=Math.max(x1,_v.x);y0=Math.min(y0,_v.y);y1=Math.max(y1,_v.y);z0=Math.min(z0,_v.z);z1=Math.max(z1,_v.z);}
 const sc=sun.shadow.camera,m=4;sc.left=x0-m;sc.right=x1+m;sc.bottom=y0-m;sc.top=y1+m;sc.near=Math.max(1,-z1-60);sc.far=-z0+20;sc.updateProjectionMatrix();
 sun.shadow.bias=-.0006;sun.shadow.normalBias=.09;};
Tr.texelSize=()=>{const sc=sun.shadow.camera;return[(sc.right-sc.left)/sun.shadow.mapSize.x,(sc.top-sc.bottom)/sun.shadow.mapSize.y];};
})();
