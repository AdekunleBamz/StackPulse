# DB Write Retry Policy

- Retry transient database writes with capped backoff.
- Keep idempotency keys for event-ingest write paths.
- This avoids duplicate records under retry pressure.

- Cap retry attempts and emit a terminal error metric when the cap is reached.
