/* Never cache authenticated API responses, chats, credentials or invitations. */
const CACHE='aevori-offline-v3';
const PUBLIC_FILES=['/offline.html','/brand/aevori-192.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PUBLIC_FILES))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('aevori-offline-')&&key!==CACHE).map(key=>caches.delete(key))))));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/')||url.pathname.startsWith('/peer/'))return;
 if(event.request.mode==='navigate')event.respondWith(fetch(event.request).catch(()=>caches.match('/offline.html')));
 else if(PUBLIC_FILES.includes(url.pathname))event.respondWith(fetch(event.request).catch(()=>caches.match(url.pathname)));
});
