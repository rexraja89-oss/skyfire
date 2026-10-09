'use strict';
// ============ v5.14 NAVAL MODELS (Storm Fleet) ============
// Original warship designs, bow toward -z (up the screen; the ships steam north while the sea scrolls south).
//  battleship: long armoured hull with a sheer line, wooden deck, superstructure tower, twin funnels, tripod mast with
//              radar, boats and AA tubs. Main turrets are separate parts (navalTurret) so they can aim and be destroyed.
//  destroyer:  slim hull, one forward turret (aims), bridge, funnel, mast.
//  navalTurret / navalAA: aimable mounts used as battleship parts.
SF.navalModels=()=>{
 const steel=std('#4f575e',.55,.42),steelD=std('#363c42',.6,.45),hullC=std('#3a4046',.5,.5),deck=std('#6c6558',.05,.85),red=std('#5a2420',.1,.8),dark=std('#1c2024',.7,.35),
  pale=std('#8c949a',.5,.4),black=std('#121416',.2,.9),glass=glassMat;
 const hull=(L,B,fore,aft,h)=>{const pts=[[0,L/2],[B*.32,L/2-fore*.45],[B/2,L/2-fore],[B/2,-L/2+aft],[B*.36,-L/2],[-B*.36,-L/2],[-B/2,-L/2+aft],[-B/2,L/2-fore],[-B*.32,L/2-fore*.45]];
  const g=new T3.Group();g.add(mesh(shapeGeo(pts,h,.06),hullC,0,-h*.55,0));g.add(mesh(shapeGeo(pts.map(([x,y])=>[x*1.01,y*1.004]),.28),red,0,-h*.62,0));   // boot-topping at the waterline
  g.add(mesh(shapeGeo(pts.map(([x,y])=>[x*.93,y*.97]),.06),deck,0,h*.45+.01,0));return g;};
 // ---- battleship ----
 {const g=hull(22,4.4,6,3.5,1.7);
  const tw=new T3.Group();tw.position.z=.6;g.add(tw);
  tw.add(mesh(new T3.BoxGeometry(2.6,1.1,4.4),steel,0,1.3,0));tw.add(mesh(new T3.BoxGeometry(2.1,1,3),steel,0,2.3,-.3));tw.add(mesh(new T3.BoxGeometry(1.6,.9,1.8),steel,0,3.2,-.6));
  tw.add(mesh(new T3.BoxGeometry(1.7,.25,.08),glass,0,3.3,-1.52));tw.add(mesh(new T3.BoxGeometry(2.3,.25,.08),glass,0,2.4,-1.82));
  for(const s of[-1,1])tw.add(mesh(new T3.BoxGeometry(.5,.12,1.4),steelD,s*1.25,2.85,-.8));   // bridge wings
  const mast=new T3.Group();mast.position.set(0,3.6,-.2);for(const s of[-1,0,1]){const l=mesh(new T3.CylinderGeometry(.06,.08,3.4,5),pale,s*.35,1.6,s?.3:-.2);l.rotation.z=s*-.1;mast.add(l);}
  mast.add(mesh(new T3.BoxGeometry(1.8,.08,.1),pale,0,2.6,0));const rd=mesh(new T3.BoxGeometry(1.2,.35,.12),dark,0,3.2,0);rd.name='rotor';mast.add(rd);tw.add(mast);
  for(const[z,r]of[[2.7,.55],[4.4,.5]]){g.add(mesh(new T3.CylinderGeometry(r,r*1.1,2.1,12),steel,0,1.95,z));g.add(mesh(new T3.CylinderGeometry(r*.95,r*.95,.25,12),black,0,3.05,z));}   // funnels
  for(const s of[-1,1]){for(const z of[1.8,3.4,5])g.add(mesh(new T3.CylinderGeometry(.32,.36,.3,10),steelD,s*1.75,1,z));   // AA tubs
   for(const z of[2.6,4.2]){const b=mesh(new T3.CylinderGeometry(.22,.22,1.1,8),std('#d8d4c8',.1,.6),s*1.55,1.25,z);b.rotation.x=Math.PI/2;g.add(b);}}   // boats
  g.add(mesh(new T3.CylinderGeometry(.05,.05,1.2,5),pale,0,1.3,-10.4));   // jack staff
  g.userData.ship=1;g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});MODELS.battleship=g;}
 // ---- destroyer ----
 {const g=hull(13.5,2.5,4,2.2,1.2);
  g.add(mesh(new T3.BoxGeometry(1.5,.9,2.2),steel,0,1,-.6));g.add(mesh(new T3.BoxGeometry(1.2,.7,1.2),steel,0,1.8,-.9));g.add(mesh(new T3.BoxGeometry(1.1,.2,.06),glass,0,1.95,-1.52));
  g.add(mesh(new T3.CylinderGeometry(.42,.48,1.5,10),steel,0,1.3,1.5));g.add(mesh(new T3.CylinderGeometry(.4,.4,.2,10),black,0,2.1,1.5));
  const mast=mesh(new T3.CylinderGeometry(.05,.07,2.6,5),pale,0,2.6,-.3);g.add(mast);const rd=mesh(new T3.BoxGeometry(.8,.25,.1),dark,0,3.7,-.3);rd.name='rotor';g.add(rd);
  for(const z of[3.2,4.6])g.add(mesh(new T3.CylinderGeometry(.28,.3,.25,8),steelD,0,.8,z));
  const t=new T3.Group();t.name='tur';t.position.set(0,.85,-3.4);t.add(mesh(new T3.CylinderGeometry(.6,.7,.5,12),steelD));const hd=mesh(new T3.BoxGeometry(1,.55,1.2),steel,0,.35,0);t.add(hd);
  for(const s of[-1,1])t.add(mesh(new T3.CylinderGeometry(.07,.08,1.8,6).rotateX(Math.PI/2),dark,s*.2,.38,-1.3));g.add(t);
  g.userData.ship=1;g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});MODELS.destroyer=g;}
 // ---- main turret (battleship part): armoured gun house, three long barrels ----
 {const g=new T3.Group();g.add(mesh(new T3.CylinderGeometry(1.05,1.15,.5,16),steelD,0,.25,0));const t=new T3.Group();t.name='tur';t.position.y=.6;
  t.add(mesh(shapeGeo([[-.95,-1],[.95,-1],[1.05,.6],[.6,1.2],[-.6,1.2],[-1.05,.6]],.75,.04),steel,0,-.15,0));t.add(mesh(new T3.BoxGeometry(.5,.16,.5),dark,.4,.65,.3));
  for(const s of[-1,0,1])t.add(mesh(new T3.CylinderGeometry(.08,.1,3,7).rotateX(Math.PI/2),dark,s*.38,.25,-2.3));g.add(t);
  g.traverse(o=>{if(o.isMesh)o.castShadow=true;});MODELS.navalTurret=g;}
 // ---- AA mount ----
 {const g=new T3.Group();g.add(mesh(new T3.CylinderGeometry(.45,.5,.3,10),steelD,0,.15,0));const t=new T3.Group();t.name='tur';t.position.y=.4;t.add(mesh(new T3.BoxGeometry(.6,.35,.6),steel));
  for(const s of[-1,1])t.add(mesh(new T3.CylinderGeometry(.04,.04,1,5).rotateX(Math.PI/2),dark,s*.15,.1,-.6));g.add(t);g.traverse(o=>{if(o.isMesh)o.castShadow=true;});MODELS.navalAA=g;}};
