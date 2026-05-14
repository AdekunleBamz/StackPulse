# Billing Copy Fallback

## Summary
Billing-related copy should fall back safely when plan metadata is unavailable.

## Checks
- Simulate missing plan names and limits.
- Confirm alert controls do not disappear silently.
- Keep billing errors separate from chain data errors.
