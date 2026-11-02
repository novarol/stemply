<script setup lang="ts">
import type { ScanRecord } from '~/types/scan'

const props = defineProps<{
  scan: ScanRecord
}>()

const { updateNote, remove } = useScans()

const editing = ref(false)
const draft = ref('')

const canOpen = computed(() => isUrl(props.scan.value))

async function copyValue() {
  if (!import.meta.client) return
  try {
    await navigator.clipboard.writeText(props.scan.value)
  }
  catch {
    // Clipboard may be unavailable; ignore.
  }
}

function openValue() {
  if (!canOpen.value || !import.meta.client) return
  window.open(props.scan.value.trim(), '_blank', 'noopener,noreferrer')
}

function startEdit() {
  draft.value = props.scan.note
  editing.value = true
}

function saveNote() {
  updateNote(props.scan.id, draft.value.trim())
  editing.value = false
}

function cancelEdit() {
  editing.value = false
}

function deleteScan() {
  remove(props.scan.id)
}
</script>

<template>
  <div class="mt-2 space-y-2">
    <div class="flex flex-wrap gap-2 text-sm">
      <button
        type="button"
        class="rounded border border-gray-300 px-2 py-1 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
        @click="copyValue"
      >
        Copy
      </button>
      <button
        v-if="canOpen"
        type="button"
        class="rounded border border-gray-300 px-2 py-1 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
        @click="openValue"
      >
        Open
      </button>
      <button
        type="button"
        class="rounded border border-gray-300 px-2 py-1 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
        @click="editing ? cancelEdit() : startEdit()"
      >
        {{ editing ? 'Cancel' : 'Note' }}
      </button>
      <button
        type="button"
        class="rounded border border-red-300 px-2 py-1 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
        @click="deleteScan"
      >
        Delete
      </button>
    </div>

    <form
      v-if="editing"
      class="flex flex-wrap items-center gap-2"
      @submit.prevent="saveNote"
    >
      <input
        v-model="draft"
        type="text"
        placeholder="Add a note"
        class="min-w-0 flex-1 rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
        autofocus
      >
      <button
        type="submit"
        class="rounded border border-gray-300 px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
      >
        Save
      </button>
    </form>
  </div>
</template>
