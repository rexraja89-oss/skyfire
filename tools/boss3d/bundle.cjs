// One-file viewer for the phone: inlines three r128, loaders, the FX layer and both GLBs (base64) into
// out/megaboss_viewer.html, so it opens offline from a single file. Run after build.cjs.
'use strict';
const fs=require('fs');
let h=fs.readFileSync('viewer/index.html','utf8');
const inl=f=>'<script>'+fs.readFileSync(f,'utf8').replace(/<\/script/gi,'<\\/script')+'</script>';
for(const f of['vendor/three.min.js','vendor/GLTFLoader.js','vendor/OrbitControls.js','megaboss_fx.js','megaboss_bays.js','megaboss_motion.js','bay_demo.js'])h=h.replace(`<script src="${f}"></script>`,()=>inl('viewer/'+f));
const glb=k=>fs.readFileSync(`out/megaboss_${k}.glb`).toString('base64');
h=h.replace('<script>\n\'use strict\';',()=>`<script>window.__GLB={hq:"${glb('hq')}",smooth:"${glb('smooth')}"};</script>\n<script>\n'use strict';`);
if(/<script src=/.test(h))throw new Error('external script left in bundle');
fs.writeFileSync('out/megaboss_viewer.html',h);console.log('out/megaboss_viewer.html',(fs.statSync('out/megaboss_viewer.html').size/1e6).toFixed(2),'MB');
