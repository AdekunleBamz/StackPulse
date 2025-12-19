# StackPulse 🚀

Real-time Stacks blockchain monitoring and alert system powered by Hiro Chainhooks.

## Features

- **🐋 Whale Transfer Alerts** - Monitor large STX transfers
- **📜 Contract Deployment Tracking** - Get notified of new smart contracts
- **🎨 NFT Mint Monitoring** - Track NFT minting events
- **🪙 Token Launch Detection** - Discover new SIP-010 tokens early
- **💱 Large Swap Alerts** - Monitor significant DEX activity
- **🏆 Reputation Badges** - Gamified achievement system

## Architecture

```
StackPulse/
├── contracts/           # Clarity smart contracts
│   ├── stackpulse-registry.clar
│   ├── alert-manager.clar
│   ├── fee-vault.clar
│   └── reputation-badges.clar
├── chainhooks/          # Hiro Chainhook configurations
├── server/              # Express.js webhook server
├── tests/               # Contract tests
└── settings/            # Clarinet network settings
```

## Smart Contracts

| Contract | Description |
|----------|-------------|
| `stackpulse-registry` | User registration, subscriptions, tiers |
| `alert-manager` | Create and manage blockchain alerts |
| `fee-vault` | Protocol fees, staking, rewards |
| `reputation-badges` | NFT badges for achievements |

## Chainhooks

9 chainhooks monitor the Stacks blockchain:

1. Whale Transfer Alert
2. New Contract Deployed
3. NFT Mint Tracker
4. Token Launch Detector
5. Large Swap Alert
6. User Subscription Created
7. Alert Triggered
8. Fee Collected
9. Badge Earned

## Getting Started

### Prerequisites

- [Clarinet](https://github.com/hirosystems/clarinet)
- [Node.js](https://nodejs.org/) >= 18
- [Hiro Platform API Key](https://platform.hiro.so/)

### Installation

```bash
# Install dependencies
npm install

# Install server dependencies
cd server && npm install

# Run contract tests
npm test

# Start development server
cd server && npm run dev
```

### Deploy to Render

1. Push to GitHub
2. Connect to Render
3. Set root directory to `server`
4. Add environment variables
5. Deploy!

## Environment Variables

```env
CHAINHOOKS_API_KEY=your_hiro_api_key
CHAINHOOK_AUTH_TOKEN=your_webhook_secret
DEPLOYER_ADDRESS=your_stacks_address
```

## License

MIT
