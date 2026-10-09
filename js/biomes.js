'use strict';
// ============ REALISTIC TERRAIN FOR MORE BIOMES (v5.4) ============
// Moves Harbor Dawn, Coral Isles, Red Canyon, Frozen Outpost and Magma Citadel onto the realistic terrain path
// (js/terrain_pbr.js). Each biome picks five layer textures (art/ter_*.jpg) and tints them, then says per vertex
// how much of layers 1-4 to use (layer 0 fills the rest): o = [layer1, layer2 (rock), layer3, layer4].
// Height fields and props stay as they were in world.js; only the ground material changes.
(()=>{
const W1=[1,1,1];
// Harbor Dawn: meadow grass, earth, warm granite, moss, beach sand at the waterline (sea bed too)
Object.assign(BIOME.harbor,{pbr:{tex:['grass','soil','rock','moss','sand'],tint:[[.98,1.06,.8],[1,.95,.88],[1.08,1,.9],[1,1.04,.92],[1.05,1,.92]]},
 splat(o,x,z,h,sl,under){const nz=fbm(x*.08+4,z*.08,2);let rock=sst(.38,.66,sl)+sst(9,16,h)*.6,sand=1-sst(.7,1.5,h),soil=sst(.2,.55,nz)*.45*(1-rock),moss=sst(1.5,4,under)*.35+sst(.18,.36,sl)*.3;
  rock=Math.min(1,rock);if(h<-.2){sand=1;rock*=.3;}const t=soil+rock+moss+sand;o[0]=soil;o[1]=rock;o[2]=moss;o[3]=sand;if(t>1)for(let i=0;i<4;i++)o[i]/=t;},
 wet(x,z,h){return 1-sst(.3,1.3,h);},occ:{canopy:[.42,.5],boulder:[1,.55],boulder2:[1,.55]}});
// Coral Isles: bright tropical grass, white beach sand ringing every island and under the shallows, dark volcanic rock, jungle moss
Object.assign(BIOME.islands,{pbr:{tex:['grass','sand','rock','moss','gravel'],tint:[[.96,1.1,.84],[1.12,1.08,1],[.78,.72,.64],[.95,1.08,.9],[1.1,1.06,.98]]},
 splat(o,x,z,h,sl,under){let sand=1-sst(.9,2,h),rock=sst(.6,.95,sl)*.45,moss=sst(2,5,h)*.85*(1-rock),grav=h<.5&&h>-1.5?.25:0;if(h<0)sand=1;
  const t=sand+rock+moss+grav;o[0]=sand;o[1]=rock;o[2]=moss;o[3]=grav;if(t>1)for(let i=0;i<4;i++)o[i]/=t;},
 wet(x,z,h){return 1-sst(.2,1,h);},occ:{palmS:[.28,.35],boulder:[1,.55],boulder2:[1,.55]}});
// Red Canyon: red sand floors, iron-red soil on the mesas, banded sandstone walls, dry scrub, red gravel at the cliff feet
Object.assign(BIOME.canyon,{pbr:{tex:['sand','sand','rock','moss','gravel'],tint:[[.8,.48,.31],[.66,.36,.22],[.86,.46,.3],[.62,.58,.36],[.7,.45,.33]],strata:.6,sc:[1.2,.82,.66]},
 splat(o,x,z,h,sl,under){const rv=2+6*Math.sin(z*.009),d=Math.abs(x-rv),nz=fbm(x*.07,z*.07,2);let rock=sst(.3,.55,sl),soil=sst(4,8,h)*(1-rock)*.8,scrub=sst(.25,.55,nz)*.25*(1-rock)*sst(1,3,h),grav=sst(1.5,3.5,under)*.25*(1-rock)*(1-sst(.15,.3,sl));
  if(d<4)soil*=.3;const t=soil+rock+scrub+grav;o[0]=soil;o[1]=rock;o[2]=scrub;o[3]=grav;if(t>1)for(let i=0;i<4;i++)o[i]/=t;},
 wet(x,z){const rv=2+6*Math.sin(z*.009);return 1-sst(2.5,5,Math.abs(x-rv));},occ:{boulder:[1,.55],boulder2:[1,.55],canopy:[.42,.45]}});
// Frozen Outpost: wind-packed snow, blue sea ice on the shelf, cold grey rock on steep ground, drift snow in hollows
Object.assign(BIOME.arctic,{pbr:{tex:['snow','snow','rock','snow','gravel'],tint:[W1,[.78,.9,1.1],[.72,.8,.92],[.9,.95,1.04],[.8,.84,.9]],ns:.55},
 splat(o,x,z,h,sl,under){const ic=14+3*Math.sin(z*.013);let ice=x>ic-2?1-sst(.3,.8,h):0,rock=sst(.32,.55,sl),drift=sst(1.2,3,under)*.5,grav=0;
  if(Math.abs(x+3)<7&&Math.abs(((z%180)+180)%180-90)<14)grav=.5;   // trodden ground round the base camp
  const t=ice+rock+drift+grav;o[0]=ice;o[1]=rock;o[2]=drift;o[3]=grav;if(t>1)for(let i=0;i<4;i++)o[i]/=t;},
 occ:{rock:[1,.5]}});
// Magma Citadel: ash plains, dark basalt, red cinders; the ground near the lava river glows
Object.assign(BIOME.volcano,{pbr:{tex:['ash','ash','rock','gravel','gravel'],tint:[[.5,.47,.47],[.36,.33,.33],[.28,.25,.24],[.7,.38,.3],[.42,.39,.39]],ns:.8},
 splat(o,x,z,h,sl,under){const nz=fbm(x*.06+7,z*.06,2);let dark=sst(.1,.5,nz)*.6,rock=sst(.3,.55,sl)+sst(8,14,h)*.5,cind=sst(1,3,under)*.5,grav=sst(.45,.8,nz)*.3;
  rock=Math.min(1,rock);const t=dark+rock+cind+grav;o[0]=dark;o[1]=rock;o[2]=cind;o[3]=grav;if(t>1)for(let i=0;i<4;i++)o[i]/=t;},
 tint(o,x,z,h){const lr=-5+9*Math.sin(z*.01)+3*Math.sin(z*.033),d=Math.abs(x-lr),g=d<6?(1-d/6)**2*(1-sst(.5,3,h)):0;o[0]=1+2.6*g;o[1]=1+.9*g;o[2]=1+.2*g;},
 occ:{rock:[1,.5],spike:[.7,.45]}});
})();
// ============ SET PIECES (v5.4) ============
// One or two landmark props per stage, all original designs built from simple shapes.
SF.setPieces=({plain,metal,B,Cy,Co})=>{
 const glow=c=>new T3.MeshBasicMaterial({vertexColors:true,toneMapped:false});
 // Harbor: lighthouse on the shore, a burnt-out tanker wreck listing in the bay
 const lh=[[Cy(1.1,1.5,9,12),'#f2f0ea',MT(0,4.5,0)]];for(let i=0;i<3;i++)lh.push([Cy(1.16-i*.12,1.28-i*.12,1.1,12),'#c8322a',MT(0,1.6+i*2.6,0)]);
 lh.push([Cy(1.2,1.2,1.4,10),'#30363c',MT(0,9.7,0)],[Co(1.4,1.2,10),'#c8322a',MT(0,11,0)],[Cy(2,2,.3,12),'#30363c',MT(0,9,0)],[B(4,1.2,3),'#e8e4dc',MT(2.6,.6,0)]);
 PROPS.lighthouse={geo:merge(lh),mat:plain,cap:4};
 PROPS.lhLight={geo:merge([[new T3.SphereGeometry(.75,10,8),'#fff4c0',MT(0,9.8,0)]]),mat:glow(),cap:4,noShadow:1};
 PROPS.tankerWreck={geo:merge([[B(22,2.2,5),'#3a2a24',MT(0,-.2,0,0,0,.05)],[B(20,.25,4.6),'#2a201c',MT(0,1,0,0,0,.05)],[B(4,3.2,4),'#4a4440',MT(-7,2.2,0,0,0,.05)],
  [Cy(.5,.5,3.4,8),'#1a1614',MT(-6,4.4,0,0,0,.05)],[B(5,1.4,3.6),'#6a2a1a',MT(3,1.2,0,0,.2,.12)],[B(3,.4,3.8),'#1e1a18',MT(7,1.1,.2,0,0,.4)]]),mat:metal,cap:3};
 // Golden Fields: windmills
 const wm=[[Cy(.35,.6,7,8),'#e8e2d4',MT(0,3.5,0)],[B(.9,.9,1.2),'#a84a3a',MT(0,7,.2)]];for(let i=0;i<3;i++){const a=i/3*TAU;wm.push([B(.35,4.2,.08),'#f4f2ee',MT(Math.sin(a)*2.1,7+Math.cos(a)*2.1,.9,0,0,-a)]);}
 PROPS.windmill={geo:merge(wm),mat:plain,cap:10};
 // Desert Highway: crashed cargo plane, broken in two and half buried
 PROPS.cargoWreck={geo:merge([[Cy(1.7,1.7,12,14),'#c9c6be',MT(0,.8,-3,Math.PI/2,0,.1)],[Cy(1.7,1.2,6,14),'#bdb9b0',MT(1.5,.6,7,Math.PI/2+.08,.35,.1)],
  [B(14,.35,3.2),'#b4b0a6',MT(-7,.6,-2,0,.18,.06)],[B(4,.3,2.6),'#8a8478',MT(6.5,.2,1,0,-.4,-.2)],[B(.3,3.6,2.6),'#c23b2e',MT(2.2,2.4,9.4,0,.35,0)],
  [Cy(.7,.8,2.2,10),'#3a3836',MT(-5,.4,-1,Math.PI/2,0,0)],[Co(1.7,2.4,14),'#a8a49a',MT(0,.9,-10.2,-Math.PI/2,0,.1)],[B(3,.06,5),'#2a2622',MT(-1,.05,1)]]),mat:metal,cap:3};
 // Red Canyon: rope bridges across the river gorge
 const br=[];for(let i=0;i<18;i++)br.push([B(.45,.12,2.2),i%5===3?'#4a3424':'#7a5a3a',MT(-8.5+i,0,0,0,0,Math.sin(i/17*Math.PI)*-.04)]);
 for(const s of[-1,1]){br.push([Cy(.05,.05,18,4),'#3a2a1c',MT(0,.9,s*1.1,0,0,Math.PI/2)]);for(const e of[-9,9])br.push([Cy(.14,.16,3,6),'#4a3424',MT(e,.6,s*1.2)]);}
 PROPS.ropeBridge={geo:merge(br),mat:plain,cap:6};
 // Frozen Outpost: glowing shield domes over the base
 PROPS.shieldDome={geo:merge([[new T3.SphereGeometry(7,24,12,0,TAU,0,Math.PI/2),'#5fd8ff',MT(0,0,0)]]),mat:new T3.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.18,blending:T3.AdditiveBlending,depthWrite:false,side:T3.DoubleSide}),cap:4,noShadow:1};
 PROPS.domeRing={geo:merge([[new T3.TorusGeometry(7,.18,6,40),'#9ff0ff',MT(0,.1,0,Math.PI/2)]]),mat:glow(),cap:4,noShadow:1};
 // Neon Metropolis: neon signs on poles at street corners
 const ns=c=>merge([[B(.15,5,.15),'#20222a',MT(0,2.5,0)],[B(3,1.2,.2),c,MT(0,5.4,0)]]);
 PROPS.neonM={geo:ns('#ff3cc8'),mat:glow(),cap:30,noShadow:1};PROPS.neonC={geo:ns('#30f0ff'),mat:glow(),cap:30,noShadow:1};PROPS.neonY={geo:ns('#ffd23f'),mat:glow(),cap:30,noShadow:1};
 // Magma Citadel: red alarm beacons on the fortress approach
 PROPS.beacon={geo:merge([[Cy(.25,.4,4,6),'#2a2422',MT(0,2,0)],[new T3.SphereGeometry(.45,8,6),'#ff3020',MT(0,4.2,0)]]),mat:glow(),cap:30,noShadow:1};
};
// place the set pieces (runs after each biome's own props)
(()=>{const add=(b,uses,fn)=>{const B=BIOME[b],o=B.props;B.uses=(B.uses||[]).concat(uses);B.props=(R,z0,put,HF)=>{o(R,z0,put,HF);fn(R,z0,put,HF);};};
 add('harbor',['lighthouse','lhLight','tankerWreck'],(R,z0,put,HF)=>{
  if(R()<.35){const z=z0-20-R()*(TL-40),c=-9+2.5*Math.sin(z*.012)+1.2*Math.sin(z*.041),x=c-4;put('lighthouse',x,z,1,R()*TAU,null);put('lhLight',x,z,1,0,null);}
  if(R()<.4){const z=z0-25-R()*(TL-50),x=18+R()*22;put('tankerWreck',x,z,1,R()*.6-.3+Math.PI/2,null,1,-.6);}});
 add('farm',['windmill'],(R,z0,put,HF)=>{for(let i=0;i<2;i++)if(R()<.6){const x=(R()<.5?-1:1)*(16+R()*30),z=z0-R()*TL;put('windmill',x,z,1.1,R()*.6-.3,null);}});
 add('desert',['cargoWreck'],(R,z0,put,HF)=>{if(R()<.3){const x=(R()<.5?-1:1)*(18+R()*24),z=z0-25-R()*(TL-50);put('cargoWreck',x,z,1.1,R()*TAU,null,1,-.5);}});
 add('canyon',['ropeBridge'],(R,z0,put,HF)=>{if(R()<.55){const z=z0-20-R()*(TL-40),rv=2+6*Math.sin(z*.009),h=Math.max(HF(rv-9,z),HF(rv+9,z));put('ropeBridge',rv,z,1,0,null,1,h-HF(rv,z)-.4);}});
 add('arctic',['shieldDome','domeRing'],(R,z0,put,HF)=>{if(R()<.7){const z=z0-20-R()*(TL-40),x=-6+R()*6;put('shieldDome',x,z,1,0,null);put('domeRing',x,z,1,0,null);}});
 add('city',['neonM','neonC','neonY'],(R,z0,put,HF)=>{for(let i=0;i<10;i++){const x=-30+16*Math.floor(R()*6)+1.2,z=Math.ceil((z0+9000)/18)*18-9000-18*Math.floor(R()*6)-1.2;if(z>z0||z<z0-TL)continue;put(pick(['neonM','neonC','neonY']),x,z,1,Math.floor(R()*4)*Math.PI/2,null);}});
 add('volcano',['beacon'],(R,z0,put,HF)=>{for(let i=0;i<6;i++){const x=(R()<.5?-1:1)*(10+R()*30),z=z0-R()*TL;put('beacon',x,z,1,0,null);}});
})();
