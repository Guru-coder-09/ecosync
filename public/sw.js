// public/sw.js
// EcoSync Service Worker — offline caching and background sync strategy.
// vite-plugin-pwa generates a more comprehensive SW; this is a fallback/reference.

const CACHE_NAME = "ecosync-v1";
const STATIC_ASSETS = [
  "/",
  "/scanner",
  "/manifest.json",
];

// ── Install: pre-cache static shell ──────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: Network-first for API, Cache-first for assets ──────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and supabase realtime (WebSocket)
  if (request.method !== "GET") return;
  if (url.protocol === "wss:" || url.protocol === "ws:") return;

  // Supabase Edge Function: get-public-key → cache first (changes rarely)
  if (url.pathname.includes("/functions/v1/get-public-key")) {
    event.respondWith(
      caches.open("ecosync-pubkey-v1").then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  // Supabase REST API → network first, don't cache
  if (url.hostname.includes("supabase.co") || url.hostname.includes("supabase.in")) {
    return; // let browser handle normally
  }

  // OpenStreetMap tiles → cache first
  if (url.hostname.includes("tile.openstreetmap.org")) {
    event.respondWith(
      caches.open("ecosync-tiles-v1").then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch {
          return cached ?? new Response("Tile unavailable offline", { status: 503 });
        }
      })
    );
    return;
  }

  // Static assets → stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);

      return cached ?? fetchPromise;
    })
  );
});

// ── Push Notifications (emergency broadcasts) ─────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title ?? "EcoSync Alert", {
      body: data.body ?? "A zone status has changed.",
      icon: "/manifest.json",
      badge: "/manifest.json",
      tag: data.tag ?? "ecosync-alert",
      requireInteraction: data.urgent ?? false,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow(event.notification.data?.url ?? "/authority")
  );
});
