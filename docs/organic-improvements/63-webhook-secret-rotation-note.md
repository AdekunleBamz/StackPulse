# Webhook Secret Rotation Note

## Summary
Webhook secret rotation should leave enough evidence to verify delivery without exposing the old or new secret.

## Checks
- Record the rotation time and affected webhook target.
- Confirm one signed delivery succeeds after the new secret is active.
- Redact secret values from screenshots, logs, and incident notes.
