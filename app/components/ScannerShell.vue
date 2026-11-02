<script setup lang="ts">
/**
 * ScannerShell — shared chrome for Step 5 engines.
 *
 * Engine contract (slot / parent implements):
 * - start(): Promise<void> | void — begin live scanning (when ownStream=false)
 * - stop(): void — halt live scanning
 * - decodeFile(file: File): Promise<{ value: string; format: string }>
 * - emit decoded({ value: string; format: string }) — or call slot onDecoded
 *
 * When ownStream is true (default for the Step 4 stub), this shell owns
 * getUserMedia (facingMode: environment preferred) and exposes the stream /
 * video via slot props. Real engines should set own-stream=false and honor
 * the facingMode prop / start event themselves.
 */
import type { DecodedPayload } from '~/types/scan'

const props = withDefaults(defineProps<{
  /** Shell manages getUserMedia + <video>. Set false when the engine owns the camera. */
  ownStream?: boolean
  /** Preferred camera facing; engines should honor this when they own the stream. */
  facingMode?: 'environment' | 'user'
  /** Optional recent strip under the controls. */
  showRecent?: boolean
  /**
   * Engine-provided file decoder. Required for the upload path when the
   * engine lives outside the slot (pages can also listen to decode-file).
   */
  decodeFile?: (file: File) => Promise<DecodedPayload>
}>(), {
  ownStream: true,
  facingMode: 'environment',
  showRecent: true,
})

const emit = defineEmits<{
  start: []
  stop: []
  'decode-file': [file: File]
  decoded: [payload: DecodedPayload]
}>()

const { add } = useScans()
const toast = useToast()
const haptic = useHaptic()

const running = ref(false)
const starting = ref(false)
const errorMessage = ref<string | null>(null)
const videoEl = ref<HTMLVideoElement | null>(null)
const fileInputEl = ref<HTMLInputElement | null>(null)
const mediaStream = ref<MediaStream | null>(null)

const torchSupported = ref(false)
const torchOn = ref(false)
const zoomSupported = ref(false)
const zoomMin = ref(1)
const zoomMax = ref(1)
const zoomStep = ref(0.1)
const zoomValue = ref(1)

const slotProps = computed(() => ({
  running: running.value,
  stream: mediaStream.value,
  videoEl: videoEl.value,
  facingMode: props.facingMode,
  onDecoded: handleDecoded,
  errorMessage: errorMessage.value,
}))

function guidedStartError(err: unknown): string {
  if (!import.meta.client) {
    return 'Camera is only available in the browser.'
  }

  if (!window.isSecureContext) {
    return 'Camera access needs a secure context (HTTPS or localhost). Open this app over HTTPS or from localhost.'
  }

  const name = err && typeof err === 'object' && 'name' in err
    ? String((err as { name: string }).name)
    : ''

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Camera permission was denied. Allow camera access in your browser settings and try again.'
  }

  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'No camera was found on this device.'
  }

  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'The camera is already in use by another app. Close it and try again.'
  }

  if (name === 'OverconstrainedError') {
    return 'No camera matched the requested settings. Try again or use another device.'
  }

  const message = err instanceof Error ? err.message : ''
  if (message) {
    return `Could not start the camera: ${message}`
  }

  return 'Could not start the camera. Check permissions and try again.'
}

function refreshCapabilities() {
  torchSupported.value = false
  zoomSupported.value = false

  const track = mediaStream.value?.getVideoTracks()[0]
  if (!track || typeof track.getCapabilities !== 'function') return

  const caps = track.getCapabilities() as MediaTrackCapabilities & {
    torch?: boolean
    zoom?: { min?: number, max?: number, step?: number }
  }

  if (caps.torch) {
    torchSupported.value = true
  }

  if (caps.zoom && typeof caps.zoom.max === 'number' && caps.zoom.max > (caps.zoom.min ?? 1)) {
    zoomSupported.value = true
    zoomMin.value = caps.zoom.min ?? 1
    zoomMax.value = caps.zoom.max
    zoomStep.value = caps.zoom.step ?? 0.1
    const settings = track.getSettings() as MediaTrackSettings & { zoom?: number }
    zoomValue.value = settings.zoom ?? zoomMin.value
  }
}

async function applyTorch(on: boolean) {
  const track = mediaStream.value?.getVideoTracks()[0]
  if (!track || !torchSupported.value) return

  try {
    await track.applyConstraints({
      advanced: [{ torch: on } as MediaTrackConstraintSet],
    })
    torchOn.value = on
  }
  catch {
    toast.error('Torch is not available on this camera.')
    torchSupported.value = false
  }
}

async function applyZoom(value: number) {
  const track = mediaStream.value?.getVideoTracks()[0]
  if (!track || !zoomSupported.value) return

  zoomValue.value = value
  try {
    await track.applyConstraints({
      advanced: [{ zoom: value } as MediaTrackConstraintSet],
    })
  }
  catch {
    try {
      await track.applyConstraints({ zoom: value } as MediaTrackConstraints)
    }
    catch {
      toast.error('Zoom is not available on this camera.')
      zoomSupported.value = false
    }
  }
}

function stopOwnedStream() {
  if (mediaStream.value) {
    for (const track of mediaStream.value.getTracks()) {
      track.stop()
    }
    mediaStream.value = null
  }
  if (videoEl.value) {
    videoEl.value.srcObject = null
  }
  torchOn.value = false
  torchSupported.value = false
  zoomSupported.value = false
}

