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

export type RepoStatus = {
  id: string;
  name: string;
  path: string;
  branch: string;
  detachedHead: boolean;
  dirty: boolean;
  modifiedCount: number;
  untrackedCount: number;
  originUrl: string;
  githubSlug: string | null;
  upstream: string | null;
  ahead: number;
  behind: number;
  badges: RepoBadge[];
  lastRefreshTime: string;
  error?: string;
  lastCommandOutput?: string;
  timestamps?: RepoActionTimestamps;
};

export type RepoAction = 'fetch' | 'pullRebase' | 'push' | 'clone';

export type RepoActionResult = {
  ok: boolean;
  action: RepoAction;
  repoPath: string;
  message: string;
  stdout: string;
  stderr: string;
  blockedReason?: string;
  timestamp: string;
};

export type RepoActionTimestamps = {
  fetchAt?: string;
  pullRebaseAt?: string;
  pushAt?: string;
};

export type CloneRequest = {
  rootFolder: string;
  input: string;
};

export type CloneResult = RepoActionResult & {
  clonedPath?: string;
};

export type OperationLogEntry = {
  id: string;
  timestamp: string;
  repo: string;
  action: RepoAction | 'scan';
  success: boolean;
  message: string;
  stdout: string;
  stderr: string;
};

export type RepoFilter = 'ALL' | RepoBadge;
