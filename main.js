const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const logDir = app.getPath('userData');
const logFile = path.join(logDir, 'lcars.log');

function log(level, message) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] [${level}] ${message}\n`;
  fs.appendFileSync(logFile, entry);
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
    width: 1024,
    height: 768,
    fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });
  win.loadFile('index.html');
  win.on('closed', () => log('INFO', 'Window closed'));
}

app.whenReady().then(() => {
  log('INFO', 'App starting');
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
    if (fs.existsSync(logFile)) {
      return fs.readFileSync(logFile, 'utf8');
    }
    return '';
  } catch (err) {
    return `Error reading logs: ${err.message}`;
  }
});
