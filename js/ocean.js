'use strict';
// ============ STORM OCEAN (v5.14) ============
// The sea for the Storm Fleet stage (biome flag `storm`): a dense plane under the camera whose vertices are moved by
// a sum of directional swells (vertex shader, normals from the same derivatives), scrolling with the world so ships and
// waves keep their relation. The fragment adds depth colour (troughs dark, crests lit teal), wind-blown whitecap foam
// on the crests and streaks along the wind, on top of the standard lit material (sky reflections, fog, shadows).
// HQ: 140×280 grid and 6 swells; Smooth: 70×140 and 4 swells. Height also available to JS for ships (SF.ocean.h).
(()=>{
const T3=THREE,Oc=SF.ocean={on:false};let M=null,U=null,HQ=null;
const WAVES=[ // dir x, dir z, amplitude, wavelength, speed  (wind from the upper left)
 [.55,.83,1.05,46,1.0],[.3,.95,.62,27,1.15],[.8,.6,.36,16,1.3],[-.2,.98,.22,10,1.45],[.62,.78,.12,6.2,1.7],[.1,.99,.07,3.8,2]];
const GLSL_W=n=>{let s='vec3 waveH(vec2 p){float h=0.,dx=0.,dz=0.;';WAVES.slice(0,n).forEach(([x,z,a,l,sp],i)=>{const k=(2*Math.PI/l).toFixed(4),w=(Math.sqrt(9.8*2*Math.PI/l)*sp*.55).toFixed(4);
  s+=`{vec2 d=normalize(vec2(${x.toFixed(2)},${z.toFixed(2)}));float ph=dot(d,p)*${k}-uT*${w};float c=cos(ph);h+=${a.toFixed(2)}*uAmp*sin(ph);dx+=${a.toFixed(2)}*uAmp*${k}*d.x*c;dz+=${a.toFixed(2)}*uAmp*${k}*d.y*c;}`;});
  return s+'return vec3(h,dx,dz);}';};
function build(hq){
 const seg=hq?[140,280]:[70,140],g=new T3.PlaneGeometry(1,1,seg[0],seg[1]);g.rotateX(-Math.PI/2);
 U={uT:{value:0},uS:{value:0},uAmp:{value:1},uDeep:{value:new T3.Color('#081f25')},uCrest:{value:new T3.Color('#2d6870')},uFoam:{value:new T3.Color('#d8e6e8')}};
 const m=new T3.MeshStandardMaterial({color:0xffffff,roughness:.22,metalness:.12,envMapIntensity:1.1});   // no tiled normal map: the plane is stretched, the waves give the normals
 const nw=hq?6:4,W=GLSL_W(nw),amp=WAVES.slice(0,nw).reduce((a,w)=>a+w[2],0).toFixed(2);
 m.customProgramCacheKey=()=>'ocean'+nw;
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
  sh.vertexShader='uniform float uT,uS,uAmp;varying float vH;varying vec2 vP;\n'+W+'\n'+sh.vertexShader
   .replace('#include <beginnormal_vertex>','vec4 wp0=modelMatrix*vec4(position,1.);vec2 wpp=wp0.xz+vec2(0.,uS);vec3 hw=waveH(wpp);vec3 objectNormal=normalize(vec3(-hw.y,1.,-hw.z));')
   .replace('#include <begin_vertex>','vec3 transformed=vec3(position);transformed.y+=hw.x;vH=hw.x/('+amp+'*uAmp);vP=wpp;');
  sh.fragmentShader='uniform float uT;uniform vec3 uDeep,uCrest,uFoam;varying float vH;varying vec2 vP;\n'+
   'float hsh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hsh(i),hsh(i+vec2(1,0)),f.x),mix(hsh(i+vec2(0,1)),hsh(i+vec2(1,1)),f.x),f.y);}\n'+
   'float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*vn(p);p*=2.03;a*=.5;}return s;}\n'+sh.fragmentShader
   .replace('#include <color_fragment>',`#include <color_fragment>
    float cr=clamp(vH*.5+.5,0.,1.);vec3 sea=mix(uDeep,uCrest,smoothstep(.35,.95,cr));
    vec2 wind=vec2(.55,.83),q=mod(vP,512.);float n1=fbm(q*.35+wind*uT*.6),n2=fbm(vec2(dot(q,vec2(.83,-.55))*.9,dot(q,wind)*.12)+uT*.2);
    float cap=smoothstep(.74,.98,cr+n1*.3-.1);                         // whitecaps on the crests
    float streak=smoothstep(.66,.8,n2)*smoothstep(.5,.85,cr)*.35;        // foam dragged along the wind
    float lace=smoothstep(.45,.75,fbm(mod(vP,512.)*.9-uT*.3));float foam=clamp(cap*(.35+.65*lace)+streak*lace,0.,.85);
    diffuseColor.rgb=mix(sea,uFoam,foam);`)
   .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(.2,.75,foam);');};
 const mesh=new T3.Mesh(g,m);mesh.receiveShadow=true;mesh.frustumCulled=false;mesh.visible=false;scene.add(mesh);return mesh;}
// enable for a storm biome
Oc.enable=B=>{const hq=!!save.hq;if(!M||HQ!==hq){if(M){scene.remove(M);M.geometry.dispose();M.material.dispose();}M=build(hq);HQ=hq;}
 Oc.on=true;M.visible=true;M.position.y=GY+(B.wl||0);U.uAmp.value=B.storm.amp||1;if(B.storm.deep)U.uDeep.value.set(B.storm.deep);if(B.storm.crest)U.uCrest.value.set(B.storm.crest);};
Oc.disable=()=>{Oc.on=false;if(M)M.visible=false;};
// per frame: cover the view, advance the waves with time and with the world scroll
Oc.update=tnow=>{if(!Oc.on||!M)return;if(HQ!==!!save.hq)Oc.enable(LV.B);const zt=C3.Zt,zb=C3.Zb||0,len=Math.abs(zb-zt)+140;
 M.scale.set(150,1,len);M.position.z=(zt+zb)/2;U.uT.value=tnow;U.uS.value=-gz3;};
// wave height at a logic point (for ship heave); same formula as the shader (sum of sines)
Oc.h=(x,y)=>{if(!Oc.on)return 0;const X=(x-W/2)*K,Z=C3.Zt+y*KZ-gz3,t=U.uT.value,n=HQ?6:4;let h=0;
 for(let i=0;i<n;i++){const[dx,dz,a,l,sp]=WAVES[i],L=Math.hypot(dx,dz),k=2*Math.PI/l,w=Math.sqrt(9.8*2*Math.PI/l)*sp*.55;h+=a*U.uAmp.value*Math.sin((dx/L*X+dz/L*Z)*k-t*w);}return h;};
})();
