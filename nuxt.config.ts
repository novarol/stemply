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
  app: {
    head: {
      title: 'Scanner',
      htmlAttrs: {
        lang: 'en',
      },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#111827' },
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
        { rel: 'apple-touch-icon', sizes: '167x167', href: '/icons/apple-touch-icon-167.png' },
        { rel: 'apple-touch-icon', sizes: '152x152', href: '/icons/apple-touch-icon-152.png' },
        { rel: 'apple-touch-icon', sizes: '120x120', href: '/icons/apple-touch-icon-120.png' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/icons/icon-192.png?v=2' },
        { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/icons/icon-512.png?v=2' },
      ],
      // Apply saved theme before paint to reduce FOUC (matches useTheme storage key).
      script: [
        {
          key: 'scanner-theme-init',
          textContent: `(function(){try{var t=localStorage.getItem('scanner:theme');if(t==='dark'){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark'}else{document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme='light'}}catch(e){}})();`,
        },
      ],
    },
  },
})

