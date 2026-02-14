# RepoRadar Progress Checklist

## Phase 1 — Project Setup
- [x] Define MVP PRD and scope boundaries.
- [x] Create Electron + TypeScript + React scaffold.
- [x] Configure lint/ts build baseline.
- [x] Configure preload bridge and IPC contracts.
- [x] Add electron-builder packaging config.

## Phase 2 — Core Engine (Git + Discovery)
- [x] Implement recursive repo discovery under configured root.
- [x] Integrate git command service abstraction for status/fetch/pull/push.
- [x] Parse origin URLs and infer GitHub `owner/repo`.
- [x] Compute badge logic: CLEAN, DIRTY, AHEAD, BEHIND, DIVERGED, NO_UPSTREAM, DETACHED_HEAD, ERROR.
- [x] Add `MISSING LOCALLY` synthesis from expected repo list.
- [x] Add robust operation error handling and auth-aware messaging.
- [x] Persist repo discovery cache to speed up reloads.
- [x] Persist operation logs and per-repo action timestamps/output.

## Phase 3 — UI
- [x] Create Settings page stub (root picker + expected repos input).
- [x] Create Repo List page stub (table, actions placeholder).
- [x] Wire IPC data flows to backend discovery and status refresh.
- [x] Implement search/filter by text/status chips.
- [x] Implement per-repo actions: Fetch / Pull (rebase) / Push.
- [x] Implement clone flow (URL or owner/repo).
- [x] Implement global Refresh and Rescan.
- [x] Add activity log panel with timestamps and action outcomes.
- [x] Add repo details panel (origin, upstream, output, persisted timestamps).
- [x] Add empty-state CTA when no root folder is configured.

## Phase 4 — Packaging
- [x] Add build scripts for dev/build/dist.
- [x] Configure Windows and macOS targets in electron-builder.
- [ ] Validate local packaging on host-specific platform(s).

## Phase 5 — QA & Hardening
- [x] Validate safety rules (dirty pull blocked, diverged blocked, behind push blocked).
- [ ] Test with mixed repos (clean/dirty/no-upstream/detached/diverged).
- [ ] Test large directory scan behavior and responsiveness.
- [ ] Test auth error messaging with expired/missing credentials.
- [ ] Polish UX copy and add empty/loading/error states.
- [x] Add explicit QA checklist document for critical scenarios.
