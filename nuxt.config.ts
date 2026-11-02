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
      title: 'Stemply Scan',
      htmlAttrs: {
        lang: 'en',
      },
      meta: [
        { name: 'theme-color', content: '#111827' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'Stemply Scan' },
      ],
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/icons/icon-192.png' },
        { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/icons/icon-512.png' },
      ],
      // Apply saved theme before paint to reduce FOUC (matches useTheme storage key).
      script: [
        {
          key: 'stemply-theme-init',
          textContent: `(function(){try{var t=localStorage.getItem('stemply-scan:theme');if(t==='dark'){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark'}else{document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme='light'}}catch(e){}})();`,
        },
      ],
    },
  },
})

