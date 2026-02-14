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
- [x] Add `NO ACCESS` handling for unreadable repo paths.

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
- [x] Add table sorting by status and color-coded badges.
- [x] Add Copy report action.
- [x] Add Git-missing blocking banner.

## Phase 4 — Packaging
- [x] Add build scripts for dev/build/package workflows.
- [x] Configure Windows and macOS targets in electron-builder.
- [x] Emit packaging artifacts to `release/`.

## Phase 5 — QA & Hardening
- [x] Validate safety rules (dirty pull blocked, diverged blocked, behind push blocked).
- [x] Add checklist for mixed repo states and auth failures.
- [x] Add first-run empty/loading/error UX polish.
- [x] Add explicit QA checklist document for critical scenarios.

## MVP Status
- [x] MVP checklist complete and ready for host-platform packaging verification.
