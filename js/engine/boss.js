'use strict';
// ============ BOSS ENGINE ============
// A boss is a 3D body plus destructible PARTS. Each part is a real target in the enemy pipeline (it takes hits,
// scores and drops like any enemy) attached to the boss. Attacks are bound to parts: when a part is destroyed its
// attacks stop and its 3D piece breaks off. PHASES switch on conditions (parts destroyed, health left) and add
// attacks, speed and aggression. A part can be invulnerable until a condition is met (e.g. the core opens when the
// shield generator dies). Boss data: SF.BOSSES (config/bosses.js); bosses without data are built from the stage model.
//
// Condition strings (phases 'when', parts 'vulnerableWhen'):
//   always | !partId (that part destroyed) | parts<=N (destructible parts still standing) | hp<0.5 (kill-part health)
//   several joined with & must all be true.
(()=>{
const deg=Math.PI/180;
const Bs=SF.boss={B:null};
// ---------- conditions ----------
function cond(B,s){if(!s||s==='always')return true;return s.split('&').every(c=>{c=c.trim();
 if(c[0]==='!'){const p=B.parts.find(q=>q.id===c.slice(1));return !p||!p.e.alive;}
 let m=c.match(/^parts<=(\d+)$/);if(m)return B.parts.filter(q=>!q.kill&&q.destructible&&q.e.alive).length<=+m[1];
 m=c.match(/^hp<([\d.]+)$/);if(m){const k=B.parts.find(q=>q.kill);return k&&k.e.hp/k.e.max<+m[1];}
 return false;});}
// default data for a stage whose boss has no hand-made design yet: turrets guard a core (from the stage model)
function fromModel(si){const bm=LV.boss,info=bm.info,k=bm.kind;const pats={ship:['rain','ring','laser'],wing:['fan','spiral','missiles'],land:['fan','ring','missiles'],gunship:['spiral','laser','rain']}[k];
 const base=320+200*si;const parts=info.tur.map(([dx,dy],i)=>({id:'gun'+i,name:'Turret',dx,dy,r:20,hp:base*.16,score:3000,gears:6,node:i,attacks:[{p:'aimed',every:1.7,speed:160,count:1}]}));
 parts.push({id:'core',name:'Core',dx:info.core[0],dy:info.core[1],r:26,hp:base,score:0,gears:0,kill:true,guardedBy:'turrets',guard:.7,attacks:[]});
 const A=n=>({rain:{p:'rain',every:.13,speed:150},ring:{p:'ring',every:1.15,count:18,speed:130,bullet:'heavy'},laser:{p:'laser',every:5,charge:1.1,fire:.7,dmg:16},
  fan:{p:'fan',every:.8,count:7,spread:50,speed:170},spiral:{p:'spiral',every:.09,arms:3,speed:135},missiles:{p:'missiles',every:2.3,count:4,speed:120}})[n];
 return {name:STAGES[si].boss.name,model:'stage',rx:info.rx,ry:info.ry,ground:!!info.ground,move:{type:'sway',amp:k==='ship'?35:65,freq:.45,y:k==='gunship'?.25:k==='land'?.23:.2},
  parts,phases:[{when:'always',attacks:[A(pats[0])]},{when:'hp<.66',attacks:[A(pats[1])],say:'Its armour is cracking. Keep firing!'},
   {when:'hp<.33',attacks:[A(pats[2])],rage:1.35,say:'Reactor exposed! It is getting desperate. Watch for heavy fire.'}],
  summon:si>=4?{every:11-Math.min(4,si-4)*.6,enemy:'drone',count:2+Math.min(3,si-4),mines:si>=7}:null,score:25000*(si+1),gears:30+si*5};}
Bs.defFor=si=>{const id=SF.STAGE_DEFS[si]&&SF.STAGE_DEFS[si].boss;return id&&SF.BOSSES&&SF.BOSSES[id]?SF.BOSSES[id]:fromModel(si);};
// ---------- spawn ----------
Bs.spawn=(R,D,opts={})=>{const hpMul=(opts.hpMul||1)*SF.dm('enemyHp')*(R.diff?R.diff.boss/R.diff.hp:1);
 const B={D,x:W/2,y:-(D.ry||80)-60,ox:W/2,oy:0,t:0,state:'enter',ty:lyAt(D.move.y),phase:-1,attacks:[],rage:1,dying:0,laser:null,sumT:D.summon?D.summon.every:0,mini:!!opts.mini,alive:true,startT:R.t,flash:0};
 B.oy=B.y;B.parts=D.parts.map(P=>{const key='bp_'+(opts.key||'b')+'_'+P.id;
  SF.ENEMIES[key]={name:P.name,model:null,hp:P.hp,r:P.r,score:P.score||0,gears:P.gears||0,charge:6,size:1.6,noCount:false,dropTable:P.kill?'heavy':'standard',move:{type:'attached'},fire:{pattern:'none'},bossPart:true};
  const e=SF.enemies.spawn(key,{x:B.x+P.dx,y:B.y+P.dy,parent:B,dx:P.dx,dy:P.dy,hpMul,group:0});
  e.invuln=true;e.ground=!!D.ground;return {id:P.id,P,e,kill:!!P.kill,destructible:!P.kill,node:P.node,attacks:(P.attacks||[]).map(a=>Object.assign({t:rnd(.5,1.5),from:P.id},a))};});
 R.bossPartsTotal=(R.bossPartsTotal||0)+B.parts.filter(q=>!q.kill).length;
 if(!opts.mini){R.boss=B;R.bossStart=R.t;}
 // 3D: stage boss model or a mini-boss model from the enemy roster
 if(D.model==='stage'){B.m=LV.boss;B.m.g.visible=true;for(const t of B.m.turs){t.visible=true;const g=t.getObjectByName('gun');if(g)g.visible=true;}}
 else if(D.model){B.mm=acquire(D.model);}
 Bs.list.push(B);return B;};
Bs.list=[];
Bs.reset=()=>{for(const B of Bs.list){if(B.mm)release(B.mm);if(B.m)B.m.g.visible=false;}Bs.list.length=0;};
// part destroyed
SF.on('kill',({e})=>{for(const B of Bs.list){const q=B.parts.find(q=>q.e===e);if(!q)continue;const R=SF.R;
 if(q.kill){Bs.die(R,B);return;}
 SF.fx.explode(e.x,e.y,2,B.D.ground);SF.fx.addShake(.3);sfx('boom');if(R)R.bossPartsKilled=(R.bossPartsKilled||0)+1;
 if(B.m&&q.node!==undefined&&B.m.turs[q.node]){const g=B.m.turs[q.node].getObjectByName('gun');if(g)g.visible=false;}
 SF.fx.pop(e.x,e.y-26,(q.P.name||'PART').toUpperCase()+' DESTROYED',true);SF.emit('bossPart',{B,q});
 const left=B.parts.filter(p=>!p.kill&&p.e.alive).length;if(!B.mini)say('bp'+left,left?`${q.P.name} down. ${left} to go.`:'All weapons destroyed. The core is open. Hit it!',left?1:2,0);return;}});
Bs.die=(R,B)=>{if(B.state==='dying')return;B.state='dying';B.dying=B.mini?1.4:2.6;B.laser=null;for(const q of B.parts)if(q.e.alive)SF.enemies.remove(q.e);
 if(!B.mini){SF.enemies.ebPool.clear();R.marks.length=0;R.bossTime=R.t-R.bossStart;}
 SF.emit('bossDown',{B,mini:B.mini});vib(150);};
// ---------- step ----------
const ORIG=(B,id)=>{const q=B.parts.find(p=>p.id===id);return q?{x:q.e.x,y:q.e.y}:{x:B.x,y:B.y};};
Bs.step=(R,dt)=>{for(let i=Bs.list.length-1;i>=0;i--){const B=Bs.list[i];B.ox=B.x;B.oy=B.y;B.t+=dt;if(B.flash>0)B.flash-=dt;const D=B.D,p=R.p;
 if(B.state==='dying'){B.dying-=dt;const rx=D.rx||80,ry=D.ry||60;if(Math.random()<dt*14){SF.fx.explode(B.x+rnd(-rx,rx)*.8,B.y+rnd(-ry,ry)*.8,rnd(1,2.4),D.ground);sfx('pop');SF.fx.addShake(.2);}
  B.y+=dt*(B.mini?30:12);
  if(B.dying<=0){SF.fx.explode(B.x,B.y,B.mini?3:5,D.ground);if(!B.mini){SF.fx.explode(B.x-60,B.y,3);SF.fx.explode(B.x+60,B.y,3);SF.fx.flash=.8;}SF.fx.addShake(B.mini?.5:1);sfx('boom');if(D.ground)addDecal(B.x,B.y,B.mini?40:90);
   for(let k=0;k<(D.gears||10);k++)SF.pickups.drop('gear',B.x+rnd(-40,40),B.y+rnd(-30,30),1);SF.pickups.rollTable('heavy',B.x,B.y,true);
   if(B.mm)release(B.mm);if(B.m)B.m.g.visible=false;Bs.list.splice(i,1);SF.emit('bossGone',{B,mini:B.mini,score:D.score||0});}
  continue;}
 if(B.state==='enter'){B.y+=70*dt;if(B.y>=B.ty-30){B.state='fight';for(const q of B.parts)q.e.invuln=false;}}
 else{const mv=D.move;B.y+=(B.ty-B.y)*dt;if(mv.type==='sway')B.x=W/2+Math.sin(B.t*mv.freq*(B.rage>1?1.3:1))*mv.amp;else if(mv.type==='strafe')B.x=W/2+Math.sin(B.t*mv.freq)*mv.amp+Math.sin(B.t*mv.freq*2.3)*mv.amp*.3;}
 // phases (never go back)
 for(let k=D.phases.length-1;k>B.phase;k--)if(cond(B,D.phases[k].when)){for(let j=B.phase+1;j<=k;j++){const ph=D.phases[j];for(const a of ph.attacks||[])B.attacks.push(Object.assign({t:.8},a));if(ph.rage)B.rage=ph.rage;if(ph.say&&j>0)say('bph'+j+(B.mini?'m':''),ph.say,2,0);if(ph.banner)R.banner={t:ph.banner,l:1.4};}
  if(B.phase>=0){SF.fx.addShake(.4);sfx('warn');}B.phase=k;break;}
 // part vulnerability + guard
 for(const q of B.parts){if(!q.e.alive)continue;q.e.invuln=B.state!=='fight'||(q.P.vulnerableWhen?!cond(B,q.P.vulnerableWhen):false);
  q.e.guard=q.P.guardedBy==='turrets'&&B.parts.some(o=>!o.kill&&o.e.alive)?q.P.guard:0;}
 if(B.state!=='fight')continue;
 // attacks: phase attacks + part attacks of living parts
 const fm=SF.dm('enemyFire')*B.rage,bs=SF.dm('bulletSpeed');
 const run=a=>{a.t-=dt*fm;if(a.t>0)return;a.t=a.every;fireAttack(R,B,a,bs);};
 for(const a of B.attacks){if(a.from&&!B.parts.find(q=>q.id===a.from&&q.e.alive))continue;run(a);}
 for(const q of B.parts)if(q.e.alive)for(const a of q.attacks)run(a);
 if(B.laser)stepLaser(R,B,dt);
 if(D.summon){B.sumT-=dt;if(B.sumT<=0){const s=D.summon;B.sumT=s.every;for(let k=0;k<s.count;k++)SF.enemies.spawn(s.enemy,{x:B.x+(k-(s.count-1)/2)*40,y:B.y+30});if(s.mines)for(const sd of[-1,1])SF.enemies.spawn('mine',{x:B.x+sd*90,y:B.y+20});if(!B.mini)say('summon','It is launching drones!',1,30);}}
 // body contact
 const rx=D.rx||60,ry=D.ry||50;if(!D.ground&&p.alive&&p.dying<=0&&((p.x-B.x)/(rx*.8))**2+((p.y-B.y)/(ry*.8))**2<1)SF.player.hurt(R,25);}};
function fireAttack(R,B,a,bs){const o=ORIG(B,a.from),p=R.p,aim=Math.atan2(p.y-o.y,p.x-o.x),k=a.bullet||'pellet',S=SF.enemies.shoot,sp=a.speed||150;
 switch(a.p){
  case 'aimed':{const n=a.count||1;for(let i=0;i<n;i++)S(o.x,o.y,aim+(i-(n-1)/2)*(a.spread||8)*deg,sp,k);break;}
  case 'fan':{const n=a.count,arc=a.spread*deg;for(let i=0;i<n;i++)S(o.x,o.y+10,aim+(i/(n-1)-.5)*arc,sp,k);break;}
  case 'ring':{const n=a.count;for(let i=0;i<n;i++)S(o.x,o.y,i*TAU/n+B.t,sp,i%2?k:'pellet');break;}
  case 'spiral':{for(let i=0;i<a.arms;i++)S(o.x,o.y,B.t*2.1+i*TAU/a.arms,sp,k);break;}
  case 'rain':S(B.x+rnd(-(B.D.rx||80),B.D.rx||80),B.y+(B.D.ry||40)*.5,Math.PI/2+rnd(-.25,.25),sp*rnd(.8,1.1),k);break;
  case 'missiles':{const n=a.count||4;for(let i=0;i<n;i++)S(o.x+(i-(n-1)/2)*30,o.y,Math.PI/2+(i-(n-1)/2)*.4,sp,'missile');sfx('lance');break;}
  case 'burst':{const n=a.count||3;for(let i=0;i<n;i++)setTimeoutShot(R,B,a,i*(a.gap||.12));break;}
  case 'laser':if(!B.laser){B.laser={t:0,a:aim,from:a.from,a2:a};say('laser','Charging laser! Move!',1,12);sfx('lance');}break;
  case 'sweep':{const n=a.count||12,base=Math.PI/2+Math.sin(B.t*1.3)*.9;for(let i=0;i<n;i++)S(o.x,o.y,base+(i-(n-1)/2)*.06,sp,k);break;}}}
const pend=[];function setTimeoutShot(R,B,a,d){pend.push({R,B,a,d});}
function stepLaser(R,B,dt){const L=B.laser,A=L.a2,o=ORIG(B,L.from),p=R.p;L.t+=dt;const ch=(A.charge||1.1)*Math.max(SF.DIFF_MIN_TELE,R.diff?R.diff.tele:1);L.ox=o.x;L.oy=o.y;
 if(L.t>=ch&&L.t<ch+(A.fire||.7)){if(L.t-dt<ch){sfx('bomb');SF.fx.addShake(.3);}const ax=Math.cos(L.a),ay=Math.sin(L.a),rx=p.x-o.x,ry=p.y-o.y,along=rx*ax+ry*ay,perp=Math.abs(rx*ay-ry*ax);if(along>0&&perp<16)SF.player.hurt(R,A.dmg||16);}
 else if(L.t>=ch+(A.fire||.7))B.laser=null;}
Bs.stepPending=(R,dt)=>{for(let i=pend.length-1;i>=0;i--){const q=pend[i];q.d-=dt;if(q.d<=0){pend.splice(i,1);if(q.B.state!=='fight')continue;const o=ORIG(q.B,q.a.from),p=R.p;SF.enemies.shoot(o.x,o.y,Math.atan2(p.y-o.y,p.x-o.x),q.a.speed||170,q.a.bullet||'pellet');}}};
// bullets that hit the armoured hull (not a part) are absorbed
Bs.absorb=(x,y)=>{for(const B of Bs.list){if(B.state!=='fight'&&B.state!=='enter')continue;const rx=B.D.rx||60,ry=B.D.ry||50;if(((x-B.x)/rx)**2+((y-B.y)/ry)**2>=1)continue;
  // a bullet lined up with a part (and still below it) flies on to hit that part
  for(const q of B.parts)if(q.e.alive&&Math.abs(x-q.e.x)<q.e.r+4&&y>q.e.y-q.e.r)return false;
  return true;}return false;};
// ---------- render ----------
Bs.sync=(A,dt)=>{for(const B of Bs.list){const x=B.ox+(B.x-B.ox)*A,y=B.oy+(B.y-B.oy)*A;
 if(B.m){const bm=B.m;bm.g.visible=true;place(bm.g,x,y,!!B.D.ground,0);bm.g.rotation.set(0,0,0);for(const r of bm.rots)r.rotation.y+=dt*14;
  B.parts.forEach(q=>{if(q.node===undefined||!bm.turs[q.node])return;const gun=bm.turs[q.node].getObjectByName('gun');if(gun)gun.rotation.y=yawFrom(Math.atan2(SF.R.p.y-q.e.y,SF.R.p.x-q.e.x));});
  const core=B.parts.find(q=>q.kill),open=core&&!core.e.invuln&&!core.e.guard,pulse=.6+.4*Math.sin(B.t*(B.rage>1?14:6));bm.coreM.emissiveIntensity=1+pulse*1.5;bm.coreM.emissive.copy(col(B.rage>1?'#ff2a3a':'#ff7a1f'));bm.ring.visible=!open;bm.ring.rotation.z+=dt*2;
  if(B.state==='dying'){bm.g.position.y-=(2.6-B.dying)*1.5;bm.g.rotation.z=(2.6-B.dying)*.08;}}
 if(B.mm){place(B.mm,x,y,!!B.D.ground,0);if(B.D.scale)B.mm.scale.multiplyScalar(B.D.scale);B.mm.rotation.set(0,yawFrom(Math.PI/2),0);for(const r of B.mm.R.rotor)r.rotation.y+=dt*30;if(B.state==='dying')B.mm.rotation.z=(1.4-B.dying)*.5;}}};
Bs.draw=(R,A)=>{for(const B of Bs.list){if(B.state==='dying')continue;
 cx.globalCompositeOperation='lighter';
 for(const q of B.parts){if(!q.e.alive)continue;if(q.e.flash>0)pdg(q.e.x,q.e.y,q.e.r*1.2,'#ffffff');
  if(q.kill){const open=!q.e.invuln&&!q.e.guard;pdg(q.e.x,q.e.y,(open?30:22)+Math.sin(B.t*6)*6,B.rage>1?'#ff3c50':open?'#ff9d2e':'#7fd8ff');}
  else if(!q.e.invuln&&Math.floor(B.t*3)%2===0)pdg(q.e.x,q.e.y,q.e.r*.7,'#ffb347');}
 cx.globalCompositeOperation='source-over';
 if(B.laser){const L=B.laser,ax=Math.cos(L.a),ay=Math.sin(L.a),ch=(L.a2.charge||1.1)*Math.max(SF.DIFF_MIN_TELE,R.diff?R.diff.tele:1),len=clipLen(L.ox,L.oy,ax,ay);pj(L.ox,L.oy);const x0=PX,y0=PY;pj(L.ox+ax*len,L.oy+ay*len);
  if(L.t<ch){cx.strokeStyle=`rgba(255,60,80,${.3+.4*Math.abs(Math.sin(L.t*25))})`;cx.lineWidth=2;cx.setLineDash([10,8]);cx.beginPath();cx.moveTo(x0,y0);cx.lineTo(PX,PY);cx.stroke();cx.setLineDash([]);}
  else{cx.globalCompositeOperation='lighter';for(const[w,c2]of[[40,'rgba(255,40,80,.25)'],[22,'rgba(255,70,100,.6)'],[8,'#ffffff']]){cx.strokeStyle=c2;cx.lineWidth=w;cx.beginPath();cx.moveTo(x0,y0);cx.lineTo(PX,PY);cx.stroke();}cx.globalCompositeOperation='source-over';}}}};
// boss health bar (main boss): the kill part's health plus markers for each part
Bs.drawBar=R=>{const B=R.boss;if(!B||B.state==='dying'||!Bs.list.includes(B))return;const k=B.parts.find(q=>q.kill);if(!k)return;const y=128,x0=30,w=OW-60;
 cx.fillStyle='rgba(0,0,0,.55)';cx.fillRect(x0,y,w,7);cx.fillStyle=B.rage>1?'#ff3c50':'#ff9d2e';cx.fillRect(x0,y,w*Math.max(0,k.e.hp/k.e.max),7);
 const parts=B.parts.filter(q=>!q.kill);parts.forEach((q,i)=>{const px=x0+w-12-i*14;cx.fillStyle=q.e.alive?'#ffd27a':'rgba(255,255,255,.2)';cx.fillRect(px,y+11,10,4);});
 cx.font='600 11px "Chakra Petch", sans-serif';cx.textAlign='left';cx.fillStyle='#fff';cx.fillText(B.D.name.toUpperCase(),x0,y-4);cx.textAlign='right';
 cx.fillText(k.e.invuln?'INVULNERABLE':k.e.guard?'SHIELDED':'CORE EXPOSED',OW-30,y-4);};
})();
