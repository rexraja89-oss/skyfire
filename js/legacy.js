'use strict';
// The current campaign: wave spawner, enemies, boss, update and render. Replaced by the new engine from Checkpoint 4.
// ================= GAME STATE =================
let G=null,state='title';
const keys={},TG=[];
function clearRun(){if(!G)return;for(const e of G.en)release(e.m);G.en.length=0;if(LV.boss)LV.boss.g.visible=false;}
function startRun(si,mode){save.mode=mode;store();$('loading').hidden=false;show('none');
 setTimeout(()=>{clearRun();if(LV.si!==si)buildLevel(si);$('loading').hidden=true;beginRun(si);},40);}
function beginRun(si){const st=STAGES[si],M=MODES.find(m=>m.k===save.mode),pl=PLANES[save.plane],P=save.parts;
 const mhp=pl.hp+20*P.armor,py=lyAt(.8);
 G={si,st,M,t:0,len:68+3*si,p:{x:W/2,y:py,tx:W/2,ty:py,px:W/2,vx:0,hp:mhp,max:mhp,inv:1.5,bank:0,fc:0,mc:0,pw:0},
  bombs:1+P.bomb+(pl.bombs||0),pb:[],eb:[],en:[],pk:[],parts:[],pops:[],marks:[],beams:[],dr:[],
  hpm:(1+.32*si)*M.hp,spawnT:2.2,spawned:0,killed:0,hits:0,earned:0,score:0,shown:0,chain:0,chainT:0,gp:0,kills:0,
  boss:null,bossT:-1,warnT:0,endT:-1,win:false,flash:0,shake:0,laser:null,dmg:pl.dmg,rate:(pl.fire||1)*(1+.05*P.engine),mag:(75+26*P.magnet)*(pl.mag||1),
  midDone:false,halfHp:false,lowHp:false,said:{},seen:{}};
 G.drone=save.own[save.drone]?save.drone:'';if(G.drone)for(const s of[-1,1])G.dr.push({x:W/2+s*30,y:py+20,s,a:s<0?0:Math.PI,fc:rnd(0,.2),zap:0,zx:0,zy:0});
 showPlayerModel();gz3=0;updTerrain(true);
 resetCopilot();updHud();updScore(true);updWeap();state='play';show('play');musicStop();musicStart(st.key);
 say('brief',`${st.name}. ${st.brief}`,3,0);
 if(G.M.k!=='easy')say('mode',`${G.M.name} mode. Enemy armour and firepower increased. Stay sharp.`,1,0);}
const ef=()=>Math.min(12,save.wl[save.weapon]+G.p.pw*2);

// ---------- spawning ----------
function addEnemy(type,o){const b=ET[type];
 const e=Object.assign({type,hp:b.hp*G.hpm,r:b.r,g:b.g,pts:b.pts,t:0,fire:rnd(.6,1.6)/G.M.fire,flash:0,ft:0,ang:Math.PI/2,rot:0,vx:0,vy:0,ground:!!b.ground,m:null},o);e.max=e.hp;
 if(type==='aegis'){e.shMax=e.hp*1.2;e.sh=e.shMax;e.lastHit=-9;}
 G.en.push(e);if(type!=='mine')G.spawned++;
 if(b.intro&&!G.seen[type]){G.seen[type]=1;say('in_'+type,b.intro,2,999);}return e;}
const WEIGHT={fighter:4,fighter2:3,heli:2,tank:2.2,aa:1.6,truck:1.3,boat:2.2,bomber:.8,drone:1.4,hornet:1.3,aegis:1.4,lancer:1.2,hydra:1,wraith:1.2,sower:.9,mender:.7,blink:1.1,sam:1.1,artillery:.9,dome:.6};
const toLogicX=gx=>W/2+gx/(C3.t*K);
function laneX(L){if(G.st.biome==='city')return toLogicX(pick([-12.4,3.6,19.6]))+rnd(-3,3);return rnd(L[0]+15,L[1]-15);}
function spawnWave(){const st=G.st,s=G.si,L=st.land,Wt=st.water;let opts=st.enemies.filter(k=>!(k==='bomber'&&G.t<15)&&!(G.t<8&&ET[k].intro));
 let tot=0;for(const k of opts)tot+=WEIGHT[k];let r=Math.random()*tot,k='fighter';for(const o of opts){r-=WEIGHT[o];if(r<=0){k=o;break;}}
 const spd=G.M.spd*(1+.03*s),hy=()=>rnd(lyAt(.14),lyAt(.38));
 if(k==='fighter'||k==='fighter2'){const v=Math.random(),type=k;
  if(v<.45){const n=3+Math.min(3,Math.floor(s/3)),x0=rnd(90,310);for(let i=0;i<n;i++){const d=i-(n-1)/2;addEnemy(type,{x:x0+d*30,y:-30-Math.abs(d)*26,mv:'dive',vy:(165+6*s)*spd,vx:0});}}
  else{const side=Math.random()<.5?-1:1,n=4+Math.min(3,Math.floor(s/3));for(let i=0;i<n;i++)addEnemy(type,{x:side<0?-20:W+20,y:lyAt(.06),delay:i*.28,mv:'swoop',vx:-side*190*spd,vy:120*spd,side});}}
 else if(k==='heli'){const n=1+(s>3?1:0)+(Math.random()<.35?1:0);for(let i=0;i<n;i++)addEnemy('heli',{x:rnd(60,W-60),y:-40-i*30,ty:hy(),carrier:Math.random()<.25});}
 else if(k==='hornet'){const n=1+(Math.random()<.4?1:0);for(let i=0;i<n;i++)addEnemy('hornet',{x:rnd(70,W-70),y:-40-i*40,ty:hy()});}
 else if(k==='bomber'){const x=rnd(120,280);const b=addEnemy('bomber',{x,y:-50,vy:42*spd});addEnemy('fighter',{x:x-50,y:-30,mv:'escort',vy:42*spd,lead:b});addEnemy('fighter',{x:x+50,y:-30,mv:'escort',vy:42*spd,lead:b});
  say('bomber','Heavy bomber inbound. It carries repair kits, so take it down.',1,25);}
 else if(k==='drone'){const n=5+Math.min(4,Math.floor(s/2));for(let i=0;i<n;i++)addEnemy('drone',{x:rnd(30,W-30),y:-20-i*22,sp:(110+8*s)*spd});say('drone','Drone swarm! They will try to ram you.',1,30);}
 else if(k==='aegis'){const n=2+(s>6?1:0),x0=rnd(110,290);for(let i=0;i<n;i++)addEnemy('aegis',{x:x0,x0:x0+(i-(n-1)/2)*60,y:-30-i*40,vy:95*spd,ph:i});}
 else if(k==='lancer'){const n=1+(s>6&&Math.random()<.5?1:0);for(let i=0;i<n;i++)addEnemy('lancer',{x:rnd(60,W-60),y:-40,ty:rnd(lyAt(.1),lyAt(.25)),st:0,stT:0,vol:0});}
 else if(k==='hydra')addEnemy('hydra',{x:rnd(100,300),x0:rnd(120,280),y:-40});
 else if(k==='wraith'){for(let i=0;i<2;i++)addEnemy('wraith',{x:rnd(60,W-60),y:-40-i*50,tx:rnd(60,W-60),ty:rnd(lyAt(.12),lyAt(.4)),cl:1});}
 else if(k==='sower'){const side=Math.random()<.5?-1:1;addEnemy('sower',{x:side<0?-30:W+30,y:rnd(lyAt(.1),lyAt(.22)),vx:-side*60*spd,mt:.6});}
 else if(k==='mender'){const x=rnd(110,290),ty=rnd(lyAt(.08),lyAt(.2));addEnemy('mender',{x,y:-40,ty,ht:1.2});for(const sd of[-1,1])addEnemy('aegis',{x:x+sd*60,x0:x+sd*60,y:-60,vy:80*spd,ph:sd});}
 else if(k==='blink'){const n=1+(s>8?1:0);for(let i=0;i<n;i++)addEnemy('blink',{x:rnd(80,W-80),y:rnd(lyAt(.12),lyAt(.35)),bt:0,jumps:0,tp:0,shown:0});}
 else if(k==='boat'&&Wt){const n=1+(Math.random()<.5?1:0);for(let i=0;i<n;i++){const x=rnd(Wt[0]+15,Wt[1]-15);addEnemy('boat',{x,y:-40-i*90,vx:(Math.random()<.5?-1:1)*30,x0:Wt[0]+15,x1:Wt[1]-15});}}
 else if(k==='tank'&&L){const n=2+(Math.random()<.5?1:0),x=laneX(L);for(let i=0;i<n;i++)addEnemy('tank',{x:x+rnd(-6,6),y:-30-i*48,vy:16});}
 else if(k==='aa'&&L){const n=1+(Math.random()<.5?1:0);for(let i=0;i<n;i++)addEnemy('aa',{x:laneX(L),y:-30-i*70});}
 else if(k==='truck'&&L){const n=3+(Math.random()<.5?1:0),x=st.biome==='harbor'?44:laneX(L);for(let i=0;i<n;i++)addEnemy('truck',{x,y:-30-i*38,vy:34});}
 else if(k==='sam'&&L){addEnemy('sam',{x:laneX(L),y:-30});}
 else if(k==='artillery'&&L){addEnemy('artillery',{x:laneX(L),y:-30});}
 else if(k==='dome'&&L){const x=laneX(L),d=addEnemy('dome',{x,y:-40});for(const sd of[-1,1])addEnemy(st.biome==='city'?'aa':'tank',{x:x+sd*30,y:-60,vy:0});}
 else{const n=3,x0=rnd(90,310);for(let i=0;i<n;i++)addEnemy('fighter',{x:x0+(i-1)*30,y:-30-Math.abs(i-1)*26,mv:'dive',vy:(165+6*s)*spd,vx:0});}}
