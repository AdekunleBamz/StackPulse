# StackPulse Smart Contracts

This directory contains Clarity smart contracts for the StackPulse platform.

## Contracts

### Alert Manager (alert-manager-v-j3.clar)

Main contract for managing blockchain event alerts.

**Features:**
- Create, update, delete alerts
- Toggle alerts enabled/disabled
- Track alert triggers
- User tier-based limits
- Admin moderation functions

**Alert Types:**
1. Whale Transfer - Large STX transfers
2. Contract Deployment - New smart contracts
3. NFT Mint - NFT minting events
4. Token Launch - New token deployments
5. Large Swap - DEX swaps above threshold
6. Address Watch - Custom address monitoring

### Fee Vault (fee-vault-v-j3.clar)

Handles subscription fee payments and tracking.

### Reputation Badges (reputation-badges-v-j3.clar)

Manages user achievement badges based on activity.

## Development

### Requirements

- Clarinet SDK
- Node.js >= 18

### Running Tests

```bash
clarinet test
```

### Check Contracts

```bash
clarinet check
```

### Console

```bash
clarinet console
```

## Deployment

Contracts are deployed using deployment plans in `../deployments/`.

### Mainnet Deployment

```bash
clarinet deploy --mainnet --deployments-path deployments
```

### Testnet Deployment

```bash
clarinet deploy --testnet --deployments-path deployments
```

## Architecture

The contracts follow a modular architecture:
- Alert Manager handles alert CRUD
- Fee Vault manages payments
- Reputation Badges tracks achievements
