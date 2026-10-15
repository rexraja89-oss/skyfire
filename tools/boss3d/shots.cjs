// Viewer screenshots for review: node shots.cjs -> out/shots/viewer_*.png (+ stats)
const {open}=require('./lib/browser.cjs');const fs=require('fs');
(async()=>{const {browser,page,errors}=await open({root:__dirname,viewport:{width:412,height:915},dpr:2});
 await page.goto('http://boss.test/viewer/index.html');await page.waitForFunction(()=>window.__ready,null,{timeout:60000});
 const set=async(f)=>{await page.evaluate(f);await page.waitForTimeout(700);};
 const snap=async n=>{await page.screenshot({path:`out/shots/viewer_${n}.png`});const s=await page.evaluate(()=>{const i=__viewer.R.info.render;return {calls:i.calls,tris:i.triangles};});console.log(n,JSON.stringify(s));};
 const click=async(k,v)=>{await page.evaluate(([k,v])=>document.querySelector(`.seg[data-k=${k}] button[data-v=${v}]`).click(),[k,v]);await page.waitForTimeout(600);};
 await snap('orbit_hq');
 await click('cam','game');await click('bg','magma');await snap('game_hq_magma');
 await click('bg','sky');await snap('game_hq_light');
 await click('cam','top');await click('bg','studio');await snap('top_hq');
 await click('tog','clearcoat');await click('cam','orbit');await snap('orbit_hq_clearcoat');await click('tog','clearcoat');
 await click('tog','markers');await click('tog','wire');await snap('orbit_markers_wire');await click('tog','markers');await click('tog','wire');
 await click('lod','smooth');await click('cam','game');await click('bg','magma');await snap('game_smooth_magma');
 await page.evaluate(()=>{const b=document.getElementById('bPanel');b.click();});await page.waitForTimeout(500);await snap('panel_open');
 console.log('errors',JSON.stringify(errors));await browser.close();})();
