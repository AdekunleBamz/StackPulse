## Core Features

- 🐋 **Whale Transfers**: Real-time monitoring of large STX movements.
- 📜 **Contract Deployments**: Detection of new smart contracts.
- 🎨 **NFT Mints**: Tracking of new digital assets.

## 🛡️ Backend Hardening (Milestone)

- **98 Signed Commits**: Professional history with SSH verified signatures.
- **Tiered Access**: API Rate limiting, storage constraints, and priority messaging.
- **Observability**: Structured winston logging and internal metrics service.
- **Resilient Infrastructure**: Automated backups, cleanup tasks, and request timeouts.

## Quick Start

```bash
npm install
npm --prefix server install
npm --prefix shared install
npm --prefix frontend install
```

## Common Commands

```bash
# Contract tests
npm test

# Contract checks
npm run clarinet:check

# API server
npm --prefix server run dev

# Frontend
npm --prefix frontend run dev
```
