'use client'
import { useRef } from 'react'

interface VisionPanelProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  screenCanvasRef: React.RefObject<HTMLCanvasElement | null>
  screenVideoRef: React.RefObject<HTMLVideoElement | null>
  isActive: boolean
  isScreenSharing: boolean
  isAnalyzing: boolean
  screenFrames: string[]
  error: string | null
}

const MAX_FRAMES = 8

export function VisionPanel({
  videoRef,
  canvasRef,
  screenCanvasRef,
  screenVideoRef,
  isActive,
  isScreenSharing,
  isAnalyzing,
  screenFrames,
  error
}: VisionPanelProps) {
  return (
    <div style={{
      flex: 6,
      background: '#000',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Main video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'contrast(1.02) saturate(0.95)',
          opacity: isActive || isScreenSharing ? 1 : 0,
          transition: 'opacity 0.3s ease',
          // GPU acceleration hints
          transform: 'translateZ(0)',
          willChange: 'transform',
          backfaceVisibility: 'hidden'
        }}
      />

      {/* Hidden elements */}
      <canvas ref={canvasRef} width={640} height={480}
        style={{ display: 'none' }} />
      <canvas ref={screenCanvasRef}
        style={{ display: 'none' }} />
      <video ref={screenVideoRef} autoPlay playsInline muted
        style={{
          position: 'fixed', top: -9999, left: -9999,
          width: 1, height: 1, opacity: 0,
          pointerEvents: 'none'
        }}
      />

      {/* Scan line */}
      {(isActive || isScreenSharing) && (
        <div style={{
          position: 'absolute',
          left: 0, right: 0,
          height: 1,
          background: 'linear-gradient(90deg, transparent 0%, rgba(201,169,110,0.5) 50%, transparent 100%)',
          animation: 'scanLine 4s linear infinite',
          pointerEvents: 'none'
        }} />
      )}

      {/* Bottom info bar */}
      {(isActive || isScreenSharing) && (
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          padding: '14px 20px',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end'
        }}>
          <div style={{
            fontFamily: 'DM Mono',
            fontSize: 10,
            letterSpacing: 3,
            color: isScreenSharing
              ? 'var(--status-online)'
              : 'var(--text-muted)'
          }}>
            {isScreenSharing ? '⬜ SCREEN SHARE' : '◎ LIVE FEED'}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            {/* Frame dots */}
            {isScreenSharing && (
              <div style={{
                display: 'flex',
                gap: 4,
                alignItems: 'center'
              }}>
                {Array.from({ length: MAX_FRAMES }).map((_, i) => (
                  <div key={i} style={{
                    width: 4, height: 4,
                    borderRadius: '50%',
                    background: i < screenFrames.length
                      ? 'var(--accent-gold)'
                      : 'rgba(255,255,255,0.08)',
                    transition: 'all 0.3s ease',
                    boxShadow: i < screenFrames.length
                      ? '0 0 4px rgba(201,169,110,0.5)'
                      : 'none'
                  }} />
                ))}
                <span style={{
                  fontFamily: 'DM Mono',
                  fontSize: 9,
                  color: screenFrames.length >= 4
                    ? 'var(--status-online)'
                    : 'var(--accent-gold)',
                  letterSpacing: 1,
                  marginLeft: 4
                }}>
                  {screenFrames.length >= 4
                    ? 'FEED STABLE'
                    : 'BUFFERING'}
                </span>
              </div>
            )}

            {isAnalyzing && (
              <div style={{
                fontFamily: 'DM Mono',
                fontSize: 10,
                color: 'var(--accent-gold)',
                letterSpacing: 3,
                animation: 'breathe 0.8s ease infinite'
              }}>
                ANALYZING
              </div>
            )}
          </div>
        </div>
      )}

      {/* Standby state */}
      {!isActive && !isScreenSharing && !error && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          background: 'radial-gradient(ellipse at center, #0e0e0e 0%, #000 100%)'
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `
              linear-gradient(rgba(201,169,110,0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(201,169,110,0.025) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px'
          }} />
          <div style={{
            width: 1, height: 52,
            background: 'linear-gradient(transparent, rgba(201,169,110,0.3), transparent)'
          }} />
          <div style={{
            fontFamily: 'Syne',
            fontSize: 11,
            letterSpacing: 6,
            color: 'var(--text-muted)',
            fontWeight: 600,
            zIndex: 1
          }}>STANDBY</div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(8,3,3,0.97)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          padding: 32
        }}>
          <div style={{
            width: 1, height: 40,
            background: 'linear-gradient(transparent, var(--red-alert), transparent)'
          }} />
          <div style={{
            fontFamily: 'Syne',
            fontWeight: 600,
            fontSize: 11,
            letterSpacing: 3,
            color: 'var(--red-alert)',
            textAlign: 'center',
            maxWidth: 280,
            lineHeight: 2
          }}>
            {error}
          </div>
          <button
            onClick={() => window.open(window.location.href, '_blank')}
            className="btn btn-red"
          >
            OPEN IN NEW TAB
          </button>
          <div style={{
            fontFamily: 'DM Mono',
            fontSize: 9,
            color: 'var(--text-muted)',
            textAlign: 'center',
            letterSpacing: 1,
            lineHeight: 2
          }}>
            Click 🔒 in address bar → Camera → Allow → Refresh
          </div>
        </div>
      )}
    </div>
  )
}
