// Service Worker — cache để AI Explorer chạy được cả khi offline.
const CACHE = "ai-explorer-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./fx.js",
  "./sound.js",
  "./store.js",
  "./og.png",
  "./rooms/home.js",
  "./rooms/teachable.js",
  "./rooms/neural-net.js",
  "./rooms/overfitting.js",
  "./rooms/decision-tree.js",
  "./rooms/reinforcement.js",
  "./rooms/tokenizer.js",
  "./rooms/embeddings.js",
  "./rooms/attention.js",
  "./rooms/next-token.js",
  "./rooms/diffusion.js",
  "./rooms/bias.js",
  "./rooms/chatbot.js",
  "./rooms/summary.js",
  "./data/embeddings.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// cache-first cho asset nội bộ, network cho phần còn lại (vd: Google Fonts)
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then((hit) =>
        hit || fetch(e.request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        }).catch(() => caches.match("./index.html"))
      )
    );
  }
});
