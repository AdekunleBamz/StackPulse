# Chainhook backfill window note

Backfill jobs should record the block range they replayed and the reason for the replay.

This keeps duplicate event triage separate from webhook delivery issues.