function spawnBoss(){const st=G.st,b=LV.boss,k=b.kind,hp=(300+240*G.si)*G.M.hp;
 const B={kind:k,sp:b.info,x:W/2,y:-b.info.ry-60,ty:lyAt(k==='gunship'?.25:k==='land'?.23:.2),hp,max:hp,t:0,phase:1,pi:0,pt:1.5,pTime:0,flash:0,on:false,dying:0,laser:null,sum:7,
  pats:{ship:['rain','ring','laser'],wing:['fan','spiral','missiles'],land:['fan','ring','missiles'],gunship:['spiral','laser','rain']}[k]};
 B.tur=b.info.tur.map(([dx,dy],i)=>({dx,dy,x:0,y:0,r:20,hp:hp*.14,max:hp*.14,flash:0,ft:0,isTur:1,fc:rnd(.5,1.5),ang:Math.PI/2,m:b.turs[i]}));
 for(const t of b.turs){t.visible=true;t.getObjectByName('gun').visible=true;}
 B.core={dx:b.info.core[0],dy:b.info.core[1],x:0,y:0,r:26,isCore:1,ft:0};G.boss=B;b.g.visible=true;}

// ---------- effects ----------
const HQ=()=>save.hq;
function blast(x,y,size,ground){const n=Math.min(36,(HQ()?8:4)+size*(HQ()?10:5));
 for(let i=0;i<n;i++){const a=Math.random()*TAU,v=Math.random()*90*size+30;G.parts.push({k:'f',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:rnd(.25,.6),m:.6,c:Math.random()<.4?'#ffe08a':'#ff7a2e',r:rnd(6,12)*Math.sqrt(size)});}
 for(let i=0;i<n/2;i++){const a=Math.random()*TAU,v=rnd(150,380)*Math.sqrt(size);G.parts.push({k:'k',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:rnd(.2,.45),m:.45,c:'#fff3c4',r:1.5});}
 for(let i=0;i<size*(HQ()?3:1.5);i++)G.parts.push({k:'s',x:x+rnd(-8,8)*size,y:y+rnd(-8,8)*size,vx:rnd(-20,20),vy:rnd(-20,20),l:rnd(.7,1.3),m:1.3,c:'#2a2420',r:rnd(6,10)*size});
 for(let i=0;i<size*2;i++){const a=Math.random()*TAU,v=rnd(60,200);G.parts.push({k:'d',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:rnd(.4,.9),m:.9,c:pick(['#2a2c30','#4a4d52','#6b5a44']),r:rnd(1.5,3.5),a:Math.random()*6,va:rnd(-12,12)});}
 G.parts.push({k:'o',x,y,vx:0,vy:0,l:.35,m:.35,c:'#ffffff',r:14*size});
 if(size>=1.4)flashLight(x,y,size,ground);
 const cap=HQ()?650:320;if(G.parts.length>cap)G.parts.splice(0,G.parts.length-cap);}
function spark(x,y,c='#fff3c4',n=2){for(let i=0;i<n;i++){const a=Math.random()*TAU,v=rnd(60,200);G.parts.push({k:'k',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:rnd(.1,.25),m:.25,c,r:1.2});}}
function addScore(x,y,pts){const m=1+Math.min(7,Math.floor(G.chain/5)),v=pts*m*G.M.score;G.score+=v;if(G.pops.length<30)G.pops.push({x,y,t:fmt(v),l:.8,big:m>1});}
function dropGears(x,y,n){const v=Math.round((1+G.si*.5)*G.M.gear);for(let i=0;i<n;i++)G.pk.push({k:'gear',x:x+rnd(-12,12),y:y+rnd(-12,12),vx:rnd(-60,60),vy:rnd(-90,-20),v});}
function drop(k,x,y){G.pk.push({k,x,y,vx:rnd(-20,20),vy:-40,t:0});}
function vib(ms){if(save.vib&&navigator.vibrate)try{navigator.vibrate(ms);}catch(e){}}
function ring(x,y,n,spd,k='ering',off=0){for(let i=0;i<n;i++)eb(x,y,off+i*TAU/n,spd,k);}
function kill(e){e.dead=1;
 if(e.type==='mine'&&e.boom){blast(e.x,e.y,1.2);sfx('pop');return;}
 G.killed++;G.kills++;G.chain++;G.chainT=1.8;addScore(e.x,e.y,e.pts);dropGears(e.x,e.y,e.g);
 const sz=e.type==='bomber'?2.8:['heli','hornet','boat','tank','hydra','sower','mender','dome','artillery','sam'].includes(e.type)?1.5:1;blast(e.x,e.y,sz,e.ground);sfx(sz>1.4?'boom':'pop');
 if(e.ground)addDecal(e.x,e.y,e.r*1.5);
 if(e.type==='hydra'){for(let i=0;i<3;i++)addEnemy('drone',{x:e.x+Math.cos(i/3*TAU)*20,y:e.y+Math.sin(i/3*TAU)*20,sp:(130+8*G.si)*G.M.spd,vx:Math.cos(i/3*TAU)*150,vy:Math.sin(i/3*TAU)*150});say('hydra_s','It split! Drones incoming.',1,20);}
 if(e.type==='dome')say('dome_d','Shield generator destroyed. Their ground shields are down.',1,15);
 if(e.type==='bomber'||e.type==='mender')drop('Hp',e.x,e.y);else if(e.carrier||G.kills%15===0)drop('P',e.x,e.y);else if(Math.random()<.035)drop('Hp',e.x,e.y);else if(Math.random()<.015)drop('B',e.x,e.y);
 G.shake=Math.max(G.shake,sz>1.4?.22:.07);
 if(G.chain===10)say('c10','Chain times ten. Keep it going!',1,30);else if(G.chain===25)say('c25','Twenty-five chain. Impressive flying.',1,60);else if(G.chain===50)say('c50','Fifty chain! You are on fire, Rex.',1,90);}
function hurt(t,d){if(t.isCore){const B=G.boss;const shielded=B.tur.some(q=>q.hp>0);B.hp-=d*(shielded?.3:1);B.flash=.05;return;}
 if(t.isTur){t.hp-=d;t.flash=.05;if(t.hp<=0&&!t.dead){t.dead=1;blast(t.x,t.y,1.8,G.boss.sp.ground);sfx('boom');dropGears(t.x,t.y,6);addScore(t.x,t.y,3000);G.shake=.3;if(t.m)t.m.getObjectByName('gun').visible=false;
  const left=G.boss.tur.filter(q=>q.hp>0).length;say('tur'+left,left?`Turret down. ${left} to go.`:'All turrets destroyed. The reactor shield is down. Hit the core!',left?1:2,0);}return;}
 if(t.domed)d*=.25;
 if(t.sh>0){t.sh-=d;t.lastHit=t.t;t.shHit=.12;if(t.sh<0){t.hp+=t.sh;t.sh=0;spark(t.x,t.y,'#9fe8ff',6);sfx('zap');}if(t.hp>0)return;}
 t.hp-=d;t.flash=.05;if(t.hp<=0&&!t.dead)kill(t);}
function hurtPlayer(base){if(save.god||G.p.inv>0||G.endT>=0||G.p.hp<=0)return;const d=base*G.M.dmg*(1+.04*G.si);G.p.hp-=d;G.p.inv=1;G.hits++;G.shake=.3;G.chain=0;sfx('hurt');vib(40);spark(G.p.x,G.p.y,'#ffffff',8);
 if(G.p.hp<=0){G.p.hp=0;blast(G.p.x,G.p.y,2.6);sfx('boom');vib(200);G.endT=2.2;G.win=false;say('down',"We're hit! Ejecting. I've got you, Rex.",3,0);}
 else if(G.p.hp<G.p.max*.25&&!G.lowHp){G.lowHp=true;say('low','Warning, hull critical! Grab a repair kit or use a bomb.',2,0);}
 else if(G.p.hp<G.p.max*.5&&!G.halfHp){G.halfHp=true;say('half','Hull integrity at fifty percent.',1,0);}updHud();}
