// Offline support. The page and the game scripts (js/) are network-first so updates land on the next launch
// and index.html never runs with stale scripts; icons and fonts are cache-first. Bump CACHE when the cached file list changes.
const CACHE='skyfire-v5';
const THREE_URL='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const CORE=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE).then(()=>c.add(new Request(THREE_URL,{mode:'cors'})).catch(()=>{}))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.pathname.endsWith('version.json'))return;
  if(r.mode==='navigate'||u.pathname.endsWith('.html')||(u.origin===self.location.origin&&u.pathname.endsWith('.js'))){
    e.respondWith(fetch(r).then(res=>{const c=res.clone();caches.open(CACHE).then(x=>x.put(r,c));return res;})
      .catch(()=>caches.match(r,{ignoreSearch:u.pathname.endsWith('.js')}).then(m=>m||(r.mode==='navigate'||u.pathname.endsWith('.html')?caches.match('./index.html'):Response.error()))));
    return;
  }
  e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{
    if(res.ok||res.type==='opaque'){const c=res.clone();caches.open(CACHE).then(x=>x.put(r,c));}
    return res;
  })));
});
