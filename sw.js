const VERSION="classforge-v9.1.0";
const SHELL=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png"];

self.addEventListener("install",event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(SHELL)));
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==VERSION).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);

  // HTML/navigation: network first so new GitHub Pages builds are picked up.
  if(event.request.mode==="navigate" || url.pathname.endsWith("/index.html")){
    event.respondWith(
      fetch(event.request,{cache:"no-store"})
        .then(resp=>{
          const copy=resp.clone();
          caches.open(VERSION).then(c=>c.put("./index.html",copy));
          return resp;
        })
        .catch(()=>caches.match("./index.html"))
    );
    return;
  }

  // App shell: cache first, then network.
  if(url.origin===location.origin){
    event.respondWith(
      caches.match(event.request).then(cached=>cached || fetch(event.request).then(resp=>{
        const copy=resp.clone();
        caches.open(VERSION).then(c=>c.put(event.request,copy));
        return resp;
      }))
    );
  }
});