function bomb(){if(state!=='play'||G.bombs<=0||G.endT>=0||G.p.hp<=0)return;G.bombs--;G.flash=.6;G.shake=.6;sfx('bomb');vib(120);
 G.parts.push({k:'o',x:G.p.x,y:G.p.y,vx:0,vy:0,l:.7,m:.7,c:'#ffffff',r:520});flashLight(G.p.x,G.p.y,3,false);
 for(const b of G.eb)if(Math.random()<.3)spark(b.x,b.y,'#ffffff',1);G.eb.length=0;G.marks.length=0;
 for(const e of G.en)if(e.y>-20&&!e.delay){e.sh=0;hurt(e,60*G.hpm);}
 const B=G.boss;if(B&&B.on&&!B.dying){B.hp-=B.max*.06;for(const q of B.tur)if(q.hp>0)hurt(q,q.max*.3);}updHud();}
function aim(e){return Math.atan2(G.p.y-e.y,G.p.x-e.x);}
function eb(x,y,a,spd,k='o'){const b={x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,k,r:k==='big'?7:k==='m'?6:k==='sh'?5:k==='el'?5:4.5,life:k==='m'?4:0};G.eb.push(b);return b;}

// ---------- update ----------
function update(dt){const p=G.p,alive=p.hp>0,M=G.M,s=G.si,spd=M.spd*(1+.03*s);G.t+=dt;gz3+=C3.v*dt;
 if(G.flash>0)G.flash-=dt;if(G.shake>0)G.shake-=dt;if(p.inv>0)p.inv-=dt;
 if(G.chainT>0){G.chainT-=dt;if(G.chainT<=0)G.chain=0;}G.gp=Math.max(0,G.gp-dt*4);
 G.shown+=Math.max(1,(G.score-G.shown)*Math.min(1,dt*8));if(G.shown>G.score)G.shown=G.score;
 const kx=(keys.ArrowRight||keys.d?1:0)-(keys.ArrowLeft||keys.a?1:0),ky=(keys.ArrowDown||keys.s?1:0)-(keys.ArrowUp||keys.w?1:0);
 const pl=PLANES[save.plane];if(kx||ky){p.tx+=kx*330*pl.spd*dt;p.ty+=ky*330*pl.spd*dt;}
 p.tx=clamp(p.tx,16,W-16);p.ty=clamp(p.ty,lyAt(.16),H-30);
 const dx=p.tx-p.x,dy=p.ty-p.y,dd=Math.hypot(dx,dy),mx=1100*pl.spd*dt;if(dd>mx){p.x+=dx/dd*mx;p.y+=dy/dd*mx;}else{p.x=p.tx;p.y=p.ty;}
 p.vx=(p.x-p.px)/dt;p.bank+=(clamp(p.vx/320,-1,1)-p.bank)*Math.min(1,dt*10);p.px=p.x;
 // dome shields
 const domes=G.en.filter(e=>e.type==='dome'&&!e.dead&&e.y>-20);for(const e of G.en)if(e.ground&&e.type!=='dome')e.domed=domes.some(d=>(d.x-e.x)**2+(d.y-e.y)**2<130*130);
 TG.length=0;for(const e of G.en)if(!e.dead&&e.y>-10&&e.y<H+10&&!e.delay&&!(e.type==='wraith'&&e.cl)&&!(e.type==='blink'&&e.tp>0))TG.push(e);
 const B=G.boss;if(B&&B.on&&!B.dying){for(const q of B.tur){q.x=B.x+q.dx;q.y=B.y+q.dy;if(q.hp>0)TG.push(q);}B.core.x=B.x+B.core.dx;B.core.y=B.y+B.core.dy;TG.push(B.core);}
 for(const t of TG)if(t.ft>0)t.ft-=dt;
 G.laser=null;
 if(alive&&G.endT<0&&G.t>.6){const L=ef(),dm=G.dmg,w=save.weapon;p.fc-=dt*G.rate;
  if(w==='vulcan'){if(p.fc<=0){p.fc=.085;const n=Math.min(5,1+Math.floor(L/3));for(let i=0;i<n;i++){const o=(i-(n-1)/2)*8;G.pb.push({x:p.x+o,y:p.y-24,vx:o*3,vy:-780,d:(1+.3*L)*dm,k:'v',r:4});}sfx('shot');}}
  else if(w==='spread'){if(p.fc<=0){p.fc=.15;const n=Math.min(9,3+Math.floor(L/2)),arc=.3+n*.07;for(let i=0;i<n;i++){const a=-Math.PI/2+(i/(n-1)-.5)*arc;G.pb.push({x:p.x,y:p.y-20,vx:Math.cos(a)*640,vy:Math.sin(a)*640,d:(.85+.22*L)*dm,k:'s',r:4});}sfx('shot');}}
  else if(w==='flamer'){if(p.fc<=0){p.fc=.03;for(let i=0;i<(HQ()?2:1);i++){const a=-Math.PI/2+rnd(-.2,.2),v=rnd(380,470),life=.28+.02*L;G.pb.push({x:p.x+rnd(-4,4),y:p.y-24,vx:Math.cos(a)*v+p.vx*.25,vy:Math.sin(a)*v,d:(2+.6*L)*dm,k:'f',r:9,life,m:life});}sfx('flame');}}
  else if(w==='laser'){G.laser={w:5+L*.9,dps:(20+9*L)*dm,pierce:L>=6,end:0};}
  else if(w==='plasma'){if(p.fc<=0){p.fc=.42;const n=L>=8?3:L>=4?2:1;for(let i=0;i<n;i++){const a=-Math.PI/2+(i-(n-1)/2)*.16;G.pb.push({x:p.x,y:p.y-24,vx:Math.cos(a)*470,vy:Math.sin(a)*470,d:(8+3*L)*dm,k:'p',r:8});}sfx('plasma');}}
  const ml=save.parts.missile;if(ml>0){p.mc-=dt;if(p.mc<=0){p.mc=Math.max(.35,1.1-.09*ml);for(const sd of[-1,1])G.pb.push({x:p.x+sd*12,y:p.y+4,vx:sd*120,vy:-120,d:(3+ml)*dm,k:'m',r:4,t:0});}}
  for(const d of G.dr){const lv=save.dl[G.drone]||0;
   if(G.drone==='shielddrone'){d.a+=dt*3.2;d.x=p.x+Math.cos(d.a)*36;d.y=p.y+Math.sin(d.a)*36;const rr=11+lv;for(const b of G.eb)if(!b.dead&&(b.x-d.x)**2+(b.y-d.y)**2<rr*rr){b.dead=1;spark(b.x,b.y,'#bff4ff',3);}
    for(const e of TG)if(!e.isCore&&!e.isTur&&(e.x-d.x)**2+(e.y-d.y)**2<(e.r+8)**2&&e.ft<=0){hurt(e,(2+lv)*dm);e.ft=.1;}}
   else{d.x+=(p.x+d.s*32-d.x)*Math.min(1,dt*9);d.y+=(p.y+14-d.y)*Math.min(1,dt*9);d.fc-=dt;
    if(G.drone==='gundrone'&&d.fc<=0){d.fc=.2;G.pb.push({x:d.x,y:d.y-10,vx:0,vy:-720,d:(1+.4*lv)*dm,k:'v',r:3});}
    if(G.drone==='laserdrone'&&d.fc<=0){let best=null,bd=320*320;for(const t of TG){const q=(t.x-d.x)**2+(t.y-d.y)**2;if(q<bd&&t.y<d.y){bd=q;best=t;}}if(best){d.fc=Math.max(.45,1-.06*lv);hurt(best,(6+3*lv)*dm);d.zap=.12;d.zx=best.x;d.zy=best.y;spark(best.x,best.y,'#9fe8ff',4);sfx('zap');}else d.fc=.2;}
    if(d.zap>0)d.zap-=dt;}}}
 // stage flow
 if(G.t<G.len){G.spawnT-=dt;if(G.spawnT<=0){spawnWave();G.spawnT=Math.max(.75,2.1-.12*s)/Math.sqrt(M.fire)*rnd(.8,1.2);}
  if(!G.said.first&&G.t>2.5){G.said.first=1;say('first','Contacts inbound. Twelve o\'clock.',1,0);}
  if(!G.midDone&&G.t>G.len*.5){G.midDone=true;say('mid','Halfway to the target. Keep the pressure on.',1,0);}}
 else if(!G.boss&&G.bossT<0&&(G.en.length===0||G.t>G.len+6)){G.bossT=2.6;G.warnT=2.6;sfx('warn');vib(80);say('boss',`Large signature detected. It is the ${G.st.boss.name}! Take out its turrets to drop the shield.`,3,0);}
 if(G.bossT>0){G.bossT-=dt;if(G.bossT<=0)spawnBoss();}if(G.warnT>0)G.warnT-=dt;
 for(const b of G.pb){if(b.k==='m'){b.t+=dt;let tg=null,best=1e9;for(const e of TG){const d=(e.x-b.x)**2+(e.y-b.y)**2;if(d<best){best=d;tg=e;}}
   const sp=Math.min(560,140+b.t*900);let a=Math.atan2(b.vy,b.vx);if(tg&&b.t>.12){let da=Math.atan2(tg.y-b.y,tg.x-b.x)-a;while(da>Math.PI)da-=TAU;while(da<-Math.PI)da+=TAU;a+=clamp(da,-7*dt,7*dt);}
   b.vx=Math.cos(a)*sp;b.vy=Math.sin(a)*sp;if(Math.random()<.5)G.parts.push({k:'s',x:b.x,y:b.y,vx:0,vy:0,l:.35,m:.35,c:'#cfd6dc',r:2.5});}
  if(b.k==='f'){b.life-=dt;b.vx*=.97;b.vy*=.97;if(b.life<=0)b.dead=1;}
  b.x+=b.vx*dt;b.y+=b.vy*dt;}
 // enemies
 for(const e of G.en){if(e.delay){e.delay-=dt;if(e.delay<=0)e.delay=0;else continue;}
  e.t+=dt;if(e.flash>0)e.flash-=dt;if(e.shHit>0)e.shHit-=dt;const fr=M.fire,T=e.type;
  if(T==='fighter'||T==='fighter2'){
   if(e.mv==='dive'){e.y+=e.vy*dt;if(e.t<1.2)e.x+=(p.x-e.x)*.5*dt;e.rot=0;}
   else if(e.mv==='swoop'){e.vx+=e.side*130*dt;e.x+=e.vx*dt;e.y+=e.vy*dt;e.rot=Math.atan2(e.vy,e.vx)-Math.PI/2;}
   else if(e.mv==='escort'){const l=e.lead;if(l&&!l.dead){e.y+=e.vy*dt;e.x+=((l.x+(e.x<l.x?-55:55))-e.x)*dt*2;}else{e.y+=160*dt;}}
   e.fire-=dt;if(e.fire<=0&&e.y>40&&e.y<H*.6&&(e.shots|0)<(s>4||T==='fighter2'?2:1)){e.shots=(e.shots|0)+1;e.fire=1.1/fr;eb(e.x,e.y+12,aim(e),(170+8*s)*spd);}}
  else if(T==='heli'||T==='hornet'){if(e.t<3)e.y+=(e.ty-e.y)*1.6*dt;else if(e.t<10){e.x+=Math.sin(e.t*.9)*50*dt;e.y+=(e.ty-e.y)*dt;}else{e.y+=110*dt;}
   e.rot=clamp(Math.cos(e.t*.9)*.15,-.2,.2);e.fire-=dt;
   if(e.fire<=0&&e.y>30){if(T==='heli'){e.fire=1.9/fr;const a=aim(e);for(let i=0;i<3;i++)eb(e.x,e.y+16,a+(i-1)*.12,(150+8*s)*spd);}else{e.fire=3/fr;for(const sd of[-1,1])eb(e.x+sd*14,e.y+10,Math.PI/2+sd*.6,125*spd,'m');sfx('lance');}}}
  else if(T==='bomber'){e.y+=e.vy*dt;e.fire-=dt;if(e.fire<=0&&e.y>30&&e.y<H*.7){e.fire=2.1/fr;const a=aim(e),n=5+Math.min(4,s>>1);for(let i=0;i<n;i++)eb(e.x,e.y+20,a+(i-(n-1)/2)*.17,(140+8*s)*spd);}}
  else if(T==='drone'){const a=aim(e);e.vx+=(Math.cos(a)*e.sp-e.vx)*dt*1.4;e.vy+=(Math.sin(a)*e.sp-e.vy)*dt*1.4;if(e.t>7)e.vy=Math.max(e.vy,120);e.x+=e.vx*dt;e.y+=e.vy*dt;e.rot+=dt*4;}
  else if(T==='aegis'){e.y+=e.vy*dt;e.x+=(e.x0+Math.sin(e.t*1.3+e.ph)*55-e.x)*Math.min(1,dt*3);if(e.sh<e.shMax&&e.t-e.lastHit>2.4)e.sh=Math.min(e.shMax,e.sh+e.shMax*.45*dt);
   e.fire-=dt;if(e.fire<=0&&e.y>40&&e.y<H*.65){e.fire=1.5/fr;eb(e.x,e.y+12,aim(e),(170+8*s)*spd);}}
  else if(T==='lancer'){if(e.st===0){e.y+=(e.ty-e.y)*1.8*dt;if(e.t>1.6){e.st=1;e.stT=1.1;e.la=aim(e);sfx('lance');}}
   else if(e.st===1){e.stT-=dt;e.rot=e.la-Math.PI/2;if(e.stT<=0){e.st=2;e.stT=.3;for(let i=0;i<6;i++){const b=eb(e.x+Math.cos(e.la)*(18+i*16),e.y+Math.sin(e.la)*(18+i*16),e.la,620*spd,'el');}e.vol++;}}
   else if(e.st===2){e.stT-=dt;if(e.stT<=0){if(e.vol>=2){e.st=3;}else{e.st=0;e.t=0;e.ty=rnd(lyAt(.1),lyAt(.28));e.x=clamp(e.x+rnd(-90,90),40,W-40);}}}
   else{e.y-=120*dt;}e.hd=e.st===1||e.st===2?e.la:Math.PI/2;}
  else if(T==='hydra'){e.y+=48*spd*dt;e.x+=(e.x0+Math.sin(e.t*.8)*60-e.x)*Math.min(1,dt*2);e.rot+=dt*.8;e.fire-=dt;if(e.fire<=0&&e.y>30&&e.y<H*.65){e.fire=1.7/fr;const a=aim(e);for(let i=-1;i<=1;i++)eb(e.x,e.y,a+i*.22,(160+8*s)*spd);}}
  else if(T==='wraith'){const c=e.t%3.8,was=e.cl;e.cl=c<2.2?1:0;if(e.cl&&!was){e.tx=clamp(p.x+rnd(-120,120),40,W-40);e.ty=rnd(lyAt(.1),lyAt(.4));}
   if(e.t<11){e.x+=(e.tx-e.x)*dt*(e.cl?1.6:.3);e.y+=((e.ty||lyAt(.2))-e.y)*dt*(e.cl?1.6:.3);}else e.y+=170*dt;
   if(!e.cl&&was)sfx('blink');if(!e.cl&&c>2.7&&!e.shotC){e.shotC=1;const a=aim(e);for(let i=-2;i<=2;i++)eb(e.x,e.y,a+i*.14,(180+8*s)*spd);}if(e.cl)e.shotC=0;}
  else if(T==='sower'){e.x+=e.vx*dt;e.y+=Math.sin(e.t*2)*10*dt;e.rot+=dt*2;e.mt-=dt;if(e.mt<=0&&e.x>20&&e.x<W-20){e.mt=1.15/Math.sqrt(fr);addEnemy('mine',{x:e.x,y:e.y+10,vy:35});sfx('mine');}
   if(e.t>2&&(e.x<-60||e.x>W+60))e.dead=1;}
  else if(T==='mine'){e.y+=e.vy*dt;e.vy*=.995;e.rot+=dt;if(e.t>4.2){e.boom=1;ring(e.x,e.y,10+Math.min(6,s),(130+6*s)*spd,'ering',e.t);hurt(e,999);}}
  else if(T==='mender'){if(e.t<3)e.y+=(e.ty-e.y)*1.5*dt;else if(e.t<16)e.x+=Math.sin(e.t*.6)*40*dt;else e.y-=100*dt;
   e.ht-=dt;if(e.ht<=0){e.ht=1.6;let best=null,bd=180*180;for(const o of G.en){if(o===e||o.dead||o.type==='mender'||o.type==='mine'||o.hp>=o.max)continue;const q=(o.x-e.x)**2+(o.y-e.y)**2;if(q<bd){bd=q;best=o;}}
    if(best){best.hp=Math.min(best.max,best.hp+best.max*.35);if(best.sh!==undefined)best.sh=best.shMax;G.beams.push({a:e,b:best,t:.45});sfx('heal');spark(best.x,best.y,'#7fffb0',5);}}
   e.fire-=dt;if(e.fire<=0&&e.y>30){e.fire=2.6/fr;eb(e.x,e.y,aim(e),(150+8*s)*spd,'big');}}
  else if(T==='blink'){if(e.tp>0){e.tp-=dt;if(e.tp<=0){e.x=rnd(60,W-60);e.y=rnd(lyAt(.1),lyAt(.4));e.bt=0;e.shown=1;spark(e.x,e.y,'#c07bff',10);}}
   else{e.bt+=dt;if(e.bt>.85&&!e.fired){e.fired=1;ring(e.x,e.y,12,(140+6*s)*spd,'ebig',e.t);}
    if(e.bt>1.9){e.fired=0;e.jumps++;if(e.jumps>=4){e.dead=1;spark(e.x,e.y,'#c07bff',12);}else{e.tp=.35;sfx('blink');spark(e.x,e.y,'#c07bff',10);}}}}
  else if(T==='tank'){e.y+=(SCROLL+e.vy)*dt;e.ang=aim(e);e.fire-=dt;if(e.fire<=0&&e.y>20&&e.y<H*.75){e.fire=2.3/fr;eb(e.x+Math.cos(e.ang)*18,e.y+Math.sin(e.ang)*18,e.ang,(165+8*s)*spd,'sh');}}
  else if(T==='aa'){e.y+=SCROLL*dt;e.ang=aim(e);e.fire-=dt;if(e.fire<=0&&e.y>20&&e.y<H*.75){e.fire=1.7/fr;for(let i=0;i<2;i++)eb(e.x+Math.cos(e.ang)*16,e.y+Math.sin(e.ang)*16,e.ang+(i-.5)*.08,(190+8*s)*spd);}}
  else if(T==='sam'){e.y+=SCROLL*dt;e.ang=aim(e);e.fire-=dt;if(e.fire<=0&&e.y>20&&e.y<H*.7){e.fire=3.4/fr;eb(e.x,e.y,e.ang,130*spd,'m');sfx('lance');}}
  else if(T==='artillery'){e.y+=SCROLL*dt;e.ang=aim(e);e.fire-=dt;if(e.fire<=0&&e.y>20&&e.y<H*.8){e.fire=3.8/fr;G.marks.push({x:p.x,y:p.y,t:1.35,m:1.35,r:36});sfx('mine');}}
  else if(T==='dome'){e.y+=SCROLL*dt;}
  else if(T==='truck'){e.y+=(SCROLL+e.vy)*dt;}
  else if(T==='boat'){e.y+=SCROLL*dt*.8;e.x+=e.vx*dt;if(e.x<e.x0||e.x>e.x1)e.vx=-e.vx;e.hd=e.vx>0?0:Math.PI;e.ang=aim(e);
   if(Math.random()<dt*14)G.parts.push({k:'w',x:e.x-Math.sign(e.vx)*20,y:e.y+rnd(-3,3),vx:0,vy:SCROLL*.8,l:1.2,m:1.2,c:'#ffffff',r:rnd(2,4)});
   e.fire-=dt;if(e.fire<=0&&e.y>20&&e.y<H*.7){e.fire=2.4/fr;eb(e.x,e.y,e.ang,(160+8*s)*spd,'sh');}}
  if(alive&&!e.ground&&!(T==='wraith'&&e.cl)&&!(T==='blink'&&e.tp>0)&&(e.x-p.x)**2+(e.y-p.y)**2<(e.r+8)**2){if(T==='drone'||T==='mine'){if(T==='mine')e.boom=0;hurt(e,999);}else e.hp-=5;hurtPlayer(T==='drone'?14:20);}}
 // artillery marks
 for(const m of G.marks){m.t-=dt;if(m.t<=0){m.dead=1;blast(m.x,m.y,1.5);sfx('boom');G.shake=Math.max(G.shake,.15);if(alive&&(p.x-m.x)**2+(p.y-m.y)**2<m.r*m.r)hurtPlayer(20);}}prune(G.marks,m=>!m.dead);
 for(const b of G.beams)b.t-=dt;prune(G.beams,b=>b.t>0);
 // boss
 if(B){B.t+=dt;if(B.flash>0)B.flash-=dt;for(const q of B.tur)if(q.flash>0)q.flash-=dt;
  if(B.dying>0){B.dying-=dt;if(Math.random()<dt*12){blast(B.x+rnd(-B.sp.rx,B.sp.rx),B.y+rnd(-B.sp.ry,B.sp.ry),rnd(1,2.4),B.sp.ground);sfx('pop');G.shake=Math.max(G.shake,.2);}
   if(B.dying<=0){blast(B.x,B.y,5,B.sp.ground);blast(B.x-60,B.y,3);blast(B.x+60,B.y,3);sfx('boom');G.flash=.8;G.shake=1;vib(300);if(B.sp.ground)addDecal(B.x,B.y,90);G.boss=null;LV.boss.g.visible=false;G.endT=3;G.win=true;sfx('win');
    say('won','Target destroyed. Outstanding flying, Rex! Mission complete.',3,0);}}
  else if(!B.on){B.y+=70*dt;if(B.y>=B.ty-40)B.on=true;}
  else{B.y+=(B.ty-B.y)*dt;B.x=W/2+Math.sin(B.t*.45)*(B.kind==='ship'?35:65);
   const f=B.hp/B.max,ph=f>.66?1:f>.33?2:3;if(ph!==B.phase){B.phase=ph;say('ph'+ph,ph===2?'Its armour is cracking. Keep firing!':'Reactor exposed! It is getting desperate. Watch for heavy fire.',2,0);}
   const rage=ph===3?.7:1,fr=M.fire,bs=(150+9*s)*spd;
   if(s>=4){B.sum-=dt;if(B.sum<=0){B.sum=11-Math.min(4,s-4)*.6;const n=2+Math.min(3,s-4);for(let i=0;i<n;i++)addEnemy('drone',{x:B.x+(i-(n-1)/2)*40,y:B.y+30,sp:(120+8*s)*spd});if(s>=7)for(const sd of[-1,1])addEnemy('mine',{x:B.x+sd*90,y:B.y+20,vy:45});say('summon','It is launching drones!',1,30);}}
   for(const q of B.tur){if(q.hp<=0){if(Math.random()<dt*3)G.parts.push({k:'s',x:q.x+rnd(-6,6),y:q.y,vx:rnd(-10,10),vy:-20,l:1,m:1,c:'#2a2420',r:rnd(5,9)});continue;}
    q.ang=Math.atan2(p.y-q.y,p.x-q.x);q.fc-=dt;if(q.fc<=0){q.fc=1.7*rage/fr;const n=ph>=3?3:1;for(let i=0;i<n;i++)eb(q.x+Math.cos(q.ang)*20,q.y+Math.sin(q.ang)*20,q.ang+(i-(n-1)/2)*.15,bs*1.05);}}
   B.pTime+=dt;const avail=Math.min(B.pats.length,ph+1);if(B.pTime>5.5&&!B.laser){B.pTime=0;B.pi=(B.pi+1)%avail;B.pt=.6;}
   const pat=B.pats[B.pi%avail],cx0=B.core.x,cy0=B.core.y;B.pt-=dt;
   if(B.laser){const L=B.laser;L.t+=dt;if(L.t<1.1){}else if(L.t<1.8){if(L.t-dt<1.1){sfx('bomb');G.shake=.3;}const ax=Math.cos(L.a),ay=Math.sin(L.a),rx=p.x-cx0,ry=p.y-cy0,along=rx*ax+ry*ay,perp=Math.abs(rx*ay-ry*ax);if(along>0&&perp<16)hurtPlayer(16);}else B.laser=null;}
   else if(B.pt<=0){
    if(pat==='spiral'){B.pt=.09*rage/Math.sqrt(fr);const arms=3+(ph>1?1:0);for(let k=0;k<arms;k++)eb(cx0,cy0,B.t*2.1+k*TAU/arms,bs*.85);}
    else if(pat==='ring'){B.pt=1.15*rage/fr;const n=16+2*Math.min(6,s);for(let i=0;i<n;i++)eb(cx0,cy0,i*TAU/n+B.t,bs*.85,i%2?'o':'big');}
    else if(pat==='fan'){B.pt=.8*rage/fr;const a=Math.atan2(p.y-cy0,p.x-cx0),n=ph>=3?9:7;for(let i=0;i<n;i++)eb(cx0,cy0+10,a+(i-(n-1)/2)*.14,bs*1.1);}
    else if(pat==='missiles'){B.pt=2.3*rage/fr;for(let i=0;i<4;i++)eb(cx0+(i-1.5)*30,cy0,Math.PI/2+(i-1.5)*.4,120*spd,'m');}
    else if(pat==='rain'){B.pt=.13*rage/Math.sqrt(fr);eb(B.x+rnd(-B.sp.rx,B.sp.rx),B.y+B.sp.ry*.5,Math.PI/2+rnd(-.25,.25),bs*rnd(.8,1.1));}
    else if(pat==='laser'){B.pt=1;B.laser={t:0,a:Math.atan2(p.y-cy0,p.x-cx0)};say('laser','Charging laser! Move!',1,12);}}
   if(alive&&Math.abs(B.x-p.x)<B.sp.rx*.8&&Math.abs(B.y-p.y)<B.sp.ry*.8)hurtPlayer(25);
   if(B.hp<=0){B.dying=2.4;B.laser=null;G.eb.length=0;G.marks.length=0;addScore(B.x,B.y,25000*(s+1));dropGears(B.x,B.y,30+s*5);G.killed++;G.spawned++;vib(150);}}}
 // collisions
 const BB=G.boss&&G.boss.on&&!G.boss.dying?G.boss:null;
 for(const b of G.pb){if(b.dead)continue;
  for(const t of TG){if(t.hp!==undefined&&t.hp<=0&&!t.isCore)continue;const rr=t.r+b.r+(t.sh>0?6:0);if((t.x-b.x)**2+(t.y-b.y)**2<rr*rr){
    if(b.k==='f'){if(t.ft<=0){hurt(t,b.d);t.ft=.06;}continue;}
    hurt(t,b.d);b.dead=1;if(Math.random()<.4)spark(b.x,b.y,t.sh>0?'#9fe8ff':'#fff3c4');sfx('hit');
    if(b.k==='p'){blast(b.x,b.y,.8);for(const o of TG)if(o!==t&&(o.x-b.x)**2+(o.y-b.y)**2<55*55)hurt(o,b.d*.5);}break;}}
  if(!b.dead&&BB){const nx=(b.x-BB.x)/BB.sp.rx,ny=(b.y-BB.y)/BB.sp.ry;if(nx*nx+ny*ny<1){b.dead=1;if(b.k!=='f')spark(b.x,b.y,'#ffe2a8',2);}}}
 if(G.laser){const L=G.laser,hw=L.w/2;const hits=[];for(const t of TG){if(t.hp!==undefined&&t.hp<=0&&!t.isCore)continue;if(Math.abs(t.x-p.x)<t.r+hw&&t.y<p.y)hits.push(t);}
  hits.sort((a,b)=>b.y-a.y);let end=-20;
  if(L.pierce){for(const t of hits)hurt(t,L.dps*dt);}else if(hits.length){hurt(hits[0],L.dps*dt);end=hits[0].y;}
  if(BB&&!L.pierce){const nx=(p.x-BB.x)/BB.sp.rx;if(Math.abs(nx)<1){const by=BB.y+BB.sp.ry*Math.sqrt(1-nx*nx)*.85;if(by<p.y&&by>end){end=by;}}}
  L.end=end;if(Math.random()<.5)spark(p.x+rnd(-hw,hw),end,'#bff8ff',1);sfx('hit');}
 prune(G.pb,b=>!b.dead&&b.y>-30&&b.y<H+30&&b.x>-60&&b.x<W+60);
 prune(G.en,e=>!e.dead&&e.y<H+70&&e.x>-140&&e.x<W+140&&!(e.y<-200&&e.t>5),e=>{release(e.m);e.m=null;});
 for(const b of G.eb){if(b.k==='m'){b.life-=dt;if(b.life>1){let a=Math.atan2(b.vy,b.vx),da=Math.atan2(p.y-b.y,p.x-b.x)-a;while(da>Math.PI)da-=TAU;while(da<-Math.PI)da+=TAU;a+=clamp(da,-1.7*dt,1.7*dt);const sp=Math.hypot(b.vx,b.vy);b.vx=Math.cos(a)*sp;b.vy=Math.sin(a)*sp;}
   if(Math.random()<.5)G.parts.push({k:'s',x:b.x,y:b.y,vx:0,vy:0,l:.4,m:.4,c:'#bbb',r:2.5});}
  b.x+=b.vx*dt;b.y+=b.vy*dt;if(alive&&(b.x-p.x)**2+(b.y-p.y)**2<(b.r+5)**2){b.dead=1;hurtPlayer(b.k==='big'?15:b.k==='m'?18:b.k==='el'?14:11);}}
 // player missiles can shoot down enemy missiles
 for(const b of G.pb)if(!b.dead&&(b.k==='v'||b.k==='p'||b.k==='m'))for(const m of G.eb)if(m.k==='m'&&!m.dead&&(m.x-b.x)**2+(m.y-b.y)**2<100){m.dead=1;b.dead=1;spark(m.x,m.y,'#ffb347',5);break;}
 prune(G.eb,b=>!b.dead&&b.y>-40&&b.y<H+30&&b.x>-60&&b.x<W+60);
 for(const g of G.pk){const dx=p.x-g.x,dy=p.y-g.y,d=Math.hypot(dx,dy)||1;
  if(g.k==='gear'){if(alive&&(d<G.mag||G.endT>=0&&G.win)){g.vx=dx/d*480;g.vy=dy/d*480;}else{g.vx*=.96;g.vy=g.vy*.96+320*dt;}}
  else{g.t+=dt;if(alive&&d<70){g.vx=dx/d*300;g.vy=dy/d*300;}else{g.vx=Math.sin(g.t*2)*30;g.vy=Math.min(70,g.vy+60*dt);}}
  g.x+=g.vx*dt;g.y+=g.vy*dt;
  if(alive&&d<20){g.dead=1;if(g.k==='gear'){G.earned+=g.v;G.score+=10;sfx('gear',Math.floor(G.gp));G.gp=Math.min(14,G.gp+1);updHud();}
   else if(g.k==='P'){sfx('power');if(p.pw<2){p.pw++;say('pw'+p.pw,p.pw===2?'Weapon power at maximum!':'Weapon power increased.',1,4);updWeap();}else{addScore(g.x,g.y,1000);}}
   else if(g.k==='Hp'){sfx('power');p.hp=Math.min(p.max,p.hp+p.max*.35);G.halfHp=p.hp<p.max*.5;G.lowHp=p.hp<p.max*.25;say('hp','Repairs applied. Hull restored.',1,4);updHud();}
   else if(g.k==='B'){sfx('power');G.bombs=Math.min(9,G.bombs+1);say('bp','Extra bomb loaded.',1,4);updHud();}}}
 prune(G.pk,g=>!g.dead&&g.y<H+30);
 for(const q of G.parts){q.x+=q.vx*dt;q.y+=q.vy*dt;q.l-=dt;if(q.k==='d'){q.vx*=.95;q.vy*=.95;q.a+=q.va*dt;}else if(q.k!=='w'){q.vx*=.94;q.vy*=.94;}if(q.k==='s')q.y+=SCROLL*dt*.6;}
 prune(G.parts,q=>q.l>0);
 for(const q of G.pops){q.y-=40*dt;q.l-=dt;}prune(G.pops,q=>q.l>0);
 stepWeather(dt);
 if(G.endT>=0){G.endT-=dt;if(G.endT<0)finish();}
 stepCopilot(dt);updScore();}
