// Service Worker — cache để AI Explorer chạy được cả khi offline.
const CACHE = "ai-explorer-v30";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./room-loaders.js",
  "./pwa.js",
  "./sound.js",
  "./store.js",
  "./i18n.js",
  "./roomstate.js",
  "./roomquiz.js",
  "./roomtrust.js",
  "./tracks.js",
  "./analytics.js",
  "./og.png",
  "./rooms/home.js",
  "./rooms/teachable.js",
  "./rooms/neural-net.js",
  "./rooms/overfitting.js",
  "./rooms/decision-tree.js",
  "./rooms/reinforcement.js",
  "./rooms/clustering.js",
  "./rooms/tokenizer.js",
  "./rooms/embeddings.js",
  "./rooms/attention.js",
  "./rooms/next-token.js",
  "./rooms/diffusion.js",
  "./rooms/recommendation.js",
  "./rooms/bias.js",
  "./rooms/adversarial.js",
  "./rooms/turing.js",
  "./rooms/chatbot.js",
  "./rooms/rag.js",
  "./rooms/finetune.js",
  "./rooms/agents.js",
  "./rooms/multimodal.js",
  "./rooms/context-window.js",
  "./rooms/prompt-injection.js",
  "./rooms/rlhf.js",
  "./rooms/energy.js",
  "./rooms/reasoning.js",
  "./rooms/summary.js",
  "./data/embeddings.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  // Giữ worker mới ở trạng thái chờ cho tới khi người dùng đồng ý cập nhật.
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function navigationResponse(request, event) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)));
    }
    return response;
  } catch {
    return (await caches.match(request))
      || (await caches.match("./"))
      || (await caches.match("./index.html"))
      || Response.error();
  }
}

async function assetResponse(request, event) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    // Không cache 404/500 hoặc opaque response; tránh lưu lỗi lâu dài.
    if (response.ok && response.type === "basic") {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)));
    }
    return response;
  } catch {
    // Asset thiếu phải lỗi đúng loại thay vì trả index.html với MIME sai.
    return Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    request.mode === "navigate"
      ? navigationResponse(request, event)
      : assetResponse(request, event)
  );
});
