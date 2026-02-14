import { useMemo, useState } from 'react';
import type { EnvironmentStatus, OperationLogEntry, RepoAction, RepoBadge, RepoStatus } from '../shared/types';

const filterChips: Array<'ALL' | RepoBadge> = ['ALL', 'DIRTY', 'AHEAD', 'BEHIND', 'DIVERGED', 'NO_UPSTREAM', 'DETACHED_HEAD', 'ERROR', 'NO_ACCESS', 'MISSING_LOCALLY'];

const badgeClass = (badge: RepoBadge): string => {
  const map: Record<RepoBadge, string> = {
    CLEAN: 'badge-clean',
    DIRTY: 'badge-dirty',
    AHEAD: 'badge-ahead',
    BEHIND: 'badge-behind',
    DIVERGED: 'badge-diverged',
    NO_UPSTREAM: 'badge-neutral',
    DETACHED_HEAD: 'badge-neutral',
    ERROR: 'badge-error',
    MISSING_LOCALLY: 'badge-neutral',
    NO_ACCESS: 'badge-error'
  };
  return map[badge];
};

type Props = {
  repos: RepoStatus[];
  logs: OperationLogEntry[];
  loading: boolean;
  activeActions: Record<string, RepoAction | undefined>;
  selectedRepoId: string | null;
  rootFolder: string;
  environment: EnvironmentStatus | null;
  loadingLabel: string;
  onSelectRepo: (repoId: string) => void;
  onRefreshAll: () => void;
  onRescan: () => void;
  onAction: (repoPath: string, action: RepoAction) => void;
  onClone: (input: string) => Promise<void>;
  onPickRootFolder: () => Promise<void>;
  onOpenInVSCode: (repoPath: string) => Promise<void>;
};

