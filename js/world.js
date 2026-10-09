'use strict';
// 2D sprite helpers, three.js world (sky, terrain, biomes, props) and 3D models.
// ================= 2D HELPERS (overlay effects + hangar previews) =================
const stageEl=$('stage'),cv=$('game'),cx=cv.getContext('2d');
function hexRGB(c){const n=parseInt(c.slice(1),16);return[n>>16,(n>>8)&255,n&255];}
function shade(c,f){const[r,g,b]=hexRGB(c),t=f<0?0:255,p=Math.abs(f);return`rgb(${Math.round(r+(t-r)*p)},${Math.round(g+(t-g)*p)},${Math.round(b+(t-b)*p)})`;}
function lin(g,x0,y0,x1,y1,stops){const gr=g.createLinearGradient(x0,y0,x1,y1);stops.forEach((c,i)=>gr.addColorStop(i/(stops.length-1),c));return gr;}
function jet2d(g,o,body,acc){const L=o.L,S=o.S,fw=o.fw,ny=-L/2,ty=L/2;
 const wy=ny+L*o.wl,wc=L*o.chord,tipY=wy+(S/2-fw)*o.sweep,tc=L*o.tip;
 const metal=lin(g,-S/2,0,S/2,0,[shade(body,-.5),shade(body,-.12),shade(body,.28),body,shade(body,-.18),shade(body,-.5)]);
 if(o.tailS){g.fillStyle=metal;for(const s of[-1,1]){g.beginPath();g.moveTo(s*fw*.8,ty-L*.24);g.lineTo(s*S*o.tailS,ty-L*.09);g.lineTo(s*S*o.tailS,ty-L*.01);g.lineTo(s*fw*.8,ty-L*.02);g.closePath();g.fill();}}
 for(const s of[-1,1]){g.fillStyle=metal;g.beginPath();g.moveTo(s*fw,wy);g.lineTo(s*S/2,tipY);g.lineTo(s*S/2,tipY+tc);g.lineTo(s*fw,wy+wc);g.closePath();g.fill();
  g.fillStyle=acc;g.fillRect(s>0?S/2-S*.08:-S/2,tipY,S*.08,tc+2);}
 g.fillStyle=lin(g,-fw,0,fw,0,[shade(body,-.45),shade(body,.35),body,shade(body,-.4)]);
 g.beginPath();g.moveTo(0,ny);g.quadraticCurveTo(fw*1.05,ny+L*.16,fw,ny+L*.36);g.lineTo(fw*.92,ty);g.lineTo(-fw*.92,ty);g.lineTo(-fw,ny+L*.36);g.quadraticCurveTo(-fw*1.05,ny+L*.16,0,ny);g.fill();
 g.fillStyle=acc;g.fillRect(-fw*.22,ny+L*.42,fw*.44,L*.34);
 const cy=ny+L*.24;g.fillStyle=lin(g,0,cy-5,0,cy+5,['#7fd8ff','#2a5d86','#0c1a2a']);g.beginPath();g.ellipse(0,cy,fw*.62,L*.11,0,0,TAU);g.fill();}
function mk(w,h,f,sc=2.2){const c=document.createElement('canvas');c.width=Math.ceil(w*sc);c.height=Math.ceil(h*sc);const g=c.getContext('2d');g.setTransform(sc,0,0,sc,c.width/2,c.height/2);f(g);c.w=w;c.h=h;return c;}
function spr(img,x,y,rot=0,s=1){if(!rot){cx.drawImage(img,x-img.w*s/2,y-img.h*s/2,img.w*s,img.h*s);return;}cx.save();cx.translate(x,y);cx.rotate(rot);cx.drawImage(img,-img.w*s/2,-img.h*s/2,img.w*s,img.h*s);cx.restore();}
const glowC={};
function glow(c){if(glowC[c])return glowC[c];const s=document.createElement('canvas');s.width=s.height=64;const g=s.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);
 gr.addColorStop(0,c);gr.addColorStop(.3,c+'aa');gr.addColorStop(.6,c+'33');gr.addColorStop(1,c+'00');g.fillStyle=gr;g.fillRect(0,0,64,64);return glowC[c]=s;}
