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
