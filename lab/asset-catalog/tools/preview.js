// Renders previews for every prepared candidate (candidates_prep.json) into previews/<id>.jpg and sky panoramas.
// Run from lab/asset-catalog:  node tools/preview.js   (uses the game repo's Playwright test install)
const fs=require('fs'),path=require('path');const {chromium}=require('/home/user/skyfire/tests/node_modules/playwright');
const HERE=path.dirname(__dirname),types={'.html':'text/html','.js':'application/javascript','.wasm':'application/wasm','.glb':'model/gltf-binary','.hdr':'application/octet-stream'};
(async()=>{const prep=JSON.parse(fs.readFileSync(path.join(HERE,'candidates_prep.json'))),src=JSON.parse(fs.readFileSync(path.join(HERE,'candidates_src.json')));
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
 const ctx=await b.newContext({viewport:{width:512,height:512}});
 await ctx.route('**/*',r=>{const u=new URL(r.request().url());const f=path.join(HERE,decodeURIComponent(u.pathname));if(!fs.existsSync(f))return r.fulfill({status:404,body:''});r.fulfill({body:fs.readFileSync(f),contentType:types[path.extname(f)]||'application/octet-stream'});});
 const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 await pg.goto('http://lab.test/tools/preview.html');fs.mkdirSync(path.join(HERE,'previews'),{recursive:true});
 const save=(name,d)=>fs.writeFileSync(path.join(HERE,'previews',name),Buffer.from(d.split(',')[1],'base64'));
 await pg.evaluate(u=>setSky(u),'/raw/skies/kloofendal_48d_partly_cloudy_puresky.hdr');
 for(const m of src.models){const p=prep[m.id];if(!p||p.error)continue;
  const ground=m.category.startsWith('9')?'#6b6250':'#5d6266';
  try{const r=await pg.evaluate(([u,g])=>renderModel(u,g),['/'+p.file,ground]);save(m.id+'.jpg',r.img);p.previewTris=r.tris;p.dims=r.size;console.log('preview',m.id,r.tris);}catch(e){console.log('preview FAILED',m.id,e.message.slice(0,200));}}
 for(const s of src.skies){await pg.evaluate(u=>setSky(u),'/raw/skies/'+s.ref+'.hdr');save(s.id+'.jpg',await pg.evaluate(()=>renderSky()));console.log('sky',s.id);}
 fs.writeFileSync(path.join(HERE,'candidates_prep.json'),JSON.stringify(prep,null,1));console.log('errors',errs.slice(0,5));await b.close();})();
