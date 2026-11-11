// Service Worker for Perfect Downloader PWA
// Privacy guarantee: NEVER caches private downloads, media files, or job results!

const CACHE_NAME = 'pd-shell-v1';
const STATIC_SHELL = ['/', '/manifest.json', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Strictly skip all API requests, temporary downloads, or file transfers
  if (url.pathname.startsWith('/api/') || event.request.method !== 'GET') {
    return;
  }

  // Network first with cache fallback for static shell
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
