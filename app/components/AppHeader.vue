<script setup lang="ts">
import type { ThemePreference } from '~/composables/useTheme'

const route = useRoute()
const { preference, cycle } = useTheme()

const preferenceLabel = computed(() => {
  if (preference.value === 'system') return 'System'
  if (preference.value === 'dark') return 'Dark'
  return 'Light'
})

const nextPreferenceLabel = computed(() => {
  if (preference.value === 'system') return 'light'
  if (preference.value === 'light') return 'dark'
  return 'system'
})

const scanActive = computed(() => route.path === '/')

const historyActive = computed(() => route.path.startsWith('/history'))

function isSelected(value: ThemePreference) {
  return preference.value === value
}

const slotClass = (value: ThemePreference) => [
  'flex h-8 w-8 items-center justify-center rounded',
  isSelected(value)
    ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
    : 'text-gray-400 dark:text-gray-500',
]
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-gray-800 dark:bg-gray-900/95 dark:supports-[backdrop-filter]:bg-gray-900/80">
    <div class="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-2.5 sm:gap-4 sm:py-3">
      <div class="flex min-w-0 items-center gap-3 sm:gap-6">
        <NuxtLink
          to="/"
          class="shrink-0 text-base font-semibold tracking-tight text-gray-900 sm:text-lg dark:text-white"
        >
          Scanner
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
        class="flex shrink-0 items-center rounded-md border border-gray-300 p-0.5 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800/60"
        :aria-label="`Theme: ${preferenceLabel}. Switch to ${nextPreferenceLabel} mode`"
        @click="cycle"
      >
        <span
          aria-hidden="true"
          :class="slotClass('light')"
        >
          <svg
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="M4.93 4.93l1.41 1.41" />
            <path d="M17.66 17.66l1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="M4.93 19.07l1.41-1.41" />
            <path d="M17.66 6.34l1.41-1.41" />
          </svg>
        </span>
        <span
          aria-hidden="true"
          :class="slotClass('system')"
        >
          <svg
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8" />
            <path d="M12 17v4" />
          </svg>
        </span>
        <span
          aria-hidden="true"
          :class="slotClass('dark')"
        >
          <svg
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 14.3A9 9 0 1 1 9.7 3 7 7 0 0 0 21 14.3z" />
          </svg>
        </span>
      </button>
    </div>
  </header>
</template>
