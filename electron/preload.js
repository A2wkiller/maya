const { contextBridge, ipcRenderer } = require('electron')

console.log('[PRELOAD] Loading MAYA preload script...')

const mayaAPI = {
  // ── TEST ────────────────────────────────────────
  testIPC: () => ipcRenderer.invoke('test-ipc'),

  // ── BROWSER / URLS ───────────────────────────────
  openUrl: (url) => {
    console.log('[PRELOAD] openUrl:', url)
    return ipcRenderer.invoke('open-url', url)
  },

  // ── APPS ─────────────────────────────────────────
  openApp: (app) => {
    console.log('[PRELOAD] openApp:', app)
    return ipcRenderer.invoke('open-app', app)
  },

  // ── COMMANDS ─────────────────────────────────────
  runCommand: (cmd) => {
    console.log('[PRELOAD] runCommand:', cmd)
    return ipcRenderer.invoke('run-command', cmd)
  },

  // ── SOFTWARE CHECK ───────────────────────────────
  checkSoftware: (s) => ipcRenderer.invoke('check-software', s),

  // ── FILES ─────────────────────────────────────────
  readFile: (p) => ipcRenderer.invoke('read-file', p),
  writeFile: (p, c) => ipcRenderer.invoke('write-file', p, c),
  listFiles: (p) => ipcRenderer.invoke('list-files', p),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  saveFileDialog: () => ipcRenderer.invoke('save-file-dialog'),

  // ── PDF ───────────────────────────────────────────
  pdfMerge: (paths, out) => ipcRenderer.invoke('pdf-merge', paths, out),
  pdfExtract: (p) => ipcRenderer.invoke('pdf-extract-text', p),

  // ── SYSTEM ───────────────────────────────────────
  systemInfo: () => ipcRenderer.invoke('system-info'),
  volume: (a) => ipcRenderer.invoke('volume', a),

  // ── NOTIFICATIONS ────────────────────────────────
  notify: (t, b) => ipcRenderer.invoke('notify', t, b),

  // ── TRAY / WINDOW ────────────────────────────────
  getAutoLaunch: () => ipcRenderer.invoke('get-auto-launch'),
  setAutoLaunch: (e) => ipcRenderer.invoke('set-auto-launch', e),
  toggleMain: () => ipcRenderer.invoke('toggle-main'),
  showWidget: () => ipcRenderer.invoke('show-widget'),
  hideWidget: () => ipcRenderer.invoke('hide-widget'),

  // ── CLIPBOARD ────────────────────────────────────
  startClipboard: () => ipcRenderer.invoke('start-clipboard'),
  stopClipboard: () => ipcRenderer.invoke('stop-clipboard'),
  readClipboard: () => ipcRenderer.invoke('read-clipboard'),
  writeClipboard: (t) => ipcRenderer.invoke('write-clipboard', t),

  // ── EVENTS ───────────────────────────────────────
  onActivateVoice: (cb) => ipcRenderer.on('activate-voice', cb),
  onClipboardChange: (cb) => ipcRenderer.on('clipboard-change', cb),
  onStatusUpdate: (cb) => ipcRenderer.on('status-update', cb),
  onAlwaysListeningStarted: (cb) =>
    ipcRenderer.on('always-listening-started', cb),

  // ── ALWAYS LISTENING ─────────────────────────────
  startAlwaysListening: () => ipcRenderer.invoke('start-always-listening'),
  stopAlwaysListening:  () => ipcRenderer.invoke('stop-always-listening'),
  getListeningStatus:   () => ipcRenderer.invoke('get-listening-status'),

  // ── CLIPBOARD ────────────────────────────────────
  startClipboardWatch:  () => ipcRenderer.invoke('start-clipboard'),
  stopClipboardWatch:   () => ipcRenderer.invoke('stop-clipboard'),
  startClipboard:       () => ipcRenderer.invoke('start-clipboard'),
  stopClipboard:        () => ipcRenderer.invoke('stop-clipboard'),
}

contextBridge.exposeInMainWorld('mayaSystem', mayaAPI)

console.log('[PRELOAD] MAYA system API exposed:', Object.keys(mayaAPI))
