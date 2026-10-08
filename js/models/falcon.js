'use strict';
// ============ FALCON (Rex's design) ============
// Built from Rex's own concept art (art/card_falcon.png): a dark gunmetal arrowhead delta with a long needle nose,
// smoked canopy, twin canted dorsal fins, glowing red light strips, red wingtips and twin engines.
// Model space: nose toward -Z, up is +Y, length L, span S (world units). Shapes are drawn top-down with +y = nose.
function falconPanelTex(){const N=512,c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d');
 // base gunmetal with soft variation
 g.fillStyle='#8e959e';g.fillRect(0,0,N,N);const R=srng(17);
 for(let i=0;i<40;i++){g.fillStyle=`rgba(${R()<.5?255:0},${R()<.5?255:0},${R()<.5?255:0},.035)`;g.fillRect(R()*N,R()*N,30+R()*120,20+R()*90);}
 // panel lines in planform coordinates (u: span -.5..5, v: nose .5 .. tail -.5)
 const P=(u,v)=>[(u+.5)*N,(.5-v)*N];const line=(pts,w=1.4,a=.55)=>{g.strokeStyle=`rgba(20,22,26,${a})`;g.lineWidth=w;g.beginPath();pts.forEach((p,i)=>{const[x,y]=P(...p);i?g.lineTo(x,y):g.moveTo(x,y);});g.stroke();};
 for(const s of[-1,1]){
  line([[s*.04,.36],[s*.07,.05],[s*.08,-.4]]);                       // spine edges
  line([[s*.09,.12],[s*.42,-.22]]);line([[s*.1,.0],[s*.36,-.24]]);    // chevron panels along the leading edge
  line([[s*.13,-.1],[s*.13,-.38]]);line([[s*.2,-.15],[s*.27,-.28]]);
  line([[s*.3,-.2],[s*.46,-.32]],1,.4);
  for(let k=0;k<4;k++)line([[s*(.16+k*.05),-.06-k*.05],[s*(.18+k*.05),-.1-k*.05]],1,.45);   // access hatches
  g.fillStyle='rgba(240,244,248,.75)';const[x,y]=P(s*.3,-.2);g.fillRect(x-3,y-1.5,6,3); // small white markings
  const[x2,y2]=P(s*.22,-.08);g.fillRect(x2-1.5,y2-4,3,8);}
 line([[0,.48],[0,.3]],1,.5);
 const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t;}
