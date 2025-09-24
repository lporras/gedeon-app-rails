// Simple service worker scoped to /app/
// Caches core assets and serves them offline. Adjust as needed.
const VERSION = 'v1';
const CACHE_NAME = `app-cache-${VERSION}`;
const CORE_ASSETS = [
  '/app/',
  // Add additional core assets if needed, e.g. CSS/JS paths under /assets or /app
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Only handle GET requests under our scope
  if (request.method !== 'GET' || !request.url.includes('/app/')) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((resp) => {
          const respClone = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, respClone)).catch(() => {});
          return resp;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
