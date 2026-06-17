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
npm --prefix shared install

# Contract checks
npm run clarinet:check
npm run check:fast
npm test

# App surfaces
npm --prefix server run dev
npm run frontend:dev

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

## When changing one package

- Update nearby README files when behavior, commands, or file layout changes.
- Keep chainhook manifest names aligned with the matching server handlers.
- If a frontend page depends on shared constants or contract names, update both places in the same change.
- Keep CI command aliases aligned with this workflow section so local verification matches pipeline behavior.
- Keep release branches on a clean working tree before final verification runs to avoid carrying unrelated edits into production merges.
- Prefer isolated worktrees for release docs when local feature branches contain unrelated changes.
