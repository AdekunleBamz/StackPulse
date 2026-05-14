# Release Env Secret Inventory

## Summary
Release handoffs should list required secret names without exposing their values.

## Checks
- Compare secret names across local, preview, and production.
- Redact values from screenshots and logs.
- Confirm optional secrets have documented fallbacks.