const dg=(x,y,r,c)=>cx.drawImage(glow(c),x-r,y-r,r*2,r*2);
const SP={};
function buildSprites(){
 for(const k in PLANES){const p=PLANES[k];SP[k]=mk(p.jet.S+4,p.jet.L+4,g=>jet2d(g,p.jet,p.body,p.accent));}
 SP.gundrone=mk(18,20,g=>{g.fillStyle=lin(g,-7,0,7,0,['#4b5560','#c9d2db','#4b5560']);g.beginPath();g.moveTo(0,-9);g.lineTo(7,4);g.lineTo(4,9);g.lineTo(-4,9);g.lineTo(-7,4);g.closePath();g.fill();g.fillStyle='#2bd1c0';g.fillRect(-1.5,-3,3,6);});
 SP.laserdrone=mk(20,20,g=>{g.fillStyle=lin(g,-8,-8,8,8,['#cfe8ff','#3b6aa8']);g.beginPath();g.moveTo(0,-9);g.lineTo(8,0);g.lineTo(0,9);g.lineTo(-8,0);g.closePath();g.fill();g.fillStyle='#e9fbff';g.beginPath();g.arc(0,0,3,0,TAU);g.fill();});
 SP.shielddrone=mk(22,22,g=>{g.fillStyle=lin(g,-9,-9,9,9,['#b8f0ff','#2a7bbf']);g.beginPath();for(let i=0;i<6;i++){const a=i/6*TAU;g.lineTo(Math.cos(a)*9,Math.sin(a)*9);}g.closePath();g.fill();});
 const cap=(c,txt)=>mk(26,26,g=>{const gr=g.createRadialGradient(-3,-4,1,0,0,11);gr.addColorStop(0,'#fff');gr.addColorStop(.35,c);gr.addColorStop(1,shade(c,-.5));g.fillStyle=gr;g.beginPath();g.arc(0,0,11,0,TAU);g.fill();g.strokeStyle='rgba(255,255,255,.8)';g.lineWidth=1.5;g.stroke();
  g.fillStyle='#fff';g.font='bold 13px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText(txt,0,1);});
 SP.P=cap('#ff9d2e','P');SP.Hp=cap('#3ddc84','+');SP.B=cap('#ff4d6d','B');SP.S=cap('#38c8ff','S');
 SP.gear=mk(16,16,g=>{g.fillStyle=lin(g,-7,-7,7,7,['#ffe08a','#ff9d2e','#b35a00']);for(let i=0;i<8;i++){g.save();g.rotate(i/8*TAU);g.fillRect(-1.6,-7.5,3.2,4);g.restore();}g.beginPath();g.arc(0,0,5.5,0,TAU);g.fill();g.fillStyle='#5a2a00';g.beginPath();g.arc(0,0,2,0,TAU);g.fill();});
 const orb=(c,r,core='#fff')=>mk(r*4,r*4,g=>{const gr=g.createRadialGradient(0,0,0,0,0,r*2);gr.addColorStop(0,c+'cc');gr.addColorStop(.45,c+'55');gr.addColorStop(1,c+'00');g.fillStyle=gr;g.fillRect(-r*2,-r*2,r*4,r*4);
  g.fillStyle=c;g.beginPath();g.arc(0,0,r,0,TAU);g.fill();g.fillStyle=core;g.beginPath();g.arc(0,0,r*.5,0,TAU);g.fill();});
 SP.eo=orb('#ff3c50',5);SP.ebig=orb('#d94dff',8);SP.esh=orb('#ffae2e',4.5);SP.ering=orb('#ff6a3d',4.5);
 SP.el=mk(10,30,g=>{const gr=g.createLinearGradient(0,-15,0,15);gr.addColorStop(0,'rgba(255,40,70,0)');gr.addColorStop(.5,'#ff3c50');gr.addColorStop(1,'#ffffff');g.fillStyle=gr;g.beginPath();g.ellipse(0,0,3.5,14,0,0,TAU);g.fill();});
 SP.em=mk(10,22,g=>{g.fillStyle=lin(g,-3,0,3,0,['#7a1a24','#ff6d6d','#7a1a24']);g.fillRect(-2.5,-9,5,16);g.fillStyle='#ffd0d0';g.beginPath();g.moveTo(-2.5,7);g.lineTo(0,11);g.lineTo(2.5,7);g.fill();g.fillStyle='#444';g.fillRect(-4,-9,8,3);});
 SP.pv=mk(8,22,g=>{const gr=g.createLinearGradient(0,-10,0,10);gr.addColorStop(0,'#ffffff');gr.addColorStop(.4,'#ffe08a');gr.addColorStop(1,'rgba(255,140,30,0)');g.fillStyle=gr;g.fillRect(-2,-10,4,20);});
 SP.ps=mk(14,14,g=>{const gr=g.createRadialGradient(0,0,0,0,0,7);gr.addColorStop(0,'#fff');gr.addColorStop(.4,'#ffb347');gr.addColorStop(1,'rgba(255,90,30,0)');g.fillStyle=gr;g.fillRect(-7,-7,14,14);});
 SP.pp=mk(32,32,g=>{const gr=g.createRadialGradient(0,0,0,0,0,16);gr.addColorStop(0,'#ffffff');gr.addColorStop(.3,'#9fe8ff');gr.addColorStop(.6,'rgba(60,140,255,.6)');gr.addColorStop(1,'rgba(40,80,255,0)');g.fillStyle=gr;g.fillRect(-16,-16,32,32);});
 SP.pm=mk(8,16,g=>{g.fillStyle=lin(g,-2,0,2,0,['#1b6e66','#bff8f0','#1b6e66']);g.fillRect(-2,-7,4,12);g.fillStyle='#fff';g.beginPath();g.moveTo(-2,-7);g.lineTo(0,-10);g.lineTo(2,-7);g.fill();});
}

// ================= 3D CORE =================
const T3=THREE;
const col=h=>new T3.Color(h).convertSRGBToLinear();
let fill,renderer,scene,camera,sun,hemi,skyMat,sky,pmrem,envRT=null;
const PM=new T3.Matrix4();let PE=null;
const C3={y:100,z:50,Zt:0,Zb:0,t:1.2,ly:[],v:0};
const MATS={};
function std(c,metal=.3,rough=.5,extra){const k=c+metal+rough+(extra?JSON.stringify(extra):'');if(MATS[k])return MATS[k];
 const m=new T3.MeshStandardMaterial({color:col(c),metalness:metal,roughness:rough});if(extra){if(extra.em){m.emissive=col(extra.em);m.emissiveIntensity=extra.ei||1;}if(extra.flat)m.flatShading=true;if(extra.op!==undefined){m.transparent=true;m.opacity=extra.op;m.depthWrite=false;}if(extra.vc)m.vertexColors=true;}
 return MATS[k]=m;}
function basic(c,o={}){const k='b'+c+JSON.stringify(o);if(MATS[k])return MATS[k];const m=new T3.MeshBasicMaterial(Object.assign({color:col(c)},o));return MATS[k]=m;}
let glassMat;
function init3D(){
 renderer=new T3.WebGLRenderer({canvas:$('gl'),antialias:true,powerPreference:'high-performance'});
 renderer.outputEncoding=T3.sRGBEncoding;renderer.toneMapping=T3.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T3.PCFSoftShadowMap;
 scene=new T3.Scene();camera=new T3.PerspectiveCamera(40,.5,2,2400);
 hemi=new T3.HemisphereLight(0xffffff,0x444444,.6);scene.add(hemi);
 sun=new T3.DirectionalLight(0xffffff,2);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
 const sc=sun.shadow.camera;sc.left=-60;sc.right=60;sc.top=110;sc.bottom=-110;sc.near=1;sc.far=500;sun.shadow.bias=-.0008;sun.shadow.normalBias=.04;scene.add(sun);scene.add(sun.target);fill=new T3.DirectionalLight(0xfff4e6,0);scene.add(fill);scene.add(fill.target);
 skyMat=new T3.ShaderMaterial({side:T3.BackSide,depthWrite:false,uniforms:{top:{value:new T3.Color()},hor:{value:new T3.Color()},bot:{value:new T3.Color()},sunDir:{value:new T3.Vector3(0,1,0)},sunCol:{value:new T3.Color()}},
  vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 top,hor,bot,sunCol;uniform vec3 sunDir;varying vec3 vD;void main(){vec3 d=normalize(vD);float h=d.y;vec3 c=h>0.?mix(hor,top,pow(clamp(h,0.,1.),.5)):mix(hor,bot,clamp(-h*4.,0.,1.));float s=max(dot(d,normalize(sunDir)),0.);c+=sunCol*(pow(s,400.)*3.+pow(s,10.)*.35+pow(s,2.)*.08);gl_FragColor=vec4(c,1.);}'});
 sky=new T3.Mesh(new T3.SphereGeometry(1800,32,16),skyMat);sky.frustumCulled=false;sky.renderOrder=-1;scene.add(sky);
 scene.fog=new T3.Fog(0xffffff,200,700);
 glassMat=new T3.MeshStandardMaterial({color:col('#0d2236'),metalness:.9,roughness:.06,emissive:col('#06223a'),emissiveIntensity:.6});
 scene.add(TER.g);
 for(let i=0;i<3;i++){const l=new T3.PointLight(0xff9a40,0,60,2);scene.add(l);FXL.push(l);}
}
// sky reflections: a small cube map painted from the stage's sky colours (no float textures needed)
function envCube(B,sd){const N=64,faces=[];const dirs=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
 for(let f=0;f<6;f++){const c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d');
  if(f===2){g.fillStyle=B.sky[0];g.fillRect(0,0,N,N);}else if(f===3){g.fillStyle=B.hemi[1];g.fillRect(0,0,N,N);}
  else{const gr=g.createLinearGradient(0,0,0,N);gr.addColorStop(0,B.sky[0]);gr.addColorStop(.48,B.sky[1]);gr.addColorStop(.55,B.fog);gr.addColorStop(1,B.hemi[1]);g.fillStyle=gr;g.fillRect(0,0,N,N);}
  const d=dirs[f],dot=d[0]*sd.x+d[1]*sd.y+d[2]*sd.z;if(dot>.3){const gr=g.createRadialGradient(N/2,N*(f===2?.5:.4),0,N/2,N*(f===2?.5:.4),N*.5*dot);gr.addColorStop(0,'rgba(255,250,235,.95)');gr.addColorStop(1,'rgba(255,240,210,0)');g.fillStyle=gr;g.fillRect(0,0,N,N);}
  faces.push(c);}
 const t=new T3.CubeTexture(faces);t.encoding=T3.sRGBEncoding;t.needsUpdate=true;return t;}
function fitCamera(aspect){camera.fov=40;camera.aspect=aspect;camera.updateProjectionMatrix();
 const tilt=30*Math.PI/180;camera.position.set(0,Math.cos(tilt),Math.sin(tilt));camera.lookAt(0,0,0);camera.updateMatrixWorld();
 const v=new T3.Vector3();const hit=(nx,ny)=>{v.set(nx,ny,.5).unproject(camera).sub(camera.position).normalize();const t=-camera.position.y/v.y;return camera.position.clone().addScaledVector(v,t);};
 const bl=hit(-1,-1),tp=hit(0,1),bt=hit(0,-1),s=(W*K)/(2*Math.abs(bl.x));
 H=Math.round(clamp((bt.z-tp.z)*s/K,600,1300));
 camera.position.multiplyScalar(s);camera.lookAt(0,0,0);camera.updateMatrixWorld();
 C3.Zt=tp.z*s;C3.Zb=bt.z*s;KZ=(C3.Zb-C3.Zt)/H;C3.y=camera.position.y;C3.z=camera.position.z;C3.t=(C3.y-GY)/C3.y;C3.v=SCROLL*KZ*C3.t;
 updProj();const P0=pj(W/2,H);C3.wb=P0.w;
 C3.ly=[];for(let i=0;i<=100;i++){let lo=-300,hi=H+300;for(let k=0;k<30;k++){const m=(lo+hi)/2;pj(W/2,m);if(PY<i/100*OH)lo=m;else hi=m;}C3.ly.push((lo+hi)/2);}}
const lyAt=f=>C3.ly[clamp(Math.round(f*100),0,100)];
let PX=0,PY=0,PS=1;
function updProj(){camera.updateMatrixWorld();PM.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);PE=PM.elements;}
function pj(x,y){const X=(x-W/2)*K,Z=C3.Zt+y*KZ,e=PE,w=e[3]*X+e[11]*Z+e[15];PX=((e[0]*X+e[8]*Z+e[12])/w*.5+.5)*OW;PY=(.5-(e[1]*X+e[9]*Z+e[13])/w*.5)*OH;PS=(C3.wb||w)/w;return{w};}
const yawFrom=a=>Math.atan2(-Math.cos(a),-Math.sin(a));
let gz3=0; // terrain scroll (world units)
function place(m,x,y,ground,lift=0){const X=(x-W/2)*K,Z=C3.Zt+y*KZ;
 if(!ground){m.position.set(X,lift,Z);m.scale.setScalar(1);return;}
 const cy=C3.y,cz=C3.z;let t=C3.t,gx=t*X,gzz=cz+t*(Z-cz);
 const h=Math.max(LV.HF?LV.HF(gx,gzz-gz3):0,LV.wl);const Yl=GY+h;t=(cy-Yl)/cy;
 m.position.set(t*X,Yl,cz+t*(Z-cz));m.scale.setScalar(t);}

// ---------- noise ----------
const NZ2=(()=>{const p=new Uint8Array(512);function seed(s){const R=srng(s*9973+11),a=[];for(let i=0;i<256;i++)a.push(i);for(let i=255;i>0;i--){const j=Math.floor(R()*(i+1));const t=a[i];a[i]=a[j];a[j]=t;}for(let i=0;i<512;i++)p[i]=a[i&255];}
 const gr=[[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]],F=.5*(Math.sqrt(3)-1),Gc=(3-Math.sqrt(3))/6;
 function n2(x,y){const s=(x+y)*F,i=Math.floor(x+s),j=Math.floor(y+s),t=(i+j)*Gc,x0=x-(i-t),y0=y-(j-t),i1=x0>y0?1:0,j1=1-i1,x1=x0-i1+Gc,y1=y0-j1+Gc,x2=x0-1+2*Gc,y2=y0-1+2*Gc,ii=i&255,jj=j&255;let n=0;
  let t0=.5-x0*x0-y0*y0;if(t0>0){const q=gr[p[ii+p[jj]]&7];t0*=t0;n+=t0*t0*(q[0]*x0+q[1]*y0);}
  let t1=.5-x1*x1-y1*y1;if(t1>0){const q=gr[p[ii+i1+p[jj+j1]]&7];t1*=t1;n+=t1*t1*(q[0]*x1+q[1]*y1);}
  let t2=.5-x2*x2-y2*y2;if(t2>0){const q=gr[p[ii+1+p[jj+1]]&7];t2*=t2;n+=t2*t2*(q[0]*x2+q[1]*y2);}
  return 70*n;}
 seed(1);return{seed,n2};})();
const n2=NZ2.n2;
function fbm(x,y,o=4){let a=0,f=1,amp=.5;for(let i=0;i<o;i++){a+=amp*n2(x*f,y*f);f*=2.03;amp*=.5;}return a;}
function ridge(x,y,o=4){let a=0,f=1,amp=.5;for(let i=0;i<o;i++){a+=amp*(1-Math.abs(n2(x*f,y*f)));f*=2.1;amp*=.5;}return a;}
function mtn(x,z,hm,x0=34,x1=85){const a=Math.abs(x),m=sst(x0,x1,a);if(m<=0)return 0;return m*hm*(.35+.65*ridge(x*.017,z*.017,4))+m*m*hm*.3*fbm(x*.05+7,z*.05,2);}
const LC={};const lc=h=>LC[h]||(LC[h]=(()=>{const c=col(h);return[c.r,c.g,c.b];})());
function mixc(o,a,b,t){o[0]=a[0]+(b[0]-a[0])*t;o[1]=a[1]+(b[1]-a[1])*t;o[2]=a[2]+(b[2]-a[2])*t;}
const hash2=(a,b)=>{let h=(a*374761393+b*668265263)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296;};
// generic terrain colouring
function paint(o,x,z,h,sl,P){const n=n2(x*.15,z*.15)*.5+n2(x*.6,z*.6)*.25;
 mixc(o,lc(P.low),lc(P.mid),sst(P.m0,P.m1,h+n*1.5));
 if(P.high){const t=sst(P.h0,P.h1,h+n*2);if(t>0)mixc(o,o,lc(P.high),t);}
 const r=sst(.55,1.15,sl+n*.2);if(r>0)mixc(o,o,lc(P.rock),r*.9);
 if(P.snow){const t=sst(P.snow,P.snow+3,h+n*3)*(1-sst(1,1.6,sl));if(t>0)mixc(o,o,lc('#f2f6fa'),t);}
 if(P.sand!==undefined){const t=1-sst(P.wl+.25,P.wl+1.1,h+n*.4);if(t>0)mixc(o,o,lc(P.sandc||'#d9c79a'),t);if(h<P.wl-.2)mixc(o,o,lc(P.deep||'#5a6b62'),sst(P.wl-.2,P.wl-4,h));}
 const v=1+n*.16;o[0]*=v;o[1]*=v;o[2]*=v;}

// ---------- biomes ----------
const BIOME={
 harbor:{sky:['#4f8fd0','#ffcf9e','#c79c7a'],fog:'#f2c9a2',fogN:.9,sun:['#ffd2a0',2.4],sunDir:[-.45,.5,-.75],hemi:['#bcd5ff','#6b5a40',.55],exp:1.05,water:{c:'#1d6e95',op:.9},wl:0,clouds:5,
  HF(x,z){const c=-9+2.5*Math.sin(z*.012)+1.2*Math.sin(z*.041),d=c-x;let h=d>0?.8+Math.min(2.2,d*.22)+fbm(x*.06,z*.06,3)*.7:-.6-Math.min(6,-d*.16);
   if(x<-30)h+=mtn(x,z,30);if(x>48)h=Math.max(h,mtn(x,z,22,48,95)-4);return h;},
  P:{low:'#5f8f48',mid:'#6f9a52',m0:1,m1:4,high:'#6b6b5a',h0:8,h1:16,rock:'#7a6e60',snow:24,sand:1,wl:.6,sandc:'#e0cf9f',deep:'#2a5560'},uses:['canopy','boulder','boulder2','kk_building_A','kk_building_E'],
  props(R,z0,put,HF){for(let z=z0-2;z>z0-TL;z-=4.4+R()*1.6){const x=-15-R()*6;if(HF(x,z)>.6){if(R()<.45)put(pick(['kk_building_A','kk_building_E']),x,z,2.4+R()*.5,Math.floor(R()*4)*Math.PI/2,null);else put(R()<.75?'house':'ware',x,z,1+R()*.4,R()*.4-.2,pick(['#f2e6d0','#e8d8c0','#dfe6ea','#f4d6b8']),1,0);}}
   for(let i=0;i<120;i++){const x=-24-R()*70,z=z0-R()*TL,h=HF(x,z);if(h>.9&&h<14)put('canopy',x,z,5.5+R()*4,R()*TAU,pick(['#e0ead6','#d6e2cc','#eef2e2']));}
   for(let i=0;i<3;i++){const z=z0-10-R()*(TL-20),c=-9+2.5*Math.sin(z*.012)+1.2*Math.sin(z*.041);put('pier',c+3,z,1,0,'#7b6248',1,0,[7,1,1]);}
   for(let i=0;i<30;i++){const x=48+R()*50,z=z0-R()*TL;if(HF(x,z)>1)put(R()<.5?'boulder':'boulder2',x,z,1.4+R()*2.4,R()*TAU,'#e8e0d4',.8,-.3);}}},
 farm:{sky:['#4a90e2','#cfe3f5','#a8b890'],fog:'#d6e4ee',fogN:1,sun:['#fff1d6',2.6],sunDir:[-.35,.8,-.4],hemi:['#cfe3ff','#5a6a3a',.55],exp:1,wl:-60,clouds:6,
  HF(x,z){let h=.6+fbm(x*.025,z*.025,3)*1.6+mtn(x,z,20,30,90)*.8;const r=Math.abs(x-4);if(r<4)h=lerp(.6,h,sst(1.6,4,r));return h;},
  P:{low:'#6f9a45',mid:'#7fa04a',m0:2,m1:6,high:'#5c7a40',h0:8,h1:14,rock:'#7d7466'},
  uses:['kk_watertower','kk_car_sedan','kk_car_hatchback'],
  cf(o,x,z,h,sl){const fx=Math.floor((x+600)/7),fzz=Math.floor((z+9000)/9),u=hash2(fx,fzz),crops=['#c9b458','#9bb55a','#6f9a45','#d8c27a','#8a6e45','#5f8a3a','#b9a24c','#a5c06a'];
   if(h<4.5&&Math.abs(x)<60){mixc(o,lc(crops[Math.floor(u*crops.length)]),lc(crops[Math.floor(u*crops.length)]),0);const ex=((x+600)/7)%1,ez=((z+9000)/9)%1;if(ex<.07||ez<.06)mixc(o,o,lc('#3e6a30'),.7);}
   const r=Math.abs(x-4);if(r<2.2)mixc(o,o,lc('#45433f'),1);else if(r<3.2)mixc(o,o,lc('#8a8270'),.7);},
  props(R,z0,put,HF){for(let i=0;i<180;i++){const fx=Math.floor((R()*120-60+600)/7),zz=z0-R()*TL;const x=fx*7-600+(R()<.5?0:R()*7);if(Math.abs(x-4)<3)continue;put('round',x,zz,.6+R()*.5,R()*6,pick(['#3e7a34','#4d8a3c','#56913f']));}
   for(let k=0;k<3;k++){const z=z0-8-R()*(TL-16),sd=R()<.5?-1:1,x=4+sd*(7+R()*6);put('house',x,z,1.2,0,'#efe6d6');put('barn',x+sd*3.5,z-3,1.3,Math.PI/2,null);put('silo',x-sd*3,z+2,1,0,null);if(R()<.5)put('kk_watertower',x+sd*1,z+6,2.6,R()*6,null);for(let j=0;j<5;j++)put('round',x+rnd(-7,7),z+rnd(-7,7),.7,R()*6,'#3e7a34');}
   for(let i=0;i<120;i++){const x=(R()<.5?-1:1)*(35+R()*55),z=z0-R()*TL,h=HF(x,z);if(h>4&&h<16)put('pine',x,z,.9+R()*.5,R()*6,'#2f5a2b');}
   for(let i=0;i<3;i++){const d=R()<.5?1:-1;put(pick(['kk_car_sedan','kk_car_hatchback']),4+d*1,z0-R()*TL,1.5,d>0?0:Math.PI,null);}}},
 desert:{sky:['#5a8fd0','#f3cf9a','#e0a868'],fog:'#e9b77c',fogN:1.15,sun:['#ffe2b0',2.5],sunDir:[-.62,.42,-.42],hemi:['#cfdcf0','#9a5a24',.42],exp:.86,wl:-60,clouds:1,ground:'sand',
  // Sahara-style sea of dunes: long crescent ridges with a gentle windward rise and a steep slip face, smaller dunes on top
  HF(x,z){const w=fbm(x*.018,z*.018,2);
   const u=(x*.55+z*.84)/44+w*1.3,f=u-Math.floor(u),p1=f<.66?sst(0,1,f/.66):1-sst(0,1,(f-.66)/.34);
   let h=p1*(6+3.5*fbm(x*.011+5,z*.011,2));
   const u2=(x*.92-z*.38)/21+fbm(x*.03,z*.03,2)*1.1;h+=(Math.sin(u2*TAU)*.5+.5)*.9;
   h+=fbm(x*.06,z*.06,2)*.3+mtn(x,z,20,46,95)*.55;
   const r=Math.abs(x+6);if(r<6)h=lerp(.35,h,sst(3.4,6,r));return h;},
  P:{low:'#cf8a46',mid:'#e2a35a',m0:.6,m1:3,high:'#e9ad66',h0:5,h1:9,rock:'#b8703a'},
  cf(o,x,z,h,sl,gx,gz){   // gx,gz: height slope along x and z (from the tile grid)
   const nl=Math.hypot(gx,1,gz),lit=clamp(((-gx)*-.62+.42+(-gz)*-.42)/nl/.8,0,1.3);   // sun-facing sand is bright, slip faces fall into shadow
   // tint over the HD sand texture (art/tex_sand.jpg): slip faces darken and redden, crests catch the light
   const sh=Math.min(1,lit),v=.55+.5*sh;o[0]=v*(1.02-.06*(1-sh));o[1]=v*(.97-.1*(1-sh));o[2]=v*(.93-.14*(1-sh));if(lit>1){const k=(lit-1)*.6;o[0]+=k;o[1]+=k*.9;o[2]+=k*.7;}
   const r=Math.abs(x+6),grit=.85+.15*fbm(x*.4,z*.4,2);const drift=sst(.1,.45,fbm(x*.15+3,z*.06,2));if(r<3.2)mixc(o,[.07*grit,.065*grit,.06*grit],o,drift*.85);else if(r<4.4)mixc(o,o,[.5,.46,.42],.35);},   // sand-dusted highway
  uses:['palm','shrub','acacia','tent','whouse','wall','shrine','derrick','tankf','rock'],
  props(R,z0,put,HF){const off=(x,w=6)=>Math.abs(x+6)<w;
   for(let i=0;i<150;i++){const x=R()*150-75,z=z0-R()*TL;if(off(x,5))continue;put('shrub',x,z,.7+R()*.7,R()*6,pick(['#6a6438','#7a7044','#5c5a34','#857a4c']));}
   for(let i=0;i<8;i++){const x=R()*140-70,z=z0-R()*TL;if(off(x,7))continue;put('acacia',x,z,1+R()*.5,R()*6,'#4e6a2e');}
   // oasis camp: palm grove, bushes and dark woven tents
   if(R()<.55){const sd=R()<.5?-1:1,ox=-6+sd*(16+R()*22),oz=z0-14-R()*(TL-28);
    for(let k=0;k<9;k++){const a=R()*TAU,d=2+R()*8;put('palm',ox+Math.cos(a)*d,oz+Math.sin(a)*d,.9+R()*.5,R()*6,pick(['#3f7a32','#4a8a3a','#376a2c']));}
    for(let k=0;k<8;k++){const a=R()*TAU,d=3+R()*9;put('shrub',ox+Math.cos(a)*d,oz+Math.sin(a)*d,.8+R()*.6,R()*6,'#4f6e30');}
    const tx=ox+sd*7,tz=oz+6;for(let k=0;k<4+Math.floor(R()*3);k++)put('tent',tx+(k%3)*3.2*sd,tz+Math.floor(k/3)*3.4,1+R()*.2,R()*.3,pick(['#3a2a22','#4a3428','#2e2420']));
    put('wall',tx+sd*3,tz+5,1,0,'#c9a27a',1,0,[8,.5,.2]);}
   // half-buried abandoned village: white flat-roof houses and walls swallowed by dunes
   if(R()<.45){const sd=R()<.5?-1:1,vx=-6+sd*(14+R()*20),vz=z0-12-R()*(TL-30);
    for(let k=0;k<7+Math.floor(R()*5);k++){const x=vx+R()*22-11,z=vz+R()*22-11;if(off(x,5))continue;const ry=Math.floor(R()*4)*Math.PI/2+R()*.2;
     put('whouse',x,z,1,ry,pick(['#f2ede4','#ebe4d8','#f6f2ea','#e2d9ca']),1,-.3-R()*.9,[2.6+R()*1.6,1.6,2.2+R()*1.4]);
     if(R()<.5)put('wall',x+R()*4-2,z+2.5,1,ry,'#efe8dc',1,-.2-R()*.4,[4+R()*3,.55,.18]);}
    if(R()<.5)put('shrine',vx+R()*8-4,vz+R()*8-4,1.1,R()*6,'#f4efe6',1,-.3);
    for(let k=0;k<4;k++)put('acacia',vx+R()*26-13,vz+R()*26-13,1+R()*.4,R()*6,'#4e6a2e');}
   if(R()<.3){const x=(R()<.5?-1:1)*(22+R()*16),z=z0-R()*TL;put('derrick',x,z,1.1,R()*3,null);put('tankf',x+4,z+2,1,0,'#e8e8e8');}
   for(let i=0;i<10;i++){const x=R()*150-75,z=z0-R()*TL;if(off(x,6))continue;put('rock',x,z,.35+R()*.5,R()*6,pick(['#9a6a44','#8a5e3c','#a47450']));}}},
 forest:{sky:['#5d93cf','#e3ecef','#86a07e'],fog:'#bfcfc8',fogN:.8,sun:['#ffecc8',2.9],sunDir:[-.5,.62,-.48],hemi:['#cfdcef','#3a4228',.55],exp:.95,water:{c:'#2c5a52',op:.92},wl:-.8,clouds:5,pbr:1,
  // Jungle Ridge (Phase 1 realistic terrain, js/terrain_pbr.js): grassy river valley between rocky uplands that break into
  // terraced ledges and steep, irregular cliff faces; textured soil/grass/rock/moss/gravel chosen by slope, height and noise
  HF(x,z){const rx=7+7*Math.sin(z*.011)+2*Math.sin(z*.037),bank=Math.abs(x-rx);
   let h=1.2+fbm(x*.03,z*.03,4)*2.4+mtn(x,z,38,30,85);
   const m=sst(.02,.3,fbm(x*.016+11,z*.016-3,3)+.12)*sst(7,15,bank);            // where the rocky uplands rise
   if(m>0){const up=m*(5+8*ridge(x*.021+3,z*.021,3)),tw=up+fbm(x*.045+5,z*.045,2)*1.7,st=2.5,k=Math.floor(tw/st),f=tw/st-k;
    h+=(k+sst(.55,.95,f))*st*.9+up*.1+(ridge(x*.05,z*.05,2)-.55)*.9*m;}         // flat ledges, steep risers, broken edges (detail kept above the 2-unit mesh spacing)
   h-=3.4*Math.exp(-(((x-rx)/3.2)**2));return h;},
  P:{low:'#2f5a2b',mid:'#3d6b33',m0:2,m1:6,high:'#5a6a50',h0:12,h1:20,rock:'#6e6a64',snow:99,sand:1,wl:-.3,sandc:'#8a7a5a',deep:'#2a4a40'},
  // material layers per vertex: o = [soil, rock, moss, gravel]; grass fills the rest
  splat(o,x,z,h,sl,under){const rx=7+7*Math.sin(z*.011)+2*Math.sin(z*.037),bank=Math.abs(x-rx),nz=fbm(x*.09+2,z*.09,2);
   let rock=sst(.32,.62,sl),soil=(1-sst(3,6,bank))*.85+sst(.15,.5,nz)*.35*(1-rock),moss=sst(.14,.32,sl)*(1-rock)*.8+sst(1.5,4,under)*.3,grav=sst(1.2,3.5,under)*sst(.05,.3,sl)*.7;
   if(bank<3.6){grav=Math.max(grav,(1-sst(2.2,3.6,bank))*.7);soil*=.6;}
   const tot=rock+soil+moss+grav;if(tot>1){rock/=tot;soil/=tot;moss/=tot;grav/=tot;}o[0]=soil;o[1]=rock;o[2]=moss;o[3]=grav;},
  wet(x,z,h){const rx=7+7*Math.sin(z*.011)+2*Math.sin(z*.037);return 1-sst(2.5,6,Math.abs(x-rx));},
  occ:{canopy:[.42,.5],canopy2:[.42,.5],canopy3:[.44,.55],palmS:[.28,.35],boulder:[1,.55],boulder2:[1,.55],stone:[.6,.45]},   // contact shadow radius factor, strength
  uses:['boulder','boulder2','stone','palmS','canopy','canopy2','canopy3','fern'],
  props(R,z0,put,HF){const RX=z=>7+7*Math.sin(z*.011)+2*Math.sin(z*.037),SL=(x,z)=>Math.hypot(HF(x+1,z)-HF(x-1,z),HF(x,z+1)-HF(x,z-1))/2;
   // broadleaf canopy, dense on gentle ground, never on cliff faces
   for(let i=0;i<250;i++){const x=R()*170-85,z=z0-R()*TL,h=HF(x,z);if(h<.6||Math.abs(x-RX(z))<5.5||SL(x,z)>.45)continue;const v=R(),big=v>.82;put(v<.5?'canopy':big?'canopy3':'canopy2',x,z,(big?8:6)+R()*4.5,R()*TAU,pick(['#e8f0e0','#dce8d2','#f2f4e6','#d4e0c8']));}
   for(let i=0;i<28;i++){const z=z0-R()*TL,sd=R()<.5?-1:1,x=RX(z)+sd*(4.5+R()*12),h=HF(x,z);if(h<.2||SL(x,z)>.4)continue;put('palmS',x,z,5.5+R()*2.5,R()*TAU,pick(['#7c8c66','#748660','#869472']));}
   for(let i=0;i<240;i++){const x=R()*150-75,z=z0-R()*TL,h=HF(x,z);if(h<.1||Math.abs(x-RX(z))<4||SL(x,z)>.5)continue;put('fern',x,z,1.6+R()*1.6,R()*TAU,pick(['#86a070','#7a9466','#90a87a']));}
   // river-bank stones
   for(let i=0;i<36;i++){const z=z0-R()*TL,sd=R()<.5?-1:1,x=RX(z)+sd*(3+R()*3);put(R()<.5?'boulder':'boulder2',x,z,.6+R()*1.3,R()*TAU,pick(['#e6e0d4','#d6d0c4','#c8c2b6']),.75+R()*.4,-.2);}
   // talus: fallen blocks at the foot of cliffs
   for(let i=0;i<150;i++){const x=R()*150-75,z=z0-R()*TL,s=SL(x,z);if(s<.12||s>.42)continue;const up=Math.max(HF(x+3,z),HF(x-3,z),HF(x,z+3),HF(x,z-3))-HF(x,z);if(up<2.2)continue;
    put(R()<.5?'boulder':'boulder2',x,z,.7+R()*1.8,R()*TAU,pick(['#e8e2d6','#dcd6ca','#cfc8ba']),.7+R()*.5,-.25);}
   // overgrown ruins: broken mossy stone walls
   if(R()<.45){const wx=RX(z0-TL/2)+(R()<.5?-1:1)*(14+R()*14),wz=z0-15-R()*(TL-30),ry=R()*Math.PI;
    for(let i=0;i<9;i++){if(R()<.25)continue;const d=(i-4)*2.1;put('stone',wx+Math.cos(ry)*d,wz+Math.sin(ry)*d,1,ry+R()*.15,pick(['#e8e4da','#d8d4c8']),1,-.3,[2,.8+R()*1.6,1.1]);}
    for(let i=0;i<6;i++){const d=(i-2.5)*2.1;put('stone',wx+Math.cos(ry+1.57)*d-Math.sin(ry)*5,wz+Math.sin(ry+1.57)*d+Math.cos(ry)*5,1,ry+1.57,'#dcd8cc',1,-.3,[2,.6+R()*1.2,1.1]);}}}},
 port:{sky:['#6b7f96','#c3ccd4','#5a6068'],fog:'#aab4bd',fogN:.7,sun:['#e9eef5',1.7],sunDir:[-.35,.8,-.45],hemi:['#c8d2dc','#3a3f45',.75],exp:1.05,water:{c:'#2a4a5a',op:.93},wl:0,clouds:8,
  HF(x,z){const q=10+.8*Math.sin(z*.02);let h=x<q?.8:-5;if(x<-30)h+=mtn(x,z,24);if(x>55)h=Math.max(h,mtn(x,z,18,55,95)-4);return h;},
  P:{low:'#7d8287',mid:'#7d8287',m0:3,m1:6,high:'#6a6e66',h0:6,h1:12,rock:'#6c6a66',sand:1,wl:.4,sandc:'#7d8287',deep:'#203038'},
  uses:['kk_building_A','kk_building_C','kk_building_E','kk_building_G','kk_car_sedan','kk_car_taxi','kk_car_hatchback'],
  cf(o,x,z,h,sl){if(h<1.2&&h>.5){const q=10+.8*Math.sin(z*.02);if(Math.abs(x-q)<1.6)mixc(o,o,lc('#c8b040'),.8);}},
  props(R,z0,put,HF){const cs=['#c0392b','#2e86c1','#27ae60','#f39c12','#8e44ad','#d35400','#16a085','#7f8c8d','#e6e6e6'];
   for(let z=z0-1.5;z>z0-TL;z-=3.4){if(R()<.12){put('ware',-12,z-3,1,0,'#9aa3aa',1,0,[22,3.5,6]);z-=6;continue;}for(let x=-23;x<6;x+=2.8){if(R()<.15)continue;const n=1+Math.floor(R()*3);for(let k=0;k<n;k++)put('cont',x,z,1,Math.PI/2,pick(cs),1,k*1.05);}}
   for(let z=z0-6;z>z0-TL;z-=14+R()*6){const q=10+.8*Math.sin(z*.02);put('crane',q-2,z,1,0,null);}
   for(let i=0;i<20;i++){const x=-40-R()*40,z=z0-R()*TL,h=HF(x,z);if(h>2)put('pine',x,z,1,R()*6,'#3a5a3a');}
   for(let z=z0-3;z>z0-TL;z-=7+R()*5)put(pick(['kk_building_A','kk_building_C','kk_building_E','kk_building_G']),-29+R()*2,z,4.6+R()*1.2,Math.floor(R()*4)*Math.PI/2,null);
   for(let i=0;i<4;i++){const z=z0-R()*TL,q=10+.8*Math.sin(z*.02);put(pick(['kk_car_sedan','kk_car_taxi','kk_car_hatchback']),q-3.5,z,1.5,R()<.5?0:Math.PI,null);}}},
 islands:{sky:['#2f8ee0','#d8f0ff','#6fc0d0'],fog:'#cdeefa',fogN:1,sun:['#fff6e0',2.8],sunDir:[-.3,.85,-.3],hemi:['#d0ecff','#3a8a90',.65],exp:1,water:{c:'#11849e',op:.78},wl:0,clouds:6,uses:['palmS','fern','boulder','boulder2'],
  HF(x,z){const n=fbm(x*.022+3,z*.022,4);let h=(n-.16)*22+sst(35,95,Math.abs(x))*16*(.4+n);return Math.max(-7,Math.min(h,26));},
  P:{low:'#e8d9a6',mid:'#4f9a4a',m0:.8,m1:2,high:'#2e6a30',h0:4,h1:9,rock:'#7a7060',sand:1,wl:.2,sandc:'#f0e2b0',deep:'#d8cfa0'},
  props(R,z0,put,HF){for(let i=0;i<200;i++){const x=R()*180-90,z=z0-R()*TL,h=HF(x,z);if(h>.5&&h<9)put('palmS',x,z,5.5+R()*3,R()*TAU,pick(['#a0b880','#90ac74','#acc28a']));}
   for(let i=0;i<120;i++){const x=R()*180-90,z=z0-R()*TL,h=HF(x,z);if(h>1.5&&h<12)put('fern',x,z,1.6+R()*1.4,R()*TAU,'#90b078');}
   for(let i=0;i<14;i++){const x=R()*180-90,z=z0-R()*TL,h=HF(x,z);if(h>-.5&&h<1.5)put(R()<.5?'boulder':'boulder2',x,z,1+R()*1.8,R()*TAU,'#ece4d4',.7,-.3);}
   for(let i=0;i<10;i++){const x=R()*120-60,z=z0-R()*TL,h=HF(x,z);if(h>.4&&h<2)put('house',x,z,.8,R()*6,'#c9a46a');}}},
 canyon:{sky:['#4a86d0','#f4d4b0','#b06a48'],fog:'#e8c0a0',fogN:.9,sun:['#ffe0b8',2.8],sunDir:[-.5,.7,-.4],hemi:['#d8e2ff','#8a4a30',.55],exp:1,water:{c:'#3a7f88',op:.9},wl:-.8,clouds:3,uses:['boulder','boulder2','canopy'],
  HF(x,z){const rv=2+6*Math.sin(z*.009),d=Math.abs(x-rv);let p=sst(10,24,d+fbm(x*.05,z*.05,2)*4)*20+fbm(x*.03,z*.03,3)*2;p=Math.floor(p/3)*3+(p%3)*.3;let h=.6+p+mtn(x,z,14,50,95);h-=2.6*Math.exp(-((d/2.8)**2));return h;},
  P:{low:'#c98a5a',mid:'#b4653f',m0:1,m1:4,high:'#d98d5f',h0:10,h1:16,rock:'#8d4630',sand:1,wl:-.2,sandc:'#a8704a',deep:'#5a3a2a'},
  cf(o,x,z,h,sl){if(h>2){const b=Math.floor(h/3)%4;mixc(o,o,lc(['#a95a3b','#c4714a','#8d4630','#d98d5f'][b]),.7);}},
  props(R,z0,put,HF){for(let i=0;i<70;i++){const x=R()*140-70,z=z0-R()*TL,h=HF(x,z);if(h>-.2){if(R()<.6)put(R()<.5?'boulder':'boulder2',x,z,1+R()*2,R()*TAU,pick(['#d88a60','#c47a52','#e09a70']),.8,-.3);else put('canopy',x,z,3.5+R()*2.5,R()*TAU,'#d8d4b0');}}}},
 arctic:{sky:['#7aa8d8','#eaf2fa','#c8d8e6'],fog:'#e2ecf4',fogN:.75,sun:['#fff8ee',2.4],sunDir:[-.4,.6,-.6],hemi:['#e6f0ff','#8aa0b8',.8],exp:.95,water:{c:'#1b3e56',op:.95},wl:0,clouds:6,
  HF(x,z){const ic=14+3*Math.sin(z*.013);let h;if(x<ic)h=.6+fbm(x*.03,z*.03,3)*1.2+(x<0?mtn(x,z,34,28,85):0);else{h=-3;if(fbm(x*.07,z*.07,2)>.18)h=.15;}if(x>60)h=Math.max(h,mtn(x,z,18,60,95)-3);return h;},
  P:{low:'#e8f0f6',mid:'#f4f8fb',m0:1,m1:4,high:'#dfe8ef',h0:6,h1:12,rock:'#5a6470',snow:10,sand:1,wl:.05,sandc:'#cfe6f0',deep:'#1a3040'},
  props(R,z0,put,HF){if(R()<.9){const z=z0-20-R()*(TL-40),x=-6+R()*8;put('hut',x,z,1,0,null);put('hut',x+5,z-4,1,0,null);put('radar',x-5,z+3,1,0,null);put('tankf',x+3,z+6,1,0,'#f4f4f4');put('tankf',x+6,z+6,1,0,'#f4f4f4');}
   for(let i=0;i<160;i++){const x=-26-R()*60,z=z0-R()*TL,h=HF(x,z);if(h>.6&&h<12)put('pine',x,z,.8+R()*.5,R()*6,'#c2d0c8');}
   for(let i=0;i<25;i++){const x=R()*110-55,z=z0-R()*TL,h=HF(x,z);if(h>.3)put('rock',x,z,.7+R()*1.2,R()*6,'#6a7480');}}},
 city:{sky:['#05070f','#1a2440','#0a0c14'],fog:'#121a2c',fogN:.8,sun:['#9fb4ff',.7],sunDir:[-.3,.8,-.5],hemi:['#3a4a7a','#151020',.55],exp:1.25,wl:-60,clouds:3,night:1,
  HF(x,z){let h=.3;if(Math.abs(x)>45)h+=mtn(x,z,18,45,90)*.7;return h;},
  P:{low:'#25262b',mid:'#2a2b30',m0:2,m1:5,high:'#1a1c22',h0:6,h1:12,rock:'#2a2a2e'},
  uses:['kk_building_A','kk_building_C','kk_building_E','kk_building_G','kk_car_sedan','kk_car_taxi','kk_car_hatchback'],
  cf(o,x,z,h,sl){const rx=((x+30)%16+16)%16,rz=((z+9000)%18+18)%18;if(rx<3.2||rz<3.2)mixc(o,o,lc('#4a4232'),1);},
  props(R,z0,put,HF){const bz=Math.ceil((z0+9000)/18)*18-9000;for(let bzz=bz;bzz>z0-TL-18;bzz-=18)for(let bx=-46;bx<46;bx+=16){const x0=bx+3.4,z1=bzz-.3;if(R()<.1){for(let k=0;k<5;k++)put('round',x0+R()*11,z1-R()*12,.7,R()*6,'#2c5a33');continue;}
    for(let ix=0;ix<2;ix++)for(let iz=0;iz<2;iz++){const w=5+R()*.8,d=6+R()*.8,x=x0+ix*6.2+w/2,z=z1-iz*7-d/2;if(z>z0||z<z0-TL)continue;const hh=(2+R()*R()*16)*(Math.abs(x)<26?1:1.3);if(hh<7&&Math.abs(x)<42&&R()<(save.hq?.45:.2)){put(pick(['kk_building_A','kk_building_C','kk_building_E','kk_building_G']),x,z,Math.min(w,d),Math.floor(R()*4)*Math.PI/2,null);continue;}put('build',x,z,1,0,pick(['#8a93a8','#a8a29a','#7d8696','#b8b4ac','#6e7a8e']),1,0,[w,hh,d]);}}
   for(let i=0;i<10;i++){const car=pick(['kk_car_sedan','kk_car_taxi','kk_car_hatchback']),d=R()<.5?1:-1;if(R()<.5){const x=-30+16*Math.floor(R()*6)+1.6+d*.8;put(car,x,z0-R()*TL,1.4,d>0?0:Math.PI,null);}else{const z=Math.ceil((z0+9000)/18)*18-9000-18*Math.floor(R()*6)+1.6+d*.8;if(z<=z0&&z>z0-TL)put(car,R()*90-45,z,1.4,d*Math.PI/2,null);}}
   for(let z=Math.ceil((z0+9000)/9)*9-9000;z>z0-TL;z-=9)for(const x of[-28,-12,4,20,36]){put('lamp',x+1.4,z,1,0,null,1,1.2);}}},
 volcano:{sky:['#2a0a08','#a0401a','#3a1a10'],fog:'#4a1c10',fogN:.75,sun:['#ff9a5a',1.8],sunDir:[-.4,.5,-.75],hemi:['#a05040','#200808',.6],exp:1.15,lava:1,wl:-.6,clouds:4,
  HF(x,z){const lr=-5+9*Math.sin(z*.01)+3*Math.sin(z*.033);let h=1+fbm(x*.04,z*.04,4)*2+mtn(x,z,40,30,85);h-=2.8*Math.exp(-(((x-lr)/2.8)**2));return h;},
  P:{low:'#2a2422',mid:'#352c29',m0:1,m1:4,high:'#4a3e3a',h0:8,h1:16,rock:'#1f1a19'},
  cf(o,x,z,h,sl){const lr=-5+9*Math.sin(z*.01)+3*Math.sin(z*.033),d=Math.abs(x-lr);if(d<5)mixc(o,o,lc('#c2400c'),(1-d/5)*.8*(1-sst(1,3,h)));},
  props(R,z0,put,HF){for(let i=0;i<120;i++){const x=R()*150-75,z=z0-R()*TL,h=HF(x,z);if(h<.3)continue;put(R()<.6?'rock':'spike',x,z,.7+R()*1.4,R()*6,R()<.5?'#2a2226':'#3a2e30');}
   if(R()<.8){const z=z0-R()*TL,x=(R()<.5?-1:1)*(14+R()*8);put('ruin',x,z,1,R(),'#3a302c',1,0,[6,3,1]);put('ruin',x+3,z-3,1,R(),'#3a302c',1,0,[1,4,6]);}}},
};
// biome-specific weather textures etc
const PROPS={},WIND={value:0};   // WIND: shared time uniform for foliage sway
function nonIdx(g){return g.index?g.toNonIndexed():g;}
function merge(parts){let n=0;const gs=parts.map(([g,c,m])=>{let q=nonIdx(g.clone());if(m)q.applyMatrix4(m);q.deleteAttribute('uv');n+=q.attributes.position.count;return[q,c];});
 const pos=new Float32Array(n*3),nor=new Float32Array(n*3),cl=new Float32Array(n*3);let o=0;
 for(const[q,c]of gs){const p=q.attributes.position.array;q.computeVertexNormals();const nn=q.attributes.normal.array;pos.set(p,o*3);nor.set(nn,o*3);const cc=lc(c);for(let i=0;i<q.attributes.position.count;i++){cl[(o+i)*3]=cc[0];cl[(o+i)*3+1]=cc[1];cl[(o+i)*3+2]=cc[2];}o+=q.attributes.position.count;}
 const g=new T3.BufferGeometry();g.setAttribute('position',new T3.BufferAttribute(pos,3));g.setAttribute('normal',new T3.BufferAttribute(nor,3));g.setAttribute('color',new T3.BufferAttribute(cl,3));return g;}
const MT=(x,y,z,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>new T3.Matrix4().compose(new T3.Vector3(x,y,z),new T3.Quaternion().setFromEuler(new T3.Euler(rx,ry,rz)),new T3.Vector3(sx,sy,sz));
let cityMat;
function buildProps(){const veg=new T3.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.9,metalness:0}),plain=new T3.MeshStandardMaterial({vertexColors:true,roughness:.75,metalness:.05}),metal=new T3.MeshStandardMaterial({vertexColors:true,roughness:.45,metalness:.45});
 const B=(w,h,d)=>new T3.BoxGeometry(w,h,d),Cy=(a,b,h,s=8)=>new T3.CylinderGeometry(a,b,h,s),Co=(r,h,s=7)=>new T3.ConeGeometry(r,h,s);
 PROPS.pine={geo:merge([[Cy(.15,.2,.9,5),'#5a3a22',MT(0,.45,0)],[Co(1.15,2,7),'#ffffff',MT(0,1.6,0)],[Co(.85,1.6,7),'#ffffff',MT(0,2.6,0)]]),mat:veg,cap:900};
 PROPS.round={geo:merge([[Cy(.14,.18,1,5),'#5a3a22',MT(0,.5,0)],[new T3.IcosahedronGeometry(1,1),'#ffffff',MT(0,1.7,0,0,0,0,1,.85,1)]]),mat:veg,cap:400};
 const palm=[[Cy(.09,.14,2.8,5),'#7a5a32',MT(.15,1.4,0,0,0,-.08)]];for(let i=0;i<7;i++)palm.push([B(1.9,.07,.42),'#ffffff',MT(Math.cos(i/7*TAU)*.85+.2,2.75,Math.sin(i/7*TAU)*.85,0,-i/7*TAU,-.38)]);
 PROPS.palm={geo:merge(palm),mat:veg,cap:500};
 PROPS.cactus={geo:merge([[Cy(.22,.25,2.2,7),'#ffffff',MT(0,1.1,0)],[Cy(.14,.14,.9,6),'#ffffff',MT(.45,1.3,0,0,0,Math.PI/2)],[Cy(.14,.14,.8,6),'#ffffff',MT(.85,1.7,0)]]),mat:veg,cap:120};
 PROPS.rock={geo:merge([[new T3.IcosahedronGeometry(1,0),'#ffffff',MT(0,.3,0,0,0,0,1,.7,1)]]),mat:veg,cap:200};
 PROPS.spike={geo:merge([[Co(.7,3,5),'#ffffff',MT(0,1.4,0)]]),mat:veg,cap:120};
 const roofG=new T3.CylinderGeometry(.95,.95,1.7,3);roofG.rotateZ(Math.PI/2);
 PROPS.house={geo:merge([[B(1.6,1.1,1.3),'#ffffff',MT(0,.55,0)],[roofG,'#b5533c',MT(0,1.32,0,0,0,0,1,.55,.75)]]),mat:plain,cap:120};
 PROPS.barn={geo:merge([[B(2.4,1.6,3.6),'#a33a2a',MT(0,.8,0)],[roofG,'#5a4a40',MT(0,1.9,0,0,Math.PI/2,0,2.1,.8,1.4)]]),mat:plain,cap:10};
 PROPS.silo={geo:merge([[Cy(.6,.6,2.8,10),'#d8dadc',MT(0,1.4,0)],[new T3.SphereGeometry(.6,10,6,0,TAU,0,Math.PI/2),'#a8aaac',MT(0,2.8,0)]]),mat:metal,cap:10};
 PROPS.ware={geo:merge([[B(1,1,1),'#ffffff',MT(0,.5,0)],[B(1.02,.04,1.02),'#888888',MT(0,1,0)]]),mat:plain,cap:40};
 PROPS.cont={geo:merge([[B(2.5,1,1),'#ffffff',MT(0,.5,0)]]),mat:metal,cap:500};
 const cr=[];for(const[a,b]of[[-1.3,-1.3],[1.3,-1.3],[-1.3,1.3],[1.3,1.3]])cr.push([B(.3,7,.3),'#e08a2a',MT(a,3.5,b)]);cr.push([B(16,.6,.7),'#e08a2a',MT(4,7.2,0)],[B(2,1.4,1.6),'#d0d4d8',MT(1,6.3,0)],[B(.1,4,.1),'#333333',MT(9,5,0)]);
 PROPS.crane={geo:merge(cr),mat:metal,cap:12};
 const dr=[];for(const s of[-1,1])dr.push([B(.12,3.2,.12),'#2b2b2b',MT(s*.6,1.5,0,0,0,s*.18)]);dr.push([B(2.6,.3,.3),'#2b2b2b',MT(.4,3,0,0,0,.2)],[B(.6,.6,.6),'#c23b3b',MT(-.9,.3,0)]);
 PROPS.derrick={geo:merge(dr),mat:metal,cap:10};
 PROPS.tankf={geo:merge([[Cy(1.2,1.2,1.4,14),'#ffffff',MT(0,.7,0)]]),mat:metal,cap:20};
 PROPS.radar={geo:merge([[Cy(.4,.5,1,8),'#8a9096',MT(0,.5,0)],[new T3.SphereGeometry(1.4,14,8,0,TAU,0,Math.PI/2),'#f2f4f6',MT(0,1,0)]]),mat:plain,cap:10};
 PROPS.hut={geo:merge([[B(2.4,1.3,3.4),'#6a747c',MT(0,.65,0)],[B(2.6,.25,3.6),'#f4f8fb',MT(0,1.4,0)]]),mat:plain,cap:20};
 PROPS.pier={geo:merge([[B(1,.25,1),'#ffffff',MT(.5,.35,0)],[Cy(.08,.08,1.4,5),'#4a3a28',MT(.5,-.3,.45)],[Cy(.08,.08,1.4,5),'#4a3a28',MT(.5,-.3,-.45)]]),mat:plain,cap:10};
 PROPS.ruin={geo:merge([[B(1,1,1),'#ffffff',MT(0,.5,0)]]),mat:plain,cap:10};
 // HD props: displaced mossy boulders and top-down foliage cut-outs (art/spr_*.png), all casting real shadows
 if(!GTX.L)loadGround();
 const rockMat=new T3.MeshStandardMaterial({map:GTX.rock.map,normalMap:GTX.rock.n,normalScale:new T3.Vector2(.75,.75),roughness:.92,metalness:0});
 PROPS.boulder={geo:boulderGeo(3),mat:rockMat,cap:260};PROPS.boulder2={geo:boulderGeo(9),mat:rockMat,cap:200};
 const sb=new T3.BoxGeometry(1,1,1);sb.translate(0,.5,0);PROPS.stone={geo:sb,mat:rockMat,cap:120};
 // foliage sways in the wind: each instance gets its own phase from its position; the crown edges move most
 const sway=m=>{m.onBeforeCompile=sh=>{sh.uniforms.uWind=WIND;sh.vertexShader='uniform float uWind;\n'+sh.vertexShader.replace('#include <begin_vertex>',
  '#include <begin_vertex>\n#ifdef USE_INSTANCING\nfloat wph=instanceMatrix[3].x*.21+instanceMatrix[3].z*.13;\n#else\nfloat wph=0.;\n#endif\ntransformed.xz+=vec2(sin(uWind*1.7+wph),cos(uWind*1.25+wph*1.3))*.05*length(position.xz);');};return m;};
 const spr=(f,h,cap)=>{const t=GTX.L.load('art/'+f+'?v='+BUILD);t.encoding=T3.sRGBEncoding;t.anisotropy=4;const g=new T3.PlaneGeometry(1,1);g.rotateX(-Math.PI/2);g.translate(0,h,0);
  return{geo:g,mat:sway(new T3.MeshStandardMaterial({map:t,alphaTest:.42,side:T3.DoubleSide,roughness:.82,metalness:0})),depth:new T3.MeshDepthMaterial({depthPacking:T3.RGBADepthPacking,map:t,alphaTest:.42}),cap};};
 PROPS.palmS=spr('spr_palm.png',.6,220);PROPS.canopy=spr('spr_canopy.png',.5,320);PROPS.fern=spr('spr_fern.png',.12,420);
 PROPS.canopy2=spr('spr_canopy2.png',.55,200);PROPS.canopy3=spr('spr_canopy3.png',.65,160);
 // desert props
 {const sb=[];const Rs=srng(77);for(let k=0;k<9;k++){const a=Rs()*TAU,d=Rs()*.5;sb.push([new T3.IcosahedronGeometry(.14+Rs()*.16,0),k%3?'#ffffff':'#d8d0b8',MT(Math.cos(a)*d,.1+Rs()*.12,Math.sin(a)*d,Rs()*3,Rs()*3,0,1,.6,1)]);}
  PROPS.shrub={geo:merge(sb),mat:veg,cap:220};}   // dry desert scrub: a loose clump of small tufts
 PROPS.acacia={geo:merge([[Cy(.08,.13,2.2,5),'#5a3e26',MT(0,1.1,0,0,0,.1)],[Cy(.05,.07,1,4),'#5a3e26',MT(.35,1.9,0,0,0,-.6)],[Cy(1.7,1.3,.35,9),'#ffffff',MT(.15,2.4,0)],[Cy(1.1,.9,.28,8),'#ffffff',MT(.4,2.62,.2)]]),mat:veg,cap:60};
 const tr=new T3.CylinderGeometry(1,1,1,3);tr.rotateZ(Math.PI/2);
 PROPS.tent={geo:merge([[B(2.6,.7,2),'#ffffff',MT(0,.35,0)],[tr,'#ffffff',MT(0,.85,0,0,0,0,1.35,.42,1.05)]]),mat:plain,cap:30};
 PROPS.whouse={geo:merge([[B(1,1,1),'#ffffff',MT(0,.5,0)],[B(1.04,.08,1.04),'#d8d0c2',MT(0,1.02,0)],[B(.22,.42,.04),'#3a3532',MT(.2,.35,.51)],[B(.18,.18,.04),'#3a3532',MT(-.25,.6,.51)]]),mat:plain,cap:90};
 PROPS.wall={geo:merge([[B(1,1,1),'#ffffff',MT(0,.5,0)]]),mat:plain,cap:80};
 PROPS.shrine={geo:merge([[B(2.6,1.6,2.2),'#ffffff',MT(0,.8,0)],[new T3.SphereGeometry(.8,12,8,0,TAU,0,Math.PI/2),'#ffffff',MT(0,1.6,0)],[Cy(.17,.2,3,8),'#ffffff',MT(1.6,1.5,-.8)],[Co(.24,.5,8),'#d8d0c2',MT(1.6,3.25,-.8)]]),mat:plain,cap:6};
 PROPS.lamp={geo:new T3.SphereGeometry(.22,6,4),mat:new T3.MeshBasicMaterial({color:col('#ffcf7a')}),cap:260,noShadow:1};
 // city towers: window texture on walls, dark roof (top/bottom faces mapped to a dark texel)
 const wc=document.createElement('canvas');wc.width=64;wc.height=128;const g=wc.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,64,128);
 for(let y=4;y<124;y+=8)for(let x=4;x<60;x+=8){const on=Math.random();g.fillStyle=on<.45?`rgba(255,${200+Math.random()*50|0},${120+Math.random()*80|0},${.5+Math.random()*.5})`:on<.52?'rgba(140,200,255,.8)':'rgba(30,35,45,1)';g.fillRect(x,y,5,5);}
 g.fillStyle='#000';g.fillRect(0,0,4,4);const wt=new T3.CanvasTexture(wc);wt.encoding=T3.sRGBEncoding;wt.wrapS=wt.wrapT=T3.RepeatWrapping;
 const bg=new T3.BoxGeometry(1,1,1);bg.translate(0,.5,0);const uv=bg.attributes.uv;for(let i=8;i<16;i++)uv.setXY(i,.01,.99);
 bg.setAttribute('color',new T3.BufferAttribute(new Float32Array(bg.attributes.position.count*3).fill(1),3));
 cityMat=new T3.MeshStandardMaterial({vertexColors:true,roughness:.6,metalness:.3,emissiveMap:wt,emissive:col('#ffffff'),emissiveIntensity:1.4});
 PROPS.build={geo:bg,mat:cityMat,cap:420};
 // CC0 KayKit City Builder Bits models (js/assets/kaykit.js): low-rise buildings, cars, street lights, water tower
 if(typeof SF!=='undefined'&&SF.KK){kkMat=new T3.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.7,metalness:.05});
  kkMat.onBeforeCompile=sh=>{sh.uniforms.kkGlow=KKGLOW;sh.fragmentShader='uniform float kkGlow;\n'+sh.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n totalEmissiveRadiance+=vColor*kkGlow*smoothstep(.08,.3,vColor.b-vColor.r);');};
  const caps={building_A:40,building_C:40,building_E:40,building_G:40,car_sedan:60,car_taxi:40,car_hatchback:60,watertower:6};
  for(const k in caps)if(SF.KK[k])PROPS['kk_'+k]={geo:kkGeo(k),mat:kkMat,cap:caps[k]};}
 if(typeof SF!=='undefined'&&SF.setPieces)SF.setPieces({veg,plain,metal,B,Cy,Co});}
