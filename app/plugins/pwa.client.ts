/**
 * Register the Workbox service worker and silently reload once when a new SW takes control.
 *
 * Service workers (and getUserMedia / camera) require a secure context: HTTPS, or
 * localhost / 127.0.0.1 during development. Plain HTTP on a LAN IP will not register.
 */
export default defineNuxtPlugin(() => {
  if (!('serviceWorker' in navigator)) return

  // Only auto-reload on *updates*. First install claims the client without a prior controller.
  const hadControllerOnLoad = Boolean(navigator.serviceWorker.controller)
  let refreshing = false

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadControllerOnLoad || refreshing) return
    refreshing = true
    window.location.reload()
  })

  const register = () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[pwa] service worker registration failed', err)
    })
  }

  // Nuxt client plugins often run after `window` `load` on SPA builds; waiting
  // only for `load` would skip registration entirely and break offline.
  if (document.readyState === 'complete') {
    register()
  } else {
    window.addEventListener('load', register, { once: true })
  }
})
