export type AppSettings = {
  rootProjectsFolder: string;
  expectedRepos: string[];
};

export type RepoBadge =
  | 'CLEAN'
  | 'DIRTY'
  | 'AHEAD'
  | 'BEHIND'
  | 'DIVERGED'
  | 'NO_UPSTREAM'
  | 'DETACHED_HEAD'
  | 'ERROR'
  | 'MISSING_LOCALLY';

export type RepoSummary = {
  id: string;
  name: string;
  path: string;
  branch: string;
  dirty: boolean;
  originUrl: string;
  ahead: number;
  behind: number;
  badges: RepoBadge[];
  lastRefreshTime: string;
};

export type ActivityLogEntry = {
  id: string;
  level: 'info' | 'warn' | 'error';
  timestamp: string;
  message: string;
};
