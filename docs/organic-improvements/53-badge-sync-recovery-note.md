# Badge Sync Recovery

- Retry badge sync jobs with idempotent checkpoints.
- Log last synced block for recovery visibility.
- This improves resilience after transient failures.

- Persist checkpoints per page while resyncing badges to support safe resume.
