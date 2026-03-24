'use client'
import { useState, useCallback, useRef, useEffect, type CSSProperties } from 'react'
import { TopBar } from '@/components/maya/TopBar'
import { ResponseLog } from '@/components/maya/ResponseLog'
import { ControlBar } from '@/components/maya/ControlBar'
import { HeroBanner } from '@/components/maya/HeroBanner'
import { QuickActionsPanel } from '@/components/maya/QuickActionsPanel'
import { OnboardingScreen, type UserProfile } from '@/components/maya/OnboardingScreen'
import dynamic from 'next/dynamic'
import { useCamera, useCameraPrewarm } from '@/hooks/useCamera'
import { useScreenShare } from '@/hooks/useScreenShare'
import { useWhisperVoice } from '@/hooks/useWhisperVoice'
import { useAlwaysListening } from '@/hooks/useVoice'
import { useSpeech } from '@/hooks/useSpeech'
import { detectIntent, needsVisual } from '@/lib/maya-brain'
import { KEYS } from '@/lib/keys'
import * as system from '@/lib/system'
import * as ctrl from '@/lib/controller'
import { AgentType, Language, Message, Status } from '@/types'
import { SettingsPanel } from '@/components/maya/SettingsPanel'
import { buildBriefing, shouldShowBriefing } from '@/lib/briefing'

const CameraOverlay = dynamic(
  () => import('@/components/maya/CameraOverlay').then(m => ({ default: m.CameraOverlay })),
  { ssr: false }
)

type AgentActionResult = {
  type: 'pdf' | 'file' | 'memory' | 'system'
  operation: string
  success: boolean
  result: any
}

type ComputerAction =
  | { type: 'youtube_search'; query: string }
  | { type: 'google_search'; query: string }
  | { type: 'open_site'; site: string }
  | { type: 'browser_action'; action: string; value?: string }
  | { type: 'open_app'; app: string }
  | { type: 'volume'; action: string }
  | { type: 'type'; text: string }
  | { type: 'screenshot' }
  | { type: 'sysinfo' }

