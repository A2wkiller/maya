const { app, BrowserWindow, ipcMain, shell, dialog, Tray, Menu, nativeImage, Notification, session, clipboard } = require('electron')
const { exec, execSync, spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const os = require('os')
const autoLaunch = require('auto-launch')

// Safe handler registration — prevents duplicate errors
const registeredHandlers = new Set()
function handle(channel, handler) {
  if (registeredHandlers.has(channel)) {
    ipcMain.removeHandler(channel)
  }
  registeredHandlers.add(channel)
  ipcMain.handle(channel, handler)
}

let mainWindow = null
let tray = null
let floatingWidget = null
let isAlwaysListening = false
let lastClipboard = ''
let clipboardWatcher = null
let wasShownOnce = false
let rebuildTrayMenu = null
let controllerProc = null

function startController() {
  const py = 'python'
  const script = path.join(__dirname, '../python/controller.py')

  if (!fs.existsSync(script)) {
    console.log('[MAIN] Controller script not found, skipping auto-start')
    return
  }

  controllerProc = spawn(py, [script], {
    env: { ...process.env, MAYA_TOKEN: process.env.MAYA_AGENT_TOKEN || 'maya_local_token' },
    stdio: 'pipe',
    windowsHide: true
  })

  controllerProc.stdout.on('data', d =>
    console.log('[CTRL]', d.toString().trim()))
  controllerProc.stderr.on('data', d =>
    console.error('[CTRL ERR]', d.toString().trim()))
  controllerProc.on('close', code => {
    console.log('[CTRL] exited:', code)
    controllerProc = null
  })
  controllerProc.on('error', error => {
    console.error('[CTRL] failed to start:', error.message)
    controllerProc = null
  })
}

const gotLock = app.requestSingleInstanceLock()

if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

app.commandLine.appendSwitch('use-fake-ui-for-media-stream', 'false')
app.commandLine.appendSwitch('enable-usermedia-screen-capturing')
app.commandLine.appendSwitch('disable-features', 'UserAgentClientHint')
app.commandLine.appendSwitch('allow-http-screen-capture')
app.commandLine.appendSwitch('enable-speech-input')
app.commandLine.appendSwitch('disable-web-security')
app.commandLine.appendSwitch(
  'unsafely-treat-insecure-origin-as-secure',
  'http://localhost:3000'
)
app.commandLine.appendSwitch(
  'unsafely-treat-insecure-origin-as-secure',
  'http://localhost:3000'
)

const mayaAutoLauncher = new autoLaunch({
  name: 'MAYA Personal AI',
  path: app.getPath('exe'),
})

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    backgroundColor: '#080808',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0f0f0f',
      symbolColor: '#c9a96e',
      height: 32
    },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
      allowRunningInsecureContent: true,
      experimentalFeatures: true,
      enableBlinkFeatures: 'GetUserMedia,MediaStream',
    },
    icon: path.join(__dirname, 'icon.png'),
    show: false,
    backgroundColor: '#080808',
  })

  const isDev = process.env.NODE_ENV === 'development'

  if (isDev) {
    // Wait for Next.js to be fully ready
    const tryLoad = (retries = 20) => {
      require('http').get('http://localhost:3000', () => {
        mainWindow.loadURL('http://localhost:3000')
      }).on('error', () => {
        if (retries > 0) {
          setTimeout(() => tryLoad(retries - 1), 1000)
        }
      })
    }
    tryLoad()
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'))
  }

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      console.log('Testing mic access...')
      navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(stream => {
          console.log('MIC WORKS - tracks:', stream.getTracks().length)
          stream.getTracks().forEach(t => t.stop())
        })
        .catch(err => console.error('MIC FAILED:', err.name, err.message))
    `)
  })

  mainWindow.webContents.on('did-finish-load', () => {
    if (!wasShownOnce) {
      mainWindow.show()
      mainWindow.focus()
      wasShownOnce = true
    }
    mainWindow?.webContents.send('window-focus', 'main')
    mainWindow.webContents.executeJavaScript(`
      console.log('Testing mic access...')
      navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(stream => {
          console.log('MIC WORKS - tracks:', stream.getTracks().length)
          stream.getTracks().forEach(t => t.stop())
        })
        .catch(err => console.error('MIC FAILED:', err.name, err.message))
    `)
  })

  mainWindow.on('focus', () => {
    mainWindow?.webContents.send('window-focus', 'main')
  })

  mainWindow.webContents.on('did-fail-load', () => {
    setTimeout(() => {
      mainWindow.loadURL('http://localhost:3000')
    }, 2000)
  })

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow.hide()

      if (Notification.isSupported()) {
        new Notification({
          title: 'MAYA',
          body: 'Running in background. Right-click tray icon to quit.'
        }).show()
      }
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.on('focus', () => {
    mainWindow?.webContents.send('window-focus', 'main')
  })
}

app.whenReady().then(async () => {

  // ── PERMISSIONS ──────────────────────────────────
  const { session } = require('electron')

  console.log('Setting up permissions...')

  // Grant ALL media permissions automatically
  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback, details) => {
      console.log('[PERMISSION REQUEST]', permission, details?.requestingUrl)
      callback(true) // grant everything for personal app
    }
  )
  console.log('Permission handler set')

  session.defaultSession.setPermissionCheckHandler(
    (webContents, permission, requestingOrigin, details) => {
      console.log('[PERMISSION CHECK]', permission, requestingOrigin)
      return true // allow everything
    }
  )
  console.log('Permission check handler set')

  session.defaultSession.setDevicePermissionHandler((details) => {
    console.log('[DEVICE PERMISSION]', details.deviceType)
    return true
  })

  // Override CSP to allow media
  session.defaultSession.webRequest.onHeadersReceived(
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; " +
            "media-src * blob: mediastream: data:; " +
            "connect-src * data: blob:;"
          ]
        }
      })
    }
  )

  session.defaultSession.webRequest.onBeforeSendHeaders(
    (details, callback) => {
      const headers = { ...details.requestHeaders }

      // Fix for Google Speech API
      if (details.url.includes('google.com') || details.url.includes('speech')) {
        headers['User-Agent'] =
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
          'AppleWebKit/537.36 (KHTML, like Gecko) ' +
          'Chrome/120.0.0.0 Safari/537.36'
        headers['Origin'] = 'http://localhost:3000'
        headers['Referer'] = 'http://localhost:3000/'
      }

      callback({ requestHeaders: headers })
    }
  )

  session.defaultSession.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/120.0.0.0 Safari/537.36'
  )

  const requirementsPath = path.join(__dirname, '../python/requirements.txt')
  if (fs.existsSync(requirementsPath)) {
    const pip = spawn('pip', [
      'install', '-r',
      requirementsPath,
      '-q', '--exists-action', 'i'
    ], { stdio: 'pipe', windowsHide: true })

    pip.stderr.on('data', d =>
      console.error('[MAIN] pip:', d.toString().trim()))
    pip.on('close', code => {
      if (code === 0) {
        console.log('[MAIN] Python deps ready')
      } else {
        console.error('[MAIN] Python deps install exited:', code)
      }
      startController()
    })
    pip.on('error', error => {
      console.error('[MAIN] pip failed:', error.message)
      startController()
    })
  } else {
    startController()
  }

  // ── CREATE WINDOW ─────────────────────────────────
  createWindow()
  createTray()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  controllerProc?.kill()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

function createTray() {
  const iconPath = path.join(__dirname, 'icon.png')
  const image = nativeImage.createFromPath(iconPath)
  tray = new Tray(image)
  tray.setToolTip('MAYA Personal AI')

  rebuildTrayMenu = async () => {
    const autoEnabled = await mayaAutoLauncher.isEnabled().catch(() => false)
    const menu = Menu.buildFromTemplate([
      {
        label: 'Show/Hide',
        click: () => toggleMainWindow()
      },
      {
        label: 'Show Widget',
        click: () => showWidget()
      },
      { type: 'separator' },
      {
        label: isAlwaysListening ? 'Always Listening: On' : 'Always Listening: Off',
        click: () => {
          if (isAlwaysListening) stopAlwaysListening()
          else startAlwaysListening()
        }
      },
      {
        label: clipboardWatcher ? 'Clipboard Watch: On' : 'Clipboard Watch: Off',
        click: () => {
          if (clipboardWatcher) stopClipboardWatch()
          else startClipboardWatch()
        }
      },
      { type: 'separator' },
      {
        label: autoEnabled ? 'Disable Auto Launch' : 'Enable Auto Launch',
        click: async () => {
          if (autoEnabled) await mayaAutoLauncher.disable().catch(() => {})
          else await mayaAutoLauncher.enable().catch(() => {})
          rebuildTrayMenu()
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.isQuitting = true
          app.quit()
        }
      }
    ])
    tray.setContextMenu(menu)
  }

  rebuildTrayMenu()

  tray.on('double-click', () => toggleMainWindow())

  tray.on('click', () => toggleMainWindow())
}

function toggleMainWindow() {
  if (!mainWindow) return
  if (mainWindow.isVisible()) {
    mainWindow.hide()
  } else {
    mainWindow.show()
    mainWindow.focus()
  }
}

function createFloatingWidget() {
  if (floatingWidget) return floatingWidget

  floatingWidget = new BrowserWindow({
    width: 340,
    height: 120,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false,
  })

  const isDev = process.env.NODE_ENV === 'development'
  if (isDev) {
    floatingWidget.loadURL('http://localhost:3000/widget')
  } else {
    floatingWidget.loadFile(path.join(__dirname, '../out/widget/index.html'))
  }

  floatingWidget.on('close', (e) => {
    e.preventDefault()
    floatingWidget?.hide()
  })

  floatingWidget.on('focus', () => {
    floatingWidget?.webContents.send('window-focus', 'widget')
  })

  floatingWidget.webContents.on('did-finish-load', () => {
    floatingWidget?.webContents.send('window-focus', 'widget')
  })

  return floatingWidget
}

function showWidget() {
  const win = createFloatingWidget()
  win.showInactive()
  win.focus()
}

function hideWidget() {
  if (floatingWidget) floatingWidget.hide()
}

function startAlwaysListening() {
  isAlwaysListening = true
  mainWindow?.webContents.send('always-listening-started')
  floatingWidget?.webContents.send('always-listening-started')
  if (rebuildTrayMenu) rebuildTrayMenu()
}

function stopAlwaysListening() {
  isAlwaysListening = false
  mainWindow?.webContents.send('always-listening-stopped')
  floatingWidget?.webContents.send('always-listening-stopped')
  if (rebuildTrayMenu) rebuildTrayMenu()
}

function startClipboardWatch() {
  if (clipboardWatcher) return
  lastClipboard = clipboard.readText()
  clipboardWatcher = setInterval(() => {
    const current = clipboard.readText()
    if (current && current !== lastClipboard) {
      lastClipboard = current
      mainWindow?.webContents.send('clipboard-changed', current)
      floatingWidget?.webContents.send('clipboard-changed', current)
    }
  }, 2000)
  if (rebuildTrayMenu) rebuildTrayMenu()
}

function stopClipboardWatch() {
  if (clipboardWatcher) {
    clearInterval(clipboardWatcher)
    clipboardWatcher = null
  }
  if (rebuildTrayMenu) rebuildTrayMenu()
}

// ── TEST ─────────────────────────────────────────────
handle('test-ipc', () => ({
  success: true,
  message: 'IPC working',
  platform: process.platform,
  version: process.versions.electron
}))

// ── ALWAYS LISTENING ──────────────────────────────────
let alwaysListeningActive = false
handle('start-always-listening', () => {
  alwaysListeningActive = true
  return { success: true, listening: true }
})
handle('stop-always-listening', () => {
  alwaysListeningActive = false
  return { success: true, listening: false }
})
handle('get-listening-status', () => ({
  success: true,
  listening: alwaysListeningActive
}))

// ── CLIPBOARD ─────────────────────────────────────────
let clipWatcher = null
let lastClip = ''

handle('start-clipboard', () => {
  if (clipWatcher) return { success: true }
  clipWatcher = setInterval(() => {
    const text = clipboard.readText()
    if (text && text !== lastClip && text.length > 10) {
      lastClip = text
      const type = text.match(/https?:\/\//) ? 'url'
        : (text.includes('Error:') || text.includes('TypeError')) ? 'error'
        : (text.includes('function') || text.includes('const') ||
           text.includes('def ') || text.includes('import ')) ? 'code'
        : 'text'
      mainWindow?.webContents.send('clipboard-change', { text, type })
    }
  }, 1500)
  return { success: true }
})

handle('stop-clipboard', () => {
  if (clipWatcher) { clearInterval(clipWatcher); clipWatcher = null }
  return { success: true }
})

handle('read-clipboard', () => ({
  text: clipboard.readText()
}))

handle('write-clipboard', (event, text) => {
  clipboard.writeText(text)
  return { success: true }
})

// ── AUTO LAUNCH ───────────────────────────────────────
handle('get-auto-launch', async () => {
  try {
    const AutoLaunch = require('auto-launch')
    const launcher = new AutoLaunch({
      name: 'MAYA Personal AI',
      path: app.getPath('exe')
    })
    const enabled = await launcher.isEnabled()
    return { success: true, enabled }
  } catch (e) {
    return { success: false, enabled: false }
  }
})

handle('set-auto-launch', async (event, enable) => {
  try {
    const AutoLaunch = require('auto-launch')
    const launcher = new AutoLaunch({
      name: 'MAYA Personal AI',
      path: app.getPath('exe')
    })
    if (enable) await launcher.enable()
    else await launcher.disable()
    return { success: true }
  } catch (e) {
    return { success: false, error: e.message }
  }
})

// ── WINDOW ────────────────────────────────────────────
handle('toggle-main', () => {
  if (!mainWindow) return
  if (mainWindow.isVisible()) mainWindow.hide()
  else { mainWindow.show(); mainWindow.focus() }
  return { success: true }
})

handle('show-widget', () => {
  mainWindow?.show()
  return { success: true }
})

handle('hide-widget', () => {
  mainWindow?.hide()
  return { success: true }
})

// ── OPEN URL ──────────────────────────────────────────
handle('open-url', async (event, url) => {
  try {
    await shell.openExternal(url)
    return { success: true, opened: url }
  } catch (e) {
    return { success: false, error: e.message }
  }
})

// ── OPEN APP ──────────────────────────────────────────
handle('open-app', async (event, appName) => {
  const { exec, execSync } = require('child_process')
  const name = appName.toLowerCase().trim()

  const appCommands = {
    'file explorer':  'explorer',
    'file manager':   'explorer',
    'explorer':       'explorer',
    'notepad':        'notepad',
    'calculator':     'calc',
    'paint':          'mspaint',
    'task manager':   'taskmgr',
    'cmd':            'cmd /c start cmd',
    'terminal':       'cmd /c start cmd',
    'powershell':     'cmd /c start powershell',
    'control panel':  'control',
    'settings':       'cmd /c start ms-settings:',
    'camera':         'cmd /c start microsoft.windows.camera:',
    'photos':         'cmd /c start ms-photos:',
    'store':          'cmd /c start ms-windows-store:',
    'mail':           'cmd /c start outlookmail:',

    'vscode':         'cmd /c code',
    'vs code':        'cmd /c code',
    'visual studio code': 'cmd /c code',
    'git bash':       'cmd /c start \"Git Bash\" \"C:\\\\Program Files\\\\Git\\\\bin\\\\bash.exe\"',

    'chrome':         'cmd /c start chrome',
    'firefox':        'cmd /c start firefox',
    'edge':           'cmd /c start msedge',
    'brave':          'cmd /c start brave',

    'spotify':        'cmd /c start spotify',
    'discord':        'cmd /c start discord',
    'telegram':       'cmd /c start telegram',
    'whatsapp':       'cmd /c start whatsapp:',
    'zoom':           'cmd /c start zoom',
    'slack':          'cmd /c start slack',
    'notion':         'cmd /c start notion',
    'figma':          'cmd /c start figma',
    'postman':        'cmd /c start postman',

    'word':           'cmd /c start winword',
    'excel':          'cmd /c start excel',
    'powerpoint':     'cmd /c start powerpnt',
    'outlook':        'cmd /c start outlook',
  }

  const command = appCommands[name]

  if (command) {
    return new Promise(resolve => {
      exec(command, (err) => {
        if (err) {
          shell.openPath(name).then(() => {
            resolve({ success: true, opened: name })
          }).catch(() => {
            resolve({ success: false, error: err.message })
          })
        } else {
          resolve({ success: true, opened: name })
        }
      })
    })
  }

  return new Promise(resolve => {
    exec(`cmd /c start \"\" \"${appName}\"`, (err1) => {
      if (!err1) {
        resolve({ success: true, opened: appName })
        return
      }
      exec(`cmd /c start ${appName}`, (err2) => {
        if (!err2) {
          resolve({ success: true, opened: appName })
          return
        }
        shell.openPath(appName).then(() => {
          resolve({ success: true, opened: appName })
        }).catch(() => {
          resolve({ success: false, error: `Could not open: ${appName}` })
        })
      })
    })
  })
})

