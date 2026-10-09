'use strict';
// ============ REX'S ART ============
// Hand-made pictures in art/ replace the code-built models. Each picture is optional: if art/<name>.png is missing
// the game keeps its built-in model. Pictures are drawn top-down, nose up; a transparent background is best,
// a plain black background is cut out automatically. The image is cropped to the visible pixels and laid flat in
// the 3D world, so it gets the scene lighting, casts a real shadow and tilts when the jet banks.
(()=>{
const A=SF.art={tex:{},list:[]};
// load art/<name>.png; resolves to a cropped canvas or null
A.load=name=>new Promise(res=>{const im=new Image();im.onload=()=>res(prep(im));im.onerror=()=>res(null);im.src='art/'+name+'.png?v='+BUILD;});
function prep(im){const w=im.naturalWidth,h=im.naturalHeight;if(!w||!h)return null;
 const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.drawImage(im,0,0);
 const d=g.getImageData(0,0,w,h),p=d.data;let opaque=true;for(let i=3;i<p.length;i+=16)if(p[i]<250){opaque=false;break;}
 if(opaque)for(let i=0;i<p.length;i+=4){const m=Math.max(p[i],p[i+1],p[i+2]);if(m<24)p[i+3]=0;else if(m<60)p[i+3]=Math.round((m-24)/36*255);} // black background -> transparent
 let x0=w,y0=h,x1=-1,y1=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(p[(y*w+x)*4+3]>20){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
 if(x1<0)return null;g.putImageData(d,0,0);
 const o=document.createElement('canvas');o.width=x1-x0+1;o.height=y1-y0+1;o.getContext('2d').drawImage(c,x0,y0,o.width,o.height,0,0,o.width,o.height);return o;}
// a flat, lit, shadow-casting mesh; len = nose-to-tail length in world units
// Rendered pictures already carry their own lighting, so they are drawn unlit (true colours).
A.flat=(cv,len,wid)=>{const T3=THREE,t=new T3.CanvasTexture(cv);t.encoding=T3.sRGBEncoding;t.anisotropy=4;
 const geo=new T3.PlaneGeometry(wid||len*cv.width/cv.height,len);geo.rotateX(-Math.PI/2);
 const m=new T3.Mesh(geo,new T3.MeshBasicMaterial({map:t,transparent:true,alphaTest:.3,side:T3.DoubleSide}));
 m.customDepthMaterial=new T3.MeshDepthMaterial({depthPacking:T3.RGBADepthPacking,map:t,alphaTest:.35});m.castShadow=true;return m;};
// swap a model group's built-in meshes for the picture
A.swap=(group,cv,len,wid)=>{for(const ch of group.children)ch.visible=false;const m=A.flat(cv,len,wid);m.userData.art=1;group.userData.flat=1;group.add(m);return m;};
// player jets: art/jet_<plane>.png
A.have=new Set();
// per-picture extras: exhaust nozzles as fractions of the picture from its centre (x right, y toward the tail)
const META={jet_falcon:{nozzles:[[-.05,.4],[.05,.4]],nozzleR:2.2},jet_viper:{nozzles:[[-.2,.417],[.2,.417]],nozzleR:2.8},
 jet_titan:{nozzles:[[-.111,.43],[-.001,.48],[.109,.43]],nozzleR:3.2,flame:'blue',size:1.15}};
A.applyJets=async()=>{for(const k in PLANES){if(!A.have.has('jet_'+k))continue;const cv=await A.load('jet_'+k);if(!cv)continue;const g=MODELS['pl_'+k];if(!g)continue;
  // fit inside the jet's box: span up to S×1.75, length up to L×1.4 (logic px)
  const J=PLANES[k].jet,M=META['jet_'+k]||{},f=Math.min(J.S*1.75/cv.width,J.L*1.4/cv.height)*(M.size||1),w=cv.width*f,l=cv.height*f;
  A.swap(g,cv,l*K,w*K);J.flameY=l/2-2;J.artW=w;J.artL=l;if(M.nozzles){J.nozzles=M.nozzles;J.nozzleR=M.nozzleR;J.flame=M.flame;}A.list.push('jet_'+k);}};
// art/list.json names the pictures that exist (so the game never asks for missing files)
// hangar cards: art/card_<plane>.jpg|png, shown as a framed picture on the jet's hangar card
A.cards={};
A.applyCards=()=>{for(const f of A.have){const m=/^card_(\w+)\.(jpg|png)$/.exec(f);if(!m||!PLANES[m[1]])continue;const im=new Image();
  im.onload=()=>{A.cards[m[1]]=im;if(typeof PV!=='undefined')delete PV[m[1]];if(state==='hangar'&&typeof renderHangar==='function')renderHangar();};im.src='art/'+f+'?v='+BUILD;}};
A.init=()=>fetch('art/list.json?v='+BUILD).then(r=>r.ok?r.json():[]).catch(()=>[]).then(l=>{A.have=new Set(l||[]);A.applyCards();return A.applyJets();}).catch(e=>console.warn('art',e));
})();
