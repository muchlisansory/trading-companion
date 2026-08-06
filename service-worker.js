const CACHE_NAME = "trading-companion-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Khusus untuk index.html / navigasi halaman: coba ambil versi TERBARU
  // dari internet dulu (network-first), supaya update kode selalu langsung
  // kepakai begitu online -- tidak perlu nunggu service worker ganti versi.
  // Salinan hasil fetch disimpan lagi ke cache, supaya kalau nanti offline
  // masih ada cadangan untuk dipakai.
  if (event.request.mode === "navigate" || event.request.destination === "document") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Aset lain (icon, manifest, dll) tetap cache-first seperti semula --
  // jarang berubah, jadi lebih hemat kuota & lebih cepat dimuat.
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
