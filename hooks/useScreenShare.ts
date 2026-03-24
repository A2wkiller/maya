'use client'
import { useRef, useState, useCallback, useEffect } from 'react'

const MAX_FRAMES = 8

export function useScreenShare(
  mainVideoRef: React.RefObject<HTMLVideoElement | null>,
  cameraStreamRef: React.RefObject<MediaStream | null>
) {
  const screenVideoRef = useRef<HTMLVideoElement>(null)
  const screenCanvasRef = useRef<HTMLCanvasElement>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const watcherRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastCaptureRef = useRef<number>(0)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [screenFrames, setScreenFrames] = useState<string[]>([])
  const [frameCount, setFrameCount] = useState(0)

  const captureScreen = useCallback((): string | null => {
    const video = screenVideoRef.current
    const canvas = screenCanvasRef.current
    if (!video || !canvas || video.readyState < 2) return null
    if (video.videoWidth === 0) return null

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(video, 0, 0)

    const b64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
    return b64.length > 5000 ? b64 : null
  }, [])

  const stopCollection = useCallback(() => {
    if (watcherRef.current) {
      clearInterval(watcherRef.current)
      watcherRef.current = null
    }
    setScreenFrames([])
    setFrameCount(0)
  }, [])

  const startCollection = useCallback(() => {
    stopCollection()
    watcherRef.current = setInterval(() => {
      const frame = captureScreen()
      if (frame) {
        lastCaptureRef.current = Date.now()
        setScreenFrames(prev => [...prev, frame].slice(-MAX_FRAMES))
        setFrameCount(prev => Math.min(prev + 1, MAX_FRAMES))
      }
    }, 500)
  }, [captureScreen, stopCollection])

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 5 } },
        audio: false
      })
      screenStreamRef.current = stream

      // Show in main video
      if (mainVideoRef.current) {
        mainVideoRef.current.srcObject = stream
        mainVideoRef.current.onloadedmetadata = () => {
          mainVideoRef.current?.play()
        }
      }

      // Hidden video for capture
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream
        screenVideoRef.current.onloadedmetadata = () => {
          screenVideoRef.current?.play().then(startCollection)
        }
      }

      setIsScreenSharing(true)
      stream.getVideoTracks()[0].onended = stop
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        console.error('Screen share error:', err)
      }
    }
  }, [mainVideoRef, startCollection])

  const stop = useCallback(() => {
    stopCollection()
    screenStreamRef.current?.getTracks().forEach(t => t.stop())
    screenStreamRef.current = null
    if (screenVideoRef.current) screenVideoRef.current.srcObject = null
    setIsScreenSharing(false)

    // Restore camera
    if (cameraStreamRef.current && mainVideoRef.current) {
      mainVideoRef.current.srcObject = cameraStreamRef.current
      mainVideoRef.current.play().catch(console.error)
    }
  }, [stopCollection, mainVideoRef, cameraStreamRef])

  // Health watchdog
  useEffect(() => {
    if (!isScreenSharing) return
    const checker = setInterval(() => {
      if (lastCaptureRef.current > 0 &&
          Date.now() - lastCaptureRef.current > 3000) {
        stopCollection()
        setTimeout(startCollection, 300)
      }
    }, 3000)
    return () => clearInterval(checker)
  }, [isScreenSharing, startCollection, stopCollection])

  // Cleanup
  useEffect(() => {
    return () => { stopCollection() }
  }, [stopCollection])

  return {
    screenVideoRef,
    screenCanvasRef,
    isScreenSharing,
    screenFrames,
    frameCount,
    start,
    stop,
    captureScreen
  }
}
