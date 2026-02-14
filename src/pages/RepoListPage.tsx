import { useMemo, useState } from 'react';
import type { OperationLogEntry, RepoAction, RepoBadge, RepoStatus } from '../shared/types';

const filterChips: Array<'ALL' | RepoBadge> = ['ALL', 'DIRTY', 'AHEAD', 'BEHIND', 'DIVERGED', 'NO_UPSTREAM', 'DETACHED_HEAD', 'ERROR', 'MISSING_LOCALLY'];

type Props = {
  repos: RepoStatus[];
  logs: OperationLogEntry[];
  loading: boolean;
  activeActions: Record<string, RepoAction | undefined>;
  selectedRepoId: string | null;
  rootFolder: string;
  onSelectRepo: (repoId: string) => void;
  onRefreshAll: () => void;
  onRescan: () => void;
  onAction: (repoPath: string, action: RepoAction) => void;
  onClone: (input: string) => Promise<void>;
};

export function RepoListPage({
  repos,
  logs,
  loading,
  activeActions,
  selectedRepoId,
  rootFolder,
  onSelectRepo,
  onRefreshAll,
  onRescan,
  onAction,
  onClone
}: Props) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | RepoBadge>('ALL');
  const [cloneInput, setCloneInput] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return repos.filter((repo) => {
      const matchesQuery = !q
        || repo.name.toLowerCase().includes(q)
        || repo.path.toLowerCase().includes(q)
        || repo.badges.some((badge) => badge.toLowerCase().includes(q));
      const matchesFilter = filter === 'ALL' || repo.badges.includes(filter);
      return matchesQuery && matchesFilter;
    });
  }, [filter, query, repos]);

  const selected = repos.find((repo) => repo.id === selectedRepoId) ?? null;

  if (!rootFolder) {
    return (
      <section className="panel">
        <h2>No root folder selected</h2>
        <p>Pick a root folder in Settings to start scanning repositories.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="row space-between">
        <h2>Repositories</h2>
        <div className="row">
          <button onClick={onRefreshAll} disabled={loading}>Refresh</button>
          <button onClick={onRescan} disabled={loading}>Rescan</button>
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
      </div>

      <div className="clone-row">
        <input
          value={cloneInput}
          onChange={(event) => setCloneInput(event.target.value)}
          placeholder="Clone URL or owner/repo"
        />
        <button
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
                return (
                  <tr key={repo.id} className={selectedRepoId === repo.id ? 'selected-row' : ''} onClick={() => onSelectRepo(repo.id)}>
                    <td>{repo.name}<div className="mono">{repo.path}</div></td>
                    <td>{repo.branch}</td>
                    <td>{repo.modifiedCount}/{repo.untrackedCount}</td>
                    <td className="mono">{repo.upstream ?? '-'}</td>
                    <td>{repo.ahead}/{repo.behind}</td>
                    <td><div className="badge-wrap">{repo.badges.map((badge) => <span key={badge} className="badge">{badge}</span>)}</div></td>
                    <td>
                      <div className="button-grid">
                        <button disabled={Boolean(busy) || repo.badges.includes('MISSING_LOCALLY')} onClick={(e) => { e.stopPropagation(); onAction(repo.path, 'fetch'); }}>
                          {busy === 'fetch' ? 'Fetching…' : 'Fetch'}
                        </button>
                        <button disabled={Boolean(busy) || repo.badges.includes('MISSING_LOCALLY')} onClick={(e) => { e.stopPropagation(); onAction(repo.path, 'pullRebase'); }}>
                          {busy === 'pullRebase' ? 'Pulling…' : 'Pull (rebase)'}
                        </button>
                        <button disabled={Boolean(busy) || repo.badges.includes('MISSING_LOCALLY')} onClick={(e) => { e.stopPropagation(); onAction(repo.path, 'push'); }}>
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
              <p><strong>Last fetch:</strong> {selected.timestamps?.fetchAt ?? '-'}</p>
              <p><strong>Last pull:</strong> {selected.timestamps?.pullRebaseAt ?? '-'}</p>
              <p><strong>Last push:</strong> {selected.timestamps?.pushAt ?? '-'}</p>
              <h4>Last command output</h4>
              <pre>{selected.lastCommandOutput || 'No command output yet.'}</pre>
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
