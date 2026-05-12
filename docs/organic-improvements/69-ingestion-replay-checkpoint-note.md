# Ingestion replay checkpoint note

Record replay checkpoints before backfilling chainhook events so operators can restart safely if ingestion is interrupted.

## Checklist

- Capture the block height and event cursor before replay starts.
- Verify replay output does not duplicate already-delivered alerts.
