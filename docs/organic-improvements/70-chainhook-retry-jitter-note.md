# Chainhook Retry Jitter

## Summary
Retries should include enough jitter to avoid synchronized webhook bursts after provider latency.

## Checks
- Confirm retry logs show attempt count and wait window.
- Compare webhook retry timing in staging before release.
- Note any provider outage context in incident handoff.
