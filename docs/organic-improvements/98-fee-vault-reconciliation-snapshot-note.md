# Fee Vault Reconciliation Snapshot

## Summary
Fee vault checks should capture the block height used for balance reconciliation.

## Checks
- Record block height with each balance snapshot.
- Compare dashboard values against contract reads.
- Keep reconciliation notes free of wallet seed material.
