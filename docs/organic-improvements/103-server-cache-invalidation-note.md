# Server Cache Invalidation

## Summary
Server cache invalidation should be documented for alert rules, subscriptions, and pricing data.

## Checks
- Confirm saved rule changes invalidate all cached reads.
- Test stale cache recovery after server restart.
- Add cache keys to diagnostics without storing secrets.
