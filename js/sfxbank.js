'use strict';
// ============ SOUND BANK (v5.6) ============
// Richer sounds without downloads: when audio starts, the key effects are rendered once into AudioBuffers with an
// OfflineAudioContext (layered transients, filtered noise bodies, sub-bass thumps, debris crackle, a generated
// reverb room), then played back cheaply with small pitch/volume variation and stereo position from where they
// happen. Adds a jet-engine loop, a per-stage ambience bed, a reverb send and a louder mastered mix (limiter).
// Anything not in the bank still uses the synth voices in audio.js. Explosions, impacts and hits layer three CC0
// recordings by Kenney (art/snd/k_*.ogg, licence in art/snd/) under the generated layers; if they fail to load,
// the generated layers play alone.
(()=>{
const Bk=SF.sfxBank={buf:{},ready:false};let RV=null,ENG=null,AMB=null,LB=null;   // LB: loop bus (engine + ambience) inside the sfx bus
const SR=()=>Math.min(44100,AC.sampleRate);
// ---------- offline renderers ----------
function ir(ctx,sec,decay){const n=Math.floor(ctx.sampleRate*sec),b=ctx.createBuffer(2,n,ctx.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,decay);}return b;}
function nbuf(ctx,sec){const n=Math.floor(ctx.sampleRate*sec),b=ctx.createBuffer(1,n,ctx.sampleRate),d=b.getChannelData(0);let br=0;for(let i=0;i<n;i++){const w=Math.random()*2-1;br=(br+.02*w)/1.02;d[i]=w*.6+br*3.5;}return b;}
async function render(sec,fn,stereo=2){const ctx=new OfflineAudioContext(stereo,Math.floor(SR()*sec),SR());const out=ctx.createGain();out.connect(ctx.destination);fn(ctx,out);return ctx.startRendering();}
function env(ctx,g,t,a,peak,dec,curve=3){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.setTargetAtTime(0,t+a,dec/curve);}
function noiseL(ctx,dst,t,dur,type,f0,f1,peak,a=.004,q=.7){const s=ctx.createBufferSource();s.buffer=nbuf(ctx,dur+.1);const f=ctx.createBiquadFilter();f.type=type;f.Q.value=q;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+dur);
 const g=ctx.createGain();env(ctx,g,t,a,peak,dur);s.connect(f).connect(g).connect(dst);s.start(t);return g;}
