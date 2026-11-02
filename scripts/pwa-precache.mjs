/**
 * Inject a Workbox precache manifest into .output/public/sw.js after `nuxt generate`.
 * Source template: public/sw.js (self.__WB_MANIFEST placeholder).
 */
import { injectManifest } from 'workbox-build'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const globDirectory = resolve(root, '.output/public')
const swSrc = resolve(root, 'public/sw.js')
const swDest = resolve(globDirectory, 'sw.js')

if (!existsSync(globDirectory)) {
  console.error('[pwa-precache] Missing .output/public — run `nuxt generate` first.')
  process.exit(1)
}

if (!existsSync(swSrc)) {
  console.error('[pwa-precache] Missing public/sw.js')
  process.exit(1)
}

const { count, size, warnings } = await injectManifest({
  globDirectory,
  globPatterns: [
    '**/*.{js,css,html,ico,png,svg,webp,woff,woff2,ttf,otf,webmanifest,json}',
  ],
  globIgnores: ['sw.js', 'workbox-*.js'],
  swSrc,
  swDest,
  // Keep classic SW + CDN importScripts; do not transpile to modules.
  injectionPoint: 'self.__WB_MANIFEST',
})

for (const warning of warnings) {
  console.warn('[pwa-precache]', warning)
}

console.log(
  `[pwa-precache] Injected ${count} files (${(size / 1024).toFixed(1)} KiB) into ${swDest}`,
)
