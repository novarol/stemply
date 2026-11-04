<script setup lang="ts">
/**
 * ScannerShell — shared chrome for scanner engines.
 *
 * Engine contract (slot / parent implements):
 * - start(): Promise<void> | void — begin live scanning (when ownStream=false)
 * - stop(): void — halt live scanning
 * - decodeFile(file: File): Promise<{ value: string; format: string }>
 * - emit decoded({ value: string; format: string }) — or call slot onDecoded
 *
 * When ownStream is true, this shell owns getUserMedia (facingMode: environment
 * preferred) and exposes the stream / video via slot props. Engines that manage
 * their own camera should set own-stream=false and honor facingMode / start.
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

/** Solid enough to read over the idle veil. */
const overlayActionIdleClass = 'border-white/25 bg-black/70 hover:bg-black/80'

/** Semi-transparent while the live preview is visible. */
const overlayActionActiveClass = 'border-white/20 bg-black/40 hover:bg-black/55'

const slotProps = computed(() => ({
  running: running.value,
  stream: mediaStream.value,
  videoEl: videoEl.value,
  facingMode: props.facingMode,
  onDecoded: handleDecoded,
  errorMessage: errorMessage.value,
  setEngineStream,
  reportStartError,
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

/**
 * Engines that own getUserMedia should call this after start so torch/zoom
 * can bind to the same MediaStreamTrack.
 */
function setEngineStream(stream: MediaStream | null) {
  if (props.ownStream) return

  mediaStream.value = stream
  if (stream) {
    refreshCapabilities()
    return
  }

  torchOn.value = false
  torchSupported.value = false
  zoomSupported.value = false
}

/** Pages call this when engine.start() rejects after the shell emitted start. */
function reportStartError(err: unknown) {
  if (props.ownStream) {
    stopOwnedStream()
  }
  else {
    emit('stop')
    setEngineStream(null)
  }
  running.value = false
  starting.value = false
  errorMessage.value = guidedStartError(err)
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

  const clamped = Math.min(zoomMax.value, Math.max(zoomMin.value, value))
  zoomValue.value = clamped
  try {
    await track.applyConstraints({
      advanced: [{ zoom: clamped } as MediaTrackConstraintSet],
    })
  }
  catch {
    try {
      await track.applyConstraints({ zoom: clamped } as MediaTrackConstraints)
    }
    catch {
      toast.error('Zoom is not available on this camera.')
      zoomSupported.value = false
    }
  }
}

function nudgeZoom(delta: number) {
  void applyZoom(zoomValue.value + delta)
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
    setEngineStream(null)
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
  stop()
  fileInputEl.value?.click()
}

/** Dev helper: simulate guided errors without a real camera failure. */
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
  if (props.ownStream) {
    stopOwnedStream()
  }
  else {
    emit('stop')
    setEngineStream(null)
  }
})

defineExpose({
  start,
  stop,
  handleDecoded,
  setEngineStream,
  reportStartError,
  simulateError,
  running,
})
</script>

<template>
  <div class="space-y-4">
    <!-- Portrait on phones (one-handed); landscape-friendly on desktop webcam -->
    <div class="relative mx-auto w-full overflow-hidden rounded-lg bg-black aspect-[3/4] max-h-[min(70vh,36rem)] sm:aspect-video sm:max-h-[min(70vh,28rem)]">
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

      <!-- Interactive controls over the preview -->
      <div class="pointer-events-none absolute inset-0 z-10">
        <!-- Torch -->
        <button
          v-if="torchSupported"
          type="button"
          class="pointer-events-auto absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-sm transition-colors"
          :class="torchOn
            ? 'border-white/40 bg-white/90 text-gray-900'
            : 'border-white/20 bg-black/40 text-white hover:bg-black/55'"
          :aria-label="torchOn ? 'Turn torch off' : 'Turn torch on'"
          :aria-pressed="torchOn"
          @click="applyTorch(!torchOn)"
        >
          <svg
            class="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M9 18h6" />
            <path d="M10 21h4" />
            <path d="M12 2a7 7 0 0 0-4.2 12.5c.7.6 1.1 1.3 1.3 2.5h5.8c.2-1.2.6-1.9 1.3-2.5A7 7 0 0 0 12 2z" />
          </svg>
        </button>

        <!-- Vertical zoom -->
        <div
          v-if="zoomSupported"
          class="pointer-events-auto absolute right-2 top-1/2 flex -translate-y-1/2 touch-none flex-col items-center gap-1.5"
        >
          <button
            type="button"
            class="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/40 text-lg leading-none text-white backdrop-blur-sm hover:bg-black/55 disabled:opacity-40"
            aria-label="Zoom in"
            :disabled="zoomValue >= zoomMax"
            @click="nudgeZoom(zoomStep)"
          >
            +
          </button>
          <div
            class="flex h-40 w-11 items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-sm"
          >
            <input
              type="range"
              class="scanner-zoom-slider h-36 w-11 cursor-pointer appearance-none bg-transparent"
              :min="zoomMin"
              :max="zoomMax"
              :step="zoomStep"
              :value="zoomValue"
              aria-label="Zoom"
              @input="applyZoom(Number(($event.target as HTMLInputElement).value))"
            >
          </div>
          <button
            type="button"
            class="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/40 text-lg leading-none text-white backdrop-blur-sm hover:bg-black/55 disabled:opacity-40"
            aria-label="Zoom out"
            :disabled="zoomValue <= zoomMin"
            @click="nudgeZoom(-zoomStep)"
          >
            −
          </button>
        </div>

        <!-- Bottom actions -->
        <div class="pointer-events-auto absolute inset-x-0 bottom-0 flex gap-2 p-3">
          <button
            v-if="!running"
            type="button"
            class="min-h-11 flex-1 rounded-md border px-4 py-2.5 text-sm font-medium text-white backdrop-blur-sm disabled:opacity-50 sm:flex-none"
            :class="overlayActionIdleClass"
            :disabled="starting"
            @click="start"
          >
            {{ starting ? 'Starting…' : 'Start' }}
          </button>
          <button
            v-else
            type="button"
            class="min-h-11 flex-1 rounded-md border px-4 py-2.5 text-sm font-medium text-white backdrop-blur-sm sm:flex-none"
            :class="overlayActionActiveClass"
            @click="stop"
          >
            Stop
          </button>

          <button
            type="button"
            class="min-h-11 flex-1 rounded-md border px-4 py-2.5 text-sm text-white backdrop-blur-sm sm:flex-none"
            :class="running ? overlayActionActiveClass : overlayActionIdleClass"
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

<style scoped>
.scanner-zoom-slider {
  writing-mode: vertical-lr;
  direction: rtl;
  touch-action: none;
}

.scanner-zoom-slider::-webkit-slider-runnable-track {
  width: 0.375rem;
  height: 100%;
  border-radius: 9999px;
  background: rgb(255 255 255 / 0.35);
}

.scanner-zoom-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 1.375rem;
  height: 1.375rem;
  margin-left: -0.5rem;
  border-radius: 9999px;
  border: 1px solid rgb(255 255 255 / 0.5);
  background: rgb(255 255 255 / 0.95);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.35);
}

.scanner-zoom-slider::-moz-range-track {
  width: 0.375rem;
  height: 100%;
  border-radius: 9999px;
  background: rgb(255 255 255 / 0.35);
}

.scanner-zoom-slider::-moz-range-thumb {
  width: 1.375rem;
  height: 1.375rem;
  border: 1px solid rgb(255 255 255 / 0.5);
  border-radius: 9999px;
  background: rgb(255 255 255 / 0.95);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.35);
}
</style>
