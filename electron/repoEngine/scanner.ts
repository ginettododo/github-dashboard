import fs from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import path from 'node:path';

const DEFAULT_SKIPS = new Set(['node_modules', 'dist', 'build', '.venv', '__pycache__', '.git']);

async function walk(current: string, found: Set<string>): Promise<void> {
  let entries: Dirent[] = [];
  try {
    entries = await fs.readdir(current, { withFileTypes: true });
  } catch {
    return;
  }

  if (entries.some((entry) => entry.isDirectory() && entry.name === '.git')) {
    found.add(current);
    return;
  }

  await Promise.all(
    entries
      .filter((entry) => entry.isDirectory() && !DEFAULT_SKIPS.has(entry.name))
      .map((entry) => walk(path.join(current, entry.name), found))
  );
}

export const discoverRepos = async (rootFolder: string): Promise<string[]> => {
  const found = new Set<string>();
  await walk(rootFolder, found);
  return Array.from(found).sort((a, b) => a.localeCompare(b));
};
