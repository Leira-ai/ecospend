const CACHE_PREFIX = "ecospend-";
const SHELL_CACHE = `${CACHE_PREFIX}shell-v2`;
const SHELL_ASSETS = ["/offline", "/icons/icon.svg", "/icons/icon-maskable.svg", "/brand-logo.svg", "/favicon.svg"];

async function clearAppCaches() {
  const keys = await caches.keys();
  await Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX)).map((key) => caches.delete(key)));
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== SHELL_CACHE).map((key) => caches.delete(key)),
  )).then(() => self.clients.claim()));
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "CLEAR_USER_CACHES") return;
  event.waitUntil(clearAppCaches().then(async () => {
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    clients.forEach((client) => client.postMessage({ type: "USER_CACHES_CLEARED" }));
  }));
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.mode !== "navigate" || request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/dashboard") || url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;
  event.respondWith(fetch(request, { cache: "no-store" }).catch(() => caches.match("/offline")));
});
