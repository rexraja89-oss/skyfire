'use strict';
// ============ SCORING + COMBO (new engine) ============
// Every kill feeds the combo. The combo multiplier steps up at thresholds and decays if no kill lands inside the
// window. Bonuses: formation wiped out, ground setup destroyed, wing-leader down, fast kills, combo milestones,
// and a no-hit streak. All values in SF.BAL.combo. Works on whatever run is active (SF.R).
(()=>{
const C=()=>SF.BAL.combo;
const Sc=SF.scoring={};
Sc.reset=R=>{R.combo={n:0,t:0,step:0,best:0,pulse:0};R.noHitT=0;R.bonusLog=[];};
Sc.mult=R=>C().mults[R.combo.step]*(R.eff&&R.eff.multiplier?R.eff.multiplier.mult:1)*SF.BAL.mul.score*(R.modeScore||1);
function stepFor(n){const S=C().steps;let i=0;while(i+1<S.length&&n>=S[i+1])i++;return i;}
function add(R,pts,x,y,label){const v=Math.round(pts);R.score+=v;if(label!==undefined)SF.fx.pop(x,y,label||('+'+fmt(v)),v>=800);return v;}
Sc.bonus=(R,pts,x,y,label)=>{const v=add(R,pts*Sc.mult(R),x,y,undefined);SF.fx.pop(x,y-18,label+' +'+fmt(v),true);R.bonusLog.push({label,v});SF.emit('bonus',{label,v});return v;};
SF.on('kill',({e})=>{const R=SF.R;if(!R||!R.combo)return;const c=R.combo,CF=C();
 R.kills++;if(e.ground)R.groundKills=(R.groundKills||0)+1;
 const before=c.step;c.n+=e.ground?CF.groundCount:1;c.t=CF.window;c.step=stepFor(c.n);if(c.n>c.best)c.best=c.n;if(c.step>before){c.pulse=.35;sfx('combo',c.step);}
 let pts=e.d.score*Sc.mult(R);const fast=e.seen>=0&&e.t-e.seen<CF.fastKillWithin&&!e.ground;if(fast)pts*=CF.fastKillMult;
 const v=add(R,pts,e.x,e.y,'');if(fast&&v>=300)SF.fx.pop(e.x,e.y-16,'QUICK',false);
 if(c.n>=CF.milestoneEvery&&Math.floor(c.n/CF.milestoneEvery)>Math.floor((c.n-(e.ground?CF.groundCount:1))/CF.milestoneEvery)){
  const k=Math.floor(c.n/CF.milestoneEvery);Sc.bonus(R,CF.milestoneBonus*k,R.p.x,R.p.y-40,'COMBO '+c.n);if(k===2)say('c50','Fifty combo! Keep it going!',1,60);}
 if(R.p)SF.player.addMeter(R,(e.d.charge||2)*SF.BAL.special.perKill/2);
 SF.pickups.onKill(R,e);});
SF.on('formationClear',({name,n,x,y})=>{const R=SF.R;if(!R||!R.combo)return;Sc.bonus(R,C().formationPerMember*n,x,y,'FORMATION');SF.pickups.rollTable('formation',x,y);sfx('bonus');});
SF.on('setupClear',({name,n,x,y})=>{const R=SF.R;if(!R||!R.combo)return;Sc.bonus(R,C().setupPerPiece*n,x,y,name.toUpperCase());SF.pickups.rollTable('setup',x,y,true);sfx('bonus');say('setup',name+' destroyed. Nice work.',1,20);});
SF.on('captainDown',({e,bonus})=>{const R=SF.R;if(!R||!R.combo)return;Sc.bonus(R,bonus,e.x,e.y-30,'LEADER');});
SF.on('levelUp',()=>{const R=SF.R;if(R&&R.combo)R.score+=SF.BAL.score.levelUpBonus;});
SF.on('playerHit',()=>{const R=SF.R;if(!R||!R.combo)return;const c=R.combo;c.n=Math.floor(c.n*C().hitKeep);c.step=stepFor(c.n);R.noHitT=0;});
Sc.step=(R,dt)=>{const c=R.combo,CF=C();if(c.pulse>0)c.pulse-=dt;
 if(c.n>0){c.t-=dt;if(c.t<=0){if(c.n>=10)SF.fx.pop(R.p.x,R.p.y-40,'COMBO '+c.n,false);c.n=0;c.step=0;}}
 if(R.p.alive&&R.p.dying<=0){R.noHitT+=dt;if(R.noHitT>=CF.noHitEvery){R.noHitT=0;Sc.bonus(R,CF.noHitBonus,R.p.x,R.p.y-40,'UNTOUCHED');}}};
})();
