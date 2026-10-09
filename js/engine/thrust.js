'use strict';
// ============ ENGINE THRUST ============
// Animated afterburner flames for the player's jet: soft heat glow, a tapered plume with a hot white core,
// pulsing shock diamonds and flicker. The flame stretches when the jet climbs (moves up) or has Overdrive.
// Nozzle positions come from the jet's art (J.nozzles, fractions of the picture) or fall back to J.eng/J.fw.
(()=>{
const Th=SF.thrust={};
// flame palettes: hot core, inner plume, outer plume, glow, core fade, ember colour
const PAL={orange:{hot:'rgba(255,255,255,',mid:'rgba(255,214,120,',out:'rgba(255,120,40,',glow:'rgba(255,110,40,',fade:'rgba(200,230,255,',fade2:'rgba(140,190,255,',ember:'#ffb347'},
 purple:{hot:'rgba(255,255,255,',mid:'rgba(230,170,255,',out:'rgba(140,60,255,',glow:'rgba(150,80,255,',fade:'rgba(220,200,255,',fade2:'rgba(120,140,255,',ember:'#c79bff'},
 blue:{hot:'rgba(255,255,255,',mid:'rgba(150,240,255,',out:'rgba(30,150,255,',glow:'rgba(40,160,255,',fade:'rgba(190,250,255,',fade2:'rgba(90,200,255,',ember:'#7fe8ff'}};
function plume(x0,y0,w,len,dx,dy,stops,alpha){ // teardrop from (x0,y0) along (dx,dy), width w, length len (screen px)
 const nx=-dy,ny=dx,tx=x0+dx*len,ty=y0+dy*len,g=cx.createLinearGradient(x0,y0,tx,ty);
 for(const [o,c,a] of stops)g.addColorStop(o,c+(a*alpha).toFixed(3)+')');
 cx.fillStyle=g;cx.beginPath();cx.moveTo(x0+nx*w*.5,y0+ny*w*.5);
 cx.bezierCurveTo(x0+nx*w*.62+dx*len*.3,y0+ny*w*.62+dy*len*.3,x0+nx*w*.18+dx*len*.8,y0+ny*w*.18+dy*len*.8,tx,ty);
 cx.bezierCurveTo(x0-nx*w*.18+dx*len*.8,y0-ny*w*.18+dy*len*.8,x0-nx*w*.62+dx*len*.3,y0-ny*w*.62+dy*len*.3,x0-nx*w*.5,y0-ny*w*.5);
 cx.closePath();cx.fill();}
Th.nozzles=(J,bank)=>{const c=Math.cos(bank*.75);
 if(J.nozzles&&J.artW)return J.nozzles.map(([fx,fy])=>[fx*J.artW*c,fy*J.artL]);
 const n=J.eng||1,out=[];for(let i=0;i<n;i++)out.push([(n===1?0:(i-(n-1)/2)*J.fw*1.2)*c,(J.flameY||J.L/2)]);return out;};
Th.draw=(R,px,py)=>{const p=R.p,J=p.pl.jet,t=R.t,hq=save.hq;
 const climb=Math.min(1,Math.max(0,-p.vy)/700),od=R.eff&&R.eff.overdrive?1:0,boost=1+climb*.6+od*.35;
 const noz=Th.nozzles(J,p.bank),sz=J.nozzleR||2.6,COL=PAL[J.flame]||PAL.orange;
 cx.globalCompositeOperation='lighter';
 noz.forEach(([dx,dy],i)=>{pj(px+dx,py+dy);const x0=PX,y0=PY,s=PS;pj(px+dx,py+dy+10);let ux=PX-x0,uy=PY-y0;const ul=Math.hypot(ux,uy)||1;ux/=ul;uy/=ul;
  const fl=.88+.12*Math.sin(t*61+i*2.1)+.06*Math.sin(t*137+i*5.3)+(Math.random()-.5)*.08;
  const len=(30+16*climb)*boost*fl*s,w=sz*2.6*s*(1+.15*climb);
  // heat glow around the nozzle
  const gr=cx.createRadialGradient(x0,y0,0,x0,y0,w*2.6);gr.addColorStop(0,COL.glow+(.55*fl).toFixed(3)+')');gr.addColorStop(1,COL.glow+'0)');cx.fillStyle=gr;cx.beginPath();cx.arc(x0,y0,w*2.6,0,TAU);cx.fill();
  // outer plume
  plume(x0,y0,w*1.25,len*1.15,ux,uy,[[0,COL.mid,.85],[.25,COL.out,.75],[.7,COL.out,.25],[1,COL.out,0]],1);
  // inner core
  plume(x0,y0,w*.62,len*.62,ux,uy,[[0,COL.hot,1],[.4,COL.fade,.85],[1,COL.fade2,0]],1);
  // shock diamonds
  if(hq)for(let k=0;k<3;k++){const f=.16+k*.15,a=(.55-k*.14)*(.7+.3*Math.sin(t*40+k*1.7+i));const dx2=x0+ux*len*f,dy2=y0+uy*len*f;
   cx.fillStyle='rgba(255,250,235,'+a.toFixed(3)+')';cx.beginPath();cx.ellipse(dx2,dy2,w*.32*(1-k*.18),w*.5*(1-k*.18),Math.atan2(uy,ux)+Math.PI/2,0,TAU);cx.fill();}
  // embers
  if(hq&&Math.random()<.25*boost)SF.fx.spark(px+dx+rnd(-1,1),py+dy+len/s*.6,COL.ember,1,.35);});
 cx.globalCompositeOperation='source-over';};
})();
