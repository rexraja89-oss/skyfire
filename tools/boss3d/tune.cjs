// Look tuning against the concept: renders the boss straight down over exactly the texture's world box
// (x -15.5..15.5, z -18.5..18.5) for each candidate setting, in the viewer's studio light. Scoring: tune_score.py.
// Run: node tune.cjs candidates.json outdir
'use strict';
const fs=require('fs');const {open}=require('./lib/browser.cjs');
(async()=>{const [cands,dir]=[JSON.parse(fs.readFileSync(process.argv[2],'utf8')),process.argv[3]];fs.mkdirSync(dir,{recursive:true});
 const {browser,page,errors}=await open({root:__dirname,viewport:{width:620,height:740}});
 await page.goto('http://boss.test/lab/lab.html');await page.waitForFunction(()=>window.ready);await page.evaluate(()=>load('/out/megaboss_hq.glb'));
 for(const [i,c] of cands.entries()){const d=await page.evaluate(c=>{R.setSize(620,740);R.outputEncoding=THREE.sRGBEncoding;R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=c.exposure||1.05;
   const s=new THREE.Scene(),g=cache['/out/megaboss_hq.glb'].clone(true);g.traverse(o=>{if(o.isMesh){o.geometry=o.geometry.clone();o.material=o.material.clone();}});
   s.environment=MegaBossFX.envCube();s.add(new THREE.HemisphereLight(0xffffff,0x444455,.6));const L=new THREE.DirectionalLight(0xffffff,2);L.position.set(-14,40,10);s.add(L);s.add(g);
   const C=MegaBossFX.merge(MegaBossFX.CFG,{concept:c.concept||{},hull:c.hull||{},engines:{on:false}});const A=MegaBossFX.build(g,C,{hq:true});A.update(1);if(A.light)A.light.visible=false;
   const cam=new THREE.OrthographicCamera(-15.5,15.5,18.5,-18.5,-100,100);cam.position.set(0,50,0);cam.up.set(0,0,-1);cam.lookAt(0,0,0);R.setClearColor(0,1);R.render(s,cam);
   const url=R.domElement.toDataURL('image/png');s.remove(g);A.dispose();return url;},c);
  fs.writeFileSync(`${dir}/c${String(i).padStart(3,'0')}.png`,Buffer.from(d.split(',')[1],'base64'));}
 if(errors.length)console.log(errors);await browser.close();console.log('rendered',cands.length);})();
