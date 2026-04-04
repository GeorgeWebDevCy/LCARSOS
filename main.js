const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const {
  initializeKnowledgeBase,
  getKnowledgeSummary,
  searchKnowledge,
  getRandomKnowledge,
  syncKnowledgeBase
} = require('./knowledgeBase');

let logFile = null;

function log(level, message) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] [${level}] ${message}\n`;
  if (logFile) {
    try { fs.appendFileSync(logFile, entry); } catch (_) {}
  }
  console.log(entry.trim());
}

process.on('uncaughtException', (err) => {
  log('ERROR', `Uncaught Exception: ${err.message}\n${err.stack}`);
  app.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log('ERROR', `Unhandled Rejection: ${reason}`);
});

function createWindow() {
  log('INFO', 'Creating main window');
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    fullscreen: true,
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile('index.html');
  win.on('closed', () => log('INFO', 'Window closed'));
}

app.whenReady().then(() => {
  // Initialise log file now that app is ready
  try {
    const logDir = app.getPath('userData');
    logFile = path.join(logDir, 'lcars.log');
    initializeKnowledgeBase({ dataDir: logDir, log });
  } catch (e) {
    console.error('Could not get userData path:', e.message);
  }
  log('INFO', 'App starting');
  void syncKnowledgeBase({ force: false }).catch((err) => {
    log('ERROR', `Initial knowledge sync failed: ${err.message}`);
  });
  createWindow();
});

app.on('window-all-closed', () => {
  log('INFO', 'All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.on('close-app', () => {
  log('INFO', 'User requested app close');
  app.quit();
});

ipcMain.on('toggle-fullscreen', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.setFullScreen(!win.isFullScreen());
    log('INFO', `Fullscreen toggled: ${win.isFullScreen()}`);
  }
});

ipcMain.handle('get-system-info', () => {
  const os = require('os');
  return {
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().length,
    memory: Math.round(os.totalmem() / (1024 * 1024 * 1024))
  };
});

ipcMain.on('log', (event, level, message) => {
  log(level, message);
});

ipcMain.handle('get-logs', () => {
  try {
    if (logFile && fs.existsSync(logFile)) {
      return fs.readFileSync(logFile, 'utf8');
    }
    return 'No log file available yet.';
  } catch (err) {
    return `Error reading logs: ${err.message}`;
  }
});

ipcMain.handle('knowledge-summary', async () => getKnowledgeSummary());

ipcMain.handle('knowledge-search', async (event, payload) => searchKnowledge(payload || {}));

ipcMain.handle('knowledge-random', async (event, payload) => getRandomKnowledge(payload || {}));

ipcMain.handle('knowledge-sync', async (event, payload) => syncKnowledgeBase(payload || {}));
