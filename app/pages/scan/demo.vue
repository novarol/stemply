<script setup lang="ts">
/**
 * Temporary Step 4 stub — delete when Step 5 engines land.
 * Verifies Start/Stop, overlay, upload → decodeFile, success path, guided errors.
 */
import type { DecodedPayload } from '~/types/scan'

const shell = ref<{ simulateError: (kind: 'permission' | 'no-camera' | 'insecure' | 'generic') => void } | null>(null)

async function stubDecodeFile(file: File): Promise<DecodedPayload> {
  // Pretend we decoded the filename as a QR payload.
  await new Promise(r => setTimeout(r, 150))
  return {
    value: `stub://upload/${file.name}`,
    format: 'stub-qr',
  }
}

function fakeLiveDecode(onDecoded: (payload: DecodedPayload) => void) {
  onDecoded({
    value: `stub://live/${Date.now()}`,
    format: 'stub-qr',
  })
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
        Scanner shell demo
      </h1>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Stub engine only — no real QR libraries. Delete this page in Step 5.
      </p>
    </div>

    <ScannerShell
      ref="shell"
      :own-stream="true"
      :decode-file="stubDecodeFile"
    >
      <template #engine="{ running, onDecoded }">
        <div
          v-if="running"
          class="absolute inset-x-0 bottom-4 z-10 flex justify-center"
        >
          <button
            type="button"
            class="rounded-md bg-white/90 px-3 py-1.5 text-sm font-medium text-gray-900 shadow hover:bg-white"
            @click="fakeLiveDecode(onDecoded)"
          >
            Fake decode
          </button>
        </div>
      </template>
    </ScannerShell>

    <div class="mt-6 space-y-2">
      <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
        Simulate guided errors
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
          @click="shell?.simulateError('permission')"
        >
          Permission denied
        </button>
        <button
          type="button"
          class="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
          @click="shell?.simulateError('no-camera')"
        >
          No camera
        </button>
        <button
          type="button"
          class="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
          @click="shell?.simulateError('insecure')"
        >
          Insecure context
        </button>
        <button
          type="button"
          class="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
          @click="shell?.simulateError('generic')"
        >
          Generic failure
        </button>
      </div>
    </div>
  </section>
</template>
