# RepoRadar QA Final Checklist

## Packaging
- [ ] `npm run build:win` produces Windows installer and/or portable EXE in `release/`.
- [ ] `npm run build:mac` produces DMG/ZIP in `release/`.
- [ ] App launches from packaged artifacts.

## First-run UX
- [ ] With no root configured, empty state appears with **Select Root Folder** CTA.
- [ ] Selecting root starts scan and shows progress indicator.

## Core behavior
- [ ] Repos are discovered under the selected root folder.
- [ ] Status table shows branch, dirty counts, upstream, ahead/behind, badges.
- [ ] Refresh all performs fetch + status only (no pull/push).
- [ ] Copy report copies current visible summary text.

## Safety and robustness
- [ ] Pull (rebase) blocked on dirty working tree.
- [ ] Pull (rebase) blocked on diverged branch.
- [ ] Push blocked when no commits are ahead.
- [ ] Missing upstream state clearly shown.
- [ ] `NO ACCESS` state shown for unreadable repo folders.
- [ ] Git missing banner shown when Git is unavailable.
- [ ] VS Code action hidden/disabled with guidance when `code` command is unavailable.

## Auth and errors
- [ ] Auth failures show actionable hint.
- [ ] Operation logs capture success/failure messages with timestamps.

## Manual OS checks
- [ ] Windows: can pick folder and scan nested repos.
- [ ] macOS: folder picker grants access to chosen directory; unreadable repos surface as `NO ACCESS`.
