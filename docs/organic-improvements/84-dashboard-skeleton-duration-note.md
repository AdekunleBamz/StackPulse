# Dashboard Skeleton Duration

## Summary
Dashboard skeletons should not mask long API latency without status feedback.

## Checks
- Measure skeleton visibility during slow API responses.
- Confirm retry or stale-data copy appears after timeout.
- Note any loading-state changes in release review.
