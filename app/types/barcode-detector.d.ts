/** Minimal BarcodeDetector typings for browsers that ship the API. */
interface BarcodeDetectorOptions {
  formats?: string[]
}

interface DetectedBarcode {
  rawValue: string
  format: string
}

declare class BarcodeDetector {
  constructor(options?: BarcodeDetectorOptions)
  static getSupportedFormats(): Promise<string[]>
  detect(image: ImageBitmapSource): Promise<DetectedBarcode[]>
}

interface Window {
  BarcodeDetector: typeof BarcodeDetector
}

declare var BarcodeDetector: {
  prototype: BarcodeDetector
  new (options?: BarcodeDetectorOptions): BarcodeDetector
  getSupportedFormats(): Promise<string[]>
}
