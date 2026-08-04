# Interface system

The phase 4 interface establishes the visual and interaction foundation for all pr0gbarz workflows. Product screens should compose these foundations rather than introduce parallel styling or state systems.

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

## Verification

Vitest and Testing Library cover primitive semantics, keyboard interaction, routing, theme persistence, the typed client, and automated axe checks. Playwright baselines cover 1440px desktop and 320px mobile layouts in light and dark themes, including an explicit horizontal-overflow assertion.

Update screenshots intentionally with:

```sh
npm run test:visual --workspace @pr0gbarz/web -- --update-snapshots
```
