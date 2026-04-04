const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  closeApp: () => ipcRenderer.send('close-app'),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  toggleFullscreen: () => ipcRenderer.send('toggle-fullscreen'),
  log: (level, message) => ipcRenderer.send('log', level, message),
  getLogs: () => ipcRenderer.invoke('get-logs'),
  getKnowledgeSummary: () => ipcRenderer.invoke('knowledge-summary'),
  searchKnowledge: (payload) => ipcRenderer.invoke('knowledge-search', payload),
  getRandomKnowledge: (payload) => ipcRenderer.invoke('knowledge-random', payload),
  syncKnowledgeBase: (payload) => ipcRenderer.invoke('knowledge-sync', payload)
});

window.onerror = (message, source, line, col, error) => {
  ipcRenderer.send('log', 'ERROR', `JS Error: ${message} at ${source}:${line}:${col}`);
};

window.onunhandledrejection = (event) => {
  ipcRenderer.send('log', 'ERROR', `Unhandled Promise Rejection: ${event.reason}`);
};
