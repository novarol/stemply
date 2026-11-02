<script setup lang="ts">
const { list, clearAll } = useScans()

function onClearAll() {
  if (!list.value.length) return
  if (!confirm('Clear all scans? This cannot be undone.')) return
  clearAll()
}
</script>

<template>
  <section>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-semibold tracking-tight">
        History
      </h1>
      <button
        v-if="list.length"
        type="button"
        class="min-h-10 rounded border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
        @click="onClearAll"
      >
        Clear all
      </button>
    </div>

    <div class="mt-6">
      <RecentScansList />
    </div>
  </section>
</template>
