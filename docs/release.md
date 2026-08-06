# 2.0 release verification

Use this checklist from a clean clone before tagging a release.

```sh
npm ci
npm run verify
npx playwright install chromium firefox webkit
npm run test:visual --workspace @pr0gbarz/web
```

Then verify:

1. Start the production artifact against a nonexistent database path and confirm `/ready`.
2. Complete project, task, progress, archive, history, and filtering smoke flows with keyboard only.
3. Complete the manual [accessibility checklist](accessibility.md).
4. Export JSON, dry-run and apply it to a fresh instance, and compare the re-exported supported data.
5. Run the SQLite backup/restore drill in [deployment guidance](deployment.md).
6. Build and restart the container with its persistent volume.
7. Confirm a v1 fixture and unrelated SQLite file are refused without modification.
8. Review `npm run release:check` measurements against [performance budgets](performance.md).
9. Inspect the committed desktop/mobile screenshots in light and dark themes.
10. Confirm `CHANGELOG.md`, package versions, image tag examples, and release notes agree.

Review `npm audit` and the documented [security model](security.md). Any accepted advisory requires a current reachability assessment; new or changed advisories block release until reviewed.

The release is not complete while any required check is skipped without a documented reason.
