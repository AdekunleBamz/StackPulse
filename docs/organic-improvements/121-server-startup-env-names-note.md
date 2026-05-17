# Server Startup Env Names Note

## Summary
Server startup diagnostics should name missing variables without printing their values.

## Checks
- Start the server with required variables omitted.
- Confirm logs include variable names only.
- Keep secret values out of error reports.
