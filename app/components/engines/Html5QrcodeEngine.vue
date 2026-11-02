<script setup lang="ts">
/**
 * html5-qrcode engine — owns its camera stream inside a reader element.
 */
import { Html5Qrcode } from 'html5-qrcode'
import type { Html5QrcodeResult } from 'html5-qrcode'
import type { DecodedPayload } from '~/types/scan'

const props = withDefaults(defineProps<{
  facingMode?: 'environment' | 'user'
}>(), {
  facingMode: 'environment',
})

const emit = defineEmits<{
  decoded: [payload: DecodedPayload]
}>()

const readerId = `html5-reader-${useId().replace(/\W/g, '')}`
const readerEl = ref<HTMLElement | null>(null)

let scanner: Html5Qrcode | null = null
let handled = false
let mediaStream: MediaStream | null = null

function formatFromResult(result: Html5QrcodeResult): string {
  return result.result.format?.formatName ?? 'unknown'
}

function syncStreamFromDom() {
  const video = readerEl.value?.querySelector('video') ?? null
  mediaStream = (video?.srcObject as MediaStream | null) ?? null
}

async function ensureScanner(): Promise<Html5Qrcode> {
  if (!import.meta.client) {
    throw Object.assign(new Error('Scanner is only available in the browser.'), { name: 'NotSupportedError' })
  }
  if (!readerEl.value) {
    throw new Error('Scanner mount point is not ready.')
  }
  if (!scanner) {
    scanner = new Html5Qrcode(readerId, { verbose: false })
  }
  return scanner
}

async function start() {
  const instance = await ensureScanner()
  handled = false

  const onSuccess = (decodedText: string, result: Html5QrcodeResult) => {
    if (handled) return
    handled = true
    emit('decoded', {
      value: decodedText,
      format: formatFromResult(result),
    })
  }

  const config = { fps: 10 }
  const onError = () => {}

  try {
    await instance.start({ facingMode: props.facingMode }, config, onSuccess, onError)
  }
  catch (firstErr) {
    // Desktop webcams often reject facingMode — fall back to first camera id.
    const cameras = await Html5Qrcode.getCameras().catch(() => [])
    if (!cameras.length) throw firstErr
    await instance.start(cameras[0]!.id, config, onSuccess, onError)
  }

  await nextTick()
  syncStreamFromDom()
}

async function stop() {
  mediaStream = null
  if (!scanner) return

  try {
    if (scanner.isScanning) {
      await scanner.stop()
    }
  }
  catch {
    // Already stopped or never fully started.
  }

  try {
    scanner.clear()
  }
  catch {
    // Element may already be empty.
  }
}

async function decodeFile(file: File): Promise<DecodedPayload> {
  if (scanner?.isScanning) {
    await stop()
  }

  const instance = await ensureScanner()

  try {
    const result = await instance.scanFileV2(file, /* showImage */ false)
    return {
      value: result.decodedText,
      format: formatFromResult(result),
    }
  }
  catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(message || 'Could not decode that image with html5-qrcode.')
  }
  finally {
    try {
      instance.clear()
    }
    catch {
      // ignore
    }
  }
}

function getStream(): MediaStream | null {
  if (!mediaStream) syncStreamFromDom()
  return mediaStream
}

onBeforeUnmount(() => {
  void stop()
  scanner = null
})

defineExpose({
  start,
  stop,
  decodeFile,
  getStream,
})
</script>

<template>
  <div
    :id="readerId"
    ref="readerEl"
    class="html5-engine h-full w-full"
  />
</template>

<style scoped>
.html5-engine :deep(video) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.html5-engine :deep(img) {
  display: none;
}
</style>
