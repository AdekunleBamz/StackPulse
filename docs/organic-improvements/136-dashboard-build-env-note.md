# Dashboard Build Env

## Summary
Dashboard build notes should distinguish client-safe public variables from server-only secrets.

## Checks
- Keep `NEXT_PUBLIC_` variables limited to values safe for browsers.
- Document secret names without secret values.
- Confirm Vercel preview and production names stay aligned.