export default function MAYAPage() {
  const [onboardingDone, setOnboardingDone] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [status, setStatus] = useState<Status>('OFFLINE')
  const [language, setLanguage] = useState<Language>('en')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false)
  const [responses, setResponses] = useState<Message[]>([])
  const [conversationHistory, setConversationHistory] = useState<any[]>([])
  const [activeAgent, setActiveAgent] = useState<AgentType>('general')
  const [showSummary, setShowSummary] = useState(false)
  const [summaryText, setSummaryText] = useState('')
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [apiKey, setApiKey] = useState(KEYS.gemini || '')
  const [clipboardSuggestion, setClipboardSuggestion] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [clipboardWatchEnabled, setClipboardWatchEnabled] = useState(false)
  const [morningBriefingEnabled, setMorningBriefingEnabled] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [alwaysListening, setAlwaysListening] = useState(false)
  const [focusedApp, setFocusedApp] = useState('')
  const [showCameraOverlay, setShowCameraOverlay] = useState(false)
  const [activePanel, setActivePanel] = useState<'mem' | 'act' | 'chat' | null>('chat')
  const [ctrlOnline, setCtrlOnline] = useState(false)
  useCameraPrewarm()

  const camera = useCamera()
  const screenShare = useScreenShare(camera.videoRef, camera.streamRef as any)
  const speech = useSpeech()
  const currentIdRef = useRef(`msg-${Date.now()}`)

  const runControllerAction = useCallback(async (computerAction: ComputerAction) => {
    const online = await ctrl.ctrlOnline()

    switch (computerAction.type) {
      case 'youtube_search': {
        if (online) {
          await ctrl.youtubeSearch(computerAction.query)
        } else {
          const url = `https://www.youtube.com/results?search_query=${computerAction.query.replace(/ /g, '+')}`
          ;(window as any)?.mayaSystem?.openUrl?.(url)
        }
        break
      }
      case 'google_search': {
        if (online) {
          await ctrl.googleSearch(computerAction.query)
        } else {
          const url = `https://www.google.com/search?q=${computerAction.query.replace(/ /g, '+')}`
          ;(window as any)?.mayaSystem?.openUrl?.(url)
        }
        break
      }
      case 'open_site': {
        if (online) {
          await ctrl.openSite(computerAction.site)
        } else {
          ;(window as any)?.mayaSystem?.openUrl?.(`https://${computerAction.site}.com`)
        }
        break
      }
      case 'open_app': {
        if (online) await ctrl.openApp(computerAction.app)
        else (window as any)?.mayaSystem?.openApp?.(computerAction.app)
        break
      }
      case 'volume': {
        if (online) await ctrl.setVolume(computerAction.action)
        break
      }
      case 'type': {
        if (online) await ctrl.typeText(computerAction.text)
        break
      }
      case 'screenshot': {
        if (online) {
          const ss = await ctrl.screenshot()
          if ((ss as any).success) {
            speech.speak('Screenshot taken Boss.', language)
          }
        }
        break
      }
      case 'sysinfo': {
        if (online) {
          const info = await ctrl.sysInfo()
          if ((info as any).success) {
            speech.speak(
              `CPU at ${info.cpu}%, RAM ${info.ram}% used Boss.`,
              language
            )
          }
        }
        break
      }
      case 'browser_action': {
        if (online) {
          await ctrl.browserSmartAction(computerAction.action, computerAction.value)
        }
        break
      }
    }
  }, [language, speech])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const done = localStorage.getItem('maya_onboarding_done')
    const profile = localStorage.getItem('maya_user_profile')
    if (done && profile) {
      setOnboardingDone(true)
      try {
        setUserProfile(JSON.parse(profile))
      } catch {
        setUserProfile(null)
      }
    }
  }, [])

  const handleOnboardingComplete = useCallback((profile: UserProfile) => {
    setUserProfile(profile)
    setOnboardingDone(true)
  }, [])

  const handleComputerAction = useCallback(async (question: string, reply: string) => {
    const lower = question.toLowerCase()

    if (lower.includes('open youtube')) return system.openUrl('https://youtube.com')
    if (lower.includes('open instagram')) return system.openUrl('https://instagram.com')
    if (lower.includes('open github')) return system.openUrl('https://github.com')
    if (lower.includes('open gmail')) return system.openUrl('https://mail.google.com')
    if (lower.includes('open whatsapp')) return system.openUrl('https://web.whatsapp.com')
    if (lower.includes('open spotify')) return system.openUrl('https://open.spotify.com')
    if (lower.includes('open netflix')) return system.openUrl('https://netflix.com')

    if (lower.includes('open vscode') || lower.includes('open vs code')) return system.openApp('vscode')
    if (lower.includes('open notepad')) return system.openApp('notepad')
    if (lower.includes('open calculator')) return system.openApp('calculator')
    if (lower.includes('open file manager') || lower.includes('open explorer')) return system.openApp('explorer')
    if (lower.includes('open chrome')) return system.openApp('chrome')
    if (lower.includes('open discord')) return system.openApp('discord')

    if (lower.includes('cpu') || lower.includes('ram') ||
        lower.includes('system info') || lower.includes('system check')) {
      return system.systemInfo()
    }

    if (lower.includes('is installed') || lower.includes('do i have') ||
        lower.includes('installed hai')) {
      const softwares = ['vscode', 'node', 'python', 'git', 'docker', 'java']
      const found = softwares.find(s => lower.includes(s))
      if (found) return system.checkSoftware(found)
    }

    if (lower.includes('volume up')) return system.volume('up')
    if (lower.includes('volume down')) return system.volume('down')
    if (lower.includes('mute')) return system.volume('mute')
    if (lower.includes('list files') || lower.includes('show files')) return system.listFiles('~')

    return null
  }, [])

  const handleQuery = useCallback(async (question: string) => {
    if (!question?.trim()) return

    setIsAnalyzing(true)
    setStatus('THINKING')

    const agent = detectIntent(question)
    setActiveAgent(agent)

    const useImage = needsVisual(question)
    const base64Image = useImage
      ? screenShare.isScreenSharing
        ? screenShare.captureScreen()
        : camera.captureFrame()
      : null

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          base64Image,
          extraFrames: screenShare.screenFrames.slice(-1),
          language,
          isScreenSharing: screenShare.isScreenSharing,
          conversationHistory: conversationHistory.slice(-4),
          apiKey,
          profile: userProfile
        })
      })

      if (!res.ok || !res.body) throw new Error('API error')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullReply = ''
      let hasSpoken = false
      let agentAction: AgentActionResult | null = null
      let computerAction: ComputerAction | null = null
      let currentEvent = 'message'

      setIsAnalyzing(false)
      setStatus('SPEAKING')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n')) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim()
            continue
          }
          if (!line.startsWith('data: ')) continue

          try {
            const data = JSON.parse(line.slice(6))
            if (currentEvent === 'token' && (data.content || data.text)) {
              const token = data.content || data.text
              fullReply += token
              setResponses(prev => prev.map(m =>
                m.id === currentIdRef.current ? { ...m, reply: fullReply } : m
              ))

              if (!hasSpoken) {
                const endsWithPunctuation = /[.!?\n]/.test(fullReply)
                const longEnough = fullReply.trim().length >= 35
                if (endsWithPunctuation || longEnough) {
                  hasSpoken = true
                  speech.stop()
                  setTimeout(() => speech.speak(fullReply, language), 0)
                }
              }
            }

            if (currentEvent === 'done') {
              computerAction = data.computerAction ?? null
              if (!hasSpoken && fullReply.trim()) {
                speech.speak(fullReply, language)
              } else if (hasSpoken) {
                setTimeout(() => {
                  speech.stop()
                  speech.speak(fullReply, language)
                }, 300)
              }

              setConversationHistory(prev => [...prev, { question, reply: fullReply }].slice(-20))
              setStatus(camera.isActive || screenShare.isScreenSharing ? 'ONLINE' : 'OFFLINE')
            }
          } catch (err) {
            console.error('Stream parse error:', err)
          }
        }
      }

      if (computerAction) {
        await runControllerAction(computerAction)
      }

      if (fullReply) {
        if (system.isElectron()) {
          const actionResult = await handleComputerAction(question, fullReply)
          if (actionResult?.success) {
            system.notify('MAYA', `Done Boss - ${question.slice(0, 50)}`)
          }
          if (actionResult) {
            agentAction = {
              type: 'system',
              operation: 'client-action',
              success: !!actionResult.success,
              result: actionResult
            }
          }
        }

        speech.speak(fullReply, language)
        setStatus('SPEAKING')
        setConversationHistory(prev => [...prev, { question, reply: fullReply }].slice(-20))
        setResponses(prev => {
          const exists = prev.some(m => m.id === currentIdRef.current)
          if (exists) {
            return prev.map(m =>
              m.id === currentIdRef.current
                ? { ...m, question, reply: fullReply, agent, agentAction }
                : m
            )
          }
          return [{
            id: currentIdRef.current,
            question,
            reply: fullReply,
            agent,
            agentAction,
            timestamp: new Date(),
            language,
            hasImage: !!base64Image,
            isConversation: true
          } as Message, ...prev].slice(0, 30)
        })
        currentIdRef.current = `msg-${Date.now()}`
      }
    } catch (err: any) {
      console.error('Query failed:', err)
      const errMsg = language === 'hi'
        ? 'Kuch problem aa gayi Boss. Dobara try karo.'
        : language === 'mr'
        ? 'Kahitari problem zali Boss. Parat prayatna kara.'
        : 'Something went wrong Boss. Try again.'
      speech.speak(errMsg, language)
    } finally {
      setIsAnalyzing(false)
      setStatus(camera.isActive || screenShare.isScreenSharing ? 'ONLINE' : 'OFFLINE')
    }
  }, [
    language, camera, screenShare, speech,
    conversationHistory, handleComputerAction, runControllerAction, apiKey, userProfile
  ])

  const voice = useWhisperVoice((text) => {
    const lower = text.toLowerCase()
    if (wakeWordEnabled && (lower.includes('hey maya') || lower.includes('hi maya'))) {
      speech.speak(language === 'hi' ? 'Haan Boss?' : 'Yes Boss?', language)
    } else if (lower.includes('show camera') || lower.includes('camera on')) {
      setShowCameraOverlay(true)
      camera.show()
    } else if (lower.includes('hide camera') || lower.includes('camera off')) {
      setShowCameraOverlay(false)
      camera.hide()
    } else {
      handleQuery(text)
    }
  }, language)

  const alwaysVoice = useAlwaysListening(
    () => {
      setStatus('LISTENING')
      try { speech.playChime?.() } catch {}
    },
    (cmd) => {
      setStatus('LISTENING')
      handleQuery(cmd)
    },
    language
  )

  useEffect(() => {
    if (alwaysListening) alwaysVoice.start()
    else alwaysVoice.stop()
  }, [alwaysListening, alwaysVoice])

  useEffect(() => {
    if (!system.isElectron()) return
    let mounted = true
    const sync = async () => {
      const res = await system.getListeningStatus()
      if (mounted && (res as any)?.success) setAlwaysListening(!!(res as any).listening)
    }
    sync()
    system.onAlwaysListeningStarted?.(() => setAlwaysListening(true))
    const focusListener = (_: any, appName?: string) => {
      if (appName) setFocusedApp(appName)
    }
    const stopListener = () => setAlwaysListening(false)
    system.onWindowFocus?.(focusListener)
    ;(system as any).onAlwaysListeningStopped?.(stopListener)
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).mayaSystem) {
      ;(window as any).mayaSystem.testIPC().catch((e: any) => {
        console.error('IPC test failed:', e)
      })
    }
  }, [])

  useEffect(() => {
    let mounted = true
    const check = async () => {
      const online = await ctrl.ctrlOnline()
      if (mounted) setCtrlOnline(online)
    }
    check()
    const t = setInterval(check, 5000)
    return () => {
      mounted = false
      clearInterval(t)
    }
  }, [])

  useEffect(() => {
    if (!system.isElectron()) return
    if (alwaysListening) system.startAlwaysListening()
    else system.stopAlwaysListening()
  }, [alwaysListening])

  useEffect(() => {
    if (!system.isElectron()) return
    if (clipboardWatchEnabled) system.startClipboardWatch()
    else system.stopClipboardWatch()
  }, [clipboardWatchEnabled])

  useEffect(() => {
    if (!system.isElectron()) return
    const listener = (_: any, payload: any) => {
      const value = typeof payload === 'string' ? payload : payload?.text
      if (value) setClipboardSuggestion(value)
    }
    system.onClipboardChanged(listener)
  }, [])

  useEffect(() => {
    if (!morningBriefingEnabled || typeof window === 'undefined') return
    const last = localStorage.getItem('maya-briefing-last') || undefined
    if (shouldShowBriefing(last)) {
      const briefing = buildBriefing()
      const text = `Good morning Boss. ${briefing.items.join('. ')}`
      setTimeout(() => speech.speak(text, language), 800)
      localStorage.setItem('maya-briefing-last', briefing.date)
    }
  }, [morningBriefingEnabled, language, speech])

  const handleActivate = useCallback(async () => {
    if (!apiKey.trim()) return
    setStatus('ONLINE')
    camera.startBackground()
    setTimeout(() => {
      speech.speak(
        language === 'hi'
          ? 'MAYA active hai Boss. Batao kya karna hai.'
          : 'MAYA is active Boss. What do you need?',
        language
      )
    }, 600)
  }, [apiKey, camera, speech, language])

  const handleShutdown = useCallback(() => {
    camera.stop()
    screenShare.stop()
    speech.stop()
    voice.stop()
    setStatus('OFFLINE')
    setIsAnalyzing(false)
    setResponses([])
    setConversationHistory([])
  }, [camera, screenShare, speech, voice])

  const handleScreenShare = useCallback(async () => {
    await screenShare.start()
    setTimeout(() => {
      speech.speak(
        language === 'hi'
          ? 'Screen share shuru Boss. Kya dekhna hai?'
          : 'Screen share active Boss. Ask me anything.',
        language
      )
    }, 800)
  }, [screenShare, speech, language])

  const handleSummary = useCallback(async () => {
    if (!conversationHistory.length) return
    setShowSummary(true)
    setIsGeneratingSummary(true)
    setSummaryText('')
    try {
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationHistory, language })
      })
      const data = await res.json()
      setSummaryText(data.reply || '')
      speech.speak(
        language === 'hi'
          ? 'Session summary ready hai Boss.'
          : 'Session summary ready Boss.',
        language
      )
    } finally {
      setIsGeneratingSummary(false)
    }
  }, [conversationHistory, language, speech])

  const handleSpeak = useCallback(() => {
    if (speech.isSpeaking) {
      speech.stop()
      return
    }
    if (responses.length > 0) speech.speak(responses[0].reply, language)
  }, [speech, responses, language])

  const handleLanguageToggle = useCallback(() => {
    const newLang = language === 'en' ? 'hi' : 'en'
    setLanguage(newLang)
    setTimeout(() => {
      speech.speak(
        newLang === 'hi' ? 'Hindi mode on Boss.' : 'Switched to English Boss.',
        newLang
      )
    }, 200)
  }, [language, speech])

  if (!onboardingDone) {
    return (
      <OnboardingScreen onComplete={handleOnboardingComplete} />
    )
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'grid',
      gridTemplateColumns: '64px minmax(0,1fr) 300px',
      gridTemplateRows: '52px minmax(0,1fr) 96px',
      background: 'var(--bg-void)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <TopBar
        status={status}
        activeAgent={activeAgent}
        language={language}
        ctrlOnline={ctrlOnline}
        onLanguageToggle={handleLanguageToggle}
        onSettingsClick={() => {
          setSettingsOpen(true)
          setActivePanel(null)
        }}
      />

      <QuickActionsPanel
        responses={responses}
        activePanel={activePanel}
        onPanelChange={(panel) => {
          setActivePanel(panel)
          if (panel !== null) setSettingsOpen(false)
        }}
        onOpenSettings={() => {
          setSettingsOpen(true)
          setActivePanel(null)
        }}
        onClear={() => {
          setResponses([])
          setConversationHistory([])
        }}
        onToggleCamera={() => setShowCameraOverlay(v => !v)}
        cameraOn={showCameraOverlay}
        onScreenShare={handleScreenShare}
      />

      <div style={{
        gridColumn: '2 / 3',
        gridRow: '2 / 3',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <HeroBanner
          status={status}
          focusedApp={focusedApp}
          activeAgent={activeAgent}
          isSpeaking={speech.isSpeaking}
          isListening={voice.isListening || alwaysListening}
        />
      </div>

      <ResponseLog
        responses={responses}
        onClear={() => {
          setResponses([])
          setConversationHistory([])
        }}
        search={searchTerm}
        onSearchChange={setSearchTerm}
        onQuery={handleQuery}
      />

      <ControlBar
        apiKey={apiKey}
        isActive={camera.isActive}
        isScreenSharing={screenShare.isScreenSharing}
        showCameraOverlay={showCameraOverlay}
        isListening={voice.isListening}
        isSpeaking={speech.isSpeaking}
        isMuted={speech.isMuted}
        wakeWordEnabled={wakeWordEnabled}
        language={language}
        conversationHistory={conversationHistory}
        transcript={voice.transcript}
        recordingTime={voice.recordingTime}
        onApiKeyChange={setApiKey}
        onActivate={handleActivate}
        onShutdown={handleShutdown}
        onListen={voice.start}
        onStopListen={voice.stop}
        onSpeak={handleSpeak}
        onToggleMute={speech.toggleMute}
        onToggleWakeWord={() => setWakeWordEnabled(p => !p)}
        onScreenShare={handleScreenShare}
        onStopScreenShare={screenShare.stop}
        onShowCamera={async () => {
          if (!showCameraOverlay) await camera.show()
          setShowCameraOverlay(v => !v)
        }}
        onSummary={handleSummary}
      />

      <CameraOverlay
        show={showCameraOverlay}
        onClose={() => {
          setShowCameraOverlay(false)
          camera.hide()
        }}
        cameraProps={{
          videoRef: camera.videoRef,
          canvasRef: camera.canvasRef,
          isActive: camera.isActive,
          error: camera.error
        }}
        screenProps={{
          screenCanvasRef: screenShare.screenCanvasRef,
          screenVideoRef: screenShare.screenVideoRef,
          isScreenSharing: screenShare.isScreenSharing,
          screenFrames: screenShare.screenFrames
        }}
        isAnalyzing={isAnalyzing}
      />

      {clipboardSuggestion && (
        <div style={{
          position: 'fixed',
          bottom: 112,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(15,23,42,0.88)',
          border: '0.5px solid var(--border-subtle)',
          color: 'var(--text-primary)',
          padding: '10px 14px',
          borderRadius: 16,
          boxShadow: '0 12px 40px rgba(2,6,23,0.35)',
          fontSize: 11,
          maxWidth: '70vw',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          zIndex: 1200
        }}>
          Clipboard: {clipboardSuggestion}
        </div>
      )}

      {camera.isStreaming && (
        <video
          ref={camera.videoRef}
          autoPlay
          playsInline
          muted
          style={{
            position: 'fixed',
            top: -9999,
            left: -9999,
            width: 1,
            height: 1,
            opacity: 0,
            pointerEvents: 'none'
          }}
        />
      )}

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        language={language}
        onLanguageChange={(lang) => setLanguage(lang as Language)}
        alwaysListening={alwaysListening}
        onToggleAlwaysListening={() => setAlwaysListening(p => !p)}
        wakeWordEnabled={wakeWordEnabled}
        onToggleWakeWord={() => setWakeWordEnabled(p => !p)}
        clipboardEnabled={clipboardWatchEnabled}
        onToggleClipboard={() => setClipboardWatchEnabled(p => !p)}
        morningBriefingEnabled={morningBriefingEnabled}
        onToggleMorningBriefing={() => setMorningBriefingEnabled(p => !p)}
      />

      {showSummary && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(2,6,23,0.82)',
          backdropFilter: 'blur(10px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          animation: 'messageFade 0.3s ease'
        }}>
          <div style={{
            background: 'rgba(15,23,42,0.92)',
            border: '0.5px solid var(--border-active)',
            borderRadius: 20,
            width: '100%',
            maxWidth: 560,
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 30px 90px rgba(2,6,23,0.55)'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '0.5px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{
                  fontWeight: 600,
                  fontSize: 12,
                  letterSpacing: '0.32em',
                  color: 'var(--text-primary)',
                  textTransform: 'uppercase'
                }}>
                  Session Summary
                </div>
                <div style={{
                  fontSize: 9,
                  color: 'var(--text-muted)',
                  marginTop: 4
                }}>
                  {conversationHistory.length} exchanges · {new Date().toLocaleDateString('en-IN')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {summaryText && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(summaryText)
                      speech.speak('Copied Boss.', language)
                    }}
                    style={summaryButtonStyle}
                  >
                    Copy
                  </button>
                )}
                <button
                  onClick={() => setShowSummary(false)}
                  style={summaryButtonStyle}
                >
                  Close
                </button>
              </div>
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: 24
            }}>
              {isGeneratingSummary ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 16,
                  height: 200
                }}>
                  <div style={{
                    width: 20,
                    height: 20,
                    border: '2px solid var(--border-subtle)',
                    borderTopColor: 'var(--accent-cyan)',
                    borderRadius: '50%',
                    animation: 'ringSpin 0.8s linear infinite'
                  }} />
                  <div style={{
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.3em',
                    animation: 'breathing 1.5s ease infinite',
                    textTransform: 'uppercase'
                  }}>
                    Generating
                  </div>
                </div>
              ) : (
                <div style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  lineHeight: 2,
                  whiteSpace: 'pre-wrap'
                }}>
                  {summaryText}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const summaryButtonStyle: CSSProperties = {
  borderRadius: 999,
  border: '0.5px solid var(--border-subtle)',
  background: 'rgba(255,255,255,0.03)',
  color: 'var(--text-secondary)',
  padding: '8px 12px',
  cursor: 'pointer',
  fontSize: 9,
  letterSpacing: '0.22em',
  textTransform: 'uppercase'
}
