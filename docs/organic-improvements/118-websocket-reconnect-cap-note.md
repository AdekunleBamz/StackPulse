# Websocket Reconnect Cap

## Summary
Reconnect loops should have a cap and a visible manual retry path.

## Checks
- Simulate repeated websocket failures.
- Confirm retry count is observable in diagnostics.
- Verify manual retry resets only the websocket state.
