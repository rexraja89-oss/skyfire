'use strict';
// ============ MISSIONS (objectives) ============
// Tracks the active stage's objectives (config/stages.js + config/missions.js). Live objectives complete in flight
// with a toast; the rest are judged when the stage ends. Results are saved per mode and stage in save.obj.
(()=>{
const Ms=SF.missions={};
Ms.forStage=(si,mode)=>(SF.STAGE_DEFS[si].obj[mode]||[]).map(SF.parseObjective);
Ms.saved=(si,mode)=>((save.obj[mode]||{})[si])||{};
Ms.start=R=>{R.objs=Ms.forStage(R.si,R.mode).map(o=>Object.assign(o,{done:false,failed:false,toast:false}));};
Ms.step=R=>{if(!R.objs)return;for(const o of R.objs){if(o.done||o.failed||!o.T)continue;
 if(o.T.live&&o.T.live(R,o.v)){o.done=true;Ms.toast(R,o);}
 else if(o.T.fail&&o.T.fail(R,o.v)){o.failed=true;}}};
Ms.toast=(R,o)=>{R.toasts.push({t:o.T.text(o.v),l:2.6});sfx('bonus');SF.emit('objective',{o});};
// judge at the end of a won stage; returns [{text, done, fresh}]
Ms.finish=(R,won)=>{const prev=Ms.saved(R.si,R.mode),out=[];
 for(const o of R.objs||[]){let done=o.done;if(!done&&won&&!o.failed&&o.T&&o.T.end)done=!!o.T.end(R,o.v);if(!won)done=o.done&&o.T.live;
  const fresh=done&&!prev[o.id];out.push({id:o.id,text:o.T?o.T.text(o.v):o.id,done,fresh,had:!!prev[o.id]});}
 if(won){save.obj[R.mode]=save.obj[R.mode]||{};const m=save.obj[R.mode][R.si]=save.obj[R.mode][R.si]||{};for(const r of out)if(r.done)m[r.id]=1;}
 else{save.obj[R.mode]=save.obj[R.mode]||{};const m=save.obj[R.mode][R.si]=save.obj[R.mode][R.si]||{};for(const r of out)if(r.done)m[r.id]=1;}
 return out;};
Ms.count=(si,mode)=>{const s=Ms.saved(si,mode);return Ms.forStage(si,mode).filter(o=>s[o.id]).length;};
})();
