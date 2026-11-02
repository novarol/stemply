<script setup lang="ts">
const { list, add, updateNote, remove, clearAll } = useScans()
const isDev = import.meta.dev

/** Tiny Step 2 smoke stub — remove when History UI lands. */
function smokeAdd() {
  const record = add(`https://example.com/scan-${list.value.length + 1}`, 'qr', '')
  console.info('[useScans] added', record, 'isUrl?', isUrl(record.value))
}

function smokeNote() {
  const first = list.value[0]
  if (!first) return
  updateNote(first.id, `note @ ${new Date().toLocaleTimeString()}`)
}

function smokeRemove() {
  const first = list.value[0]
  if (!first) return
  remove(first.id)
}
</script>

<template>
  <section>
    <h1 class="text-2xl font-semibold tracking-tight">
      Scan
    </h1>
    <p class="mt-2 text-gray-600 dark:text-gray-400">
      Camera scanner and engine selector will live here in a later step.
    </p>

    <div
      v-if="isDev"
      class="mt-6 space-y-3 rounded-md border border-dashed border-gray-300 p-3 text-sm dark:border-gray-700"
    >
      <p class="font-medium text-gray-700 dark:text-gray-300">
        Dev: useScans smoke ({{ list.length }} / 50)
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded border border-gray-300 px-2 py-1 dark:border-gray-600"
          @click="smokeAdd"
        >
          Add
        </button>
        <button
          type="button"
          class="rounded border border-gray-300 px-2 py-1 dark:border-gray-600"
          @click="smokeNote"
        >
          Note first
        </button>
        <button
          type="button"
          class="rounded border border-gray-300 px-2 py-1 dark:border-gray-600"
          @click="smokeRemove"
        >
          Remove first
        </button>
        <button
          type="button"
          class="rounded border border-gray-300 px-2 py-1 dark:border-gray-600"
          @click="clearAll"
        >
          Clear all
        </button>
      </div>
      <ul
        v-if="list.length"
        class="max-h-40 space-y-1 overflow-auto font-mono text-xs text-gray-600 dark:text-gray-400"
      >
        <li
          v-for="scan in list.slice(0, 5)"
          :key="scan.id"
        >
          {{ scan.value }} · {{ scan.note || '—' }}
        </li>
      </ul>
    </div>
  </section>
</template>
