# pr0gbarz 2.0 Agent Guide

## Mission

Rebuild pr0gbarz as a sleek, accessible, self-hosted project and progress tracker. Version 2.0 is a clean break from the current application. Preserve the product's lightweight, single-process character, but do not preserve its implementation or database format.

The finished application should make it quick to answer:

- What should I work on next?
- Which work is blocked, overdue, or stalled?
- Is a project progressing quickly enough to meet its target date?
- What changed recently?

Treat this file as the implementation contract for coding agents. Work through the pull-request roadmap in order unless the user explicitly changes priorities.

## Clean-break policy

pr0gbarz 2.0 starts with a new database schema.

- Do not write v1-to-v2 database migrations.
- Do not maintain compatibility with v1 routes, Liquid templates, browser scripts, environment variables, or database tables.
- Do not import or reinterpret a v1 database automatically.
- Do not modify an existing database whose format is not positively identified as v2.
- During development, deleting and recreating a disposable v2 database is acceptable. Never delete an arbitrary user-supplied database automatically.
- If a configured database is legacy, unknown, or malformed, stop with a clear error explaining that v2 requires a new database file.
- Migration support begins at the first v2 schema. All subsequent v2 schema changes must use tracked, forward-only migrations.
- A standalone legacy import tool may be considered after v2.0, but it is not part of this roadmap.

## Product boundaries

The initial v2 release is a personal or trusted-household self-hosted application. It is not a multi-tenant service.

Include in v2.0:

- Project dashboard and project workspace.
- Tasks with descriptions, status, priority, dates, tags, ordering, and progress.
- Search, filtering, and sorting.
- Progress history and useful project analytics.
- Project and task archiving/restoration.
- Responsive light and dark interfaces.
- JSON backup/import and CSV export.
- Bare-Node and container deployment.

Do not add before the v2 core is complete:

- User accounts, organizations, roles, or permissions.
- Cloud synchronization or real-time collaboration.
- Comments, attachments, email delivery, or third-party integrations.
- Recurring tasks, templates, Kanban, or public sharing unless the user explicitly promotes them into scope.
- A distributed service architecture.

## Target architecture

Use this stack unless repository evidence or an explicit user request justifies a change:

- Node.js 24 LTS.
- npm workspaces.
- TypeScript with strict compiler settings and no unchecked indexed access.
- Fastify for the JSON API and production static-file host.
- React and Vite for the web application.
- React Router for routes.
- TanStack Query for server state and optimistic mutations.
- SQLite with Drizzle ORM and Drizzle-managed migrations.
- Fastify JSON Schema and TypeBox for shared validation and inferred types.
- Vitest for unit tests.
- Fastify injection for API integration tests.
- Testing Library for components.
- Playwright for critical browser flows and visual checks.
- ESLint, Prettier, and EditorConfig for static quality.

Aim for this structure:

```text
apps/
  api/                 Fastify application and production entry point
  web/                 React/Vite application
packages/
  contracts/           Shared API schemas and types
  database/            Drizzle schema, migrations, and repositories
  ui/                  Reusable design-system primitives
tests/
  fixtures/            Test data and v2 database fixtures
```

Keep production deployment simple: one Node process, one port, one SQLite file, and static frontend assets served by Fastify. Separate API and Vite processes are fine in development.

## Domain model

Design the first v2 schema directly around the following concepts. Prefer clear names without the old `pgbz_` prefix.

### Project

- ID.
- Name and optional description.
- Optional accent colour.
- Optional start date and target date.
- Manual sort position.
- Active or archived state.
- Created and updated timestamps.

### Task

- ID and owning project ID.
- Name and optional description.
- Status: `backlog`, `planned`, `in_progress`, `blocked`, or `completed`.
- Priority: `none`, `low`, `medium`, `high`, or `urgent`.
- Progress as an integer from 0 through 100.
- Optional start date and due date.
- Manual sort position.
- Active or archived state.
- Created, updated, and optionally completed timestamps.

### Tag

- ID, unique normalized name, label, and optional colour.
- Many-to-many task relationship with a composite uniqueness constraint.

### Progress event

- ID and task ID.
- Previous and new progress values.
- Optional note.
- Timestamp.

