'use client'
import { useRef, useState, useCallback, useEffect } from 'react'

// Pre-request camera permission silently on app load
// This removes the delay when user first opens camera
export function useCameraPrewarm() {
  useEffect(() => {
    const prewarm = async () => {
      try {
        // Just request permission and immediately stop
        // This caches the permission so next open is instant
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true, audio: false
        })
        // Immediately stop all tracks — just warming up permission
        stream.getTracks().forEach(t => t.stop())
        console.log('[CAMERA] Permission pre-warmed')
      } catch (e) {
        console.log('[CAMERA] Prewarm failed (no camera or denied):', e)
      }
    }
    // Run after 3 seconds so app loads first
    const t = setTimeout(prewarm, 3000)
    return () => clearTimeout(t)
  }, [])
}

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const startBackground = useCallback(async () => {
    if (streamRef.current) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 24, max: 30 },
          facingMode: 'user'
        },
        audio: false
      })
      streamRef.current = stream
      setIsStreaming(true)
      console.log('[CAMERA] Background stream started')
    } catch (e) {
      console.warn('[CAMERA] Background start failed:', e)
    }
  }, [])

  const show = useCallback(async () => {
    if (!navigator.mediaDevices) {
      setError('Camera API not available. Make sure you are running in Electron.')
      return
    }

    if (!streamRef.current) {
      await startBackground()
    }

    if (streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch(console.error)
      }
    }

    setIsActive(true)
    setIsVisible(true)
    setError(null)
  }, [startBackground])

  const hide = useCallback(() => {
    setIsVisible(false)
    setIsActive(false)
    // keep stream alive
  }, [])

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setIsActive(false)
    setIsVisible(false)
    setIsStreaming(false)
  }, [])

  const captureFrame = useCallback((): string | null => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video || video.readyState < 2) return null
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    canvas.width = 640
    canvas.height = 480
    ctx.drawImage(video, 0, 0, 640, 480)
    const b64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
    return b64.length > 1000 ? b64 : null
  }, [])

  return {
    videoRef,
    canvasRef,
    streamRef,
    isActive,
    isStreaming,
    isVisible,
    error,
    startBackground,
    show,
    hide,
    stop,
    captureFrame
  }
}
