# Contract Registry Staleness

## Summary
Contract registry views should identify stale or unverified entries.

## Checks
- Compare registry entries with the latest deployment plan.
- Mark entries from unknown networks for follow-up.
- Avoid treating missing metadata as a successful verification.
