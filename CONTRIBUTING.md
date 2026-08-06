# Contributing to pr0gbarz

Thanks for helping make pr0gbarz more focused, accessible, and dependable. Please open an issue before a large change so its product scope and pull-request boundaries can be agreed early. All interactions follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Development setup

Use Node 24 and npm 11:

```sh
npm ci
cp .env.example .env
npm run dev
```

Version 2 uses a fresh SQLite schema. Never point development commands at an irreplaceable database. The reset command is deliberately limited to positively identified v2 databases and requires explicit confirmation; see [Database architecture](docs/database.md).

## Pull requests

Keep a pull request independently useful and reviewable. Include the problem and outcome, scope and non-goals, important decisions, schema/API/configuration changes, tests and manual checks, accessibility/performance impact, visual evidence where relevant, risks, follow-ups, and rollback approach.

Before requesting review, run:

```sh
npm run verify
npm run test:visual --workspace @pr0gbarz/web
```

`verify` enforces formatting, linting, strict types, unit/integration/component tests, production builds, legacy-removal checks, and bundle budgets. Visual work must update intentional Playwright baselines and be inspected at desktop/mobile and light/dark settings. Critical workflows run in Chromium, Firefox, and WebKit in CI.

Do not suppress lint, type, or accessibility findings without a nearby written reason. Do not introduce `any` to bypass validation, expose database rows as wire contracts, add network access to unit tests, or mix unrelated roadmap work into a feature PR.

## Database and API changes

All post-v2 schema changes require forward-only Drizzle migrations. Add repository/API integration tests for constraints, transactions, and error states. Define request and response contracts once in `packages/contracts`, validate both directions, and preserve the stable error envelope.

There is no v1 compatibility layer or automatic legacy import. Do not recreate removed `pgbz_` runtime paths, Liquid templates, global scripts, or legacy dependencies.

## Interface changes

Use the existing tokens and primitives before adding a new pattern. Every workflow must provide labelled controls, keyboard operation, visible focus, reduced-motion behavior, loading/empty/error states, and text or shape equivalents for color and charts. Complete the [accessibility checklist](docs/accessibility.md) for material interaction changes.

## Security and dependencies

Keep runtime dependencies small and self-hosted. Commit lockfile changes with their dependency change. Do not log descriptions, import bodies, backups, environment values, or other unnecessary user data. Report vulnerabilities privately through the repository security channel rather than a public issue.
