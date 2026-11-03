import type { ScanRecord } from '~/types/scan'

const STORAGE_KEY = 'scanner:v1'
const MAX_SCANS = 50

/** Shared client state — newest-first. */
const scans = ref<ScanRecord[]>([])
let hydrated = false

function readStorage(): ScanRecord[] {
  if (!import.meta.client) return []

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter(isScanRecord).slice(0, MAX_SCANS)
  }
  catch {
    return []
  }
}

function isScanRecord(value: unknown): value is ScanRecord {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    typeof record.id === 'string'
    && typeof record.value === 'string'
    && typeof record.format === 'string'
    && typeof record.scannedAt === 'string'
    && typeof record.note === 'string'
  )
}

function persist() {
  if (!import.meta.client) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scans.value))
}

function hydrate() {
  if (!import.meta.client || hydrated) return
  scans.value = readStorage()
  hydrated = true
}

export function useScans() {
  if (import.meta.client) {
    hydrate()
  }

  /** Newest-first list (same order as storage). */
  const list = computed(() => scans.value)

  function add(value: string, format: string, note = ''): ScanRecord {
    hydrate()

    const record: ScanRecord = {
      id: crypto.randomUUID(),
      value,
      format,
      scannedAt: new Date().toISOString(),
      note,
    }

    // Always append a new record (no dedup); keep newest first; drop oldest on overflow.
    scans.value = [record, ...scans.value].slice(0, MAX_SCANS)
    persist()
    return record
  }

  function updateNote(id: string, note: string) {
    hydrate()

    const index = scans.value.findIndex(scan => scan.id === id)
    if (index === -1) return

    const next = [...scans.value]
    next[index] = { ...next[index], note }
    scans.value = next
    persist()
  }

  function remove(id: string) {
    hydrate()
    scans.value = scans.value.filter(scan => scan.id !== id)
    persist()
  }

  function clearAll() {
    hydrate()
    scans.value = []
    persist()
  }

  return {
    list,
    add,
    updateNote,
    remove,
    clearAll,
  }
}
