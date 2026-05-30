# StackPulse

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Stacks](https://img.shields.io/badge/Stacks-STX-orange.svg)](https://www.stacks.co/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg?logo=next.js)](https://nextjs.org/)

> Real-time Stacks blockchain monitoring and alert system powered by Hiro Chainhooks

StackPulse is a comprehensive monitoring workspace that combines Clarity smart contracts, Hiro Chainhook manifests, an Express ingestion server, a shared TypeScript package, and a Next.js frontend to deliver real-time blockchain event notifications.

## ✨ Features

- 🐋 **Whale Transfer Alerts** - Track large STX transfers in real-time
- 📜 **Contract Deployment Notifications** - Get notified when new contracts are deployed
- 🎨 **NFT Mint Tracking** - Monitor NFT minting events across collections
- 🪙 **Token Launch Detection** - Discover new SIP-010 token deployments
- 💱 **Large Swap Alerts** - Track significant DEX swap events
- 🏆 **Badge System** - Earn achievement badges for platform activity
- 🔔 **Custom Alerts** - Create personalized alert thresholds
- 📊 **Real-time Dashboard** - Live statistics and analytics

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Stacks Blockchain  │──▶│  Hiro Chainhooks   │──▶│  StackPulse Server │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                          │
                                                          ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Clarity Contracts  │◀──│  Shared Types/Utils  │◀──│  Next.js Frontend  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
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
npm --prefix server ci
npm --prefix shared ci
npm --prefix frontend ci
```

### Environment Setup

```bash
# Copy environment example
cp .env.example .env

# Configure your environment variables
# Required: CHAINHOOK_AUTH_TOKEN, DATABASE_URL, etc.
```

## 📟 Common Commands

### Development

```bash
# Start frontend development server
npm --prefix frontend run dev

# Start backend development server
npm --prefix server run dev

# Start both with Docker Compose
docker compose up -d
```

### Building

```bash
# Build all packages
npm run build:all

# Build individual packages
npm --prefix shared run build
npm --prefix server run build
npm --prefix frontend run build
```

### Verification

```bash
# Run lint checks across frontend and server
npm run lint:all

# Run the fast contract and shared utility check
npm run check:fast
```

Join our community to get help, stay updated, and contribute:
- **Discord**: [Join our server](https://discord.gg/stackpulse)
- **Telegram**: [Follow us](https://t.me/stackpulse)
- **Twitter**: [Follow @StackPulse](https://twitter.com/StackPulse)
- When asking for incident help, include affected network and one transaction ID for faster triage.
- For release help, include the deployed contract alias and frontend commit hash.