// decode a KayKit mesh: footprint normalised to 1 unit (largest of x/z), base at y=0, centred on x/z
let kkMat;const KKGLOW={value:0};
function kkGeo(name){const D=SF.KK[name],b=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0)).buffer;
 const q=new Int16Array(b(D.p)),c8=new Uint8Array(b(D.c)),ix=new Uint16Array(b(D.i)),n=D.v,f=1/Math.max(D.sz[0],D.sz[2]);
 const pos=new Float32Array(n*3),cl=new Float32Array(n*3);
 for(let i=0;i<n;i++){for(let a=0;a<3;a++){const t=(q[i*3+a]+32768)/65535;pos[i*3+a]=(a===1?t*D.sz[1]:(t-.5)*D.sz[a])*f;cl[i*3+a]=Math.pow(c8[i*3+a]/255,2.2);}}
 const g=new T3.BufferGeometry();g.setAttribute('position',new T3.BufferAttribute(pos,3));g.setAttribute('color',new T3.BufferAttribute(cl,3));g.setIndex(new T3.BufferAttribute(ix,1));g.computeVertexNormals();return g;}
// ---------- terrain tiles ----------
const TW=240,TL=110,NX=120,NZT=54,NT=5;let TZ0=80;
const TER={g:new T3.Group(),tiles:[],mat:null,water:null,lava:null};
const LV={si:-1,HF:null,wl:0,B:null,boss:null,decals:[],clouds:[]};
function gridGeo(){const g=new T3.BufferGeometry(),n=(NX+1)*(NZT+1);g.setAttribute('position',new T3.BufferAttribute(new Float32Array(n*3),3));g.setAttribute('color',new T3.BufferAttribute(new Float32Array(n*3),3));
 const uv=new Float32Array(n*2);for(let j=0;j<=NZT;j++)for(let i=0;i<=NX;i++){const k=j*(NX+1)+i;uv[k*2]=i/NX*TW/6;uv[k*2+1]=j/NZT*TL/6;}g.setAttribute('uv',new T3.BufferAttribute(uv,2));
 const idx=[];for(let j=0;j<NZT;j++)for(let i=0;i<NX;i++){const a=j*(NX+1)+i,b=a+1,c=a+NX+1,d=c+1;idx.push(a,b,c,b,d,c);}g.setIndex(idx);return g;}
