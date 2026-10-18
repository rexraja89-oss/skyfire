'use strict';
// ============ MEGA-BOSS WEAPON BAYS (prototype, not loaded by the game) ============
// Retractable weapons hidden under the hull, added on top of a MegaBossFX instance (megaboss_fx.js). First slice: the
// left wing missile bay. Every bay is three layers, all built at runtime from the loaded hull so they fit either LOD:
//  - doors: two leaves cut from the hull surface itself (the hull is ray-sampled over the bay's footprint), painted with
//    the same concept texture, UVs and shader as the hull, so a closed bay is invisible apart from a faint seam. They
//    hinge open in the vertex shader (one angle per leaf), so all doors of all bays are ONE draw call.
//  - cavity: a flat patch on the hull over the opening whose shader ray-traces a box "below" the surface (interior
//    mapping): walls with ribs, floor plates, red lip lights, violet uplight, and the part of the weapon that is still
//    down in the bay. No hole is cut in the hull (the hull stays watertight and unchanged). One draw call, hidden while
//    every bay is shut.
//  - weapon: a real mesh rising along the bay's up axis. Missile bay = vertical launch block, 2 x 3 tubes with
//    missile noses (fired ones hide in the shader), violet edge strips, red mouth rings that charge before a launch.
// Cycle (BAYS_CFG.timing): hidden -> warn (red edge pulse on the doors) -> open -> deploy -> fire (salvo) -> hold
// -> retract -> close -> hidden. The weapon can only be hit while it is up; at 0 HP the bay is destroyed for the rest
// of the fight: doors blown back and scorched, charred stump left tilted in the hole, embers + smoke.
// The bay never spawns bullets, particles or sounds itself: it reports events through opts.on(type, data) with world
// positions, and the host (viewer or game) turns them into missiles, explosions, smoke and sound.
// Coordinates: boss-local = Skyfire game frame (+X screen right, +Z nose / screen down, +Y up, world units).
// Bay frame: X = along the bay (A), Y = bay up (U, the hull normal there), Z = across (B = A x U).
const BAYS_CFG={
 bays:[
  // on the clean white wing panel beside the violet wing stripe, long side parallel to the stripe (concept, round 4)
  {id:'missile_L',marker:'wb_missile_L',kind:'missile',xz:[12.7,1.0],dir:[-.58,.81],len:3.2,wid:1.4,depth:1.0,hp:60}
 ],
 timing:{warn:.8,open:.4,deploy:.45,gap:.13,hold:.6,retract:.45,close:.35},
 doors:{lift:.03,thick:.08,angle:1.95,seam:.3,gap:.025},
 rack:{len:2.5,wid:1.05,h:.85,up:.7,tubes:[3,2],tubeR:.17},
 look:{red:'#ff2a3c',violet:'#a04dff',lip:'#ff3046',uplight:'#8a3dff',metal:'#15161c',shell:'#dfe2ea',ember:'#ff6a1e'}
};
const MegaBossBays=(()=>{const T=THREE,lin=(c,h)=>c.set(h).convertSRGBToLinear(),MAXB=8;
 const OUT='gl_FragColor=linearToOutputTexel(gl_FragColor);';
 const DIV={Int8Array:127,Uint8Array:255,Int16Array:32767,Uint16Array:65535};
 const deq=(a,i,v)=>{v.fromBufferAttribute(a,i);if(a.normalized){const d=DIV[a.array.constructor.name]||1;v.divideScalar(d);}return v;};   // r128 returns raw quantized values
 const sstep=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);},clamp01=x=>Math.min(1,Math.max(0,x));
 const outBack=x=>{const c=1.6;x=clamp01(x)-1;return 1+(c+1)*x*x*x+c*x*x;};
 // ---- hull sampling: triangles near a point, in boss-local space, de-quantized ------------------------------------
 function hullTris(hull,rel,cx,cz,r){const g=hull.geometry,P=g.attributes.position,N=g.attributes.normal,I=g.index,n=I?I.count:P.count,v=new T.Vector3(),nm=new T.Matrix3().getNormalMatrix(rel),out=[];
  const pos=new Float32Array(P.count*3),nor=new Float32Array(P.count*3);for(let i=0;i<P.count;i++){deq(P,i,v).applyMatrix4(rel);pos.set([v.x,v.y,v.z],i*3);deq(N,i,v).applyMatrix3(nm).normalize();nor.set([v.x,v.y,v.z],i*3);}
  for(let k=0;k<n;k+=3){const a=I?I.getX(k):k,b=I?I.getX(k+1):k+1,c=I?I.getX(k+2):k+2;
   const mx=Math.min(pos[a*3],pos[b*3],pos[c*3]),Mx=Math.max(pos[a*3],pos[b*3],pos[c*3]),mz=Math.min(pos[a*3+2],pos[b*3+2],pos[c*3+2]),Mz=Math.max(pos[a*3+2],pos[b*3+2],pos[c*3+2]);
   if(Mx<cx-r||mx>cx+r||Mz<cz-r||mz>cz+r)continue;out.push(a,b,c);}
  return {pos,nor,tri:out};}
 // first hit of a ray (o, unit d) against the sampled triangles -> {p, n (interpolated hull normal), t}
 function cast(S,o,d){let best=null;const e1=new T.Vector3(),e2=new T.Vector3(),h=new T.Vector3(),s=new T.Vector3(),q=new T.Vector3(),A=new T.Vector3(),B=new T.Vector3(),C=new T.Vector3();
  for(let k=0;k<S.tri.length;k+=3){const a=S.tri[k],b=S.tri[k+1],c=S.tri[k+2];A.fromArray(S.pos,a*3);B.fromArray(S.pos,b*3);C.fromArray(S.pos,c*3);
   e1.subVectors(B,A);e2.subVectors(C,A);h.crossVectors(d,e2);const det=e1.dot(h);if(Math.abs(det)<1e-9)continue;const f=1/det;s.subVectors(o,A);const u=f*s.dot(h);if(u<0||u>1)continue;
   q.crossVectors(s,e1);const w=f*d.dot(q);if(w<0||u+w>1)continue;const t=f*e2.dot(q);if(t<=1e-4||(best&&t>=best.t))continue;
   const n=new T.Vector3().fromArray(S.nor,a*3).multiplyScalar(1-u-w).add(new T.Vector3().fromArray(S.nor,b*3).multiplyScalar(u)).add(new T.Vector3().fromArray(S.nor,c*3).multiplyScalar(w)).normalize();
   best={t,p:o.clone().addScaledVector(d,t),n};}
  return best;}
 // ---- geometry helpers ------------------------------------------------------------------------------------------------
 // simple growable buffers -> BufferGeometry
 function Buf(){const B={P:[],N:[],UV:[],I:[],X:{}};
  B.v=(p,n,uv,extra)=>{const i=B.P.length/3;B.P.push(p.x,p.y,p.z);B.N.push(n.x,n.y,n.z);B.UV.push(uv?uv[0]:0,uv?uv[1]:0);for(const k in extra){const v=extra[k];(B.X[k]=B.X[k]||{n:Array.isArray(v)?v.length:1,a:[]}).a.push(...[].concat(v));}return i;};
  B.geo=()=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(B.P,3));g.setAttribute('normal',new T.Float32BufferAttribute(B.N,3));g.setAttribute('uv',new T.Float32BufferAttribute(B.UV,2));
   for(const k in B.X)g.setAttribute(k,new T.Float32BufferAttribute(B.X[k].a,B.X[k].n));g.setIndex(B.I);g.computeBoundingSphere();return g;};return B;}
 // append a three.js geometry (non-indexed or indexed) with a matrix and constant extra attributes
 function addGeo(B,g,m,extra){const P=g.attributes.position,N=g.attributes.normal,nm=new T.Matrix3().getNormalMatrix(m),v=new T.Vector3(),n=new T.Vector3(),o=B.P.length/3;
  for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i).applyMatrix4(m);n.fromBufferAttribute(N,i).applyMatrix3(nm).normalize();B.v(v,n,null,extra);}
  if(g.index)for(let i=0;i<g.index.count;i++)B.I.push(o+g.index.getX(i));else for(let i=0;i<P.count;i++)B.I.push(o+i);g.dispose();}
 // ---- materials -------------------------------------------------------------------------------------------------------
 // doors: a copy of the hull's own material (same maps, colour, env, concept shader) + per-leaf hinge rotation, dark
 // underside/edges, seam, warning edge glow and scorch. Positions are boss-local (mesh sits in the FX group at identity),
 // so the hull shader's boss-local transform is the identity here.
 function doorMat(src,U){const m=src.clone(),hullOBC=src.onBeforeCompile;
  m.onBeforeCompile=s=>{hullOBC(s);Object.assign(s.uniforms,U);s.uniforms.uToLocal={value:new T.Matrix4()};s.uniforms.uToLocalN={value:new T.Matrix3()};
   s.vertexShader='uniform float uAng['+MAXB*2+'],uWarnL['+MAXB*2+'],uBurnL['+MAXB*2+'];attribute vec3 hp,ha;attribute float leaf,inner,edge;varying float vIn,vEdge,vWarn,vBurn;\n'+
    'vec3 rotA(vec3 v,vec3 k,float a){float c=cos(a),s=sin(a);return v*c+cross(k,v)*s+k*dot(k,v)*(1.-c);}\n'+
    s.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nint li=int(leaf+.5);float ang=uAng[li];objectNormal=rotA(objectNormal,ha,ang);vIn=inner;vEdge=edge;vWarn=uWarnL[li];vBurn=uBurnL[li];')
     .replace('vLoc=(uToLocal','transformed=hp+rotA(transformed-hp,ha,ang);\nvLoc=(uToLocal');
   s.fragmentShader='uniform vec3 uMetal,uWarnCol,uEmber;uniform float uSeam,uTimeB;varying float vIn,vEdge,vWarn,vBurn;\n'+
    s.fragmentShader.replace('#include <lights_physical_fragment>',`{ float sm=1.-smoothstep(0.,.06,vEdge);
  diffuseColor.rgb*=1.-sm*uSeam*(1.-vIn); totalEmissiveRadiance*=1.-sm*uSeam;
  diffuseColor.rgb=mix(diffuseColor.rgb,uMetal,vIn); totalEmissiveRadiance*=1.-vIn;
  float wp=1.-smoothstep(0.,.18,vEdge); totalEmissiveRadiance+=uWarnCol*wp*vWarn*(1.-vIn);
  diffuseColor.rgb*=1.-vBurn*.82; totalEmissiveRadiance*=1.-vBurn*.9;
  float fl=.55+.45*sin(uTimeB*7.+vLoc.x*5.1+vLoc.z*3.7)*sin(uTimeB*3.1+vLoc.z*9.);
  totalEmissiveRadiance+=uEmber*vBurn*sm*fl*1.4; }
#include <lights_physical_fragment>`);};
  m.customProgramCacheKey=()=>'megaboss-doors';return m;}
 // cavity: interior-mapped box under the surface. Per-bay values are looked up in the vertex shader (WebGL1 only allows
 // constant/loop indices into uniform arrays in fragment shaders) and passed on as varyings.
 const cavityMat=()=>new T.ShaderMaterial({polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4,
  uniforms:{uCam:{value:[...Array(MAXB)].map(()=>new T.Vector3())},uDim:{value:[...Array(MAXB)].map(()=>new T.Vector4())},uRk:{value:[...Array(MAXB)].map(()=>new T.Vector4())},
   uSt:{value:[...Array(MAXB)].map(()=>new T.Vector4())},uTime:{value:0},uMetal:{value:new T.Color()},uShell:{value:new T.Color()},uLip:{value:new T.Color()},uUp:{value:new T.Color()},uEmber:{value:new T.Color()}},
  vertexShader:'uniform vec3 uCam['+MAXB+'];uniform vec4 uDim['+MAXB+'],uRk['+MAXB+'],uSt['+MAXB+'];attribute vec3 bp;attribute float bi;varying vec3 vB,vC;varying vec4 vD,vR,vS;'+
   'void main(){int i=int(bi+.5);vB=bp;vC=uCam[i];vD=uDim[i];vR=uRk[i];vS=uSt[i];gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  // vD = half length, depth, half width, -; vR = rack half length, rack top (bay Y), rack half width, rack height;
  // vS = doors open 0..1, lip light, scorch 0..1, hit flash
  fragmentShader:'uniform float uTime;uniform vec3 uMetal,uShell,uLip,uUp,uEmber;varying vec3 vB,vC;varying vec4 vD,vR,vS;'+
   'float h1(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}'+
   'void main(){if(vS.x<.001)discard;vec3 o=vB,r=normalize(vB-vC);if(r.y>-.01)r.y=-.01;r=normalize(r);'+
   // exit point of the bay box (walls x/z, floor y=-depth)
   'vec3 bx=vec3(vD.x,vD.y,vD.z);float tx=((r.x>0.?bx.x:-bx.x)-o.x)/r.x,tz=((r.z>0.?bx.z:-bx.z)-o.z)/r.z,ty=(-bx.y-o.y)/r.y;'+
   'float t=min(min(tx,tz),ty);int face=t==ty?0:(t==tx?1:2);'+
   // weapon box still below the surface (slab test)
   'vec3 lo=vec3(-vR.x,vR.y-vR.w,-vR.z),hi=vec3(vR.x,min(vR.y,0.),vR.z);vec3 ia=(lo-o)/r,ib=(hi-o)/r,tn=min(ia,ib),tf=max(ia,ib);'+
   'float te=max(max(tn.x,tn.y),tn.z),tl=min(min(tf.x,tf.y),tf.z);bool rk=vR.y>vR.w*-.999&&tl>max(te,0.)&&te<t;'+
   'vec3 col;if(rk){vec3 p=o+r*max(te,0.);float dep=clamp(-p.y/bx.y,0.,1.);float side=te==tn.y?1.:0.;'+
   ' float rib=step(.82,fract((p.x+p.z)*3.2));col=uShell*(.32+.25*side)*(1.-rib*.4)*(1.-dep*.75)+uUp*.35*(1.-side)*dep+uLip*.25*smoothstep(-.25,0.,p.y)*vS.y;'+
   ' col=mix(col,uMetal*.4,vS.z*.85);col+=vec3(1.)*vS.w*.6;}'+
   'else{vec3 p=o+r*t;float dep=clamp(-p.y/bx.y,0.,1.);'+
   ' if(face==0){vec2 g=abs(fract(p.xz*vec2(1.6,2.4))-.5);float seam=1.-smoothstep(.0,.04,.5-max(g.x,g.y));'+
   '  float c=1.-smoothstep(.0,1.,length(p.xz/bx.xz));col=uMetal*(.55-seam*.35)+uUp*(.25+.55*c)*(1.-seam*.6);}'+
   ' else{float u=face==1?p.z:p.x;float rib=1.-smoothstep(.0,.05,abs(fract(u*2.6)-.5)-.38);'+
   '  col=uMetal*(1.15-dep*.7)*(1.-rib*.45)+uUp*.18*dep;'+
   '  float lip=1.-smoothstep(.0,.05,abs(p.y+.11));col+=uLip*lip*vS.y*(.9+.1*h1(floor(vec2(u*8.,1.))));}'+
   ' float ao=smoothstep(0.,.25,min(bx.x-abs(p.x),bx.z-abs(p.z)))*.5+.5;col*=mix(1.,ao,face==0?1.:.0);'+
   ' float em=vS.z*(.5+.5*sin(uTime*6.+p.x*7.+p.z*5.)*sin(uTime*2.3+p.x*13.));col=mix(col,uMetal*.25,vS.z*.8)+uEmber*em*.9*(face==0?1.:.4);}'+
   'gl_FragColor=vec4(col,1.);'+OUT+'}'});
 // weapon block: standard material with vertex colours + charge glow (ch 1 = red mouth rings, 2 = violet strips),
 // fired missiles collapse (mi = tube index), scorch + embers, hit flash
 function rackMat(env){const m=new T.MeshStandardMaterial({vertexColors:true,roughness:.32,metalness:.15,envMap:env||null,envMapIntensity:.8});
  const U={uFired:{value:new Array(6).fill(0)},uCharge:{value:0},uVio:{value:1},uBurn:{value:0},uFlash:{value:0},uTimeR:{value:0},uRed:{value:new T.Color()},uViolet:{value:new T.Color()},uEmberR:{value:new T.Color()}};
  m.onBeforeCompile=s=>{Object.assign(s.uniforms,U);
   s.vertexShader='uniform float uFired[6];attribute float ch,mi;varying float vCh;varying vec3 vP;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCh=ch;vP=position;if(mi>-.5){int k=int(mi+.5);if(uFired[k]>.5)transformed=vec3(0.,-.6,0.);}');
   s.fragmentShader='uniform float uCharge,uVio,uBurn,uFlash,uTimeR;uniform vec3 uRed,uViolet,uEmberR;varying float vCh;varying vec3 vP;\n'+s.fragmentShader.replace('#include <lights_physical_fragment>',`{
  totalEmissiveRadiance+=uRed*step(.5,vCh)*step(vCh,1.5)*(.25+uCharge*2.2)+uViolet*step(1.5,vCh)*uVio*1.6;
  diffuseColor.rgb*=1.-uBurn*.85; totalEmissiveRadiance*=1.-uBurn*.95;
  float e=max(0.,sin(uTimeR*5.+vP.x*9.+vP.y*13.)*sin(uTimeR*1.7+vP.z*17.+vP.x*3.)); totalEmissiveRadiance+=uEmberR*uBurn*e*e*1.6;
  totalEmissiveRadiance+=vec3(1.,.9,.85)*uFlash; }
#include <lights_physical_fragment>`);};
  m.customProgramCacheKey=()=>'megaboss-rack';m.userData.U=U;return m;}
 // vertical launch block in its own frame: X along the bay, Y up (origin = top deck), Z across
 function rackGeo(R,C){const B=Buf(),M=new T.Matrix4(),col=h=>{const c=new T.Color();lin(c,h);return [c.r,c.g,c.b];};
  const add=(g,x,y,z,c,ch=0,mi=-1,rx=0)=>{M.makeRotationX(rx).setPosition(x,y,z);addGeo(B,g,M,{color:c,ch,mi});};
  const shell=col(C.shell),metal=col(C.metal),dark=col('#050508'),red=col('#d0121e'),white=col('#f2f2f4'),vio=col(C.violet);
  const L=R.len,W=R.wid,H=R.h;
  add(new T.BoxGeometry(L,H,W),0,-H/2,0,shell);                                   // armoured body
  add(new T.BoxGeometry(L-.14,.05,W-.12),0,.0,0,metal);                          // top deck
  add(new T.BoxGeometry(L+.04,.06,W+.04),0,-H+.08,0,metal);                       // lower lip
  for(const s of[-1,1]){add(new T.BoxGeometry(L-.1,.035,.02),0,-.11,s*(W/2+.008),vio,2);                  // violet edge strips
   for(let i=0;i<4;i++)add(new T.BoxGeometry(.07,H-.25,.04),-L/2+.35+i*(L-.7)/3,-H/2-.06,s*(W/2+.012),metal);}   // side ribs
  for(const s of[-1,1])add(new T.BoxGeometry(.03,H-.25,W-.2),s*(L/2+.012),-H/2-.06,0,metal);
  const [nx,nz]=R.tubes;let k=0;
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const x=(i-(nx-1)/2)*.75,z=(j-(nz-1)/2)*.5;
   add(new T.CylinderGeometry(R.tubeR,R.tubeR*1.08,.1,18),x,.075,z,shell);
   add(new T.CylinderGeometry(R.tubeR*.78,R.tubeR*.78,.02,18),x,.122,z,dark);
   add(new T.RingGeometry(R.tubeR*.8,R.tubeR*.98,20),x,.127,z,red,1,-1,-Math.PI/2);
   add(new T.ConeGeometry(R.tubeR*.62,.26,14),x,.2,z,red,0,k);                     // missile nose (hidden once fired)
   add(new T.CylinderGeometry(R.tubeR*.64,R.tubeR*.64,.06,14),x,.05,z,white,0,k);k++;}
  add(new T.CylinderGeometry(.2,.24,.7,14),0,-H-.35,0,metal);                       // lift column (stays in the bay)
  return B.geo();}
 // ---- build -------------------------------------------------------------------------------------------------------------
 function build(A,opts={}){const C=opts.cfg||BAYS_CFG,root=A.root,hull=A.meshes.hull,on=opts.on||(()=>{});
  root.updateMatrixWorld(true);const inv=new T.Matrix4().copy(root.matrixWorld).invert(),rel=new T.Matrix4().multiplyMatrices(inv,hull.matrixWorld);
  const fx=root.getObjectByName('megabossFX'),Bs=[],doorB=Buf(),cavB=Buf(),D=C.doors;
  const markers={};for(const w of A.anchors.wb)markers[w.name]=w;
  C.bays.forEach((bc,bi)=>{if(bi>=MAXB)return;
   const a2=new T.Vector3(bc.dir[0],0,bc.dir[1]).normalize(),S=hullTris(hull,rel,bc.xz[0],bc.xz[1],Math.max(bc.len,bc.wid)+1.5);
   const down=new T.Vector3(0,-1,0),hc=cast(S,new T.Vector3(bc.xz[0],20,bc.xz[1]),down);if(!hc)throw new Error('bay '+bc.id+': no hull under '+bc.xz);
   // bay up = mean hull normal over the footprint; bay axes A (along), U (up), B = A x U (across)
   const Uv=new T.Vector3();for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const h=cast(S,new T.Vector3(bc.xz[0],20,bc.xz[1]).addScaledVector(a2,i*bc.len*.4).add(new T.Vector3(-a2.z,0,a2.x).multiplyScalar(j*bc.wid*.4)),down);if(h)Uv.add(h.n);}
   Uv.normalize();const Av=a2.clone().addScaledVector(Uv,-a2.dot(Uv)).normalize(),Bv=new T.Vector3().crossVectors(Av,Uv);
   const c0=hc.p.clone(),M=new T.Matrix4().makeBasis(Av,Uv,Bv).setPosition(c0),Mi=M.clone().invert();
   // sample the surface on a grid over the footprint (rays along -U)
   const nS=14,nT=8,grid=[];for(let i=0;i<=nS;i++){grid[i]=[];for(let j=0;j<=nT;j++){const s=(i/nS-.5)*bc.len,t=(j/nT-.5)*bc.wid,o=c0.clone().addScaledVector(Av,s).addScaledVector(Bv,t).addScaledVector(Uv,6);
    const h=cast(S,o,Uv.clone().negate());if(!h)throw new Error('bay '+bc.id+': footprint leaves the hull at s='+s.toFixed(2)+' t='+t.toFixed(2));grid[i][j]={p:h.p,n:h.n,s,t};}}
   const uvOf=p=>{const tb=opts.texBox||{x0:-15.5,x1:15.5,z0:-18.5,z1:18.5};return [clamp01((p.x-tb.x0)/(tb.x1-tb.x0)),clamp01((p.z-tb.z0)/(tb.z1-tb.z0))];};
   // doors: two slabs split along the centre line, hinged at the long outer edges
   const half=nT/2;
   for(const side of[0,1]){const leaf=bi*2+side,j0=side?half:0,j1=side?nT:half,hingeJ=side?nT:0;
    const pA=grid[0][hingeJ].p.clone().addScaledVector(grid[0][hingeJ].n,D.lift),pB=grid[nS][hingeJ].p.clone().addScaledVector(grid[nS][hingeJ].n,D.lift);
    let ax=pB.clone().sub(pA).normalize();
    // positive angle must lift the leaf's free edge (towards +U)
    const mid=grid[nS>>1][side?half:half].p,r=mid.clone().sub(pA),lifted=r.clone().applyAxisAngle(ax,.3);if(lifted.dot(Uv)<r.dot(Uv))ax.negate();
    const top=[],bot=[],gapT=D.gap/2,lc=grid[nS>>1][(j0+j1)>>1].p;
    for(let i=0;i<=nS;i++){top[i]=[];bot[i]=[];for(let j=j0;j<=j1;j++){const g=grid[i][j];let p=g.p.clone();
      if(j===half)p.addScaledVector(Bv,side?gapT:-gapT);                                   // small split between the leaves
      const pt=p.clone().addScaledVector(g.n,D.lift),pb=p.clone().addScaledVector(g.n,D.lift-D.thick);
      const edge=Math.min(i,nS-i)/nS*bc.len,eT=Math.min(Math.abs(g.t-(side?gapT:-gapT)),bc.wid/2-Math.abs(g.t)),ed=Math.min(edge,eT);
      const X={hp:[pA.x,pA.y,pA.z],ha:[ax.x,ax.y,ax.z],leaf,edge:ed};
      top[i][j]=doorB.v(pt,g.n,uvOf(p),{...X,inner:0});bot[i][j]=doorB.v(pb,g.n.clone().negate(),uvOf(p),{...X,inner:1});}}
    for(let i=0;i<nS;i++)for(let j=j0;j<j1;j++){const a=top[i][j],b=top[i+1][j],c=top[i+1][j+1],d=top[i][j+1];
     doorB.I.push(a,b,c,a,c,d);const e=bot[i][j],f=bot[i+1][j],g=bot[i+1][j+1],h=bot[i][j+1];doorB.I.push(e,g,f,e,h,g);}
    // edge walls (dark): four sides of the leaf
    const ring=[];for(let i=0;i<=nS;i++)ring.push([i,j0]);for(let j=j0+1;j<=j1;j++)ring.push([nS,j]);for(let i=nS-1;i>=0;i--)ring.push([i,j1]);for(let j=j1-1;j>j0;j--)ring.push([0,j]);
    for(let k=0;k<ring.length;k++){const [i1,j1_]=ring[k],[i2,j2]=ring[(k+1)%ring.length];
     const p1=new T.Vector3().fromArray(doorB.P,top[i1][j1_]*3),p2=new T.Vector3().fromArray(doorB.P,top[i2][j2]*3),q1=new T.Vector3().fromArray(doorB.P,bot[i1][j1_]*3),q2=new T.Vector3().fromArray(doorB.P,bot[i2][j2]*3);
     const n=new T.Vector3().subVectors(p2,p1).cross(Uv).normalize();if(n.dot(p1.clone().sub(lc))<0)n.negate();const X={hp:[pA.x,pA.y,pA.z],ha:[ax.x,ax.y,ax.z],leaf,edge:0,inner:1};
     const v0=doorB.v(p1,n,null,X),v1=doorB.v(p2,n,null,X),v2=doorB.v(q2,n,null,X),v3=doorB.v(q1,n,null,X);doorB.I.push(v0,v2,v1,v0,v3,v2);}}
   // cavity patch (slightly inset, just above the hull)
   const cv=[];const ins=.97;for(let i=0;i<=nS;i++){cv[i]=[];for(let j=0;j<=nT;j++){const g=grid[i][j],p=g.p.clone().addScaledVector(g.n,.012),q=g.p.clone().applyMatrix4(Mi);
     const pi=c0.clone().addScaledVector(Av,g.s*ins).addScaledVector(Bv,g.t*ins);const pp=p.clone().add(pi.sub(c0.clone().addScaledVector(Av,g.s).addScaledVector(Bv,g.t)));
     cv[i][j]=cavB.v(pp,g.n,null,{bp:[q.x*ins,q.y,q.z*ins],bi});}}
   for(let i=0;i<nS;i++)for(let j=0;j<nT;j++){const a=cv[i][j],b=cv[i+1][j],c=cv[i+1][j+1],d=cv[i][j+1];cavB.I.push(a,b,c,a,c,d);}
   // weapon block
   const rg=rackGeo(C.rack,C.look),rm=rackMat(A.envMap||(hull.material&&hull.material.envMap));lin(rm.userData.U.uRed.value,C.look.red);lin(rm.userData.U.uViolet.value,C.look.violet);lin(rm.userData.U.uEmberR.value,C.look.ember);
   const rack=new T.Mesh(rg,rm);rack.name='bay_'+bc.id+'_rack';rack.matrixAutoUpdate=false;rack.visible=false;fx.add(rack);
   const bay={id:bc.id,bi,cfg:bc,M,Mi,c0,Av,Uv,Bv,rack,hp:bc.hp,state:'hidden',t:0,open:0,h:-1,fired:0,shots:0,warn:0,burn:0,flash:0,tilt:0,leafAng:[0,0],smokeT:0,marker:markers[bc.marker]||null};
   bay.h=-(bc.depth-.04);Bs.push(bay);});
  // winding: every triangle faces the way its stored normal points (top, underside and edge walls alike)
  const wind=g=>{const P=g.attributes.position,N=g.attributes.normal,I=g.index,a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),n=new T.Vector3();
   for(let k=0;k<I.count;k+=3){a.fromBufferAttribute(P,I.getX(k));b.fromBufferAttribute(P,I.getX(k+1));c.fromBufferAttribute(P,I.getX(k+2));n.fromBufferAttribute(N,I.getX(k));
    if(b.sub(a).cross(c.sub(a)).dot(n)<0){const t=I.getX(k+1);I.setX(k+1,I.getX(k+2));I.setX(k+2,t);}}return g;};
  const dg=wind(doorB.geo()),cg=wind(cavB.geo());
  const DU={uAng:{value:new Array(MAXB*2).fill(0)},uWarnL:{value:new Array(MAXB*2).fill(0)},uBurnL:{value:new Array(MAXB*2).fill(0)},uMetal:{value:new T.Color()},uWarnCol:{value:new T.Color()},uEmber:{value:new T.Color()},uSeam:{value:D.seam},uTimeB:{value:0}};
  lin(DU.uMetal.value,C.look.metal);lin(DU.uWarnCol.value,C.look.red).multiplyScalar(2.2);lin(DU.uEmber.value,C.look.ember);
  const doors=new T.Mesh(dg,doorMat(hull.material,DU));doors.name='bayDoors';fx.add(doors);
  const cav=new T.Mesh(cg,cavityMat());cav.name='bayCavity';cav.visible=false;fx.add(cav);const CU=cav.material.uniforms;
  for(const [k,h] of[['uMetal',C.look.metal],['uShell',C.look.shell],['uLip',C.look.lip],['uUp',C.look.uplight],['uEmber',C.look.ember]])lin(CU[k].value,h);
  CU.uLip.value.multiplyScalar(1.6);
  const W={A,C,bays:Bs,doors,cav,DU,srcMat:hull.material,_m:new T.Matrix4(),_v:new T.Vector3(),on,time:0};
  W.trigger=id=>{const b=find(W,id);if(!b||b.state!=='hidden')return false;go(W,b,'warn');return true;};
  W.hit=(id,dmg=1)=>hit(W,find(W,id),dmg);W.hittable=id=>hittable(find(W,id));W.update=(dt,cam)=>update(W,dt,cam);W.reset=()=>reset(W);W.dispose=()=>dispose(W);
  W.state=id=>{const b=find(W,id);return b&&b.state;};W.bay=id=>find(W,id);W.worldPos=(id,y=0,x=0,z=0)=>worldPos(W,find(W,id),y,x,z);
  return W;}
 const find=(W,id)=>W.bays.find(b=>b.id===id)||(typeof id==='number'?W.bays[id]:null);
 function go(W,b,s){b.state=s;b.t=0;const p=worldPos(W,b,0);W.on(s,{id:b.id,kind:b.cfg.kind,pos:p});}
 const hittable=b=>!!b&&(b.state==='fire'||b.state==='hold'||(b.state==='deploy'&&b.t>.25)||(b.state==='retract'&&b.t<.2));
 function hit(W,b,dmg){if(!hittable(b))return false;b.hp-=dmg;b.flash=1;W.on('hit',{id:b.id,hp:Math.max(0,b.hp),pos:worldPos(W,b,b.h)});
  if(b.hp<=0){b.hp=0;go(W,b,'dead');b.fired=63;}return true;}
 // boss-local point in the bay frame -> world
 function worldPos(W,b,y,x=0,z=0){const p=new T.Vector3(x,y,z).applyMatrix4(b.M);W.A.root.updateMatrixWorld();return p.applyMatrix4(W.A.root.matrixWorld);}
 function reset(W){for(const b of W.bays){b.state='hidden';b.t=0;b.hp=b.cfg.hp;b.fired=0;b.shots=0;b.burn=0;b.flash=0;b.tilt=0;b.h=-(b.cfg.depth-.04);b.leafAng=[0,0];b.open=0;b.warn=0;b.hDead=undefined;}}
 function update(W,dt,cam){const C=W.C,Tm=C.timing,D=C.doors,R=C.rack,hull=W.A.meshes.hull;W.time+=dt;
  // the hull material can be swapped by MegaBossFX.apply (quality/look changes): rebuild the door copy to match
  if(hull.material!==W.srcMat){W.doors.material.dispose();W.doors.material=doorMat(hull.material,W.DU);W.srcMat=hull.material;}
  const anyOpen=[];
  for(const b of W.bays){b.t+=dt;const st=b.state,down=-(b.cfg.depth-.04),up=R.up;let open=0,h=down,warn=0,charge=0;
   if(st==='warn'){warn=.5+.5*Math.sin(b.t*Math.PI*2/ .2);if(b.t>=Tm.warn)go(W,b,'open');}
   else if(st==='open'){open=sstep(0,Tm.open,b.t);warn=.6;if(b.t>=Tm.open)go(W,b,'deploy');}
   else if(st==='deploy'){open=1;h=down+(up-down)*outBack(b.t/Tm.deploy);charge=b.t/Tm.deploy*.4;if(b.t>=Tm.deploy){go(W,b,'fire');b.shots=0;}}
   else if(st==='fire'){open=1;h=up;const order=[0,3,1,4,2,5],n=R.tubes[0]*R.tubes[1];charge=.7+.3*Math.sin(b.t*40);
    while(b.shots<n&&b.t>=b.shots*Tm.gap){const k=order[b.shots]??b.shots;b.fired|=1<<k;b.shots++;
     const nx=R.tubes[0],i=k%nx,j=Math.floor(k/nx),x=(i-(nx-1)/2)*.75,z=(j-(R.tubes[1]-1)/2)*.5;
     const p=worldPos(W,b,h+.2,x,z),d=b.Uv.clone().transformDirection(W.A.root.matrixWorld);W.on('missile',{id:b.id,tube:k,pos:p,dir:d});}
    if(b.shots>=n&&b.t>=n*Tm.gap)go(W,b,'hold');}
   else if(st==='hold'){open=1;h=up;charge=Math.max(0,.6-b.t);if(b.t>=Tm.hold)go(W,b,'retract');}
   else if(st==='retract'){open=1;h=up+(down-up)*sstep(0,1,b.t/Tm.retract);if(b.t>=Tm.retract)go(W,b,'close');}
   else if(st==='close'){open=1-sstep(0,Tm.close,b.t);if(b.t>=Tm.close){go(W,b,'hidden');b.fired=0;}}
   else if(st==='dead'){const k=clamp01(b.t/.35);open=1;b.burn=Math.min(1,b.t/.3);h=(b.hDead??(b.hDead=b.h))+(.12-(b.hDead??0))*sstep(0,.5,b.t);b.tilt=.28*outBack(b.t/.5);
    b.leafAng=[D.angle+(2.55-D.angle)*outBack(k),D.angle+(2.25-D.angle)*outBack(k*1.2)];
    b.smokeT-=dt;if(b.smokeT<=0){b.smokeT=.09+Math.random()*.08;W.on('smoke',{id:b.id,pos:worldPos(W,b,h+.1,(Math.random()-.5)*1.4,(Math.random()-.5)*.6),heavy:b.t<1.5});}
    if(Math.random()<dt*2.5)W.on('spark',{id:b.id,pos:worldPos(W,b,h+.2,(Math.random()-.5)*1.6,(Math.random()-.5)*.6)});}
   if(st!=='dead'){b.h=h;b.leafAng=[open*D.angle,open*D.angle*.985];}else b.h=h;
   b.open=open;b.warn=warn;b.flash=Math.max(0,b.flash-dt*10);
   W.DU.uAng.value[b.bi*2]=b.leafAng[0];W.DU.uAng.value[b.bi*2+1]=b.leafAng[1];W.DU.uWarnL.value[b.bi*2]=W.DU.uWarnL.value[b.bi*2+1]=warn;W.DU.uBurnL.value[b.bi*2]=W.DU.uBurnL.value[b.bi*2+1]=b.burn;
   // weapon block: frame = bay frame, raised by h, tilted about the bay's long axis once destroyed
   const m=W._m.makeRotationX(b.tilt);m.setPosition(0,b.h,0);b.rack.matrix.multiplyMatrices(b.M,m);b.rack.visible=b.h>down+.02||st==='dead';
   const RU=b.rack.material.userData.U;for(let k=0;k<6;k++)RU.uFired.value[k]=(b.fired>>k)&1;RU.uCharge.value=charge;RU.uBurn.value=b.burn;RU.uFlash.value=b.flash;RU.uTimeR.value=W.time;RU.uVio.value=1-b.burn;
   const CU=W.cav.material.uniforms;CU.uDim.value[b.bi].set(b.cfg.len/2*.97,b.cfg.depth,b.cfg.wid/2*.97,0);CU.uRk.value[b.bi].set(R.len/2,b.h,R.wid/2,R.h);
   CU.uSt.value[b.bi].set(open>0||st==='dead'?Math.max(open,.001):0,open*(st==='fire'||st==='warn'?.6+.4*Math.sin(W.time*30):.7),b.burn,b.flash);
   if(cam){const p=W._v.copy(cam.position);W._m.multiplyMatrices(W.A.root.matrixWorld,b.M).invert();p.applyMatrix4(W._m);CU.uCam.value[b.bi].copy(p);}
   if(open>0||st==='dead')anyOpen.push(b);}
  W.cav.visible=anyOpen.length>0;W.cav.material.uniforms.uTime.value=W.time;W.DU.uTimeB.value=W.time;}
 function dispose(W){for(const o of[W.doors,W.cav,...W.bays.map(b=>b.rack)]){if(o.parent)o.parent.remove(o);o.geometry.dispose();o.material.dispose();}W.disposed=true;}
 return {build,CFG:BAYS_CFG};})();