const WX=[];
function stepWeather(dt){const st=STAGES[LV.si];if(!st||!HQ())return;const w=st.weather;
 if(w==='snow'&&WX.length<110)WX.push({x:rnd(-20,OW+20),y:-10,vx:rnd(-20,20),vy:rnd(60,130),r:rnd(1,2.6)});
 else if(w==='rain'&&WX.length<80)WX.push({x:rnd(0,OW+60),y:-20,vx:-90,vy:rnd(650,850),r:1});
 else if(w==='embers'&&WX.length<60)WX.push({x:rnd(0,OW),y:OH+10,vx:rnd(-20,20),vy:-rnd(40,110),r:rnd(1,2.5)});
 for(const q of WX){q.x+=q.vx*dt;q.y+=q.vy*dt;if(w==='snow')q.x+=Math.sin(q.y*.03)*20*dt;}prune(WX,q=>q.y>-30&&q.y<OH+30);}

// ================= RENDER =================
let PLM=null,DRM=[];
function showPlayerModel(){for(const k in PLANES){const m=MODELS['pl_'+k];if(!m.parent)scene.add(m);m.visible=false;}PLM=MODELS['pl_'+save.plane];PLM.visible=true;
 for(const m of DRM)scene.remove(m);DRM=[];if(G&&G.drone)for(let i=0;i<2;i++){const m=MODELS['dr_'+G.drone].clone();scene.add(m);DRM.push(m);}}
