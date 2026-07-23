// GymBro Service Worker v2.0
const CACHE_NAME = 'gymbro-v2';
const ASSETS = [
  '/Gymforge/',
  '/Gymforge/index.html',
  '/Gymforge/manifest.json',
  '/Gymforge/icons/icon-192x192.png',
  '/Gymforge/icons/icon-512x512.png',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

// Install: pre-cacha gli asset
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: elimina cache vecchie
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first per asset, network-first per navigazione
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Chart.js CDN: cache-first
  if (url.hostname.includes('jsdelivr.net')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Asset locali: cache-first con fallback network
  if (url.pathname.startsWith('/Gymforge/')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        const networkFetch = fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => cached);
        return cached || networkFetch;
      })
    );
  }
});