function detailTex(){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');const im=g.createImageData(128,128);for(let i=0;i<128*128;i++){const v=200+Math.random()*55;im.data[i*4]=im.data[i*4+1]=im.data[i*4+2]=v;im.data[i*4+3]=255;}g.putImageData(im,0,0);
 const t=new T3.CanvasTexture(c);t.wrapS=t.wrapT=T3.RepeatWrapping;t.anisotropy=4;return t;}
function waterNormal(){const N=256,c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d'),im=g.createImageData(N,N),h=new Float32Array(N*N);
 const R=srng(7),w=[];for(let i=0;i<14;i++)w.push([1+Math.floor(R()*7),Math.floor(R()*9)-4,R()*TAU,.4+R()]);
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){let v=0;for(const[a,b,p,amp]of w)v+=Math.sin((a*x+b*y)/N*TAU+p)*amp/(a+Math.abs(b));h[y*N+x]=v;}
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){const dx=h[y*N+(x+1)%N]-h[y*N+(x+N-1)%N],dy=h[((y+1)%N)*N+x]-h[((y+N-1)%N)*N+x];const nx=-dx*6,ny=-dy*6,nz=1,l=Math.hypot(nx,ny,nz),k=(y*N+x)*4;im.data[k]=(nx/l*.5+.5)*255;im.data[k+1]=(ny/l*.5+.5)*255;im.data[k+2]=(nz/l*.5+.5)*255;im.data[k+3]=255;}
 g.putImageData(im,0,0);const t=new T3.CanvasTexture(c);t.wrapS=t.wrapT=T3.RepeatWrapping;return t;}
