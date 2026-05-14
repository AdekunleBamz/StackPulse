# Webhook Signature Clock Skew

## Summary
Webhook signature validation should document accepted timestamp skew.

## Checks
- Test delivery timestamps before and after the allowed window.
- Confirm clock-skew errors are logged without secrets.
- Note server clock source in incident runbooks.
