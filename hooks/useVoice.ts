'use client'
import { useRef, useState, useCallback, useEffect } from 'react'
import * as system from '@/lib/system'

// Note: legacy Web Speech hook kept as fallback; primary voice is useWhisperVoice
export function useVoice(
  onResult: (text: string) => void,
  language: string = 'en'
) {
  const recognitionRef = useRef<any>(null)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [alwaysListening, setAlwaysListening] = useState(false)

  const start = useCallback(() => {
    console.log('[VOICE] Starting recognition, language:', language)

    const SR = (window as any).SpeechRecognition ||
               (window as any).webkitSpeechRecognition

    if (!SR) {
      console.error('[VOICE] SpeechRecognition not available')
      alert('Voice not supported. Make sure you are using Electron or Chrome.')
      return
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch(e) {}
      recognitionRef.current = null
    }

    const r = new SR()
    r.lang = language === 'hi' ? 'hi-IN'
            : language === 'mr' ? 'mr-IN'
            : 'en-US'
    r.continuous = false
    r.interimResults = false
    r.maxAlternatives = 1

    r.onstart = () => {
      console.log('[VOICE] Recognition started')
      setIsListening(true)
      setTranscript('Listening...')
    }

    r.onspeechstart = () => {
      console.log('[VOICE] Speech detected')
      setTranscript('Hearing you...')
    }

    r.onresult = (e: any) => {
      const text = e.results[0][0].transcript.trim()
      const confidence = e.results[0][0].confidence
      console.log('[VOICE] Heard:', text, 'confidence:', confidence)
      setTranscript(text)
      onResult(text)
    }

    r.onnomatch = () => {
      console.warn('[VOICE] No match')
      setTranscript("Didn't catch that — try again.")
      setIsListening(false)
    }

    r.onerror = (e: any) => {
      console.error('[VOICE] Error:', e.error, e.message)
      setIsListening(false)

      if (e.error === 'network') {
        // Network error in Electron — retry once after delay
        console.warn('[VOICE] Network error, retrying in 1s...')
        setTranscript('Reconnecting...')
        setTimeout(() => {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.start()
              setIsListening(true)
              setTranscript('Listening...')
            } catch (retryErr) {
              console.error('[VOICE] Retry failed:', retryErr)
              setTranscript('Voice unavailable — check internet connection.')
            }
          }
        }, 1000)
        return
      }

      if (e.error === 'not-allowed') {
        setTranscript('Mic denied — check Electron permissions.')
      } else if (e.error === 'no-speech') {
        setTranscript('No speech detected. Try again.')
      } else if (e.error === 'audio-capture') {
        setTranscript('No microphone found — connect a mic.')
      } else {
        setTranscript(`Voice error: ${e.error} — try again.`)
      }
    }

    r.onend = () => {
      console.log('[VOICE] Recognition ended')
      setIsListening(false)
    }

    recognitionRef.current = r

    try {
      r.start()
      console.log('[VOICE] Recognition start called')
    } catch (e: any) {
      console.error('[VOICE] Could not start:', e)
      setIsListening(false)
      setTranscript(`Could not start mic: ${e.message}`)
    }
  }, [language, onResult])

  const stop = useCallback(() => {
    try { recognitionRef.current?.stop() } catch(e) {}
    setIsListening(false)
  }, [])

  // Always-listening hook (Electron)
  useEffect(() => {
    if (system.isElectron()) {
      const res = system.getListeningStatus()
      if (res && typeof (res as any).then === 'function') {
        ;(res as Promise<any>).then((out) => {
          if (out?.success) setAlwaysListening(!!out.listening)
        })
      }
      system.onAlwaysListeningStarted(() => setAlwaysListening(true))
    }
  }, [])

  const clearTranscript = useCallback(() => {
    setTranscript('')
  }, [])

  return { isListening, transcript, start, stop, clearTranscript, alwaysListening }
}

export function useAlwaysListening(
  onWakeWord: () => void,
  onCommand: (text: string) => void,
  language: string = 'en'
) {
  const [active, setActive] = useState(false)
  const recognitionRef = useRef<any>(null)

  const start = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return

    const r = new SR()
    r.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-US'
    r.continuous = true
    r.interimResults = false

    r.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((result: any) => result[0].transcript)
        .join(' ').toLowerCase().trim()

      const wakeWords = ['hey maya', 'hi maya', 'okay maya', 'maya']
      const hasWakeWord = wakeWords.some(w => transcript.includes(w))

      if (hasWakeWord) {
        onWakeWord()
        const command = wakeWords
          .reduce((t, w) => t.replace(w, ''), transcript)
          .trim()
        if (command.length > 2) onCommand(command)
      }
    }

    r.onend = () => {
      if (active) try { r.start() } catch (e) {}
    }

    r.onerror = () => {
      setTimeout(() => {
        if (active) try { r.start() } catch (e) {}
      }, 2000)
    }

    recognitionRef.current = r
    try { r.start(); setActive(true) } catch (e) {}
  }, [active, language, onCommand, onWakeWord])

  const stop = useCallback(() => {
    setActive(false)
    try { recognitionRef.current?.stop() } catch (e) {}
  }, [])

  return { active, start, stop }
}
