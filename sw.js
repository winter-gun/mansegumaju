/* 만세구마쥬키우기 — 오프라인 캐시 (stale-while-revalidate) */
const CACHE = 'mansegumaju-v1';
const PRECACHE = [
  './',
  'index.html',
  'manual.html',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'icon-180.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(e.request, { ignoreSearch: true });
    const refresh = fetch(e.request)
      .then(res => {
        if (res && res.ok) cache.put(e.request, res.clone());
        return res;
      })
      .catch(() => null);
    if (hit) {
      e.waitUntil(refresh);
      return hit;
    }
    const net = await refresh;
    if (net) return net;
    if (e.request.mode === 'navigate') {
      const fallback = await cache.match('index.html');
      if (fallback) return fallback;
    }
    return new Response('offline', { status: 503 });
  })());
});
