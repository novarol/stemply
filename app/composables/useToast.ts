export type ToastKind = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  kind: ToastKind
  message: string
}

const toasts = ref<Toast[]>([])
const timers = new Map<string, ReturnType<typeof setTimeout>>()

function dismiss(id: string) {
  const timer = timers.get(id)
  if (timer) {
    clearTimeout(timer)
    timers.delete(id)
  }
  toasts.value = toasts.value.filter(t => t.id !== id)
}

function show(message: string, kind: ToastKind = 'info', durationMs = 3200) {
  const id = crypto.randomUUID()
  toasts.value = [...toasts.value, { id, kind, message }]

  if (durationMs > 0) {
    timers.set(id, setTimeout(() => dismiss(id), durationMs))
  }

  return id
}

export function useToast() {
  return {
    toasts: computed(() => toasts.value),
    show,
    success: (message: string, durationMs?: number) => show(message, 'success', durationMs),
    error: (message: string, durationMs?: number) => show(message, 'error', durationMs),
    info: (message: string, durationMs?: number) => show(message, 'info', durationMs),
    dismiss,
  }
}
