'use client'

import { useEffect, useState } from 'react'

export default function WidgetPage() {
  const [clipboardText, setClipboardText] = useState('')
  const [listening, setListening] = useState(false)

  useEffect(() => {
    const handler = (_: any, text: string) => setClipboardText(text)
    const listeningHandler = () => setListening(true)
    if (typeof window !== 'undefined' && (window as any).mayaSystem) {
      ;(window as any).mayaSystem.onClipboardChanged(handler)
      ;(window as any).mayaSystem.onAlwaysListeningStarted(listeningHandler)
    }
    return () => {
      if (typeof window !== 'undefined' && (window as any).mayaSystem) {
        ;(window as any).mayaSystem.onClipboardChanged(() => {})
      }
    }
  }, [])

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.35)',
      borderRadius: 12,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 18px',
      fontFamily: 'DM Sans, sans-serif',
      color: '#f5e6c8',
      boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #f4d28b, #7c5c2f)',
          boxShadow: listening
            ? '0 0 18px rgba(244,210,139,0.7)'
            : '0 0 12px rgba(0,0,0,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0b0b0b',
          fontWeight: 700
        }}>
          M
        </div>
        <div>
          <div style={{
            fontSize: 12,
            letterSpacing: 1.6,
            opacity: 0.8,
            marginBottom: 2
          }}>
            MAYA WIDGET
          </div>
          <div style={{
            fontSize: 11,
            color: '#d7c7a6',
            maxWidth: 360,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {clipboardText || 'Clipboard suggestions will appear here'}
          </div>
        </div>
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 11,
        letterSpacing: 1.4,
        color: listening ? '#8af59e' : '#e0d2b3'
      }}>
        <span style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: listening ? '#8af59e' : '#d5b06b',
          boxShadow: listening ? '0 0 12px #8af59e' : 'none'
        }} />
        {listening ? 'ALWAYS LISTENING' : 'IDLE'}
      </div>
    </div>
  )
}
