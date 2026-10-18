// Full-detail boss for the Blender cinematic (not for the game): all 188k triangles of the Meshy mesh in the game frame,
// hard-edge normals, top-down UVs + the HQ concept textures, engine anchors. Uncompressed. -> out/megaboss_cine.glb
'use strict';
const fs=require('fs');const M=require('./lib/mesh.cjs');
(async()=>{const o=M.readGLB('src/megaboss_meshy_original.glb'),g=M.toGameFrame(o.P,30),n=M.creaseNormals(g.P,o.I,38);
 const TB=JSON.parse(fs.readFileSync('src/concept/tex/concept_tex.json','utf8')).texWorldBox,UV=new Float32Array(n.P.length/3*2);
 for(let i=0;i<n.P.length/3;i++){UV[i*2]=Math.min(1,Math.max(0,(n.P[i*3]-TB.x0)/(TB.x1-TB.x0)));UV[i*2+1]=Math.min(1,Math.max(0,(n.P[i*3+2]-TB.z0)/(TB.z1-TB.z0)));}
 const rig=JSON.parse(fs.readFileSync('out/rig.json','utf8'));
 await M.writeGLB('out/megaboss_cine.glb',{hull:{P:n.P,N:n.N,I:n.I,UV},empties:rig.engines.map(e=>({name:e.id,pos:e.pos,extras:{radius:e.radius}})),
  hullMat:{color:[1,1,1,1],roughness:.45,metalness:.05,tex:{albedo:'src/concept/tex/albedo_hq.jpg',glow:'src/concept/tex/glow_hq.jpg'}},quant:false});
 console.log('out/megaboss_cine.glb',(fs.statSync('out/megaboss_cine.glb').size/1e6).toFixed(1),'MB',n.I.length/3,'tris');})();
