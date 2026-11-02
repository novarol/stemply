<script setup lang="ts">
/**
 * @zxing/browser engine — DIY <video> inside ScannerShell.
 */
import { BarcodeFormat, BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import type { DecodedPayload } from '~/types/scan'

type ZxingResult = {
  getText: () => string
  getBarcodeFormat: () => BarcodeFormat
}

const props = withDefaults(defineProps<{
  facingMode?: 'environment' | 'user'
}>(), {
  facingMode: 'environment',
})

const emit = defineEmits<{
  decoded: [payload: DecodedPayload]
}>()

const videoEl = ref<HTMLVideoElement | null>(null)

const reader = shallowRef<BrowserMultiFormatReader | null>(null)
let controls: IScannerControls | null = null
let handled = false

function getReader(): BrowserMultiFormatReader {
  if (!reader.value) {
    reader.value = new BrowserMultiFormatReader()
  }
  return reader.value
}

function formatName(format: BarcodeFormat): string {
  return BarcodeFormat[format] ?? 'unknown'
}

async function start() {
  if (!import.meta.client) {
    throw Object.assign(new Error('Scanner is only available in the browser.'), { name: 'NotSupportedError' })
  }
  if (!window.isSecureContext) {
    throw Object.assign(new Error('insecure context'), { name: 'SecurityError' })
  }
  if (!videoEl.value) {
    throw new Error('Video element is not ready.')
  }

  handled = false
  const codeReader = getReader()

  const callback = (result: ZxingResult | undefined, _error: Error | undefined) => {
    if (result && !handled) {
      handled = true
      emit('decoded', {
        value: result.getText(),
        format: formatName(result.getBarcodeFormat()),
      })
    }
    // NotFoundException / empty frames are expected — ignore decode noise.
  }

  try {
    controls = await codeReader.decodeFromConstraints(
      {
        audio: false,
        video: { facingMode: { ideal: props.facingMode } },
      },
      videoEl.value,
      callback,
    )
  }
  catch (firstErr) {
    controls = await codeReader.decodeFromConstraints(
      { audio: false, video: true },
      videoEl.value,
      callback,
    ).catch(() => {
      throw firstErr
    })
  }
}

function stop() {
  handled = true
  try {
    controls?.stop()
  }
  catch {
    // ignore
  }
  controls = null

  if (videoEl.value) {
    videoEl.value.srcObject = null
  }
}

async function decodeFile(file: File): Promise<DecodedPayload> {
  const codeReader = getReader()
  const url = URL.createObjectURL(file)

  try {
    const result = await codeReader.decodeFromImageUrl(url)
    return {
      value: result.getText(),
      format: formatName(result.getBarcodeFormat()),
    }
  }
  catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(message || 'Could not decode that image with ZXing.')
  }
  finally {
    URL.revokeObjectURL(url)
  }
}

function getStream(): MediaStream | null {
  const src = videoEl.value?.srcObject
  return src instanceof MediaStream ? src : null
}

onBeforeUnmount(() => {
  stop()
})

defineExpose({
  start,
  stop,
  decodeFile,
  getStream,
})
</script>

<template>
  <video
    ref="videoEl"
    class="h-full w-full object-cover"
    playsinline
    muted
    autoplay
  />
</template>
