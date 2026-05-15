# Rate Limit Copy Parity

## Summary
API and UI rate-limit messages should point users toward the same retry expectation.

## Checks
- Include retry timing when the backend returns `Retry-After`.
- Keep dashboard copy aligned with API documentation.
- Recheck wording after rate-limit window changes.
