<script setup lang="ts">
const engines = [
  {
    to: '/scan/html5',
    title: 'html5-qrcode',
    description: 'Popular JS scanner with built-in camera and file helpers.',
  },
  {
    to: '/scan/zxing',
    title: 'ZXing',
    description: 'BrowserMultiFormatReader with a DIY video element.',
  },
  {
    to: '/scan/native',
    title: 'BarcodeDetector',
    description: 'Native API when supported; ZXing fallback otherwise.',
  },
] as const
</script>

<template>
  <section>
    <h1 class="text-2xl font-semibold tracking-tight">
      Scan
    </h1>
    <p class="mt-2 text-gray-600 dark:text-gray-400">
      Pick a scanner engine to compare live and image decode on this device.
    </p>

    <ul class="mt-6 space-y-3">
      <li
        v-for="engine in engines"
        :key="engine.to"
      >
        <NuxtLink
          :to="engine.to"
          class="block rounded-lg border border-gray-200 bg-white px-4 py-4 transition hover:border-gray-400 active:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-600 dark:active:bg-gray-800"
        >
          <span class="font-medium text-gray-900 dark:text-gray-100">
            {{ engine.title }}
          </span>
          <span class="mt-1 block text-sm text-gray-600 dark:text-gray-400">
            {{ engine.description }}
          </span>
        </NuxtLink>
      </li>
    </ul>

    <div class="mt-8">
      <div class="mb-3 flex items-baseline justify-between gap-3">
        <h2 class="text-lg font-medium tracking-tight">
          Recent
        </h2>
        <NuxtLink
          to="/history"
          class="text-sm text-gray-600 underline-offset-2 hover:underline dark:text-gray-400"
        >
          View all
        </NuxtLink>
      </div>
      <RecentScansList :limit="5" />
    </div>
  </section>
</template>
