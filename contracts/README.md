# StackPulse Smart Contracts

This directory contains the current Clarity contract set plus earlier archived iterations.

## Active contracts

- `stackpulse-v-j4.clar`: user registration, profile data, and subscription state
- `alert-manager-v-j4.clar`: alert creation, toggling, limits, and trigger tracking
- `fee-vault-v-j4.clar`: subscription fee collection and treasury flows
- `reputation-badges-v-j4.clar`: badge and achievement logic

## Archived contracts

Older versions live in `contracts/archive/` and should only be changed when documenting or backtracking a deployment history.

## Common commands

```bash
npm run clarinet:check
npm test
clarinet console
```

## Deployment plans in this repo

Current and historical deployment plans live in `deployments/`, including:

- `default.mainnet-plan.yaml`
- `stackpulse-v2.mainnet-plan.yaml`
- `v2-mainnet-plan.yaml`
- `v-j3-mainnet-plan.yaml`
- `v-j3-fix-plan.yaml`
- `badges-v-j3.mainnet-plan.yaml`

Use the plan that matches the contract version you are deploying and update `docs/DEPLOYMENT.md` when a new plan becomes the default.
- Re-run representative contract calls in Clarinet console after fee or limit changes to confirm expected runtime costs.
