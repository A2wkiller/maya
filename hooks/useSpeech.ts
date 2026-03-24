'use client'
import { useCallback, useEffect, useState } from 'react'
import { cleanForSpeech } from '@/lib/gemini'
import { speakWithKokoro, isKokoroLoaded, preloadKokoro } from '@/lib/kokoro-tts'

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    // Preload voices + warmup Web Speech
    const loadVoices = () => window.speechSynthesis.getVoices()
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices

    // Warmup Web Speech engine
    setTimeout(() => {
      const w = new SpeechSynthesisUtterance(' ')
      w.volume = 0
      window.speechSynthesis.speak(w)
    }, 500)

    // Preload Kokoro in background
    preloadKokoro()

    return () => { window.speechSynthesis.cancel() }
  }, [])

  const speak = useCallback(async (
    text: string,
    language: string = 'en'
  ) => {
    if (isMuted || !text?.trim()) return
    // Cancel any ongoing speech first
    window.speechSynthesis.cancel()
    setIsSpeaking(false)

    await new Promise(r => setTimeout(r, 80))

    setIsSpeaking(true)

    // Use Kokoro for English — best quality, free, local
    if (language === 'en' && isKokoroLoaded()) {
      const selectedVoice = localStorage.getItem('maya_kokoro_voice')
        || 'af_heart'
      try {
        const ok = await speakWithKokoro(text, selectedVoice)
        if (ok) {
          setIsSpeaking(false)
          return
        }
      } catch (e) {
        console.warn('Kokoro failed:', e)
      }
      // Fall through to Web Speech if Kokoro fails
    }

    setTimeout(() => {
      const utter = new SpeechSynthesisUtterance(
        text
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/#{1,6}\s+/g, '')
          .replace(/`([^`]+)`/g, '$1')
          .replace(/\n/g, ' ')
          .trim()
      )

      const voices = window.speechSynthesis.getVoices()

      if (language === 'hi') {
        const v = voices.find(v => v.lang === 'hi-IN') ||
                  voices.find(v => v.lang === 'en-IN')
        if (v) utter.voice = v
        utter.lang = 'hi-IN'
      } else if (language === 'mr') {
        const v = voices.find(v => v.lang === 'mr-IN')
        if (v) utter.voice = v
        utter.lang = 'mr-IN'
      } else {
        const v =
          voices.find(v => v.name === 'Google UK English Female') ||
          voices.find(v => v.name.includes('Samantha')) ||
          voices.find(v => v.name.includes('Zira')) ||
          voices.find(v => v.name.includes('Sonia'))
        if (v) utter.voice = v
        utter.lang = 'en-US'
      }

      utter.rate = 1.1
      utter.pitch = 1.2
      utter.volume = 1.0
      utter.onstart = () => setIsSpeaking(true)
      utter.onend = () => setIsSpeaking(false)
      utter.onerror = () => setIsSpeaking(false)
      window.speechSynthesis.speak(utter)

      const keepAlive = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          clearInterval(keepAlive)
          return
        }
        window.speechSynthesis.pause()
        window.speechSynthesis.resume()
      }, 10000)
    }, 120)
  }, [isMuted])

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [])

  const playChime = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.25)
    } catch (e) {}
  }, [])

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      if (!prev) window.speechSynthesis.cancel()
      return !prev
    })
  }, [])

  return { isSpeaking, isMuted, speak, stop, toggleMute, playChime }
}
