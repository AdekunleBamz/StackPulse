# Chainhook Replay Boundary

- Define safe replay boundaries for historical catch-up runs.
- Track replay start and end block heights for audits.
- This avoids duplicate processing beyond intended windows.

- Cap replay windows with a max block boundary to avoid runaway backfills.