function lavaTex(){const N=128,c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d'),im=g.createImageData(N,N);
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){const v=(Math.sin(x/N*TAU*3+Math.sin(y/N*TAU*2)*2)+Math.sin(y/N*TAU*4+Math.cos(x/N*TAU)*3))*.25+.5,k=(y*N+x)*4;im.data[k]=255;im.data[k+1]=Math.floor(60+v*v*190);im.data[k+2]=Math.floor(10+v*v*v*120);im.data[k+3]=255;}
 g.putImageData(im,0,0);const t=new T3.CanvasTexture(c);t.wrapS=t.wrapT=T3.RepeatWrapping;t.encoding=T3.sRGBEncoding;return t;}
function scorchTex(){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,2,32,32,32);gr.addColorStop(0,'rgba(10,6,4,.85)');gr.addColorStop(.6,'rgba(20,12,8,.5)');gr.addColorStop(1,'rgba(20,12,8,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return new T3.CanvasTexture(c);}
function cloudTex(){const c=document.createElement('canvas');c.width=256;c.height=128;const g=c.getContext('2d'),R=srng(91);
 for(let k=0;k<14;k++){const x=50+R()*156,y=40+R()*50,r=22+R()*36,gr=g.createRadialGradient(x,y-r*.2,0,x,y,r);gr.addColorStop(0,'rgba(255,255,255,.9)');gr.addColorStop(.6,'rgba(240,244,250,.5)');gr.addColorStop(1,'rgba(230,236,245,0)');g.fillStyle=gr;g.fillRect(0,0,256,128);}return new T3.CanvasTexture(c);}
// wind-rippled sand: wavy parallel ridges with grain (multiplies the vertex colours)
function rippleTex(){const N=256,c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d'),im=g.createImageData(N,N),R=srng(23);
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){const k=(y*N+x)*4,w=Math.sin((x+y*.35)/N*TAU*9+Math.sin(y/N*TAU*2)*2.2+Math.sin((x-y)/N*TAU*3)*.8);
  const v=196+Math.pow(w*.5+.5,1.6)*46+R()*18;im.data[k]=im.data[k+1]=im.data[k+2]=Math.min(255,v);im.data[k+3]=255;}
 g.putImageData(im,0,0);const t=new T3.CanvasTexture(c);t.wrapS=t.wrapT=T3.RepeatWrapping;t.anisotropy=4;return t;}
let DETAIL,WNORM,LAVA,SCORCH,CLOUDT,RIPPLE;
// chunky boulder: subdivided icosahedron pushed in and out by a few random waves, flattened, sitting on the ground
function boulderGeo(seed){const g=new T3.IcosahedronGeometry(1,3),p=g.attributes.position,R=srng(seed),W=[];
 for(let k=0;k<7;k++){const a=R()*TAU,b=Math.acos(R()*2-1);W.push([Math.sin(b)*Math.cos(a),Math.cos(b),Math.sin(b)*Math.sin(a),1.5+R()*3.5,R()*TAU,.06+R()*.1]);}
 for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);let r=1;for(const[dx,dy,dz,f,ph,a]of W)r+=a*Math.sin((x*dx+y*dy+z*dz)*f+ph);
  r=Math.max(.7,r);p.setXYZ(i,x*r,Math.max(-.25,y*r*.62)+.22,z*r);}
 g.computeVertexNormals();return g;}
// HD ground sets (tools/sand_tex.py, tools/forest_tex.py): colour + normal map, tileable. Biomes pick one with ground:'sand'|'grass'.
const GTX={};
function loadGround(){const L=new T3.TextureLoader(),mk=(f,srgb,r)=>{const t=L.load('art/'+f+'?v='+BUILD);t.wrapS=t.wrapT=T3.RepeatWrapping;t.repeat.set(r,r);t.anisotropy=8;if(srgb)t.encoding=T3.sRGBEncoding;return t;};
 GTX.sand={map:mk('tex_sand.jpg',1,.22),n:mk('tex_sand_n.jpg',0,.22),ns:.7,rough:.97};
 GTX.grass={map:mk('tex_grass.jpg',1,.4),n:mk('tex_grass_n.jpg',0,.4),ns:.8,rough:.95};
 GTX.rock={map:mk('tex_rock.jpg',1,1),n:mk('tex_rock_n.jpg',0,1)};
 GTX.L=L;}
