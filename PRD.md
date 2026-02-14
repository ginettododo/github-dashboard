# RepoRadar PRD (MVP)

## 1. Goals
- Build a cross-platform desktop app (Windows + macOS) to monitor and manage many local GitHub repositories.
- Provide fast visibility into repository health (branch state, cleanliness, upstream sync status).
- Enable safe, explicit git operations (fetch, pull --rebase, push) with guardrails.
- Keep authentication out of app-managed credentials by relying on existing git auth configuration.
- Package distributables with `electron-builder` for real desktop installation/use.

## 2. Non-goals (MVP)
- No auto-commit on file changes.
- No automatic merge/reconciliation when local and remote diverge.
- No requirement for GitHub OAuth/token setup to use core local monitoring.
- No server-side backend or hosted service.
- No advanced PR/review workflows, branch creation, conflict resolution UI, or stash management.

## 3. Personas & Primary Jobs-to-be-done
- **Solo developer with many local repos**: wants one place to know what is dirty/out-of-date and quickly fetch/pull/push.
- **Team lead with many project checkouts**: wants to scan a root folder and quickly identify repos needing action.

## 4. User Experience Flows

### 4.1 First Launch / Settings Flow
1. User opens RepoRadar.
2. App opens **Settings** if no root folder configured.
3. User selects a **Root Projects Folder** via native directory picker.
4. User optionally enters expected repositories (manual list, one `owner/repo` per line).
5. User saves settings.
6. App returns to dashboard and runs initial discovery.

### 4.2 Repository Discovery Flow
1. User triggers discovery (initial load or Refresh All).
2. App recursively scans root folder for `.git` directories.
3. For each detected repo:
   - Resolve repo metadata (name, path, current branch, origin URL).
   - Determine working tree cleanliness.
   - Determine ahead/behind vs upstream where possible.
   - Compute status badges.
   - Record last refreshed timestamp.
4. For manual expected repo list entries not found locally, show row as **MISSING LOCALLY** with **Clone** affordance (MVP may show button stub if clone not yet wired).

### 4.3 Per-Repo Action Flow
- **Fetch**: Always allowed for valid repos; updates status afterwards.
- **Pull (rebase)**:
  - Allowed only when working tree is clean and upstream exists.
  - If dirty: blocked with explanation in UI/log.
  - If diverged: blocked and require manual action.
- **Push**:
  - Allowed only when ahead > 0 and not behind.
  - If behind > 0: blocked/suggest pull first.
  - If diverged: blocked.
- **Open Folder**: Opens OS file explorer/finder.
- **Open in VS Code**: Attempts `code <path>`, shows error if command unavailable.

### 4.4 Global Flow
- **Refresh All** executes fetch + status refresh for each repo (no pull/push).
- User can filter by text (name/path) and status badge.

### 4.5 Logging Flow
- Activity panel captures operation start/end timestamps and sanitized command/output snippets.
- Each operation writes log entries with level: info/warn/error.

## 5. Functional Requirements

### 5.1 Settings
- Persist local config file in app data directory.
- Config fields:
  - `rootProjectsFolder: string`
  - `expectedRepos: string[]` (`owner/repo`)
  - optional future flags (`autoRefreshInterval`, etc.)

### 5.2 Repo Metadata and Status
For each repo row show:
- Repo name
- Local absolute path
- Current branch (or detached marker)
- Dirty/clean indicator
- Upstream/origin URL
- Ahead count
- Behind count
- Status badges
- Last refresh timestamp

### 5.3 GitHub Inventory (Pragmatic MVP)
- Parse GitHub `owner/repo` from `origin` URL forms:
  - `git@github.com:owner/repo.git`
  - `https://github.com/owner/repo.git`
- Optional external listing by org/user is allowed only when a token is available.
- Core MVP does not fail if GitHub API listing unavailable.

### 5.4 Repo Operations Guardrails
- No implicit write operations outside explicit user actions.
- Pull blocked on dirty repo.
- Push blocked if behind.
- Diverged repos must report manual intervention required.

## 6. Status Logic Definitions
Given:
- `hasUpstream`: branch tracks remote branch
- `isDetached`: HEAD detached
- `dirty`: modified/staged/untracked files exist
- `ahead`: commits ahead of upstream
- `behind`: commits behind upstream

Badges (can co-exist):
- `ERROR`: metadata/action evaluation failed.
- `DETACHED_HEAD`: `isDetached == true`.
- `NO_UPSTREAM`: `hasUpstream == false`.
- `DIRTY`: `dirty == true`.
- `CLEAN`: `dirty == false`.
- `AHEAD`: `ahead > 0 && behind == 0`.
- `BEHIND`: `behind > 0 && ahead == 0`.
- `DIVERGED`: `ahead > 0 && behind > 0` (manual action required).
- `MISSING_LOCALLY`: expected repo from settings absent from filesystem.

Priority guidance for headline status:
1. ERROR
2. MISSING_LOCALLY
3. DETACHED_HEAD
4. DIVERGED
5. NO_UPSTREAM
6. DIRTY/CLEAN with AHEAD/BEHIND decorations

## 7. Edge Cases
- **Diverged branch**: never auto-merge/rebase; show clear block and instructions.
- **Dirty working tree**: block pull (rebase) and log reason.
- **No upstream**: show badge; fetch may work, pull/push may be blocked depending on branch tracking.
- **Authentication failures**: capture git stderr, advise using existing CLI/SSH credential setup; do not prompt for username/password.
- **Submodules**: detect parent repo normally; submodule state may appear dirty in parent status and should be reflected as such.
- **Large scans**: recursive scan should be non-blocking/asynchronous with progress indicator in later iteration; MVP can do single-pass with UI loading state.
- **Detached HEAD**: disallow pull/push actions requiring branch tracking; show warning.
- **Non-GitHub remotes**: still supported for local git operations; GitHub-specific owner/repo inference may be blank.

## 8. Architecture (MVP)
- **Electron main process**: native shell integration, dialogs, filesystem config, git orchestration via `simple-git`.
- **Preload script**: secure IPC bridge exposing typed API.
- **React renderer**: Settings, Repo List, filters, action buttons, logs.
- **Persistence**: JSON config file under `app.getPath('userData')`.

## 9. Packaging & Distribution
- Use `electron-builder` with targets:
  - Windows: NSIS installer and/or portable exe
  - macOS: `.app` (DMG optional)
- Output artifacts in `dist/`.

## 10. Acceptance Criteria (MVP)
1. User can select and save root folder in Settings.
2. On refresh, app discovers git repos recursively under root.
3. Each repo row displays required metadata and status badges.
4. App blocks unsafe operations per guardrails (dirty pull, behind push, diverged auto-action).
5. Refresh All performs fetch+status only.
6. Activity log records operations with timestamps.
7. App builds/runs in dev mode locally.
8. `electron-builder` configuration exists and produces Windows/macOS artifacts in CI/local where platform tools are available.

## 11. Milestones After MVP (Future)
- Optional GitHub device flow integration.
- Clone missing repositories action fully implemented.
- Background periodic refresh.
- Repo grouping/tags and notifications.
