/// <reference types="vite/client" />

import type { AppSettings, CloneRequest, CloneResult, OperationLogEntry, RepoAction, RepoActionResult, RepoStatus } from './shared/types';

export {};

declare global {
  interface Window {
    repoRadar?: {
      getSettings: () => Promise<AppSettings>;
      setSettings: (settings: AppSettings) => Promise<AppSettings>;
      pickRootFolder: () => Promise<string | null>;
      getRepos: (forceRescan?: boolean) => Promise<RepoStatus[]>;
      getLogs: () => Promise<OperationLogEntry[]>;
      runRepoAction: (repoPath: string, action: RepoAction) => Promise<RepoActionResult>;
      cloneRepo: (request: CloneRequest) => Promise<CloneResult>;
      openFolder: (repoPath: string) => Promise<string | null>;
      openInVSCode: (repoPath: string) => Promise<{ ok: boolean; message?: string }>;
    };
  }
}
