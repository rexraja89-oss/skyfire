'use strict';
// ============ FORMATIONS + GROUND SETUPS (new engine) ============
// Builds SF.FORMATIONS / SF.GROUND_SETUPS from data, moves members along smoothed paths, and tracks each
// group so destroying all of it (nothing escaped) pays a bonus.
(()=>{
const Fm=SF.formations={groups:{}};
// screen-fraction y -> logic y (supports values above/below the visible screen)
const yf=f=>f<0?lyAt(0)+f*500:f>1?lyAt(1)+(f-1)*500:lyAt(f);
// ---------- paths ----------
const cache={};
function compile(name,mirror,shift){const k=name+(mirror?'m':'')+shift+':'+H;if(cache[k])return cache[k];const P=SF.PATHS[name];
 const pts=P.pts.map(([x,y])=>({x:((mirror?1-x:x)+shift)*W,y:yf(y)}));
 // Catmull-Rom through the points, sampled densely, with an arc-length table
 const out=[];const N=pts.length;const at=i=>pts[clamp(i,0,N-1)];
 for(let i=0;i<N-1;i++){const p0=at(i-1),p1=at(i),p2=at(i+1),p3=at(i+2);for(let s=0;s<16;s++){const t=s/16,t2=t*t,t3=t2*t;
  out.push({x:.5*((2*p1.x)+(-p0.x+p2.x)*t+(2*p0.x-5*p1.x+4*p2.x-p3.x)*t2+(-p0.x+3*p1.x-3*p2.x+p3.x)*t3),y:.5*((2*p1.y)+(-p0.y+p2.y)*t+(2*p0.y-5*p1.y+4*p2.y-p3.y)*t2+(-p0.y+3*p1.y-3*p2.y+p3.y)*t3)});}}
 out.push(pts[N-1]);const cum=[0];for(let i=1;i<out.length;i++)cum.push(cum[i-1]+Math.hypot(out[i].x-out[i-1].x,out[i].y-out[i-1].y));
 return cache[k]={pts:out,cum,len:cum[cum.length-1],then:P.then};}
const q={x:0,y:0,a:0};
Fm.sample=(P,s)=>{const c=P.cum,n=c.length;if(s<=0){const a=Math.atan2(P.pts[1].y-P.pts[0].y,P.pts[1].x-P.pts[0].x);q.x=P.pts[0].x+Math.cos(a)*s;q.y=P.pts[0].y+Math.sin(a)*s;q.a=a;return q;}
 if(s>=P.len){const a=Math.atan2(P.pts[n-1].y-P.pts[n-2].y,P.pts[n-1].x-P.pts[n-2].x);q.x=P.pts[n-1].x;q.y=P.pts[n-1].y;q.a=a;return q;}
 let lo=0,hi=n-1;while(hi-lo>1){const m=(lo+hi)>>1;if(c[m]<=s)lo=m;else hi=m;}const t=(s-c[lo])/((c[hi]-c[lo])||1),A=P.pts[lo],B=P.pts[hi];
 q.x=A.x+(B.x-A.x)*t;q.y=A.y+(B.y-A.y)*t;q.a=Math.atan2(B.y-A.y,B.x-A.x);return q;};
// ---------- groups ----------
function newGroup(kind,name,x,y){const id=SF.enemies.newGroup();Fm.groups[id]={id,kind,name,total:0,killed:0,escaped:0,x,y,done:false};return id;}
function track(id,e){if(!e)return;const g=Fm.groups[id];g.total++;e.fgroup=id;}
SF.on('kill',({e})=>{const g=Fm.groups[e.fgroup];if(!g||g.done)return;g.killed++;g.x=e.x;g.y=e.y;check(g);});
SF.on('escape',({e})=>{const g=Fm.groups[e.fgroup];if(!g||g.done)return;g.escaped++;check(g);});
function check(g){if(g.killed+g.escaped<g.total)return;g.done=true;if(g.escaped===0&&g.total>=2)SF.emit(g.kind==='air'?'formationClear':'setupClear',{name:g.name,n:g.total,x:g.x,y:g.y});delete Fm.groups[g.id];}
Fm.reset=()=>{Fm.groups={};};
// ---------- spawning ----------
// spawn('vDrop',{enemy:'dart', x:-.2, mirror:true, hpMul})
Fm.spawn=(name,o={})=>{const F=SF.FORMATIONS[name];if(!F){console.warn('unknown formation',name);return 0;}
 const id=newGroup('air',F.name,W/2,0);
 for(const g of F.groups){const mirror=!!(g.mirror^!!o.mirror),shift=(g.x||0)+(o.x||0),P=compile(g.path,mirror,shift),n=g.count,speed=g.speed;
  for(let i=0;i<n;i++){const type=(g.enemies&&g.enemies[i])||g.enemy||o.enemy||'dart',common={group:id,path:P,ps:0,then:g.then||'',hold:g.hold||0,mv:{type:'path',speed},hpMul:o.hpMul};
   let e;
   if(g.stream){const q0=Fm.sample(P,0);e=SF.enemies.spawn(type,Object.assign(common,{x:q0.x,y:q0.y,delay:(g.delay||0)+i*g.gap}));}
   else{const S=SF.SHAPES[g.shape][i%SF.SHAPES[g.shape].length],sl=[S[0]*g.spacing*(mirror?-1:1),S[1]*g.spacing],q0=Fm.sample(P,0);
    e=SF.enemies.spawn(type,Object.assign(common,{x:q0.x+sl[0],y:q0.y+sl[1],slot:sl,spin:g.spin||0,delay:g.delay||0}));}
   track(id,e);}}
 return id;};
// spawnSetup('outpost',{x:.5}) - ground pieces around an anchor; x is a fraction of the width
Fm.spawnSetup=(name,o={})=>{const S=SF.GROUND_SETUPS[name];if(!S){console.warn('unknown setup',name);return 0;}
 const ax=o.x!==undefined?o.x*W:W/2,ay=-50,id=newGroup('ground',S.name,ax,ay);
 for(const pc of S.pieces){const e=SF.enemies.spawn(pc.t,{x:clamp(ax+pc.dx,20,W-20),y:ay+pc.dy,group:id,hpMul:o.hpMul});track(id,e);if(e&&e.kids)for(const k of e.kids)track(id,k);}
 return id;};
})();
