'use client'
import { useEffect, useState, type CSSProperties } from 'react'
import * as system from '@/lib/system'

type Props = {
  open: boolean
  onClose: () => void
  language: string
  onLanguageChange: (lang: string) => void
  alwaysListening: boolean
  onToggleAlwaysListening: () => void
  wakeWordEnabled: boolean
  onToggleWakeWord: () => void
  clipboardEnabled: boolean
  onToggleClipboard: () => void
  morningBriefingEnabled: boolean
  onToggleMorningBriefing: () => void
}

export function SettingsPanel({
  open,
  onClose,
  language,
  onLanguageChange,
  alwaysListening,
  onToggleAlwaysListening,
  wakeWordEnabled,
  onToggleWakeWord,
  clipboardEnabled,
  onToggleClipboard,
  morningBriefingEnabled,
  onToggleMorningBriefing
}: Props) {
  const [autoLaunch, setAutoLaunch] = useState<boolean | null>(null)

  useEffect(() => {
    let mounted = true
    if (open && system.isElectron()) {
      Promise.resolve(system.getAutoLaunch()).then((result: any) => {
        if (mounted && result?.success) setAutoLaunch(!!result.enabled)
      })
    }
    return () => { mounted = false }
  }, [open])

  if (!open) return null

  return (
    <div style={{
      position: 'fixed',
      left: 72,
      top: 52,
      bottom: 0,
      width: 268,
      background: 'rgba(8,8,15,0.94)',
      backdropFilter: 'blur(32px)',
      borderRight: '0.5px solid var(--border-subtle)',
      padding: '18px 16px 22px',
      zIndex: 22,
      overflowY: 'auto',
      animation: 'panelSlide 0.28s ease forwards'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16
      }}>
        <div style={{
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '0.32em',
          color: 'var(--text-primary)',
          textTransform: 'uppercase'
        }}>
          Settings
        </div>
        <button
          onClick={onClose}
          style={{
            border: 'none',
            background: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          x
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SelectRow
          label="Language"
          value={language}
          onChange={onLanguageChange}
        />
        <ToggleRow label="Always Listening" enabled={alwaysListening} onToggle={onToggleAlwaysListening} />
        <ToggleRow label="Wake Word" enabled={wakeWordEnabled} onToggle={onToggleWakeWord} />
        <ToggleRow label="Clipboard Sync" enabled={clipboardEnabled} onToggle={onToggleClipboard} />
        <ToggleRow label="Morning Briefing" enabled={morningBriefingEnabled} onToggle={onToggleMorningBriefing} />
        {system.isElectron() && (
          <ToggleRow
            label="Start At Login"
            enabled={!!autoLaunch}
            onToggle={async () => {
              const next = !autoLaunch
              const result: any = await system.setAutoLaunch(next)
              if (result?.success) setAutoLaunch(next)
            }}
          />
        )}
      </div>
    </div>
  )
}

function SelectRow({
  label,
  value,
  onChange
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div style={rowStyle}>
      <div style={rowLabelStyle}>{label}</div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          marginTop: 10,
          background: 'rgba(255,255,255,0.03)',
          border: '0.5px solid var(--border-subtle)',
          color: 'var(--text-primary)',
          padding: '10px 12px',
          borderRadius: 14
        }}
      >
        <option value="en">English</option>
        <option value="hi">Hindi</option>
        <option value="mr">Marathi</option>
      </select>
    </div>
  )
}

function ToggleRow({
  label,
  enabled,
  onToggle
}: {
  label: string
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <div style={rowStyle}>
      <div style={rowLabelStyle}>{label}</div>
      <button
        onClick={onToggle}
        style={{
          marginTop: 12,
          width: 38,
          height: 20,
          borderRadius: 999,
          border: '0.5px solid var(--border-subtle)',
          background: enabled ? 'rgba(59,130,246,0.32)' : 'rgba(255,255,255,0.04)',
          position: 'relative',
          cursor: 'pointer',
          boxShadow: enabled ? '0 0 20px rgba(59,130,246,0.18)' : 'none'
        }}
      >
        <span style={{
          position: 'absolute',
          top: 2,
          left: enabled ? 20 : 2,
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: enabled ? 'var(--accent-blue)' : 'rgba(226,232,240,0.8)',
          transition: 'left 0.2s ease'
        }} />
      </button>
    </div>
  )
}

const rowStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '0.5px solid var(--border-subtle)',
  borderRadius: 16,
  padding: 14
}

const rowLabelStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.16em',
  color: 'var(--text-primary)',
  textTransform: 'uppercase'
}
