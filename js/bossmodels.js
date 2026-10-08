'use strict';
// ============ BOSS MODELS ============
// Builds a boss/mini-boss 3D model from its data: a BODY plus one named NODE per part, placed at the part's
// logic offset (dx -> world x, dy -> world z). When a part is destroyed its node is hidden and a scorched stump
// appears, so the player sees the weapon is gone. Bodies: ship, carrier, sub, wing, throne, land, walker,
// gunship, segment, or 'enemy:<model>' (a scaled copy of an enemy model, used by mini-bosses).
// Part meshes: turret, twin, launcher, shieldGen, engine, scythe, rotor, dish, hangar, leg, segment, armor, core.
const BossModels={cache:{}};
(()=>{
const P=pts=>pts.map(([x,y])=>[x*K,-y*K]);
function body(kind,c,o){const g=new T3.Group(),mb=std(c,.55,.38),md=std('#22262c',.6,.4),mw=std('#d2d6db',.3,.5),ml=std(shadeHex(c,.15),.4,.5);let top=1.3;
 if(kind==='ship'||kind==='carrier'){const L=kind==='carrier'?180:170,Wd=kind==='carrier'?52:42;
  g.add(mesh(shapeGeo(P([[-L,-Wd*.85],[L*.7,-Wd],[L*.94,-Wd*.5],[L,0],[L*.94,Wd*.5],[L*.7,Wd],[-L,Wd*.85]]),2.6,.15),mb,0,-1.8,0));
  g.add(mesh(shapeGeo(P([[-L+10,-Wd*.68],[L*.68,-Wd*.8],[L*.88,-Wd*.25],[L*.94,0],[L*.88,Wd*.25],[L*.68,Wd*.8],[-L+10,Wd*.68]]),.1),std(kind==='carrier'?'#3a3f45':'#8a7a5a',.1,.8),0,.85,0));
  if(kind==='carrier'){for(let i=-6;i<=6;i++)g.add(mesh(new T3.BoxGeometry(.5,.02,.1),std('#e8e2c6',.1,.8),i*2.2,.97,0));g.add(mesh(new T3.BoxGeometry(5,4,3),mw,3,2.8,-4.2));}
  else{g.add(mesh(new T3.BoxGeometry(6,2.2,3.6),mw,-.5,2,0));g.add(mesh(new T3.CylinderGeometry(.08,.08,5,5),md,-1,5,0));}
  top=1.1;}
 else if(kind==='sub'){const b=mesh(new T3.SphereGeometry(1,24,12),mb);b.scale.set(3.4,2,15);b.rotation.y=Math.PI/2;g.add(b);g.add(mesh(new T3.BoxGeometry(2.4,3,4.5),ml,0,2.2,-1.5));top=1.8;}
 else if(kind==='wing'||kind==='throne'){const s=kind==='throne'?1.15:1;g.add(mesh(shapeGeo(P([[0,62*s],[170*s,-6],[160*s,-30],[95*s,-40],[45*s,-62*s],[0,-50*s],[-45*s,-62*s],[-95*s,-40],[-160*s,-30],[-170*s,-6]]),1.4,.3),mb,0,-.7,0));
  const h=mesh(new T3.SphereGeometry(1,20,12),ml);h.scale.set(3.2*s,1.4,5.5*s);h.position.y=.6;g.add(h);
  if(kind==='throne'){const r=new T3.Mesh(new T3.TorusGeometry(7.5,.35,8,40),std('#ff7a1f',.3,.4,{em:'#ff4a10',ei:1.2}));r.rotation.x=Math.PI/2;r.position.y=.8;r.name='halo';g.add(r);}
  top=1.4;}
 else if(kind==='land'||kind==='walker'){const w=kind==='walker'?100:112,h=kind==='walker'?80:88;
  if(kind==='land')for(const sx of[-1,1])for(const sy of[-1,1])g.add(mesh(new T3.BoxGeometry(4,2.6,7),std('#1c1d1b',.2,.8),sx*11.8,1.3,sy*5.8));
  g.add(mesh(shapeGeo(P([[-w*.7,-h],[w*.7,-h],[w,-h*.55],[w,h*.55],[w*.7,h],[-w*.7,h],[-w,h*.55],[-w,-h*.55]]),3,.2),mb,0,kind==='walker'?4.5:1.6,0));
  g.add(mesh(new T3.BoxGeometry(10,1,12),ml,0,kind==='walker'?7.8:4.9,0));top=kind==='walker'?8.4:5.6;}
 else if(kind==='gunship'){const b=mesh(new T3.SphereGeometry(1,24,16),mb);b.scale.set(4.2,3,10.8);g.add(b);g.add(mesh(new T3.BoxGeometry(18.4,.6,2.2),md,0,0,.8));
  const cn=new T3.Mesh(new T3.SphereGeometry(1,16,12),glassMat);cn.scale.set(2,1.4,1.6);cn.position.set(0,.8,9.4);g.add(cn);top=.8;}
 else if(kind==='segment'){const hd=mesh(new T3.SphereGeometry(1,18,12),mb);hd.scale.set(3.6,2.4,4.2);hd.position.y=1.6;g.add(hd);
  for(const s of[-1,1]){const m=mesh(new T3.ConeGeometry(.6,3,6),md,s*2,1.4,3.4);m.rotation.x=Math.PI/2.4;g.add(m);}top=2.8;}
 else if(kind.startsWith('enemy:')){const src=MODELS[kind.slice(6)];const m=src.clone();m.scale.setScalar(o.scale||2);g.add(m);top=(o.top||.6);}
 return {g,top};}
function shadeHex(c,f){const[r,gg,b]=hexRGB(c),t=f<0?0:255,p=Math.abs(f);const h=v=>Math.round(v).toString(16).padStart(2,'0');return '#'+h(r+(t-r)*p)+h(gg+(t-gg)*p)+h(b+(t-b)*p);}
function partMesh(kind,c,r){const g=new T3.Group(),mm=std('#5a6068',.6,.38),md=std('#1d2126',.7,.3),s=r/20;
 if(kind==='turret'||kind==='twin'){g.add(mesh(new T3.CylinderGeometry(1.5*s,1.7*s,.8,16),std('#6a7078',.6,.35)));const gun=new T3.Group();gun.name='gun';gun.position.y=.7;gun.add(mesh(new T3.BoxGeometry(1.3*s,.8,1.5*s),std('#4b5158',.6,.4)));
  const n=kind==='twin'?3:2;for(let i=0;i<n;i++)gun.add(mesh(new T3.CylinderGeometry(.17*s,.17*s,2.8*s,8).rotateX(Math.PI/2),md,(i-(n-1)/2)*.35*s,0,-1.9*s));g.add(gun);}
 else if(kind==='launcher'){g.add(mesh(new T3.BoxGeometry(2.6*s,1.2,2.2*s),mm,0,.6,0));const gun=new T3.Group();gun.name='gun';gun.position.y=1.3;const rk=new T3.Group();rk.rotation.x=.45;
  for(let i=0;i<6;i++)rk.add(mesh(new T3.CylinderGeometry(.22*s,.22*s,1.6*s,8).rotateX(Math.PI/2),std('#e8eaec',.2,.5),((i%3)-1)*.55*s,(i<3?.25:-.25)*s,0));gun.add(rk);g.add(gun);}
 else if(kind==='shieldGen'){g.add(mesh(new T3.CylinderGeometry(.6*s,1*s,2.6,8),std('#8a929c',.6,.3),0,1.3,0));const o=new T3.Mesh(new T3.SphereGeometry(.8*s,14,10),basic('#7fe8ff'));o.position.y=2.9;o.name='glow';g.add(o);
  const r=new T3.Mesh(new T3.TorusGeometry(1.3*s,.12,6,24),basic('#4fc8ff'));r.rotation.x=Math.PI/2;r.position.y=2.9;g.add(r);}
 else if(kind==='engine'){const n=mesh(new T3.CylinderGeometry(1.1*s,1.3*s,4.2*s,14).rotateX(Math.PI/2),std('#4a5058',.6,.35),0,.3,0);g.add(n);const f=new T3.Mesh(new T3.CircleGeometry(.95*s,14),basic('#ffb347'));f.position.set(0,.3,2.15*s);g.add(f);}
 else if(kind==='scythe'){const arm=mesh(new T3.BoxGeometry(1.2*s,.8,6*s),mm,0,.8,1.5*s);g.add(arm);const bl=mesh(shapeGeo([[0,0],[4*s,1.5*s],[5*s,-.5*s],[1*s,-1.2*s]],.25),std('#c8c2b0',.8,.25),-.5*s,1.2,4.5*s);g.add(bl);}
 else if(kind==='rotor'){g.add(mesh(new T3.CylinderGeometry(.9*s,1.1*s,1.6,10),md,0,1.2,0));const ro=rotor(7*s,3);ro.position.y=2.3;g.add(ro);}
 else if(kind==='dish'){g.add(mesh(new T3.CylinderGeometry(.3*s,.4*s,2,6),mm,0,1,0));const d=new T3.Group();d.name='gun';d.position.y=2.2;const di=mesh(new T3.SphereGeometry(1.8*s,14,8,0,TAU,0,Math.PI/2.6),std('#e8ecef',.3,.4));di.rotation.x=-Math.PI/2.2;di.material.side=T3.DoubleSide;d.add(di);g.add(d);}
 else if(kind==='hangar'){g.add(mesh(new T3.BoxGeometry(5*s,1.6,3.4*s),std('#4a5058',.4,.5),0,.8,0));g.add(mesh(new T3.BoxGeometry(4*s,1.1,.2),std('#ffb347',.2,.6,{em:'#ff7a1f',ei:.6}),0,.7,1.72*s));}
 else if(kind==='leg'){g.add(mesh(new T3.BoxGeometry(1.4*s,8,1.4*s),mm,0,4,0));g.add(mesh(new T3.BoxGeometry(3*s,.8,3.4*s),md,0,.4,0));}
 else if(kind==='segment'){const b=mesh(new T3.SphereGeometry(1,16,10),std(c,.55,.4));b.scale.set(2.8*s,2*s,2.6*s);b.position.y=1.4;g.add(b);g.add(mesh(new T3.BoxGeometry(5.4*s,.5,.8*s),md,0,1.2,0));}
 else if(kind==='armor'){g.add(mesh(new T3.BoxGeometry(4.6*s,1.4,1.4*s),std('#9aa4ad',.8,.3),0,.8,0));}
 return g;}
// core: glowing reactor with a shield ring (ring shows while the core is guarded/invulnerable)
function coreMesh(r){const s=r/26,m=new T3.MeshStandardMaterial({color:col('#ffb347'),emissive:col('#ff7a1f'),emissiveIntensity:1.5,metalness:.2,roughness:.3});const g=new T3.Group();
 const c=new T3.Mesh(new T3.SphereGeometry(1.9*s,24,16),m);c.position.y=.4;g.add(c);const ring=new T3.Mesh(new T3.TorusGeometry(2.6*s,.18,8,32),new T3.MeshBasicMaterial({color:0x7fd8ff,transparent:true,opacity:.6}));ring.rotation.x=Math.PI/2;ring.position.y=.4;g.add(ring);
 const sh=new T3.Mesh(new T3.SphereGeometry(3.4*s,20,14),new T3.MeshBasicMaterial({color:col('#5fd0ff'),transparent:true,opacity:.22,blending:T3.AdditiveBlending,depthWrite:false}));sh.position.y=.4;sh.visible=false;g.add(sh);return {g,m,ring,sh};}
const stumpGeo=new T3.CylinderGeometry(.9,1.2,.6,8);
BossModels.build=(id,D)=>{if(BossModels.cache[id])return BossModels.cache[id];const M=D.model,B=body(M.body,M.color||'#59606b',M),g=B.g,nodes={},stumps={};let core=null;
 for(const p of D.parts){const y=(p.y!==undefined?p.y:B.top);let n;
  if(p.kill&&p.mesh!=='none'){core=coreMesh(p.r);n=core.g;}else if(p.mesh&&p.mesh!=='none')n=partMesh(p.mesh,M.color||'#59606b',p.r);else continue;
  n.position.set(p.dx*K,y,p.dy*K);if(p.ry)n.rotation.y=p.ry;g.add(n);nodes[p.id]=n;
  const st=new T3.Mesh(stumpGeo,std('#1a1614',.2,.9));st.position.copy(n.position);st.scale.setScalar(p.r/20);st.visible=false;g.add(st);stumps[p.id]=st;}
 g.traverse(o=>{if(o.isMesh)o.castShadow=true;});const rots=[];g.traverse(o=>{if(o.name==='rotor')rots.push(o);});const halo=g.getObjectByName('halo');
 g.visible=false;scene.add(g);return BossModels.cache[id]={g,nodes,stumps,core,rots,halo};};
BossModels.reset=m=>{m.g.visible=false;m.g.rotation.set(0,0,0);for(const k in m.nodes)m.nodes[k].visible=true;for(const k in m.stumps)m.stumps[k].visible=false;};
})();
