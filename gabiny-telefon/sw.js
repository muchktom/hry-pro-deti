// Offline podpora: síť má přednost, při výpadku se použije uložená verze.
const CACHE = 'gabin-telefon-v10';
const FILES = ['./', 'index.html', 'css/style.css', 'js/art.js', 'js/audio.js', 'js/characters.js', 'js/brain.js',
  'js/pexeso.js', 'js/gamekit.js', 'js/bubbles.js', 'js/baking.js', 'js/app.js', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png',
  'apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok && new URL(e.request.url).origin === location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
