// Network-first service worker: always tries for the latest version (so Vercel deploys show up
// straight away) and falls back to the cached copy when the gym's signal is bad.
const CACHE = "workout-v1";
const SHELL = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(
    fetch(req)
      .then(res => {
        // cache our own files plus the exercise GIFs and fonts, so visited exercises work offline
        if (res.ok || res.type === "opaque") {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}); // ignore quota errors
        }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || (req.mode === "navigate" ? caches.match("/") : undefined)))
  );
});
