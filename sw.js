/* sw.js — very small offline-first cache */
const CACHE_NAME = 'the-generator-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './thegenerator_final.html',
  './pwa-icons/icon-192.png',
  './pwa-icons/icon-512.png'
];

// 安裝：預先快取
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// 啟用：清舊版快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k === CACHE_NAME ? null : caches.delete(k))))
    )
  );
  self.clients.claim();
});

// 取用：Cache, then Network fallback，離線再給 index.html
self.addEventListener('fetch', (event) => {
  const req = event.request;
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((resp) => {
        // 只快取 GET 且成功的回應
        if (req.method === 'GET' && resp && resp.status === 200 && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, clone));
        }
        return resp;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
