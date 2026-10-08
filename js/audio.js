'use strict';
// ================= AUDIO (all synthesized) =================
// Mixer: sfx bus (SB) and music bus (MG) into a compressor (OUT). Big hits briefly duck the music.
// Music states: calm (menus), combat (missions), boss, victory. SF events drive the state changes.
let AC=null,NB=null,OUT=null,MG=null,SB=null;const lastS={};const MUSV=.55;
function audioOn(){try{if(!AC){AC=new(window.AudioContext||window.webkitAudioContext)();OUT=AC.createDynamicsCompressor();OUT.connect(AC.destination);MG=AC.createGain();MG.gain.value=MUSV;MG.connect(OUT);SB=AC.createGain();SB.gain.value=1;SB.connect(OUT);
  NB=AC.createBuffer(1,AC.sampleRate*1.5,AC.sampleRate);const d=NB.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
 if(AC.state==='suspended')AC.resume();if(!MUS.iv)musicStart(state==='run'&&SF.R?STAGES[SF.R.si].key:45,state==='run'?'combat':'calm');}catch(e){}}
function duck(depth=.45,hold=.25,rel=.7){if(!AC||!MG)return;const t=AC.currentTime,g=MG.gain;g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(MUSV*depth,t+.03);g.setValueAtTime(MUSV*depth,t+.03+hold);g.linearRampToValueAtTime(MUSV,t+.03+hold+rel);}
function tone(f0,f1,dur,type,vol,at=0,dest=SB){const t=AC.currentTime+at,o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
 g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g).connect(dest);o.start(t);o.stop(t+dur+.02);}
function noise(dur,vol,freq,at=0,type='lowpass',dest=SB,end=60){const t=AC.currentTime+at,n=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();n.buffer=NB;f.type=type;f.frequency.setValueAtTime(freq,t);if(type==='lowpass')f.frequency.exponentialRampToValueAtTime(end,t+dur);
 g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);n.connect(f).connect(g).connect(dest);n.start(t,Math.random()*.5);n.stop(t+dur+.02);}
function sfx(k,p=0){if(!save.sfx||!AC||AC.state!=='running')return;const n=performance.now();if(n-(lastS[k]||0)<({gear:40,pop:45,shot:95,combo:60,bonus:200,hit:70,flame:110,plasma:150,zap:90,lance:200,blink:150,heal:300,mine:120,deflect:90,shieldHit:120,missile:160,count:55,part:150}[k]||0))return;lastS[k]=n;
 if(k==='boom'||k==='bomb')duck(.4,.3,.8);else if(k==='hurt'||k==='warn')duck(.55,.2,.6);else if(k==='win'||k==='achieve')duck(.5,.6,.8);
 if(k==='shot')tone(1500,600,.04,'square',.016);
 else if(k==='flame')noise(.16,.07,1800,0,'bandpass');
 else if(k==='plasma'){tone(300,900,.12,'sine',.08);tone(600,1500,.1,'triangle',.03);}
 else if(k==='zap')tone(2400,900,.07,'sawtooth',.025);
 else if(k==='hit')tone(900,700,.03,'triangle',.025);
 else if(k==='pop'){noise(.3,.38,2600);tone(260,50,.2,'square',.05);}
 else if(k==='boom'){noise(1.1,.8,2000);tone(110,28,.9,'sine',.55);}
 else if(k==='gear')tone(900+p*55,1400+p*55,.07,'triangle',.06);
 else if(k==='power'){[660,880,1320].forEach((f,i)=>tone(f,f*1.01,.12,'square',.05,i*.07));}
 else if(k==='hurt'){noise(.35,.5,1000);tone(220,60,.3,'sawtooth',.12);}
 else if(k==='bomb'){noise(1.5,.9,3200);tone(90,22,1.4,'sine',.7);}
 else if(k==='warn')for(let i=0;i<3;i++){tone(520,520,.22,'square',.07,i*.5);tone(390,390,.22,'square',.07,i*.5+.25);}
 else if(k==='win')[523,659,784,1047,1319].forEach((f,i)=>tone(f,f,.3,'triangle',.12,i*.12));
 else if(k==='lance'){tone(200,1800,.5,'sawtooth',.04);}
 else if(k==='blink'){tone(1800,300,.18,'sine',.06);}
 else if(k==='heal'){tone(600,1200,.25,'sine',.04);}
 else if(k==='mine'){tone(1000,1000,.05,'square',.03);}
 else if(k==='lvl'){[523,784,1047,1568].forEach((f,i)=>tone(f,f*1.01,.11,'square',.05,i*.055));tone(260,520,.25,'triangle',.06);}
 else if(k==='combo'){const f=520*Math.pow(1.12,p);tone(f,f*1.5,.09,'triangle',.06);tone(f*1.5,f*2,.08,'square',.025,.05);}
 else if(k==='bonus'){[784,988,1175,1568].forEach((f,i)=>tone(f,f,.12,'triangle',.08,i*.06));}
 else if(k==='over'){tone(120,900,.45,'sawtooth',.07);noise(.4,.25,2400,0,'bandpass');}
 else if(k==='shieldUp'){tone(400,1600,.3,'sine',.08);tone(800,2400,.25,'triangle',.03,.05);}
 else if(k==='chip'){[1319,1760,2093,2637].forEach((f,i)=>tone(f,f,.18,'sine',.06,i*.08));}
 else if(k==='ui')tone(700,900,.05,'triangle',.05);
 else if(k==='deflect'){tone(2600,2200,.05,'square',.02);tone(1300,1250,.08,'triangle',.025);}
 else if(k==='shieldHit'){tone(1800,500,.22,'sine',.09);noise(.15,.12,4000,0,'highpass');}
 else if(k==='missile'){noise(.25,.08,900,0,'bandpass');tone(300,700,.2,'sawtooth',.015);}
 else if(k==='part'){noise(.7,.6,2400);tone(180,40,.6,'square',.12);[880,1175].forEach((f,i)=>tone(f,f,.1,'triangle',.05,.12+i*.07));}
 else if(k==='phase'){tone(80,60,.9,'sawtooth',.18);tone(160,120,.9,'square',.05);noise(.6,.25,600);}
 else if(k==='achieve'){[784,988,1319,1568,1976].forEach((f,i)=>tone(f,f*1.005,.22,'triangle',.07,i*.07));tone(392,392,.6,'sine',.06,.1);}
 else if(k==='count')tone(1200+p*30,1200+p*30,.025,'square',.02);
 else if(k==='respawn'){tone(300,1200,.5,'sine',.07);tone(600,2400,.4,'triangle',.03,.1);}}
