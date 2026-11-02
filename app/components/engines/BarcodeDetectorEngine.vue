<script setup lang="ts">
/**
 * BarcodeDetector engine with ZXing fallback when the API is missing.
 */
import type { DecodedPayload } from '~/types/scan'
import type { ScannerEngine } from '~/types/engine'
import { getPreferredVideoStream } from '~/utils/camera'
import ZxingEngine from '~/components/engines/ZxingEngine.vue'

const props = withDefaults(defineProps<{
  facingMode?: 'environment' | 'user'
}>(), {
  facingMode: 'environment',
})

const emit = defineEmits<{
  decoded: [payload: DecodedPayload]
}>()

const videoEl = ref<HTMLVideoElement | null>(null)
const zxingRef = ref<ScannerEngine | null>(null)

const nativeSupported = import.meta.client
  && typeof window !== 'undefined'
  && 'BarcodeDetector' in window
const usingFallback = !nativeSupported

let mediaStream: MediaStream | null = null
let detector: BarcodeDetector | null = null
let rafId = 0
let handled = false
let detecting = false

async function createDetector(): Promise<BarcodeDetector> {
  const BarcodeDetectorCtor = window.BarcodeDetector
  let formats: string[] = []
  try {
    formats = await BarcodeDetectorCtor.getSupportedFormats()
  }
  catch {
    formats = []
  }

  return formats.length
    ? new BarcodeDetectorCtor({ formats })
    : new BarcodeDetectorCtor()
}

async function tick() {
  if (!detector || !videoEl.value || handled || videoEl.value.readyState < 2) {
    if (!handled) rafId = requestAnimationFrame(() => { void tick() })
    return
  }

  if (!detecting) {
    detecting = true
    try {
      const codes = await detector.detect(videoEl.value)
      const first = codes[0]
      if (first?.rawValue && !handled) {
        handled = true
        emit('decoded', {
          value: first.rawValue,
          format: first.format || 'unknown',
        })
        return
      }
    }
    catch {
      // Transient detect errors — keep looping.
    }
    finally {
      detecting = false
    }
  }

  if (!handled) {
    rafId = requestAnimationFrame(() => { void tick() })
  }
}

async function startNative() {
  if (!videoEl.value) {
    throw new Error('Video element is not ready.')
  }

  handled = false
  detector = await createDetector()
  mediaStream = await getPreferredVideoStream(props.facingMode)
  videoEl.value.srcObject = mediaStream
  await videoEl.value.play().catch(() => {})
  rafId = requestAnimationFrame(() => { void tick() })
}

function stopNative() {
  handled = true
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
  detecting = false
  detector = null

  if (mediaStream) {
    for (const track of mediaStream.getTracks()) {
      track.stop()
    }
    mediaStream = null
  }

  if (videoEl.value) {
    videoEl.value.srcObject = null
  }
}

async function decodeFileNative(file: File): Promise<DecodedPayload> {
  const activeDetector = detector ?? await createDetector()
  const bitmap = await createImageBitmap(file)

  try {
    const codes = await activeDetector.detect(bitmap)
    const first = codes[0]
    if (!first?.rawValue) {
      throw new Error('No barcode found in that image.')
    }
    return {
      value: first.rawValue,
      format: first.format || 'unknown',
    }
  }
  finally {
    bitmap.close()
  }
}

async function start() {
  if (usingFallback) {
    await nextTick()
    if (!zxingRef.value) {
      throw new Error('ZXing fallback is not ready.')
    }
    await zxingRef.value.start()
    return
  }
  await startNative()
}

function stop() {
  if (usingFallback) {
    zxingRef.value?.stop()
    return
  }
  stopNative()
}

async function decodeFile(file: File): Promise<DecodedPayload> {
  if (usingFallback) {
    await nextTick()
    if (!zxingRef.value) {
      throw new Error('ZXing fallback is not ready.')
    }
    return zxingRef.value.decodeFile(file)
  }
  return decodeFileNative(file)
}

function getStream(): MediaStream | null {
  if (usingFallback) {
    return zxingRef.value?.getStream() ?? null
  }
  return mediaStream
}

function onZxingDecoded(payload: DecodedPayload) {
  emit('decoded', payload)
}

onBeforeUnmount(() => {
  stopNative()
})

defineExpose({
  start,
  stop,
  decodeFile,
  getStream,
})
</script>

<template>
  <ZxingEngine
    v-if="usingFallback"
    ref="zxingRef"
    :facing-mode="facingMode"
    @decoded="onZxingDecoded"
  />
  <video
    v-else-if="nativeSupported"
    ref="videoEl"
    class="h-full w-full object-cover"
    playsinline
    muted
    autoplay
  />
</template>
