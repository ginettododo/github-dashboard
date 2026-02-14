import { useEffect, useMemo, useState } from 'react';
import { RepoListPage } from './pages/RepoListPage';
import { SettingsPage } from './pages/SettingsPage';
import type { AppSettings, EnvironmentStatus, OperationLogEntry, RepoAction, RepoStatus } from './shared/types';

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
  const [loadingLabel, setLoadingLabel] = useState('Scanning repositories…');
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);
  const [activeActions, setActiveActions] = useState<Record<string, RepoAction | undefined>>({});
  const [environment, setEnvironment] = useState<EnvironmentStatus | null>(null);

  const api = window.repoRadar;

  const refreshRepos = async (forceRescan = false) => {
    if (!api) return;
    setLoadingLabel(forceRescan ? 'Rescanning repositories…' : 'Refreshing status…');
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
    Promise.all([api.getSettings(), api.getEnvironmentStatus()]).then(([loaded, env]) => {
      setEnvironment(env);
      setSettings(loaded);
      if (loaded.rootProjectsFolder) {
        void refreshRepos();
      }
    });
  }, []);

  const pickRootFolder = async () => {
    if (!api) return;
    const selected = await api.pickRootFolder();
    if (!selected) return;
    const next = { ...settings, rootProjectsFolder: selected };
    await api.setSettings(next);
    setSettings(next);
    await refreshRepos(true);
  };

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

  const refreshAll = async () => {
    if (!api) return;
    setLoadingLabel('Fetching all repositories…');
    setLoading(true);
    try {
      for (const repo of repos) {
        if (repo.badges.includes('MISSING_LOCALLY') || repo.badges.includes('NO_ACCESS')) continue;
        await api.runRepoAction(repo.path, 'fetch');
      }
      await refreshRepos(false);
    } finally {
      setLoading(false);
    }
  };

  const onClone = async (input: string) => {
    if (!api || !settings.rootProjectsFolder) return;
    await api.cloneRepo({ rootFolder: settings.rootProjectsFolder, input });
    await refreshRepos(true);
  };

  const openInVSCode = async (repoPath: string) => {
    if (!api) return;
    await api.openInVSCode(repoPath);
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
          loadingLabel={loadingLabel}
          selectedRepoId={selectedRepoId}
          activeActions={activeActions}
          rootFolder={settings.rootProjectsFolder}
          environment={environment}
          onSelectRepo={setSelectedRepoId}
          onPickRootFolder={pickRootFolder}
          onOpenInVSCode={openInVSCode}
          onRefreshAll={() => { void refreshAll(); }}
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