async function startOwnedStream() {
  if (!import.meta.client) return

  if (!window.isSecureContext) {
    throw Object.assign(new Error('insecure context'), { name: 'SecurityError' })
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    throw Object.assign(new Error('getUserMedia unavailable'), { name: 'NotSupportedError' })
  }

  // Prefer rear camera; fall back to any video input (desktop webcam).
  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: props.facingMode },
      },
    })
  }
  catch (firstErr) {
    // Retry without facingMode for desktops that reject the constraint.
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: true,
    }).catch(() => {
      throw firstErr
    })
  }

  mediaStream.value = stream

  if (videoEl.value) {
    videoEl.value.srcObject = stream
    await videoEl.value.play().catch(() => {})
  }

  refreshCapabilities()
}

async function start() {
  if (running.value || starting.value) return

  errorMessage.value = null
  starting.value = true

  try {
    if (props.ownStream) {
      await startOwnedStream()
    }
    else {
      emit('start')
    }
    running.value = true
  }
  catch (err) {
    stopOwnedStream()
    running.value = false
    errorMessage.value = guidedStartError(err)
  }
  finally {
    starting.value = false
  }
}

function stop() {
  if (props.ownStream) {
    stopOwnedStream()
  }
  else {
    emit('stop')
  }
  running.value = false
}

function handleDecoded(payload: DecodedPayload) {
  stop()
  add(payload.value, payload.format)
  toast.success('Scan saved')
  haptic.success()
  emit('decoded', payload)
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  emit('decode-file', file)

  if (!props.decodeFile) return

  try {
    const result = await props.decodeFile(file)
    handleDecoded(result)
  }
  catch (err) {
    const message = err instanceof Error ? err.message : 'Could not decode that image.'
    toast.error(message)
    haptic.error()
  }
}

function openFilePicker() {
  fileInputEl.value?.click()
}

/** Let parents / stub simulate guided errors without a real camera failure. */
function simulateError(kind: 'permission' | 'no-camera' | 'insecure' | 'generic') {
  stop()
  if (kind === 'permission') {
    errorMessage.value = guidedStartError({ name: 'NotAllowedError' })
  }
  else if (kind === 'no-camera') {
    errorMessage.value = guidedStartError({ name: 'NotFoundError' })
  }
  else if (kind === 'insecure') {
    errorMessage.value = 'Camera access needs a secure context (HTTPS or localhost). Open this app over HTTPS or from localhost.'
  }
  else {
    errorMessage.value = guidedStartError(new Error('Simulated failure'))
  }
}

onBeforeUnmount(() => {
  stopOwnedStream()
})

defineExpose({
  start,
  stop,
  handleDecoded,
  simulateError,
  running,
})
</script>

<template>
  <div class="space-y-4">
    <div class="relative overflow-hidden rounded-lg bg-black aspect-[3/4] max-h-[70vh] sm:aspect-video sm:max-h-none">
      <!-- Owned stream video -->
      <video
        v-if="ownStream"
        ref="videoEl"
        class="absolute inset-0 h-full w-full object-cover"
        playsinline
        muted
        autoplay
      />

      <!-- Engine slot (engines render their own video when ownStream=false) -->
      <div class="absolute inset-0">
        <slot name="engine" v-bind="slotProps">
          <slot v-bind="slotProps" />
        </slot>
      </div>

      <!-- Idle placeholder -->
      <div
        v-if="!running"
        class="absolute inset-0 flex items-center justify-center bg-gray-900/80 text-sm text-gray-300"
      >
        Camera stopped
      </div>

      <!-- Viewfinder overlay -->
      <div
        class="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div class="absolute left-[12%] top-[18%] h-10 w-10 border-l-2 border-t-2 border-white/90" />
        <div class="absolute right-[12%] top-[18%] h-10 w-10 border-r-2 border-t-2 border-white/90" />
        <div class="absolute bottom-[22%] left-[12%] h-10 w-10 border-b-2 border-l-2 border-white/90" />
        <div class="absolute bottom-[22%] right-[12%] h-10 w-10 border-b-2 border-r-2 border-white/90" />
        <div class="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2">
          <div class="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/70" />
          <div class="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white/70" />
        </div>
      </div>
    </div>

    <p
      v-if="errorMessage"
      class="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
      role="alert"
    >
      {{ errorMessage }}
    </p>

    <div class="flex flex-wrap items-center gap-2">
      <button
        v-if="!running"
        type="button"
        class="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
        :disabled="starting"
        @click="start"
      >
        {{ starting ? 'Starting…' : 'Start' }}
      </button>
      <button
        v-else
        type="button"
        class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800"
        @click="stop"
      >
        Stop
      </button>

      <button
        type="button"
        class="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
        @click="openFilePicker"
      >
        Upload image
      </button>
      <input
        ref="fileInputEl"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onFileChange"
      >

      <button
        v-if="torchSupported"
        type="button"
        class="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
        :aria-pressed="torchOn"
        @click="applyTorch(!torchOn)"
      >
        {{ torchOn ? 'Torch off' : 'Torch' }}
      </button>
    </div>

    <label
      v-if="zoomSupported"
      class="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300"
    >
      <span class="shrink-0">Zoom</span>
      <input
        type="range"
        class="w-full"
        :min="zoomMin"
        :max="zoomMax"
        :step="zoomStep"
        :value="zoomValue"
        @input="applyZoom(Number(($event.target as HTMLInputElement).value))"
      >
      <span class="w-10 shrink-0 tabular-nums">{{ zoomValue.toFixed(1) }}</span>
    </label>

    <div
      v-if="showRecent"
      class="border-t border-gray-200 pt-4 dark:border-gray-800"
    >
      <div class="mb-3 flex items-baseline justify-between gap-3">
        <h2 class="text-lg font-medium tracking-tight">
          Recent
        </h2>
        <NuxtLink
          to="/history"
          class="text-sm text-gray-600 underline-offset-2 hover:underline dark:text-gray-400"
        >
          View all
        </NuxtLink>
      </div>
      <RecentScansList :limit="5" />
    </div>
  </div>
</template>
