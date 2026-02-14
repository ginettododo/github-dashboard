import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { RepoBadge, RepoStatus } from '../../src/shared/types';
import { readRepoMetadata } from './storage';

const execFileAsync = promisify(execFile);

type GitCmdResult = { ok: boolean; stdout: string; stderr: string; code?: number };

export const runGit = async (repoPath: string, args: string[]): Promise<GitCmdResult> => {
  try {
    const { stdout, stderr } = await execFileAsync('git', args, { cwd: repoPath, maxBuffer: 1024 * 1024 * 8 });
    return { ok: true, stdout, stderr };
  } catch (error) {
    const e = error as { stdout?: string; stderr?: string; code?: number };
    return {
      ok: false,
      stdout: e.stdout ?? '',
      stderr: e.stderr ?? '',
      code: e.code
    };
  }
};

const parseDirtyCounts = (porcelainOutput: string): { modifiedCount: number; untrackedCount: number; dirty: boolean } => {
  const lines = porcelainOutput.split('\n').map((line) => line.trimEnd()).filter(Boolean);
  let modified = 0;
  let untracked = 0;
  for (const line of lines) {
    if (line.startsWith('??')) {
      untracked += 1;
    } else {
      modified += 1;
    }
  }
  return { modifiedCount: modified, untrackedCount: untracked, dirty: lines.length > 0 };
};

const parseGitHubSlug = (originUrl: string): string | null => {
  if (!originUrl.includes('github.com')) return null;
  const normalized = originUrl.trim();
  const sshMatch = normalized.match(/github\.com[:/]([^/]+\/[^/.]+)(?:\.git)?$/i);
  if (sshMatch) return sshMatch[1];
  try {
    const url = new URL(normalized);
    if (url.hostname.toLowerCase() !== 'github.com') return null;
    const slug = url.pathname.replace(/^\//, '').replace(/\.git$/, '');
    if (!slug.includes('/')) return null;
    return slug;
  } catch {
    return null;
  }
};

export const loadRepoStatus = async (repoPath: string): Promise<RepoStatus> => {
  const repoName = path.basename(repoPath);
  const now = new Date().toISOString();

  const branchRes = await runGit(repoPath, ['symbolic-ref', '--short', '-q', 'HEAD']);
  const detachedHead = !branchRes.ok || !branchRes.stdout.trim();
  const branch = detachedHead ? 'DETACHED' : branchRes.stdout.trim();

  const statusRes = await runGit(repoPath, ['status', '--porcelain']);
  const dirtyInfo = parseDirtyCounts(statusRes.stdout);

  const upstreamRes = await runGit(repoPath, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}']);
  const upstream = upstreamRes.ok ? upstreamRes.stdout.trim() : null;

  let ahead = 0;
  let behind = 0;
  if (upstream) {
    const countsRes = await runGit(repoPath, ['rev-list', '--left-right', '--count', `HEAD...${upstream}`]);
    if (countsRes.ok) {
      const [aheadRaw, behindRaw] = countsRes.stdout.trim().split(/\s+/);
      ahead = Number(aheadRaw ?? '0') || 0;
      behind = Number(behindRaw ?? '0') || 0;
    }
  }

  const originRes = await runGit(repoPath, ['remote', 'get-url', 'origin']);
  const originUrl = originRes.ok ? originRes.stdout.trim() : '';
  const githubSlug = parseGitHubSlug(originUrl);

  const badges: RepoBadge[] = [];
  const hasStatusError = !statusRes.ok;
  if (hasStatusError) badges.push('ERROR');
  if (detachedHead) badges.push('DETACHED_HEAD');
  if (!upstream) badges.push('NO_UPSTREAM');
  if (dirtyInfo.dirty) badges.push('DIRTY');
  if (ahead > 0 && behind > 0) badges.push('DIVERGED');
  else {
    if (ahead > 0) badges.push('AHEAD');
    if (behind > 0) badges.push('BEHIND');
  }
  if (!dirtyInfo.dirty && ahead === 0 && behind === 0 && !detachedHead) badges.push('CLEAN');

  const metadata = await readRepoMetadata(repoPath);

  return {
    id: repoPath,
    name: repoName,
    path: repoPath,
    branch,
    detachedHead,
    dirty: dirtyInfo.dirty,
    modifiedCount: dirtyInfo.modifiedCount,
    untrackedCount: dirtyInfo.untrackedCount,
    originUrl,
    githubSlug,
    upstream,
    ahead,
    behind,
    badges,
    lastRefreshTime: now,
    timestamps: metadata,
    lastCommandOutput: metadata?.lastCommandOutput,
    error: hasStatusError ? (statusRes.stderr || 'Unable to read git status') : undefined
  };
};

export const isAuthError = (text: string): boolean => {
  const lower = text.toLowerCase();
  return [
    'authentication failed',
    'could not read username',
    'permission denied',
    'repository not found',
    'access denied',
    'fatal: could not read'
  ].some((fragment) => lower.includes(fragment));
};
