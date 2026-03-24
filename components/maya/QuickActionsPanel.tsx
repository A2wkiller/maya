'use client'

import type { CSSProperties, ReactNode } from 'react'
import { Message } from '@/types'

type PanelKey = 'mem' | 'act' | 'chat' | null

interface QuickActionsPanelProps {
  responses: Message[]
  activePanel: PanelKey
  onPanelChange: (panel: PanelKey) => void
  onOpenSettings: () => void
  onClear: () => void
  onToggleCamera: () => void
  cameraOn: boolean
  onScreenShare: () => void
}

const navItems = [
  { key: 'mem', label: 'MEM', icon: 'M' },
  { key: 'act', label: 'ACT', icon: 'A' }
] as const

export function QuickActionsPanel({
  responses,
  activePanel,
  onPanelChange,
  onOpenSettings,
  onClear,
  onToggleCamera,
  cameraOn,
  onScreenShare
}: QuickActionsPanelProps) {
  const memoryItems = responses.slice(0, 6)
  const actionItems = responses.filter(r => r.agentAction).slice(0, 6)

  return (
    <>
      <div style={{
        gridColumn: '1 / 2',
        gridRow: '2 / 4',
        borderRight: '0.5px solid var(--border-subtle)',
        background: 'rgba(2,6,23,0.78)',
        backdropFilter: 'blur(18px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 0 14px',
        zIndex: 12
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
          {navItems.map(item => (
            <SidebarItem
              key={item.key}
              label={item.label}
              icon={item.icon}
              active={activePanel === item.key}
              onClick={() => onPanelChange(activePanel === item.key ? null : item.key)}
            />
          ))}
          <SidebarItem
            label="SET"
            icon="S"
            active={false}
            onClick={onOpenSettings}
          />
        </div>

        <SidebarItem
          label="CHAT"
          icon="C"
          active={activePanel === 'chat'}
          onClick={() => onPanelChange(activePanel === 'chat' ? null : 'chat')}
        />
      </div>

      {(activePanel === 'mem' || activePanel === 'act') && (
        <div style={{
          position: 'fixed',
          left: 72,
          top: 52,
          bottom: 0,
          width: 268,
          background: 'rgba(8,8,15,0.94)',
          backdropFilter: 'blur(32px)',
          borderRight: '0.5px solid var(--border-subtle)',
          padding: '18px 16px',
          animation: 'panelSlide 0.28s ease forwards',
          zIndex: 18,
          overflowY: 'auto'
        }}>
          <div style={{
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            marginBottom: 16
          }}>
            {activePanel === 'mem' ? 'Memory Stream' : 'Action Deck'}
          </div>

          {activePanel === 'mem' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {memoryItems.length === 0 && <PanelEmpty text="No memories yet" />}
              {memoryItems.map(item => (
                <div key={item.id} style={panelCardStyle}>
                  <div style={panelLabelStyle}>MEMORY</div>
                  <div style={{
                    fontSize: 10,
                    color: 'var(--text-primary)',
                    lineHeight: 1.6
                  }}>
                    {item.question}
                  </div>
                  <div style={{
                    fontSize: 10,
                    color: 'var(--text-secondary)',
                    marginTop: 8,
                    lineHeight: 1.6
                  }}>
                    {item.reply.slice(0, 110)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activePanel === 'act' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <ActionButton onClick={onToggleCamera}>
                {cameraOn ? 'Hide Camera' : 'Show Camera'}
              </ActionButton>
              <ActionButton onClick={onScreenShare}>Share Screen</ActionButton>
              <ActionButton onClick={onClear}>Clear Session</ActionButton>
              {actionItems.length === 0 && <PanelEmpty text="No action logs yet" />}
              {actionItems.map(item => (
                <div key={item.id} style={panelCardStyle}>
                  <div style={panelLabelStyle}>
                    {item.agentAction?.success ? 'SUCCESS' : 'FAILED'}
                  </div>
                  <div style={{
                    fontSize: 10,
                    color: 'var(--text-primary)',
                    lineHeight: 1.6
                  }}>
                    {item.agentAction?.type.toUpperCase()} · {item.agentAction?.operation.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}

function SidebarItem({
  label,
  icon,
  active,
  onClick
}: {
  label: string
  icon: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer'
      }}
    >
      <div style={{
        width: 42,
        height: 42,
        borderRadius: 12,
        border: `0.5px solid ${active ? 'rgba(59,130,246,0.32)' : 'var(--border-subtle)'}`,
        background: active ? 'rgba(59,130,246,0.14)' : 'rgba(255,255,255,0.02)',
        boxShadow: active ? 'inset 2px 0 0 var(--accent-blue), 0 0 18px rgba(59,130,246,0.16)' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: active ? 'rgba(191,219,254,0.95)' : 'var(--text-secondary)',
        fontSize: 15,
        fontWeight: 600,
        transition: 'all 0.2s ease'
      }}>
        {icon}
      </div>
      <div style={{
        fontSize: 7,
        fontWeight: 500,
        letterSpacing: '0.24em',
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        textTransform: 'uppercase'
      }}>
        {label}
      </div>
    </button>
  )
}

function ActionButton({
  children,
  onClick
}: {
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '14px 12px',
        borderRadius: 14,
        border: '0.5px solid var(--border-subtle)',
        background: 'rgba(255,255,255,0.03)',
        color: 'var(--text-primary)',
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.14em',
        cursor: 'pointer',
        textAlign: 'left'
      }}
    >
      {children}
    </button>
  )
}

function PanelEmpty({ text }: { text: string }) {
  return (
    <div style={{
      fontSize: 10,
      color: 'var(--text-secondary)',
      padding: '10px 2px'
    }}>
      {text}
    </div>
  )
}

const panelCardStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '0.5px solid var(--border-subtle)',
  borderRadius: 16,
  padding: 14
}

const panelLabelStyle: CSSProperties = {
  fontSize: 8,
  fontWeight: 500,
  letterSpacing: '0.24em',
  color: 'var(--accent-blue)',
  textTransform: 'uppercase',
  marginBottom: 10
}
