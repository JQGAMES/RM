const CACHE='rittermanager-v2';
const ASSETS=['./','./index.html','./styles.css','./app.js?v=2','./manifest.webmanifest','./assets/klausi.jpg','./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install',e=>{ self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))); });
self.addEventListener('activate',e=>{ e.waitUntil((async()=>{ await caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))); await self.clients.claim(); })()); });
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const u=new URL(e.request.url);
  if(u.hostname.endsWith('.workers.dev')) return;
  const isAppShell = u.origin===self.location.origin && (u.pathname.endsWith('/') || /\.(?:html|js|css|webmanifest)$/.test(u.pathname));
  if(isAppShell){
    e.respondWith(fetch(e.request).then(r=>{ const copy=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); return r; }).catch(()=>caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