// ── RUN COMMAND ───────────────────────────────────────
handle('run-command', async (event, command) => {
  const { exec } = require('child_process')
  const allowed = ['npm','node','python','py','git',
    'pip','code','dir','echo','ipconfig','ping','whoami','ver']
  const first = command.trim().split(' ')[0].toLowerCase()
  if (!allowed.includes(first)) {
    return { success: false, error: `Not allowed: ${first}` }
  }
  return new Promise(resolve => {
    exec(command, { timeout: 30000 }, (err, stdout, stderr) => {
      resolve({ success: !err, output: stdout, error: stderr })
    })
  })
})

// ── CHECK SOFTWARE ────────────────────────────────────
handle('check-software', async (event, software) => {
  const { execSync } = require('child_process')
  const checks = {
    'vscode': 'code --version',
    'vs code':'code --version',
    'node':   'node --version',
    'npm':    'npm --version',
    'python': 'python --version',
    'git':    'git --version',
  }
  const cmd = checks[software.toLowerCase()]
  if (!cmd) return { success: true, installed: null }
  try {
    const out = execSync(cmd, { timeout: 5000 }).toString().trim()
    return { success: true, installed: true, version: out }
  } catch {
    return { success: true, installed: false }
  }
})

// ── FILES ─────────────────────────────────────────────
handle('read-file', async (event, filePath) => {
  const fs = require('fs')
  const os = require('os')
  try {
    const p = filePath.replace('~', os.homedir())
    const content = fs.readFileSync(p, 'utf-8')
    return { success: true, content: content.slice(0, 10000) }
  } catch (e) {
    return { success: false, error: e.message }
  }
})