function initTerrain(){DETAIL=detailTex();RIPPLE=rippleTex();if(!GTX.L)loadGround();WNORM=waterNormal();LAVA=lavaTex();SCORCH=scorchTex();CLOUDT=cloudTex();
 TER.mat=new T3.MeshStandardMaterial({vertexColors:true,roughness:.92,metalness:0,map:DETAIL});
 for(let i=0;i<NT;i++){const geo=gridGeo(),m=new T3.Mesh(geo,TER.mat);m.receiveShadow=true;m.frustumCulled=false;TER.g.add(m);TER.tiles.push({geo,m,n:-1,inst:{},hs:new Float32Array((NX+1)*(NZT+1))});}
 const wg=new T3.PlaneGeometry(700,900);wg.rotateX(-Math.PI/2);
 TER.water=new T3.Mesh(wg,new T3.MeshStandardMaterial({color:0x1d6e95,roughness:.1,metalness:.15,normalMap:WNORM,normalScale:new T3.Vector2(.55,.55),transparent:true,opacity:.9}));TER.water.receiveShadow=true;scene.add(TER.water);
 WNORM.repeat.set(28,36);
 TER.lava=new T3.Mesh(wg,new T3.MeshBasicMaterial({map:LAVA,color:col('#ffffff')}));LAVA.repeat.set(30,40);scene.add(TER.lava);
 for(let i=0;i<24;i++){const d=new T3.Mesh(new T3.PlaneGeometry(1,1),new T3.MeshBasicMaterial({map:SCORCH,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));d.rotation.x=-Math.PI/2;d.visible=false;TER.g.add(d);LV.decals.push(d);}
 for(let i=0;i<9;i++){const s=new T3.Sprite(new T3.SpriteMaterial({map:CLOUDT,transparent:true,opacity:.5,depthWrite:false,fog:false}));s.visible=false;scene.add(s);LV.clouds.push(s);}}
const tmpO=new T3.Object3D(),tmpC=new T3.Color();
function fillTile(t,n){t.n=n;if(LV.B.pbr&&SF.terrain)return SF.terrain.fill(t,n);const B=LV.B,HF=B.HF,z0=TZ0-n*TL,pos=t.geo.attributes.position.array,cl=t.geo.attributes.color.array,hs=t.hs,dx=TW/NX,dz=TL/NZT,o=[0,0,0];
 for(let j=0;j<=NZT;j++)for(let i=0;i<=NX;i++){const k=j*(NX+1)+i,x=-TW/2+i*dx,z=z0-j*dz,h=HF(x,z);hs[k]=h;pos[k*3]=x;pos[k*3+1]=GY+h;pos[k*3+2]=z;}
 for(let j=0;j<=NZT;j++)for(let i=0;i<=NX;i++){const k=j*(NX+1)+i,x=-TW/2+i*dx,z=z0-j*dz,h=hs[k];
  const hx=hs[j*(NX+1)+Math.min(NX,i+1)]-hs[j*(NX+1)+Math.max(0,i-1)],hz=hs[Math.min(NZT,j+1)*(NX+1)+i]-hs[Math.max(0,j-1)*(NX+1)+i],sl=Math.hypot(hx/(2*dx),hz/(2*dz));
  paint(o,x,z,h,sl,B.P);if(B.cf)B.cf(o,x,z,h,sl,hx/(2*dx),-hz/(2*dz));cl[k*3]=o[0];cl[k*3+1]=o[1];cl[k*3+2]=o[2];}
 t.geo.attributes.position.needsUpdate=true;t.geo.attributes.color.needsUpdate=true;t.geo.computeVertexNormals();
 for(const k in t.inst)t.inst[k].count=0;
 const R=srng(LV.si*7919+n*104729+3);
 const put=(type,x,z,s,ry,c,sy=1,yoff=0,dims)=>{const im=t.inst[type];if(!im||im.count>=PROPS[type].cap)return;const h=HF(x,z);
  tmpO.position.set(x,(type==='pier'?GY+LV.wl:GY+h)+yoff,z);
  tmpO.rotation.set(0,ry,0);if(dims)tmpO.scale.set(dims[0]*s,dims[1]*s,dims[2]*s);else tmpO.scale.set(s,s*sy,s);tmpO.updateMatrix();
  im.setMatrixAt(im.count,tmpO.matrix);tmpC.set(c?col(c):0xffffff);im.setColorAt(im.count,tmpC);im.count++;};
 B.props(R,z0,put,HF);
 for(const k in t.inst){const im=t.inst[k];im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;}}
function updTerrain(force){const n0=Math.floor(gz3/TL);TER.g.position.z=gz3;
 const want=[];for(let n=n0;n<n0+NT;n++)want.push(n);const free=TER.tiles.filter(t=>force||!want.includes(t.n));
 for(const n of want)if(force||!TER.tiles.some(t=>t.n===n)){const t=free.shift();if(t)fillTile(t,n);}
 const B=LV.B;if(TER.water.visible){WNORM.offset.y+=0;}
 TER.water.position.z=C3.z-380;TER.lava.position.z=C3.z-380;}
// ---------- level build ----------
function buildLevel(si){const st=STAGES[si],B=BIOME[st.biome];LV.si=si;LV.B=B;if(SF.terrain)SF.terrain.top=0;LV.HF=B.HF;LV.wl=(B.water||B.lava)?B.wl:-60;NZ2.seed(si*13+5);
 skyMat.uniforms.top.value.set(B.sky[0]);skyMat.uniforms.hor.value.set(B.sky[1]);skyMat.uniforms.bot.value.set(B.sky[2]);
 const sd=new T3.Vector3(...B.sunDir).normalize();skyMat.uniforms.sunDir.value.copy(sd);skyMat.uniforms.sunCol.value.set(B.sun[0]);
 sun.color.copy(col(B.sun[0]));sun.intensity=B.sun[1];LV.sunDir=sd;hemi.color.copy(col(B.hemi[0]));hemi.groundColor.copy(col(B.hemi[1]));hemi.intensity=B.hemi[2];
 renderer.toneMappingExposure=B.exp;scene.fog.color.copy(col(B.fog));
 const GS=B.ground&&GTX[B.ground],tm=GS?GS.map:DETAIL,tn=GS?GS.n:null;
 for(const t of TER.tiles)t.m.material=B.pbr&&SF.terrain?SF.terrain.mat(B):TER.mat;
 if(TER.mat.map!==tm||TER.mat.normalMap!==tn){TER.mat.map=tm;TER.mat.normalMap=tn;if(GS)TER.mat.normalScale.set(GS.ns,GS.ns);TER.mat.roughness=GS?GS.rough:.92;TER.mat.needsUpdate=true;}
 // environment reflections from this sky
 if(envRT)envRT.dispose();envRT=envCube(B,sd);scene.environment=envRT;
 TER.water.visible=!!B.water;TER.lava.visible=!!B.lava;if(B.water){TER.water.material.color.copy(col(B.water.c));TER.water.material.opacity=B.water.op;TER.water.position.y=GY+B.wl;}
 if(B.lava)TER.lava.position.y=GY+B.wl;
 // instanced props per tile
 const used={};const probe=(type)=>{used[type]=1;};B.props(srng(1),0,(type)=>probe(type),B.HF);
 if(st.biome==='city'){used.build=1;used.lamp=1;used.round=1;}for(const k of B.uses||[])if(PROPS[k])used[k]=1;for(const k in used)if(!PROPS[k])delete used[k];KKGLOW.value=B.night?.9:0;
 for(const t of TER.tiles){for(const k in t.inst){TER.g.remove(t.inst[k]);t.inst[k].dispose();}t.inst={};
  for(const k in used){const P=PROPS[k];const im=new T3.InstancedMesh(P.geo,P.mat,P.cap);for(let i=0;i<P.cap;i++)im.setColorAt(i,tmpC.set(0xffffff));im.count=0;im.castShadow=!P.noShadow;if(P.depth)im.customDepthMaterial=P.depth;im.frustumCulled=false;TER.g.add(im);t.inst[k]=im;}}
 gz3=0;TZ0=C3.z+30;updTerrain(true);
 for(const d of LV.decals)d.visible=false;
 for(const c of LV.clouds){c.visible=false;}LV.ncl=B.clouds;resetClouds();
 // boss model
 if(LV.boss){scene.remove(LV.boss.g);LV.boss.g.traverse(o=>{if(o.geometry)o.geometry.dispose();});}
 LV.boss=bossModel(st);LV.boss.g.visible=false;scene.add(LV.boss.g);}
function resetClouds(){const night=LV.B.night;LV.clouds.forEach((c,i)=>{c.visible=i<LV.ncl;c.material.opacity=night?.18:.42;c.material.color.set(night?'#5a6688':LV.B.fog);spawnCloud(c,true);});}
function spawnCloud(c,any){const s=40+Math.random()*60;c.scale.set(s,s*.5,1);c.position.set(rnd(-90,90),GY+rnd(28,75),any?rnd(C3.z-420,C3.z):C3.z-460);}
// decals
let decI=0;function addDecal(x,y,r){const d=LV.decals[decI++%LV.decals.length];tmpO.position.set(0,0,0);place(tmpO,x,y,true);d.position.set(tmpO.position.x,tmpO.position.y+.08,tmpO.position.z-gz3);d.scale.setScalar(r*K*2.4*tmpO.scale.x);d.visible=true;}
// explosion lights
const FXL=[];let fxi=0;function flashLight(x,y,size,ground){if(!save.hq)return;const l=FXL[fxi++%FXL.length];tmpO.position.set(0,0,0);place(tmpO,x,y,ground);l.position.set(tmpO.position.x,tmpO.position.y+3,tmpO.position.z);l.intensity=4*size;l.userData.d=4*size;}

// ================= 3D MODELS =================
const yUp=(g)=>g;
function shapeGeo(pts,depth,bevel=0){const s=new T3.Shape();s.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)s.lineTo(pts[i][0],pts[i][1]);s.closePath();
 const g=new T3.ExtrudeGeometry(s,{depth,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:1,steps:1});g.rotateX(-Math.PI/2);return g;}
function mesh(geo,mat,x=0,y=0,z=0){const m=new T3.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;return m;}
function jetModel(o,body,acc,sc=1){const L=o.L*K*sc,S=o.S*K*sc,fw=o.fw*K*sc,g=new T3.Group();
 const mb=std(body,.55,.32),ma=std(acc,.25,.4),md=std('#24282e',.75,.35);
 const prof=[[.001,-L*.5],[fw*.62,-L*.47],[fw*.9,-L*.32],[fw,-L*.08],[fw*.95,L*.18],[fw*.62,L*.36],[fw*.22,L*.48],[.001,L*.5]].map(p=>new T3.Vector2(p[0],p[1]));
 const fus=new T3.LatheGeometry(prof,16);fus.rotateX(-Math.PI/2);fus.scale(1,.78,1);g.add(mesh(fus,mb));
 const yl=L*.5-L*o.wl,c=L*o.chord,ytl=yl-(S/2-fw)*o.sweep,tc=L*o.tip,th=L*.03;
 const wing=shapeGeo([[-S/2,ytl],[-fw,yl],[fw,yl],[S/2,ytl],[S/2,ytl-tc],[fw,yl-c],[-fw,yl-c],[-S/2,ytl-tc]],th,L*.008);g.add(mesh(wing,mb,0,-fw*.2,0));
 for(const s of[-1,1]){g.add(mesh(new T3.BoxGeometry(S*.07,th*1.6,tc*1.1+.05),ma,s*(S/2-S*.035),-fw*.2+th*.5,-(ytl-tc/2)));
  g.add(mesh(new T3.CylinderGeometry(L*.014,L*.014,L*.26,6).rotateX(Math.PI/2),std('#e9edf2',.3,.5),s*S*.28,-fw*.45,-(yl-c*.5-(S*.28-fw)*o.sweep)));}
 if(o.tailS){const ty0=-L*.5+L*.24,ts=S*o.tailS;g.add(mesh(shapeGeo([[-ts,ty0-L*.12],[-fw*.7,ty0],[fw*.7,ty0],[ts,ty0-L*.12],[ts,ty0-L*.2],[-ts,ty0-L*.2]],th*.8),mb,0,-fw*.1,0));}
 if(o.canard){g.add(mesh(shapeGeo([[-fw*2.8,L*.2],[-fw,L*.3],[fw,L*.3],[fw*2.8,L*.2],[fw*2.8,L*.17],[-fw*2.8,L*.17]],th*.7),mb,0,0,0));}
 const finS=new T3.Shape();finS.moveTo(0,0);finS.lineTo(L*.26,0);finS.lineTo(L*.07,L*.17);finS.lineTo(-.02,L*.17);finS.closePath();
 const finG=new T3.ExtrudeGeometry(finS,{depth:L*.012,bevelEnabled:false});finG.rotateY(Math.PI/2);
 const fins=o.fins?[-1,1]:[0];for(const s of fins){const f=mesh(finG,mb,s*fw*.55,fw*.35,L*.5-L*.02);f.rotation.z=-s*.38;g.add(f);if(s)f.children;}
 const cn=new T3.Mesh(new T3.SphereGeometry(1,20,14),glassMat);cn.scale.set(fw*.62,fw*.62,L*.15);cn.position.set(0,fw*.42,-(L*.5-L*.25));g.add(cn);
 const n=o.eng||1;for(let i=0;i<n;i++){const ex=n===1?0:(i-.5)*fw*1.2,r=fw*(n===1?.62:.42);g.add(mesh(new T3.CylinderGeometry(r*.85,r,L*.07,14,1,true).rotateX(Math.PI/2),md,ex,0,L*.5));
  const fl=new T3.Mesh(new T3.CircleGeometry(r*.8,14),basic('#ffb347'));fl.position.set(ex,0,L*.5+.02);g.add(fl);}
 g.add(mesh(new T3.BoxGeometry(fw*.4,.03,L*.32),ma,0,fw*.77,L*.05));
 return g;}
function rotor(r,blades=2,mat){const g=new T3.Group();g.name='rotor';for(let i=0;i<blades;i++){const b=new T3.Mesh(new T3.BoxGeometry(r*2,.05,.22),mat||std('#1a1c1e',.3,.6));b.rotation.y=i*Math.PI/blades;g.add(b);}
 const d=new T3.Mesh(new T3.CircleGeometry(r,24),new T3.MeshBasicMaterial({color:0xbfc4c8,transparent:true,opacity:.14,depthWrite:false,side:T3.DoubleSide}));d.rotation.x=-Math.PI/2;g.add(d);return g;}
