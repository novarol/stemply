export interface ScanRecord {
  id: string
  value: string
  format: string
  scannedAt: string // ISO
  note: string
}

/** Result from a live or file decode (engine → shell). */
export interface DecodedPayload {
  value: string
  format: string
}
