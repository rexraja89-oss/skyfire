'use strict';
// ================= AUDIO (all synthesized) =================
let AC=null,NB=null,OUT=null,MG=null;const lastS={};
function audioOn(){try{if(!AC){AC=new(window.AudioContext||window.webkitAudioContext)();OUT=AC.createDynamicsCompressor();OUT.connect(AC.destination);MG=AC.createGain();MG.gain.value=.55;MG.connect(OUT);
  NB=AC.createBuffer(1,AC.sampleRate*1.5,AC.sampleRate);const d=NB.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
 if(AC.state==='suspended')AC.resume();if(!MUS.iv)musicStart(state==='play'&&G?STAGES[G.si].key:45);}catch(e){}}
function tone(f0,f1,dur,type,vol,at=0,dest=OUT){const t=AC.currentTime+at,o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
 g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g).connect(dest);o.start(t);o.stop(t+dur+.02);}
function noise(dur,vol,freq,at=0,type='lowpass',dest=OUT,end=60){const t=AC.currentTime+at,n=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();n.buffer=NB;f.type=type;f.frequency.setValueAtTime(freq,t);if(type==='lowpass')f.frequency.exponentialRampToValueAtTime(end,t+dur);
 g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);n.connect(f).connect(g).connect(dest);n.start(t,Math.random()*.5);n.stop(t+dur+.02);}
function sfx(k,p=0){if(!save.sfx||!AC||AC.state!=='running')return;const n=performance.now();if(n-(lastS[k]||0)<({gear:40,pop:45,shot:95,hit:70,flame:110,plasma:150,zap:90,lance:200,blink:150,heal:300,mine:120}[k]||0))return;lastS[k]=n;
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
 else if(k==='ui')tone(700,900,.05,'triangle',.05);}
const MUS={iv:null,next:0,step:0,root:45,prog:[0,8,3,10],len:.115};
const hz=m=>440*Math.pow(2,(m-69)/12);
function musicStart(root){MUS.root=root;MUS.prog=[[0,8,3,10],[0,5,8,7],[0,3,10,8],[0,8,5,7]][root%4];if(!AC||!save.music||MUS.iv)return;MUS.next=AC.currentTime+.06;MUS.step=0;MUS.iv=setInterval(musTick,30);}
function musicStop(){clearInterval(MUS.iv);MUS.iv=null;}
function musTick(){if(!AC||AC.state!=='running')return;if(MUS.next<AC.currentTime-.1)MUS.next=AC.currentTime+.03;
 while(MUS.next<AC.currentTime+.15){mStep(MUS.step,MUS.next-AC.currentTime);MUS.next+=MUS.len;MUS.step=(MUS.step+1)%64;}}
function mnote(f,at,dur,type,vol,cut){const t=AC.currentTime+at,o=AC.createOscillator(),fl=AC.createBiquadFilter(),g=AC.createGain();o.type=type;o.frequency.value=f;fl.type='lowpass';fl.frequency.value=cut;
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(fl).connect(g).connect(MG);o.start(t);o.stop(t+dur+.02);}
function mStep(s,at){const bar=Math.floor(s/16),i=s%16,r=MUS.root+MUS.prog[bar],arp=[0,7,12,15,19,15,12,7];const calm=state!=='play';
 if([0,3,6,8,10,11,14].includes(i))mnote(hz(r-12),at,MUS.len*.9,'sawtooth',calm?.07:.1,500);
 mnote(hz(r+12+arp[i%8]),at,MUS.len*1.6,'square',calm?.018:.024,calm?1400:2400);
 if(i%8===0)mnote(hz(r+24+(i?7:3)),at,MUS.len*6,'triangle',.03,3000);
 if(!calm){if(i%4===0){tone(140,40,.14,'sine',.35,at,MG);}if(i===4||i===12)noise(.12,.18,1800,at,'bandpass',MG);if(i%2===1)noise(.04,.06,7000,at,'highpass',MG);}}
