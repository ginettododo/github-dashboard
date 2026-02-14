import { app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { OperationLogEntry, RepoAction, RepoActionTimestamps } from '../../src/shared/types';

const dataDir = () => app.getPath('userData');

const cachePath = () => path.join(dataDir(), 'repo-cache.json');
const logPath = () => path.join(dataDir(), 'repo-operations.log.jsonl');
const metadataPath = () => path.join(dataDir(), 'repo-metadata.json');

export type RepoCache = {
  rootFolder: string;
  repos: string[];
  scannedAt: string;
};

export const readRepoCache = async (): Promise<RepoCache | null> => {
  try {
    const raw = await fs.readFile(cachePath(), 'utf-8');
    return JSON.parse(raw) as RepoCache;
  } catch {
    return null;
  }
};

export const writeRepoCache = async (cache: RepoCache): Promise<void> => {
  await fs.mkdir(dataDir(), { recursive: true });
  await fs.writeFile(cachePath(), JSON.stringify(cache, null, 2), 'utf-8');
};

export const appendOperationLog = async (entry: OperationLogEntry): Promise<void> => {
  await fs.mkdir(dataDir(), { recursive: true });
  await fs.appendFile(logPath(), `${JSON.stringify(entry)}\n`, 'utf-8');
};

export const readOperationLogs = async (maxEntries = 400): Promise<OperationLogEntry[]> => {
  try {
    const raw = await fs.readFile(logPath(), 'utf-8');
    return raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as OperationLogEntry)
      .slice(-maxEntries)
      .reverse();
  } catch {
    return [];
  }
};

type MetadataStore = Record<string, RepoActionTimestamps & { lastCommandOutput?: string }>;

const readMetadataStore = async (): Promise<MetadataStore> => {
  try {
    const raw = await fs.readFile(metadataPath(), 'utf-8');
    return JSON.parse(raw) as MetadataStore;
  } catch {
    return {};
  }
};

const writeMetadataStore = async (data: MetadataStore): Promise<void> => {
  await fs.mkdir(dataDir(), { recursive: true });
  await fs.writeFile(metadataPath(), JSON.stringify(data, null, 2), 'utf-8');
};

export const readRepoMetadata = async (repoPath: string): Promise<(RepoActionTimestamps & { lastCommandOutput?: string }) | undefined> => {
  const store = await readMetadataStore();
  return store[repoPath];
};

export const recordRepoActionMetadata = async (repoPath: string, action: RepoAction, output: string, timestamp: string): Promise<void> => {
  const store = await readMetadataStore();
  const entry = store[repoPath] ?? {};
  if (action === 'fetch') entry.fetchAt = timestamp;
  if (action === 'pullRebase') entry.pullRebaseAt = timestamp;
  if (action === 'push') entry.pushAt = timestamp;
  entry.lastCommandOutput = output;
  store[repoPath] = entry;
  await writeMetadataStore(store);
};
