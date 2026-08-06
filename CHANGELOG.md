# Changelog

All notable changes to pr0gbarz are documented here. This project follows semantic versioning.

## 2.0.0 — 2026-08-06

Version 2.0 is a clean rebuild with a new, positively identified SQLite schema. It does not open or migrate v1 databases.

### Added

- Responsive React workspace with light, dark, and system themes.
- Dashboard, project, task, tag, archive, filtering, sorting, and keyboard ordering workflows.
- Append-only progress history, accessible SVG charts, velocity, stalled-work detection, schedule health, and conservative projections.
- Shared TypeBox contracts and validated Fastify API under `/api/v1`.
- Versioned integrity-checked JSON export, dry-run/transactional import, CSV reporting, and verified SQLite backup tooling.
- Bare-Node and non-root container deployment with readiness checks and persistent storage.
- Automated formatting, linting, strict typing, tests, accessibility analysis, bundle budgets, visual regression, and cross-browser critical-flow coverage.

### Changed

- Replaced the original implementation with a strict TypeScript npm workspace using Fastify, React, TanStack Query, SQLite, and Drizzle.
- Replaced prompts, editable page content, global scripts, full reloads, and color-only progress with labelled forms, dialogs, optimistic interactions, textual states, and responsive controls.

### Removed

- All v1 routes, `pgbz_` SQL, Liquid templates, Milligram, ProgressBar.js, Sparkline, CDN assets, and global frontend scripts.
- Automatic compatibility with or migration of v1 databases.

### Upgrade note

Start 2.0 with a new database path. Preserve any v1 database separately. A legacy import utility is not included in 2.0.
