# Backfill Job Guardrails

- Limit backfill concurrency to protect live ingestion throughput.
- Expose backfill progress and ETA in the operator dashboard.
- This balances catch-up speed and service stability.

- Enforce max block span per batch to avoid runaway backfill pressure.
