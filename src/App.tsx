import { useEffect, useMemo, useState } from 'react';
import { RepoListPage } from './pages/RepoListPage';
import { SettingsPage } from './pages/SettingsPage';
import type { AppSettings, OperationLogEntry, RepoAction, RepoStatus } from './shared/types';

const emptySettings: AppSettings = {
  rootProjectsFolder: '',
  expectedRepos: []
};

export default function App() {
  const [activePage, setActivePage] = useState<'repos' | 'settings'>('repos');
  const [settings, setSettings] = useState<AppSettings>(emptySettings);
  const [repos, setRepos] = useState<RepoStatus[]>([]);
  const [logs, setLogs] = useState<OperationLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);
  const [activeActions, setActiveActions] = useState<Record<string, RepoAction | undefined>>({});

  const api = window.repoRadar;

  const refreshRepos = async (forceRescan = false) => {
    if (!api) return;
    setLoading(true);
    try {
      const [repoData, logData] = await Promise.all([api.getRepos(forceRescan), api.getLogs()]);
      setRepos(repoData);
      setLogs(logData);
      if (!selectedRepoId && repoData[0]) {
        setSelectedRepoId(repoData[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!api) return;
    api.getSettings().then((loaded) => {
      setSettings(loaded);
      if (!loaded.rootProjectsFolder) {
        setActivePage('repos');
      } else {
        void refreshRepos();
      }
    });
  }, []);

  const onSaveSettings = async (next: AppSettings) => {
    if (!api) return;
    await api.setSettings(next);
    setSettings(next);
    if (next.rootProjectsFolder) {
      await refreshRepos(true);
      setActivePage('repos');
    }
  };

  const runAction = async (repoPath: string, action: RepoAction) => {
    if (!api) return;
    setActiveActions((prev) => ({ ...prev, [repoPath]: action }));
    try {
      await api.runRepoAction(repoPath, action);
      await refreshRepos(false);
    } finally {
      setActiveActions((prev) => ({ ...prev, [repoPath]: undefined }));
    }
  };

  const onClone = async (input: string) => {
    if (!api || !settings.rootProjectsFolder) return;
    await api.cloneRepo({ rootFolder: settings.rootProjectsFolder, input });
    await refreshRepos(true);
  };

  const subtitle = useMemo(() => {
    if (!settings.rootProjectsFolder) {
      return 'Select a root folder to start monitoring repositories.';
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
        <RepoListPage
          repos={repos}
          logs={logs}
          loading={loading}
          selectedRepoId={selectedRepoId}
          activeActions={activeActions}
          rootFolder={settings.rootProjectsFolder}
          onSelectRepo={setSelectedRepoId}
          onRefreshAll={() => { void refreshRepos(false); }}
          onRescan={() => { void refreshRepos(true); }}
          onAction={(repoPath, action) => { void runAction(repoPath, action); }}
          onClone={onClone}
        />
      ) : (
        <SettingsPage settings={settings} onSave={onSaveSettings} />
      )}
    </main>
  );
}
