<script setup lang="ts">
const props = defineProps<{
  /** Omit to show the full list. */
  limit?: number
}>()

const { list } = useScans()

const items = computed(() =>
  props.limit == null ? list.value : list.value.slice(0, props.limit),
)

function formatTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso

  const diffMs = date.getTime() - Date.now()
  const absSec = Math.round(Math.abs(diffMs) / 1000)

  if (absSec < 60) return 'just now'

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  const absMin = Math.round(absSec / 60)
  if (absMin < 60) return rtf.format(Math.sign(diffMs) * absMin, 'minute')

  const absHr = Math.round(absMin / 60)
  if (absHr < 24) return rtf.format(Math.sign(diffMs) * absHr, 'hour')

  const absDay = Math.round(absHr / 24)
  if (absDay < 7) return rtf.format(Math.sign(diffMs) * absDay, 'day')

  return date.toLocaleString()
}
</script>

<template>
  <p
    v-if="!items.length"
    class="text-sm text-gray-600 dark:text-gray-400"
  >
    No scans yet.
  </p>

  <ul
    v-else
    class="divide-y divide-gray-200 dark:divide-gray-800"
  >
    <li
      v-for="scan in items"
      :key="scan.id"
      class="py-3 first:pt-0 last:pb-0"
    >
      <div class="min-w-0">
        <p class="break-all font-medium text-gray-900 dark:text-gray-100">
          {{ scan.value }}
        </p>
        <p class="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
          <span>{{ scan.format }}</span>
          <span aria-hidden="true"> · </span>
          <time :datetime="scan.scannedAt">{{ formatTime(scan.scannedAt) }}</time>
        </p>
        <p
          v-if="scan.note"
          class="mt-1 text-sm text-gray-700 dark:text-gray-300"
        >
          {{ scan.note }}
        </p>
      </div>
      <ScanItemActions :scan="scan" />
    </li>
  </ul>
</template>
