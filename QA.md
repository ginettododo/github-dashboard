# RepoRadar QA Checklist

- [ ] Dirty pull blocked: modify a tracked file, run Pull (rebase), verify blocking message appears and no git operation is run.
- [ ] Diverged pull blocked: create ahead+behind state, run Pull (rebase), verify app blocks with manual resolution guidance.
- [ ] Auth failure surfaced: use invalid/expired credentials for fetch/push/pull and verify auth-specific error hint is shown.
- [ ] No upstream branch: test repo branch without upstream and verify pull/push are blocked with clear explanation.
- [ ] Missing repo clone flow: set expected `owner/repo` that is absent, clone via owner/repo input, verify repo appears after rescan.
