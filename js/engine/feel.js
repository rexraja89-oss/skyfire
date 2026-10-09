'use strict';
// ============ FEEL ============
// Focus: when the finger leaves the screen, time slows (SF.BAL.focus) while the Focus meter lasts; touching again
// restores full speed. While the finger is up, an ability ring appears around the jet (Skyburst, Shield, Overdrive)
// with cooldown rings; tap one to use it. Also: kill-streak words, the radar pulse at the start of a flight and
// ORION's gear milestones. All values in SF.BAL.focus / abilities / streak.
(()=>{
const F=()=>SF.BAL.focus,AB=()=>SF.BAL.abilities,ST=()=>SF.BAL.streak;
const Fe=SF.feel={};
Fe.start=R=>{const f=F();R.focus={m:f.max,a:0,ring:0,touched:false,down:false,empty:false,was:false};
 R.ab={shield:AB().shield.first,overdrive:AB().overdrive.first};R.streak={n:0,last:-9,step:0,word:null};R.pulse=1.4;R.gearMs=0;};
// ---------- touch ----------
Fe.touchDown=()=>{const R=SF.R;if(R&&R.focus){R.focus.touched=true;R.focus.down=true;}};
Fe.touchUp=()=>{const R=SF.R;if(R&&R.focus)R.focus.down=false;};
const lifted=R=>R.focus&&R.focus.touched&&!R.focus.down&&R.p.alive&&R.p.dying<=0&&!R.over;
Fe.active=R=>!!(R&&save.focus!==false&&lifted(R)&&!R.focus.empty&&R.focus.m>0);
// time scale for the main loop (1 = normal)
Fe.scale=R=>R&&R.focus?1-(1-F().scale)*R.focus.a:1;
// real-time update (runs at real speed, not slowed)
Fe.realTick=(R,dt)=>{const f=R.focus,P=F();if(!f)return;const on=Fe.active(R);
 if(on){f.m=Math.max(0,f.m-dt);if(f.m<=0)f.empty=true;}else{f.m=Math.min(P.max,f.m+dt*P.regen);if(f.empty&&f.m>=P.restart)f.empty=false;}
 f.a+=((on?1:0)-f.a)*Math.min(1,dt*P.ease);f.ring+=((lifted(R)?1:0)-f.ring)*Math.min(1,dt*10);
 if(on&&!f.was){sfx('focusIn');duck(.5,.15,.5);say('focus','Time slows while your finger is up. Tap an ability around the jet.',1,600);}
 else if(!on&&f.was)sfx('focusOut');f.was=on;};
// ---------- abilities ----------
const SLOTS=[{k:'burst',dx:0,dy:-58},{k:'shield',dx:-52,dy:-20},{k:'overdrive',dx:52,dy:-20}];
function slotPos(R,s,px,py){pj(px,py);return{x:clamp(PX+s.dx,22,OW-22),y:clamp(PY+s.dy,22,OH-22)};}
function ready(R,k){if(k==='burst')return R.p.charges>0&&!R.p.burst;return R.ab[k]<=0&&!R.eff[k];}
function frac(R,k){const S=SF.BAL.special;if(k==='burst')return R.p.charges>0?1:R.p.meter/S.meterMax;
 const e=R.eff[k];if(e)return e.t/e.max;return 1-Math.max(0,R.ab[k])/AB()[k].cd;}
Fe.use=(R,k)=>{if(!R||R.over||!R.p.alive||R.p.dying>0||!ready(R,k))return false;
 if(k==='burst')return SF.run.special(),true;
 const A=AB()[k],D=SF.PICKUPS[k],p=R.p;R.ab[k]=A.cd;
 if(k==='shield'){R.eff.shield={t:D.duration,max:D.duration,hits:D.hits};sfx('shieldUp');SF.fx.ring(p.x,p.y,40,D.color,.45);SF.fx.pop(p.x,p.y-24,'SHIELD',true);}
 else{R.eff.overdrive={t:D.duration,max:D.duration};sfx('over');SF.fx.ring(p.x,p.y,50,D.color,.5);R.banner={t:'OVERDRIVE',l:1.1,sub:'+'+D.levels+' WEAPON LEVELS'};}
 vib(30);SF.run.updHud();return true;};
// a tap on the canvas: returns true if it hit an ability button (then no drag starts)
Fe.tap=q=>{const R=SF.R;if(!R||!R.focus||R.focus.ring<.5)return false;const p=R.p;
 for(const s of SLOTS){const b=slotPos(R,s,p.x,p.y);if((q.x-b.x)**2+(q.y-b.y)**2<28*28){Fe.use(R,s.k);return true;}}return false;};
// ---------- per-step ----------
Fe.step=(R,dt)=>{if(!R.ab)return;for(const k in R.ab)if(!R.eff[k]&&R.ab[k]>0)R.ab[k]-=dt;
 if(R.pulse>0)R.pulse-=dt;
 const s=R.streak;if(s.word){s.word.l-=dt;if(s.word.l<=0)s.word=null;}
 const M=ST().gearMilestones;if(R.gearMs<M.length&&R.gears>=M[R.gearMs]){const v=M[R.gearMs++];say('gm'+v,v+' gears in the hold. Keep collecting!',1,999);}};
SF.on('kill',()=>{const R=SF.R;if(!R||!R.streak)return;const s=R.streak,S=ST();
 if(R.t-s.last<=S.gap)s.n++;else{s.n=1;s.step=0;}s.last=R.t;
 const tier=S.tiers[s.step];if(tier&&s.n>=tier.n){s.step++;const v=Math.round(tier.bonus*SF.scoring.mult(R));R.score+=v;s.word={t:tier.word,v,l:1.3,big:s.step};sfx('streak',s.step);}});
// ---------- drawing (overlay, screen space) ----------
function icon(k,x,y,r,on){cx.save();cx.translate(x,y);cx.fillStyle=on?'#ffffff':'rgba(255,255,255,.45)';cx.strokeStyle=cx.fillStyle;cx.lineWidth=2;cx.lineJoin='round';cx.beginPath();
 if(k==='burst'){for(let i=0;i<3;i++){const a=-Math.PI/2+i*TAU/3;cx.lineTo(Math.cos(a)*r*.6,Math.sin(a)*r*.6);}cx.closePath();cx.stroke();cx.beginPath();cx.arc(0,0,r*.16,0,TAU);cx.fill();}
 else if(k==='shield'){cx.moveTo(0,-r*.58);cx.lineTo(r*.48,-r*.36);cx.lineTo(r*.42,r*.12);cx.quadraticCurveTo(r*.25,r*.48,0,r*.62);cx.quadraticCurveTo(-r*.25,r*.48,-r*.42,r*.12);cx.lineTo(-r*.48,-r*.36);cx.closePath();cx.fill();}
 else{cx.moveTo(r*.12,-r*.6);cx.lineTo(-r*.34,r*.08);cx.lineTo(-r*.02,r*.08);cx.lineTo(-r*.16,r*.6);cx.lineTo(r*.36,-r*.12);cx.lineTo(r*.04,-r*.12);cx.closePath();cx.fill();}
 cx.restore();}
const COL={burst:'#ffb352',shield:'#38c8ff',overdrive:'#ff5a4a'};
Fe.draw=(R,px,py)=>{const f=R.focus;if(!f)return;const p=R.p;
 // start-of-flight radar pulse
 if(R.pulse>0&&p.alive){pj(px,py);const t=1.4-R.pulse;cx.globalCompositeOperation='lighter';
  for(let i=0;i<3;i++){const u=t*1.1-i*.22;if(u<0||u>1)continue;cx.strokeStyle=`rgba(80,255,200,${(1-u)*.7})`;cx.lineWidth=2.5*(1-u)+1;cx.beginPath();cx.ellipse(PX,PY,u*170,u*150,0,0,TAU);cx.stroke();}
  cx.globalCompositeOperation='source-over';}
 // Focus tint
 if(f.a>.01){cx.save();cx.setTransform(oS,0,0,oS,0,0);cx.fillStyle=`rgba(20,60,110,${.16*f.a})`;cx.fillRect(0,0,OW,OH);
  cx.strokeStyle=`rgba(120,220,255,${.5*f.a})`;cx.lineWidth=2;const m=10,l=26;
  for(const[x,y,sx,sy]of[[m,m,1,1],[OW-m,m,-1,1],[m,OH-m,1,-1],[OW-m,OH-m,-1,-1]]){cx.beginPath();cx.moveTo(x,y+sy*l);cx.lineTo(x,y);cx.lineTo(x+sx*l,y);cx.stroke();}cx.restore();}
 if(f.ring<.02||!p.alive)return;
 cx.globalAlpha=f.ring;
 // Focus meter around the jet + hull %
 pj(px,py);const jx=PX,jy=PY,P=F();
 cx.strokeStyle='rgba(0,0,0,.35)';cx.lineWidth=4;cx.beginPath();cx.arc(jx,jy,30,0,TAU);cx.stroke();
 cx.strokeStyle=f.empty?'rgba(255,120,90,.8)':'rgba(120,220,255,.85)';cx.lineWidth=2.5;cx.beginPath();cx.arc(jx,jy,30,-Math.PI/2,-Math.PI/2+TAU*f.m/P.max);cx.stroke();
 const hp=Math.ceil(p.hp/p.max*100);cx.font='600 11px "Chakra Petch", sans-serif';cx.textAlign='center';cx.textBaseline='middle';
 cx.fillStyle='rgba(0,0,0,.6)';cx.fillText(hp+'%',jx+1,jy+45);cx.fillStyle=hp<30?'#ff6a7a':'#ffffff';cx.fillText(hp+'%',jx,jy+44);
 // ability buttons
 for(const s of SLOTS){const b=slotPos(R,s,px,py),on=ready(R,s.k),fr=clamp(frac(R,s.k),0,1),c=COL[s.k],r=19,act=s.k!=='burst'&&R.eff[s.k];
  cx.fillStyle=on?'rgba(10,30,40,.7)':'rgba(10,20,26,.55)';cx.beginPath();cx.arc(b.x,b.y,r,0,TAU);cx.fill();
  cx.strokeStyle='rgba(255,255,255,.18)';cx.lineWidth=3;cx.beginPath();cx.arc(b.x,b.y,r+3,0,TAU);cx.stroke();
  cx.strokeStyle=on?c:act?'#ffffff':'rgba(255,210,90,.9)';cx.lineWidth=3;cx.beginPath();cx.arc(b.x,b.y,r+3,-Math.PI/2,-Math.PI/2+TAU*fr);cx.stroke();
  if(on){cx.globalCompositeOperation='lighter';dg(b.x,b.y,r*1.6,c);cx.globalCompositeOperation='source-over';}
  icon(s.k,b.x,b.y,r,on);
  if(s.k==='burst'&&p.charges>1){cx.fillStyle='#fff';cx.font='600 10px "Chakra Petch", sans-serif';cx.fillText('×'+p.charges,b.x+r-2,b.y-r+2);}}
 cx.globalAlpha=1;cx.textBaseline='alphabetic';};
// streak words: large text in the middle of the screen
Fe.drawWord=R=>{const w=R.streak&&R.streak.word;if(!w)return;const t=1.3-w.l,a=Math.min(1,w.l*2.5),s=t<.12?.6+t/.12*.5:1.1-Math.min(.1,(t-.12)*.4);
 cx.save();cx.setTransform(oS,0,0,oS,0,0);cx.globalAlpha=a;cx.textAlign='center';cx.textBaseline='middle';cx.translate(OW/2,OH*.46);cx.scale(s,s);
 cx.font=(22+w.big*5)+'px Bungee, Impact, sans-serif';cx.lineWidth=5;cx.strokeStyle='rgba(0,0,0,.55)';cx.strokeText(w.t,0,0);
 const g=cx.createLinearGradient(0,-16,0,16);g.addColorStop(0,'#ffffff');g.addColorStop(1,w.big>=3?'#ffb352':w.big===2?'#9ff7ff':'#d8ffe9');cx.fillStyle=g;cx.fillText(w.t,0,0);
 cx.font='600 14px "Chakra Petch", sans-serif';cx.lineWidth=3;cx.strokeText('+'+fmt(w.v),0,24);cx.fillStyle='#ffd27a';cx.fillText('+'+fmt(w.v),0,24);cx.restore();};
})();
