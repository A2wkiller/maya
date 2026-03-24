// Kokoro TTS — free, local, ElevenLabs quality
// Runs 100% in browser/Electron via WebAssembly
// No API key needed

let ttsInstance: any = null
let isLoading = false
let isLoaded = false
let sharedAudioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext
    sharedAudioContext = new AudioCtx()
  }
  if (sharedAudioContext?.state === 'suspended') {
    sharedAudioContext.resume()
  }
  return sharedAudioContext as AudioContext
}

// Available female voices for MAYA
export const KOKORO_VOICES = {
  heart:   'af_heart',   // warm, friendly — recommended for MAYA
  sky:     'af_sky',     // light, airy
  nicole:  'af_nicole',  // soft, natural
  bella:   'af_bella',   // elegant
  sarah:   'af_sarah',   // clear, professional
}

export async function loadKokoro(): Promise<boolean> {
  if (isLoaded) return true
  if (isLoading) {
    // Wait for existing load
    while (isLoading) {
      await new Promise(r => setTimeout(r, 200))
    }
    return isLoaded
  }

  isLoading = true
  try {
    const { KokoroTTS } = await import('kokoro-js')
    console.log('Loading Kokoro TTS model...')

    ttsInstance = await KokoroTTS.from_pretrained(
      'onnx-community/Kokoro-82M-v1.0-ONNX',
      {
        dtype: 'q8', // quantized — smaller, faster, same quality
        // device: 'webgpu' // uncomment if WebGPU available
      }
    )

    isLoaded = true
    isLoading = false
    console.log('Kokoro TTS loaded successfully')
    return true
  } catch (err) {
    console.warn('Kokoro TTS failed to load:', err)
    isLoading = false
    isLoaded = false
    return false
  }
}

export async function speakWithKokoro(
  text: string,
  voiceId: string = KOKORO_VOICES.heart,
  speed: number = 1.1
): Promise<boolean> {
  if (!ttsInstance) {
    const loaded = await loadKokoro()
    if (!loaded) return false
  }

  const cleaned = text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()

  if (!cleaned) return false

  try {
    const audio = await ttsInstance.generate(cleaned, {
      voice: voiceId,
      speed
    })

    const wavBuffer = audio.toWav()
    if (!wavBuffer || wavBuffer.byteLength === 0) return false

    const audioContext = getAudioContext()

    const audioBuffer = await audioContext.decodeAudioData(
      toArrayBuffer(wavBuffer)
    )

    const source = audioContext.createBufferSource()
    source.buffer = audioBuffer
    source.connect(audioContext.destination)

    return new Promise<boolean>((resolve) => {
      source.onended = () => resolve(true)
      try {
        source.start(0)
      } catch (e) {
        resolve(false)
      }
    })
  } catch (err) {
    console.warn('Kokoro speak error:', err)
    return false
  }
}

export function isKokoroLoaded(): boolean {
  return isLoaded
}

function toArrayBuffer(buf: Buffer | Uint8Array | ArrayBuffer): ArrayBuffer {
  if (buf instanceof ArrayBuffer) return buf
  const arr = buf instanceof Uint8Array ? buf : new Uint8Array(buf as any)
  return arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength)
}

// Preload in background when app starts
export function preloadKokoro(): void {
  setTimeout(() => {
    loadKokoro().then(ok => {
      if (ok) console.log('MAYA voice engine ready')
    })
  }, 3000) // load after 3s so app starts fast
}
