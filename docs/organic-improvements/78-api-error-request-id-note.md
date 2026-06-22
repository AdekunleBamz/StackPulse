# API Error Request ID Note

## Summary
API error reports should include request IDs when available so server logs can be matched without sharing payloads.

## Checks
- Capture the request ID from the response headers or error body.
- Redact alert payload fields that are not needed for the investigation.
- Note whether the error came from dashboard, webhook, or background job traffic.
