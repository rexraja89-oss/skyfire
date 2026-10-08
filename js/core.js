'use strict';
// Shared globals and helpers. Every js/ file is a classic script; top-level const/let/function are shared across files.
const PAGES='https://rexraja89-oss.github.io/skyfire/';
const IN_APP=!!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform());
const $=id=>document.getElementById(id);
const W=400,TAU=Math.PI*2,SCROLL=70,K=.1,GY=-25;let H=900,OH=888,OW=400,KZ=K,oS=1,cssS=1;
const rnd=(a,b)=>a+Math.random()*(b-a),ri=(a,b)=>Math.floor(a+Math.random()*(b-a+1)),pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,sst=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const fmt=n=>Math.floor(n).toLocaleString('en-US');
function prune(a,f,rm){let j=0;for(let i=0;i<a.length;i++){if(f(a[i]))a[j++]=a[i];else if(rm)rm(a[i]);}a.length=j;}
function srng(seed){let s=(seed>>>0)||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}


// ============ SF namespace: event bus, pools, spatial grid ============
const SF=window.SF={};
// event bus: systems talk through events (kill, hit, pickup, levelup, purchase...) instead of calling each other
SF.ev={};
SF.on=(n,f)=>{(SF.ev[n]||(SF.ev[n]=[])).push(f);};
SF.off=(n,f)=>{const a=SF.ev[n];if(a){const i=a.indexOf(f);if(i>=0)a.splice(i,1);}};
SF.emit=(n,d)=>{const a=SF.ev[n];if(a)for(let i=0;i<a.length;i++){try{a[i](d);}catch(e){console.error(e);}}};
// fixed-capacity object pool with an active list (no allocation in the hot loop)
SF.Pool=function(make,cap){this.make=make;this.cap=cap;this.free=[];this.live=[];};
SF.Pool.prototype.get=function(){if(this.live.length>=this.cap)return null;const o=this.free.pop()||this.make();o._i=this.live.length;this.live.push(o);return o;};
SF.Pool.prototype.kill=function(o){const L=this.live,i=o._i;if(i===undefined||L[i]!==o)return;const last=L.pop();if(last!==o){L[i]=last;last._i=i;}o._i=undefined;this.free.push(o);};
SF.Pool.prototype.clear=function(){for(const o of this.live){o._i=undefined;this.free.push(o);}this.live.length=0;};
// uniform grid for broad-phase collision (logic space)
SF.Grid=function(cell,w,h){this.c=cell;this.nx=Math.ceil(w/cell)+4;this.ny=Math.ceil(h/cell)+8;this.cells=[];for(let i=0;i<this.nx*this.ny;i++)this.cells.push([]);this.used=[];};
SF.Grid.prototype.reset=function(){for(const i of this.used)this.cells[i].length=0;this.used.length=0;};
SF.Grid.prototype.key=function(x,y){const gx=clamp(Math.floor(x/this.c)+2,0,this.nx-1),gy=clamp(Math.floor(y/this.c)+4,0,this.ny-1);return gy*this.nx+gx;};
SF.Grid.prototype.add=function(o,x,y,r){const c=this.c,x0=Math.floor((x-r)/c),x1=Math.floor((x+r)/c),y0=Math.floor((y-r)/c),y1=Math.floor((y+r)/c);
 for(let gy=y0;gy<=y1;gy++)for(let gx=x0;gx<=x1;gx++){const k=this.key(gx*c+1,gy*c+1),cl=this.cells[k];if(!cl.length)this.used.push(k);cl.push(o);}};
SF.Grid.prototype.at=function(x,y){return this.cells[this.key(x,y)];};
