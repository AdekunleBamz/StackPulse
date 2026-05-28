# Server Middleware

Express middleware used to protect, validate, and observe requests.

## Modules in this folder

- `errorHandler.ts`: app errors, async wrappers, and not-found handling
- `rateLimiter.ts`: generic, auth, webhook, and tier-aware request limiting
- `requestLogger.ts`: structured request logging
- `security.ts`: security headers, clickjacking protection, and CORS helpers
- `timeout.ts`: request timeout wrapper
- `validation.ts`: body, query, param, and payload-size validation helpers

## Working rules

- Keep middleware focused on a single responsibility.
- Always finish by sending a response or calling `next()`.
- Keep business logic in routes or services rather than inside middleware.
- Emit a timeout-specific metric label so slow upstream dependencies are distinguishable from application errors.
- Place request ID and timing middleware early in the stack so downstream error paths still emit traceable logs.
- Keep auth and rate-limit failures distinguishable in structured logs.
