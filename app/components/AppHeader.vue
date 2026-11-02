<script setup lang="ts">
const isDark = ref(false)

onMounted(() => {
  isDark.value = document.documentElement.classList.contains('dark')
})

function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
}
</script>

<template>
  <header class="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
    <div class="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
      <div class="flex items-center gap-6">
        <NuxtLink
          to="/"
          class="text-lg font-semibold tracking-tight text-gray-900 dark:text-white"
        >
          Stemply Scan
        </NuxtLink>
        <nav class="flex items-center gap-4 text-sm">
          <NuxtLink
            to="/"
            class="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            active-class="!text-gray-900 font-medium dark:!text-white"
          >
            Scan
          </NuxtLink>
          <NuxtLink
            to="/history"
            class="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            active-class="!text-gray-900 font-medium dark:!text-white"
          >
            History
          </NuxtLink>
        </nav>
      </div>
      <button
        type="button"
        class="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
        :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="toggleTheme"
      >
        {{ isDark ? 'Light' : 'Dark' }}
      </button>
    </div>
  </header>
</template>
