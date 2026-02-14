# RepoRadar Progress Checklist

## Phase 1 — Project Setup
- [x] Define MVP PRD and scope boundaries.
- [x] Create Electron + TypeScript + React scaffold.
- [x] Configure lint/ts build baseline.
- [x] Configure preload bridge and IPC contracts.
- [x] Add electron-builder packaging config.

## Phase 2 — Core Engine (Git + Discovery)
- [ ] Implement recursive repo discovery under configured root.
- [ ] Integrate `simple-git` service abstraction for status/fetch/pull/push.
- [ ] Parse origin URLs and infer GitHub `owner/repo`.
- [ ] Compute badge logic: CLEAN, DIRTY, AHEAD, BEHIND, DIVERGED, NO_UPSTREAM, DETACHED_HEAD, ERROR.
- [ ] Add `MISSING LOCALLY` synthesis from expected repo list.
- [ ] Add robust operation error handling and sanitization.

## Phase 3 — UI
- [x] Create Settings page stub (root picker + expected repos input).
- [x] Create Repo List page stub (table, actions placeholder).
- [ ] Wire IPC data flows to real backend discovery.
- [ ] Implement search/filter by text/status.
- [ ] Implement per-repo actions: Fetch / Pull (rebase) / Push / Open Folder / Open in VS Code.
- [ ] Implement global Refresh All.
- [ ] Add activity log panel with timestamps.

## Phase 4 — Packaging
- [x] Add build scripts for dev/build/dist.
- [x] Configure Windows and macOS targets in electron-builder.
- [ ] Validate local packaging on host-specific platform(s).

## Phase 5 — QA & Hardening
- [ ] Validate safety rules (dirty pull blocked, diverged blocked, behind push blocked).
- [ ] Test with mixed repos (clean/dirty/no-upstream/detached/diverged).
- [ ] Test large directory scan behavior and responsiveness.
- [ ] Test auth error messaging with expired/missing credentials.
- [ ] Polish UX copy and add empty/loading/error states.
