'use client'
import { useState, type FormEvent } from 'react'
import { Message } from '@/types'

interface ResponseLogProps {
  responses: Message[]
  onClear: () => void
  search?: string
  onSearchChange?: (value: string) => void
  onQuery?: (text: string) => void
}

export function ResponseLog({
  responses,
  onClear,
  search = '',
  onSearchChange,
  onQuery
}: ResponseLogProps) {
  const [inputValue, setInputValue] = useState('')

  const filtered = search
    ? responses.filter(r =>
        r.question.toLowerCase().includes(search.toLowerCase()) ||
        r.reply.toLowerCase().includes(search.toLowerCase())
      )
    : responses

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!onQuery) return
    const trimmed = inputValue.trim()
    if (!trimmed) return
    onQuery(trimmed)
    setInputValue('')
  }

  return (
    <div style={{
      gridColumn: '3 / 4',
      gridRow: '2 / 4',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      background: 'rgba(255,255,255,0.025)',
      backdropFilter: 'blur(24px)',
      borderLeft: '0.5px solid rgba(255,255,255,0.05)',
      overflow: 'hidden',
      zIndex: 10
    }}>
      <div style={{
        padding: '18px 18px 14px',
        borderBottom: '0.5px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        <div>
          <div style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.28em',
            color: 'var(--text-primary)',
            textTransform: 'uppercase'
          }}>
            Conversation
          </div>
          <div style={{
            fontSize: 9,
            color: 'var(--text-secondary)',
            marginTop: 6
          }}>
            {filtered.length} messages
          </div>
        </div>
        {responses.length > 0 && (
          <button
            onClick={onClear}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 8,
              fontWeight: 500,
              letterSpacing: '0.24em',
              textTransform: 'uppercase'
            }}
          >
            Clear
          </button>
        )}
      </div>

      {onSearchChange && (
        <div style={{ padding: '14px 18px 0' }}>
          <input
            className="input-ui"
            placeholder="Search conversation"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ fontSize: 11 }}
          />
        </div>
      )}

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }}>
        {filtered.length === 0 && (
          <div style={{
            marginTop: 60,
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: 11,
            lineHeight: 1.8
          }}>
            Quiet channel right now.
            <div style={{
              fontSize: 8,
              letterSpacing: '0.32em',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              marginTop: 10
            }}>
              Ask MAYA anything
            </div>
          </div>
        )}

        {filtered.map((r) => (
          <div key={r.id} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            animation: 'messageFade 0.32s ease forwards'
          }}>
            <div style={{
              alignSelf: 'flex-end',
              maxWidth: '88%',
              background: 'rgba(59,130,246,0.14)',
              border: '0.5px solid rgba(59,130,246,0.2)',
              borderRadius: '14px 14px 3px 14px',
              padding: '12px 13px'
            }}>
              <div style={{
                fontSize: 8,
                fontWeight: 500,
                letterSpacing: '0.24em',
                color: 'rgba(147,197,253,0.72)',
                textTransform: 'uppercase',
                marginBottom: 8
              }}>
                You
              </div>
              <div style={{
                fontSize: 12,
                lineHeight: 1.65,
                color: 'var(--text-primary)'
              }}>
                {r.question}
              </div>
            </div>

            <div style={{
              alignSelf: 'flex-start',
              maxWidth: '90%',
              background: 'rgba(255,255,255,0.04)',
              border: '0.5px solid rgba(255,255,255,0.07)',
              borderRadius: '14px 14px 14px 3px',
              padding: '12px 13px'
            }}>
              <div style={{
                fontSize: 8,
                fontWeight: 500,
                letterSpacing: '0.24em',
                color: 'rgba(34,211,238,0.72)',
                textTransform: 'uppercase',
                marginBottom: 8
              }}>
                Maya
              </div>
              <div style={{
                fontSize: 12,
                lineHeight: 1.7,
                color: 'var(--text-primary)'
              }}>
                {r.reply}
              </div>
            </div>
          </div>
        ))}
      </div>

      {onQuery && (
        <form
          onSubmit={handleSubmit}
          style={{
            padding: 18,
            borderTop: '0.5px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}
        >
          <div style={{
            padding: 8,
            borderRadius: 18,
            background: 'rgba(255,255,255,0.025)',
            border: '0.5px solid rgba(255,255,255,0.06)',
            boxShadow: '0 0 24px rgba(59,130,246,0.08)'
          }}>
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type to ask MAYA..."
              className="input-ui"
              style={{
                background: 'transparent',
                border: 'none',
                boxShadow: 'none',
                padding: '10px 8px'
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              alignSelf: 'flex-end',
              borderRadius: 999,
              border: '0.5px solid rgba(59,130,246,0.28)',
              background: 'rgba(59,130,246,0.14)',
              color: 'rgba(191,219,254,0.95)',
              padding: '10px 16px',
              cursor: 'pointer',
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.28em',
              textTransform: 'uppercase'
            }}
          >
            Send
          </button>
        </form>
      )}
    </div>
  )
}