function toneL(ctx,dst,t,dur,type,f0,f1,peak,a=.003){const o=ctx.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);const g=ctx.createGain();env(ctx,g,t,a,peak,dur);o.connect(g).connect(dst);o.start(t);o.stop(t+dur+.05);}
function room(ctx,out,wet,sec=1.6,dec=3){const cv=ctx.createConvolver();cv.buffer=ir(ctx,sec,dec);const w=ctx.createGain();w.gain.value=wet;cv.connect(w).connect(out);return cv;}
function crackle(ctx,dst,t,dur,n,peak){for(let i=0;i<n;i++){const tt=t+Math.pow(Math.random(),1.6)*dur;noiseL(ctx,dst,tt,.03+Math.random()*.05,'bandpass',1200+Math.random()*3000,800,peak*(1-(tt-t)/dur)*(.4+Math.random()*.6),.001,2);}}
const REC={};   // decoded CC0 recordings (art/snd)
function rec(ctx,dst,t,b,gain,rate=1){if(!b)return;const s=ctx.createBufferSource();s.buffer=b;s.playbackRate.value=rate;const g=ctx.createGain();g.gain.value=gain;s.connect(g).connect(dst);s.start(t);}
function pan(ctx,dst,p){const s=ctx.createStereoPanner();s.pan.value=p;s.connect(dst);return s;}
const DEF={
 // big explosion: crack, rolling body, sub thump, debris crackle, room
 boom:[2.6,(c,o)=>{const rv=room(c,o,.35,2.2,2.5),L=pan(c,o,-.15),Rr=pan(c,o,.15);rec(c,L,0,REC.ex1,1.1,1);rec(c,Rr,.012,REC.ex1,1,.96);rec(c,rv,0,REC.ex1,.7,1);
  for(const d of[L,Rr,rv]){noiseL(c,d,0,.12,'highpass',2500,1200,.5,.001);noiseL(c,d,0,1.6,'lowpass',2800,90,.55,.006);}
  toneL(c,o,0,.9,'sine',70,28,1.2,.004);toneL(c,o,.01,.5,'triangle',120,40,.35);crackle(c,L,.15,1.4,14,.25);crackle(c,Rr,.2,1.4,14,.25);}],
 // small air pop: snap, short fireball, light crackle
 pop:[1.1,(c,o)=>{const rv=room(c,o,.22,1.1,3);rec(c,o,0,REC.ex2,1,1.15);rec(c,rv,0,REC.ex2,.5,1.15);for(const d of[o,rv]){noiseL(c,d,0,.07,'highpass',3000,1500,.4,.001);noiseL(c,d,0,.55,'lowpass',3600,200,.4,.004);}toneL(c,o,0,.25,'sine',110,45,.6);crackle(c,o,.08,.6,6,.18);}],
 // Skyburst: rising whomp, huge body, long tail
 bomb:[3.4,(c,o)=>{const rv=room(c,o,.45,3,2);toneL(c,o,0,.25,'sawtooth',160,700,.25,.05);rec(c,o,.16,REC.ex1,1.2,.72);rec(c,rv,.16,REC.ex1,.8,.72);rec(c,o,.3,REC.ex2,.6,.8);for(const d of[o,rv]){noiseL(c,d,.18,2.6,'lowpass',4200,60,1.2,.01);}toneL(c,o,.18,1.6,'sine',60,22,1.4,.006);crackle(c,o,.4,2.2,26,.22);}],
 // gun: click transient, short noise body, metallic ring
 shot:[.16,(c,o)=>{noiseL(c,o,0,.035,'highpass',5000,3000,.45,.0006);noiseL(c,o,0,.09,'bandpass',1800,700,.35,.001,1.2);toneL(c,o,0,.06,'square',900,260,.08,.0008);},1],
 // bullet hitting metal
 hit:[.18,(c,o)=>{rec(c,o,0,REC.rock,.55,1.7);noiseL(c,o,0,.05,'bandpass',3200,2000,.35,.0005,3);toneL(c,o,0,.12,'triangle',2400+Math.random()*400,1700,.08,.0005);},1],
 // player hurt: metal crunch + thud
 hurt:[.7,(c,o)=>{const rv=room(c,o,.25,.9,3);rec(c,o,0,REC.rock,1,.75);rec(c,rv,0,REC.rock,.5,.75);for(const d of[o,rv])noiseL(c,d,0,.35,'lowpass',2400,180,.9,.002);toneL(c,o,0,.3,'sawtooth',180,55,.35);noiseL(c,o,.02,.2,'bandpass',900,500,.4,.002,4);}],
 // shield deflect: glassy ping with shimmer
 shieldHit:[.8,(c,o)=>{const rv=room(c,o,.4,1.2,2);for(const d of[o,rv]){toneL(c,d,0,.6,'sine',1900,1500,.25);toneL(c,d,0,.45,'sine',2870,2600,.12);}noiseL(c,o,0,.12,'highpass',6000,4000,.2,.001);}],
 // missile launch whoosh
 missile:[.7,(c,o)=>{noiseL(c,o,0,.55,'bandpass',600,2600,.35,.03,1.5);noiseL(c,o,0,.08,'highpass',3000,2000,.2,.001);},1],
 // boss part breaking: metal tear + explosion
 part:[2.2,(c,o)=>{const rv=room(c,o,.4,1.8,2.5);rec(c,o,0,REC.ex1,1,.9);rec(c,o,.02,REC.rock,.9,.85);rec(c,o,.14,REC.rock,.6,.7);rec(c,rv,0,REC.ex1,.6,.9);for(const d of[o,rv]){noiseL(c,d,0,1.2,'lowpass',3000,120,1,.004);noiseL(c,d,0,.4,'bandpass',700,300,.5,.002,6);}toneL(c,o,0,.6,'sine',65,30,1);
  for(let i=0;i<5;i++)toneL(c,o,.05+i*.07,.25,'triangle',600+Math.random()*900,300,.12);crackle(c,o,.1,1.6,16,.22);}],
 // naval gun (v5.14): heavy muzzle crack, deep pressure thump, long sea-air tail
 naval:[2.2,(c,o)=>{const rv=room(c,o,.4,2.2,2.2);rec(c,o,0,REC.ex1,.9,.62);rec(c,rv,0,REC.ex1,.5,.62);noiseL(c,o,0,.05,'highpass',3200,1500,.6,.0005);
  for(const d of[o,rv])noiseL(c,d,0,1.4,'lowpass',1600,70,.75,.003);toneL(c,o,0,.55,'sine',62,30,1.3,.002);toneL(c,o,0,.18,'triangle',140,55,.4,.001);}],
 // thunder (v5.14): close crack, tearing rattle, long rolling rumble
 thunder:[5.5,(c,o)=>{const rv=room(c,o,.55,3.5,1.6),L=pan(c,o,-.3),Rr=pan(c,o,.3);noiseL(c,L,0,.18,'highpass',1800,900,.55,.002);crackle(c,Rr,.02,.6,22,.3);
  for(let i=0;i<6;i++){const t=.1+i*.45+Math.random()*.3;noiseL(c,i%2?L:Rr,t,1.6+Math.random(),'lowpass',420,60,.55*(1-i*.12),.15);}
  noiseL(c,rv,0,4.8,'lowpass',300,50,.8,.3);toneL(c,o,.05,3,'sine',48,26,.7,.2);}],
 // gear pickup: bright double chime
 gear:[.35,(c,o)=>{const rv=room(c,o,.25,.6,3);for(const d of[o,rv]){toneL(c,d,0,.22,'sine',1568,1568,.18,.002);toneL(c,d,.04,.25,'sine',2349,2349,.12,.002);}},1],
 // weapon level up: rising power chord
 power:[.9,(c,o)=>{const rv=room(c,o,.3,1,2.5);[523,659,784,1047].forEach((f,i)=>{for(const d of[o,rv])toneL(c,d,i*.06,.5,'sawtooth',f,f*1.01,.07,.004);});noiseL(c,o,0,.4,'highpass',2000,6000,.12,.05);}],
};
// render the bank (async, a few hundred ms total; sounds fall back to the synth until ready)
Bk.build=async()=>{if(Bk.building||!AC||typeof OfflineAudioContext==='undefined')return;Bk.building=true;
 try{for(const[k,f]of[['ex1','k_explosion1'],['ex2','k_explosion2'],['rock','k_rockHit2'],['storm','storm']]){try{const r=await fetch('art/snd/'+f+'.ogg?v='+BUILD);REC[k]=await AC.decodeAudioData(await r.arrayBuffer());}catch(e){}}
  for(const k in DEF){const[sec,fn,mono]=DEF[k],b=await render(sec,fn,mono?1:2);let pk=0;for(let c=0;c<b.numberOfChannels;c++){const d=b.getChannelData(c);for(let i=0;i<d.length;i++)pk=Math.max(pk,Math.abs(d[i]));}
   if(pk>0){const g=.95/pk;for(let c=0;c<b.numberOfChannels;c++){const d=b.getChannelData(c);for(let i=0;i<d.length;i++)d[i]*=g;}}Bk.buf[k]=b;}   // normalise every sound to the same peak; BANKV in audio.js sets the mix
  Bk.buf.boomB=Bk.buf.boom;Bk.ready=true;}catch(e){console.warn('sfx bank',e);}};
