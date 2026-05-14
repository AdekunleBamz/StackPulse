# Websocket Stale Badge

## Summary
Realtime panels should show when websocket data is stale instead of looking silently live.

## Checks
- Simulate a disconnected websocket while cached data remains visible.
- Confirm the stale badge includes the last update time.
- Keep stale and loading states visually distinct.
