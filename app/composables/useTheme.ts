export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'scanner:theme'

/** Shared client state. */
const theme = ref<Theme>('light')
let hydrated = false

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark'
}

function readStorage(): Theme {
  if (!import.meta.client) return 'light'

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return isTheme(raw) ? raw : 'light'
  }
  catch {
    return 'light'
  }
}

function applyDom(value: Theme) {
  if (!import.meta.client) return
  document.documentElement.classList.toggle('dark', value === 'dark')
  document.documentElement.style.colorScheme = value
}

function persist(value: Theme) {
  if (!import.meta.client) return
  try {
    localStorage.setItem(STORAGE_KEY, value)
  }
  catch {
    // Quota / private mode — theme still applies for this session.
  }
}

function hydrate() {
  if (!import.meta.client || hydrated) return

  const next = readStorage()
  theme.value = next
  applyDom(next)
  hydrated = true
}

export function useTheme() {
  if (import.meta.client) {
    hydrate()
  }

  function setTheme(next: Theme) {
    hydrate()
    theme.value = next
    applyDom(next)
    persist(next)
  }

  function toggle() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  return {
    theme: computed(() => theme.value),
    setTheme,
    toggle,
  }
}
