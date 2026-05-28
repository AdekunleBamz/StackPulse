# Deployment Guide

## Current repo note

Some examples below describe older `v3` naming. The active deployment artifacts in this repository today are the files under `deployments/`, especially the `v-j4` plans:

- `deployments/v-j4-mainnet-plan.yaml`
- `deployments/v-j4-fix-plan.yaml`
- `deployments/badges-v-j4.mainnet-plan.yaml`

The repo also includes helper scripts for hook registration and checks under `scripts/` and `server/src/scripts/`. Prefer those current files over older command examples when you are performing a fresh deployment.

This guide covers deploying StackPulse to production environments.

## Prerequisites

- [Clarinet](https://github.com/hirosystems/clarinet) v2.0+
- [Node.js](https://nodejs.org/) v18+
- [Hiro Platform Account](https://platform.hiro.so/)
- Stacks wallet with STX for deployment fees
- Confirm the selected deployment plan, chainhook callback URLs, and frontend public network variables all target the same network.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        StackPulse System                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │   Frontend   │────▶│    Server    │◀────│  Chainhooks  │    │
│  │  (Vercel)    │     │   (Render)   │     │    (Hiro)    │    │
│  └──────────────┘     └──────────────┘     └──────────────┘    │
│         │                    │                    │             │
│         │                    │                    │             │
│         ▼                    ▼                    ▼             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Stacks Blockchain                       │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────────────┐   │   │
│  │  │ Registry   │ │   Alert    │ │    Fee Vault /     │   │   │
│  │  │ Contract   │ │  Manager   │ │  Reputation Badges │   │   │
│  │  └────────────┘ └────────────┘ └────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Smart Contract Deployment

### Mainnet Deployment

```bash
# Check contracts compile correctly
clarinet check

# Run tests
npm run test

# Deploy contracts (requires wallet)
clarinet deployments apply -p deployments/v-j4-mainnet-plan.yaml --no-dashboard
```

### Deployment Plan (v-j4-mainnet-plan.yaml)

```yaml
---
id: 0
name: StackPulse V-J4 Mainnet Deployment
network: mainnet
stacks-node: "https://api.mainnet.hiro.so"

plan:
  batches:
    - id: 0
      transactions:
        - contract-publish:
            contract-name: stackpulse-v-j4
            path: contracts/stackpulse-v-j4.clar
            anchor-block-only: true
            cost: 500000
            
    - id: 1
      transactions:
        - contract-publish:
            contract-name: alert-manager-v-j4
            path: contracts/alert-manager-v-j4.clar
            anchor-block-only: true
            cost: 500000
            
    - id: 2
      transactions:
        - contract-publish:
            contract-name: fee-vault-v-j4
            path: contracts/fee-vault-v-j4.clar
            anchor-block-only: true
            cost: 500000
            
    - id: 3
      transactions:
        - contract-publish:
            contract-name: reputation-badges-v-j4
            path: contracts/reputation-badges-v-j4.clar
            anchor-block-only: true
            cost: 500000
```

---

## 2. Local Deployment (Docker Compose)

For a quick local setup with all dependencies, use Docker Compose. (`docker-compose.yml` also works, but `compose.yaml` is the modern default.)

### compose.yaml

```yaml
version: '3.8'

services:
  server:
    build: ./server
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - CHAINHOOK_AUTH_TOKEN=${CHAINHOOK_AUTH_TOKEN}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3001:3000"
    environment:
      - NEXT_PUBLIC_SERVER_URL=http://localhost:3000
    depends_on:
      - server

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

### Usage

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f
```

---

## 3. Server Deployment (Render)

### Setup

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node

### Environment Variables

```env
# Server Config
PORT=3000
NODE_ENV=production
LOG_LEVEL=info

# Chainhook Authentication
CHAINHOOK_AUTH_TOKEN=your-secure-token

# Contract Addresses
DEPLOYER_ADDRESS=<YOUR_DEPLOYER_ADDRESS>
REGISTRY_CONTRACT=stackpulse-v-j4
ALERT_CONTRACT=alert-manager-v-j4
VAULT_CONTRACT=fee-vault-v-j4
BADGE_CONTRACT=reputation-badges-v-j4

# Optional: Redis for caching
REDIS_URL=redis://...

# Optional: Notification Services
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
TELEGRAM_BOT_TOKEN=bot123:ABC...
SENDGRID_API_KEY=SG.xxx
```

### Health Check

Configure Render health check:
- **Path**: `/health`
- **Expected Response**: 200 OK

---

## 4. Frontend Deployment (Vercel)

### Setup

1. Create a new project on [Vercel](https://vercel.com)
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`

### Environment Variables

```env
# Network
NEXT_PUBLIC_STACKS_NETWORK=mainnet

# Contract Deployer
NEXT_PUBLIC_DEPLOYER_ADDRESS=<YOUR_DEPLOYER_ADDRESS>

# Server URL
NEXT_PUBLIC_SERVER_URL=https://stackpulse-b8fw.onrender.com

# Optional: Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
```

---

## 5. Chainhook Registration

### Prerequisites

Get your Hiro Platform API key from [platform.hiro.so](https://platform.hiro.so)

### Register Chainhooks

```bash
# Set API key
export HIRO_API_KEY=your-api-key

# Run registration script
npx tsx scripts/register-stackpulse-chainhooks-v-j4.ts
```

### Verify Registration

```bash
npx tsx scripts/check-chainhook-status.ts
```

### Chainhook Webhook URLs

| Chainhook | Endpoint |
|-----------|----------|
| Whale Transfer | `https://your-server.com/api/v1/chainhooks/whale-transfer` |
| Contract Deploy | `https://your-server.com/api/v1/chainhooks/contract-deployed` |
| NFT Mint | `https://your-server.com/api/v1/chainhooks/nft-mint` |
| Token Launch | `https://your-server.com/api/v1/chainhooks/token-launch` |
| Large Swap | `https://your-server.com/api/v1/chainhooks/large-swap-alert` |
| Subscription | `https://your-server.com/api/v1/chainhooks/subscription-created` |
| Alert Triggered | `https://your-server.com/api/v1/chainhooks/alert-triggered` |
| Fee Collected | `https://your-server.com/api/v1/chainhooks/fee-collected` |
| Badge Earned | `https://your-server.com/api/v1/chainhooks/badge-earned` |

---

## 6. Post-Deployment Checklist

### Smart Contracts

- [ ] Verify contracts on explorer.hiro.so
- [ ] Test registration with test wallet
- [ ] Confirm subscription payments work
- [ ] Test alert creation

### Server

- [ ] Health endpoint returns 200
- [ ] Check logs for errors
- [ ] Test chainhook endpoints with sample payload
- [ ] Verify CORS settings

### Frontend

- [ ] Wallet connection works
- [ ] Registration flow completes
- [ ] Dashboard loads user data
- [ ] Alert creation UI works

### Chainhooks

- [ ] All 12 chainhooks registered
- [ ] Webhook endpoints reachable
- [ ] Test events being received

---

## 7. Monitoring & Maintenance

### Logs

- **Server Logs**: Render Dashboard → Logs
- **Frontend Logs**: Vercel Dashboard → Functions
- **Chainhook Logs**: Hiro Platform → Chainhooks

### Metrics to Monitor

- Server response times
- Chainhook delivery success rate
- Contract call success rate
- User registration rate
- Error rates

### Backup & Recovery

1. **Contract State**: On-chain, immutable
2. **Server Data**: Export `data/alerts.json` periodically
3. **User Preferences**: Back up to external database

---

## 8. Upgrade Process

### Contract Upgrades

1. Create new contract version (e.g., `stackpulse-v4.clar`)
2. Deploy to testnet first
3. Run comprehensive tests
4. Deploy to mainnet
5. Update frontend contract references
6. Update chainhook predicates
7. Migrate user data if needed

### Server Updates

```bash
git push origin main
# Render auto-deploys from main branch
```

### Frontend Updates

```bash
git push origin main
# Vercel auto-deploys from main branch
```

---

## Troubleshooting

### Contract Deployment Fails

- Check wallet has sufficient STX (>1 STX recommended)
- Verify Clarinet is using correct network settings
- Check contract syntax with `clarinet check`

### Chainhooks Not Triggering

- Verify webhook URL is correct and reachable
- Check authentication token matches
- Ensure start_block is set correctly
- Check Hiro Platform status page

### Server 500 Errors

- Check environment variables are set
- Review logs for stack traces
- Verify Redis connection if configured

### Frontend Build Fails

- Check environment variables are set in Vercel
- Verify Next.js version compatibility
- Check for TypeScript errors
- Confirm `origin/main` and `origin-main` point to the same release head before opening the deployment window

### Rollout Window Note

Prefer deploying contracts and API updates inside the same announced window to reduce temporary mismatches between server assumptions and on-chain state.
