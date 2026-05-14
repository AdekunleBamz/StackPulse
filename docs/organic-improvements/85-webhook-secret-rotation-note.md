# Webhook Secret Rotation

## Summary
Webhook secret rotation should include sender and receiver verification.

## Checks
- Rotate in staging before production.
- Confirm old secrets are rejected after cutover.
- Never paste raw secrets into tickets or release notes.
