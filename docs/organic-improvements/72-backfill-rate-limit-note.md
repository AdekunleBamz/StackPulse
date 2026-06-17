# Backfill Rate Limit Note

## Summary
Backfill jobs should document rate-limit expectations before they are run against shared infrastructure.

## Checks
- Record the event range and estimated request count.
- Confirm the backfill can pause or resume without duplicating alerts.
- Run large backfills outside the primary incident response window when possible.
