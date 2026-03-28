# Chainhook Ingest Checklist

- Validate webhook signature before processing payload.
- Confirm event routing for each supported manifest.
- Check retry behavior on temporary downstream failures.
- Preserve sample payloads for deterministic replay.
