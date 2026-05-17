# Chainhook Start Height Note

## Summary
Chainhook setup reviews should capture the chosen start height before replay or production subscriptions are enabled.

## Checks
- Record the start height alongside the deployment environment.
- Confirm the height is earlier than the first event required by the dashboard.
- Keep start-height changes visible in release notes when backfills are expected.
