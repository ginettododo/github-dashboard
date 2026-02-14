import { useMemo, useState } from 'react';
import type { ActivityLogEntry, RepoSummary } from '../types';

type Props = {
  repos: RepoSummary[];
  logs: ActivityLogEntry[];
  onRefreshAll: () => void;
};

export function RepoListPage({ repos, logs, onRefreshAll }: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return repos;
    }

    return repos.filter((repo) => {
      return repo.name.toLowerCase().includes(q) || repo.path.toLowerCase().includes(q) || repo.badges.some((b) => b.toLowerCase().includes(q));
    });
  }, [query, repos]);

  return (
    <section className="panel">
      <div className="row space-between">
        <h2>Repositories</h2>
        <button onClick={onRefreshAll}>Refresh All (stub)</button>
      </div>

      <div className="row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by repo name, path, or status"
        />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Path</th>
              <th>Branch</th>
              <th>Origin</th>
              <th>Ahead/Behind</th>
              <th>Status</th>
              <th>Last Refresh</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((repo) => (
              <tr key={repo.id}>
                <td>{repo.name}</td>
                <td className="mono">{repo.path}</td>
                <td>{repo.branch}</td>
                <td className="mono">{repo.originUrl || '-'}</td>
                <td>{repo.ahead}/{repo.behind}</td>
                <td>
                  <div className="badge-wrap">
                    {repo.badges.map((badge) => <span key={badge} className="badge">{badge}</span>)}
                  </div>
                </td>
                <td>{repo.lastRefreshTime}</td>
                <td>
                  <div className="button-grid">
                    <button>Fetch</button>
                    <button>Pull (rebase)</button>
                    <button>Push</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>Activity Log</h3>
      <div className="log-panel">
        {logs.map((log) => (
          <div key={log.id} className={`log ${log.level}`}>
            <span className="mono">[{log.timestamp}]</span> {log.message}
          </div>
        ))}
      </div>
    </section>
  );
}
