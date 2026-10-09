'use strict';
// ============ v5.5 GROUND TARGET MODELS ============
// Original designs: stilt battery (gun on a four-legged steel platform, casts a long shadow), rail turret (carriage on a
// fixed track: the 'track' child is counter-moved so the rails stay put while the gun slides), pop-up dome turret,
// buried pop-up mine, lattice power pylon. Built from simple shapes like the other models in world.js.
SF.extraModels=()=>{
 const steel=std('#5d646c',.6,.4),dark=std('#22262b',.65,.35),rust=std('#7a5a44',.3,.7),con=std('#8c877c',.05,.85);
 // stilt battery
 {const g=new T3.Group();for(const sx of[-1,1])for(const sz of[-1,1]){const l=mesh(new T3.BoxGeometry(.35,4.6,.35),steel,sx*1.6,2.3,sz*1.6);l.rotation.set(sz*.12,0,-sx*.12);g.add(l);}
  for(const y of[1.4,3]){g.add(mesh(new T3.BoxGeometry(3.6,.14,.14),dark,0,y,1.55));g.add(mesh(new T3.BoxGeometry(3.6,.14,.14),dark,0,y,-1.55));g.add(mesh(new T3.BoxGeometry(.14,.14,3.6),dark,1.55,y,0));g.add(mesh(new T3.BoxGeometry(.14,.14,3.6),dark,-1.55,y,0));}
  g.add(mesh(new T3.BoxGeometry(4,.35,4),steel,0,4.7,0));const t=new T3.Group();t.name='tur';t.position.y=5.3;
  t.add(mesh(new T3.CylinderGeometry(1.4,1.6,.9,8),std('#4a5058',.6,.38)));t.add(mesh(new T3.BoxGeometry(1.2,.7,1.4),dark,0,.55,0));
  for(const s of[-1,1])t.add(mesh(new T3.CylinderGeometry(.15,.15,2.6,8).rotateX(Math.PI/2),dark,s*.38,.5,-1.6));
  const lt=new T3.Mesh(new T3.SphereGeometry(.22,8,6),basic('#ff4a6a'));lt.position.set(0,.95,.5);lt.name='light';t.add(lt);g.add(t);MODELS.stilt=g;}
 // rail turret
 {const g=new T3.Group(),tr=new T3.Group();tr.name='track';for(const sz of[-.6,.6])tr.add(mesh(new T3.BoxGeometry(13,.18,.22),steel,0,.12,sz));
  for(let i=-6;i<=6;i++)tr.add(mesh(new T3.BoxGeometry(.3,.1,1.8),rust,i,.05,0));g.add(tr);
  g.add(mesh(new T3.BoxGeometry(2.2,.6,1.8),steel,0,.5,0));const t=new T3.Group();t.name='tur';t.position.y=1.1;t.add(mesh(new T3.BoxGeometry(1.3,.7,1.3),std('#4b5158',.6,.4)));
  for(const s of[-1,0,1])t.add(mesh(new T3.CylinderGeometry(.11,.11,2,6).rotateX(Math.PI/2),dark,s*.32,.05,-1.3));g.add(t);MODELS.railgun=g;}
 // pop-up dome turret: armoured dome, the gun rises when it opens ('door' moves up)
 {const g=new T3.Group();g.add(mesh(new T3.CylinderGeometry(2.1,2.3,.5,16),con,0,.25,0));
  const d=mesh(new T3.SphereGeometry(1.7,16,10,0,TAU,0,Math.PI/2),std('#6a7076',.55,.35),0,.4,0);g.add(d);
  const door=new T3.Group();door.name='door';door.position.y=.2;const t=new T3.Group();t.name='tur';t.add(mesh(new T3.CylinderGeometry(.7,.8,.8,10),dark,0,1.4,0));
  for(const s of[-1,1])t.add(mesh(new T3.CylinderGeometry(.1,.1,1.6,6).rotateX(Math.PI/2),dark,s*.25,1.5,-1));door.add(t);g.add(door);MODELS.domegun=g;}
 // buried pop-up mine
 {const g=new T3.Group();g.add(mesh(new T3.CylinderGeometry(1,1.1,.35,12),std('#3a3c38',.5,.5),0,.17,0));for(let i=0;i<6;i++){const a=i/6*TAU;const sp=mesh(new T3.ConeGeometry(.16,.6,5),steel,Math.cos(a)*.8,.45,Math.sin(a)*.8);sp.rotation.set(Math.sin(a)*.7,0,-Math.cos(a)*.7);g.add(sp);}
  const l=new T3.Mesh(new T3.SphereGeometry(.25,8,6),basic('#ff3020'));l.position.y=.4;l.name='light';g.add(l);MODELS.popmine=g;}
 // lattice power pylon
 {const g=new T3.Group(),m=std('#7c8288',.6,.4);for(const sx of[-1,1])for(const sz of[-1,1]){const l=mesh(new T3.BoxGeometry(.18,9,.18),m,sx*.9,4.5,sz*.9);l.rotation.set(sz*-.09,0,sx*.09);g.add(l);}
  for(let y=1;y<9;y+=1.6){const w=1.9-y*.1;g.add(mesh(new T3.BoxGeometry(w,.08,.08),m,0,y,.9-y*.05));g.add(mesh(new T3.BoxGeometry(w,.08,.08),m,0,y,-.9+y*.05));g.add(mesh(new T3.BoxGeometry(.08,.08,w),m,.9-y*.05,y,0));g.add(mesh(new T3.BoxGeometry(.08,.08,w),m,-.9+y*.05,y,0));}
  g.add(mesh(new T3.BoxGeometry(5,.2,.2),m,0,8.2,0));for(const s of[-1,1])g.add(mesh(new T3.CylinderGeometry(.12,.12,.5,6),std('#d8dde2',.2,.4),s*2.3,7.9,0));MODELS.pylon=g;}
 for(const k of['stilt','railgun','domegun','popmine','pylon'])MODELS[k].traverse(o=>{if(o.isMesh){o.castShadow=true;}});
 if(SF.navalModels)SF.navalModels();};
