'use strict';
// Viewer-only host for the weapon bays (megaboss_bays.js): turns bay events into 3D missiles, particles and synth
// sounds, so the bay cycle can be judged on the phone. In the game, the same events would become the game's own
// enemy missiles (2D overlay), explosions and sound bank instead. Not part of the game.
const BayDemo=(()=>{const T=THREE;
 // ---- particles: one additive Points (fire, sparks, missile flames) + one normal-blended Points (smoke) -----------------
 function Particles(scene,N,additive){const P=new Float32Array(N*3),Cl=new Float32Array(N*3),Sz=new Float32Array(N),Al=new Float32Array(N);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(P,3));g.setAttribute('pc',new T.BufferAttribute(Cl,3));g.setAttribute('ps',new T.BufferAttribute(Sz,1));g.setAttribute('pa',new T.BufferAttribute(Al,1));
  const m=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:additive?T.AdditiveBlending:T.NormalBlending,uniforms:{k:{value:1}},
   vertexShader:'attribute vec3 pc;attribute float ps,pa;uniform float k;varying vec3 vc;varying float va;void main(){vc=pc;va=pa;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=ps*k/-mv.z;gl_Position=projectionMatrix*mv;}',
   fragmentShader:'varying vec3 vc;varying float va;void main(){vec2 d=gl_PointCoord-.5;float r=dot(d,d)*4.;if(r>1.)discard;float a=va*'+(additive?'pow(1.-r,1.5)':'(1.-r)*(1.-r)')+';'+
    (additive?'gl_FragColor=vec4(vc*a,1.);':'gl_FragColor=vec4(vc,a);')+'gl_FragColor=linearToOutputTexel(gl_FragColor);}'});
  const pts=new T.Points(g,m);pts.frustumCulled=false;pts.renderOrder=additive?6:5;scene.add(pts);const L=[];
  return {pts,m,add(p,v,col,size,life,o={}){if(L.length>=N)L.shift();L.push({p:p.clone(),v:v.clone(),c:new T.Color(col),size,life,t:0,grow:o.grow||0,drag:o.drag??1.5,rise:o.rise||0,fade:o.fade||'out'});},
   update(dt){for(let i=L.length-1;i>=0;i--){const q=L[i];q.t+=dt;if(q.t>=q.life){L.splice(i,1);continue;}q.v.multiplyScalar(Math.exp(-q.drag*dt));q.v.y+=q.rise*dt;q.p.addScaledVector(q.v,dt);}
    for(let i=0;i<N;i++){const q=L[i];if(!q){Al[i]=0;Sz[i]=0;continue;}const k=q.t/q.life;P.set([q.p.x,q.p.y,q.p.z],i*3);Cl.set([q.c.r,q.c.g,q.c.b],i*3);
     Sz[i]=q.size*(1+q.grow*k);Al[i]=q.fade==='in-out'?Math.min(1,k*6)*(1-k):(1-k);}
    for(const a of['position','pc','ps','pa'])g.attributes[a].needsUpdate=true;},
   clear(){L.length=0;},dispose(){scene.remove(pts);g.dispose();m.dispose();}};}
 // ---- synth sounds (Web Audio, started on the first tap) ---------------------------------------------------------------
 function Synth(){let ac=null,master=null,noiseBuf=null;const S={on:true};
  S.start=()=>{if(ac)return ac.resume();const C=window.AudioContext||window.webkitAudioContext;if(!C)return;ac=new C();master=ac.createGain();master.gain.value=.7;
   const comp=ac.createDynamicsCompressor();master.connect(comp);comp.connect(ac.destination);noiseBuf=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;};
  const env=(g,t,a,peak,dec)=>{g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(.0005,t+a+dec);};
  const tone=(type,f0,f1,dur,peak,at=0,filt)=>{const t=ac.currentTime+at,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);
   let n=o;if(filt){const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=filt;o.connect(f);n=f;}n.connect(g);g.connect(master);env(g,t,.005,peak,dur);o.start(t);o.stop(t+dur+.05);};
  const noise=(type,f0,f1,dur,peak,at=0,q=1,attack=.01)=>{const t=ac.currentTime+at,s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();s.buffer=noiseBuf;f.type=type;f.Q.value=q;
   f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(f1,t+dur);s.connect(f);f.connect(g);g.connect(master);env(g,t,attack,peak,dur);s.start(t,Math.random());s.stop(t+dur+.1);};
  const clunk=at=>{tone('sine',150,55,.16,.5,at);noise('lowpass',900,200,.08,.25,at);};
  S.play=(k,pan)=>{if(!ac||!S.on||ac.state!=='running')return;
   ({warn:()=>{for(let i=0;i<3;i++){tone('square',1240,1240,.07,.06,i*.22,3000);tone('square',930,930,.07,.05,i*.22+.1,3000);}},
     open:()=>{noise('bandpass',2400,500,.42,.22,0,1.2,.03);clunk(.38);},
     deploy:()=>{tone('sawtooth',110,380,.45,.12,0,900);noise('bandpass',700,1600,.4,.08,0,2);clunk(.43);},
     missile:()=>{noise('bandpass',3200,600,.55,.32,0,.8,.004);tone('sine',190,55,.14,.45);noise('highpass',4000,2500,.06,.2);},
     retract:()=>{tone('sawtooth',360,110,.45,.1,0,800);noise('bandpass',1500,600,.4,.07,0,2);},
     close:()=>{noise('bandpass',600,2000,.3,.15,0,1.2,.03);clunk(.32);},
     hit:()=>{noise('highpass',5000,3000,.05,.25);tone('square',2200,1400,.04,.05);},
     boom:()=>{noise('lowpass',1400,90,1.4,.9,0,.7,.004);tone('sine',75,28,.9,.8);noise('bandpass',2500,400,.5,.25,.05);},
     pop:()=>{noise('lowpass',1800,150,.5,.35,0,.7,.003);tone('sine',110,40,.3,.3);}})[k]?.();};
  return S;}
 // ---- missiles: one instanced mesh, pop up out of the tube then home on the target -----------------------------------
 function missileGeo(){const parts=[],M=new T.Matrix4();const add=(g,y,c)=>{g.translate(0,y,0);const n=g.attributes.position.count,col=new Float32Array(n*3);const cc=new T.Color(c).convertSRGBToLinear();for(let i=0;i<n;i++)col.set([cc.r,cc.g,cc.b],i*3);g.setAttribute('color',new T.BufferAttribute(col,3));parts.push(g.toNonIndexed());};
  add(new T.CylinderGeometry(.11,.11,.9,10),0,'#eceef3');add(new T.ConeGeometry(.11,.3,10),.6,'#d0121e');add(new T.CylinderGeometry(.115,.115,.08,10),.3,'#a04dff');
  for(let i=0;i<4;i++){const f=new T.BoxGeometry(.02,.22,.28);f.translate(0,0,.13);f.rotateY(i*Math.PI/2);add(f,-.36,'#2a2b33');}
  let n=0;for(const p of parts)n+=p.attributes.position.count;const P=new Float32Array(n*3),N=new Float32Array(n*3),Cc=new Float32Array(n*3);let o=0;
  for(const p of parts){P.set(p.attributes.position.array,o*3);N.set(p.attributes.normal.array,o*3);Cc.set(p.attributes.color.array,o*3);o+=p.attributes.position.count;p.dispose();}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(P,3));g.setAttribute('normal',new T.BufferAttribute(N,3));g.setAttribute('color',new T.BufferAttribute(Cc,3));g.rotateX(Math.PI/2);return g;}   // nose along +Z
 function create(scene,opts={}){const fire=Particles(scene,320,true),smoke=Particles(scene,900,false),snd=Synth(),MAX=24;
  const mm=new T.InstancedMesh(missileGeo(),new T.MeshStandardMaterial({vertexColors:true,roughness:.35,metalness:.2,envMap:opts.env||null}),MAX);mm.count=0;mm.frustumCulled=false;scene.add(mm);
  const ms=[],tmp=new T.Object3D(),target=opts.target||(()=>new T.Vector3(0,0,40)),V=v=>new T.Vector3(v.x,v.y,v.z),rnd=s=>(Math.random()-.5)*s;
  const D={snd,fire,smoke,missiles:ms,
   explode(p,s=1){for(let i=0;i<18*s;i++){const v=new T.Vector3(rnd(1),Math.random()*.8,rnd(1)).normalize().multiplyScalar(4+Math.random()*7*s);fire.add(p,v,i%3?'#b8641e':'#a8300e',(1.1+Math.random()*1.3)*s,.3+Math.random()*.35,{grow:1.4,drag:4});}
    for(let i=0;i<12*s;i++)smoke.add(p,new T.Vector3(rnd(3),1+Math.random()*2,rnd(3)),'#3a3836',(2+Math.random()*2)*s,1.6+Math.random(),{grow:2.2,drag:1.2,rise:.8,fade:'in-out'});
    for(let i=0;i<18*s;i++)fire.add(p,new T.Vector3(rnd(1),Math.random(),rnd(1)).normalize().multiplyScalar(9+Math.random()*12),'#ffd890',.25,.4+Math.random()*.5,{drag:1.2,rise:-14});},
   sparks(p,n=6){for(let i=0;i<n;i++)fire.add(p,new T.Vector3(rnd(1),Math.random()*.9+.2,rnd(1)).normalize().multiplyScalar(5+Math.random()*8),i%2?'#ffd27a':'#ff8a3a',.3,.25+Math.random()*.35,{drag:1,rise:-16});},
   // bay events -> effects + sound
   on(type,d){const p=d.pos&&V(d.pos);
    if(type==='warn'||type==='open'||type==='deploy'||type==='retract'||type==='close')snd.play(type);
    else if(type==='missile'){snd.play('missile');ms.push({p:p.clone(),v:V(d.dir).multiplyScalar(13),t:0});fire.add(p,V(d.dir).multiplyScalar(3),'#9a5ab0',1.1,.14,{grow:.8});
     for(let i=0;i<5;i++)smoke.add(p,new T.Vector3(rnd(2),1,rnd(2)),'#cfcbd2',1.1,.7,{grow:2,drag:2,fade:'in-out'});}
    else if(type==='hit'){snd.play('hit');D.sparks(p,7);}
    else if(type==='dead'){snd.play('boom');D.explode(p,1.3);}
    else if(type==='smoke')smoke.add(p,new T.Vector3(rnd(.6),1.6+Math.random(),rnd(.6)),d.heavy?'#2b2927':'#55524f',(d.heavy?2.6:1.8),2.4,{grow:2.4,drag:.6,rise:.3,fade:'in-out'});
    else if(type==='spark')D.sparks(p,4);},
   update(dt){const tg=target();
    for(let i=ms.length-1;i>=0;i--){const m=ms[i];m.t+=dt;
     if(m.t>.3){const want=tg.clone().sub(m.p).normalize(),sp=Math.min(30,m.v.length()+30*dt),cur=m.v.clone().normalize(),turn=Math.min(1,3.2*dt);cur.lerp(want,turn).normalize();m.v.copy(cur).multiplyScalar(sp);}
     else m.v.multiplyScalar(1-dt*1.5);
     const prev=m.p.clone();m.p.addScaledVector(m.v,dt);const back=m.p.clone().addScaledVector(m.v.clone().normalize(),-.55);
     fire.add(back,new T.Vector3(),'#8a48b8',.9,.07,{grow:-.5});
     // continuous trail: puffs spaced ~0.3 units along the path flown this frame
     const seg=m.p.distanceTo(prev),n=Math.max(1,Math.ceil(seg/.3));for(let j=0;j<n;j++){const q=prev.clone().lerp(m.p,(j+1)/n).addScaledVector(m.v.clone().normalize(),-.55);smoke.add(q,new T.Vector3(rnd(.3),.25,rnd(.3)),'#bdb8c2',.7,.9,{grow:2.4,drag:1,fade:'in-out'});}
     if(m.t>4||m.p.distanceTo(tg)<1.2||m.p.y<-24){snd.play('pop');D.explode(m.p,.5);ms.splice(i,1);}}
    mm.count=Math.min(MAX,ms.length);for(let i=0;i<mm.count;i++){const m=ms[i];tmp.position.copy(m.p);tmp.lookAt(m.p.clone().add(m.v));tmp.updateMatrix();mm.setMatrixAt(i,tmp.matrix);}mm.instanceMatrix.needsUpdate=true;
    fire.update(dt);smoke.update(dt);},
   setPointScale(k){fire.m.uniforms.k.value=smoke.m.uniforms.k.value=k;},
   clear(){ms.length=0;fire.clear();smoke.clear();},
   dispose(){fire.dispose();smoke.dispose();scene.remove(mm);mm.geometry.dispose();mm.material.dispose();}};
  return D;}
 return {create};})();
