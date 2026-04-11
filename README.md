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

### Testing & Quality

```bash
# Run Clarinet contract checks
npm run clarinet:check

# Run Clarinet contract tests
npm run clarinet:test

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint all packages
npm run lint:all
```

## 📚 Documentation

| Doc | Description |
|-----|-------------|
| [API Reference](docs/API.md) | Complete API endpoint documentation |
| [Deployment Guide](docs/DEPLOYMENT.md) | Production deployment instructions |
| [Contract Docs](docs/CONTRACTS.md) | Clarity contract specifications |
| [Architecture](docs/WORKSPACES.md) | System architecture overview |
| [Contributing](CONTRIBUTING.md) | Contribution guidelines |

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3000) |
| `CHAINHOOK_AUTH_TOKEN` | Authentication token for chainhook endpoints | Yes |
| `DATABASE_URL` | Database connection string | Yes |
| `REDIS_URL` | Redis connection URL | No |
| `LOG_LEVEL` | Logging level (debug, info, warn, error) | No |
| `NODE_ENV` | Environment (development, production) | No |

### Rate Limiting

StackPulse implements tiered rate limiting:

| Tier | Requests/minute |
|------|-----------------|
| Free | 100 |
| Basic | 1,000 |
| Pro | 5,000 |
| Enterprise | 20,000 |

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes with signed commits (`git commit -S -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Hiro Systems](https://www.hiro.so/) for Chainhooks and Stacks tooling
- [Stacks Foundation](https://stacks.org/) for the Stacks blockchain
- [Clarity Language](https://clarity-lang.org/) for secure smart contracts

## 🔗 Links

- **Website**: [stackpulse.io](https://stackpulse.io)
- **Documentation**: [docs.stackpulse.io](https://docs.stackpulse.io)
- **GitHub**: [AdekunleBamz/StackPulse](https://github.com/AdekunleBamz/StackPulse)
- **Discord**: [Join our community](https://discord.gg/stackpulse)
- **Twitter**: [@StackPulse](https://twitter.com/StackPulse)

---

Built with ❤️ by [AdekunleBamz](https://github.com/AdekunleBamz) and contributors
