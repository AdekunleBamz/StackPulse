# Export CSV Redaction

## Summary
CSV exports used for support should redact sensitive delivery endpoints and webhook secrets.

## Checks
- Review export fields before sharing externally.
- Keep transaction ids only when they are needed for debugging.
- Confirm empty exports still include safe headers.
