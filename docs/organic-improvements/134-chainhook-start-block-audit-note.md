# Chainhook Start Block Audit

## Summary
Chainhook manifests should have their `start_block` values reviewed before production registration.

## Checks
- Confirm the replay window matches the intended deployment date.
- Record the chosen block height in release notes.
- Avoid reusing stale testnet heights for mainnet registrations.
