/* OICL Premium Calculator - service worker.
   Network-first: every load fetches the latest index.html from the host, so an update you publish
   reaches every user on their next open; the cached copy is used only when they are offline. */
const CACHE = 'oicl-calc-v2';
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){ return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if(url.origin !== self.location.origin) return;           // CDN scripts etc. are left to the browser
  e.respondWith(
    /* cache:'no-cache' makes the browser revalidate with the host (ETag) instead of serving its own 10-minute copy,
       so a freshly published build shows on the very next open */
    fetch(e.request, { cache: 'no-cache' }).then(function(res){
      if(res && res.ok){ const copy = res.clone(); caches.open(CACHE).then(function(c){ c.put(e.request, copy); }); }
      return res;
    }).catch(function(){ return caches.match(e.request).then(function(hit){ return hit || caches.match('./index.html'); }); })
  );
});
