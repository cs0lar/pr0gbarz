# pr0gbarz 2.0

pr0gbarz is a focused, accessible, self-hosted project and progress tracker. Version 2.0 uses a React interface, Fastify API, and positively identified SQLite database while remaining one process, one port, and one data file.

It provides responsive project/task workflows, bookmarkable views, progress history and honest analytics, reversible archives, integrity-checked JSON portability, CSV reporting, verified backups, and bare-Node/container deployment.

## Screenshots

- [Desktop project workspace](apps/web/visual-tests/task-workspace.spec.ts-snapshots/task-workspace-desktop-linux.png)
- [320px mobile project workspace](apps/web/visual-tests/task-workspace.spec.ts-snapshots/task-workspace-mobile-linux.png)
- [Dark interface system](apps/web/visual-tests/shell.spec.ts-snapshots/components-dark-desktop-linux.png)

## Requirements

- Node.js 24 LTS
- npm 11

Use the version in `.nvmrc` when working with a Node version manager.

## Setup

```sh
npm install
cp .env.example .env
npm run dev
```

The web development server runs at `http://127.0.0.1:5173` and proxies `/api` requests to Fastify at `http://127.0.0.1:8080`.

## Production build

```sh
npm run build
npm run release:check
NODE_ENV=production npm start
```

Fastify serves the compiled web application at `http://127.0.0.1:8080` by default. Set `HOST=0.0.0.0` to listen outside the local machine.

The production artifact also ships as a non-root container with `/data` as its persistent volume. See [Deployment and data operations](docs/deployment.md) for bare-Node and Compose setup, JSON/CSV portability, verified SQLite backups, restore drills, upgrades, and rollback.

## Configuration

| Variable        | Default                  | Description                                               |
| --------------- | ------------------------ | --------------------------------------------------------- |
| `NODE_ENV`      | `development`            | One of `development`, `test`, or `production`             |
| `HOST`          | `127.0.0.1`              | Fastify listen address                                    |
| `PORT`          | `8080`                   | Fastify port from 1 through 65535                         |
| `DATABASE_PATH` | `./data/pr0gbarz.sqlite` | Path to a new or positively identified v2 SQLite database |

Configuration is validated before the server starts. Invalid values produce actionable startup errors.

The first startup creates the parent directory, v2 schema, identity marker, and migration ledger. Existing files are inspected read-only before any migration or write-oriented SQLite setting is applied. Version 1, empty, malformed, and unrelated SQLite files are rejected without modification.

## API

The versioned product API is available under `/api/v1`. It provides projects, tasks, progress history, conservative project analytics, tags, and dashboard aggregates. Every request and response is checked against the shared TypeBox contracts.

Use `GET /health` for process liveness and `GET /ready` for database readiness. See the [API reference](docs/api.md) for endpoints, query options, lifecycle rules, and error responses.

## Quality commands

```sh
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run backup -- --output ./backups/pr0gbarz.sqlite.backup
npm run verify
npm run test:visual --workspace @pr0gbarz/web
```

`npm run verify` runs the local CI-equivalent sequence, including production artifact and bundle-budget checks. Playwright separately checks committed desktop/mobile and light/dark screenshots plus critical workflows in Chromium, Firefox, and WebKit; install them once with `npx playwright install chromium firefox webkit`.

## Workspace

```text
apps/api             Fastify application and production host
apps/web             React/Vite browser application
packages/contracts   Shared TypeBox API contracts
packages/database    SQLite schema and typed repositories
packages/ui          Reusable UI primitives and design tokens
tests/fixtures       Cross-package test fixtures
```

See [Architecture](docs/architecture.md) for package boundaries, [Interface system](docs/interface.md) for frontend conventions, [accessibility verification](docs/accessibility.md), [performance budgets](docs/performance.md), [security posture](docs/security.md), [release verification](docs/release.md), and [AGENTS.md](AGENTS.md) for the implementation contract.

## Database development

Generate a migration after changing the Drizzle schema:

```sh
npm run db:generate --workspace @pr0gbarz/database
```

Resetting a disposable development database requires both its explicit absolute path and the confirmation token:

```sh
npm run db:reset:dev --workspace @pr0gbarz/database -- \
  --database=/absolute/path/to/pr0gbarz.sqlite \
  --confirm=DELETE_V2_DATABASE
```

The reset command refuses to run in production and refuses any database that cannot first be positively identified as pr0gbarz v2. See [Database architecture](docs/database.md) for schema and safety details.

## Version 1 data

Version 2 is a clean break. It will not open, modify, or automatically migrate a v1 database. Configure v2 with a new database path.

## License

GPL-3.0-or-later. See [LICENSE](LICENSE).
