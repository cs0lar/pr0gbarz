# Interface system

The interface system establishes the visual and interaction foundation for all pr0gbarz workflows. Product screens should compose these foundations rather than introduce parallel styling or state systems.

## Design language

Tokens in `packages/ui/src/styles.css` define colour, spacing, typography, radii, elevation, focus, and motion. Components use semantic tokens such as `--color-surface` and `--color-ink-muted`; feature code must not depend on a theme-specific colour value.

The interface bundles the Inter variable font and uses code-native SVG icons, so it makes no runtime asset requests to public CDNs. Bundling the font also keeps text metrics and visual baselines consistent across deployments. The restrained bar mark is both the wordmark and the progress motif.

## Themes and motion

Light, dark, and system themes are available in the desktop sidebar. Explicit choices are stored locally; system mode follows `prefers-color-scheme`. Controls remain understandable without colour alone.

Both the application and primitives honor `prefers-reduced-motion`. Essential state changes remain immediate and do not depend on animation.

## Reusable primitives

`@pr0gbarz/ui` owns buttons, icon buttons, cards, badges, progress, skeletons, empty states, dialogs, and visually hidden content. They provide minimum target sizes, visible focus, semantic roles, and shared responsive behaviour. Domain behaviour and API calls remain in the web application.

## Application composition

React Router owns shareable browser routes. TanStack Query owns remote server state, retries, and later optimistic mutation coordination. The typed API client consumes types from `@pr0gbarz/contracts` and converts API error envelopes into `ApiError` values.

The application error boundary handles unrecoverable render failures. Route errors, offline status, loading skeletons, empty states, and toast feedback have dedicated accessible presentations.

## Dashboard and projects

The dashboard answers what needs attention before presenting detail: measured completion, active work, overdue and blocked counts, recent progress, and the manually ordered project list. A new installation receives a focused first-project prompt instead of zero-valued metrics that imply measured activity.

Project search and sort choices live in the URL. `/projects/:projectId` is the stable project overview route, and browser back/forward navigation remains within the application shell. Create and edit use labelled dialogs; archive is confirmed and reversible from `/archive`. Mutations update cached views optimistically where an existing project is changed, restore the previous cache after failure, and provide live-region feedback.

Missing dates or progress produce an explicit insufficient-data explanation instead of a speculative schedule status.

## Task workspace

The project overview contains the task workspace. Its responsive cards expose status, priority, dates, tags, progress, and explicit edit/archive actions without relying on colour. The same controls collapse into a one-column mobile layout rather than a horizontally scrolling table.

Search, status, priority, tag, sort direction, task ordering, and active/archive selection are represented in the project URL. Manual ordering is available only in the unfiltered manual view so move controls always describe the persisted order. Move buttons have meaningful accessible names and work with mouse, touch, and keyboard input.

Progress can be changed with a slider, a bounded numeric field, ten-point quick actions, or completion status. Editing a measured change may include an optional progress note. Optimistic quick changes restore cached task lists after a failed request and announce both success and rollback through the notification live region.

Archive remains the reversible removal action. Task archive confirmation explains that progress history is retained; Undo and the project-scoped archived view both restore tasks.

## Progress history and analytics

The project overview presents completed and remaining work, recent velocity, projection, daily progress gained, and stalled work. Empty histories and unsupported projections say “insufficient data” instead of displaying a zero or invented date. Charts are native SVG figures with an accessible name, description, and visible textual summary, so their meaning does not depend on interpreting the line or colour.

Each task exposes a History action. Its dialog shows at most the latest 100 append-only progress events, including optional notes, in newest-first order. The chart reconstructs those events chronologically while the adjacent ordered timeline retains exact previous/new values and timestamps.

## Verification

Vitest and Testing Library cover primitive semantics, keyboard interaction, routing, theme persistence, the typed client, and automated axe checks. Playwright baselines cover 1440px desktop and 320px mobile layouts in light and dark themes, including an explicit horizontal-overflow assertion.

Update screenshots intentionally with:

```sh
npm run test:visual --workspace @pr0gbarz/web -- --update-snapshots
```
