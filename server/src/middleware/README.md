# Server Middleware

Express middleware for request processing, security, and logging.

## Core Middleware

- `auth`: Verify JWT tokens and user sessions.
- `logger`: Request/response logging for observability.
- `error`: Centralized error handling and formatting.
- `validator`: Zod-backed request payload validation.
- `security`: Header hardening and CORS configuration.

## Guidelines

- Keep middleware functions small and focused on one task.
- Always call `next()` or send a response (never leave the request hanging).
- Use `req.app.locals` or `req.user` for passing data between middleware.