Progress history must be append-only during ordinary product use. Metadata activity may later become a broader event model, but do not prematurely build a generic event-sourcing system.

Use database constraints, foreign keys, indexes, and transactions to enforce invariants. Store timestamps consistently in UTC. Store calendar dates as date-only values so timezone conversion cannot change the intended day.

## Behavioural rules

- Empty names are invalid after trimming.
- Progress is always an integer in the inclusive range `0..100`.
- Setting a task to `completed` sets progress to 100 and records completion time.
- Moving a completed task to another status clears completion time but does not silently discard its progress unless product requirements explicitly say so.
- A progress change creates a progress event in the same transaction.
- Creating or deleting related records must be transactional.
- Archive is the default reversible removal action. Permanent deletion requires explicit confirmation and may be deferred until needed.
- Project completion initially uses the unweighted mean of active task progress. An empty project has no completion percentage; do not misleadingly report 0% as measured progress.
- Schedule health and projections must return an explicit “insufficient data” state when they cannot be calculated responsibly.

## API conventions

- Place the API under `/api/v1` even though the product is v2; the API has its own version lifecycle.
- Model resources with conventional `GET`, `POST`, `PATCH`, and `DELETE` semantics.
- Validate params, query strings, request bodies, and response bodies.
- Define contracts once in `packages/contracts`; do not hand-maintain mismatched client and server interfaces.
- Use a consistent JSON error envelope containing a stable code, human-readable message, and optional field errors.
- Return appropriate `400`, `404`, `409`, and `500` responses. Do not report every failure as 500.
- Keep route handlers thin. Put persistence in repositories and domain behaviour in focused services.
- Never construct SQL column names or fragments from unchecked request data.
- Add `/health` for process health and `/ready` for database readiness.
- Log structured request context without logging task descriptions, import contents, or other unnecessary user data.
- Shut down gracefully and close the database connection.

## Interface principles

The interface should feel focused, confident, and fast rather than decorative.

- Replace prompts, confirms, `contenteditable`, and full-page reloads with accessible forms, dialogs, and optimistic interactions.
- Use a responsive application shell with a persistent desktop sidebar and practical mobile navigation.
- Provide explicit loading, empty, error, offline, and first-run states.
- Use design tokens for colour, spacing, typography, radii, elevation, and motion.
- Self-host fonts and icons needed at runtime. Do not rely on public CDNs.
- Support light, dark, and system themes.
- Respect reduced-motion preferences.
- Communicate status and progress using text or shape as well as colour.
- Ensure complete keyboard operation, visible focus, semantic labels, and WCAG 2.2 AA contrast.
- Preserve the pr0gbarz personality through a restrained wordmark and progress-focused visual language. Do not make ASCII art the primary heading.
- Prefer native CSS and small accessible headless primitives over a large pre-themed component framework.
- Use accessible SVG/React charts with textual summaries. Do not retain ProgressBar.js or Sparkline.

## Engineering rules

- Keep the main branch runnable after every roadmap PR.
- Keep changes within the current roadmap phase. Do not opportunistically implement later features.
- Prefer small modules with explicit dependencies over global state or framework magic.
- Do not introduce `any` merely to bypass a type error. Use `unknown`, validation, narrowing, or a precise type.
- Do not suppress lint, type, or accessibility errors without a written reason beside the suppression.
- Do not expose raw database rows directly as API responses.
- Do not put business rules only in React components.
- Do not make network calls during unit tests.
- Use deterministic clocks and IDs in tests where time or identity matters.
- Keep lockfile changes in the PR that changes dependencies.
- Update documentation and `.env.example` whenever commands, configuration, ports, or storage behaviour change.
- Prefer reversible operations. Import must have a dry run and must apply transactionally.
- Treat database files, backups, `.env` files, coverage, Playwright output, and built assets according to an explicit ignore/retention policy.

## Testing expectations

Use the smallest test layer that proves the behaviour, with higher-level coverage for critical journeys.

Every feature should normally include:

- Unit tests for calculations and domain rules.
- Repository or API integration tests for database behaviour and validation.
- Component tests for meaningful interactive states.
- Playwright coverage for a critical user journey when the feature crosses the full stack.

The release test suite must cover:

