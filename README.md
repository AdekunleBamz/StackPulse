# StackPulse

StackPulse is a Stacks monitoring workspace that combines Clarity contracts, Hiro Chainhook manifests, an Express ingestion server, a shared TypeScript package, and a Next.js frontend.

## Workspace overview

- `contracts/`: on-chain alerting, subscription, fee, and badge contracts
- `chainhooks/`: event manifests for whale transfers, contract deployments, NFT mints, swaps, subscriptions, fees, and badges
- `server/`: chainhook ingestion, user alert storage, health checks, metrics, notifications, and WebSocket delivery
- `frontend/`: landing page, registration flow, dashboard, history, badges, and analytics pages
- `shared/`: shared constants, types, and formatting helpers used across packages

More detail lives in [docs/WORKSPACES.md](docs/WORKSPACES.md).

## Quick start

```bash
npm install
npm --prefix server install
npm --prefix shared install
npm --prefix frontend install
```

## Common commands

```bash
# Contract checks and tests
npm run clarinet:check
npm test

# Backend
npm --prefix server run dev
npm --prefix server run build

# Frontend
npm --prefix frontend run dev
npm --prefix frontend run lint

# Shared package
npm --prefix shared run build
```

- [docs/API.md](docs/API.md)
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- [docs/CONTRACTS.md](docs/CONTRACTS.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [CONTRIBUTING.md](CONTRIBUTING.md)

## Features & Highlights

- **Real-time Monitoring**: Sub-second ingestion of Stacks blockchain events.
- **Tiered Alerts**: Tiered feature gating (Basic, Pro, Premium) with granular limits.
- **Multi-Channel Delivery**: Integration with Discord, Telegram, and custom Webhooks.
- **Live Analytics**: High-performance data windowing for responsive dashboard charts.
- **Security First**: JWT-based authentication, SSH-signed commits, and CSP-hardened headers.
- **Reliability**: Exponential backoff retries, LRU caching, and health-monitored subsystems.
