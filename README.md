# StackPulse

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Stacks](https://img.shields.io/badge/Stacks-STX-orange.svg)](https://www.stacks.co/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg?logo=next.js)](https://nextjs.org/)

> Real-time Stacks blockchain monitoring and alert system powered by Hiro Chainhooks

StackPulse is a comprehensive monitoring workspace that combines Clarity smart contracts, Hiro Chainhook manifests, an Express ingestion server, a shared TypeScript package, and a Next.js frontend to deliver real-time blockchain event notifications.

## 🚀 Project Status

StackPulse is currently in **Beta**. We are actively monitoring the Stacks mainnet and refining our alert algorithms.

## ✨ Core Features

- 🐋 **Whale Transfers** - Track large STX movements in real-time.
- 📜 **Smart Contracts** - Instant notifications for new contract deployments.
- 🎨 **NFT Monitoring** - Track minting events across top collections.
- 🪙 **Token Launches** - Automated detection of new SIP-010 tokens.
- 💱 **DEX Swaps** - Monitoring for significant swap volume.
- 🏆 **Reputation** - Earn on-chain badges for platform participation.

## 🏗️ Architecture

```
┌──────────────────┐    ┌──────────────────┐    ┌────────────────────┐
│ Stacks Blockchain │──▶│ Hiro Chainhooks  │──▶│ StackPulse Server  │
└──────────────────┘    └──────────────────┘    └────────────────────┘
                                                          │
                                                          ▼
┌──────────────────┐    ┌──────────────────┐    ┌────────────────────┐
│ Clarity Contracts│◀──│Shared Types/Utils │◀──│ Next.js Frontend   │
└──────────────────┘    └──────────────────┘    └────────────────────┘
```

## 📁 Project Structure

| Directory | Description |
|-----------|-------------|
| `contracts/` | Clarity smart contracts for alerts, subscriptions, fees, and reputation badges |
| `chainhooks/` | Hiro Chainhook event manifests for blockchain event monitoring |
| `server/` | Express.js backend with WebSocket support, rate limiting, and event processing |
| `frontend/` | Next.js 16 frontend with TypeScript and Tailwind CSS |
| `shared/` | Common TypeScript types, constants, and utility functions |
| `docs/` | Comprehensive documentation for API, deployment, and architecture |
| `deployments/` | Deployment plans for mainnet and testnet |

More detail lives in [docs/WORKSPACES.md](docs/WORKSPACES.md).

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- npm or pnpm
- Clarinet (for contract development)

### Installation

```bash
# Clone the repository
git clone https://github.com/AdekunleBamz/StackPulse.git
cd StackPulse

# Install all dependencies
npm ci
npm --prefix server install
npm --prefix shared ci
npm --prefix frontend install
```

### Environment Setup

```bash
# Contract checks and tests
npm run clarinet:check
npm run clarinet:test

# Configure your environment variables
# Required: CHAINHOOK_AUTH_TOKEN, DATABASE_URL, etc.
```

## Local workflow

Run backend and frontend in separate terminals for end-to-end local development:

```bash
# Terminal 1
npm --prefix server run dev
npm --prefix server run build
npm --prefix server run test

# Terminal 2
npm --prefix frontend run dev
```

## Key docs

- [docs/API.md](docs/API.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- [docs/CONTRACTS.md](docs/CONTRACTS.md)
- [docs/WORKSPACES.md](docs/WORKSPACES.md)
- [CONTRIBUTING.md](CONTRIBUTING.md)

## Features & Highlights

Join our community to get help, stay updated, and contribute:
- **Discord**: [Join our server](https://discord.gg/stackpulse)
- **Telegram**: [Follow us](https://t.me/stackpulse)
- **Twitter**: [Follow @StackPulse](https://twitter.com/StackPulse)
- When asking for incident help, include affected network and one transaction ID for faster triage.
