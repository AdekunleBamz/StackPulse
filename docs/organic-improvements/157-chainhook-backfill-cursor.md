# Chainhook backfill cursor

Backfill jobs should log the starting cursor and final cursor, but not raw
payload bodies, so replay windows are auditable without leaking event details.
