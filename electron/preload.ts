import { contextBridge, ipcRenderer } from 'electron';
import type { AppSettings, CloneRequest, CloneResult, OperationLogEntry, RepoAction, RepoActionResult, RepoStatus } from '../src/shared/types';

const api = {
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('settings:get'),
  setSettings: (settings: AppSettings): Promise<AppSettings> => ipcRenderer.invoke('settings:set', settings),
  pickRootFolder: (): Promise<string | null> => ipcRenderer.invoke('settings:pick-root-folder'),
  getRepos: (forceRescan = false): Promise<RepoStatus[]> => ipcRenderer.invoke('repo:get-all', forceRescan),
  getLogs: (): Promise<OperationLogEntry[]> => ipcRenderer.invoke('repo:get-logs'),
  runRepoAction: (repoPath: string, action: RepoAction): Promise<RepoActionResult> => ipcRenderer.invoke('repo:action', repoPath, action),
  cloneRepo: (request: CloneRequest): Promise<CloneResult> => ipcRenderer.invoke('repo:clone', request),
  openFolder: (repoPath: string): Promise<string | null> => ipcRenderer.invoke('repo:open-folder', repoPath),
  openInVSCode: (repoPath: string): Promise<{ ok: boolean; message?: string }> => ipcRenderer.invoke('repo:open-vscode', repoPath)
};

contextBridge.exposeInMainWorld('repoRadar', api);

export type RepoRadarApi = typeof api;
