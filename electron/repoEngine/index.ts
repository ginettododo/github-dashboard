import path from 'node:path';
import fs from 'node:fs/promises';
import type { AppSettings, CloneRequest, CloneResult, OperationLogEntry, RepoAction, RepoActionResult, RepoStatus } from '../../src/shared/types';
import { discoverRepos } from './scanner';
import { isAuthError, loadRepoStatus, runGit } from './git';
import { appendOperationLog, readOperationLogs, readRepoCache, recordRepoActionMetadata, writeRepoCache } from './storage';

export const getRepos = async (settings: AppSettings, forceRescan = false): Promise<RepoStatus[]> => {
  if (!settings.rootProjectsFolder) return [];

  let repoPaths: string[] = [];
  const cache = await readRepoCache();
  if (!forceRescan && cache && cache.rootFolder === settings.rootProjectsFolder) {
    repoPaths = cache.repos;
  } else {
    repoPaths = await discoverRepos(settings.rootProjectsFolder);
    await writeRepoCache({ rootFolder: settings.rootProjectsFolder, repos: repoPaths, scannedAt: new Date().toISOString() });
  }

  const statuses = await Promise.all(repoPaths.map((repoPath) => loadRepoStatus(repoPath)));

  await logOperation(settings.rootProjectsFolder, 'scan', true, forceRescan ? 'Repository rescan completed.' : 'Repository status refresh completed.', '', '');

  const normalizedExpected = new Set(settings.expectedRepos.map((entry) => entry.trim().toLowerCase()).filter(Boolean));
  for (const expected of normalizedExpected) {
    const exists = statuses.some((repo) => repo.githubSlug?.toLowerCase() === expected);
    if (!exists) {
      statuses.push({
        id: `missing-${expected}`,
        name: expected,
        path: path.join(settings.rootProjectsFolder, expected.split('/')[1] ?? expected),
        branch: '-',
        detachedHead: false,
        dirty: false,
        modifiedCount: 0,
        untrackedCount: 0,
        originUrl: '',
        githubSlug: expected,
        upstream: null,
        ahead: 0,
        behind: 0,
        badges: ['MISSING_LOCALLY'],
        lastRefreshTime: new Date().toISOString()
      });
    }
  }

  return statuses.sort((a, b) => a.name.localeCompare(b.name));
};

const logOperation = async (repo: string, action: RepoAction | 'scan', success: boolean, message: string, stdout: string, stderr: string) => {
  const entry: OperationLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    repo,
    action,
    success,
    message,
    stdout,
    stderr
  };
  await appendOperationLog(entry);
  return entry;
};

export const getLogs = async (): Promise<OperationLogEntry[]> => readOperationLogs();

const blocked = (repoPath: string, action: RepoAction, message: string): RepoActionResult => ({
  ok: false,
  repoPath,
  action,
  message,
  stdout: '',
  stderr: '',
  blockedReason: message,
  timestamp: new Date().toISOString()
});

export const runRepoAction = async (repoPath: string, action: RepoAction): Promise<RepoActionResult> => {
  const status = await loadRepoStatus(repoPath);
  if (status.badges.includes('NO_ACCESS')) {
    return blocked(repoPath, action, 'Action blocked: RepoRadar has no read access to this repository folder.');
  }

  if (action === 'pullRebase') {
    if (status.detachedHead) return blocked(repoPath, action, 'Pull (rebase) blocked: repository is in detached HEAD state.');
    if (!status.upstream) return blocked(repoPath, action, 'Pull (rebase) blocked: no upstream tracking branch configured.');
    if (status.dirty) return blocked(repoPath, action, 'Pull (rebase) blocked: working tree is dirty. Commit, discard, or stash manually first.');
    if (status.ahead > 0 && status.behind > 0) return blocked(repoPath, action, 'Pull (rebase) blocked: branch is diverged from upstream. Resolve manually.');
  }

  if (action === 'push') {
    if (status.detachedHead) return blocked(repoPath, action, 'Push blocked: repository is in detached HEAD state.');
    if (!status.upstream) return blocked(repoPath, action, 'Push blocked: no upstream tracking branch configured.');
    if (status.ahead === 0) return blocked(repoPath, action, 'Push blocked: there are no local commits ahead of upstream.');
  }

  const argsByAction: Record<Exclude<RepoAction, 'clone'>, string[]> = {
    fetch: ['fetch', '--prune'],
    pullRebase: ['pull', '--rebase'],
    push: ['push']
  };

  const args = argsByAction[action as Exclude<RepoAction, 'clone'>];
  if (!args) return blocked(repoPath, action, `Unknown action: ${action}`);
  const cmdResult = await runGit(repoPath, args);
  const text = `${cmdResult.stdout}\n${cmdResult.stderr}`.trim();
  const authHint = !cmdResult.ok && isAuthError(text) ? ' Authentication issue detected; verify your Git credentials/token.' : '';

  const result: RepoActionResult = {
    ok: cmdResult.ok,
    action,
    repoPath,
    message: cmdResult.ok ? `${action} completed.` : `${action} failed.${authHint}`,
    stdout: cmdResult.stdout,
    stderr: cmdResult.stderr,
    timestamp: new Date().toISOString()
  };

  await logOperation(repoPath, action, result.ok, result.message, result.stdout, result.stderr);
  await recordRepoActionMetadata(repoPath, action, text, result.timestamp);

  return result;
};

const toCloneUrl = (input: string): string => {
  const trimmed = input.trim();
  if (trimmed.includes('://') || trimmed.startsWith('git@')) return trimmed;
  if (/^[^/]+\/[^/]+$/.test(trimmed)) return `https://github.com/${trimmed}.git`;
  return trimmed;
};

const getTargetFolderName = (cloneUrl: string): string => {
  const cleaned = cloneUrl.split('/').pop() ?? cloneUrl;
  return cleaned.replace(/\.git$/, '');
};

export const cloneRepository = async (request: CloneRequest): Promise<CloneResult> => {
  const timestamp = new Date().toISOString();
  const cloneUrl = toCloneUrl(request.input);
  const folderName = getTargetFolderName(cloneUrl);
  const destination = path.join(request.rootFolder, folderName);

  try {
    await fs.access(destination);
    return {
      ok: false,
      action: 'clone',
      repoPath: destination,
      message: 'Clone blocked: destination folder already exists.',
      stdout: '',
      stderr: '',
      timestamp
    };
  } catch {
    // absent folder
  }

  const result = await runGit(request.rootFolder, ['clone', cloneUrl]);
  const text = `${result.stdout}\n${result.stderr}`.trim();
  const message = result.ok ? 'clone completed.' : `clone failed.${isAuthError(text) ? ' Authentication issue detected; verify your Git credentials/token.' : ''}`;

  await logOperation(destination, 'clone', result.ok, message, result.stdout, result.stderr);

  return {
    ok: result.ok,
    action: 'clone',
    repoPath: destination,
    clonedPath: result.ok ? destination : undefined,
    message,
    stdout: result.stdout,
    stderr: result.stderr,
    timestamp
  };
};
