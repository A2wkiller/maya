'use client'
import { useMemo, useState } from 'react'
import { Message } from '@/types'

interface ActionPanelProps {
  responses: Message[]
  onClear?: () => void
}

type ActionFilter = 'all' | 'success' | 'failed'

export function ActionPanel({ responses, onClear }: ActionPanelProps) {
  const [filter, setFilter] = useState<ActionFilter>('all')

  const actions = useMemo(() => {
    const items = responses
      .filter(r => r.agentAction)
      .map(r => ({
        id: r.id,
        time: new Date(r.timestamp).toLocaleTimeString(),
        action: r.agentAction
      }))

    if (filter === 'success') return items.filter(i => i.action?.success)
    if (filter === 'failed') return items.filter(i => i.action && !i.action.success)
    return items
  }, [responses, filter])

  const totalActions = responses.filter(r => r.agentAction).length

  return (
    <div style={{
      borderBottom: '1px solid var(--border-subtle)',
      padding: '16px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      maxHeight: 180,
      overflowY: 'auto'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          fontFamily: 'DM Mono',
          fontSize: 9,
          letterSpacing: 3,
          color: 'var(--text-muted)'
        }}>
          ACTIONS
          <span style={{
            marginLeft: 10,
            color: totalActions > 0
              ? 'rgba(201,169,110,0.5)'
              : 'var(--text-muted)'
          }}>
            {totalActions} LOGS
          </span>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {(['all', 'success', 'failed'] as ActionFilter[]).map(key => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                fontFamily: 'DM Mono',
                fontSize: 8,
                letterSpacing: 2,
                padding: '4px 8px',
                border: '1px solid var(--border-subtle)',
                background: filter === key
                  ? 'var(--accent-gold-dim)'
                  : 'transparent',
                color: filter === key
                  ? 'var(--accent-gold)'
                  : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              {key.toUpperCase()}
            </button>
          ))}

          {onClear && (
            <button
              onClick={onClear}
              style={{
                fontFamily: 'DM Mono',
                fontSize: 8,
                letterSpacing: 2,
                padding: '4px 8px',
                border: '1px solid rgba(192,97,106,0.4)',
                background: 'transparent',
                color: 'rgba(192,97,106,0.7)',
                cursor: 'pointer'
              }}
            >
              CLEAR
            </button>
          )}
        </div>
      </div>

      {actions.length === 0 ? (
        <div style={{
          fontFamily: 'DM Mono',
          fontSize: 10,
          color: 'var(--text-muted)',
          letterSpacing: 1
        }}>
          No native actions yet for this filter.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {actions.map(entry => (
            <div key={entry.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              padding: '8px 10px',
              border: '1px solid var(--border-subtle)',
              borderRadius: 3,
              background: 'rgba(255,255,255,0.02)'
            }}>
              <div style={{
                fontFamily: 'DM Mono',
                fontSize: 9,
                letterSpacing: 1.5,
                color: entry.action?.success
                  ? 'var(--status-online)'
                  : 'var(--red-alert)'
              }}>
                {entry.action?.type.toUpperCase()} · {entry.action?.operation.toUpperCase()}
              </div>
              <div style={{
                fontFamily: 'DM Mono',
                fontSize: 9,
                color: 'var(--text-muted)'
              }}>
                {entry.time}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
