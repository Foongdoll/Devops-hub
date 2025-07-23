const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  unmaximize: () => ipcRenderer.invoke('window:unmaximize'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  close: () => ipcRenderer.invoke('window:close'),
  // 이벤트 구독 (최대화/복원 감지)
  onMaximized: (callback) => ipcRenderer.on('window:maximized', callback),
  onRestored: (callback) => ipcRenderer.on('window:restored', callback),  
});

contextBridge.exposeInMainWorld('env', { isElectron: true });
