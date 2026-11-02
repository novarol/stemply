import type { DecodedPayload } from '~/types/scan'

/** Shared contract for ScannerShell engines (Step 5). */
export interface ScannerEngine {
  start: () => Promise<void>
  stop: () => void
  decodeFile: (file: File) => Promise<DecodedPayload>
  /** MediaStream used for live preview (for shell torch/zoom). */
  getStream: () => MediaStream | null
}