export function RepoListPage({
  repos,
  logs,
  loading,
  activeActions,
  selectedRepoId,
  rootFolder,
  environment,
  loadingLabel,
  onSelectRepo,
  onRefreshAll,
  onRescan,
  onAction,
  onClone,
  onPickRootFolder,
  onOpenInVSCode
}: Props) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | RepoBadge>('ALL');
  const [cloneInput, setCloneInput] = useState('');
  const [sortByStatus, setSortByStatus] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const severity = (repo: RepoStatus): number => {
      if (repo.badges.includes('ERROR') || repo.badges.includes('NO_ACCESS')) return 5;
      if (repo.badges.includes('DIVERGED')) return 4;
      if (repo.badges.includes('DIRTY')) return 3;
      if (repo.badges.includes('BEHIND') || repo.badges.includes('AHEAD')) return 2;
      if (repo.badges.includes('NO_UPSTREAM') || repo.badges.includes('DETACHED_HEAD')) return 1;
      return 0;
    };

    const result = repos.filter((repo) => {
      const matchesQuery = !q
        || repo.name.toLowerCase().includes(q)
        || repo.path.toLowerCase().includes(q)
        || repo.badges.some((badge) => badge.toLowerCase().includes(q));
      const matchesFilter = filter === 'ALL' || repo.badges.includes(filter);
      return matchesQuery && matchesFilter;
    });

    if (!sortByStatus) return result;
    return [...result].sort((a, b) => severity(b) - severity(a) || a.name.localeCompare(b.name));
  }, [filter, query, repos, sortByStatus]);

  const selected = repos.find((repo) => repo.id === selectedRepoId) ?? null;
  const hasGit = environment?.gitAvailable ?? true;

  if (!rootFolder) {
    return (
      <section className="panel empty-state">
        <h2>Ready to scan your repositories</h2>
        <p>Select your top-level projects folder to let RepoRadar discover Git repos automatically.</p>
        <p>After selection, RepoRadar scans subfolders, summarizes status, and enables safe fetch/pull/push actions.</p>
        <button className="primary" onClick={() => { void onPickRootFolder(); }}>Select Root Folder</button>
      </section>
    );
  }

  const report = filtered
    .map((repo) => `${repo.name} | ${repo.branch} | ahead ${repo.ahead} behind ${repo.behind} | ${repo.badges.join(', ')}`)
    .join('\n');

  return (
    <section className="panel">
      {!hasGit && (
        <div className="blocking-banner">
          Git is not available in PATH. Install Git from https://git-scm.com/downloads, then reopen RepoRadar.
        </div>
      )}

      {loading && (
        <div className="progress-wrap" aria-live="polite">
          <div className="progress-bar" />
          <span>{loadingLabel}</span>
        </div>
      )}

      <div className="row space-between">
        <h2>Repositories</h2>
        <div className="row">
          <button onClick={onRefreshAll} disabled={loading || !hasGit}>Refresh all</button>
          <button onClick={onRescan} disabled={loading || !hasGit}>Rescan</button>
          <button onClick={() => {
            if (!report.trim()) return;
            void navigator.clipboard.writeText(report);
            setCopyStatus('Copied');
            setTimeout(() => setCopyStatus(''), 1500);
          }}>Copy report</button>
          {copyStatus && <span className="status">{copyStatus}</span>}
        </div>
      </div>

      <div className="row">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name, path, or status"
        />
      </div>

      <div className="chip-row">
        {filterChips.map((chip) => (
          <button key={chip} className={chip === filter ? 'active' : ''} onClick={() => setFilter(chip)}>{chip}</button>
        ))}
        <button className={sortByStatus ? 'active' : ''} onClick={() => setSortByStatus((prev) => !prev)}>Sort by status</button>
      </div>

      <div className="clone-row">
        <input
          value={cloneInput}
          onChange={(event) => setCloneInput(event.target.value)}
          placeholder="Clone URL or owner/repo"
        />
        <button
          disabled={!hasGit}
          onClick={async () => {
            const value = cloneInput.trim();
            if (!value) return;
            await onClone(value);
            setCloneInput('');
          }}
        >Clone</button>
      </div>

      <div className="repo-layout">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Branch</th>
                <th>Dirty</th>
                <th>Upstream</th>
                <th>Ahead/Behind</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((repo) => {
                const busy = activeActions[repo.path];
                const blocked = repo.badges.includes('MISSING_LOCALLY') || repo.badges.includes('NO_ACCESS') || !hasGit;
                return (
                  <tr key={repo.id} className={selectedRepoId === repo.id ? 'selected-row' : ''} onClick={() => onSelectRepo(repo.id)}>
                    <td>{repo.name}<div className="mono">{repo.path}</div></td>
                    <td>{repo.branch}</td>
                    <td>{repo.modifiedCount}/{repo.untrackedCount}</td>
                    <td className="mono">{repo.upstream ?? '-'}</td>
                    <td>{repo.ahead}/{repo.behind}</td>
                    <td><div className="badge-wrap">{repo.badges.map((badge) => <span key={badge} className={`badge ${badgeClass(badge)}`}>{badge}</span>)}</div></td>
                    <td>
                      <div className="button-grid">
                        <button disabled={Boolean(busy) || blocked} onClick={(e) => { e.stopPropagation(); onAction(repo.path, 'fetch'); }}>
                          {busy === 'fetch' ? 'Fetching…' : 'Fetch'}
                        </button>
                        <button disabled={Boolean(busy) || blocked} onClick={(e) => { e.stopPropagation(); onAction(repo.path, 'pullRebase'); }}>
                          {busy === 'pullRebase' ? 'Pulling…' : 'Pull (rebase)'}
                        </button>
                        <button disabled={Boolean(busy) || blocked} onClick={(e) => { e.stopPropagation(); onAction(repo.path, 'push'); }}>
                          {busy === 'push' ? 'Pushing…' : 'Push'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <aside className="details-panel">
          <h3>Details</h3>
          {selected ? (
            <>
              <p><strong>Origin:</strong> <span className="mono">{selected.originUrl || '-'}</span></p>
              <p><strong>Upstream:</strong> <span className="mono">{selected.upstream ?? '-'}</span></p>
              {selected.badges.includes('NO_ACCESS') && <p className="error-text"><strong>NO ACCESS:</strong> {selected.error}</p>}
              <p><strong>Last fetch:</strong> {selected.timestamps?.fetchAt ?? '-'}</p>
              <p><strong>Last pull:</strong> {selected.timestamps?.pullRebaseAt ?? '-'}</p>
              <p><strong>Last push:</strong> {selected.timestamps?.pushAt ?? '-'}</p>
              <h4>Last command output</h4>
              <pre>{selected.lastCommandOutput || 'No command output yet.'}</pre>
              {environment?.vscodeAvailable ? (
                <button onClick={() => { void onOpenInVSCode(selected.path); }}>Open in VS Code</button>
              ) : (
                <button title="Install VS Code and enable the `code` command in PATH to use this shortcut." disabled>Open in VS Code</button>
              )}
            </>
          ) : <p>Select a repository row to view details.</p>}
        </aside>
      </div>

      <h3>Activity Log</h3>
      <div className="log-panel">
        {logs.map((log) => (
          <div key={log.id} className={`log ${log.success ? 'info' : 'error'}`}>
            <span className="mono">[{new Date(log.timestamp).toLocaleTimeString()}]</span> <strong>{log.action}</strong> {log.repo}: {log.message}
          </div>
        ))}
      </div>
    </section>
  );
}
