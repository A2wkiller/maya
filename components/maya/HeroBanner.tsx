'use client'

import { useEffect, useMemo, useRef } from 'react'
import { AgentType, Status } from '@/types'

interface HeroBannerProps {
  status: Status
  focusedApp?: string
  activeAgent: AgentType
  isSpeaking?: boolean
  isListening?: boolean
}

type HudLabel = {
  label: string
  position: React.CSSProperties
}

export function HeroBanner({
  status,
  focusedApp,
  activeAgent,
  isSpeaking,
  isListening
}: HeroBannerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00035,
      vy: (Math.random() - 0.5) * 0.00035,
      r: 0.2 + Math.random() * 1.1
    }))

    let frame = 0
    let raf = 0

    const draw = () => {
      const dpr = window.devicePixelRatio || 1
      const { clientWidth, clientHeight } = canvas
      canvas.width = clientWidth * dpr
      canvas.height = clientHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      ctx.clearRect(0, 0, clientWidth, clientHeight)

      const gradient = ctx.createRadialGradient(
        clientWidth / 2,
        clientHeight / 2,
        0,
        clientWidth / 2,
        clientHeight / 2,
        Math.max(clientWidth, clientHeight) * 0.46
      )
      gradient.addColorStop(0, 'rgba(59,130,246,0.14)')
      gradient.addColorStop(0.52, 'rgba(34,211,238,0.06)')
      gradient.addColorStop(1, 'rgba(2,6,23,0)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, clientWidth, clientHeight)

      frame += 1
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > 1) p.vx *= -1
        if (p.y < 0 || p.y > 1) p.vy *= -1
        const x = p.x * clientWidth
        const y = p.y * clientHeight
        ctx.beginPath()
        ctx.fillStyle = `rgba(96,165,250,${0.12 + ((frame % 120) / 120) * 0.18})`
        ctx.arc(x, y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }

      raf = window.requestAnimationFrame(draw)
    }

    draw()
    return () => window.cancelAnimationFrame(raf)
  }, [])

  const hudLabels = useMemo<HudLabel[]>(() => ([
    { label: 'NEURAL.ACTIVE', position: { top: '21%', left: '16%' } },
    { label: 'MEM·96%', position: { top: '21%', right: '16%' } },
    { label: 'PROC·2ms', position: { bottom: '23%', left: '17%' } },
    { label: 'CTRL·ON', position: { bottom: '23%', right: '17%' } }
  ]), [])

  const readyLabel = status === 'OFFLINE' ? 'STANDBY' : isListening ? 'LISTENING' : isSpeaking ? 'SPEAKING' : 'READY'
  const promptLabel = isListening ? 'VOICE CHANNEL OPEN' : focusedApp ? focusedApp.toUpperCase() : `AGENT ${activeAgent.toUpperCase()}`

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background:
        'radial-gradient(circle at 50% 50%, rgba(59,130,246,0.18), transparent 26%), radial-gradient(circle at 50% 40%, rgba(139,92,246,0.16), transparent 34%), linear-gradient(180deg, rgba(15,23,42,0.38), rgba(2,6,23,0.22))'
    }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%'
        }}
      />

      {hudLabels.map(item => (
        <div
          key={item.label}
          style={{
            position: 'absolute',
            ...item.position,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 8,
            fontWeight: 500,
            letterSpacing: '0.28em',
            color: 'rgba(34,211,238,0.45)',
            textTransform: 'uppercase'
          }}
        >
          <div style={{
            width: 18,
            height: 1,
            background: 'rgba(34,211,238,0.4)'
          }} />
          {item.label}
        </div>
      ))}

      <div style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: 450,
        height: 450,
        marginLeft: -225,
        marginTop: -225,
        borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.03)',
        animation: 'ringSpinReverse 50s linear infinite'
      }} />
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: 405,
        height: 405,
        marginLeft: -202.5,
        marginTop: -202.5,
        borderRadius: '50%',
        border: '1px dotted rgba(139,92,246,0.45)',
        animation: 'ringSpin 35s linear infinite'
      }} />
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: 360,
        height: 360,
        marginLeft: -180,
        marginTop: -180,
        borderRadius: '50%',
        border: '1px dashed rgba(34,211,238,0.42)',
        animation: 'ringSpin 25s linear infinite'
      }} />
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: 310,
        height: 310,
        marginLeft: -155,
        marginTop: -155,
        borderRadius: '50%',
        border: '1px solid rgba(59,130,246,0.42)',
        animation: 'ringSpinReverse 18s linear infinite'
      }} />

      <ArcRing size={360} color="var(--accent-cyan)" clip="polygon(50% 0%, 100% 0%, 100% 50%, 82% 50%, 82% 18%, 50% 18%)" animation="ringSpin 7s linear infinite" />
      <ArcRing size={405} color="var(--accent-violet)" clip="polygon(18% 50%, 50% 50%, 50% 82%, 100% 82%, 100% 100%, 0% 100%, 0% 50%)" animation="ringSpinReverse 11s linear infinite" />
      <ArcRing size={310} color="var(--accent-blue)" clip="polygon(28% 0%, 72% 0%, 72% 16%, 28% 16%)" animation="ringSpinReverse 5s linear infinite" />

      <div style={{
        position: 'relative',
        width: 160,
        height: 160,
        animation: 'orbFloat 7s ease-in-out infinite'
      }}>
        <div style={{
          position: 'absolute',
          inset: -50,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.25), rgba(139,92,246,0.18) 45%, rgba(2,6,23,0) 72%)',
          filter: 'blur(18px)',
          animation: 'orbBloom 4s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 32%, rgba(255,255,255,0.92) 0%, rgba(34,211,238,0.88) 18%, rgba(59,130,246,0.72) 42%, rgba(67,56,202,0.45) 68%, rgba(2,6,23,0.98) 100%)',
          boxShadow: '0 0 60px rgba(59,130,246,0.25), inset 0 0 30px rgba(255,255,255,0.08)',
          animation: 'orbBreathe 4s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 68% 30%, rgba(139,92,246,0.28), transparent 42%), radial-gradient(circle at 28% 70%, rgba(34,211,238,0.2), transparent 40%)',
          mixBlendMode: 'screen',
          opacity: 0.85
        }} />
        <div style={{
          position: 'absolute',
          inset: 8,
          borderRadius: '50%',
          background: 'conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,0.34) 52deg, rgba(255,255,255,0) 110deg)',
          filter: 'blur(2px)',
          animation: 'shimmerSpin 7s linear infinite'
        }} />
        <GlassRing inset={-6} dotColor="var(--accent-cyan)" animation="ringSpin 8s linear infinite" />
        <GlassRing inset={-12} dotColor="var(--accent-violet)" animation="ringSpinReverse 11s linear infinite" offset={45} />
      </div>

      <div style={{
        position: 'absolute',
        left: '50%',
        bottom: 52,
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8
      }}>
        <div style={{
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.4em',
          color: 'var(--accent-cyan)',
          textTransform: 'uppercase'
        }}>
          {readyLabel}
        </div>
        <div style={{
          fontSize: 8,
          fontWeight: 400,
          letterSpacing: '0.36em',
          color: 'var(--text-muted)',
          textTransform: 'uppercase'
        }}>
          {promptLabel || 'TAP TO SPEAK'}
        </div>
      </div>
    </div>
  )
}

function ArcRing({
  size,
  color,
  clip,
  animation
}: {
  size: number
  color: string
  clip: string
  animation: string
}) {
  return (
    <div style={{
      position: 'absolute',
      left: '50%',
      top: '50%',
      width: size,
      height: size,
      marginLeft: -size / 2,
      marginTop: -size / 2,
      borderRadius: '50%',
      border: `1px solid ${color}`,
      clipPath: clip,
      opacity: 0.9,
      animation
    }} />
  )
}

function GlassRing({
  inset,
  dotColor,
  animation,
  offset = 0
}: {
  inset: number
  dotColor: string
  animation: string
  offset?: number
}) {
  return (
    <div style={{
      position: 'absolute',
      inset,
      borderRadius: '50%',
      border: '0.5px solid rgba(34,211,238,0.45)',
      animation,
      transform: `rotate(${offset}deg)`
    }}>
      <div style={{
        position: 'absolute',
        top: -2,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: dotColor,
        boxShadow: `0 0 14px ${dotColor}`
      }} />
    </div>
  )
}
