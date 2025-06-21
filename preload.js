const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  closeApp: () => ipcRenderer.send('close-app'),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  toggleFullscreen: () => ipcRenderer.send('toggle-fullscreen')
});
