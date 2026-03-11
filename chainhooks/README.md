# StackPulse Chainhooks

This directory contains Hiro Chainhook configurations for monitoring Stacks blockchain events.

## Chainhooks

### 1. Whale Transfer (1-whale-transfer-alert.json)

Monitors large STX transfers exceeding a configurable threshold.

**Use Case:** Alert when someone transfers large amounts of STX.

### 2. Contract Deployed (2-new-contract-deployed.json)

Monitors new smart contract deployments.

**Use Case:** Track new DeFi protocols, NFTs, or other smart contracts.

### 3. NFT Mint (3-nft-mint-tracker.json)

Monitors NFT minting events.

**Use Case:** Track popular NFT collections being minted.

### 4. Token Launch (4-token-launch-detector.json)

Monitors new token deployments.

**Use Case:** Be the first to know about new token launches.

### 5. Large Swap (5-large-swap-alert.json)

Monitors large DEX swaps.

**Use Case:** Track whale trading activity on DEXes.

### 6. User Subscription (6-user-subscription-created.json)

Monitors subscription creation events.

**Use Case:** Track new premium users.

### 7. Alert Triggered (7-alert-triggered.json)

Monitors alert trigger events.

**Use Case:** Track when alerts fire.

### 8. Fee Collected (8-fee-collected.json)

Monitors fee collection events.

**Use Case:** Track revenue.

### 9. Badge Earned (9-badge-earned.json)

Monitors badge award events.

**Use Case:** Track user achievements.

## Configuration

Each chainhook JSON file defines:
- `chain`: The blockchain to monitor (Stacks)
- `types`: Event types to filter
- `constraints`: Additional filtering rules

## Usage

Deploy chainhooks to Hiro:

```bash
# Install chainhook CLI
cargo install chainhook

# Deploy a chainhook
chainhook deploy 1-whale-transfer-alert.json
```

## Requirements

- Hiro API key
- Chainhook CLI
