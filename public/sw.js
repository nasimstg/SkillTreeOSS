const CACHE_NAME = 'skilltree-v1'
const OFFLINE_URL = '/'

// ── Install: pre-cache the root shell ──────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL))
  )
  self.skipWaiting()
})

// ── Activate: delete stale caches ──────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  )
})

// ── Fetch: tiered caching strategy ─────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle GET requests from the same origin
  if (request.method !== 'GET') return
  if (url.origin !== self.location.origin) return

  // Skip Next.js data fetching and API routes — always go network
  if (
    url.pathname.startsWith('/_next/data/') ||
    url.pathname.startsWith('/api/')
  ) return

  // Static assets (hashed filenames) → cache-first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/assets/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((c) => c.put(request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // Navigation (HTML pages) → network-first, fall back to cache, then offline shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((c) => c.put(request, clone))
          }
          return response
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match(OFFLINE_URL))
        )
    )
  }
})