function heliModel(body,acc,missiles){const g=new T3.Group(),mb=std(body,.35,.5),md=std('#24282e',.6,.4);
 const b=mesh(new T3.SphereGeometry(1,16,12),mb);b.scale.set(.95,.85,1.9);g.add(b);
 g.add(mesh(new T3.CylinderGeometry(.16,.3,3.3,8).rotateX(Math.PI/2),mb,0,.15,2.4));g.add(mesh(new T3.BoxGeometry(.08,.9,.7),mb,0,.5,3.9));
 const tr=new T3.Mesh(new T3.BoxGeometry(.04,1.3,.14),md);tr.position.set(.14,.5,3.9);tr.name='trot';g.add(tr);
 g.add(mesh(new T3.BoxGeometry(3.4,.12,.6),mb,0,-.15,.1));
 for(const s of[-1,1]){g.add(mesh(new T3.CylinderGeometry(.24,.24,1,8).rotateX(Math.PI/2),md,s*1.6,-.3,.1));g.add(mesh(new T3.BoxGeometry(.1,.08,3),md,s*.7,-.95,0));
  if(missiles)for(const k of[-.35,.35])g.add(mesh(new T3.CylinderGeometry(.11,.11,1.3,6).rotateX(Math.PI/2),std('#f2f2f2',.2,.5),s*(1.1+k*.6),-.05,0));}
 const cn=new T3.Mesh(new T3.SphereGeometry(1,16,12),glassMat);cn.scale.set(.62,.55,.85);cn.position.set(0,.35,-1.25);g.add(cn);
 g.add(mesh(new T3.BoxGeometry(.6,.1,.6),std(acc,.2,.5),0,.88,0));
 const r=rotor(3,2);r.position.y=1;g.add(r);return g;}
function droneModel(){const g=new T3.Group(),md=std('#3b3f46',.6,.4);g.add(mesh(new T3.SphereGeometry(.55,12,8),std('#8a929c',.6,.35)));
 const eye=new T3.Mesh(new T3.SphereGeometry(.22,8,6),basic('#ff3c50'));eye.position.set(0,-.1,.45);g.add(eye);
 for(const[a,b]of[[-1,-1],[1,-1],[-1,1],[1,1]]){const arm=mesh(new T3.BoxGeometry(1.1,.1,.12),md,a*.45,0,b*.45);arm.rotation.y=-Math.atan2(b,a);g.add(arm);const r=rotor(.5,2);r.position.set(a*.85,.12,b*.85);r.name='rotor';g.add(r);}return g;}
function shieldBall(r,c){const m=new T3.Mesh(new T3.SphereGeometry(r,20,14),new T3.MeshBasicMaterial({color:col(c),transparent:true,opacity:.28,blending:T3.AdditiveBlending,depthWrite:false}));m.name='shield';return m;}
function tankModel(c){const g=new T3.Group(),mb=std(c,.3,.6),md=std('#1d1f1c',.2,.8);
 g.add(mesh(new T3.BoxGeometry(2.1,.75,3.2),mb,0,.6,0));for(const s of[-1,1])g.add(mesh(new T3.BoxGeometry(.7,.75,3.5),md,s*1.25,.4,0));
 const t=new T3.Group();t.name='tur';t.position.y=1.05;t.add(mesh(new T3.CylinderGeometry(.75,.9,.55,12),mb));t.add(mesh(new T3.CylinderGeometry(.12,.12,2.3,8).rotateX(Math.PI/2),md,0,.05,-1.4));g.add(t);return g;}
function aaModel(){const g=new T3.Group();g.add(mesh(new T3.CylinderGeometry(1.4,1.6,.4,16),std('#8f9396',.1,.8),0,.2,0));const tb=mesh(new T3.TorusGeometry(1.55,.32,6,18),std('#b7a77e',0,.9),0,.35,0);tb.rotation.x=Math.PI/2;g.add(tb);
 const t=new T3.Group();t.name='tur';t.position.y=.8;t.add(mesh(new T3.BoxGeometry(1.1,.7,1.1),std('#6a7076',.4,.5)));for(const s of[-1,1])t.add(mesh(new T3.CylinderGeometry(.09,.09,1.9,6).rotateX(Math.PI/2),std('#22262a',.6,.4),s*.3,.1,-1.1));g.add(t);return g;}
function truckModel(){const g=new T3.Group();g.add(mesh(new T3.BoxGeometry(1.4,1.1,1.2),std('#5d6a48',.2,.6),0,.85,-1.3));g.add(mesh(new T3.BoxGeometry(1.2,.4,.1),glassMat,0,1.1,-1.92));
 g.add(mesh(new T3.BoxGeometry(1.5,1.3,2.3),std('#9a9470',.05,.9),0,.95,.55));for(const z of[-1.3,.1,1.1])for(const s of[-1,1])g.add(mesh(new T3.CylinderGeometry(.32,.32,.25,10).rotateZ(Math.PI/2),std('#1a1a1a',0,.9),s*.7,.32,z));return g;}
function boatModel(){const g=new T3.Group();g.add(mesh(shapeGeo([[0,3],[1.1,1.4],[1,-2.6],[-1,-2.6],[-1.1,1.4]],.9,.05),std('#7a828b',.4,.5),0,-.4,0));
 g.add(mesh(shapeGeo([[0,2.5],[.85,1.2],[.8,-2.3],[-.8,-2.3],[-.85,1.2]],.05),std('#c2c7cc',.1,.7),0,.55,0));g.add(mesh(new T3.BoxGeometry(1.1,.9,1.3),std('#eef0f2',.1,.5),0,1,.6));g.add(mesh(new T3.BoxGeometry(1,.25,.1),glassMat,0,1.2,-.06));
 const t=new T3.Group();t.name='tur';t.position.set(0,.8,-1.4);t.add(mesh(new T3.CylinderGeometry(.35,.4,.35,10),std('#4a5058',.5,.4)));t.add(mesh(new T3.CylinderGeometry(.07,.07,1,6).rotateX(Math.PI/2),std('#22262a',.6,.4),0,.05,-.6));g.add(t);return g;}
function samModel(){const g=new T3.Group();g.add(mesh(new T3.BoxGeometry(1.9,.5,3.2),std('#5a6448',.2,.6),0,.4,0));const t=new T3.Group();t.name='tur';t.position.y=.8;
 const rack=new T3.Group();rack.rotation.x=.5;for(const[a,b]of[[-.35,-.25],[.35,-.25],[-.35,.25],[.35,.25]]){rack.add(mesh(new T3.CylinderGeometry(.2,.2,2.4,8).rotateX(Math.PI/2),std('#e8eaec',.2,.5),a,b,0));const tip=new T3.Mesh(new T3.CircleGeometry(.18,8),basic('#d23a3a'));tip.position.set(a,b,-1.21);tip.rotation.y=Math.PI;rack.add(tip);}t.add(rack);g.add(t);return g;}
function artyModel(){const g=new T3.Group();g.add(mesh(new T3.BoxGeometry(2.2,.7,2.6),std('#6a6248',.2,.7),0,.4,0));const t=new T3.Group();t.name='tur';t.position.y=.9;
 const br=mesh(new T3.CylinderGeometry(.2,.28,4.2,10).rotateX(Math.PI/2),std('#2a2c2e',.6,.4),0,.9,-1.4);br.rotation.x=-.65;t.add(br);t.add(mesh(new T3.BoxGeometry(1.6,1,.3),std('#5a5440',.3,.6),0,.5,-.4));g.add(t);return g;}
function domeModel(){const g=new T3.Group();g.add(mesh(new T3.CylinderGeometry(1.7,1.9,.6,16),std('#5a6470',.5,.4),0,.3,0));g.add(mesh(new T3.CylinderGeometry(.3,.4,2,8),std('#8a929c',.6,.3),0,1.4,0));
 const orb=new T3.Mesh(new T3.SphereGeometry(.55,14,10),basic('#7fe8ff'));orb.position.y=2.6;orb.name='orb';g.add(orb);const sh=shieldBall(13,'#4fc8ff');sh.scale.y=.6;g.add(sh);return g;}
function ufoModel(){const g=new T3.Group();g.add(mesh(new T3.CylinderGeometry(1.4,2.3,.55,24),std('#8a6a3a',.6,.35)));g.add(mesh(new T3.CylinderGeometry(2.3,1.6,.35,24),std('#5a4628',.6,.4),0,-.42,0));
 const dm=new T3.Mesh(new T3.SphereGeometry(.95,16,10,0,TAU,0,Math.PI/2),glassMat);dm.position.y=.25;g.add(dm);
 const lights=new T3.Group();lights.name='ring';for(let i=0;i<8;i++){const l=new T3.Mesh(new T3.SphereGeometry(.16,6,4),basic('#ffd23f'));l.position.set(Math.cos(i/8*TAU)*2,-.1,Math.sin(i/8*TAU)*2);lights.add(l);}g.add(lights);return g;}
