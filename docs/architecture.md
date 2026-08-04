# pr0gbarz 2.0 architecture

## Goals

pr0gbarz remains a small self-hosted application: one Node process, one HTTP port, one web bundle, and one SQLite database. Package boundaries exist to clarify ownership and testing, not to create independently deployed services.

## Runtime shape

During development, Vite serves the browser application and proxies `/api` to Fastify. In production, the web package builds static assets and Fastify serves them alongside the API.

```text
Browser
   |
Fastify (API + static host)
   |
Domain services and typed repositories
   |
SQLite through Drizzle and Node built-in SQLite
```

The database layer is implemented in roadmap phase 2. The typed product API remains scheduled for phase 3.

## Package responsibilities

### `apps/api`

- Creates and configures Fastify.
- Owns process startup, environment validation, logging, and shutdown.
- Hosts API routes and built frontend assets.
- Depends on the database package and will use shared contracts once the typed API exists.

The application factory is separate from `server.ts` so tests can exercise Fastify without opening a network socket.

### `apps/web`

- Owns the React application and browser-only concerns.
- Uses shared contracts rather than importing API implementation details.
- Treats remote data as server state rather than duplicating it in global client stores.

### `packages/contracts`

- Will define versioned request and response schemas once the typed API is implemented.
- Must not depend on Fastify route implementations, React, or the database.

### `packages/database`

- Owns the fresh v2 schema, migrations, connection lifecycle, and repositories.
- Must not expose raw rows as public API contracts.
- Must not recognize or modify v1 databases.

### `packages/ui`

- Will contain reusable accessible primitives and design tokens.
- Must not contain product-domain behaviour or perform API calls.

## Dependency direction

Dependencies point inward toward shared packages:

```text
apps/web -> packages/contracts, packages/ui
apps/api -> packages/contracts, packages/database
packages/database -> domain types it owns
packages/ui -> React only
```

Avoid imports between `apps/web` and `apps/api`. Avoid circular workspace dependencies.

## Configuration

Runtime environment access is isolated in `apps/api/src/config.ts`. Code outside the composition root should receive typed configuration rather than reading `process.env` directly.

`DATABASE_PATH` selects the SQLite file. A nonexistent path is eligible for first-time creation. Every existing path is opened read-only and must contain the v2 product and major-version marker before it is reopened for migrations. See [Database architecture](database.md).

## Testing strategy

- Unit tests cover configuration, calculations, and domain rules.
- Fastify injection tests cover API behaviour without network sockets.
- Repository integration tests use isolated temporary v2 databases.
- Component tests will cover meaningful interactive states.
- Playwright will cover critical end-to-end journeys when product workflows arrive.

Tests must be deterministic and must not make external network calls.

## Legacy code

The root-level v1 server, routes, templates, public assets, and SQL scripts are excluded from the v2 build and quality checks. They are retained temporarily to keep phase 1 focused and will be removed in roadmap phase 9. New code must not import from them.
