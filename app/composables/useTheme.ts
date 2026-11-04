export type ThemePreference = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'scanner:theme'
const THEME_COLOR_LIGHT = '#f9fafb'
const THEME_COLOR_DARK = '#111827'
const MEDIA_QUERY = '(prefers-color-scheme: dark)'

const CYCLE: ThemePreference[] = ['system', 'light', 'dark']

/** Shared client state. */
const preference = ref<ThemePreference>('system')
const resolved = ref<ResolvedTheme>('light')
let hydrated = false
let mediaQuery: MediaQueryList | null = null
let mediaListener: ((event: MediaQueryListEvent) => void) | null = null

function isPreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark'
}

function readSystem(): ResolvedTheme {
  if (!import.meta.client) return 'light'
  return window.matchMedia(MEDIA_QUERY).matches ? 'dark' : 'light'
}

function resolve(pref: ThemePreference): ResolvedTheme {
  return pref === 'system' ? readSystem() : pref
}

function readStorage(): ThemePreference {
  if (!import.meta.client) return 'system'

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return isPreference(raw) ? raw : 'system'
  }
  catch {
    return 'system'
  }
}

function applyThemeColor(value: ResolvedTheme) {
  if (!import.meta.client) return

  const content = value === 'dark' ? THEME_COLOR_DARK : THEME_COLOR_LIGHT
  let meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', content)
}

function applyDom(value: ResolvedTheme) {
  if (!import.meta.client) return
  document.documentElement.classList.toggle('dark', value === 'dark')
  document.documentElement.style.colorScheme = value
  applyThemeColor(value)
}

function persist(value: ThemePreference) {
  if (!import.meta.client) return
  try {
    localStorage.setItem(STORAGE_KEY, value)
  }
  catch {
    // Quota / private mode — preference still applies for this session.
  }
}

function onSystemChange() {
  if (preference.value !== 'system') return
  const next = resolve('system')
  resolved.value = next
  applyDom(next)
}

function stopSystemListener() {
  if (!mediaQuery || !mediaListener) return
  mediaQuery.removeEventListener('change', mediaListener)
  mediaQuery = null
  mediaListener = null
}

function startSystemListener() {
  if (!import.meta.client || mediaListener) return

  mediaQuery = window.matchMedia(MEDIA_QUERY)
  mediaListener = () => onSystemChange()
  mediaQuery.addEventListener('change', mediaListener)
}

function syncSystemListener(pref: ThemePreference) {
  if (pref === 'system') {
    startSystemListener()
  }
  else {
    stopSystemListener()
  }
}

function applyPreference(pref: ThemePreference) {
  preference.value = pref
  const next = resolve(pref)
  resolved.value = next
  applyDom(next)
  syncSystemListener(pref)
}

function hydrate() {
  if (!import.meta.client || hydrated) return

  applyPreference(readStorage())
  hydrated = true
}

export function useTheme() {
  if (import.meta.client) {
    hydrate()
  }

  function setPreference(next: ThemePreference) {
    hydrate()
    applyPreference(next)
    persist(next)
  }

  function cycle() {
    const index = CYCLE.indexOf(preference.value)
    const next = CYCLE[(index + 1) % CYCLE.length]!
    setPreference(next)
  }

  return {
    preference: computed(() => preference.value),
    theme: computed(() => resolved.value),
    setPreference,
    cycle,
  }
}
