# Docker Compose Port Conflict

## Summary
Local compose docs should call out port conflicts for API, websocket, and frontend services.

## Checks
- Start the stack while a default port is already in use.
- Confirm the failure message points to the conflicting service.
- Document alternate ports for local troubleshooting.
