/** Prefer rear camera; fall back to any video input (desktop webcam). */
export async function getPreferredVideoStream(
  facingMode: 'environment' | 'user' = 'environment',
): Promise<MediaStream> {
  if (!import.meta.client) {
    throw Object.assign(new Error('Camera is only available in the browser.'), { name: 'NotSupportedError' })
  }

  if (!window.isSecureContext) {
    throw Object.assign(new Error('insecure context'), { name: 'SecurityError' })
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    throw Object.assign(new Error('getUserMedia unavailable'), { name: 'NotSupportedError' })
  }

  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: facingMode },
      },
    })
  }
  catch (firstErr) {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: true,
    }).catch(() => {
      throw firstErr
    })
  }
}
