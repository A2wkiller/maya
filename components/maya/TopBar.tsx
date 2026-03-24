'use client'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Status, AgentType } from '@/types'
import { isKokoroLoaded } from '@/lib/kokoro-tts'

type DragRegionStyle = CSSProperties & { WebkitAppRegion?: 'drag' | 'no-drag' | string }

interface TopBarProps {
  status: Status
  activeAgent: AgentType
  language: string
  ctrlOnline?: boolean
  onLanguageToggle: () => void
  onSettingsClick?: () => void
}

export function TopBar({
  status,
  activeAgent,
  language,
  ctrlOnline = false,
  onLanguageToggle,
  onSettingsClick
}: TopBarProps) {
  const [voiceReady, setVoiceReady] = useState(false)

  useEffect(() => {
    const check = setInterval(() => {
      if (isKokoroLoaded()) {
        setVoiceReady(true)
        clearInterval(check)
      }
    }, 600)
    return () => clearInterval(check)
  }, [])

  const statusItems = useMemo(() => ([
    {
      label: 'NEURAL CORE',
      color: 'var(--accent-cyan)',
      active: status !== 'OFFLINE'
    },
    {
      label: 'VOICE ACTIVE',
      color: 'var(--accent-violet)',
      active: voiceReady
    },
    {
      label: 'MEMORY SYNC',
      color: 'var(--accent-blue)',
      active: activeAgent !== 'general'
    },
    {
      label: 'CTRL ONLINE',
      color: 'var(--accent-cyan)',
      active: ctrlOnline
    }
  ]), [activeAgent, ctrlOnline, status, voiceReady])

  return (
    <div style={{
      gridColumn: '1 / 4',
      height: 52,
      borderBottom: '0.5px solid var(--border-subtle)',
      background: 'rgba(2,6,23,0.72)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 18px',
      position: 'relative',
      zIndex: 20,
      WebkitAppRegion: 'drag'
    } as DragRegionStyle}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        WebkitAppRegion: 'no-drag'
      } as DragRegionStyle}>
        <div style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: 'var(--accent-cyan)',
          boxShadow: '0 0 14px rgba(34,211,238,0.85)'
        }} />
        <div style={{
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: '0.64em',
          color: 'rgba(226,232,240,0.9)',
          textTransform: 'uppercase'
        }}>
          MAYA
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        WebkitAppRegion: 'no-drag'
      } as DragRegionStyle}>
        {statusItems.map(item => (
          <div key={item.label} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: '0.28em',
            color: item.active ? item.color : 'var(--text-muted)',
            textTransform: 'uppercase'
          }}>
            <div style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: item.active ? item.color : 'rgba(255,255,255,0.12)',
              boxShadow: item.active ? `0 0 12px ${item.color}` : 'none',
              animation: item.active ? 'breathing 2.8s ease infinite' : 'none'
            }} />
            {item.label}
          </div>
        ))}
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        WebkitAppRegion: 'no-drag'
      } as DragRegionStyle}>
        <button
          onClick={onLanguageToggle}
          style={{
            border: 'none',
            background: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: '0.28em',
            textTransform: 'uppercase'
          }}
        >
          {language === 'hi' ? 'HI' : language === 'mr' ? 'MR' : 'EN'}
        </button>
        {onSettingsClick && (
          <button
            onClick={onSettingsClick}
            style={{
              border: '0.5px solid var(--border-subtle)',
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              borderRadius: 999,
              padding: '6px 10px',
              fontSize: 8,
              fontWeight: 500,
              letterSpacing: '0.24em',
              textTransform: 'uppercase'
            }}
          >
            Settings
          </button>
        )}
        <div style={{
          fontSize: 8,
          fontWeight: 400,
          letterSpacing: '0.26em',
          color: 'var(--text-muted)',
          textTransform: 'uppercase'
        }}>
          PERSONAL AI OS · v2.0
        </div>
      </div>
    </div>
  )
}
