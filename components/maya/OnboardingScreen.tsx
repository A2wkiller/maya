'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { KEYS } from '@/lib/keys'

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void
}

export interface UserProfile {
  name: string
  occupation: string
  interests: string[]
  language: 'en' | 'hi'
  businesses: string
  goals: string
}

export function OnboardingScreen({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    occupation: '',
    interests: [],
    language: 'en',
    businesses: '',
    goals: ''
  })
  const [keysValid, setKeysValid] = useState({
    gemini: false,
    groq: false,
    supabase: false
  })

  const steps = [
    { title: 'WELCOME', subtitle: 'Your personal AI OS' },
    { title: 'API KEYS', subtitle: 'Connect your AI services' },
    { title: 'ABOUT YOU', subtitle: 'Help MAYA know you' },
    { title: 'YOUR WORK', subtitle: 'What do you do?' },
    { title: 'PREFERENCES', subtitle: 'How should MAYA talk?' },
    { title: 'ALL SET', subtitle: 'MAYA is ready' },
  ]

  const validateKeys = async () => {
    // Test Gemini key
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${KEYS.gemini}`
      )
      setKeysValid(prev => ({ ...prev, gemini: r.ok }))
    } catch {}

    // Test Groq key
    try {
      const r = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${KEYS.groq}` }
      })
      setKeysValid(prev => ({ ...prev, groq: r.ok }))
    } catch {}

    // Test Supabase
    try {
      const { error } = await supabase.from('memories').select('id').limit(1)
      setKeysValid(prev => ({ ...prev, supabase: !error }))
    } catch {}
  }

  const saveProfile = async () => {
    // Save to localStorage for instant access
    localStorage.setItem('maya_user_profile', JSON.stringify(profile))
    localStorage.setItem('maya_onboarding_done', 'true')

    // Save to Supabase memories for AI context
    try {
      await supabase.from('memories').insert([
        {
          content: `User name: ${profile.name}`,
          category: 'identity',
          source: 'onboarding'
        },
        {
          content: `Occupation: ${profile.occupation}`,
          category: 'work',
          source: 'onboarding'
        },
        {
          content: `Interests: ${profile.interests.join(', ')}`,
          category: 'personal',
          source: 'onboarding'
        },
        {
          content: `Businesses/Projects: ${profile.businesses}`,
          category: 'work',
          source: 'onboarding'
        },
        {
          content: `Goals: ${profile.goals}`,
          category: 'goals',
          source: 'onboarding'
        },
      ])
    } catch (e) {
      console.log('Could not save to Supabase:', e)
    }

    onComplete(profile)
  }

  const interestOptions = [
    'Coding', 'Design', 'Gaming', 'Business',
    'Music', 'Photography', 'Travel', 'Fitness',
    'Writing', 'Learning', 'Anime', 'Finance'
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#020617',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 40
    }}>
      {/* Logo */}
      <div style={{
        fontFamily: 'Syne, sans-serif',
        fontWeight: 800, fontSize: 36,
        letterSpacing: 16, color: 'var(--accent-gold)',
        marginBottom: 8
      }}>
        MAYA
      </div>
      <div style={{
        fontFamily: 'DM Mono', fontSize: 9,
        letterSpacing: 4, color: 'var(--text-muted)',
        marginBottom: 48
      }}>
        PERSONAL AI OS
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 40 }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            width: i === step ? 24 : 6,
            height: 6, borderRadius: 3,
            background: i <= step
              ? 'var(--accent-gold)'
              : 'var(--border-subtle)',
            transition: 'all 0.3s ease'
          }} />
        ))}
      </div>

      {/* Step content */}
      <div style={{
        width: '100%', maxWidth: 480,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-active)',
        borderRadius: 4, padding: 40,
        animation: 'fadeUp 0.3s ease'
      }}>
        <div style={{
          fontFamily: 'Syne', fontWeight: 700,
          fontSize: 20, letterSpacing: 6,
          color: 'var(--accent-gold)',
          marginBottom: 8
        }}>
          {steps[step].title}
        </div>
        <div style={{
          fontFamily: 'DM Mono', fontSize: 10,
          color: 'var(--text-muted)', letterSpacing: 2,
          marginBottom: 32
        }}>
          {steps[step].subtitle}
        </div>

        {/* STEP 0 — Welcome */}
        {step === 0 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'Syne', fontSize: 16,
              color: 'var(--text-primary)', marginBottom: 16,
              lineHeight: 1.6
            }}>
              MAYA is your personal AI operating system.
            </div>
            <div style={{
              fontFamily: 'DM Mono', fontSize: 11,
              color: 'var(--text-muted)', lineHeight: 1.8,
              marginBottom: 32
            }}>
              She learns who you are, manages your work,
              controls your computer, and gets smarter every day.
              Take 2 minutes to set her up.
            </div>
          </div>
        )}

        {/* STEP 1 — API Keys */}
        {step === 1 && (
          <div>
            <div style={{
              fontFamily: 'DM Mono', fontSize: 10,
              color: 'var(--text-muted)', marginBottom: 20,
              lineHeight: 1.8
            }}>
              MAYA needs API keys to work. All are free.
              Add them to your .env.local file.
            </div>
            {[
              { key: 'gemini', label: 'GEMINI KEY', url: 'aistudio.google.com', valid: keysValid.gemini },
              { key: 'groq', label: 'GROQ KEY', url: 'console.groq.com', valid: keysValid.groq },
              { key: 'supabase', label: 'SUPABASE', url: 'supabase.com', valid: keysValid.supabase },
            ].map(k => (
              <div key={k.key} style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: '1px solid var(--border-subtle)'
              }}>
                <div>
                  <div style={{
                    fontFamily: 'DM Mono', fontSize: 10,
                    color: 'var(--text-secondary)', letterSpacing: 2
                  }}>
                    {k.label}
                  </div>
                  <div style={{
                    fontFamily: 'DM Mono', fontSize: 9,
                    color: 'var(--text-muted)'
                  }}>
                    {k.url}
                  </div>
                </div>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: k.valid
                    ? 'var(--status-online)'
                    : 'var(--text-muted)'
                }} />
              </div>
            ))}
            <button
              onClick={validateKeys}
              style={{
                marginTop: 20,
                background: 'none',
                border: '1px solid var(--border-active)',
                color: 'var(--accent-gold)',
                fontFamily: 'DM Mono', fontSize: 9,
                letterSpacing: 2, padding: '8px 16px',
                cursor: 'pointer', borderRadius: 2,
                width: '100%'
              }}
            >
              TEST KEYS
            </button>
          </div>
        )}

        {/* STEP 2 — About you */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <input
              value={profile.name}
              onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
              placeholder="Your name..."
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontFamily: 'DM Mono', fontSize: 12,
                padding: '12px 16px', borderRadius: 2,
                outline: 'none', letterSpacing: 1
              }}
            />
            <div style={{
              fontFamily: 'DM Mono', fontSize: 9,
              color: 'var(--text-muted)', letterSpacing: 2,
              marginTop: 8
            }}>
              INTERESTS (select all that apply)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {interestOptions.map(interest => (
                <button
                  key={interest}
                  onClick={() => setProfile(p => ({
                    ...p,
                    interests: p.interests.includes(interest)
                      ? p.interests.filter(i => i !== interest)
                      : [...p.interests, interest]
                  }))}
                  style={{
                    padding: '6px 14px',
                    fontFamily: 'DM Mono', fontSize: 9,
                    letterSpacing: 1,
                    border: profile.interests.includes(interest)
                      ? '1px solid rgba(201,169,110,0.5)'
                      : '1px solid var(--border-subtle)',
                    background: profile.interests.includes(interest)
                      ? 'var(--accent-gold-dim)'
                      : 'transparent',
                    color: profile.interests.includes(interest)
                      ? 'var(--accent-gold)'
                      : 'var(--text-muted)',
                    cursor: 'pointer', borderRadius: 2,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3 — Work */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <input
              value={profile.occupation}
              onChange={e => setProfile(p => ({ ...p, occupation: e.target.value }))}
              placeholder="What do you do? (e.g. Student, Developer, Designer...)"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontFamily: 'DM Mono', fontSize: 11,
                padding: '12px 16px', borderRadius: 2,
                outline: 'none', letterSpacing: 0.5
              }}
            />
            <textarea
              value={profile.businesses}
              onChange={e => setProfile(p => ({ ...p, businesses: e.target.value }))}
              placeholder="Any projects, businesses, or side hustles? Tell MAYA..."
              rows={3}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontFamily: 'DM Mono', fontSize: 11,
                padding: '12px 16px', borderRadius: 2,
                outline: 'none', letterSpacing: 0.5,
                resize: 'none', lineHeight: 1.6
              }}
            />
            <textarea
              value={profile.goals}
              onChange={e => setProfile(p => ({ ...p, goals: e.target.value }))}
              placeholder="What are your main goals right now?"
              rows={2}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontFamily: 'DM Mono', fontSize: 11,
                padding: '12px 16px', borderRadius: 2,
                outline: 'none', letterSpacing: 0.5,
                resize: 'none', lineHeight: 1.6
              }}
            />
          </div>
        )}

        {/* STEP 4 — Language */}
        {step === 4 && (
          <div>
            <div style={{
              fontFamily: 'DM Mono', fontSize: 10,
              color: 'var(--text-muted)', marginBottom: 20,
              lineHeight: 1.8
            }}>
              How should MAYA talk to you?
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { value: 'en', label: 'ENGLISH', desc: 'Clean casual English' },
                { value: 'hi', label: 'हिंदी', desc: 'Hinglish — desi style' }
              ].map(l => (
                <button
                  key={l.value}
                  onClick={() => setProfile(p => ({
                    ...p, language: l.value as 'en' | 'hi'
                  }))}
                  style={{
                    flex: 1, padding: '16px',
                    border: profile.language === l.value
                      ? '1px solid rgba(201,169,110,0.5)'
                      : '1px solid var(--border-subtle)',
                    background: profile.language === l.value
                      ? 'var(--accent-gold-dim)'
                      : 'var(--bg-elevated)',
                    color: profile.language === l.value
                      ? 'var(--accent-gold)'
                      : 'var(--text-muted)',
                    cursor: 'pointer', borderRadius: 2,
                    textAlign: 'left', transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    fontFamily: 'Syne', fontWeight: 700,
                    fontSize: 11, letterSpacing: 3,
                    marginBottom: 6
                  }}>
                    {l.label}
                  </div>
                  <div style={{
                    fontFamily: 'DM Mono', fontSize: 9,
                    opacity: 0.7
                  }}>
                    {l.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5 — All set */}
        {step === 5 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
            <div style={{
              fontFamily: 'Syne', fontSize: 16,
              color: 'var(--text-primary)', marginBottom: 12,
              lineHeight: 1.6
            }}>
              MAYA is configured for {profile.name || 'you'}.
            </div>
            <div style={{
              fontFamily: 'DM Mono', fontSize: 10,
              color: 'var(--text-muted)', lineHeight: 1.8
            }}>
              She will learn more about you every conversation
              and get smarter over time.
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          marginTop: 32, gap: 12
        }}>
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              style={{
                background: 'none',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                fontFamily: 'DM Mono', fontSize: 9,
                letterSpacing: 2, padding: '10px 20px',
                cursor: 'pointer', borderRadius: 2
              }}
            >
              BACK
            </button>
          )}
          <button
            onClick={() => {
              if (step < steps.length - 1) {
                setStep(s => s + 1)
              } else {
                saveProfile()
              }
            }}
            style={{
              flex: 1,
              background: 'var(--accent-gold-dim)',
              border: '1px solid rgba(201,169,110,0.4)',
              color: 'var(--accent-gold)',
              fontFamily: 'Syne', fontWeight: 700,
              fontSize: 11, letterSpacing: 4,
              padding: '12px 24px',
              cursor: 'pointer', borderRadius: 2,
              transition: 'all 0.2s ease'
            }}
          >
            {step === steps.length - 1
              ? 'LAUNCH MAYA'
              : step === 0 ? 'GET STARTED' : 'NEXT'}
          </button>
        </div>
      </div>
    </div>
  )
}
