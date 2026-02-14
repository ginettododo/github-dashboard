import { contextBridge, ipcRenderer } from 'electron';

type AppSettings = {
  rootProjectsFolder: string;
  expectedRepos: string[];
};

const api = {
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('settings:get'),
  setSettings: (settings: AppSettings): Promise<AppSettings> => ipcRenderer.invoke('settings:set', settings),
  pickRootFolder: (): Promise<string | null> => ipcRenderer.invoke('settings:pick-root-folder'),
  openFolder: (repoPath: string): Promise<string | null> => ipcRenderer.invoke('repo:open-folder', repoPath),
  openInVSCode: (repoPath: string): Promise<{ ok: boolean; message?: string }> => ipcRenderer.invoke('repo:open-vscode', repoPath)
};

contextBridge.exposeInMainWorld('repoRadar', api);

export type RepoRadarApi = typeof api;