function falconModel(o){const T3=THREE,L=o.L*K,S=o.S*K,g=new T3.Group();
 const tex=falconPanelTex();tex.wrapS=tex.wrapT=T3.ClampToEdgeWrapping;
 // planform shapes are in (x,y) with y toward the nose; UVs map the planform onto the panel texture
 const uvFit=geo=>{const p=geo.attributes.position,uv=geo.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/S+.5,-p.getZ(i)/L+.5);};
 const flat=(pts,depth,bevel,mat,y=0)=>{const s=new T3.Shape();s.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)s.lineTo(pts[i][0],pts[i][1]);s.closePath();
  const geo=new T3.ExtrudeGeometry(s,{depth,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:1,steps:1});geo.rotateX(-Math.PI/2);geo.translate(0,y-depth/2,0);
  geo.computeVertexNormals();uvFit(geo);const m=mesh(geo,mat);return m;};
 const hull=new T3.MeshStandardMaterial({color:col('#7a828c'),map:tex,metalness:.5,roughness:.34});
 const dark=new T3.MeshStandardMaterial({color:col('#4e555e'),map:tex,metalness:.5,roughness:.38});
 const red=new T3.MeshBasicMaterial({color:col('#ff3a2a')}),redDim=new T3.MeshStandardMaterial({color:col('#7a1410'),emissive:col('#ff2a1a'),emissiveIntensity:1.2,roughness:.5});
 const glass=new T3.MeshStandardMaterial({color:col('#6a6f78'),metalness:.85,roughness:.06,transparent:true,opacity:.88,emissive:col('#2a1c1c'),emissiveIntensity:.5});
 const X=f=>f*S,Y=f=>f*L;
 // 1. main delta wing (thin, chamfered); cranked trailing edge with notched tips
 g.add(flat([[0,Y(.5)],[X(.07),Y(.24)],[X(.47),Y(-.2)],[X(.5),Y(-.29)],[X(.41),Y(-.27)],[X(.27),Y(-.25)],[X(.17),Y(-.4)],[X(.1),Y(-.47)],
  [X(-.1),Y(-.47)],[X(-.17),Y(-.4)],[X(-.27),Y(-.25)],[X(-.41),Y(-.27)],[X(-.5),Y(-.29)],[X(-.47),Y(-.2)],[X(-.07),Y(.24)]].map(([x,y])=>[x,y]),L*.022,L*.012,hull,0));
 // 2. raised centre body: long faceted spine from the needle nose to the engines
 const spine=flat([[0,Y(.5)],[X(.05),Y(.3)],[X(.085),Y(.05)],[X(.1),Y(-.25)],[X(.09),Y(-.46)],[X(-.09),Y(-.46)],[X(-.1),Y(-.25)],[X(-.085),Y(.05)],[X(-.05),Y(.3)]],L*.05,L*.03,dark,L*.03);
 g.add(spine);
 // 3. smoked canopy, faceted
 const can=new T3.Mesh(new T3.SphereGeometry(1,10,6,0,Math.PI*2,0,Math.PI/2),glass);can.scale.set(X(.055),L*.045,L*.15);can.position.set(0,L*.07,-Y(.14));can.castShadow=true;g.add(can);
 const frame=mesh(new T3.BoxGeometry(L*.006,L*.012,L*.22),dark,0,L*.1,-Y(.12));g.add(frame);
 // 4. twin dorsal fins / intake pods, canted outward
 const finS=new T3.Shape();finS.moveTo(0,0);finS.lineTo(L*.36,0);finS.lineTo(L*.07,L*.12);finS.lineTo(0,L*.12);finS.closePath();   // tall at the back, sloping forward
 const finG=new T3.ExtrudeGeometry(finS,{depth:L*.03,bevelEnabled:true,bevelThickness:L*.006,bevelSize:L*.006,bevelSegments:1});finG.rotateY(Math.PI/2);finG.computeVertexNormals();
 for(const s of[-1,1]){const f=mesh(finG,hull,s*X(.11),L*.035,Y(.43));f.rotation.z=-s*.42;g.add(f);
  g.add(mesh(new T3.BoxGeometry(L*.012,L*.012,L*.06),red,s*X(.16),L*.15,Y(.4)));            // fin-top red lights
  // red light bar on the body side (the glowing grille under the canopy)
  for(let i=0;i<6;i++)g.add(mesh(new T3.BoxGeometry(L*.016,L*.026,L*.02),red,s*X(.104),L*.05,-Y(.11)+i*L*.03));   // segmented glowing grille
  // wingtip lights and red leading-edge tips
  g.add(mesh(new T3.BoxGeometry(L*.05,L*.02,L*.06),red,s*X(.48),L*.014,-Y(-.27)));
  g.add(mesh(new T3.BoxGeometry(L*.015,L*.01,L*.06),redDim,s*X(.25),L*.014,-Y(.0)));
  // twin engines with dark nozzles and hot cores
  const nz=mesh(new T3.CylinderGeometry(L*.032,L*.038,L*.08,10,1,true).rotateX(Math.PI/2),std('#1c1f24',.7,.35),s*X(.05),L*.025,Y(.47));g.add(nz);
  const fl=new T3.Mesh(new T3.CircleGeometry(L*.03,12),basic('#ff7a3a'));fl.position.set(s*X(.05),L*.025,Y(.51));g.add(fl);}
 // 5. needle nose tip
 g.add(mesh(new T3.ConeGeometry(L*.012,L*.1,6).rotateX(-Math.PI/2),dark,0,L*.03,-Y(.52)));
 return g;}
