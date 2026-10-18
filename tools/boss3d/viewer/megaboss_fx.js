'use strict';
// ============ MEGA-BOSS ENHANCEMENT LAYER (prototype, not loaded by the game) ============
// Dresses the plain Meshy hull GLB at runtime, all driven by one config (MEGABOSS_CFG):
//  - glossy white hull: MeshStandardMaterial (or MeshPhysicalMaterial with clearcoat, HQ test only), lit by the scene's
//    painted env cube; object-local procedural details in the shader: dark glass canopy with a violet glow, swept panel
//    seams, violet heat inside the three nozzles, and an optional boss-only cool "key light": an art-directed, unshadowed
//    fill added to emissive radiance (not simulated lighting). It keeps the hull reading white under warm stage lighting
//    without adding a real light, which would recompile every material in the game. GLSL note: smoothstep is only
//    defined for edge0 < edge1, so falloffs are written as 1.-smoothstep(lo,hi,x) (checked by lint_glsl.cjs).
//  - red/violet strips: the GLB's strip_* ribbons merged into ONE unlit mesh (a per-vertex channel picks red or violet);
//    HQ adds the glow_* halo ribbons as one additive mesh
//  - three purple engines at the eng_* anchors: nozzle discs + hot cores in one mesh, flickering flames in one mesh,
//    glow in one Points draw
//  - seven hidden weapon-bay markers (wb_*), visible only as debug gizmos
// Draw calls: hull 1 + strips 1 (+ halos 1 in HQ) + engines 3 = 6 HQ / 5 Smooth (was 17 / 15).
// Coordinates: boss-local = Skyfire game frame (+X screen right, +Z nose / screen down, +Y up, world units, K=0.1).
const MEGABOSS_CFG={
 hull:{color:'#f3f4f7',roughness:.22,metalness:.08,envIntensity:1,clearcoat:0,clearcoatRoughness:.08},
 details:{canopy:.85,canopyColor:'#8a3dff',panel:.3,panelScale:2.6,nozzleHeat:1,key:0,keyColor:'#dfe8ff',keyDir:[-.35,1,.45]},
 strips:{on:true,red:'#ff2436',violet:'#a04dff',intensity:1.35,glow:.6,pulse:.35,pulseSpeed:.8},
 engines:{on:true,color:'#9d3dff',core:'#f6e3ff',flameLength:7,flicker:.25,glow:1,light:true},
 markers:{show:false}
};
// preset for warm-lit stages (Magma Citadel): cooler base, softer env, boss-only key light, brighter strips
const MEGABOSS_INGAME={hull:{color:'#e9eeff',envIntensity:.7,roughness:.28},details:{key:.55},strips:{intensity:2.1,glow:.9},engines:{light:false}};
const MegaBossFX=(()=>{const T=THREE,lin=(c,h)=>c.set(h).convertSRGBToLinear();   // same as the game's col(): sRGB hex -> linear
 // shared by every instance on the page (never disposed per instance)
 const glowTex=(()=>{let t=null;return()=>{if(t)return t;const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);
   gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.25,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return t=new T.CanvasTexture(c);};})();
 const OUT='gl_FragColor=linearToOutputTexel(gl_FragColor);';   // same output conversion as the built-in materials
 // strips: ch = 0 red, 1 violet; core is opaque, halo is additive with a soft falloff across the ribbon (uv.y)
 const stripMat=halo=>new T.ShaderMaterial({transparent:halo,depthWrite:!halo,blending:halo?T.AdditiveBlending:T.NormalBlending,side:T.DoubleSide,
   polygonOffset:!halo,polygonOffsetFactor:-2,
   uniforms:{colR:{value:new T.Color()},colV:{value:new T.Color()},k:{value:1},time:{value:0},pulse:{value:0},spd:{value:1}},
   vertexShader:'attribute float ch;varying float vC;varying vec2 vUv;void main(){vC=ch;vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:'uniform vec3 colR,colV;uniform float k,time,pulse,spd;varying float vC;varying vec2 vUv;void main(){'+
    'float p=1.-pulse*.5+pulse*.5*sin(time*spd*6.2832-vUv.x*.35);vec3 c=mix(colR,colV,step(.5,vC));'+
    (halo?'float d=abs(vUv.y*2.-1.);gl_FragColor=vec4(c*pow(1.-d,2.2)*k*p,1.);':'gl_FragColor=vec4(c*k*(.75+.25*p),1.);')+OUT+'}'});
 // engine discs + cores: ch = 0 disc (engine colour), 1 core (hot core colour)
 const discMat=()=>new T.ShaderMaterial({uniforms:{col:{value:new T.Color()},core:{value:new T.Color()}},
   vertexShader:'attribute float ch;varying float vC;void main(){vC=ch;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:'uniform vec3 col,core;varying float vC;void main(){gl_FragColor=vec4(mix(col,core,step(.5,vC)),1.);'+OUT+'}'});
 // flames: one merged cone per nozzle; `base` = nozzle position, position = local cone (length 7 along -Z), seed per nozzle
 const flameMat=()=>new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,
   uniforms:{col:{value:new T.Color()},core:{value:new T.Color()},time:{value:0},flick:{value:.25},len:{value:1}},
   vertexShader:'attribute vec3 base;attribute float seed;uniform float len;varying float vT,vS;varying vec3 vN,vV;void main(){vT=clamp(-position.z/7.,0.,1.);vS=seed;'+
    'vec4 mv=modelViewMatrix*vec4(base+position*vec3(1.,1.,len),1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
   fragmentShader:'uniform vec3 col,core;uniform float time,flick;varying float vT,vS;varying vec3 vN,vV;'+
    'float h(float x){return fract(sin(x)*43758.5453);}float n(float x){float i=floor(x),f=fract(x);return mix(h(i),h(i+1.),f*f*(3.-2.*f));}'+
    'void main(){float fl=1.-flick+flick*n(time*18.+vS*7.+vT*4.);float a=pow(1.-vT,1.6)*fl;float rim=pow(abs(dot(vN,vV)),1.3);'+
    'vec3 c=mix(col,core,pow(1.-vT,5.));gl_FragColor=vec4(c*a*rim,1.);'+OUT+'}'});
 // r128's BufferAttribute getters return RAW values for normalized integer attributes (KHR_mesh_quantization GLBs);
 // the GPU de-normalizes, JavaScript must do it here or merged/raycast geometry comes out at integer scale.
 const DIV={Int8Array:127,Uint8Array:255,Int16Array:32767,Uint16Array:65535};
 const rd=(a,i,v)=>{v.fromBufferAttribute(a,i);if(a.normalized){const d=DIV[a.array.constructor.name]||1;v.divideScalar(d);if(d===127||d===32767)v.max(new T.Vector3(-1,-1,-1));}return v;};
 // merge indexed BufferGeometries (position/normal/uv, optional matrix per part) and add one constant float attribute per part
 function merge(parts,attr){let nv=0,ni=0;for(const {g} of parts){nv+=g.attributes.position.count;ni+=g.index?g.index.count:g.attributes.position.count;}
  const P=new Float32Array(nv*3),N=new Float32Array(nv*3),UV=new Float32Array(nv*2),A=new Float32Array(nv),I=new Uint32Array(ni);let ov=0,oi=0;const v=new T.Vector3();
  for(const {g,val,mat} of parts){const pa=g.attributes.position,na=g.attributes.normal,ua=g.attributes.uv;
   for(let i=0;i<pa.count;i++){rd(pa,i,v);if(mat)v.applyMatrix4(mat);P[(ov+i)*3]=v.x;P[(ov+i)*3+1]=v.y;P[(ov+i)*3+2]=v.z;
    if(na){rd(na,i,v);if(mat)v.transformDirection(mat);N[(ov+i)*3]=v.x;N[(ov+i)*3+1]=v.y;N[(ov+i)*3+2]=v.z;}
    if(ua){const d=ua.normalized?(DIV[ua.array.constructor.name]||1):1;UV[(ov+i)*2]=ua.getX(i)/d;UV[(ov+i)*2+1]=ua.getY(i)/d;}A[ov+i]=val;}
   if(g.index)for(let i=0;i<g.index.count;i++)I[oi++]=g.index.getX(i)+ov;else for(let i=0;i<pa.count;i++)I[oi++]=ov+i;ov+=pa.count;}
  const m=new T.BufferGeometry();m.setAttribute('position',new T.BufferAttribute(P,3));m.setAttribute('normal',new T.BufferAttribute(N,3));m.setAttribute('uv',new T.BufferAttribute(UV,2));
  m.setAttribute(attr,new T.BufferAttribute(A,1));m.setIndex(new T.BufferAttribute(I,1));m.computeBoundingSphere();return m;}
 // hull shader additions (object-local, see header)
 function patchHull(m,U){m.onBeforeCompile=s=>{Object.assign(s.uniforms,U);
   s.vertexShader='uniform mat4 uToLocal;uniform mat3 uToLocalN;varying vec3 vLoc,vNl;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvLoc=(uToLocal*vec4(transformed,1.)).xyz;vNl=normalize(uToLocalN*objectNormal);');
   s.fragmentShader='uniform float uTime,uCanopy,uPanel,uPanelScale,uHeat,uKey;uniform vec3 uCanopyCol,uNozCol,uKeyCol,uKeyDir;uniform vec4 uNoz[3];varying vec3 vLoc,vNl;\n'+
    s.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
{ float ex=vLoc.x/1.45, ez=(vLoc.z+1.5)/6.3; float ck=ex*ex+ez*ez;
  float cm=(1.-smoothstep(.6,1.,ck))*smoothstep(.15,.45,vNl.y);
  diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.012,.008,.03),cm*min(1.,uCanopy*1.2));
  float core=(1.-smoothstep(0.,.32,abs(vLoc.x)))*(1.-smoothstep(.35,1.,ck));
  totalEmissiveRadiance+=uCanopyCol*cm*uCanopy*(.12+core*(.7+.3*sin(uTime*1.7+vLoc.z*.9)));
  float u=abs(vLoc.x); vec2 q=vec2(u*.82+vLoc.z*.57, vLoc.z*.82-u*.2)/uPanelScale;
  vec2 g=abs(fract(q)-.5); float seam=1.-smoothstep(.0,.03,.5-max(g.x,g.y));
  diffuseColor.rgb*=1.-seam*uPanel*.45*smoothstep(.1,.4,vNl.y)*(1.-cm);
  float heat=0.;   // nozzle interiors: dark metal lit by violet heat (centre cavity is ~4.1 deep)
  for(int i=0;i<3;i++){ float dn=length(vLoc.xy-uNoz[i].xy)/uNoz[i].w; float inside=1.-smoothstep(uNoz[i].z+3.6,uNoz[i].z+4.8,vLoc.z);
    heat+=(1.-smoothstep(.45,1.,dn))*inside; }
  heat=min(1.,heat)*uHeat; diffuseColor.rgb*=1.-heat*.85; totalEmissiveRadiance+=uNozCol*heat*1.8;
  totalEmissiveRadiance+=uKeyCol*diffuseColor.rgb*uKey*(.35+.65*max(dot(vNl,uKeyDir),0.)); }`);};
  m.customProgramCacheKey=()=>'megaboss-hull';}
 function build(root,cfg,opts={}){const C=cfg||MEGABOSS_CFG,hq=opts.hq!==false,A={root,meshes:{},anchors:{eng:[],wb:[]},fx:[]};
  root.updateMatrixWorld(true);const inv=new T.Matrix4().copy(root.matrixWorld).invert(),rel=o=>new T.Matrix4().multiplyMatrices(inv,o.matrixWorld),local=o=>new T.Vector3().setFromMatrixPosition(rel(o));
  root.traverse(o=>{if(o.isMesh)A.meshes[o.name]=o;else if(/^eng_/.test(o.name))A.anchors.eng.push(o);else if(/^wb_/.test(o.name))A.anchors.wb.push(o);});
  const U={uToLocal:{value:new T.Matrix4()},uToLocalN:{value:new T.Matrix3()},uTime:{value:0},uCanopy:{value:0},uPanel:{value:0},uPanelScale:{value:1},uHeat:{value:0},
   uCanopyCol:{value:new T.Color()},uNozCol:{value:new T.Color()},uKey:{value:0},uKeyCol:{value:new T.Color()},uKeyDir:{value:new T.Vector3(0,1,0)},uNoz:{value:A.anchors.eng.map(e=>{const p=local(e);return new T.Vector4(p.x,p.y,p.z,(e.userData.radius||1.2))})}};
  A.U=U;
  // strips (+ halos): merge the GLB ribbons into one mesh per kind, in boss-local space, then drop the originals
  const fx=new T.Group();fx.name='megabossFX';root.add(fx);
  for(const [kind,halo] of[['strip',false],['glow',true]]){const parts=[],gone=[];
   for(const [c,val] of[['red',0],['violet',1]]){const m=A.meshes[kind+'_'+c];if(!m)continue;parts.push({g:m.geometry,val,mat:rel(m)});gone.push(m);delete A.meshes[kind+'_'+c];}
   if(parts.length&&(hq||!halo)){const mm=new T.Mesh(merge(parts,'ch'),stripMat(halo));mm.name=halo?'halos':'strips';mm.renderOrder=halo?1:0;fx.add(mm);A.meshes[mm.name]=mm;}
   for(const m of gone){m.parent.remove(m);m.geometry.dispose();if(m.material.dispose)m.material.dispose();}}
  // engines: discs + cores (one mesh), flames (one mesh), glow (one Points)
  const discs=[],flames=[],glowP=[];A.anchors.eng.forEach((e,i)=>{const p=local(e),r=e.userData.radius||1.2;A.fx.push({p,r});
   const m=new T.Matrix4().makeRotationY(Math.PI).setPosition(p.x,p.y,p.z+.12),m2=m.clone().setPosition(p.x,p.y,p.z+.06);
   discs.push({g:new T.CircleGeometry(r*.84,28),val:0,mat:m},{g:new T.CircleGeometry(r*.42,20),val:1,mat:m2});
   const fg=new T.ConeGeometry(r*.78,7,18,1,true);fg.translate(0,3.5,0);fg.rotateX(-Math.PI/2);flames.push({g:fg,val:i,p});glowP.push(p.x,p.y,p.z-.6);});
  if(A.fx.length){const dm=new T.Mesh(merge(discs,'ch'),discMat());dm.name='engineDiscs';
   const fgm=merge(flames,'seed'),B=new Float32Array(fgm.attributes.position.count*3);let o=0;for(const {g,p} of flames){for(let i=0;i<g.attributes.position.count;i++){B[(o+i)*3]=p.x;B[(o+i)*3+1]=p.y;B[(o+i)*3+2]=p.z;}o+=g.attributes.position.count;}
   fgm.setAttribute('base',new T.BufferAttribute(B,3));
   const fl=new T.Mesh(fgm,flameMat());fl.name='engineFlames';fl.renderOrder=2;fl.frustumCulled=false;   // vertices move in the shader (base + scaled cone)
   const pg=new T.BufferGeometry();pg.setAttribute('position',new T.Float32BufferAttribute(glowP,3));
   const pts=new T.Points(pg,new T.PointsMaterial({map:glowTex(),blending:T.AdditiveBlending,depthWrite:false,transparent:true,toneMapped:false,sizeAttenuation:true}));pts.name='engineGlow';pts.renderOrder=3;
   for(const d of discs.concat(flames))d.g.dispose();fx.add(dm,fl,pts);Object.assign(A.meshes,{engineDiscs:dm,engineFlames:fl});A.engineGlow=pts;}
  if(hq){A.light=new T.PointLight(0xa040ff,0,22,2);A.light.position.set(0,1,(A.fx[1]?A.fx[1].p.z:-17)-2.5);root.add(A.light);}
  // markers: hidden anchors + optional debug gizmos
  for(const w of A.anchors.wb){w.visible=true;const gz=new T.Mesh(new T.OctahedronGeometry(.7),new T.MeshBasicMaterial({color:0xffe14d,wireframe:true,toneMapped:false,depthTest:false}));gz.renderOrder=9;gz.name='gizmo';gz.visible=false;w.add(gz);}
  A._inv=new T.Matrix4();   // scratch, reused every frame
  A.apply=c=>apply(A,c);A.update=(t)=>update(A,t);A.dispose=()=>dispose(A);A.apply(C);return A;}
 function hullMat(A,h){const P=h.clearcoat>0,m=P?new T.MeshPhysicalMaterial({clearcoat:h.clearcoat,clearcoatRoughness:h.clearcoatRoughness}):new T.MeshStandardMaterial();
  lin(m.color,h.color);m.roughness=h.roughness;m.metalness=h.metalness;m.envMapIntensity=h.envIntensity;if(A.envMap)m.envMap=A.envMap;patchHull(m,A.U);return m;}
 function apply(A,C){A.C=C;const h=A.meshes.hull,key=JSON.stringify([C.hull.clearcoat>0,!!A.envMap]);
  if(!h.material||A.matKey!==key){if(h.material&&h.material.dispose)h.material.dispose();h.material=hullMat(A,C.hull);A.matKey=key;}
  const m=h.material;lin(m.color,C.hull.color);m.roughness=C.hull.roughness;m.metalness=C.hull.metalness;m.envMapIntensity=C.hull.envIntensity;if(m.isMeshPhysicalMaterial){m.clearcoat=C.hull.clearcoat;m.clearcoatRoughness=C.hull.clearcoatRoughness;}
  const U=A.U;U.uCanopy.value=C.details.canopy;lin(U.uCanopyCol.value,C.details.canopyColor);U.uPanel.value=C.details.panel;U.uKey.value=C.details.key||0;lin(U.uKeyCol.value,C.details.keyColor||'#ffffff');U.uKeyDir.value.fromArray(C.details.keyDir||[0,1,0]).normalize();U.uPanelScale.value=C.details.panelScale;U.uHeat.value=C.engines.on?C.details.nozzleHeat:0;lin(U.uNozCol.value,C.engines.color);
  for(const [name,k] of[['strips',C.strips.intensity],['halos',C.strips.glow]]){const s=A.meshes[name];if(!s)continue;const u=s.material.uniforms;
   s.visible=C.strips.on&&k>0;lin(u.colR.value,C.strips.red);lin(u.colV.value,C.strips.violet);u.k.value=k;u.pulse.value=C.strips.pulse;u.spd.value=C.strips.pulseSpeed;}
  const d=A.meshes.engineDiscs,f=A.meshes.engineFlames;
  if(d){d.visible=f.visible=A.engineGlow.visible=C.engines.on;lin(d.material.uniforms.col.value,C.engines.color);lin(d.material.uniforms.core.value,C.engines.core);
   const u=f.material.uniforms;lin(u.col.value,C.engines.color);lin(u.core.value,C.engines.core);u.flick.value=C.engines.flicker;u.len.value=C.engines.flameLength/7;
   lin(A.engineGlow.material.color,C.engines.color);A.engineGlow.material.size=(A.fx[0]?A.fx[0].r:1.2)*5*C.engines.glow;}
  if(A.light){A.light.visible=C.engines.on&&C.engines.light;lin(A.light.color,C.engines.color);A.light.intensity=1.6;}
  for(const w of A.anchors.wb)w.children.forEach(c=>{if(c.name==='gizmo')c.visible=C.markers.show;});}
 function update(A,t){const C=A.C,U=A.U,h=A.meshes.hull;A.root.updateMatrixWorld();
  const inv=A._inv.copy(A.root.matrixWorld).invert();U.uToLocal.value.multiplyMatrices(inv,h.matrixWorld);U.uToLocalN.value.getNormalMatrix(U.uToLocal.value);U.uTime.value=t;
  for(const k of['strips','halos'])if(A.meshes[k])A.meshes[k].material.uniforms.time.value=t;
  if(A.meshes.engineFlames){A.meshes.engineFlames.material.uniforms.time.value=t;A.engineGlow.material.size=(A.fx[0]?A.fx[0].r:1.2)*5*C.engines.glow*(1+Math.sin(t*31)*.04*C.engines.flicker);}}
 // Ownership: everything under the boss root (GLB geometry, hull/strip/halo/engine materials, gizmos, the optional
 // light) belongs to this instance and is released here. The glow sprite texture is shared by all instances on the page
 // and is kept. Call after removing the root from the scene.
 function dispose(A){const seen=new Set(),shared=glowTex();
  A.root.traverse(o=>{if(o.geometry&&!seen.has(o.geometry)){seen.add(o.geometry);o.geometry.dispose();}
   for(const m of[].concat(o.material||[]))if(!seen.has(m)){seen.add(m);for(const k in m){const v=m[k];if(v&&v.isTexture&&v!==shared&&!seen.has(v)){seen.add(v);v.dispose();}}m.dispose();}});
  if(A.light&&A.light.parent)A.light.parent.remove(A.light);A.root.clear();A.disposed=true;}
 // small painted env cube (same idea as world.js envCube: no PMREM)
 function envCube(top='#1b1530',hor='#d9d2e6',bot='#2a2230',sun=[.4,.8,.45]){const N=64,faces=[],dirs=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  for(let f=0;f<6;f++){const c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d');
   if(f===2){g.fillStyle=top;g.fillRect(0,0,N,N);}else if(f===3){g.fillStyle=bot;g.fillRect(0,0,N,N);}else{const gr=g.createLinearGradient(0,0,0,N);gr.addColorStop(0,top);gr.addColorStop(.5,hor);gr.addColorStop(.56,hor);gr.addColorStop(1,bot);g.fillStyle=gr;g.fillRect(0,0,N,N);}
   const d=dirs[f],dot=d[0]*sun[0]+d[1]*sun[1]+d[2]*sun[2];if(dot>.3){const gr=g.createRadialGradient(N/2,N*(f===2?.5:.4),0,N/2,N*(f===2?.5:.4),N*.5*dot);gr.addColorStop(0,'rgba(255,250,240,.95)');gr.addColorStop(1,'rgba(255,240,220,0)');g.fillStyle=gr;g.fillRect(0,0,N,N);}
   faces.push(c);}
  const t=new T.CubeTexture(faces);t.encoding=T.sRGBEncoding;t.needsUpdate=true;return t;}
 return {build,envCube,CFG:MEGABOSS_CFG,INGAME:MEGABOSS_INGAME,merge:(a,b)=>{const c=JSON.parse(JSON.stringify(a));for(const k in b)Object.assign(c[k],b[k]);return c;}};})();
