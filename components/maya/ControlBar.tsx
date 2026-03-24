"use client"
import type { CSSProperties, ReactNode } from 'react'

interface ControlBarProps {
  apiKey: string
  isActive: boolean
  isScreenSharing: boolean
  showCameraOverlay?: boolean
  isListening: boolean
  isSpeaking: boolean
  isMuted: boolean
  wakeWordEnabled: boolean
  language: string
  conversationHistory: any[]
  transcript: string
  recordingTime: number
  onApiKeyChange: (v: string) => void
  onActivate: () => void
  onShutdown: () => void
  onListen: () => void
  onStopListen: () => void
  onSpeak: () => void
  onToggleMute: () => void
  onToggleWakeWord: () => void
  onScreenShare: () => void
  onStopScreenShare: () => void
  onShowCamera: () => void
  onSummary: () => void
}

const bars = Array.from({ length: 52 }, (_, i) => ({
  id: i,
  h: 7 + ((i * 17) % 26),
  duration: 0.35 + (i % 8) * 0.1,
  delay: (i % 9) * 0.05
}))

export function ControlBar({
  apiKey,
  isActive,
  isScreenSharing,
  isListening,
  isSpeaking,
  isMuted,
  wakeWordEnabled,
  conversationHistory,
  transcript,
  recordingTime,
  onApiKeyChange,
  onActivate,
  onShutdown,
  onListen,
  onStopListen,
  onSpeak,
  onToggleMute,
  onToggleWakeWord,
  onScreenShare,
  onStopScreenShare,
  onShowCamera,
  onSummary
}: ControlBarProps) {
  const live = isListening || isSpeaking

  return (
    <div style={{
      gridColumn: '2 / 3',
      gridRow: '3 / 4',
      height: 96,
      borderTop: '0.5px solid var(--border-subtle)',
      background: 'rgba(2,6,23,0.82)',
      backdropFilter: 'blur(18px)',
      display: 'grid',
      gridTemplateColumns: '150px 1fr 190px',
      alignItems: 'center',
      padding: '0 24px',
      gap: 18
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}>
        <div style={{
          fontSize: 8,
          fontWeight: 500,
          letterSpacing: '0.34em',
          color: 'var(--accent-cyan)',
          textTransform: 'uppercase',
          animation: live ? 'breathing 1.6s ease infinite' : 'none'
        }}>
          {isListening ? 'Listening' : isSpeaking ? 'Speaking' : 'Standby'}
        </div>
        <input
          type="password"
          value={apiKey}
          onChange={e => onApiKeyChange(e.target.value)}
          placeholder="Gemini key"
          className="input-ui"
          style={{
            fontSize: 11,
            borderRadius: 14,
            padding: '10px 12px'
          }}
        />
        {transcript && (
          <div style={{
            fontSize: 9,
            color: 'var(--text-secondary)',
            maxWidth: 140,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {recordingTime}s · {transcript}
          </div>
        )}
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: 4,
          height: 34,
          flex: 1
        }}>
          {bars.map(bar => (
            <div
              key={bar.id}
              style={{
                '--h': `${bar.h}px`
              } as CSSProperties}
            >
              <div style={{
                width: 2.5,
                height: 4,
                borderRadius: 999,
                background: 'linear-gradient(180deg, var(--accent-cyan), var(--accent-blue) 58%, var(--accent-violet))',
                animation: live ? `waveform ${bar.duration}s ease-in-out ${bar.delay}s infinite alternate` : 'none',
                opacity: live ? 1 : 0.24
              }} />
            </div>
          ))}
        </div>

        <div style={{
          position: 'relative',
          width: 48,
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <button
            onClick={isListening ? onStopListen : onListen}
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: '1px solid rgba(34,211,238,0.6)',
              background: 'rgba(15,23,42,0.92)',
              color: 'var(--accent-cyan)',
              cursor: 'pointer',
              position: 'relative',
              zIndex: 2,
              boxShadow: live ? '0 0 30px rgba(34,211,238,0.18)' : 'none'
            }}
          >
            {isListening ? '■' : '●'}
          </button>
          {live && (
            <div style={{
              position: 'absolute',
              inset: -6,
              borderRadius: '50%',
              border: '1px solid rgba(34,211,238,0.3)',
              animation: 'pulseRing 1.8s ease infinite'
            }} />
          )}
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 10,
        flexWrap: 'wrap'
      }}>
        <div style={{
          fontSize: 8,
          fontWeight: 500,
          letterSpacing: '0.34em',
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          marginRight: 6
        }}>
          Active
        </div>
        <Pill active={isActive} onClick={isActive ? onShutdown : onActivate}>
          {isActive ? 'Shutdown' : 'Activate'}
        </Pill>
        <Pill active={isSpeaking} onClick={onSpeak}>Speak</Pill>
        <Pill active={wakeWordEnabled} onClick={onToggleWakeWord}>Wake</Pill>
        <Pill active={isScreenSharing} onClick={isScreenSharing ? onStopScreenShare : onScreenShare}>Screen</Pill>
        <Pill active={false} onClick={onShowCamera}>Cam</Pill>
        <Pill active={isMuted} onClick={onToggleMute}>Mute</Pill>
        <Pill active={conversationHistory.length > 0} onClick={onSummary}>Summary</Pill>
      </div>
    </div>
  )
}

function Pill({
  active,
  onClick,
  children
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 30,
        padding: '0 12px',
        borderRadius: 999,
        border: `0.5px solid ${active ? 'rgba(59,130,246,0.4)' : 'var(--border-subtle)'}`,
        background: active ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.025)',
        color: active ? 'rgba(191,219,254,0.95)' : 'var(--text-secondary)',
        cursor: 'pointer',
        fontSize: 8,
        fontWeight: 500,
        letterSpacing: '0.26em',
        textTransform: 'uppercase'
      }}
    >
      {children}
    </button>
  )
}
