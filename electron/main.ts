import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import type { AppSettings, CloneRequest, RepoAction } from '../src/shared/types';
import { cloneRepository, getLogs, getRepos, runRepoAction } from './repoEngine';

const defaultSettings: AppSettings = {
  rootProjectsFolder: '',
  expectedRepos: []
};

const settingsPath = () => path.join(app.getPath('userData'), 'config.json');

const readSettings = async (): Promise<AppSettings> => {
  try {
    const raw = await fs.readFile(settingsPath(), 'utf-8');
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      rootProjectsFolder: parsed.rootProjectsFolder ?? '',
      expectedRepos: parsed.expectedRepos ?? []
    };
  } catch {
    return defaultSettings;
  }
};

const writeSettings = async (settings: AppSettings) => {
  await fs.mkdir(path.dirname(settingsPath()), { recursive: true });
  await fs.writeFile(settingsPath(), JSON.stringify(settings, null, 2), 'utf-8');
};

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1260,
    height: 780,
    minWidth: 1040,
    minHeight: 680,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    void mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  ipcMain.handle('settings:get', async () => readSettings());

  ipcMain.handle('settings:set', async (_event, payload: AppSettings) => {
    await writeSettings(payload);
    return payload;
  });

  ipcMain.handle('settings:pick-root-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  ipcMain.handle('repo:get-all', async (_event, forceRescan: boolean) => {
    const settings = await readSettings();
    return getRepos(settings, forceRescan);
  });

  ipcMain.handle('repo:get-logs', async () => getLogs());

  ipcMain.handle('repo:action', async (_event, repoPath: string, action: RepoAction) => runRepoAction(repoPath, action));

  ipcMain.handle('repo:clone', async (_event, request: CloneRequest) => cloneRepository(request));

  ipcMain.handle('repo:open-folder', async (_event, repoPath: string) => {
    const error = await shell.openPath(repoPath);
    return error || null;
  });

  ipcMain.handle('repo:open-vscode', async (_event, repoPath: string) => {
    const childProcess = await import('node:child_process');
    return new Promise<{ ok: boolean; message?: string }>((resolve) => {
      const child = childProcess.spawn('code', [repoPath], {
        stdio: 'ignore',
        detached: true
      });
      child.on('error', () => resolve({ ok: false, message: 'VS Code command line tool not found.' }));
      child.unref();
      resolve({ ok: true });
    });
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
