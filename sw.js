/* OICL Premium Calculator - service worker.
   v204 cache-first with a background check: a repeat open is answered from this device's copy at once, with no wait
   on the host (network-first used to hold every open on a GitHub round trip). The same open asks the host for its copy
   in the background (an ETag check, so an unchanged page costs a few hundred bytes); when a newer build has been
   published it is stored and the page is told ('oicl-update'), which reloads by itself if nothing has been entered yet
   and otherwise offers a Reload bar. So an update shows within a second or two of the next open. A first visit and
   anything not yet cached come from the network; offline, the cached copy is used. */
const CACHE = 'oicl-calc-v3';
const PAGE = new URL('./', self.location).href;               // every open of the calculator shares this one cache entry
const LIBS = ['./lib/jspdf-2.5.1.umd.min.js', './lib/pako-2.1.0.min.js', './lib/upng-2.1.0.js'];

self.addEventListener('install', function(e){
  self.skipWaiting();
  /* Precache the page and its libraries so the next open is served locally even if this visit fetched them before
     the worker took control. A failed fetch (offline) just leaves that entry to be filled on a later visit. */
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.all([PAGE].concat(LIBS).map(function(u){
      return fetch(u, { cache: 'no-cache' }).then(function(res){ if(res.ok) return c.put(u, res); }).catch(function(){});
    }));
  }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){ return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); }));
});

function isPage(req, url){
  const scope = new URL(PAGE).pathname;
  return req.mode === 'navigate' && (url.pathname === scope || url.pathname === scope + 'index.html');
}
/* GitHub Pages sends an ETag (and Last-Modified); a different one means a new build was published. */
function changed(oldRes, newRes){
  const a = oldRes.headers.get('etag') || oldRes.headers.get('last-modified');
  const b = newRes.headers.get('etag') || newRes.headers.get('last-modified');
  return !!(a && b && a !== b);
}
/* The page's window may not exist yet when the check finishes, so look for it for up to 15 s. */
function tellPage(clientId){
  let tries = 0;
  return (function look(){
    const find = clientId ? self.clients.get(clientId) : Promise.resolve(null);
    return find.then(function(client){
      if(client){ client.postMessage({ type: 'oicl-update' }); return; }
      if(++tries < 60) return new Promise(function(r){ setTimeout(r, 250); }).then(look);
      return self.clients.matchAll({ type: 'window' }).then(function(all){ all.forEach(function(w){ w.postMessage({ type: 'oicl-update' }); }); });
    });
  })();
}

self.addEventListener('fetch', function(e){
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return;           // CDN scripts etc. are left to the browser
  const page = isPage(req, url);
  const key = page ? PAGE : req;
  e.respondWith(caches.open(CACHE).then(function(c){
    return c.match(key).then(function(hit){
      /* cache:'no-cache' makes the browser revalidate with the host (ETag) instead of trusting its own 10-minute copy */
      const net = fetch(page ? PAGE : req, { cache: 'no-cache' }).then(function(res){
        if(res && res.status === 200 && res.type === 'basic'){
          const fresh = !!(hit && page && changed(hit, res));
          /* store without holding the response back (a first visit streams as before); tell the page only once stored */
          e.waitUntil(c.put(key, res.clone()).then(function(){ if(fresh) return tellPage(e.resultingClientId); }).catch(function(){}));
        }
        return res;
      });
      if(hit){ e.waitUntil(net.catch(function(){})); return hit; }
      return net;
    });
  }));
});
