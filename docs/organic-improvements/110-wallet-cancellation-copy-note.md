# Wallet Cancellation Copy

## Summary
Wallet cancellation messages should distinguish user rejection from network or contract errors.

## Checks
- Reject a wallet prompt for each write flow.
- Confirm cancelled requests do not retry automatically.
- Keep rejection copy short enough for toasts.
