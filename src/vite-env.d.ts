/// <reference types="vite/client" />

export {};

type AppSettings = {
  rootProjectsFolder: string;
  expectedRepos: string[];
};

declare global {
  interface Window {
    repoRadar: {
      getSettings: () => Promise<AppSettings>;
      setSettings: (settings: AppSettings) => Promise<AppSettings>;
      pickRootFolder: () => Promise<string | null>;
      openFolder: (repoPath: string) => Promise<string | null>;
      openInVSCode: (repoPath: string) => Promise<{ ok: boolean; message?: string }>;
    };
  }
}
