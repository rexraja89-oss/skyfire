'use strict';
// ============ SCENE COLOUR GRADE (v5.7) ============
// Grades the actual 3D frame (not the overlay): in HQ the scene renders into an offscreen target (multisampled on
// WebGL2), then one full-screen pass applies contrast, saturation and split toning (shadow colour / highlight colour)
// from the stage's SF.ATMOS[biome].grade = [highlight colour, shadow colour, strength]. The pass works on the
// display-ready (tone-mapped, sRGB) image. Smooth mode and menus render straight to the screen as before.
(()=>{
const T3=THREE,Gd=SF.grade={on:false};
let RT=null,Q=null,QS=null,QC=null;const sz=new T3.Vector2();
const LUMA='vec3(.2126,.7152,.0722)';
function build(){const U={t:{value:null},hi:{value:new T3.Color()},sh:{value:new T3.Color()},amt:{value:0},con:{value:1.06},sat:{value:1.06}};
 const m=new T3.ShaderMaterial({uniforms:U,depthTest:false,depthWrite:false,toneMapped:false,
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader:`uniform sampler2D t;uniform vec3 hi,sh;uniform float amt,con,sat;varying vec2 vUv;
   void main(){vec3 c=texture2D(t,vUv).rgb;float l=dot(c,${LUMA});
    c=mix(vec3(l),c,sat);c=(c-.5)*con+.5;                                   // saturation, contrast around mid-grey
    vec3 tone=mix(sh,hi,smoothstep(.12,.82,l));c+=(tone-dot(tone,${LUMA}))*amt; // split toning: shift hue only, keep brightness
    gl_FragColor=vec4(clamp(c,0.,1.),1.);}`});
 Q=new T3.Mesh(new T3.PlaneGeometry(2,2),m);Q.frustumCulled=false;QS=new T3.Scene();QS.add(Q);QC=new T3.OrthographicCamera(-1,1,1,-1,0,1);}
function target(w,h){if(RT&&RT.width===w&&RT.height===h)return RT;if(RT)RT.dispose();
 const o={encoding:T3.sRGBEncoding,depthBuffer:true,stencilBuffer:false};
 RT=renderer.capabilities.isWebGL2&&T3.WebGLMultisampleRenderTarget?new T3.WebGLMultisampleRenderTarget(w,h,o):new T3.WebGLRenderTarget(w,h,o);
 if(RT.samples!==undefined)RT.samples=4;RT.texture.encoding=T3.sRGBEncoding;return RT;}
// render the 3D scene for a flight: graded in HQ, direct otherwise
Gd.render=si=>{const st=STAGES[si],A=st&&SF.ATMOS[LV.bk||st.biome],g=A&&A.grade;Gd.on=!!(save.hq&&g);
 if(!Gd.on){renderer.render(scene,camera);return;}
 if(!Q)build();renderer.getDrawingBufferSize(sz);const rt=target(sz.x,sz.y),U=Q.material.uniforms;
 U.hi.value.set(g[0]);U.sh.value.set(g[1]);U.amt.value=g[2]*1.6;U.con.value=g[3]||1.06;U.sat.value=g[4]||1.06;
 renderer.setRenderTarget(rt);renderer.render(scene,camera);renderer.setRenderTarget(null);U.t.value=rt.texture;renderer.render(QS,QC);};
Gd.dispose=()=>{if(RT){RT.dispose();RT=null;}};
})();
