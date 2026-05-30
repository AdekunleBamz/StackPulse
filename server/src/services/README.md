# Server Services

Business logic and infrastructure helpers used by the StackPulse backend.

## Modules in this folder

- `analytics.ts`: in-memory event counting, rollups, and cleanup helpers
- `cache.ts`: cache storage and per-tier cache sizing
- `db.ts`: server-side data access wrapper
- `email.ts`: email delivery service
- `health.ts`: process and dependency health summaries
- `metrics.ts`: application metrics collection
- `notifications.ts`: notification fan-out and user preference handling
- `tier.ts`: user tier lookup, limits, and cache helpers
- `websocket.ts`: live client connections, subscriptions, and broadcasts

## Working rules

- Keep service APIs reusable from routes, background jobs, or tests.
- Log external failures with enough context to debug them.
- Document any tier-aware limits close to the code that enforces them.
- For outbound providers, document retry budgets so alert delivery failures are visible before queues silently degrade.
- Keep cache invalidation notes near services that memoize user-facing data.
- Record provider timeout assumptions beside services that call external APIs.
