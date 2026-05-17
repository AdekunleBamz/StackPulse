# Dashboard Clock Source Note

## Summary
Dashboard freshness checks should identify whether a stale time comes from the browser clock, server clock, or chain height.

## Checks
- Compare the dashboard timestamp with the latest indexed block time.
- Confirm the browser clock is not skewed before filing stale data bugs.
- Include the observed server response time when available.
