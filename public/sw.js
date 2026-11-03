/* Scanner service worker — Workbox via CDN.
 * Precache list is injected by scripts/pwa-precache.mjs after `nuxt generate`.
 * Do not edit the injected copy under .output. */
/* eslint-disable no-undef */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.1.0/workbox-sw.js')

workbox.setConfig({ debug: false })

workbox.core.skipWaiting()
workbox.core.clientsClaim()

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST)

workbox.precaching.cleanupOutdatedCaches()

// Icons + fonts: long-lived CacheFirst
workbox.routing.registerRoute(
  ({ request, url }) =>
    request.destination === 'font'
    || url.pathname.startsWith('/icons/')
    || /\.(?:woff2?|ttf|otf|eot)$/i.test(url.pathname),
  new workbox.strategies.CacheFirst({
    cacheName: 'scanner-icons-fonts',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 64,
        maxAgeSeconds: 60 * 60 * 24 * 365,
      }),
    ],
  }),
)

// Navigations: NetworkFirst with short timeout, fall back to cache (offline shell)
workbox.routing.registerRoute(
  ({ request }) => request.mode === 'navigate',
  new workbox.strategies.NetworkFirst({
    cacheName: 'scanner-pages',
    networkTimeoutSeconds: 3,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 32,
        maxAgeSeconds: 60 * 60 * 24 * 7,
      }),
    ],
  }),
)

// JS / CSS: StaleWhileRevalidate so updates land quietly while staying offline-capable
workbox.routing.registerRoute(
  ({ request }) =>
    request.destination === 'script'
    || request.destination === 'style'
    || /\.(?:js|css|mjs)$/i.test(new URL(request.url).pathname),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'scanner-static-assets',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 96,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  }),
)

// Images / manifests / misc same-origin assets
workbox.routing.registerRoute(
  ({ request, url }) =>
    url.origin === self.location.origin
    && (request.destination === 'image'
      || /\.(?:png|jpe?g|gif|svg|webp|ico|webmanifest)$/i.test(url.pathname)),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'scanner-images',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 64,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  }),
)