handle('write-file', async (event, filePath, content) => {
  const fs = require('fs')
  const path = require('path')
  const os = require('os')
  try {
    const p = filePath.replace('~', os.homedir())
    fs.mkdirSync(path.dirname(p), { recursive: true })
    fs.writeFileSync(p, content, 'utf-8')
    return { success: true, path: p }
  } catch (e) {
    return { success: false, error: e.message }
  }
})

handle('list-files', async (event, dirPath) => {
  const fs = require('fs')
  const path = require('path')
  const os = require('os')
  try {
    const p = dirPath.replace('~', os.homedir())
    const items = fs.readdirSync(p).map(name => {
      const full = path.join(p, name)
      const stat = fs.statSync(full)
      return {
        name,
        type: stat.isDirectory() ? 'dir' : 'file',
        size: stat.size,
        modified: stat.mtime.toISOString()
      }
    })
    return { success: true, items }
  } catch (e) {
    return { success: false, error: e.message }
  }
})

handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections']
  })
  return { success: true, paths: result.filePaths }
})

handle('save-file-dialog', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {})
  return { success: true, path: result.filePath }
})

// ── SYSTEM INFO ───────────────────────────────────────
handle('system-info', async () => {
  const os = require('os')
  const cpus = os.cpus()
  return {
    success: true,
    platform: os.platform(),
    hostname: os.hostname(),
    username: os.userInfo().username,
    ram_total: Math.round(os.totalmem() / 1024 / 1024 / 1024) + ' GB',
    ram_free: Math.round(os.freemem() / 1024 / 1024 / 1024) + ' GB',
    ram_used_percent: Math.round(
      (1 - os.freemem() / os.totalmem()) * 100
    ),
    cpu_model: cpus[0]?.model || 'Unknown',
    cpu_cores: cpus.length,
    uptime_hours: Math.round(os.uptime() / 3600)
  }
})

