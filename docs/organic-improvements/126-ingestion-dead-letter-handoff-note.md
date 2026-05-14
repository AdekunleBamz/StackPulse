# Ingestion Dead Letter Handoff

## Summary
Failed ingestion events should have a handoff path for replay or manual review.

## Checks
- Capture event id, source, and failure reason.
- Redact payload fields not needed for replay.
- Document who owns the dead-letter queue review.
