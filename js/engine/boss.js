'use strict';
// ============ BOSS ENGINE ============
// A boss is a 3D body plus destructible PARTS. Each part is a real target in the enemy pipeline (it takes hits,
// scores and drops like any enemy) attached to the boss. Attacks are bound to parts: when a part is destroyed its
// attacks stop and its 3D piece breaks off (stump + smoke). PHASES switch on conditions (parts destroyed, health
// left) and add attacks and aggression. Parts can be invulnerable until a condition is met, shield generators
// protect the core, and bodies can submerge or phase-blink. Data: config/bosses.js. Models: bossmodels.js.
(()=>{
const deg=Math.PI/180;
const Bs=SF.boss={list:[]};
// ---------- conditions: 'a&b|c' = (a and b) or c ----------
function atom(B,c){c=c.trim();if(!c||c==='always')return true;
 if(c[0]==='!'){const p=B.parts.find(q=>q.id===c.slice(1));return !p||!p.e.alive;}
 let m=c.match(/^parts<=(\d+)$/);if(m)return B.parts.filter(q=>!q.kill&&q.e.alive).length<=+m[1];
 m=c.match(/^hp<([\d.]+)$/);if(m){const k=B.parts.find(q=>q.kill);return k&&k.e.hp/k.e.max<+m[1];}
 return false;}
const cond=(B,s)=>!s||s==='always'||s.split('|').some(g=>g.split('&').every(c=>atom(B,c)));
Bs.cond=cond;
// fallback for a stage without boss data: turrets guarding a core on the stage's built-in boss model
function fromModel(si){const bm=LV.boss,info=bm.info,k=bm.kind,base=320+200*si;
 const pats={ship:['rain','ring','laser'],wing:['fan','spiral','missiles'],land:['fan','ring','missiles'],gunship:['spiral','laser','rain']}[k];
 const A=n=>({rain:{p:'rain',every:.13,speed:150},ring:{p:'ring',every:1.15,count:18,speed:130,bullet:'heavy'},laser:{p:'laser',every:5,charge:1.1,fire:.7,dmg:16},fan:{p:'fan',every:.8,count:7,spread:50,speed:170},spiral:{p:'spiral',every:.09,arms:3,speed:135},missiles:{p:'missiles',every:2.3,count:4,speed:120}})[n];
 const parts=info.tur.map(([dx,dy],i)=>({id:'gun'+i,name:'Turret',dx,dy,r:20,hp:base*.16,score:3000,gears:6,node:i,attacks:[{p:'aimed',every:1.7,speed:160,count:1}]}));
 parts.push({id:'core',name:'Core',dx:info.core[0],dy:info.core[1],r:26,hp:base,kill:true,guard:.7});
 return {name:STAGES[si].boss.name,title:'',legacy:true,rx:info.rx,ry:info.ry,ground:!!info.ground,move:{type:'sway',amp:k==='ship'?35:65,freq:.45,y:.2},parts,
  phases:[{when:'always',attacks:[A(pats[0])]},{when:'hp<.66',attacks:[A(pats[1])]},{when:'hp<.33',attacks:[A(pats[2])],rage:1.35}],score:25000*(si+1),gears:30+si*5};}
Bs.defFor=si=>{const id=SF.STAGE_DEFS[si]&&SF.STAGE_DEFS[si].boss;return id&&SF.BOSSES[id]?{id,D:SF.BOSSES[id]}:{id:'stage'+si,D:fromModel(si)};};
// ---------- spawn ----------
Bs.spawn=(R,D,opts={})=>{const id=opts.key||'b',hpMul=(opts.hpMul||1)*SF.dm('enemyHp')*(R.diff?R.diff.boss/R.diff.hp:1);
 const B={id,D,x:W/2,y:-(D.ry||80)-70,ox:W/2,oy:0,t:0,state:'enter',ty:lyAt(D.move.y),phase:-1,attacks:[],rage:1,dying:0,laser:null,mini:!!opts.mini,alive:true,flash:0,
  sink:0,tilt:0,sub:0,subT:D.submerge?D.submerge.every:0,blinkT:D.move.type==='blink'?D.move.every:0,gone:0,vis:1,lanes:[],smokeT:0};
 B.oy=B.y;
 B.parts=D.parts.map(P=>{const key='bp_'+id+'_'+P.id;
  SF.ENEMIES[key]={name:P.name,model:null,hp:P.hp,r:P.r,score:P.score||0,gears:P.gears||0,charge:6,size:P.kill?2.4:1.6,dropTable:P.kill?'heavy':'standard',move:{type:'attached'},fire:{pattern:'none'},bossPart:true};
  const e=SF.enemies.spawn(key,{x:B.x+P.dx,y:B.y+P.dy,parent:B,dx:P.dx,dy:P.dy,hpMul,group:0});
  e.invuln=true;e.ground=!!D.ground;return {id:P.id,P,e,kill:!!P.kill,node:P.node,attacks:(P.attacks||[]).map(a=>Object.assign({t:(a.offset||0)+rnd(.6,1.4),from:P.id},a))};});
 R.bossPartsTotal=(R.bossPartsTotal||0)+B.parts.filter(q=>!q.kill).length;
 if(D.legacy){B.legacy=LV.boss;B.legacy.g.visible=true;for(const t of B.legacy.turs){t.visible=true;const g=t.getObjectByName('gun');if(g)g.visible=true;}}
 else{B.mdl=BossModels.build(id,D);BossModels.reset(B.mdl);B.mdl.g.visible=true;}
 if(!opts.mini){R.boss=B;R.bossStart=R.t;R.bossCard={name:D.name,title:D.title||'',l:3};R.camZ=1.12;}
 else R.bossCard={name:D.name,title:'MINI-BOSS · '+(D.title||''),l:2.2,mini:1};
 Bs.list.push(B);return B;};
Bs.reset=()=>{for(const B of Bs.list){if(B.mdl)B.mdl.g.visible=false;if(B.legacy)B.legacy.g.visible=false;}Bs.list.length=0;pend.length=0;};
// part destroyed
SF.on('kill',({e})=>{for(const B of Bs.list){const q=B.parts.find(q=>q.e===e);if(!q)continue;const R=SF.R;
 if(q.kill){Bs.die(R,B);return;}
 SF.fx.explode(e.x,e.y,2,B.D.ground);SF.fx.ring(e.x,e.y,50,'#ffb347',.45);SF.fx.addShake(.35);sfx('boom');if(R)R.bossPartsKilled=(R.bossPartsKilled||0)+1;
 if(B.mdl){const n=B.mdl.nodes[q.id],s=B.mdl.stumps[q.id];if(n)n.visible=false;if(s)s.visible=true;}
 if(B.legacy&&q.node!==undefined&&B.legacy.turs[q.node]){const g=B.legacy.turs[q.node].getObjectByName('gun');if(g)g.visible=false;}
 SF.fx.pop(e.x,e.y-26,(q.P.name||'PART').toUpperCase()+' DESTROYED',true);SF.emit('bossPart',{B,q});
 const left=B.parts.filter(p=>!p.kill&&p.e.alive).length;if(!B.mini)say('bp'+left,left?`${q.P.name} down. ${left} to go.`:'Every weapon is down. Finish it!',left?1:2,0);return;}});
Bs.die=(R,B)=>{if(B.state==='dying')return;B.state='dying';B.dying=B.mini?1.5:2.8;B.laser=null;B.lanes.length=0;for(const q of B.parts)if(q.e.alive)SF.enemies.remove(q.e);
 if(!B.mini){SF.enemies.ebPool.clear();R.marks.length=0;R.bossTime=R.t-R.bossStart;R.slow=.7;R.camZ=1.06;}else{R.slow=.25;}
 SF.emit('bossDown',{B,mini:B.mini});vib(150);};
// ---------- step ----------
const ORIG=(B,id)=>{const q=id&&B.parts.find(p=>p.id===id);return q?{x:q.e.x,y:q.e.y}:{x:B.x,y:B.y+(B.D.ry||40)*.3};};
Bs.step=(R,dt)=>{for(let i=Bs.list.length-1;i>=0;i--){const B=Bs.list[i];B.ox=B.x;B.oy=B.y;B.t+=dt;const D=B.D,p=R.p;
 if(B.state==='dying'){B.dying-=dt;const rx=D.rx||60,ry=D.ry||50;if(Math.random()<dt*(B.mini?10:16)){SF.fx.explode(B.x+rnd(-rx,rx)*.8,B.y+rnd(-ry,ry)*.8,rnd(1,2.4),D.ground);sfx('pop');SF.fx.addShake(.2);}
  B.y+=dt*(B.mini?30:12);B.tilt+=dt*.05;
  if(B.dying<=0){SF.fx.explode(B.x,B.y,B.mini?3:5,D.ground);if(!B.mini){for(const s of[-1,1])SF.fx.explode(B.x+s*rx*.5,B.y,3,D.ground);for(let k=0;k<3;k++)SF.fx.ring(B.x,B.y,80+k*60,k?'#ffb347':'#ffffff',.5+k*.15);SF.fx.flash=.9;}
   SF.fx.addShake(B.mini?.5:1);sfx('boom');if(D.ground)addDecal(B.x,B.y,B.mini?40:90);
   for(let k=0;k<(D.gears||10);k++)SF.pickups.drop('gear',B.x+rnd(-50,50),B.y+rnd(-30,30),1);SF.pickups.rollTable('heavy',B.x,B.y,true);
   if(B.mdl)B.mdl.g.visible=false;if(B.legacy)B.legacy.g.visible=false;Bs.list.splice(i,1);SF.emit('bossGone',{B,mini:B.mini,score:D.score||0});}
  continue;}
 if(B.state==='enter'){B.y+=75*dt;if(B.y>=B.ty-30){B.state='fight';if(!B.mini)R.camZ=1;}}
 else{const mv=D.move;B.y+=(B.ty+B.sink*H-B.y)*dt;
  if(mv.type==='sway')B.x=W/2+Math.sin(B.t*mv.freq*Math.min(1.3,B.rage))*mv.amp;
  else if(mv.type==='strafe')B.x=W/2+Math.sin(B.t*mv.freq)*mv.amp+Math.sin(B.t*mv.freq*2.3)*mv.amp*.35;
  else if(mv.type==='blink'){B.blinkT-=dt;if(B.gone>0){B.gone-=dt;B.vis=Math.max(0,B.vis-dt*5);if(B.gone<=0){B.x=rnd(110,290);B.ty=lyAt(rnd(.16,.3));B.y=B.ty;B.ox=B.x;B.oy=B.y;SF.fx.spark(B.x,B.y,'#c07bff',16);sfx('blink');}}
   else{B.vis=Math.min(1,B.vis+dt*5);if(B.blinkT<=0){B.blinkT=mv.every/Math.min(1.5,B.rage);B.gone=mv.gone;SF.fx.spark(B.x,B.y,'#c07bff',16);sfx('blink');}}}}
 // submerge cycle (whole boss dives: invulnerable, silent, moves)
 if(D.submerge&&B.state==='fight'){B.subT-=dt;if(B.sub>0){B.sub-=dt;if(Math.random()<dt*20)SF.fx.add('w',B.x+rnd(-80,80),B.y+rnd(-20,20),0,0,1,'#ffffff',rnd(3,6));
   if(B.sub<=0){B.x=W/2+rnd(-60,60);for(const a of B.attacks)if(a.p==='wall')a.t=.3;sfx('boom');SF.fx.addShake(.3);}}
  else if(B.subT<=0){B.subT=D.submerge.every;B.sub=D.submerge.time;B.laser=null;R.banner={t:'DIVING',l:1,sub:B.D.name.toUpperCase()};}}
 const hidden=B.sub>0||B.gone>0;
 // phases (never go back)
 for(let k=D.phases.length-1;k>B.phase;k--)if(cond(B,D.phases[k].when)){for(let j=B.phase+1;j<=k;j++){const ph=D.phases[j];for(const a of ph.attacks||[])B.attacks.push(Object.assign({t:.8},a));if(ph.rage)B.rage=ph.rage;if(ph.sink)B.sink=ph.sink;if(ph.tilt)B.tilt=ph.tilt;
   if(ph.say&&j>0)say('bph'+j+B.id,ph.say,2,0);if(ph.banner)R.banner={t:ph.banner,l:1.6,sub:D.name.toUpperCase()};}
  if(B.phase>=0){SF.fx.addShake(.45);sfx('warn');SF.fx.flash=Math.max(SF.fx.flash,.15);}B.phase=k;break;}
 // part vulnerability, guards, shields, sway
 const shields=B.parts.some(q=>q.P.shield&&q.e.alive);
 for(const q of B.parts){if(!q.e.alive)continue;const P=q.P;
  q.e.invuln=B.state!=='fight'||hidden||(P.vulnerableWhen?!cond(B,P.vulnerableWhen):false);
  q.e.guard=P.guard&&B.parts.some(o=>!o.kill&&o.e.alive)?P.guard:0;
  if(P.wave)q.e.dx=P.dx+Math.sin(B.t*P.wave.freq-P.wave.lag)*P.wave.amp;}
 B.shielded=shields;
 // smoke from broken parts
 B.smokeT-=dt;if(B.smokeT<=0){B.smokeT=save.hq?.08:.18;for(const q of B.parts)if(!q.e.alive&&!q.kill)SF.fx.add('s',B.x+(q.e.dx)+rnd(-4,4),B.y+q.P.dy,rnd(-8,8),-30,rnd(.6,1),'#2e2a28',rnd(4,7),{drag:.98});}
 for(const L of B.lanes){L.t-=dt;if(L.t<=0&&!L.fired){L.fired=true;for(let c=0;c<3;c++)for(let r=0;r<6;r++)SF.enemies.shoot(L.x+(c-1)*L.w/3,B.y+20-r*36,Math.PI/2,520,'needle');sfx('lance');SF.fx.addShake(.15);}}
 prune(B.lanes,L=>!L.fired||L.t>-.4);
 if(B.state!=='fight'||hidden)continue;
 // attacks: phase attacks + attacks of living parts
 const fm=SF.dm('enemyFire')*B.rage,bs=SF.dm('bulletSpeed');
 const run=a=>{a.t-=dt*fm;if(a.t>0)return;a.t=a.every;fireAttack(R,B,a,bs);};
 for(const a of B.attacks){if(a.from&&!B.parts.find(q=>q.id===a.from&&q.e.alive))continue;run(a);}
 for(const q of B.parts)if(q.e.alive)for(const a of q.attacks)run(a);
 if(B.laser)stepLaser(R,B,dt);
 // body contact (air bosses)
 const rx=D.rx||60,ry=D.ry||50;if(!D.ground&&p.alive&&p.dying<=0&&((p.x-B.x)/(rx*.8))**2+((p.y-B.y)/(ry*.8))**2<1)SF.player.hurt(R,25);}};
function fireAttack(R,B,a,bs){const o=ORIG(B,a.from),p=R.p,aim=Math.atan2(p.y-o.y,p.x-o.x),k=a.bullet||'pellet',S=SF.enemies.shoot,sp=a.speed||150;
 switch(a.p){
  case 'aimed':{const n=a.count||1;for(let i=0;i<n;i++)S(o.x,o.y,aim+(i-(n-1)/2)*(a.spread||8)*deg,sp,k);break;}
  case 'fan':{const n=a.count,arc=a.spread*deg;for(let i=0;i<n;i++)S(o.x,o.y+10,aim+(i/(n-1)-.5)*arc,sp,k);break;}
  case 'flame':{const n=a.count,arc=a.spread*deg;for(let i=0;i<n;i++)S(o.x,o.y+10,aim+(Math.random()-.5)*arc,sp*rnd(.8,1.1),'shell');SF.fx.glow(o.x,o.y+12,18,'#ff7a2e',.2);break;}
  case 'ring':{const n=a.count;for(let i=0;i<n;i++)S(o.x,o.y,i*TAU/n+B.t,sp,i%2?k:'pellet');break;}
  case 'spiral':{for(let i=0;i<a.arms;i++)S(o.x,o.y,B.t*2.1+i*TAU/a.arms,sp,k);break;}
  case 'cross':{for(let i=0;i<4;i++)S(o.x,o.y,B.t*1.6+i*Math.PI/2,sp,k);break;}
  case 'rain':S(B.x+rnd(-(B.D.rx||80),B.D.rx||80),B.y+(B.D.ry||40)*.5,Math.PI/2+rnd(-.25,.25),sp*rnd(.8,1.1),k);break;
  case 'missiles':{const n=a.count||4;for(let i=0;i<n;i++)S(o.x+(i-(n-1)/2)*24,o.y,Math.PI/2+(i-(n-1)/2)*.4,sp,'missile');sfx('lance');break;}
  case 'burst':{const n=a.count||3;for(let i=0;i<n;i++)pend.push({B,a,d:i*(a.gap||.12)});break;}
  case 'laser':if(!B.laser){B.laser={t:0,a:aim,from:a.from,a2:a};say('laser','Charging laser! Move!',1,12);sfx('lance');}break;
  case 'sweep':{const n=a.count||12,base=Math.PI/2+Math.sin(B.t*1.3)*.9;for(let i=0;i<n;i++)S(o.x,o.y,base+(i-(n-1)/2)*.06,sp,k);break;}
  case 'wall':{const gx=clamp(p.x+rnd(-40,40),50,W-50),gap=a.gap||80;for(let x=12;x<W;x+=24)if(Math.abs(x-gx)>gap/2)S(x,o.y,Math.PI/2,sp,k);sfx('mine');break;}
  case 'lane':{const tele=Math.max(SF.DIFF_MIN_TELE,R.diff?R.diff.tele:1);B.lanes.push({x:clamp(p.x,30,W-30),w:a.width||60,t:(a.warn||1.1)*tele,m:(a.warn||1.1)*tele,fired:false});sfx('lance');break;}
  case 'spawn':if(a.formation)SF.formations.spawn(a.formation,{enemy:a.enemy});else for(let i=0;i<(a.count||3);i++)SF.enemies.spawn(a.enemy,{x:o.x+(i-((a.count||3)-1)/2)*30,y:o.y+20});SF.fx.glow(o.x,o.y,30,'#ffb347',.3);break;
  case 'mines':for(let i=0;i<(a.count||2);i++)SF.enemies.spawn('mine',{x:o.x+(i-((a.count||2)-1)/2)*60,y:o.y+20});break;
  case 'mortar':{const tele=Math.max(SF.DIFF_MIN_TELE,R.diff?R.diff.tele:1),dl=(a.delay||1.3)*tele;R.marks.push({x:p.x,y:p.y,t:dl,m:dl,r:a.radius||38,dmg:a.damage||20});sfx('mine');break;}}}
const pend=[];
function stepLaser(R,B,dt){const L=B.laser,A=L.a2,o=ORIG(B,L.from),p=R.p;L.t+=dt;const ch=(A.charge||1.1)*Math.max(SF.DIFF_MIN_TELE,R.diff?R.diff.tele:1);L.ox=o.x;L.oy=o.y;L.ch=ch;
 if(L.t>=ch&&L.t<ch+(A.fire||.7)){if(L.t-dt<ch){sfx('bomb');SF.fx.addShake(.3);}const ax=Math.cos(L.a),ay=Math.sin(L.a),rx=p.x-o.x,ry=p.y-o.y,along=rx*ax+ry*ay,perp=Math.abs(rx*ay-ry*ax);if(along>0&&perp<16)SF.player.hurt(R,A.dmg||16);}
 else if(L.t>=ch+(A.fire||.7))B.laser=null;}
Bs.stepPending=(R,dt)=>{for(let i=pend.length-1;i>=0;i--){const q=pend[i];q.d-=dt;if(q.d<=0){pend.splice(i,1);if(q.B.state!=='fight')continue;const o=ORIG(q.B,q.a.from),p=R.p;SF.enemies.shoot(o.x,o.y,Math.atan2(p.y-o.y,p.x-o.x),q.a.speed||170,q.a.bullet||'pellet');}}};
// bullets hitting the armoured hull are absorbed, unless lined up with a part they are flying towards
Bs.absorb=(x,y)=>{for(const B of Bs.list){if(B.state==='dying'||B.sub>0||B.gone>0)continue;const rx=B.D.rx||60,ry=B.D.ry||50;if(((x-B.x)/rx)**2+((y-B.y)/ry)**2>=1)continue;
  for(const q of B.parts)if(q.e.alive&&!q.e.invuln&&Math.abs(x-q.e.x)<q.e.r+4&&y>q.e.y-q.e.r)return false;
  return true;}return false;};
// ---------- render ----------
const tmpV=new T3.Vector3();
Bs.sync=(A,dt)=>{const R=SF.R;for(const B of Bs.list){const x=B.ox+(B.x-B.ox)*A,y=B.oy+(B.y-B.oy)*A,D=B.D;
 if(B.legacy){const bm=B.legacy;bm.g.visible=true;place(bm.g,x,y,!!D.ground,0);bm.g.rotation.set(0,0,0);for(const r of bm.rots)r.rotation.y+=dt*14;
  B.parts.forEach(q=>{if(q.node===undefined||!bm.turs[q.node])return;const gun=bm.turs[q.node].getObjectByName('gun');if(gun)gun.rotation.y=yawFrom(Math.atan2(R.p.y-q.e.y,R.p.x-q.e.x));});
  const core=B.parts.find(q=>q.kill),open=core&&!core.e.invuln&&!core.e.guard,pulse=.6+.4*Math.sin(B.t*(B.rage>1?14:6));bm.coreM.emissiveIntensity=1+pulse*1.5;bm.coreM.emissive.copy(col(B.rage>1?'#ff2a3a':'#ff7a1f'));bm.ring.visible=!open;bm.ring.rotation.z+=dt*2;
  if(B.state==='dying'){bm.g.position.y-=(2.8-B.dying)*1.5;bm.g.rotation.z=(2.8-B.dying)*.08;}continue;}
 const M=B.mdl;if(!M)continue;const g=M.g;g.visible=B.vis>.02;
 place(g,x,y,!!D.ground,B.sub>0?-Math.min(1,(D.submerge.time-B.sub)*2,B.sub*2)*3.2:0);g.scale.multiplyScalar(B.vis<1?Math.max(.05,B.vis):1);
 g.rotation.set(0,0,B.tilt*(B.x<W/2?1:-1));if(B.state==='dying'){g.position.y-=(2.8-B.dying)*(B.mini?2:1.4);g.rotation.z+=(2.8-B.dying)*.08;g.rotation.x=(2.8-B.dying)*.05;}
 for(const r of M.rots)r.rotation.y+=dt*(B.state==='dying'?6:16);if(M.halo)M.halo.rotation.z+=dt*(B.rage>1?2:.8);
 for(const q of B.parts){const n=M.nodes[q.id];if(!n||!q.e.alive)continue;if(q.P.wave)n.position.x=q.e.dx*K;
  const gun=n.getObjectByName('gun');if(gun){const a=Math.atan2(R.p.y-q.e.y,R.p.x-q.e.x);gun.rotation.y=yawFrom(a)-(q.P.ry||0);}
  const glow=n.getObjectByName('glow');if(glow)glow.scale.setScalar(1+.25*Math.sin(B.t*8));}
 if(M.core){const core=B.parts.find(q=>q.kill),open=core&&core.e.alive&&!core.e.invuln&&!core.e.guard,pulse=.6+.4*Math.sin(B.t*(B.rage>1?14:6));
  M.core.m.emissiveIntensity=1+pulse*1.5;M.core.m.emissive.copy(col(B.rage>1?'#ff2a3a':open?'#ff7a1f':'#3a8aff'));M.core.ring.visible=!open;M.core.ring.rotation.z+=dt*2;M.core.sh.visible=B.shielded;}}};
Bs.draw=(R,A)=>{for(const B of Bs.list){
 for(const L of B.lanes){if(L.fired)continue;const a=1-L.t/L.m;pj(L.x-L.w/2,B.y);const x0=PX,y0=PY;pj(L.x+L.w/2,H);cx.fillStyle=`rgba(255,40,60,${.08+a*.22})`;cx.fillRect(x0,y0,PX-x0,PY-y0);
  cx.strokeStyle=`rgba(255,60,80,${.4+.5*Math.abs(Math.sin(L.t*16))})`;cx.lineWidth=2;cx.setLineDash([8,6]);cx.strokeRect(x0,y0,PX-x0,PY-y0);cx.setLineDash([]);}
 if(B.state==='dying'||B.vis<.3||B.sub>0)continue;
 cx.globalCompositeOperation='lighter';
 for(const q of B.parts){if(!q.e.alive)continue;if(q.e.flash>0)pdg(q.e.x,q.e.y,q.e.r*1.2,'#ffffff');
  if(q.kill){const open=!q.e.invuln&&!q.e.guard;pdg(q.e.x,q.e.y,(open?30:20)+Math.sin(B.t*6)*6,B.rage>1?'#ff3c50':open?'#ff9d2e':'#5fa8ff');}
  else if(!q.e.invuln&&Math.floor(B.t*3)%2===0)pdg(q.e.x,q.e.y,q.e.r*.6,q.P.shield?'#5fd0ff':'#ffb347');}
 cx.globalCompositeOperation='source-over';
 if(B.laser){const L=B.laser,ax=Math.cos(L.a),ay=Math.sin(L.a),len=clipLen(L.ox,L.oy,ax,ay);pj(L.ox,L.oy);const x0=PX,y0=PY;pj(L.ox+ax*len,L.oy+ay*len);
  if(L.t<L.ch){cx.strokeStyle=`rgba(255,60,80,${.3+.4*Math.abs(Math.sin(L.t*25))})`;cx.lineWidth=2;cx.setLineDash([10,8]);cx.beginPath();cx.moveTo(x0,y0);cx.lineTo(PX,PY);cx.stroke();cx.setLineDash([]);pdg(L.ox,L.oy,10+L.t/L.ch*16,'#ff3c50');}
  else{cx.globalCompositeOperation='lighter';for(const[w,c2]of[[40,'rgba(255,40,80,.25)'],[22,'rgba(255,70,100,.6)'],[8,'#ffffff']]){cx.strokeStyle=c2;cx.lineWidth=w;cx.beginPath();cx.moveTo(x0,y0);cx.lineTo(PX,PY);cx.stroke();}cx.globalCompositeOperation='source-over';}}}};
// boss health bar (main boss): kill-part health + one marker per part
Bs.drawBar=R=>{const B=R.boss;if(!B||B.state==='dying'||!Bs.list.includes(B))return;const k=B.parts.find(q=>q.kill);if(!k)return;const y=128,x0=30,w=OW-60,f=Math.max(0,k.e.hp/k.e.max);
 cx.fillStyle='rgba(0,0,0,.6)';cx.fillRect(x0-2,y-2,w+4,11);const gr=cx.createLinearGradient(x0,0,x0+w,0);gr.addColorStop(0,B.rage>1?'#ff3c50':'#ff861a');gr.addColorStop(1,B.rage>1?'#ff8a9c':'#ffd27a');cx.fillStyle=gr;cx.fillRect(x0,y,w*f,7);
 if(B.shielded||k.e.invuln){cx.fillStyle='rgba(95,200,255,.35)';cx.fillRect(x0,y,w*f,7);}
 const parts=B.parts.filter(q=>!q.kill);parts.forEach((q,i)=>{const px=x0+i*16;cx.fillStyle=q.e.alive?(q.P.shield?'#5fd0ff':'#ffd27a'):'rgba(255,255,255,.15)';cx.fillRect(px,y+12,12,5);});
 cx.font='600 11px "Chakra Petch", sans-serif';cx.textAlign='left';cx.fillStyle='#fff';cx.fillText(B.D.name.toUpperCase(),x0,y-5);cx.textAlign='right';
 cx.fillStyle=k.e.invuln?'#9fd8ff':k.e.guard?'#ffd27a':'#ff8a9c';cx.fillText(B.sub>0?'SUBMERGED':B.gone>0?'PHASING':k.e.invuln?'CORE SEALED':k.e.guard?'CORE GUARDED':'CORE EXPOSED',OW-30,y-5);};
// boss name card (entrance)
Bs.drawCard=R=>{const c=R.bossCard;if(!c||c.l<=0)return;const a=Math.min(1,c.l*2,(c.mini?2.2:3)-c.l<.3?((c.mini?2.2:3)-c.l)/.3:1);cx.globalAlpha=a;const y=OH*.66;
 cx.fillStyle='rgba(0,0,0,.55)';cx.fillRect(0,y-40,OW,70);cx.fillStyle=c.mini?'#ffb352':'#ff4d6d';cx.fillRect(0,y-40,OW,2);cx.fillRect(0,y+28,OW,2);
 cx.textAlign='center';cx.fillStyle='#fff';cx.font=(c.mini?'22px':'28px')+' Bungee, Impact, sans-serif';cx.fillText(c.name.toUpperCase(),OW/2,y);
 cx.fillStyle=c.mini?'#ffd27a':'#ff8a9c';cx.font='600 12px "Chakra Petch", sans-serif';cx.fillText(c.title.toUpperCase(),OW/2,y+20);cx.globalAlpha=1;};
})();