- First startup and v2 schema creation.
- Refusal to open an unknown or legacy database.
- Project create, edit, archive, and restore.
- Task create, edit, order, filter, archive, and restore.
- Status and progress consistency.
- Transaction rollback after an injected failure.
- Progress-history and analytics calculations.
- JSON export, dry-run import, transactional import, and round-trip equivalence.
- Empty, loading, error, and insufficient-data states.
- Keyboard navigation and automated accessibility checks.
- Chromium, Firefox, and WebKit for critical paths.
- Desktop/mobile and light/dark visual states.

Avoid tests that only mirror implementation details. Assert observable behaviour and data invariants.

## Pull-request roadmap

Each phase below is one pull request. If a phase becomes difficult to review, split it into consecutive PRs without mixing in work from the next phase.

### PR 1 — Tooling and v2 workspace skeleton

Set up the workspace and quality baseline without building product features.

Deliver:

- Node/npm version declarations.
- Workspace structure and strict TypeScript configuration.
- Fastify application factory and minimal React shell.
- Linting, formatting, type checking, unit-test setup, and CI.
- Local development and production-build commands.
- Environment parsing with actionable startup errors.
- Architecture and development documentation.

Acceptance:

- A clean checkout installs, lints, type-checks, tests, builds, and starts through documented commands.
- Fastify serves the built frontend in production mode.
- CI is green and contains no placeholder quality scripts.

### PR 2 — Fresh v2 database and domain foundation

Create the v2 schema from scratch. Do not incorporate the old tables or migration files into the new migration chain.

Deliver:

- Drizzle schema for projects, tasks, tags, task tags, and progress events.
- Initial tracked v2 migration and migration ledger.
- Constraints, foreign keys, indexes, transactions, and repository interfaces.
- Positive v2 database identification, such as schema metadata with a product and major-version marker.
- Safe refusal of old, unknown, or malformed database files.
- Development-only command to recreate a disposable v2 database with explicit confirmation or an explicit test/dev target.
- Repository and migration integration tests.

Acceptance:

- First startup creates a valid v2 database.
- Re-running migrations is a no-op.
- A failed migration or multi-write operation rolls back.
- Foreign-key and integrity checks pass.
- A v1 fixture and an arbitrary SQLite file are rejected without modification.

### PR 3 — Typed API

Implement the product API before building feature screens.

Deliver:

- Shared TypeBox request and response contracts.
- Project, task, tag, progress-history, and dashboard endpoints.
- Search, filter, sort, and pagination/query limits where relevant.
- Domain services for progress/status transitions and project aggregation.
- Consistent errors, health/readiness, logging, and graceful shutdown.
- Comprehensive Fastify injection tests.

Acceptance:

- Every endpoint validates both input and output.
- Invalid data cannot reach the database.
- Route handlers contain no direct SQL.
- Success, invalid input, missing records, conflicts, and transactional failures are tested.

### PR 4 — Design system and application shell

Establish the final visual foundation without implementing full feature workflows.

Deliver:

- Routing, typed API client, TanStack Query, and error boundary.
- Design tokens and accessible reusable primitives.
- Responsive shell, sidebar/mobile navigation, themes, toasts, skeletons, and empty states.
- Self-hosted runtime assets.
- Representative component, accessibility, and screenshot tests.

Acceptance:

- The shell works at 320 px and wide desktop sizes without horizontal overflow.
- Light, dark, system, reduced-motion, keyboard, and focus behaviour work.
- No runtime asset is loaded from a third-party CDN.
- Core primitives meet WCAG 2.2 AA expectations.

### PR 5 — Dashboard and projects

Deliver the first complete user workflow.

Deliver:

- First-run and empty-workspace experience.
- Dashboard summaries for active projects, completion, overdue work, and recent progress.
- Project search, ordering, creation, editing, archiving, and restoration.
- Project overview with completion, dates, schedule health, and explicit insufficient-data states.
- Shareable `/projects/:projectId` routes.
- Optimistic changes with rollback and useful feedback.

Acceptance:

- All project workflows avoid full-page reloads.
- Empty and archived-only workspaces behave correctly.
- Deep links and browser history work.
- API, component, and browser tests cover the complete workflow.

### PR 6 — Task workspace

Deliver the central task-management experience.

Deliver:

