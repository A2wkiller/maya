const BASE = 'http://127.0.0.1:5002'
const H = {
  'Content-Type': 'application/json',
  'X-MAYA-TOKEN': process.env.NEXT_PUBLIC_MAYA_AGENT_TOKEN || 'maya_local_token'
}

const post = (url: string, data: unknown) =>
  fetch(BASE + url, {
    method: 'POST',
    headers: H,
    body: JSON.stringify(data)
  })
    .then(r => r.json())
    .catch(() => ({ success: false, error: 'offline' }))

const get = (url: string) =>
  fetch(BASE + url, { headers: H })
    .then(r => r.json())
    .catch(() => ({ success: false, error: 'offline' }))

export const ctrlOnline = async () => {
  try {
    const r = await fetch(BASE + '/health', { headers: H })
    return r.ok
  } catch {
    return false
  }
}

export const typeText = (text: string) => post('/keyboard/type', { text })
export const hotkey = (keys: string[]) => post('/keyboard/hotkey', { keys })
export const pressKey = (key: string) => post('/keyboard/press', { key })
export const clickAt = (x: number, y: number) => post('/mouse/click', { x, y })
export const moveTo = (x: number, y: number) => post('/mouse/move', { x, y })
export const scroll = (clicks: number) => post('/mouse/scroll', { clicks })
export const screenshot = () => get('/screenshot')
export const openApp = (app: string) => post('/app/open', { app })
export const searchWeb = (query: string, platform = 'google') =>
  post('/web/search', { query, platform })
export const searchSmart = (query: string, platform = 'youtube') =>
  post('/web/smart-search', { query, platform })
export const setVolume = (action: string) => post('/system/volume', { action })
export const sysInfo = () => get('/system/info')
export const runSequence = (actions: unknown[]) =>
  post('/action/sequence', { actions })

// Browser automation
export const initBrowser = () =>
  post('/browser/init', {})

export const gotoUrl = (url: string) =>
  post('/browser/goto', { url })

export const browserSearchYouTube = (query: string) =>
  post('/browser/search-youtube', { query })

export const clickYouTubeResult = (index = 0) =>
  post('/browser/click-youtube-result', { index })

export const browserGoogleSearch = (query: string) =>
  post('/browser/google-search', { query })

export const browserClick = (selector?: string, x?: number, y?: number) =>
  post('/browser/click', { selector, x, y })

export const browserType = (text: string, selector?: string) =>
  post('/browser/type', { text, selector })

export const browserGetText = (selector = 'body') =>
  post('/browser/get-text', { selector })

export const browserScreenshot = () =>
  get('/browser/screenshot')

export const browserSmartAction = (action: string, value?: string) =>
  post('/browser/smart-action', { action, value })

export const closeBrowser = () =>
  post('/browser/close', {})

export const youtubeSearch = (query: string) =>
  post('/web/youtube-search', { query })

export const googleSearch = (query: string) =>
  post('/web/google-search', { query })

export const openSite = (site: string) =>
  post('/web/open-site', { site })
