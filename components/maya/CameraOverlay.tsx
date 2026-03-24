'use client'

import { VisionPanel } from '@/components/maya/VisionPanel'

interface CameraOverlayProps {
  show: boolean
  onClose: () => void
  cameraProps: {
    videoRef: any
    canvasRef: any
    isActive: boolean
    error: string | null
  }
  screenProps: {
    screenCanvasRef: any
    screenVideoRef: any
    isScreenSharing: boolean
    screenFrames: any[]
  }
  isAnalyzing: boolean
}

export function CameraOverlay({ show, onClose, cameraProps, screenProps, isAnalyzing }: CameraOverlayProps) {
  if (!show) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 90,
      right: 24,
      width: 320,
      height: 220,
      background: '#000',
      border: '1px solid var(--border-active)',
      borderRadius: 4,
      overflow: 'hidden',
      zIndex: 500,
      boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
      animation: 'cameraSlideIn 0.25s ease forwards',
      // GPU acceleration
      transform: 'translateZ(0)',
      willChange: 'transform, opacity',
    }}>
      <VisionPanel
        videoRef={cameraProps.videoRef}
        canvasRef={cameraProps.canvasRef}
        screenCanvasRef={screenProps.screenCanvasRef}
        screenVideoRef={screenProps.screenVideoRef}
        isActive={cameraProps.isActive}
        isScreenSharing={screenProps.isScreenSharing}
        isAnalyzing={isAnalyzing}
        screenFrames={screenProps.screenFrames}
        error={cameraProps.error}
      />

      {!cameraProps.isActive && !screenProps.isScreenSharing && !cameraProps.error && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#000', gap: 10, padding: 16
        }}>
          <div style={{ fontSize: 28 }}>📷</div>
          <div style={{
            fontFamily: 'DM Mono', fontSize: 9,
            color: 'var(--text-muted)', letterSpacing: 2,
            textAlign: 'center'
          }}>
            ACTIVATING CAMERA...
          </div>
          <button
            onClick={async () => {
              try {
                const devices = await navigator.mediaDevices.enumerateDevices()
                const cams = devices.filter(d => d.kind === 'videoinput')
                alert(`Found ${cams.length} camera(s):\n${cams.map(c => c.label || c.deviceId).join('\n')}`)
              } catch (e: any) {
                alert(`Camera check failed: ${e.message}`)
              }
            }}
            style={{
              background: 'none',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              fontFamily: 'DM Mono', fontSize: 9,
              padding: '6px 14px', cursor: 'pointer',
              borderRadius: 2, marginTop: 8
            }}
          >
            CHECK CAMERAS
          </button>
        </div>
      )}

      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 6,
          right: 6,
          border: '1px solid var(--border-subtle)',
          background: 'rgba(0,0,0,0.4)',
          color: 'var(--text-primary)',
          width: 22,
          height: 22,
          borderRadius: 6,
          cursor: 'pointer'
        }}
        aria-label="Close camera"
      >
        ✕
      </button>
    </div>
  )
}
