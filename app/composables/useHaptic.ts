/** Light haptic feedback via Vibration API when available. */
export function useHaptic() {
  function vibrate(pattern: VibratePattern = 40) {
    if (!import.meta.client) return
    try {
      navigator.vibrate?.(pattern)
    }
    catch {
      // Unsupported or blocked — ignore.
    }
  }

  return {
    vibrate,
    /** Short pulse for a successful scan. */
    success: () => vibrate(50),
    /** Brief double pulse for errors. */
    error: () => vibrate([40, 60, 40]),
  }
}
