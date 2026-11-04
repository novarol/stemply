// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  modules: ['@nuxtjs/tailwindcss'],
  // @nuxtjs/tailwindcss registers tailwindcss/nesting; Nuxt 4 cannot load it via package exports.
  postcss: {
    plugins: {
      'tailwindcss/nesting': false,
    },
  },
  tailwindcss: {
    config: {
      darkMode: 'class',
    },
  },
  routeRules: {
    '/scan/html5': { redirect: '/' },
    '/scan/zxing': { redirect: '/' },
    '/scan/native': { redirect: '/' },
  },
  app: {
    head: {
      title: 'Scanner',
      htmlAttrs: {
        lang: 'en',
      },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#f9fafb' },
        { name: 'description', content: 'Client-only QR and barcode scanner PWA prototype' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'Scanner' },
      ],
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        // Cache-busted root icon first — Safari caches failed/old apple-touch URLs aggressively.
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon-v2.png' },
        { rel: 'apple-touch-icon', sizes: '167x167', href: '/pwa-icons/apple-touch-icon-167.png' },
        { rel: 'apple-touch-icon', sizes: '152x152', href: '/pwa-icons/apple-touch-icon-152.png' },
        { rel: 'apple-touch-icon', sizes: '120x120', href: '/pwa-icons/apple-touch-icon-120.png' },
        { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/pwa-icons/icon-32.png' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/pwa-icons/icon-192.png' },
        { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/pwa-icons/icon-512.png' },
      ],
      // Apply saved / system theme before paint to reduce FOUC (matches useTheme).
      script: [
        {
          key: 'scanner-theme-init',
          textContent: `(function(){try{var t=localStorage.getItem('scanner:theme');var dark=t==='dark'||((t!=='light')&&window.matchMedia('(prefers-color-scheme: dark)').matches);var s=dark?'dark':'light';document.documentElement.classList.toggle('dark',dark);document.documentElement.style.colorScheme=s}catch(e){}})();`,
        },
      ],
    },
  },
})

