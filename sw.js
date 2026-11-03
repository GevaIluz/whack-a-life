/* Whack-a-Life Service Worker — offline support & instant auto-update */
const CACHE_NAME = "whack-a-life-shell-v5";
const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./icons.js",
  "./themes.js",
  "./park.js",
  "./seeds.js",
  "./app.js",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => Promise.all(SHELL_ASSETS.map((u) => fetch(u, { cache: "no-cache" }).then((r) => (r.ok ? cache.put(u, r) : null)).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Never cache GitHub API (Gist sync), version.json, or translation API calls
  if (
    url.hostname === "api.github.com" ||
    url.hostname.includes("mymemory.translated.net") ||
    url.pathname.endsWith("/version.json")
  ) {
    return;
  }

  // Google Fonts: Cache-first, falling back to network (fonts rarely change)
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(
      caches.match(req).then((cached) =>
        cached ||
        fetch(req).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, clone));
          return res;
        })
      )
    );
    return;
  }

  // Same-origin app shell: Network-first with cache: "no-cache" so deployed updates apply immediately when online
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req, { cache: "no-cache" })
        .then((res) => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, clone));
          }
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("./index.html")))
    );
  }
});
