'use strict';
// ================= COPILOT (ORION) =================
const CP={q:[],cur:null,t:0,shown:0,cool:{}};let VOICE=null;
function pickVoice(){try{const vs=speechSynthesis.getVoices();VOICE=vs.find(v=>/en[-_]GB/i.test(v.lang)&&/male|daniel|george|arthur|ryan/i.test(v.name))||vs.find(v=>/en[-_]GB/i.test(v.lang))||vs.find(v=>/^en/i.test(v.lang))||null;}catch(e){}}
if('speechSynthesis' in window){pickVoice();speechSynthesis.onvoiceschanged=pickVoice;}
function speak(t){if(!save.voice||!('speechSynthesis' in window))return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);if(VOICE)u.voice=VOICE;u.rate=1.08;u.pitch=.8;u.volume=.95;speechSynthesis.speak(u);}catch(e){}}
// the enemy commander's voice: deeper and slower than ORION
function speakVillain(t){if(!save.voice||!('speechSynthesis' in window))return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);if(VOICE)u.voice=VOICE;u.rate=.92;u.pitch=.35;u.volume=1;speechSynthesis.speak(u);}catch(e){}}
function say(key,text,prio=1,cool=10){const n=performance.now()/1000;if(CP.cool[key]>n)return;CP.cool[key]=n+cool;
 if(prio>=3){CP.q.length=0;CP.cur=null;}if(CP.q.length<3)CP.q.push(text);}
function stepCopilot(dt){if(CP.cur){CP.t-=dt;if(CP.shown<CP.cur.length){CP.shown=Math.min(CP.cur.length,CP.shown+dt*55);$('coText').textContent=CP.cur.slice(0,Math.ceil(CP.shown));}if(CP.t<=0){CP.cur=null;$('co').classList.add('off');}}
 if(!CP.cur&&CP.q.length){CP.cur=CP.q.shift();CP.t=Math.max(2.6,CP.cur.length*.065);CP.shown=0;$('co').classList.remove('off');speak(CP.cur);}}
function resetCopilot(){CP.q.length=0;CP.cur=null;CP.cool={};$('co').classList.add('off');try{speechSynthesis.cancel();}catch(e){}}

