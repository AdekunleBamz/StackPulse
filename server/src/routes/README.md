# Server Routes

These files break the backend into route-focused modules while `../index.ts` remains the current mounted entrypoint.

## Modules in this folder

- `alerts.ts`: list, create, update, delete, toggle, and user-specific alert endpoints
- `analytics.ts`: analytics summary and event tracking routes
- `health.ts`: liveness, readiness, full, and system health checks
- `metrics.ts`: JSON metrics, Prometheus output, and metrics health helpers
- `users.ts`: user listing, profile lookup, creation, updates, and upgrades

## Working rules

- Keep request parsing in the route layer.
- Push reusable logic into `../services/`.
- Update `docs/API.md` when a mounted path changes.
- When introducing route-version changes, keep deprecation windows explicit in both route docs and public API notes.
- Keep `/api` and `/api/v1` behavior aligned during transition windows so clients do not receive different validation behavior per prefix.
- Include request-id examples when adding support-oriented route docs.
- Keep pagination parameter defaults documented with every list route.
