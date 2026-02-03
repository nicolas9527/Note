const CACHE_NAME = "notes-pwa-v3";
const CORE = [
  "/Note/",
  "/Note/index.html",
  "/Note/manifest.webmanifest",
  "/Note/icon.PNG",
];

// Install: cache core nhưng KHÔNG fail nếu 1 file lỗi
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(CORE.map((u) => cache.add(u)));
  })());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)));
  })());
  self.clients.claim();
});

// Fetch:
// - Trang (navigate) => ưu tiên lấy mạng để nhận index mới
// - File khác => cache-first
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("/Note/index.html", copy));
          return res;
        })
        .catch(() => caches.match("/Note/index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        const url = new URL(req.url);
        if (url.origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      });
    })
  );
});