function sync3D(dt,tnow){
 for(const l of FXL){if(l.intensity>0)l.intensity=Math.max(0,l.intensity-dt*l.userData.d*3);}
 // clouds drift with the world
 for(const c of LV.clouds){if(!c.visible)continue;c.position.z+=C3.v*dt*.95;if(c.position.z>C3.z+30)spawnCloud(c,false);}
 TER.water.material.normalMap.offset.y+=C3.v*dt*36/900;TER.water.material.normalMap.offset.x=Math.sin(tnow*.2)*.02;if(TER.lava.visible){LAVA.offset.y+=C3.v*dt*40/900+dt*.01;LAVA.offset.x=Math.sin(tnow*.3)*.03;}
 if(!G||state==='title'||state==='select'||state==='hangar'||state==='settings'){
  // menu flyby: low cinematic camera with the horizon in view
  camera.position.set(Math.sin(tnow*.15)*5,GY+21,C3.z-6);camera.lookAt(Math.sin(tnow*.15)*2.5,GY+5,C3.z-100);
  if(PLM){PLM.visible=true;PLM.position.set(1+Math.sin(tnow*.6)*2.5,GY+15.4+Math.sin(tnow*1.3)*.4,C3.z-40);PLM.rotation.set(.35,-.75+Math.sin(tnow*.6)*.15,.45+Math.cos(tnow*.6)*.2);PLM.scale.setScalar(1.1);}
  fill.intensity=1.1;fill.position.copy(camera.position);fill.target.position.copy(PLM?PLM.position:camera.position);
  for(const m of DRM)m.visible=false;if(LV.boss)LV.boss.g.visible=false;
  sun.position.copy(LV.sunDir).multiplyScalar(200).add(new T3.Vector3(0,GY,C3.z-60));sun.target.position.set(0,GY,C3.z-60);
  scene.fog.near=60;scene.fog.far=430*(LV.B.fogN||1);return;}
 fill.intensity=0;camera.position.set(0,C3.y,C3.z);camera.lookAt(0,0,0);
 if(G.shake>0&&state==='play'){camera.position.x+=rnd(-.5,.5)*G.shake*2.2;camera.position.z+=rnd(-.5,.5)*G.shake*2.2;}
 scene.fog.near=230;scene.fog.far=560*(LV.B.fogN||1);
 sun.position.copy(LV.sunDir).multiplyScalar(220).add(new T3.Vector3(0,GY,(C3.Zt+C3.Zb)/2*C3.t));sun.target.position.set(0,GY,(C3.Zt+C3.Zb)/2*C3.t);
 const p=G.p;
 if(PLM){PLM.visible=p.hp>0&&!(p.inv>0&&Math.floor(G.t*20)%2===0&&!save.god&&state==='play');place(PLM,p.x,p.y,false,0);PLM.rotation.set(-.08,0,-p.bank*.75);}
 G.dr.forEach((d,i)=>{const m=DRM[i];if(!m)return;m.visible=p.hp>0;place(m,d.x,d.y,false,.2);m.rotation.y+=dt*3;});
 for(const e of G.en){if(!e.m)e.m=acquire(e.type);const m=e.m;m.visible=!e.delay;if(!m.visible)continue;
  place(m,e.x,e.y,e.ground,e.type==='mine'?-.5:0);
  const a=e.hd!==undefined?e.hd:Math.PI/2+(e.rot||0);let roll=0;
  if(e.type==='fighter'||e.type==='fighter2'||e.type==='aegis'||e.type==='lancer')roll=clamp(-(e.vx||0)/300,-.6,.6);
  m.rotation.set(0,yawFrom(a),roll);
  if(e.type==='drone'||e.type==='sower'||e.type==='hydra'||e.type==='mine')m.rotation.y=e.rot;
  if(e.type==='heli'||e.type==='hornet')m.rotation.set(.12,yawFrom(Math.PI/2),e.rot);
  for(const r of m.R.rotor)r.rotation.y+=dt*30;if(m.R.trot)m.R.trot.rotation.x+=dt*40;
  if(m.R.tur&&e.ang!==undefined)m.R.tur.rotation.y=yawFrom(e.ang)-m.rotation.y;
  if(m.R.ring.length){m.R.ring.forEach((r,i)=>{r.rotation.z+=dt*(i?-3:3);});if(e.type==='blink'){const s=e.tp>0?Math.max(.05,e.tp/.35*.3):Math.min(1,e.bt*4);m.scale.multiplyScalar(s);}}
  if(m.R.shield){if(e.type==='aegis'){m.R.shield.visible=e.sh>0;m.R.shield.material.opacity=.18+(e.shHit>0?.4:0)+.1*Math.sin(e.t*6);}else m.R.shield.material.opacity=.14+.06*Math.sin(e.t*3);}
  if(m.R.light){if(e.type==='mine')m.R.light.visible=e.t<3?Math.floor(e.t*3)%2===0:Math.floor(e.t*12)%2===0;else m.R.light.scale.setScalar(1+.25*Math.sin(e.t*6));}
  if(e.type==='wraith'){const op=e.cl?.1:1;m.traverse(o=>{if(o.isMesh){o.material.opacity+=(op-o.material.opacity)*Math.min(1,dt*8);o.castShadow=!e.cl;}});}}
 const B=G.boss,bm=LV.boss;
 if(B&&bm){bm.g.visible=true;place(bm.g,B.x,B.y,!!B.sp.ground,0);bm.g.rotation.set(0,0,0);
  for(const r of bm.rots)r.rotation.y+=dt*14;
  B.tur.forEach((q,i)=>{const gun=bm.turs[i].getObjectByName('gun');gun.rotation.y=yawFrom(q.ang);});
  const pulse=.6+.4*Math.sin(B.t*(B.phase===3?14:6));bm.coreM.emissiveIntensity=1+pulse*1.5;bm.coreM.emissive.copy(col(B.phase===3?'#ff2a3a':'#ff7a1f'));bm.ring.visible=B.tur.some(q=>q.hp>0);bm.ring.rotation.z+=dt*2;
  if(B.dying>0){bm.g.position.y-=(2.4-B.dying)*1.5;bm.g.rotation.z=(2.4-B.dying)*.08;}}
 else if(bm)bm.g.visible=false;}
