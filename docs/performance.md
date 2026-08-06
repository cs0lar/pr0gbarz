# Performance budgets

Version 2.0 keeps the application small enough for a personal self-hosted service and makes regressions repeatable rather than subjective. `npm run release:check` measures production output after `npm run build` and enforces:

| Budget                             |   Limit |
| ---------------------------------- | ------: |
| Total application JavaScript, gzip | 140 KiB |
| Largest JavaScript chunk, gzip     | 105 KiB |
| Total application CSS, gzip        |  10 KiB |

Self-hosted font files are measured separately because browsers request only the relevant language subset. Dashboard, project-list, and project-workspace route modules are lazy-loaded; Vite reports that this reduced the release build's initial JavaScript chunk from 113.72 kB to 100.68 kB gzip (11.5%) while keeping the total application JavaScript below its budget.

## Query budgets

The API uses bounded list limits (100 projects, 200 tasks), 100 task-history events, and at most 1,000 project progress events from 28 days. Dashboard recent activity is capped at five items and analytics stalled output at 20 tasks. Project analytics performs one bounded task read, one bounded event read, and one grouped last-progress read; it does not query once per task.

SQLite indexes cover active/manual project ordering, project/status and project/manual task access, due dates, task-tag reverse lookup, normalized tag uniqueness, and task progress chronology. Large-history behavior is tested through fixed bounds rather than timing assertions that vary by CI host.

If a budget must change, include the measured before/after output, user-facing benefit, and new threshold in the same pull request. Do not raise a threshold merely to make CI green.
