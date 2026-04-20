# Workspace Guide

StackPulse is organized as a small monorepo. Each top-level package owns a different part of the product.

## Package map

| Path | Purpose |
|------|---------|
| `package.json` | Root-level contract test and Clarinet helper scripts |
| `contracts/` | Active and archived Clarity smart contracts |
| `chainhooks/` | Hiro Chainhook manifest files for on-chain event ingestion |
| `server/` | Express + TypeScript backend for chainhook ingestion, alerts, stats, and WebSocket delivery |
| `frontend/` | Next.js app for the landing page, registration flow, dashboard, badges, history, and analytics |
| `shared/` | Shared TypeScript constants, types, and formatting helpers |
| `docs/` | Project docs for API, deployment, contracts, and workspace notes |
| `deployments/` | Clarinet deployment plans for different contract release stages |
| `scripts/` | Operational scripts for deployment, wallet distribution, and interaction testing |

## Common local workflow

```bash
# Install each package used in day-to-day development
npm ci
npm --prefix server ci
npm --prefix frontend ci
npm --prefix shared ci

# Contract checks
npm run clarinet:check
npm run test

# App surfaces
npm --prefix server run dev
npm --prefix frontend run dev

# Optional builds
npm --prefix server run build
npm --prefix frontend run build
```

## Source-of-truth files

- Mounted backend endpoints: `server/src/index.ts`
- Extracted backend route modules: `server/src/routes/`
- Frontend pages: `frontend/src/app/`
- Shared exports: `shared/constants/index.ts`, `shared/types/index.ts`, `shared/utils/index.ts`
- Contract deployment plans: `deployments/`

## Dependency Management

- **Shared Package**: The `shared` package is a local dependency for both the `server` and `frontend`. When you make changes to files in `shared/src`, you **must** run `npm --prefix shared run build` to update the `dist/` directory before those changes will be reflected in the other workspaces.
- **Contract Sync**: Clarity contract changes often require updates to `shared/types/index.ts` (e.g., adding a new alert type ID) and the Hiro Chainhook manifests in `chainhooks/`.

## Best Practices

- **No Direct Dependency**: Avoid making the `shared` package depend on `server` or `frontend`. It should only contain pure logic, types, and constants.
- **Sync manifests**: Keep chainhook manifest names aligned with the matching server handlers in `server/src/index.ts`.
- **Atomic Updates**: If a frontend page depends on shared constants or contract names, update both places in the same change.
