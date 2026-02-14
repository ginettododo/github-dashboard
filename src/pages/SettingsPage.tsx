import { useMemo, useState } from 'react';
import type { AppSettings } from '../types';

type Props = {
  settings: AppSettings;
  onSave: (next: AppSettings) => Promise<void>;
};

export function SettingsPage({ settings, onSave }: Props) {
  const [rootProjectsFolder, setRootProjectsFolder] = useState(settings.rootProjectsFolder);
  const [expectedReposRaw, setExpectedReposRaw] = useState(settings.expectedRepos.join('\n'));
  const [status, setStatus] = useState<string>('');

  const expectedReposPreview = useMemo(
    () => expectedReposRaw.split('\n').map((line) => line.trim()).filter(Boolean),
    [expectedReposRaw]
  );

  const pickRoot = async () => {
    const selected = await window.repoRadar.pickRootFolder();
    if (selected) {
      setRootProjectsFolder(selected);
    }
  };

  const save = async () => {
    const next: AppSettings = {
      rootProjectsFolder: rootProjectsFolder.trim(),
      expectedRepos: expectedReposPreview
    };
    await onSave(next);
    setStatus('Settings saved.');
    setTimeout(() => setStatus(''), 2500);
  };

  return (
    <section className="panel">
      <h2>Settings</h2>
      <label className="field">
        <span>Root Projects Folder</span>
        <div className="row">
          <input
            value={rootProjectsFolder}
            onChange={(e) => setRootProjectsFolder(e.target.value)}
            placeholder="Choose a local folder containing repos"
          />
          <button onClick={pickRoot}>Browse…</button>
        </div>
      </label>

      <label className="field">
        <span>Expected GitHub repos (owner/repo, one per line)</span>
        <textarea
          value={expectedReposRaw}
          onChange={(e) => setExpectedReposRaw(e.target.value)}
          rows={8}
          placeholder={'openai/codex\nfacebook/react'}
        />
      </label>

      <div className="actions">
        <button className="primary" onClick={save}>Save Settings</button>
        {status && <span className="status">{status}</span>}
      </div>
    </section>
  );
}
