// Negative test fixture: a deliberately broken copy of the Smooth GLB (hull squeezed 10% in width, one weapon marker
// lifted off the hull). `node validate.cjs --fixture` must FAIL on it (exit 1); see `npm run test:negative`.
'use strict';
const fs=require('fs');const {NodeIO}=require('@gltf-transform/core');const {KHRMeshQuantization}=require('@gltf-transform/extensions');
(async()=>{const io=new NodeIO().registerExtensions([KHRMeshQuantization]);const doc=await io.read('out/megaboss_smooth.glb');
 for(const n of doc.getRoot().listNodes()){if(n.getName()==='hull'){const s=n.getScale();n.setScale([s[0]*.9,s[1],s[2]]);}
  if(n.getName()==='wb_drone_L'){const t=n.getTranslation();n.setTranslation([t[0],t[1]+.5,t[2]]);}}
 fs.mkdirSync('out/fixture',{recursive:true});fs.writeFileSync('out/fixture/megaboss_broken.glb',await io.writeBinary(doc));console.log('wrote out/fixture/megaboss_broken.glb');})();
