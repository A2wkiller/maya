'use client'
import { useState, useRef, useCallback } from 'react'
import { KEYS } from '@/lib/keys'

export function useWhisperVoice(
  onResult: (text: string) => void,
  language: string = 'en'
) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = useCallback(async () => {
    // Fallback to Web Speech if no Groq key
    if (!KEYS.groq) {
      console.warn('[WHISPER] No Groq key, falling back to Web Speech')
      fallbackToWebSpeech(onResult, language, setIsListening, setTranscript)
      return
    }

    try {
      setTranscript('Listening...')
      setIsListening(true)
      setRecordingTime(0)

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
          channelCount: 1
        },
        video: false
      })

      streamRef.current = stream
      chunksRef.current = []

      // ── SILENCE DETECTION ─────────────────────────
      const audioContext = new AudioContext()
      const closeAudioContext = () => {
        if (audioContext.state !== 'closed') {
          audioContext.close().catch(() => {})
        }
      }
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      analyser.fftSize = 512

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      let silenceStart = Date.now()
      let speechDetected = false
      let autoStopTimer: ReturnType<typeof setTimeout> | null = null
      const recordingStart = Date.now()

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm'
      })

      const stopRecording = (silent = false) => {
        if (mediaRecorderRef.current?.state === 'recording') {
          if (silent) chunksRef.current = []
          mediaRecorderRef.current.stop()
        }
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
      }

      const checkSilence = () => {
        analyser.getByteFrequencyData(dataArray)
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length

        if (avg > 15) {
          // Speech detected
          speechDetected = true
          silenceStart = Date.now()
          if (autoStopTimer) {
            clearTimeout(autoStopTimer)
            autoStopTimer = null
          }
        } else if (speechDetected) {
          // Silence after speech — stop after 1.2 seconds
          const silenceDuration = Date.now() - silenceStart
          if (silenceDuration > 1200 && !autoStopTimer) {
            autoStopTimer = setTimeout(() => {
              console.log('[WHISPER] Auto-stop after silence')
              stopRecording()
            }, 100)
          }
        } else {
          // No speech yet — auto stop after 6 seconds max wait
          const waitDuration = Date.now() - recordingStart
          if (waitDuration > 6000 && !autoStopTimer) {
            autoStopTimer = setTimeout(() => {
              console.log('[WHISPER] Auto-stop — no speech detected')
              setTranscript('No speech — try again.')
              stopRecording(true)
            }, 100)
          }
        }

        // Keep checking while recording
        if (mediaRecorderRef.current?.state === 'recording') {
          requestAnimationFrame(checkSilence)
        } else {
          closeAudioContext()
        }
      }

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        closeAudioContext()
        stream.getTracks().forEach(t => t.stop())
        setIsListening(false)
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }

        if (chunksRef.current.length === 0 || !speechDetected) {
          setTranscript('')
          return
        }

        setTranscript('Processing...')
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        console.log('[WHISPER] Audio size:', audioBlob.size)

        if (audioBlob.size < 500) {
          setTranscript('Too short — try again.')
          return
        }

        try {
          const text = await transcribeWithGroq(audioBlob, language)
          if (text?.trim()) {
            setTranscript(text)
            onResult(text)
          } else {
            setTranscript("Didn't catch that — try again.")
          }
        } catch (err) {
          console.error('[WHISPER] Error:', err)
          setTranscript('Error — try again.')
        }
      }

      mediaRecorderRef.current = mediaRecorder

      // recording timer
      timerRef.current = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - recordingStart) / 1000))
      }, 200)

      // Collect data every 250ms for faster processing
      mediaRecorder.start(250)
      console.log('[WHISPER] Recording started')

      // Start silence detection
      requestAnimationFrame(checkSilence)

       // Hard max recording limit — 15 seconds
       const hardStop = setTimeout(() => {
         if (mediaRecorderRef.current?.state === 'recording') {
           console.log('[WHISPER] Hard stop at 15s')
           stopRecording()
         }
       }, 15000)

      const originalOnStop = mediaRecorder.onstop
      mediaRecorder.onstop = (event: Event) => {
        clearTimeout(hardStop)
        originalOnStop?.call(mediaRecorder, event)
      }

    } catch (err: any) {
      console.error('[WHISPER] Mic error:', err.name)
      setIsListening(false)
      const msgs: Record<string, string> = {
        NotAllowedError: 'Mic denied — allow microphone.',
        NotFoundError: 'No microphone found.',
      }
      setTranscript(msgs[err.name] || `Mic error: ${err.message}`)
    }
  }, [language, onResult])

  const stop = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
      console.log('[WHISPER] Recording stopped')
    }
    setIsListening(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const clearTranscript = useCallback(() => {
    setTranscript('')
  }, [])

  return { isListening, transcript, recordingTime, start, stop, clearTranscript }
}

async function transcribeWithGroq(
  audioBlob: Blob,
  language: string
): Promise<string> {
  const file = new File([audioBlob], 'audio.webm', {
    type: audioBlob.type || 'audio/webm'
  })

  const formData = new FormData()
  formData.append('file', file)
  formData.append('model', 'whisper-large-v3-turbo')
  formData.append('response_format', 'json')

  if (language === 'hi') {
    formData.append('language', 'hi')
  } else if (language === 'mr') {
    formData.append('language', 'mr')
  } else {
    formData.append('language', 'en')
  }

  const res = await fetch(
    'https://api.groq.com/openai/v1/audio/transcriptions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KEYS.groq}`
      },
      body: formData
    }
  )

  if (!res.ok) {
    const err = await res.text()
    console.error('[WHISPER] Groq error:', err)
    throw new Error(`Groq transcription failed: ${res.status}`)
  }

  const data = await res.json()
  console.log('[WHISPER] Transcription:', data.text)
  return data.text?.trim() || ''
}

function fallbackToWebSpeech(
  onResult: (text: string) => void,
  language: string,
  setIsListening: (v: boolean) => void,
  setTranscript: (v: string) => void
) {
  const SR = (window as any).SpeechRecognition ||
             (window as any).webkitSpeechRecognition
  if (!SR) {
    setTranscript('Voice not supported.')
    return
  }

  const r = new SR()
  r.lang = language === 'hi' ? 'hi-IN' : 'en-US'
  r.continuous = false
  r.interimResults = false

  r.onstart = () => {
    setIsListening(true)
    setTranscript('Listening...')
  }
  r.onresult = (e: any) => {
    const text = e.results[0][0].transcript.trim()
    setTranscript(text)
    onResult(text)
  }
  r.onerror = (e: any) => {
    setIsListening(false)
    setTranscript(`Error: ${e.error}`)
  }
  r.onend = () => setIsListening(false)
  r.start()
}
