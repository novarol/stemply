<script setup lang="ts">
const route = useRoute()
const { theme, toggle } = useTheme()

const isDark = computed(() => theme.value === 'dark')

const scanActive = computed(() =>
  route.path === '/' || route.path.startsWith('/scan'),
)

const historyActive = computed(() => route.path.startsWith('/history'))
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-gray-800 dark:bg-gray-900/95 dark:supports-[backdrop-filter]:bg-gray-900/80">
    <div class="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-2.5 sm:gap-4 sm:py-3">
      <div class="flex min-w-0 items-center gap-3 sm:gap-6">
        <NuxtLink
          to="/"
          class="shrink-0 text-base font-semibold tracking-tight text-gray-900 sm:text-lg dark:text-white"
        >
          Stemply Scan
        </NuxtLink>
        <nav class="flex items-center gap-1 text-sm sm:gap-4">
          <NuxtLink
            to="/"
            class="rounded-md px-2.5 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
            :class="scanActive ? 'font-medium !text-gray-900 dark:!text-white' : ''"
            :aria-current="scanActive ? 'page' : undefined"
          >
            Scan
          </NuxtLink>
          <NuxtLink
            to="/history"
            class="rounded-md px-2.5 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
            :class="historyActive ? 'font-medium !text-gray-900 dark:!text-white' : ''"
            :aria-current="historyActive ? 'page' : undefined"
          >
            History
          </NuxtLink>
        </nav>
      </div>
      <button
        type="button"
        class="min-h-10 shrink-0 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
        :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="toggle"
      >
        {{ isDark ? 'Light' : 'Dark' }}
      </button>
    </div>
  </header>
</template>
