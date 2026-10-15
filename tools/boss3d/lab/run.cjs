// usage: node lab/run.cjs <url> <view> <px> <halfSize> <grid> <out.png>
const {open}=require('../lib/browser.cjs');const fs=require('fs'),path=require('path');
(async()=>{const [url,view,px,size,grid,out]=process.argv.slice(2);const {browser,page,errors}=await open({root:path.resolve(__dirname,'..'),viewport:{width:1200,height:1200}});
await page.goto('http://boss.test/lab/lab.html');await page.waitForFunction(()=>window.ready);await page.evaluate(u=>load(u),url);
const d=await page.evaluate(a=>shot(...a),[url,view,+px,+size,+grid]);fs.writeFileSync(out,Buffer.from(d.split(',')[1],'base64'));if(errors.length)console.log(errors);await browser.close();})();