// ── VOLUME ────────────────────────────────────────────
handle('volume', async (event, action) => {
  const { exec } = require('child_process')
  const cmds = {
    up:   'powershell -c "$w=New-Object -ComObject WScript.Shell;$w.SendKeys([char]175)"',
    down: 'powershell -c "$w=New-Object -ComObject WScript.Shell;$w.SendKeys([char]174)"',
    mute: 'powershell -c "$w=New-Object -ComObject WScript.Shell;$w.SendKeys([char]173)"',
  }
  if (cmds[action]) exec(cmds[action])
  return { success: true }
})

// ── NOTIFY ────────────────────────────────────────────
handle('notify', async (event, title, body) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show()
  }
  return { success: true }
})

// ── PDF ───────────────────────────────────────────────
handle('pdf-merge', async (event, paths, output) => {
  try {
    const { PDFDocument } = require('pdf-lib')
    const fs = require('fs')
    const merged = await PDFDocument.create()
    for (const p of paths) {
      const bytes = fs.readFileSync(p)
      const doc = await PDFDocument.load(bytes)
      const pages = await merged.copyPages(doc, doc.getPageIndices())
      pages.forEach(page => merged.addPage(page))
    }
    const outBytes = await merged.save()
    fs.writeFileSync(output, outBytes)
    return { success: true, output }
  } catch (e) {
    return { success: false, error: e.message }
  }
})

handle('pdf-extract-text', async (event, filePath) => {
  try {
    const { PDFDocument } = require('pdf-lib')
    const fs = require('fs')
    const bytes = fs.readFileSync(filePath)
    const doc = await PDFDocument.load(bytes)
    return { success: true, pages: doc.getPageCount() }
  } catch (e) {
    return { success: false, error: e.message }
  }
})
