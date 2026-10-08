'use strict';
// ============ STAGE DIRECTOR ============
// Runs a stage timeline (config/stages.js) on the stage clock: formations, ground setups, loose waves, boats,
// mini-bosses, ORION lines, banners, then the boss warning and the boss. Also runs the endless Test Range script.
(()=>{
const Dr=SF.director={};
const modeOK=(R,m)=>!m||(m==='hard'&&R.mode!=='easy')||(m==='extreme'&&R.mode==='extreme');
function layout(t,n,lay,group){const list=[],x0=rnd(110,290);
 for(let i=0;i<n;i++){const d=i-(n-1)/2;list.push(lay==='v'?{x:x0+d*30,y:-30-Math.abs(d)*26,x0:x0+d*30,group,ph:i}:{x:(i+1)*W/(n+1)+rnd(-15,15),y:-30-i*30,x0:(i+1)*W/(n+1),group,ph:i});}
 return list;}
function hpMul(R){return 1;} // stage hp scaling comes from SF.BAL.run (SF.dm)
function boats(R,n){const st=STAGES[R.si],Wt=st.water||[30,370],g=SF.enemies.newGroup();
 for(let i=0;i<n;i++)SF.enemies.spawn('boat',{x:rnd(Wt[0]+15,Wt[1]-15),y:-40-i*70,wx0:Wt[0]+12,wx1:Wt[1]-12,group:g});}
function roadX(R){const r=R.def.road;return r===null||r===undefined?.5:toLogicX(r)/W;}
Dr.run=(R,ev)=>{
 if(ev.say)say('ev'+ev.at,ev.say,2,0);
 if(ev.banner)R.banner={t:ev.banner,l:1.8,sub:ev.sub};
 if(ev.zone)R.banner={t:ev.zone.toUpperCase(),l:1.6,sub:'ENTERING'};
 if(ev.f)SF.formations.spawn(ev.f,{enemy:ev.e,mirror:ev.mirror!==undefined?ev.mirror:Math.random()<.5,x:ev.x||0,extra:R.diff.extra});
 if(ev.g)SF.formations.spawnSetup(ev.g,{x:ev.x==='road'?roadX(R):ev.x});
 if(ev.w){const g=SF.enemies.newGroup();for(const o of layout(ev.w,ev.n||1,ev.lay,g))SF.enemies.spawn(ev.w,o);}
 if(ev.boats)boats(R,ev.boats);
 if(ev.mini){const M=SF.MINIBOSSES[ev.mini];R.banner={t:M.name.toUpperCase(),l:2,sub:'MINI-BOSS'};sfx('warn');
  if(M.stub){const e=SF.enemies.spawn(M.stub.t,{x:W/2,y:-50,x0:W/2,hpMul:M.stub.hpMul*(R.diff.boss/R.diff.hp)});if(e){e.mini=true;R.dir.hold=()=>e.alive;}
   if(M.stub.escort)SF.formations.spawn('vDrop',{enemy:M.stub.escort});}
  else{const B=SF.boss.spawn(R,M,{mini:true,key:ev.mini});R.dir.hold=()=>SF.boss.list.includes(B);}
  say('mini_'+ev.mini,M.say||(M.name+' incoming. Take it down!'),2,0);}};
Dr.start=R=>{R.dir={i:0,clock:0,hold:null,phase:'stage',warnT:0,clearT:0};if(SF.dev)SF.dev.jump(R,R.dir);};
Dr.step=(R,dt)=>{const D=R.dir,tl=R.def.timeline;
 if(D.hold){if(!D.hold())D.hold=null;else return;}
 if(D.phase==='stage'){D.clock+=dt;
  while(D.i<tl.length&&tl[D.i].at<=D.clock){const ev=tl[D.i++];if(modeOK(R,ev.mode))Dr.run(R,ev);if(D.hold)return;}
  if(D.i>=tl.length&&D.clock>=R.def.len){let air=0;for(const e of SF.enemies.list())if(e.alive&&!e.ground&&!e.d.noCount)air++;D.clearT+=dt;
   if(air===0||D.clearT>8){D.phase='warn';D.warnT=2.8;R.warnT=2.8;sfx('warn');vib(80);musicSet('boss',(STAGES[R.si].key||45)-5);
    say('boss',`Large signature detected. It is the ${STAGES[R.si].boss.name}!`,3,0);}}}
 else if(D.phase==='warn'){D.warnT-=dt;if(D.warnT<=0){D.phase='boss';const b=SF.boss.defFor(R.si);SF.boss.spawn(R,b.D,{key:b.id});}}};
// ---------- Test Range script ----------
Dr.rangeStart=R=>{R.wi=0;R.waveT=0;R.gap=1.5;R.lastGround=-99;};
Dr.rangeStep=(R,dt)=>{R.waveT+=dt;let air=0;for(const e of SF.enemies.list())if(e.alive&&!e.d.noCount&&!e.ground)air++;
 const S=SF.RANGE_SCRIPT,nx=S[R.wi%S.length],groundBusy=nx.g&&R.t-R.lastGround<9;
 if(R.t>1.2&&!groundBusy&&(air<=1&&R.waveT>R.gap||R.waveT>12)){const w=nx;R.wi++;R.waveT=0;let title='';
  if(w.f){SF.formations.spawn(w.f,{enemy:w.enemy,mirror:Math.random()<.5});const F=SF.FORMATIONS[w.f];title=F.name.toUpperCase();const en=w.enemy||(F.groups[0].enemies||[])[0];if(en)title+=' · '+SF.ENEMIES[en].name.toUpperCase();}
  else if(w.g){const x=w.road?toLogicX(4)/W:(w.x!==undefined?w.x:rnd(.3,.7));SF.formations.spawnSetup(w.g,{x});title=SF.GROUND_SETUPS[w.g].name.toUpperCase();R.lastGround=R.t;}
  else{const g=SF.enemies.newGroup();for(const o of layout(w.w,w.n,'spread',g))SF.enemies.spawn(w.w,o);if(w.escort)for(const o of layout(w.escort,4,'v',g)){o.y-=50;SF.enemies.spawn(w.escort,o);}title=SF.ENEMIES[w.w].name.toUpperCase()+(w.n>1?' ×'+w.n:'');}
  R.banner={t:title,l:1.4,sub:'WAVE '+R.wi};}};
})();
