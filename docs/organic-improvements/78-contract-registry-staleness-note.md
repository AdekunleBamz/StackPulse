# Contract Registry Staleness

## Summary
Contract registry views should identify stale or unverified entries.

## Checks
- Compare registry entries with the latest deployment plan.
- Mark unknown network entries for follow-up.
- Avoid treating missing metadata as a successful verification.
