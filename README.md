# StackPulse

StackPulse is a premium Stacks monitoring workspace that combines Clarity contracts, Hiro Chainhook manifests, an Express ingestion server, and a Next.js frontend to provide real-time blockchain insights.

## Workspace Overview

- `contracts/`: On-chain alerting, subscription, fee, and badge Clarity contracts.
- `chainhooks/`: Event manifests for whale transfers, contract deployments, NFT mints, swaps, and more.
- `server/`: Chainhook ingestion, health checks, metrics, notifications, and WebSocket delivery.
- `frontend/`: Real-time dashboard, registration flow, alert history, and analytics.
- `shared/`: Shared TypeScript constants, types, and formatting helpers.

## Technical Architecture

StackPulse follows a reactive, event-driven architecture designed for high-performance blockchain monitoring:

1.  **On-Chain Events**: Transactions occur on the Stacks blockchain (whale transfers, contract deploys, etc.).
2.  **Hiro Chainhooks**: Custom manifests detect these events and POST JSON payloads to our ingestion server.
3.  **Ingestion Server**: Acts as the brain, receiving hooks, validating signatures, and storing relevant data.
4.  **Real-time Alerts**: The server triggers user-defined alerts and sends immediate notifications via WebSockets.
5.  **Frontend Dashboard**: A premium Next.js interface for managing alerts and visualizing trends.

## Development Workflow

### 1. Installation
Install dependencies for all workspace components:
```bash
npm install
npm --prefix server install
npm --prefix shared install
npm --prefix frontend install
```

### 2. Environment Configuration
Create a `.env` file in the root:
```bash
cp .env.example .env
```

### 3. Local Development
Start the full stack for development:
```bash
# Backend server
npm --prefix server run dev

# Frontend application
npm --prefix frontend run dev
```

### 4. Testing & Verification
```bash
# Run all tests
npm test

# Lint frontend
npm --prefix frontend run lint
```

## Documentation

- [docs/WORKSPACES.md](docs/WORKSPACES.md) - Project structure details
- [docs/API.md](docs/API.md) - API endpoints and payloads
- [docs/CONTRACTS.md](docs/CONTRACTS.md) - Clarity contract documentation
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) - Community standards
- [SECURITY.md](SECURITY.md) - Security Policy
