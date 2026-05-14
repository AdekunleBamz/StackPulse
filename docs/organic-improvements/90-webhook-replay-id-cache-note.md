# Webhook Replay Id Cache

## Summary
Webhook replay handling should define how long delivery ids remain deduplicated.

## Checks
- Test repeated delivery ids inside the replay window.
- Confirm expired replay ids are logged with context.
- Document cache duration in the server handoff notes.