const MUS={iv:null,next:0,step:0,root:45,prog:[0,8,3,10],len:.115,mode:'calm'};
const MUS_MODES={calm:{len:.14},combat:{len:.115},boss:{len:.1},win:{len:.13}};
const hz=m=>440*Math.pow(2,(m-69)/12);
function musicStart(root,mode){MUS.root=root;MUS.mode=mode||(state==='run'?'combat':'calm');MUS.len=MUS_MODES[MUS.mode].len;
 MUS.prog=MUS.mode==='boss'?[[0,1,5,3],[0,6,5,1],[0,3,1,6],[0,1,3,5]][root%4]:MUS.mode==='win'?[0,5,7,12]:[[0,8,3,10],[0,5,8,7],[0,3,10,8],[0,8,5,7]][root%4];if(!AC||!save.music||MUS.iv)return;MUS.next=AC.currentTime+.06;MUS.step=0;MUS.iv=setInterval(musTick,30);}
function musicStop(){clearInterval(MUS.iv);MUS.iv=null;}
function musTick(){if(!AC||AC.state!=='running')return;if(MUS.next<AC.currentTime-.1)MUS.next=AC.currentTime+.03;
 while(MUS.next<AC.currentTime+.15){mStep(MUS.step,MUS.next-AC.currentTime);MUS.next+=MUS.len;MUS.step=(MUS.step+1)%64;}}
function mnote(f,at,dur,type,vol,cut){const t=AC.currentTime+at,o=AC.createOscillator(),fl=AC.createBiquadFilter(),g=AC.createGain();o.type=type;o.frequency.value=f;fl.type='lowpass';fl.frequency.value=cut;
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(fl).connect(g).connect(MG);o.start(t);o.stop(t+dur+.02);}
function mStep(s,at){const bar=Math.floor(s/16),i=s%16,r=MUS.root+MUS.prog[bar],M=MUS.mode,boss=M==='boss',arp=boss?[0,12,7,13,12,7,15,12]:[0,7,12,15,19,15,12,7];const calm=M==='calm'||M==='win';
 if([0,3,6,8,10,11,14].includes(i))mnote(hz(r-12),at,MUS.len*.9,'sawtooth',calm?.07:.1,500);
 mnote(hz(r+12+arp[i%8]),at,MUS.len*1.6,'square',calm?.018:.024,calm?1400:2400);
 if(i%8===0)mnote(hz(r+24+(i?7:3)),at,MUS.len*6,'triangle',.03,3000);
 if(!calm){if(i%4===0||(boss&&i%8===6)){tone(140,40,.14,'sine',.35,at,MG);}if(i===4||i===12)noise(.12,.18,1800,at,'bandpass',MG);if(i%2===1||boss)noise(.04,boss?.05:.06,7000,at,'highpass',MG);}
 if(boss){if(i===0||i===10)mnote(hz(r),at,MUS.len*3,'sawtooth',.05,1600);if(i%16===14)mnote(hz(r+13),at,MUS.len*2,'square',.025,2200);}
 if(M==='win'&&bar===3&&i===15)musicSet('calm');}
function musicSet(mode,root){if(MUS.mode===mode&&root===undefined&&MUS.iv)return;const r=root===undefined?MUS.root:root;musicStop();musicStart(r,mode);}
// music state from game events (the engine doesn't need to know about audio)
SF.on('achievement',()=>sfx('achieve'));
SF.on('bossPart',()=>sfx('part'));
