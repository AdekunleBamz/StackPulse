# StackPulse Chainhooks

This directory stores the Hiro Chainhook manifests used to forward Stacks activity into the StackPulse backend.

## Manifest inventory

| File | Event family |
|------|--------------|
| `1-whale-transfer-alert.json` | Large STX transfers |
| `2-new-contract-deployed.json` | New contract deployments |
| `3-nft-mint-tracker.json` | NFT mint activity |
| `4-token-launch-detector.json` | Token launch activity |
| `5-large-swap-alert.json` | Large swap activity |
| `6-user-subscription-created.json` | Subscription creation |
| `7-alert-triggered.json` | Alert trigger events |
| `8-fee-collected.json` | Fee collection |
| `9-badge-earned.json` | Badge awards |

## Working agreement

- Keep manifest names aligned with the matching handlers in `server/src/index.ts`.
- When a webhook target changes, update both the manifest and the backend route docs in `docs/API.md`.
- Treat these JSON files as deployable assets, not generated output.

## Helpful scripts

The repo already contains helpers you can use while registering or checking hooks:

```bash
node scripts/check-chainhook-status.ts
node scripts/register-chainhooks.ts
node scripts/register-stackpulse-chainhooks-v-j3.ts
```

Adjust the runtime command to match your local toolchain if you run the TypeScript files directly.