- Responsive task list/table with explicit editing controls.
- Task creation, editing, archiving, restoration, and confirmation flows.
- Status, priority, description, dates, tags, and manual ordering.
- Progress slider, numeric input, and quick decrement/increment actions.
- Search, filters, sorting, and URL-represented view state.
- Mouse, touch, and keyboard-accessible reordering or equivalent move controls.

Acceptance:

- Progress and status rules remain consistent under every mutation path.
- Failed optimistic mutations restore the previous state.
- Filtering and sorting can be bookmarked and cleared.
- Critical mouse, touch, keyboard, API, and browser flows are tested.

### PR 7 — Progress history and analytics

Turn progress events into understandable, honest insights.

Deliver:

- Task progress timeline with optional update notes.
- Accessible task and project SVG charts.
- Completed/remaining task summaries, recent velocity, stalled-task detection, and schedule health.
- Documented formulas, fixed-clock tests, and explicit insufficient-data behaviour.
- Bounded history queries and aggregation for older samples if performance requires it.

Acceptance:

- Charts have meaningful textual equivalents.
- Projections never appear when available data cannot support them.
- Calculations are documented and unit-tested.
- Agreed performance budgets hold for large seeded histories.

### PR 8 — Backup, import/export, and deployment

Make v2 portable and safe to operate.

Deliver:

- Versioned JSON export with integrity metadata.
- JSON import validation, dry-run summary, conflict policy, and transactional apply.
- CSV task export.
- Manual v2 database backup command or appropriately restricted endpoint.
- Multi-stage, non-root container build with health check and persistent-volume example.
- Bare-Node and container deployment, backup, restore, and upgrade documentation.
- Security headers, request-size limits, and production logging guidance.

Acceptance:

- Export from v2, import into a fresh v2 instance, and re-export preserves supported data semantically.
- Invalid imports never partially write.
- Container restarts preserve the database.
- Bare-Node and container paths are tested in CI.
- A documented backup-and-restore drill succeeds.

### PR 9 — Release hardening and legacy removal

Prepare the stable 2.0 release.

Deliver:

- Automated accessibility checks and a manual keyboard/screen-reader checklist.
- Cross-browser critical-flow and visual-regression coverage.
- Bundle and query analysis with documented performance budgets.
- Lazy loading where it produces a measured benefit.
- Final metadata, icons, screenshots, changelog, architecture notes, and contributor guide.
- Removal of Liquid, Milligram, ProgressBar.js, Sparkline, old routes, old SQL, and other v1-only code and dependencies.
- Clean install and production release verification.

Acceptance:

- No serious automated accessibility findings remain.
- Performance budgets pass in CI or a documented repeatable check.
- No v1 runtime path or compatibility layer remains.
- The production artifact starts against a fresh v2 database and completes all release smoke tests.

### Post-2.0 feature PRs

Only after v2.0, evaluate recurring tasks, task weights, saved views, templates, local notifications, command palette, Kanban view, and opt-in read-only sharing. Implement each independently valuable capability as its own PR unless the user requests a different grouping.

## PR handoff format

Every implementation handoff or pull-request description must state:

- Problem and outcome.
- Scope and explicit non-goals.
- Important implementation decisions.
- Files or packages most affected.
- Schema and API changes.
- Configuration or deployment changes.
- Tests run and their results.
- Manual verification steps.
- Accessibility and performance impact.
- Screenshots for visual work.
- Risks, follow-ups, and rollback approach.

Do not describe a PR as complete if required checks have not run. State exactly what remains unverified and why.

## Definition of done for v2.0

Version 2.0 is complete when:

- A fresh install creates and identifies a v2 database safely.
- Legacy and unknown databases are rejected without modification.
- Project and task workflows require no prompts or full-page reloads.
- Users can quickly find overdue, blocked, stalled, and incomplete work.
- Progress history provides accessible and responsibly calculated insights.
- Core workflows work on desktop and mobile with keyboard-only operation.
- JSON backup/import round trips are tested and database restoration is documented.
- The application runs as one process with one SQLite file in both bare-Node and container deployments.
- CI enforces formatting, linting, typing, tests, accessibility checks, builds, and critical browser flows.
- No Liquid, Milligram, ProgressBar.js, Sparkline, CDN dependency, v1 route, v1 schema, or global frontend script remains.
