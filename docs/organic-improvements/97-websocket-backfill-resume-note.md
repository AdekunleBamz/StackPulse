# Websocket Backfill Resume

## Summary
After websocket reconnects, clients should explain whether missed events are backfilled.

## Checks
- Disconnect during active alert delivery.
- Confirm replayed events do not duplicate notifications.
- Note backfill limits in QA results.
