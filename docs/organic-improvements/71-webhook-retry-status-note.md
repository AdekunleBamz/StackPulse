# Webhook Retry Status Note

## Summary
Webhook delivery reviews should show whether a failed delivery is waiting for retry or has exhausted attempts.

## Checks
- Trigger a failed delivery in a non-production target.
- Confirm retrying, failed, and delivered states are distinguishable.
- Record the next retry time when an incident depends on delayed delivery.
