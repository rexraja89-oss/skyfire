'use strict';
// ============ RESCUE ============
// Stranded crews appear on the ground (or on life rafts over water) at set points of the stage clock. Fly over one
// to lift it out: score, gears and an ORION call. Crews that scroll away are lost. Objective 'rescue' (missions.js)
// asks for every crew. Tunables: SF.BAL.rescue. Drawn on the overlay: flare smoke, a pulsing beacon ring and
// three little survivors waving.
(()=>{
const Rc=SF.rescue={},C=()=>SF.BAL.rescue;
Rc.start=R=>{R.crews=[];R.crewsTotal=0;R.crewsSaved=0;R.crewsLost=0;R.crewNext=0;};
function spawn(R){const st=STAGES[R.si],wt=st.water;let x=rnd(60,W-60);if(R.def&&R.def.road!==null&&R.def.road!==undefined){const rx=toLogicX(R.def.road);if(Math.abs(x-rx)<30)x=rx+(x<rx?-40:40);}
 R.crews.push({x:clamp(x,40,W-40),y:-40,t:0,raft:!!(wt&&x>wt[0]&&x<wt[1]),ph:Math.random()*9});R.crewsTotal++;}
Rc.step=(R,dt)=>{if(R.kind!=='stage'||!R.crews)return;const c=C(),p=R.p;
 if(R.dir&&R.dir.phase==='stage'&&R.crewNext<c.times.length&&R.dir.clock>=c.times[R.crewNext]){R.crewNext++;spawn(R);if(R.crewsTotal===1)say('crew1',R.crews[R.crews.length-1].raft?'Survivors in a life raft! Fly over them to pick them up.':'Survivors on the ground! Fly over them to pick them up.',2,0);}
 for(const q of R.crews){q.t+=dt;q.y+=SCROLL*dt;
  if(!q.done&&p.alive&&p.dying<=0&&(p.x-q.x)**2+(p.y-q.y)**2<c.radius*c.radius){q.done=1;R.crewsSaved++;R.score+=c.score;R.gears+=c.gears;
   SF.fx.pop(q.x,q.y-20,'CREW RESCUED +'+fmt(c.score),true);SF.fx.ring(q.x,q.y,34,'#7dff9a',.5);sfx('chip');vib(30);
   say('crew'+R.crewsSaved,R.crewsSaved===R.crewsTotal&&R.crewNext>=c.times.length?'Every crew is safe. Great flying!':'Crew aboard. Good work.',1,8);}
  if(!q.done&&!q.lost&&q.y>H+20){q.lost=1;R.crewsLost++;say('crewLost','We left a crew behind!',1,20);}}
 prune(R.crews,q=>!q.done&&q.y<H+40);};
Rc.draw=R=>{if(!R.crews)return;for(const q of R.crews){pj(q.x,q.y);const x=PX,y=PY,s=PS,pu=.5+.5*Math.sin(q.t*5);
  // flare smoke drifting off
  cx.fillStyle='rgba(255,120,60,.18)';for(let i=0;i<4;i++){const k=(q.t*.8+i*.25)%1;cx.beginPath();cx.arc(x+(k*18+i*2)*s,y-(k*26)*s,(3+k*7)*s,0,TAU);cx.fill();}
  if(q.raft){cx.fillStyle='#e8732a';cx.beginPath();cx.ellipse(x,y,11*s,7*s,0,0,TAU);cx.fill();cx.strokeStyle='#4a2a14';cx.lineWidth=1.2;cx.stroke();}
  // three survivors, waving
  for(let i=-1;i<=1;i++){const fx=x+i*4.5*s,fy=y+(i?1:-1)*s,w=Math.sin(q.t*8+i*2)*2*s;cx.fillStyle='#f4d2a8';cx.beginPath();cx.arc(fx,fy-3*s,1.6*s,0,TAU);cx.fill();
   cx.strokeStyle=i?'#2f6aa8':'#c8322a';cx.lineWidth=2.2*s;cx.beginPath();cx.moveTo(fx,fy-1.5*s);cx.lineTo(fx,fy+2.5*s);cx.stroke();cx.lineWidth=1.2*s;cx.beginPath();cx.moveTo(fx,fy-1*s);cx.lineTo(fx+2.5*s,fy-4*s-w);cx.stroke();}
  // beacon ring + marker
  cx.globalCompositeOperation='lighter';cx.strokeStyle=`rgba(125,255,154,${.35+.5*pu})`;cx.lineWidth=2;cx.beginPath();cx.arc(x,y,(16+pu*6)*s,0,TAU);cx.stroke();dg(x,y,14*s,'#7dff9a');cx.globalCompositeOperation='source-over';
  cx.fillStyle='rgba(10,40,25,.85)';cx.beginPath();cx.arc(x,y-26*s,7,0,TAU);cx.fill();cx.strokeStyle='#7dff9a';cx.lineWidth=1.5;cx.stroke();cx.fillStyle='#7dff9a';cx.font='bold 10px Arial';cx.textAlign='center';cx.textBaseline='middle';cx.fillText('!',x,y-25.5*s);cx.textBaseline='alphabetic';}};
})();
