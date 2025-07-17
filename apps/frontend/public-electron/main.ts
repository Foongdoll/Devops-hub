import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
const execFileAsync = promisify(execFile);

function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL('http://localhost:5173');  
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Example IPC handler (git-pull)
ipcMain.handle('git-pull', async (_event, { repoName, branch, strategy }) => {
  const repoPath = path.join(app.getPath('home'), 'git-repos', repoName);
  const pullArgs = ['-C', repoPath, 'pull', 'origin'];
  if (branch && branch !== 'main') pullArgs.push(branch);
  if (strategy) pullArgs.push(strategy);

  try {
    const { stdout, stderr } = await execFileAsync('git', pullArgs);
    return { stdout, stderr };
  } catch (error: any) {
    return { error: error.message };
  }
});