// play a bank sound with pitch/volume variation and stereo position (x in logic px, optional)
Bk.play=(k,vol=1,x)=>{const b=Bk.buf[k];if(!b||!AC)return false;const s=AC.createBufferSource();s.buffer=b;s.playbackRate.value=.92+Math.random()*.16;
 const g=AC.createGain();g.gain.value=vol*(.85+Math.random()*.3);let node=s.connect(g);
 if(x!==undefined&&AC.createStereoPanner){const p=AC.createStereoPanner();p.pan.value=clamp((x/W)*2-1,-1,1)*.65;node=node.connect(p);}
 node.connect(SB);if(RV&&b.numberOfChannels===1){const sd=AC.createGain();sd.gain.value=.12;node.connect(sd).connect(RV);}s.start();return true;};
// ---------- mix: reverb send + mastering limiter ----------
// Sound-effects setting and pause: SFX off silences the whole effects bus (one-shots and loops); pause silences the
// loops only. Loops keep running silently, so turning SFX back on mid-flight brings them straight back.
Bk.applyMute=()=>{if(!AC||!SB)return;const t=AC.currentTime;SB.gain.cancelScheduledValues(t);SB.gain.setTargetAtTime(save.sfx?1:0,t,.03);
 if(LB){const on=save.sfx&&state==='run';LB.gain.cancelScheduledValues(t);LB.gain.setTargetAtTime(on?1:0,t,.05);}};
