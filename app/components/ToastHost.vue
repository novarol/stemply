<script setup lang="ts">
const { toasts, dismiss } = useToast()

const kindClass: Record<string, string> = {
  success: 'border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100',
  error: 'border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100',
  info: 'border-gray-300 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100',
}
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 px-4 pb-6"
    aria-live="polite"
  >
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="pointer-events-auto flex max-w-sm items-start gap-3 rounded-md border px-3 py-2 text-sm shadow-sm"
      :class="kindClass[toast.kind]"
      role="status"
    >
      <p class="min-w-0 flex-1 break-words">
        {{ toast.message }}
      </p>
      <button
        type="button"
        class="shrink-0 opacity-70 hover:opacity-100"
        aria-label="Dismiss"
        @click="dismiss(toast.id)"
      >
        ×
      </button>
    </div>
  </div>
</template>
