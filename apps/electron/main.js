const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false, // 커스텀 타이틀바 (frame: false)
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // preload 연결
      contextIsolation: true, // 보안
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL('http://localhost:5173');

  // 개발자 도구 자동 오픈 (선택)
  // mainWindow.webContents.openDevTools();

  // 커스텀 타이틀바 IPC (최소화/최대화/닫기)
  ipcMain.handle('window:minimize', () => mainWindow.minimize());
  ipcMain.handle('window:maximize', () => mainWindow.maximize());
  ipcMain.handle('window:unmaximize', () => mainWindow.unmaximize());
  ipcMain.handle('window:isMaximized', () => mainWindow.isMaximized());
  ipcMain.handle('window:close', () => mainWindow.close());

  // 최대화/복원 시 상태 알림 (선택)
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window:maximized');
  });
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window:restored');
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // macOS가 아니라면 앱 종료
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  // macOS: dock 아이콘 클릭 시 창이 없으면 새로 생성
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
