# Security model

pr0gbarz 2.0 is intended for one person or a trusted household on a private network. It has no authentication or authorization boundary and must not be exposed as a public multi-tenant service. Use a maintained TLS reverse proxy and an external access-control layer if remote access is required.

The server validates request and response contracts, bounds request bodies, emits restrictive browser headers, avoids logging user content, positively identifies database files before write-oriented opening, and applies imports transactionally. Backups and environment files contain private data and require filesystem protection outside the application.

## Dependency advisory assessment

At the 2.0.0 release, npm reports the high-severity React Router advisory `GHSA-qwww-vcr4-c8h2` against 7.18.2. The advisory applies to React Server Components mode and action execution. pr0gbarz is a client-only `react-router-dom` single-page application: it has no React Router server runtime, RSC routes, framework mode, actions, loaders, SSR, or server-action endpoint. The affected execution path is therefore not reachable in this architecture.

Downgrading is not a safe mitigation because earlier available versions are covered by a larger set of XSS, RCE, CSRF, open-redirect, and denial-of-service advisories. Upgrade promptly when an upstream release fixes the RSC advisory, and rerun the full browser suite. This exception is narrow, documented, and does not waive review of future advisories.

Report a suspected vulnerability privately through the repository security channel. Do not include real database contents, backups, task descriptions, or environment values in a report.