// overlay helpers
function pspr(img,x,y,rot=0,s=1){pj(x,y);spr(img,PX,PY,rot,s*PS);}
function pdg(x,y,r,c){pj(x,y);dg(PX,PY,r*PS,c);}
function clipLen(x,y,ax,ay){let t=2000;const x0=-80,x1=W+80,y0=-80,y1=H+80;if(ax>0)t=Math.min(t,(x1-x)/ax);else if(ax<0)t=Math.min(t,(x0-x)/ax);if(ay>0)t=Math.min(t,(y1-y)/ay);else if(ay<0)t=Math.min(t,(y0-y)/ay);return Math.max(0,t);}
function drawOverlay(){cx.setTransform(oS,0,0,oS,0,0);cx.clearRect(0,0,OW,OH);
 const inGame=G&&(state==='play'||state==='pause'||state==='result'||state==='none');
 if(WX.length&&LV.si>=0){const w=STAGES[LV.si].weather;if(w==='snow'){cx.fillStyle='rgba(255,255,255,.85)';for(const q of WX){cx.beginPath();cx.arc(q.x,q.y,q.r,0,TAU);cx.fill();}}
  else if(w==='rain'){cx.strokeStyle='rgba(190,210,230,.35)';cx.lineWidth=1;cx.beginPath();for(const q of WX){cx.moveTo(q.x,q.y);cx.lineTo(q.x+q.vx*.03,q.y+q.vy*.03);}cx.stroke();}
  else if(w==='embers'){cx.globalCompositeOperation='lighter';for(const q of WX)dg(q.x,q.y,q.r*3,'#ff7a2e');cx.globalCompositeOperation='source-over';}}
 if(!inGame)return;
 if(G.shake>0&&state==='play')cx.translate(rnd(-4,4)*G.shake*1.6,rnd(-4,4)*G.shake*1.6);
 const P=G.p,alive=P.hp>0;
 for(const q of G.parts){if(q.k==='w'){pj(q.x,q.y);cx.globalAlpha=Math.max(0,q.l/q.m)*.55;cx.fillStyle=q.c;cx.beginPath();cx.arc(PX,PY,q.r*(2-q.l/q.m)*PS*.8,0,TAU);cx.fill();}}
 for(const q of G.parts){if(q.k==='s'){pj(q.x,q.y);cx.globalAlpha=Math.max(0,q.l/q.m)*.5;cx.fillStyle=q.c;cx.beginPath();cx.arc(PX,PY,q.r*(1.7-q.l/q.m*.7)*PS,0,TAU);cx.fill();}
  else if(q.k==='d'){pj(q.x,q.y);cx.globalAlpha=Math.max(0,q.l/q.m);cx.save();cx.translate(PX,PY);cx.rotate(q.a);cx.fillStyle=q.c;cx.fillRect(-q.r*PS,-q.r*.6*PS,q.r*2*PS,q.r*1.2*PS);cx.restore();}}
 cx.globalAlpha=1;
 // telegraphs
 for(const m of G.marks){pj(m.x,m.y);const a=1-m.t/m.m;cx.strokeStyle=`rgba(255,60,70,${.4+.5*Math.abs(Math.sin(m.t*14))})`;cx.lineWidth=2;cx.beginPath();cx.ellipse(PX,PY,m.r*PS,m.r*PS*.8,0,0,TAU);cx.stroke();cx.fillStyle=`rgba(255,60,70,${.12+a*.25})`;cx.beginPath();cx.ellipse(PX,PY,m.r*PS*a,m.r*PS*.8*a,0,0,TAU);cx.fill();
  cx.beginPath();cx.moveTo(PX-8,PY);cx.lineTo(PX+8,PY);cx.moveTo(PX,PY-8);cx.lineTo(PX,PY+8);cx.stroke();}
 for(const e of G.en){if(e.type==='lancer'&&e.st===1){const L=clipLen(e.x,e.y,Math.cos(e.la),Math.sin(e.la));pj(e.x,e.y);const x0=PX,y0=PY;pj(e.x+Math.cos(e.la)*L,e.y+Math.sin(e.la)*L);cx.strokeStyle=`rgba(255,40,60,${.35+.45*Math.abs(Math.sin(e.stT*30))})`;cx.lineWidth=1.6;cx.setLineDash([8,6]);cx.beginPath();cx.moveTo(x0,y0);cx.lineTo(PX,PY);cx.stroke();cx.setLineDash([]);}}
 for(const g of G.pk){if(g.k==='gear')pspr(SP.gear,g.x,g.y,G.t*4);else{cx.globalCompositeOperation='lighter';pdg(g.x,g.y,22,g.k==='P'?'#ff9d2e':g.k==='Hp'?'#3ddc84':'#ff4d6d');cx.globalCompositeOperation='source-over';pspr(SP[g.k],g.x,g.y,0,1+Math.sin(g.t*6)*.08);}}
 cx.globalCompositeOperation='lighter';
 if(alive&&PLM&&PLM.visible){const L=PLANES[save.plane].jet.L,n=PLANES[save.plane].jet.eng||1,f=.8+Math.sin(G.t*50)*.2;for(let i=0;i<n;i++){const ex=P.x+(n===1?0:(i-.5)*PLANES[save.plane].jet.fw*1.2);pdg(ex,P.y+L/2+4,10*f,'#ff9d2e');pdg(ex,P.y+L/2+2,5,'#fff3c4');}}
 if(G.drone==='shielddrone'&&alive)for(const d of G.dr)pdg(d.x,d.y,14+save.dl.shielddrone,'#5fc8ff');
 for(const d of G.dr)if(d.zap>0){pj(d.x,d.y);const x0=PX,y0=PY;pj(d.zx,d.zy);cx.strokeStyle='#bff4ff';cx.lineWidth=2;cx.globalAlpha=d.zap/.12;cx.beginPath();cx.moveTo(x0,y0);cx.lineTo(PX,PY);cx.stroke();cx.globalAlpha=1;}
 for(const b of G.beams){pj(b.a.x,b.a.y);const x0=PX,y0=PY;pj(b.b.x,b.b.y);cx.strokeStyle='#7fffb0';cx.globalAlpha=b.t/.45;cx.lineWidth=3;cx.beginPath();cx.moveTo(x0,y0);cx.lineTo(PX,PY);cx.stroke();cx.lineWidth=8;cx.globalAlpha*=.3;cx.stroke();cx.globalAlpha=1;}
 for(const e of G.en){if(e.flash>0&&e.m&&e.m.visible)pdg(e.x,e.y,e.r*1.3,'#ffffff');if(e.type==='blink'&&e.tp>0)pdg(e.x,e.y,30,'#c07bff');if(e.type==='lancer'&&e.st===1)pdg(e.x+Math.cos(e.la)*16,e.y+Math.sin(e.la)*16,8+Math.random()*5,'#ff3c50');}
 const B=G.boss;if(B&&B.on){for(const q of B.tur)if(q.flash>0&&q.hp>0)pdg(q.x,q.y,18,'#ffffff');const c=B.core;pdg(B.x+c.dx,B.y+c.dy,30+Math.sin(B.t*6)*8,B.phase===3?'#ff3c50':'#ff9d2e');
  if(B.laser){const L=B.laser,ax=Math.cos(L.a),ay=Math.sin(L.a),x=B.x+c.dx,y=B.y+c.dy,len=clipLen(x,y,ax,ay);pj(x,y);const x0=PX,y0=PY;pj(x+ax*len,y+ay*len);
   if(L.t<1.1){cx.globalCompositeOperation='source-over';cx.strokeStyle=`rgba(255,60,80,${.3+.4*Math.abs(Math.sin(L.t*25))})`;cx.lineWidth=2;cx.setLineDash([10,8]);cx.beginPath();cx.moveTo(x0,y0);cx.lineTo(PX,PY);cx.stroke();cx.setLineDash([]);cx.globalCompositeOperation='lighter';}
   else{for(const[w,c2]of[[40,'rgba(255,40,80,.25)'],[22,'rgba(255,70,100,.6)'],[8,'#ffffff']]){cx.strokeStyle=c2;cx.lineWidth=w;cx.beginPath();cx.moveTo(x0,y0);cx.lineTo(PX,PY);cx.stroke();}}}}
 if(G.laser&&alive){const L=G.laser;pj(P.x,P.y-26);const x0=PX,y0=PY;pj(P.x,L.end);cx.lineCap='round';for(const[w,c2]of[[L.w*3.2,'rgba(40,200,255,.25)'],[L.w*1.6,'rgba(70,215,255,.6)'],[L.w*.5,'#ffffff']]){cx.strokeStyle=c2;cx.lineWidth=w*PS;cx.beginPath();cx.moveTo(x0,y0);cx.lineTo(PX,PY);cx.stroke();}cx.lineCap='butt';pdg(P.x,P.y-28,14,'#7fe0ff');pdg(P.x,L.end,18+Math.random()*6,'#9fe8ff');}
 for(const b of G.pb){if(b.k==='v')pspr(SP.pv,b.x,b.y,Math.atan2(b.vx,-b.vy));else if(b.k==='s')pspr(SP.ps,b.x,b.y);else if(b.k==='p')pspr(SP.pp,b.x,b.y,0,1+Math.random()*.15);else if(b.k==='m'){pspr(SP.pm,b.x,b.y,Math.atan2(b.vx,-b.vy));pdg(b.x-b.vx*.02,b.y-b.vy*.02,6,'#ff9d2e');}
  else if(b.k==='f'){const a=b.life/b.m,c=a>.75?'#fff3c4':a>.45?'#ffb347':a>.2?'#ff5a1a':'#a02a10';cx.globalAlpha=Math.min(1,a*1.6);pdg(b.x,b.y,b.r*(1.9-a),c);cx.globalAlpha=1;}}
 for(const q of G.parts){if(q.k==='s'||q.k==='w'||q.k==='d')continue;const a=Math.max(0,q.l/q.m);cx.globalAlpha=a;pj(q.x,q.y);
  if(q.k==='f')dg(PX,PY,q.r*(.6+a*.6)*PS,q.c);
  else if(q.k==='k'){const x0=PX,y0=PY;pj(q.x-q.vx*.04,q.y-q.vy*.04);cx.strokeStyle=q.c;cx.lineWidth=1.8;cx.beginPath();cx.moveTo(x0,y0);cx.lineTo(PX,PY);cx.stroke();}
  else if(q.k==='o'){cx.strokeStyle=q.c;cx.lineWidth=3*a+1;cx.beginPath();cx.ellipse(PX,PY,q.r*(1.2-a)*PS,q.r*(1.2-a)*PS*.85,0,0,TAU);cx.stroke();}}
 cx.globalAlpha=1;cx.globalCompositeOperation='source-over';
 for(const b of G.eb){if(b.k==='m'){pspr(SP.em,b.x,b.y,Math.atan2(b.vx,-b.vy)+Math.PI);cx.globalCompositeOperation='lighter';pdg(b.x-b.vx*.04,b.y-b.vy*.04,7,'#ff7a2e');cx.globalCompositeOperation='source-over';}
  else if(b.k==='el')pspr(SP.el,b.x,b.y,Math.atan2(b.vx,-b.vy)+Math.PI);else pspr(b.k==='big'?SP.ebig:b.k==='sh'?SP.esh:b.k==='ering'?SP.ering:SP.eo,b.x,b.y);}
 if(save.god&&alive){pj(P.x,P.y);cx.strokeStyle='rgba(43,209,192,.45)';cx.lineWidth=2;cx.beginPath();cx.arc(PX,PY,32*PS,0,TAU);cx.stroke();}
 cx.textAlign='center';for(const q of G.pops){pj(q.x,q.y);cx.globalAlpha=Math.min(1,q.l*2);cx.font=(q.big?'16px':'12px')+' Bungee, Impact, sans-serif';cx.fillStyle='rgba(0,0,0,.55)';cx.fillText(q.t,PX+1,PY+2);cx.fillStyle=q.big?'#ffd27a':'#fff';cx.fillText(q.t,PX,PY);}cx.globalAlpha=1;
 cx.setTransform(oS,0,0,oS,0,0);
 const vg=cx.createRadialGradient(OW/2,OH/2,OH*.35,OW/2,OH/2,OH*.8);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.35)');cx.fillStyle=vg;cx.fillRect(0,0,OW,OH);
 if(G.flash>0){cx.fillStyle=`rgba(255,250,235,${Math.min(1,G.flash)})`;cx.fillRect(0,0,OW,OH);}
 if(B&&B.on){const y=128;cx.fillStyle='rgba(0,0,0,.55)';cx.fillRect(30,y,OW-60,7);cx.fillStyle=B.phase===3?'#ff3c50':'#ff9d2e';cx.fillRect(30,y,(OW-60)*Math.max(0,B.hp/B.max),7);
  cx.font='600 11px "Chakra Petch", sans-serif';cx.textAlign='left';cx.fillStyle='#fff';cx.fillText(G.st.boss.name.toUpperCase(),30,y-4);cx.textAlign='right';cx.fillText(B.tur.some(q=>q.hp>0)?'SHIELDED':'CORE EXPOSED',OW-30,y-4);}
 if(G.t<3){cx.globalAlpha=Math.min(1,(3-G.t)*1.5);cx.textAlign='center';cx.fillStyle='rgba(0,0,0,.5)';cx.fillRect(0,OH*.4-50,OW,78);cx.fillStyle='#ffb352';cx.font='600 13px "Chakra Petch", sans-serif';cx.fillText(`MISSION ${G.si+1} · ${G.M.name.toUpperCase()}`,OW/2,OH*.4-26);cx.fillStyle='#fff';cx.font='26px Bungee, Impact, sans-serif';cx.fillText(G.st.name.toUpperCase(),OW/2,OH*.4+6);cx.globalAlpha=1;}
 if(G.warnT>0){const a=.5+.5*Math.sin(G.warnT*12);cx.fillStyle=`rgba(255,40,70,${.12*a})`;cx.fillRect(0,0,OW,OH);cx.textAlign='center';cx.fillStyle=`rgba(255,77,109,${a})`;cx.font='30px Bungee, Impact, sans-serif';cx.fillText('WARNING',OW/2,OH*.42);cx.fillStyle='#fff';cx.font='600 14px "Chakra Petch", sans-serif';cx.fillText(G.st.boss.name.toUpperCase()+' APPROACHING',OW/2,OH*.42+26);}}
