# Alert History Pagination

## Summary
Alert history should keep pagination stable while new alerts arrive.

## Checks
- Load the next page during active alert ingestion.
- Confirm duplicate rows do not appear after refresh.
- Keep empty page copy useful when filters are active.
