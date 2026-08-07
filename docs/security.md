# Security model

pr0gbarz 2.0 is intended for one person or a trusted household on a private network. It has no authentication or authorization boundary and must not be exposed as a public multi-tenant service. Use a maintained TLS reverse proxy and an external access-control layer if remote access is required.

The server validates request and response contracts, bounds request bodies, emits restrictive browser headers, avoids logging user content, positively identifies database files before write-oriented opening, and applies imports transactionally. Backups and environment files contain private data and require filesystem protection outside the application.

## Dependency advisory assessment

The 2.0.0 release used React Router 7.18.2 and documented that `GHSA-qwww-vcr4-c8h2` was not reachable in pr0gbarz's client-only architecture. Once a patched stable release became available, pr0gbarz migrated to the consolidated `react-router` 8.3.0 package. The application still has no React Router server runtime, RSC routes, framework mode, actions, loaders, SSR, or server-action endpoint.

Run `npm audit` as part of dependency review and upgrade promptly when a reachable advisory affects a production or development dependency. A previous reachability assessment does not waive review of future advisories.

Report a suspected vulnerability privately through the repository security channel. Do not include real database contents, backups, task descriptions, or environment values in a report.
