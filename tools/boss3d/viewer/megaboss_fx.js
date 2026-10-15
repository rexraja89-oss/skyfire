'use strict';
// ============ MEGA-BOSS ENHANCEMENT LAYER (prototype, not loaded by the game) ============
// Dresses the plain Meshy hull GLB at runtime, all driven by one config (MEGABOSS_CFG):
//  - glossy white hull: MeshStandardMaterial (or MeshPhysicalMaterial with clearcoat, HQ test only), lit by the scene's
//    painted env cube; object-local procedural details in the shader: dark glass canopy with a violet glow, swept panel
//    seams, violet heat inside the three nozzles, and an optional boss-only cool key light (keeps the hull reading white
//    under warm stage lighting without adding a real light, which would recompile every material in the game)
//  - red/violet strips: separate ribbon geometry from the GLB (strip_*), unlit + pulse; HQ adds additive halo ribbons (glow_*)
//  - three purple engines at the eng_* anchors: nozzle disc + hot core + flickering additive flame + glow sprite
//  - seven hidden weapon-bay markers (wb_*), visible only as debug gizmos
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
 const glowTex=(()=>{let t=null;return()=>{if(t)return t;const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);
   gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.25,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return t=new T.CanvasTexture(c);};})();
 const halo=()=>new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,
   uniforms:{col:{value:new T.Color()},k:{value:1},time:{value:0},pulse:{value:0},spd:{value:1}},
   vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:'uniform vec3 col;uniform float k,time,pulse,spd;varying vec2 vUv;void main(){float d=abs(vUv.y*2.-1.);float a=pow(1.-d,2.2)*k*(1.-pulse*.5+pulse*.5*sin(time*spd*6.2832-vUv.x*.35));gl_FragColor=vec4(col*a,1.);}'});
 const flameMat=()=>new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,
   uniforms:{col:{value:new T.Color()},core:{value:new T.Color()},time:{value:0},flick:{value:.25},k:{value:1},seed:{value:0}},
   vertexShader:'varying float vT;varying vec3 vN,vV;uniform float len;void main(){vT=clamp(-position.z/7.,0.,1.);vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
   fragmentShader:'uniform vec3 col,core;uniform float time,flick,k,seed;varying float vT;varying vec3 vN,vV;'+
    'float h(float x){return fract(sin(x)*43758.5453);}float n(float x){float i=floor(x),f=fract(x);return mix(h(i),h(i+1.),f*f*(3.-2.*f));}'+
    'void main(){float fl=1.-flick+flick*n(time*18.+seed*7.+vT*4.);float a=pow(1.-vT,1.6)*fl;float rim=pow(abs(dot(vN,vV)),1.3);'+
    'vec3 c=mix(col,core,pow(1.-vT,5.));gl_FragColor=vec4(c*a*rim*k,1.);}'});
 // hull shader additions (object-local, see header)
 function patchHull(m,U){m.onBeforeCompile=s=>{Object.assign(s.uniforms,U);
   s.vertexShader='uniform mat4 uToLocal;uniform mat3 uToLocalN;varying vec3 vLoc,vNl;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvLoc=(uToLocal*vec4(transformed,1.)).xyz;vNl=normalize(uToLocalN*objectNormal);');
   s.fragmentShader='uniform float uTime,uCanopy,uPanel,uPanelScale,uHeat,uKey;uniform vec3 uCanopyCol,uNozCol,uKeyCol,uKeyDir;uniform vec4 uNoz[3];varying vec3 vLoc,vNl;\n'+
    s.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
{ float ex=vLoc.x/1.45, ez=(vLoc.z+1.5)/6.3; float ck=ex*ex+ez*ez;
  float cm=smoothstep(1.,.6,ck)*smoothstep(.15,.45,vNl.y);
  diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.012,.008,.03),cm*min(1.,uCanopy*1.2));
  float core=smoothstep(.32,.0,abs(vLoc.x))*smoothstep(1.,.35,ck);
  totalEmissiveRadiance+=uCanopyCol*cm*uCanopy*(.12+core*(.7+.3*sin(uTime*1.7+vLoc.z*.9)));
  float u=abs(vLoc.x); vec2 q=vec2(u*.82+vLoc.z*.57, vLoc.z*.82-u*.2)/uPanelScale;
  vec2 g=abs(fract(q)-.5); float seam=1.-smoothstep(.0,.03,.5-max(g.x,g.y));
  diffuseColor.rgb*=1.-seam*uPanel*.45*smoothstep(.1,.4,vNl.y)*(1.-cm);
  for(int i=0;i<3;i++){ float dn=length(vLoc.xy-uNoz[i].xy)/uNoz[i].w; float inside=smoothstep(uNoz[i].z+1.6,uNoz[i].z+.1,vLoc.z);
    totalEmissiveRadiance+=uNozCol*smoothstep(1.,.35,dn)*inside*uHeat*1.4; }
  totalEmissiveRadiance+=uKeyCol*diffuseColor.rgb*uKey*(.35+.65*max(dot(vNl,uKeyDir),0.)); }`);};
  m.customProgramCacheKey=()=>'megaboss-hull';}
 function build(root,cfg,opts={}){const C=cfg||MEGABOSS_CFG,hq=opts.hq!==false,A={root,meshes:{},anchors:{eng:[],wb:[]},fx:[]};
  root.updateMatrixWorld(true);const inv=new T.Matrix4().copy(root.matrixWorld).invert(),local=o=>new T.Vector3().setFromMatrixPosition(new T.Matrix4().multiplyMatrices(inv,o.matrixWorld));
  root.traverse(o=>{if(o.isMesh)A.meshes[o.name]=o;else if(/^eng_/.test(o.name))A.anchors.eng.push(o);else if(/^wb_/.test(o.name))A.anchors.wb.push(o);});
  const U={uToLocal:{value:new T.Matrix4()},uToLocalN:{value:new T.Matrix3()},uTime:{value:0},uCanopy:{value:0},uPanel:{value:0},uPanelScale:{value:1},uHeat:{value:0},
   uCanopyCol:{value:new T.Color()},uNozCol:{value:new T.Color()},uKey:{value:0},uKeyCol:{value:new T.Color()},uKeyDir:{value:new T.Vector3(0,1,0)},uNoz:{value:A.anchors.eng.map(e=>{const p=local(e);return new T.Vector4(p.x,p.y,p.z,(e.userData.radius||1.2))})}};
  A.U=U;const hull=A.meshes.hull;
  // engines
  const eg=new T.Group();eg.name='engineFX';root.add(eg);
  for(const e of A.anchors.eng){const p=local(e),r=e.userData.radius||1.2,g=new T.Group();g.position.copy(p);eg.add(g);
   const disc=new T.Mesh(new T.CircleGeometry(r*.84,28),new T.MeshBasicMaterial({toneMapped:false}));disc.rotation.y=Math.PI;disc.position.z=.12;
   const core=new T.Mesh(new T.CircleGeometry(r*.42,20),new T.MeshBasicMaterial({toneMapped:false}));core.rotation.y=Math.PI;core.position.z=.06;
   const fg=new T.ConeGeometry(r*.78,7,18,1,true);fg.translate(0,3.5,0);fg.rotateX(-Math.PI/2);
   const fl=new T.Mesh(fg,flameMat());fl.material.uniforms.seed.value=A.fx.length;fl.renderOrder=2;
   const sp=new T.Sprite(new T.SpriteMaterial({map:glowTex(),blending:T.AdditiveBlending,depthWrite:false,transparent:true,toneMapped:false}));sp.position.z=-.6;sp.renderOrder=3;
   g.add(disc,core,fl,sp);A.fx.push({g,disc,core,fl,sp,r});}
  if(hq){A.light=new T.PointLight(0xa040ff,0,22,2);A.light.position.set(0,1,(A.fx[1]?A.fx[1].g.position.z:-17)-2.5);root.add(A.light);}
  // markers: hidden anchors + optional debug gizmos
  for(const w of A.anchors.wb){w.visible=true;const gz=new T.Mesh(new T.OctahedronGeometry(.7),new T.MeshBasicMaterial({color:0xffe14d,wireframe:true,toneMapped:false,depthTest:false}));gz.renderOrder=9;gz.name='gizmo';gz.visible=false;w.add(gz);}
  // strip halos (HQ GLB only)
  for(const k of['glow_red','glow_violet'])if(A.meshes[k]){A.meshes[k].material=halo();A.meshes[k].renderOrder=1;}
  for(const k of['strip_red','strip_violet'])if(A.meshes[k]){A.meshes[k].material=new T.MeshBasicMaterial({toneMapped:false,polygonOffset:true,polygonOffsetFactor:-2});}
  A.apply=c=>apply(A,c);A.update=(t)=>update(A,t);A.apply(C);return A;}
 function hullMat(A,h){const P=h.clearcoat>0,m=P?new T.MeshPhysicalMaterial({clearcoat:h.clearcoat,clearcoatRoughness:h.clearcoatRoughness}):new T.MeshStandardMaterial();
  lin(m.color,h.color);m.roughness=h.roughness;m.metalness=h.metalness;m.envMapIntensity=h.envIntensity;if(A.envMap)m.envMap=A.envMap;patchHull(m,A.U);return m;}
 function apply(A,C){A.C=C;const h=A.meshes.hull,key=JSON.stringify([C.hull.clearcoat>0,!!A.envMap]);
  if(!h.material||A.matKey!==key){if(h.material&&h.material.dispose)h.material.dispose();h.material=hullMat(A,C.hull);A.matKey=key;}
  const m=h.material;lin(m.color,C.hull.color);m.roughness=C.hull.roughness;m.metalness=C.hull.metalness;m.envMapIntensity=C.hull.envIntensity;if(m.isMeshPhysicalMaterial){m.clearcoat=C.hull.clearcoat;m.clearcoatRoughness=C.hull.clearcoatRoughness;}
  const U=A.U;U.uCanopy.value=C.details.canopy;lin(U.uCanopyCol.value,C.details.canopyColor);U.uPanel.value=C.details.panel;U.uKey.value=C.details.key||0;lin(U.uKeyCol.value,C.details.keyColor||'#ffffff');U.uKeyDir.value.fromArray(C.details.keyDir||[0,1,0]).normalize();U.uPanelScale.value=C.details.panelScale;U.uHeat.value=C.engines.on?C.details.nozzleHeat:0;lin(U.uNozCol.value,C.engines.color);
  for(const [k,c] of[['red',C.strips.red],['violet',C.strips.violet]]){const s=A.meshes['strip_'+k],g=A.meshes['glow_'+k];
   if(s){s.visible=C.strips.on;s.userData.base=lin(new T.Color(),c);}
   if(g){g.visible=C.strips.on&&C.strips.glow>0;const u=g.material.uniforms;lin(u.col.value,c);u.k.value=C.strips.glow;u.pulse.value=C.strips.pulse;u.spd.value=C.strips.pulseSpeed;}}
  for(const f of A.fx){f.g.visible=C.engines.on;lin(f.disc.material.color,C.engines.color);lin(f.core.material.color,C.engines.core);
   const u=f.fl.material.uniforms;lin(u.col.value,C.engines.color);lin(u.core.value,C.engines.core);u.flick.value=C.engines.flicker;u.k.value=1;f.fl.scale.set(1,1,C.engines.flameLength/7);
   lin(f.sp.material.color,C.engines.color);f.sp.scale.setScalar(f.r*5*C.engines.glow);}
  if(A.light){A.light.visible=C.engines.on&&C.engines.light;lin(A.light.color,C.engines.color);A.light.intensity=1.6;}
  for(const w of A.anchors.wb)w.children.forEach(c=>{if(c.name==='gizmo')c.visible=C.markers.show;});}
 function update(A,t){const C=A.C,U=A.U,h=A.meshes.hull;A.root.updateMatrixWorld();
  const inv=new T.Matrix4().copy(A.root.matrixWorld).invert();U.uToLocal.value.multiplyMatrices(inv,h.matrixWorld);U.uToLocalN.value.getNormalMatrix(U.uToLocal.value);U.uTime.value=t;
  const pk=1-C.strips.pulse*.5+C.strips.pulse*.5*Math.sin(t*C.strips.pulseSpeed*6.2832);
  for(const k of['red','violet']){const s=A.meshes['strip_'+k];if(s&&s.userData.base)s.material.color.copy(s.userData.base).multiplyScalar(C.strips.intensity*(.75+.25*pk));const g=A.meshes['glow_'+k];if(g)g.material.uniforms.time.value=t;}
  for(const f of A.fx){f.fl.material.uniforms.time.value=t;const w=1+Math.sin(t*31+f.r*9)*.04*C.engines.flicker;f.sp.scale.setScalar(f.r*5*C.engines.glow*w);}}
 // small painted env cube (same idea as world.js envCube: no PMREM)
 function envCube(top='#1b1530',hor='#d9d2e6',bot='#2a2230',sun=[.4,.8,.45]){const N=64,faces=[],dirs=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  for(let f=0;f<6;f++){const c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d');
   if(f===2){g.fillStyle=top;g.fillRect(0,0,N,N);}else if(f===3){g.fillStyle=bot;g.fillRect(0,0,N,N);}else{const gr=g.createLinearGradient(0,0,0,N);gr.addColorStop(0,top);gr.addColorStop(.5,hor);gr.addColorStop(.56,hor);gr.addColorStop(1,bot);g.fillStyle=gr;g.fillRect(0,0,N,N);}
   const d=dirs[f],dot=d[0]*sun[0]+d[1]*sun[1]+d[2]*sun[2];if(dot>.3){const gr=g.createRadialGradient(N/2,N*(f===2?.5:.4),0,N/2,N*(f===2?.5:.4),N*.5*dot);gr.addColorStop(0,'rgba(255,250,240,.95)');gr.addColorStop(1,'rgba(255,240,220,0)');g.fillStyle=gr;g.fillRect(0,0,N,N);}
   faces.push(c);}
  const t=new T.CubeTexture(faces);t.encoding=T.sRGBEncoding;t.needsUpdate=true;return t;}
 return {build,envCube,CFG:MEGABOSS_CFG,INGAME:MEGABOSS_INGAME,merge:(a,b)=>{const c=JSON.parse(JSON.stringify(a));for(const k in b)Object.assign(c[k],b[k]);return c;}};})();
