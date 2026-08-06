# Deployment and data operations

pr0gbarz runs as one Node process on one port with one SQLite database. Put it behind a trusted reverse proxy if exposing it beyond a private network; v2.0 has no user authentication.

## Bare Node

Requirements are Node 24 and npm 11. From a clean checkout:

```sh
npm ci
npm run build
NODE_ENV=production HOST=127.0.0.1 PORT=8080 DATABASE_PATH=/srv/pr0gbarz/pr0gbarz.sqlite npm start
```

The service must be able to create and write the database directory. Use `/health` for process liveness and `/ready` for database integrity/readiness. Send `SIGTERM` during shutdown so Fastify stops accepting requests and closes SQLite cleanly.

Production logs are structured JSON. Retain request metadata appropriate for operations, but do not add backup/import bodies or task descriptions to logs. The server limits request bodies to 10 MiB and sends a restrictive Content Security Policy plus anti-framing, MIME-sniffing, and referrer headers.

## Container

The multi-stage image builds all workspaces and runs as the unprivileged `node` user. Its only persistent path is `/data`:

```sh
docker compose up --build -d
docker compose ps
curl --fail http://127.0.0.1:8080/ready
```

The named `pr0gbarz-data` volume survives container replacement and restarts. To use a bind mount, create a dedicated directory writable by UID/GID 1000 and mount it at `/data`. Never store the database only in the container writable layer.

## JSON export and import

JSON backups contain all projects, tasks, tags, task-tag relationships, archived records, and progress events. The envelope is versioned and includes record counts plus SHA-256 hashes for its data section and each collection.

```sh
curl --fail http://127.0.0.1:8080/api/v1/export/json --output pr0gbarz.json
```

Import is intentionally a two-step operation. Construct a request containing the exported object as `backup`, choose `reject` for a fresh/empty target or the destructive `replace` policy for an intentional full replacement, and run `dry_run` first. A dry run exercises the actual inserts and constraints inside a transaction that is always rolled back. Change only `mode` to `apply` after reviewing the returned counts.

Invalid format, hashes, references, constraints, or conflicts never partially write. Import requests are capped by the server's 10 MiB body limit. Larger installations should use the SQLite backup procedure instead.

CSV is a reporting export and is not accepted for restoration:

```sh
curl --fail http://127.0.0.1:8080/api/v1/export/tasks.csv --output tasks.csv
curl --fail "http://127.0.0.1:8080/api/v1/export/tasks.csv?projectId=1" --output project-1-tasks.csv
```

## SQLite backup and restore drill

The backup command uses SQLite's online backup API, refuses to overwrite a file, and verifies the copied v2 identity:

```sh
DATABASE_PATH=/srv/pr0gbarz/pr0gbarz.sqlite npm run backup -- --output /srv/backups/pr0gbarz-2026-08-06.sqlite.backup
```

For a container, run the same compiled command with both `/data` and a backup destination mounted, or stop the service and archive the named volume. Do not copy only the main SQLite file while the application is running; WAL state may be omitted.

Practice restoration before relying on a backup:

1. Stop the application.
2. Preserve the current database and any `-wal`/`-shm` companions as one rollback set; do not delete them.
3. Copy the verified backup to a new path owned by the service account.
4. Set `DATABASE_PATH` to that new path and start the same application version.
5. Confirm `/ready`, open representative active and archived projects, and export JSON for an additional semantic check.
6. Keep the previous rollback set until the restored instance has been verified.

## Upgrades and rollback

Before every upgrade, create and verify a SQLite backup, record the running image/commit, then replace the application while retaining the data volume. Subsequent v2 schema migrations are forward-only, so application rollback may also require restoring the pre-upgrade database backup. Never point an older binary at a database after a newer migration unless its compatibility is explicitly documented.
