import { useEffect, useMemo, useState } from 'react';
import { RepoListPage } from './pages/RepoListPage';
import { SettingsPage } from './pages/SettingsPage';
import type { ActivityLogEntry, AppSettings, RepoSummary } from './types';

const emptySettings: AppSettings = {
  rootProjectsFolder: '',
  expectedRepos: []
};

const stubRepos: RepoSummary[] = [
  {
    id: '1',
    name: 'github-dashboard',
    path: '/workspace/github-dashboard',
    branch: 'main',
    dirty: false,
    originUrl: 'git@github.com:example/github-dashboard.git',
    ahead: 0,
    behind: 0,
    badges: ['CLEAN'],
    lastRefreshTime: new Date().toLocaleTimeString()
  },
  {
    id: '2',
    name: 'frontend-kit',
    path: '/workspace/frontend-kit',
    branch: 'feature/reporadar',
    dirty: true,
    originUrl: 'https://github.com/example/frontend-kit.git',
    ahead: 2,
    behind: 2,
    badges: ['DIRTY', 'DIVERGED'],
    lastRefreshTime: new Date().toLocaleTimeString()
  }
];

export default function App() {
  const [activePage, setActivePage] = useState<'repos' | 'settings'>('repos');
  const [settings, setSettings] = useState<AppSettings>(emptySettings);
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);

  useEffect(() => {
    window.repoRadar.getSettings().then((loaded: AppSettings) => {
      setSettings(loaded);
      if (!loaded.rootProjectsFolder) {
        setActivePage('settings');
      }
    });
  }, []);

  const addLog = (message: string, level: ActivityLogEntry['level'] = 'info') => {
    setLogs((prev) => [{
      id: crypto.randomUUID(),
      level,
      timestamp: new Date().toLocaleTimeString(),
      message
    }, ...prev].slice(0, 200));
  };

  const onSaveSettings = async (next: AppSettings) => {
    await window.repoRadar.setSettings(next);
    setSettings(next);
    addLog('Settings updated.');
  };

  const onRefreshAll = () => {
    addLog('Refresh All invoked (stub). This will run fetch + status only in next milestone.');
  };

  const subtitle = useMemo(() => {
    if (!settings.rootProjectsFolder) {
      return 'Configure settings to begin scanning repositories.';
    }
    return `Root: ${settings.rootProjectsFolder}`;
  }, [settings.rootProjectsFolder]);

  return (
    <main className="app-shell">
      <header className="header">
        <div>
          <h1>RepoRadar</h1>
          <p>{subtitle}</p>
        </div>
        <nav className="tabs">
          <button className={activePage === 'repos' ? 'active' : ''} onClick={() => setActivePage('repos')}>Repositories</button>
          <button className={activePage === 'settings' ? 'active' : ''} onClick={() => setActivePage('settings')}>Settings</button>
        </nav>
      </header>

      {activePage === 'repos' ? (
        <RepoListPage repos={stubRepos} logs={logs} onRefreshAll={onRefreshAll} />
      ) : (
        <SettingsPage settings={settings} onSave={onSaveSettings} />
      )}
    </main>
  );
}
