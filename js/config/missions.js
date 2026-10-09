'use strict';
// ============ MISSION OBJECTIVES ============
// Each stage lists objectives per mode as short strings 'type:value' (see stages.js). Templates below define the
// text and how each is judged. "live" objectives can complete mid-flight (toast); the others are judged at the end.
// Objective rewards (gears/cores, medal tiers) are set in economy.js.
SF.OBJECTIVES={
 killPct:   {text:v=>`Destroy ${v}% of enemy forces`,            end:(R,v)=>R.spawned>0&&R.kills/R.spawned*100>=v, progress:(R,v)=>R.spawned?Math.min(1,R.kills/R.spawned*100/v):0},
 groundPct: {text:v=>`Destroy ${v}% of ground targets`,          end:(R,v)=>R.groundSpawned>0&&R.groundKills/R.groundSpawned*100>=v},
 noHit:     {text:()=>'Finish without taking damage',             end:R=>R.hits===0,fail:R=>R.hits>0},
 combo:     {text:v=>`Reach a ${v} combo`,                         live:(R,v)=>R.combo.best>=v},
 score:     {text:v=>`Score ${fmt(v)} points`,                     live:(R,v)=>R.score>=v},
 formations:{text:v=>`Wipe out ${v} full formations`,              live:(R,v)=>R.formationsCleared>=v},
 setups:    {text:v=>`Destroy ${v} ground sites completely`,       live:(R,v)=>R.setupsCleared>=v},
 leaders:   {text:v=>v>1?`Shoot down ${v} Wing-leaders`:'Shoot down the Wing-leader',live:(R,v)=>(R.typeKills.wingleader||0)>=v},
 noSpecial: {text:()=>'Finish without using Skyburst',             end:R=>R.specials===0,fail:R=>R.specials>0},
 hull:      {text:v=>`Finish with at least ${v}% hull`,            end:(R,v)=>R.p.hp/R.p.max*100>=v},
 collect:   {text:v=>`Collect ${v} power-ups`,                     live:(R,v)=>R.pickups>=v},
 killType:  {text:v=>{const[t,n]=v.split('*');return `Destroy ${n} ${SF.ENEMIES[t].name}${n>1?'s':''}`;},live:(R,v)=>{const[t,n]=v.split('*');return (R.typeKills[t]||0)>=+n;}},
 bossTime:  {text:v=>`Defeat the boss within ${v} seconds`,        end:(R,v)=>R.bossTime>0&&R.bossTime<=v},
 rescue:    {text:()=>'Rescue every stranded crew',               end:R=>R.crewsTotal>0&&R.crewsSaved>=R.crewsTotal,fail:R=>R.crewsLost>0},
 bossParts: {text:()=>'Destroy every boss component',              end:R=>R.bossPartsTotal>0&&R.bossPartsKilled>=R.bossPartsTotal},
};
SF.parseObjective=s=>{const i=s.indexOf(':');const type=i<0?s:s.slice(0,i),raw=i<0?'':s.slice(i+1);const v=raw===''?null:isNaN(+raw)?raw:+raw;return {id:s,type,v,T:SF.OBJECTIVES[type]};};
