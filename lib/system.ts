declare global {
  interface Window {
    mayaSystem: {
      openUrl: (url: string) => Promise<any>
      openApp: (app: string) => Promise<any>
      runCommand: (cmd: string) => Promise<any>
      checkSoftware: (s: string) => Promise<any>
      readFile: (path: string) => Promise<any>
      writeFile: (path: string, content: string) => Promise<any>
      listFiles: (path: string) => Promise<any>
      openFileDialog: () => Promise<any>
      saveFileDialog: () => Promise<any>
      pdfMerge: (paths: string[], output: string) => Promise<any>
      pdfExtract: (path: string) => Promise<any>
      systemInfo: () => Promise<any>
      volume: (action: string) => Promise<any>
      notify: (title: string, body: string) => Promise<any>
      startAlwaysListening: () => Promise<any>
      stopAlwaysListening: () => Promise<any>
      getListeningStatus: () => Promise<any>
      toggleMainWindow: () => Promise<any>
      showWidget: () => Promise<any>
      hideWidget: () => Promise<any>
      getAutoLaunch: () => Promise<any>
      setAutoLaunch: (enable: boolean) => Promise<any>
      startClipboardWatch: () => Promise<any>
      stopClipboardWatch: () => Promise<any>
      readClipboard: () => Promise<any>
      writeClipboard: (text: string) => Promise<any>
      onActivateVoice: (cb: (...args: any[]) => void) => void
      onAlwaysListeningStarted: (cb: (...args: any[]) => void) => void
      onAlwaysListeningStopped: (cb: (...args: any[]) => void) => void
      onClipboardChanged: (cb: (...args: any[]) => void) => void
      onWindowFocus: (cb: (...args: any[]) => void) => void
    }
  }
}

const sys = () => {
  if (typeof window === 'undefined') return null
  const s = (window as any).mayaSystem
  if (!s) {
    console.warn('window.mayaSystem not available — not in Electron?')
    return null
  }
  return s
}

export const isElectron = (): boolean => {
  if (typeof window === 'undefined') return false
  return !!(window as any).mayaSystem
}

const safeCall = async (
  methodName: string,
  ...args: any[]
): Promise<any> => {
  const s = sys()
  if (!s) return { success: false, error: 'Not in Electron' }
  if (typeof (s as any)[methodName] !== 'function') {
    console.warn(`[SYSTEM] ${methodName} not available in preload`)
    return { success: false, error: `${methodName} not implemented` }
  }
  try {
    return await (s as any)[methodName](...args)
  } catch (e: any) {
    console.error(`[SYSTEM] ${methodName} error:`, e)
    return { success: false, error: e.message }
  }
}

export const openUrl = (url: string) => safeCall('openUrl', url)
export const openApp = (app: string) => safeCall('openApp', app)
export const runCommand = (cmd: string) => safeCall('runCommand', cmd)
export const checkSoftware = (s: string) => safeCall('checkSoftware', s)
export const readFile = (path: string) => safeCall('readFile', path)
export const writeFile = (path: string, content: string) => safeCall('writeFile', path, content)
export const listFiles = (path: string) => safeCall('listFiles', path)
export const systemInfo = () => safeCall('systemInfo')
export const volume = (action: string) => safeCall('volume', action)
export const notify = (title: string, body: string) => safeCall('notify', title, body)
export const openFileDialog = () => safeCall('openFileDialog')
export const saveFileDialog = () => safeCall('saveFileDialog')

export const getAutoLaunch = () => safeCall('getAutoLaunch')
export const setAutoLaunch = (enable: boolean) => safeCall('setAutoLaunch', enable)

export const startAlwaysListening = () => safeCall('startAlwaysListening')
export const stopAlwaysListening = () => safeCall('stopAlwaysListening')
export const getListeningStatus = () => safeCall('getListeningStatus')

export const startClipboardWatch = () => safeCall('startClipboard')
export const stopClipboardWatch = () => safeCall('stopClipboard')
export const readClipboard = () => safeCall('readClipboard')
export const writeClipboard = (text: string) => safeCall('writeClipboard', text)

export const onActivateVoice = (cb: (...args: any[]) => void) =>
  sys()?.onActivateVoice?.(cb)

export const onAlwaysListeningStarted = (cb: (...args: any[]) => void) =>
  sys()?.onAlwaysListeningStarted?.(cb)

export const onAlwaysListeningStopped = (cb: (...args: any[]) => void) =>
  sys()?.onAlwaysListeningStopped?.(cb)

export const onClipboardChanged = (cb: (...args: any[]) => void) =>
  sys()?.onClipboardChanged?.(cb)

export const onWindowFocus = (cb: (...args: any[]) => void) =>
  sys()?.onWindowFocus?.(cb)
