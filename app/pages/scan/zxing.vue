<script setup lang="ts">
import type { ScannerEngine } from '~/types/engine'

const shell = ref<{
  setEngineStream: (stream: MediaStream | null) => void
  reportStartError: (err: unknown) => void
} | null>(null)
const engine = ref<ScannerEngine | null>(null)

async function onStart() {
  try {
    await engine.value?.start()
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
        ZXing
      </h1>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        BrowserMultiFormatReader from @zxing/browser with a DIY video preview.
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
        <EnginesZxingEngine
          ref="engine"
          :facing-mode="facingMode"
          @decoded="onDecoded"
        />
      </template>
    </ScannerShell>
  </section>
</template>
