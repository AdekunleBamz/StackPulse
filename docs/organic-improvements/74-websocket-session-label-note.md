# WebSocket Session Label

## Summary
WebSocket diagnostics should make reconnecting sessions easy to correlate.

## Checks
- Include session id or connection id in debug logs.
- Verify reconnect messages keep the same user context.
- Avoid logging tokens or private headers.
