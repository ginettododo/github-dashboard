# DEV Guide

## Project structure
- `electron/main.ts`: Electron app lifecycle + IPC handlers.
- `electron/preload.ts`: secure renderer bridge API (`window.repoRadar`).
- `electron/repoEngine/`: discovery, git execution, caching, logs.
- `src/App.tsx`: page orchestration, loading state, environment checks.
- `src/pages/RepoListPage.tsx`: main dashboard table/actions.
- `src/pages/SettingsPage.tsx`: root folder + expected repos config.
- `src/shared/types.ts`: shared contracts used by main and renderer.

## IPC contracts
Defined in `preload.ts` and consumed by renderer:
- `settings:get` / `settings:set`
- `settings:pick-root-folder`
- `repo:get-all(forceRescan)`
- `repo:get-logs`
- `repo:action(repoPath, action)`
- `repo:clone(request)`
- `repo:open-folder(repoPath)`
- `repo:open-vscode(repoPath)`
- `env:get-status`

## Adding a new repo action
1. Extend action union in `src/shared/types.ts`.
2. Add command mapping and safety checks in `electron/repoEngine/index.ts`.
3. Persist metadata/logging via storage helpers (already wired in engine).
4. Expose and invoke via IPC (`main.ts` + `preload.ts` if needed).
5. Add renderer UI trigger in `RepoListPage.tsx`.
6. Update QA checklist and docs.

## Packaging notes
- Electron Builder config lives in `package.json -> build`.
- Output directory is `release/`.
- Scripts:
  - `npm run build:win`
  - `npm run build:mac`
  - `npm run build:all`

## Signing / notarization (not yet implemented)
To distribute without macOS trust warnings, configure:
- Apple Developer ID certificates.
- `CSC_LINK`/`CSC_KEY_PASSWORD` for signing.
- `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` for notarization.

Then add `afterSign` notarization workflow in electron-builder config.