Bk.mix=()=>{if(!AC||RV)return;if(!LB){LB=AC.createGain();LB.connect(SB);}Bk.applyMute();try{RV=AC.createConvolver();RV.buffer=ir(AC,1.4,3);const w=AC.createGain();w.gain.value=.5;RV.connect(w).connect(OUT);
 OUT.threshold.value=-16;OUT.knee.value=8;OUT.ratio.value=5;OUT.attack.value=.003;OUT.release.value=.18;
 const mk=AC.createGain();mk.gain.value=1.35;OUT.disconnect();OUT.connect(mk).connect(AC.destination);}catch(e){}};
// ---------- loops: jet engine and ambience ----------
function loopNoise(sec){const n=Math.floor(AC.sampleRate*sec),b=AC.createBuffer(2,n,AC.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);let br=0;for(let i=0;i<n;i++){const w=Math.random()*2-1;br=(br+.02*w)/1.02;d[i]=br*3;}
  const f=Math.floor(AC.sampleRate*.05);for(let i=0;i<f;i++){const a=i/f;d[i]=d[i]*a+d[n-f+i]*(1-a);}}return b;}   // crossfaded so the loop is seamless
Bk.engineStart=()=>{if(!AC||ENG)return;if(!LB){LB=AC.createGain();LB.connect(SB);}try{const s=AC.createBufferSource();s.buffer=loopNoise(2);s.loop=true;const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=420;f.Q.value=1.5;
 const g=AC.createGain();g.gain.value=0;const o=AC.createOscillator();o.type='sawtooth';o.frequency.value=58;const og=AC.createGain();og.gain.value=.015;const of=AC.createBiquadFilter();of.type='lowpass';of.frequency.value=300;
 s.connect(f).connect(g);o.connect(of).connect(og).connect(g);g.connect(LB);s.start();o.start();ENG={s,o,f,g};g.gain.linearRampToValueAtTime(.16,AC.currentTime+1);}catch(e){}};
Bk.engineSet=(climb,od)=>{if(!ENG)return;const t=AC.currentTime;ENG.f.frequency.setTargetAtTime(420+climb*900+od*400,t,.15);ENG.o.frequency.setTargetAtTime(58+climb*30+od*20,t,.2);ENG.g.gain.setTargetAtTime(.14+climb*.08,t,.2);};
Bk.engineStop=()=>{if(!ENG)return;const e=ENG;ENG=null;try{e.g.gain.setTargetAtTime(0,AC.currentTime,.2);setTimeout(()=>{try{e.s.stop();e.o.stop();}catch(_){}},900);}catch(_){}};
const AMBS={storm:{f:1400,type:'bandpass',v:.32},rain:{f:2600,type:'highpass',v:.07},snow:{f:700,type:'lowpass',v:.06},sand:{f:900,type:'bandpass',v:.08},embers:{f:180,type:'lowpass',v:.12},mist:{f:500,type:'lowpass',v:.04},'':{f:400,type:'lowpass',v:.035}};
// storm (Storm Fleet): one looping instance of the original storm bed (wind, rain, sea, distant machinery), louder than
// the other beds and gently ducked by the weapons via the sfx limiter; thunder one-shots are layered by scene.js
Bk.ambStart=w=>{if(!AC||AMB)return;if(!LB){LB=AC.createGain();LB.connect(SB);}try{const A=AMBS[w]||AMBS[''],s=AC.createBufferSource(),st=w==='storm'&&REC.storm;s.buffer=st?REC.storm:loopNoise(3);s.loop=true;const f=AC.createBiquadFilter();f.type=st?'lowpass':A.type;f.frequency.value=st?12000:A.f;const g=AC.createGain();g.gain.value=0;
 s.connect(f).connect(g).connect(LB);s.start();g.gain.linearRampToValueAtTime(A.v,AC.currentTime+2);AMB={s,g};Bk.applyMute();}catch(e){}};
Bk.ambOn=()=>!!AMB;
Bk.ambStop=()=>{if(!AMB)return;const a=AMB;AMB=null;try{a.g.gain.setTargetAtTime(0,AC.currentTime,.3);setTimeout(()=>{try{a.s.stop();}catch(_){}},1500);}catch(_){}};
})();