function mineModel(){const g=new T3.Group();g.add(mesh(new T3.IcosahedronGeometry(.6,0),std('#3a2a2a',.6,.4,{flat:1})));for(let i=0;i<8;i++){const c=mesh(new T3.ConeGeometry(.12,.5,5),std('#8a8a8a',.7,.3));const d=new T3.Vector3(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize();c.position.copy(d).multiplyScalar(.65);c.quaternion.setFromUnitVectors(new T3.Vector3(0,1,0),d);g.add(c);}
 const l=new T3.Mesh(new T3.SphereGeometry(.25,8,6),new T3.MeshBasicMaterial({color:0xff3030}));l.name='light';l.position.y=.55;g.add(l);return g;}
function menderModel(){const g=new T3.Group(),mw=std('#e9eef2',.3,.4),mg=std('#2bd17a',.2,.4,{em:'#1a9a5a',ei:.8});g.add(mesh(new T3.BoxGeometry(4.2,.4,1.2),mw));g.add(mesh(new T3.BoxGeometry(1.2,.4,4),mw));g.add(mesh(new T3.BoxGeometry(2.8,.45,.4),mg,0,.05,0));g.add(mesh(new T3.BoxGeometry(.4,.45,2.6),mg,0,.05,0));
 const o=new T3.Mesh(new T3.SphereGeometry(.6,14,10),basic('#7fffb0'));o.position.y=.6;o.name='orb';g.add(o);for(const s of[-1,1]){const r=rotor(.9,2);r.position.set(s*2.1,.3,0);g.add(r);}return g;}
function blinkModel(){const g=new T3.Group();const c=mesh(new T3.OctahedronGeometry(1.3,0),std('#5a2a8a',.7,.25,{em:'#3a1060',ei:.6,flat:1}));c.scale.set(1,.6,1.3);g.add(c);
 for(let i=0;i<2;i++){const r=new T3.Mesh(new T3.TorusGeometry(1.8+i*.35,.07,6,30),basic('#c07bff'));r.rotation.x=Math.PI/2;r.name='ring'+i;g.add(r);}return g;}
function hydraModel(){const g=new T3.Group(),mb=std('#2f7a6a',.5,.35);g.add(mesh(new T3.SphereGeometry(1,16,12),mb));const c=new T3.Mesh(new T3.SphereGeometry(.5,12,8),glassMat);c.position.set(0,.6,0);g.add(c);
 for(let i=0;i<3;i++){const a=i/3*TAU+Math.PI/2,arm=mesh(new T3.BoxGeometry(2.6,.18,.8),mb,Math.cos(a)*1.4,0,Math.sin(a)*1.4);arm.rotation.y=-a;g.add(arm);g.add(mesh(new T3.SphereGeometry(.45,10,8),std('#8a929c',.6,.35),Math.cos(a)*2.7,0,Math.sin(a)*2.7));const e=new T3.Mesh(new T3.SphereGeometry(.18,8,6),basic('#ff3c50'));e.position.set(Math.cos(a)*2.7,.2,Math.sin(a)*2.7);g.add(e);}return g;}
function wraithModel(){const g=new T3.Group(),m=new T3.MeshStandardMaterial({color:col('#1b1e24'),metalness:.8,roughness:.25,flatShading:true,transparent:true,opacity:1});
 g.add(mesh(shapeGeo([[0,2.4],[2.8,-1.2],[1.4,-.6],[0,-1.4],[-1.4,-.6],[-2.8,-1.2]],.35,.08),m,0,-.1,0));const cn=new T3.Mesh(new T3.SphereGeometry(.4,10,8),new T3.MeshBasicMaterial({color:0xa46bff,transparent:true}));cn.scale.set(1,.5,1.6);cn.position.set(0,.3,-.6);g.add(cn);return g;}
function lancerModel(){const g=jetModel({L:46,S:26,sweep:.85,wl:.42,chord:.4,tip:.06,fw:4,tailS:.25,fins:1},'#d8d0b8','#c23b3b');
 g.add(mesh(new T3.CylinderGeometry(.09,.12,3.4,8).rotateX(Math.PI/2),std('#22262a',.7,.3),0,-.3,-3.6));const tip=new T3.Mesh(new T3.SphereGeometry(.22,8,6),basic('#ff3c50'));tip.position.set(0,-.3,-5.3);tip.name='tip';g.add(tip);return g;}
function bomberModel(){const g=jetModel({L:64,S:118,sweep:.14,wl:.32,chord:.2,tip:.12,fw:7,tailS:.22},'#76806f','#c23b3b');
 for(const s of[-1,1])for(const f of[.3,.62]){const x=s*(.7+5.2*f),z=-(3.2-6.4*.32-5.2*f*.14)-.2;g.add(mesh(new T3.CylinderGeometry(.42,.42,1.9,10).rotateX(Math.PI/2),std('#4a5048',.5,.4),x,-.25,z));const r=rotor(.9,3);r.rotation.x=Math.PI/2;r.position.set(x,-.25,z-1.05);r.name='rotor';g.add(r);}return g;}
// ---- ground installations (Checkpoint 3) ----
function towerModel(){const g=new T3.Group();g.add(mesh(new T3.CylinderGeometry(1.5,1.9,.5,10),std('#6d665a',.1,.85),0,.25,0));g.add(mesh(new T3.CylinderGeometry(.9,1.2,3,8),std('#8a8274',.15,.8),0,1.9,0));
 const t=new T3.Group();t.name='tur';t.position.y=3.6;t.add(mesh(new T3.BoxGeometry(1.6,.9,1.6),std('#4e5560',.5,.45)));for(const s of[-1,1])t.add(mesh(new T3.CylinderGeometry(.12,.12,2,6).rotateX(Math.PI/2),std('#1d2126',.7,.3),s*.35,0,-1.3));g.add(t);return g;}
function radarModel(){const g=new T3.Group();g.add(mesh(new T3.BoxGeometry(2.6,1.2,2.6),std('#7a8288',.2,.6),0,.6,0));g.add(mesh(new T3.CylinderGeometry(.18,.24,1.8,6),std('#5a6066',.6,.4),0,2,0));
 const t=new T3.Group();t.name='tur';t.position.y=2.9;const dish=mesh(new T3.SphereGeometry(1.6,16,8,0,TAU,0,Math.PI/2.6),std('#e8ecef',.3,.4));dish.rotation.x=-Math.PI/2.2;dish.material.side=T3.DoubleSide;t.add(dish);
 const tip=new T3.Mesh(new T3.SphereGeometry(.2,8,6),basic('#ff5a5a'));tip.position.set(0,.3,-.9);tip.name='light';t.add(tip);g.add(t);return g;}
function depotModel(){const g=new T3.Group(),mt=std('#d8d2c2',.4,.4),mr=std('#c23b3b',.3,.5);for(const[x,z]of[[-1.3,0],[1.3,0]]){g.add(mesh(new T3.CylinderGeometry(1.2,1.2,1.8,14),mt,x,.9,z));g.add(mesh(new T3.CylinderGeometry(1.22,1.22,.25,14),mr,x,1.3,z));}
 g.add(mesh(new T3.BoxGeometry(3.6,.15,.2),std('#555',.6,.4),0,.4,1.1));return g;}
function mastModel(){const g=new T3.Group(),md=std('#9aa0a6',.6,.4);g.add(mesh(new T3.BoxGeometry(1.8,.6,1.8),std('#5a6066',.3,.6),0,.3,0));
 for(const[a,b]of[[-.4,-.4],[.4,-.4],[-.4,.4],[.4,.4]])g.add(mesh(new T3.BoxGeometry(.12,6.4,.12),md,a*(1-.2),3.5,b*(1-.2)));
 for(let y=1;y<6.5;y+=1.2)g.add(mesh(new T3.BoxGeometry(.9,.08,.9),md,0,y,0));g.add(mesh(new T3.CylinderGeometry(.5,.5,.12,10).rotateZ(Math.PI/2),std('#e8ecef',.3,.4),.4,5.6,0));
 const l=new T3.Mesh(new T3.SphereGeometry(.28,8,6),basic('#ff3c50'));l.position.y=6.9;l.name='light';g.add(l);return g;}
function bunkerModel(){const g=new T3.Group(),mc=std('#7d7a70',.05,.95);const dome=mesh(new T3.SphereGeometry(2.2,16,8,0,TAU,0,Math.PI/2),mc);dome.scale.y=.6;g.add(dome);
 const d=new T3.Group();d.name='door';d.position.y=.2;d.add(mesh(new T3.BoxGeometry(2.2,.5,.6),std('#3a3d40',.6,.4),0,0,-1.9));for(const s of[-.5,0,.5])d.add(mesh(new T3.CylinderGeometry(.1,.1,1.2,6).rotateX(Math.PI/2),std('#1d2126',.7,.3),s,0,-2.4));g.add(d);return g;}
function factoryModel(){const g=new T3.Group();g.add(mesh(new T3.BoxGeometry(7,2.2,4.6),std('#8a7f72',.1,.85),0,1.1,0));
 for(let i=0;i<3;i++)g.add(mesh(new T3.BoxGeometry(2.2,.7,4.4),std('#5d646b',.4,.5),-2.3+i*2.3,2.5,0));g.add(mesh(new T3.BoxGeometry(7.2,.3,.3),std('#d8a03a',.2,.6),0,.6,2.35));return g;}
function stackModel(){const g=new T3.Group();g.add(mesh(new T3.CylinderGeometry(.55,.75,4.2,10),std('#9a6a52',.1,.85),0,2.1+2,0));g.add(mesh(new T3.CylinderGeometry(.6,.6,.3,10),std('#e8e2d6',.1,.8),0,6,0));
 const l=new T3.Mesh(new T3.SphereGeometry(.18,6,4),basic('#ffb347'));l.position.y=6.3;l.name='light';g.add(l);return g;}
function gateModel(){const g=new T3.Group();g.add(mesh(new T3.BoxGeometry(3,1.8,.5),std('#c9a04a',.3,.5),0,.9,.2));for(let i=0;i<4;i++)g.add(mesh(new T3.BoxGeometry(.6,1.5,.1),std('#2a2c30',.4,.6),-1.05+i*.7,.85,.48));return g;}
// Bulwark: heavy gunship with a thick armoured nose plate (hit it from the sides)
function bulwarkModel(){const g=jetModel({L:46,S:52,sweep:.3,wl:.36,chord:.36,tip:.14,fw:7,tailS:.34,eng:2},'#4f5a63','#ffb347');
 const plate=mesh(new T3.BoxGeometry(3.4,1.1,1.1),std('#9aa4ad',.8,.3),0,.15,-2.1);g.add(plate);
 for(const s of[-1,1])g.add(mesh(new T3.BoxGeometry(.5,.9,2.2),std('#3a4148',.6,.4),s*1.9,.05,-.6));
 const eye=new T3.Mesh(new T3.SphereGeometry(.22,8,6),basic('#ffb347'));eye.position.set(0,.5,-2.4);g.add(eye);return g;}
function playerDrone(k){const g=new T3.Group();if(k==='gundrone'){g.add(mesh(new T3.ConeGeometry(.55,1.6,6).rotateX(-Math.PI/2),std('#c9d2db',.6,.3)));g.add(mesh(new T3.CylinderGeometry(.06,.06,1,6).rotateX(Math.PI/2),std('#22262a',.6,.4),0,0,-.9));}
 else if(k==='laserdrone'){g.add(mesh(new T3.OctahedronGeometry(.7,0),std('#7fb2ff',.7,.2,{em:'#2a5ab0',ei:.6,flat:1})));}
 else{const m=mesh(new T3.CylinderGeometry(.7,.7,.25,6),std('#8ad8ff',.6,.2,{em:'#2a7bbf',ei:.8}));g.add(m);}
 const e=new T3.Mesh(new T3.SphereGeometry(.18,8,6),basic('#7fe8ff'));e.position.y=.3;g.add(e);return g;}
const MODELS={};
function buildModels(){
 MODELS.fighter=jetModel({L:36,S:34,sweep:.7,wl:.34,chord:.42,tip:.08,fw:4,tailS:.3,fins:1},'#7f8a94','#d23a3a');
 MODELS.fighter2=jetModel({L:38,S:30,sweep:1,wl:.3,chord:.55,tip:.05,fw:4,tailS:0,canard:1},'#5c6670','#ff8a1f');
 MODELS.heli=heliModel('#5a6650','#d23a3a');MODELS.hornet=heliModel('#7a3a2a','#ffd23f',true);
 MODELS.bomber=bomberModel();MODELS.drone=(()=>{const o=new T3.Group(),d=droneModel();d.scale.setScalar(1.5);o.add(d);return o;})();
 MODELS.aegis=jetModel({L:38,S:36,sweep:.5,wl:.36,chord:.4,tip:.12,fw:4.5,tailS:.32,fins:1},'#3a6ab0','#e9eef2');MODELS.aegis.add(shieldBall(2.6,'#5fd0ff'));
 MODELS.lancer=lancerModel();MODELS.hydra=hydraModel();MODELS.wraith=wraithModel();MODELS.sower=ufoModel();MODELS.mine=mineModel();MODELS.mender=menderModel();MODELS.blink=blinkModel();
 MODELS.bulwark=bulwarkModel();
 MODELS.tower=towerModel();MODELS.radar=radarModel();MODELS.depot=depotModel();MODELS.mast=mastModel();MODELS.bunker=bunkerModel();MODELS.factory=factoryModel();MODELS.stack=stackModel();MODELS.gate=gateModel();
 MODELS.tank=tankModel('#59633f');MODELS.aa=aaModel();MODELS.truck=truckModel();MODELS.boat=boatModel();MODELS.sam=samModel();MODELS.artillery=artyModel();MODELS.dome=domeModel();
 for(const k in PLANES){const p=PLANES[k];MODELS['pl_'+k]=k==='falcon'&&typeof falconModel==='function'?falconModel(p.jet):jetModel(p.jet,p.body,p.accent);}
 for(const k in DRONES)MODELS['dr_'+k]=playerDrone(k);
 if(typeof SF!=='undefined'&&SF.extraModels)SF.extraModels();}
const POOL={};
function acquire(type){const pool=POOL[type]||(POOL[type]=[]);let m=pool.pop();
 if(!m){m=MODELS[type].clone();if(type==='wraith')m.traverse(o=>{if(o.isMesh)o.material=o.material.clone();});if(type==='aegis'||type==='dome')m.traverse(o=>{if(o.name==='shield')o.material=o.material.clone();});
  m.R={rotor:[],tur:null,shield:null,ring:[]};m.traverse(o=>{if(o.name==='rotor')m.R.rotor.push(o);else if(o.name==='tur')m.R.tur=o;else if(o.name==='shield')m.R.shield=o;else if(o.name.startsWith('ring'))m.R.ring.push(o);else if(o.name==='trot')m.R.trot=o;else if(o.name==='light'||o.name==='orb'||o.name==='tip')m.R.light=o;else if(o.name==='door')m.R.door=o;else if(o.name==='track')m.R.track=o;});scene.add(m);}
 m.visible=true;m.userData.type=type;return m;}
function release(m){if(!m)return;m.visible=false;(POOL[m.userData.type]||(POOL[m.userData.type]=[])).push(m);}
// bosses
function bossTurret(){const g=new T3.Group();g.add(mesh(new T3.CylinderGeometry(1.5,1.7,.8,16),std('#6a7078',.6,.35)));const gun=new T3.Group();gun.name='gun';gun.position.y=.7;gun.add(mesh(new T3.BoxGeometry(1.3,.8,1.5),std('#4b5158',.6,.4)));
 for(const s of[-1,1])gun.add(mesh(new T3.CylinderGeometry(.17,.17,2.6,8).rotateX(Math.PI/2),std('#1d2126',.7,.3),s*.35,0,-1.9));g.add(gun);return g;}
function bossModel(st){const k=st.boss.kind,c=st.boss.hull,g=new T3.Group(),mb=std(c,.55,.38),ml=std(st.boss.hull,.4,.5),md=std('#22262c',.6,.4),mw=std('#d2d6db',.3,.5);
 const P=(pts)=>pts.map(([x,y])=>[x*K,-y*K]);let info;
 if(k==='ship'){g.add(mesh(shapeGeo(P([[-170,-36],[120,-42],[160,-20],[174,0],[160,20],[120,42],[-170,36]]),2.6,.15),mb,0,-1.8,0));
  g.add(mesh(shapeGeo(P([[-160,-28],[115,-33],[150,-10],[160,0],[150,10],[115,33],[-160,28]]),.1),std('#8a7a5a',.1,.8),0,.85,0));
  g.add(mesh(new T3.BoxGeometry(9,2.6,4.4),mw,2.5,2.1,0));g.add(mesh(new T3.BoxGeometry(5,2,2.8),mw,2,4.2,0));g.add(mesh(new T3.CylinderGeometry(.9,1.1,3,12),md,5.2,4,0));g.add(mesh(new T3.CylinderGeometry(.08,.08,6,5),md,0,6,0));
  info={rx:165,ry:42,tur:[[-125,0],[-65,0],[100,0]],core:[25,0],ty:1.3,ground:1};}
 else if(k==='wing'){g.add(mesh(shapeGeo(P([[0,62],[170,-6],[160,-30],[95,-40],[45,-62],[0,-50],[-45,-62],[-95,-40],[-160,-30],[-170,-6]]),1.4,.3),mb,0,-.7,0));
  const hump=mesh(new T3.SphereGeometry(1,20,12),ml);hump.scale.set(3.2,1.4,5.5);hump.position.set(0,.6,0);g.add(hump);
  for(const[x,y]of[[-70,-46],[-25,-58],[25,-58],[70,-46]]){g.add(mesh(new T3.CylinderGeometry(1,1.1,3.4,12).rotateX(Math.PI/2),md,x*K,.2,y*K));const f=new T3.Mesh(new T3.CircleGeometry(.85,12),basic('#ffb347'));f.position.set(x*K,.2,y*K-1.75);f.rotation.y=Math.PI;g.add(f);}
  info={rx:160,ry:52,tur:[[-115,-4],[115,-4],[-52,18],[52,18]],core:[0,-8],ty:1.4};}
 else if(k==='land'){for(const sx of[-1,1])for(const sy of[-1,1])g.add(mesh(new T3.BoxGeometry(4,2.6,7),std('#1c1d1b',.2,.8),sx*11.8,1.3,sy*5.8));
  g.add(mesh(shapeGeo(P([[-80,-88],[80,-88],[112,-50],[112,50],[80,88],[-80,88],[-112,50],[-112,-50]]),3,.2),mb,0,1.6,0));
  g.add(mesh(new T3.BoxGeometry(12,1,14),ml,0,4.9,0));for(let i=0;i<6;i++)g.add(mesh(new T3.BoxGeometry(1,.6,.5),md,-5+i*2,4.9,7.6));
  info={rx:138,ry:82,tur:[[-88,-46],[88,-46],[-88,46],[88,46]],core:[0,0],ty:5.6,ground:1};}
 else{const b=mesh(new T3.SphereGeometry(1,24,16),mb);b.scale.set(4.2,3,10.8);g.add(b);g.add(mesh(new T3.BoxGeometry(18.4,.6,2.2),md,0,0,.8));
  const cn=new T3.Mesh(new T3.SphereGeometry(1,16,12),glassMat);cn.scale.set(2,1.4,1.6);cn.position.set(0,.8,9.4);g.add(cn);
  for(const z of[-7.2,6.2]){const r=rotor(8.8,3);r.position.set(0,3.4,z);g.add(r);g.add(mesh(new T3.CylinderGeometry(.5,.7,1.4,8),md,0,2.8,z));}
  info={rx:78,ry:100,tur:[[-74,8],[74,8],[0,92]],core:[0,-20],ty:.8};}
 const turs=info.tur.map(([dx,dy])=>{const t=bossTurret();t.position.set(dx*K,info.ty,dy*K);g.add(t);return t;});
 const coreM=new T3.MeshStandardMaterial({color:col('#ffb347'),emissive:col('#ff7a1f'),emissiveIntensity:1.5,metalness:.2,roughness:.3});
 const core=new T3.Mesh(new T3.SphereGeometry(1.9,24,16),coreM);core.position.set(info.core[0]*K,info.ty+.4,info.core[1]*K);g.add(core);
 const ring=new T3.Mesh(new T3.TorusGeometry(2.6,.18,8,32),new T3.MeshBasicMaterial({color:0x7fd8ff,transparent:true,opacity:.6}));ring.rotation.x=Math.PI/2;ring.position.copy(core.position);g.add(ring);
 g.traverse(o=>{if(o.isMesh)o.castShadow=true;});const rots=[];g.traverse(o=>{if(o.name==='rotor')rots.push(o);});
 return{g,turs,core,coreM,ring,rots,info,kind:k};}
