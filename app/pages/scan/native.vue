<script setup lang="ts">
import type { ScannerEngine } from '~/types/engine'

const shell = ref<{
  setEngineStream: (stream: MediaStream | null) => void
  reportStartError: (err: unknown) => void
} | null>(null)
const engine = ref<ScannerEngine | null>(null)
const usingZxingFallback = ref(false)

onMounted(() => {
  usingZxingFallback.value = !('BarcodeDetector' in window)
})

async function onStart() {
  try {
    await engine.value?.start()
    // Allow video/DOM to attach the stream before binding torch/zoom.
    await nextTick()
    shell.value?.setEngineStream(engine.value?.getStream() ?? null)
  }
  catch (err) {
    shell.value?.reportStartError(err)
  }
}

function onStop() {
  engine.value?.stop()
}

async function decodeFile(file: File) {
  if (!engine.value) {
    throw new Error('Scanner engine is not ready.')
  }
  return engine.value.decodeFile(file)
}
</script>

<template>
  <section>
    <div class="mb-6">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        <NuxtLink
          to="/"
          class="underline-offset-2 hover:underline"
        >
          ← Scan
        </NuxtLink>
      </p>
      <h1 class="mt-2 text-2xl font-semibold tracking-tight">
        BarcodeDetector
      </h1>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Native Barcode Detection API when available; falls back to ZXing otherwise.
      </p>
      <p
        v-if="usingZxingFallback"
        class="mt-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
        role="status"
      >
        BarcodeDetector is not available in this browser — using ZXing on this page.
      </p>
    </div>

    <ScannerShell
      ref="shell"
      :own-stream="false"
      :decode-file="decodeFile"
      @start="onStart"
      @stop="onStop"
    >
      <template #engine="{ onDecoded, facingMode }">
        <EnginesBarcodeDetectorEngine
          ref="engine"
          :facing-mode="facingMode"
          @decoded="onDecoded"
        />
      </template>
    </ScannerShell>
  </section>
</template>
