# Badge Award Idempotency

## Summary
Badge award flows should avoid duplicate awards when chainhook events replay.

## Checks
- Re-run a badge event payload in staging.
- Confirm badge count and the activity log stay stable.
- Record the event id used for replay testing.
