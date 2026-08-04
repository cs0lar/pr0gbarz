# pr0gbarz v2 database

## Safety boundary

Version 2 deliberately has no compatibility path for the v1 database.

When opening a configured path:

1. A nonexistent file is treated as a new v2 database.
2. An existing file is opened read-only.
3. Legacy `pgbz_` tables produce a specific v1 rejection.
4. The `app_metadata` singleton must identify product `pr0gbarz` and major version `2`.
5. Only after identification succeeds is the file opened read-write, configured, and migrated.
6. SQLite quick-check and foreign-key checks must pass before startup continues.

Empty files, arbitrary SQLite schemas, malformed files, v1 databases, and unsupported major versions are never migrated or modified.

## Technology

The database package uses:

- Node.js built-in `node:sqlite`, avoiding an additional native driver.
- Drizzle ORM for typed statements and repositories.
- Drizzle Kit for generated, version-controlled SQL migrations.
- Drizzle's `__drizzle_migrations` ledger for exactly-once migration tracking.

Drizzle is isolated behind `packages/database` so applications do not depend on driver details.

## Initial schema

### `app_metadata`

A constrained singleton containing the product identifier, database major version, and creation time. This is the positive identity marker, not a user-editable setting.

### `projects`

Project name, description, accent, date-only schedule, manual order, archive time, and UTC creation/update timestamps.

### `tasks`

Project ownership, task content, constrained status and priority, progress from 0 through 100, date-only schedule, manual order, archive/completion times, and UTC creation/update timestamps.

Completion consistency is enforced: completed tasks require progress 100 and a completion timestamp; non-completed tasks cannot retain a completion timestamp.

### `tags` and `task_tags`

Unique normalized tag names and a composite-key many-to-many task relationship. Foreign keys cascade when their owning records are removed.

### `progress_events`

Append-oriented task progress history containing previous/new progress, optional note, and UTC occurrence time.

## Invariants

- Foreign-key enforcement is enabled for every writable connection.
- Multi-write operations use SQLite transactions.
- Every migration batch runs transactionally.
- Names cannot be empty after trimming.
- Progress values stay in `0..100`.
- Status and priority values are constrained.
- Calendar dates use `YYYY-MM-DD` text and are not timezone-adjusted.
- UTC timestamps use integer Unix milliseconds.
- Useful ownership, active-order, status, due-date, tag, and history indexes are created with the schema.

## Development reset

The reset command is deliberately cumbersome. It requires a non-production environment, an explicit path, a confirmation token, and successful v2 identity inspection before deleting the database and its SQLite sidecar files. It must never be pointed at user data.
