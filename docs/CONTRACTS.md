# Smart Contract Documentation

## Current repo note

The active contract files in this repository are:

- `contracts/stackpulse-v-j4.clar`
- `contracts/alert-manager-v-j4.clar`
- `contracts/fee-vault-v-j4.clar`
- `contracts/reputation-badges-v-j4.clar`

Earlier versions remain in `contracts/archive/`. When this document references older names or deployment eras, treat the files above as the current source of truth for ongoing maintenance work.

## Overview

StackPulse consists of four main smart contracts deployed on the Stacks blockchain:

1. **stackpulse-v-j4** - User registry and subscription management
2. **alert-manager-v-j4** - Alert creation and triggering
3. **fee-vault-v-j4** - Fee collection and referral system
4. **reputation-badges-v-j4** - NFT achievement badges (SIP-009)

All contracts are deployed by: `SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N`

---

## StackPulse Registry (stackpulse-v-j4)

### Overview

Manages user registration, profiles, and subscription tiers.

### Constants

| Name | Value | Description |
|------|-------|-------------|
| BLOCKS-PER-MONTH | 4320 | ~30 days at 10 min blocks |
| PRICE-FREE | 0 | Free tier price |
| PRICE-BASIC | 10,000 | 0.01 STX in microSTX |
| PRICE-PRO | 50,000 | 0.05 STX in microSTX |
| PRICE-PREMIUM | 200,000 | 0.20 STX in microSTX |

### Error Codes

| Code | Name | Description |
|------|------|-------------|
| u101 | ERR-ALREADY-REGISTERED | User already registered |
| u102 | ERR-NOT-REGISTERED | User not found |
| u103 | ERR-INVALID-TIER | Tier must be 0-3 |
| u104 | ERR-TRANSFER-FAILED | STX transfer failed |
| u105 | ERR-NOT-AUTHORIZED | Caller not authorized |
| u106 | ERR-INVALID-USERNAME | Invalid username |
| u107 | ERR-INVALID-ALERTS | Invalid alerts bitmask |
| u108 | ERR-SUBSCRIPTION-EXPIRED | Subscription has expired |
| u109 | ERR-SAME-TIER | Cannot upgrade to same tier |

### Public Functions

#### register-and-subscribe

Register a new user with profile and subscription tier.

```clarity
(define-public (register-and-subscribe 
    (username (string-ascii 32))
    (email (string-ascii 64))
    (tier uint)
    (alerts uint))
  ...)
```

**Parameters:**
- `username`: Display name (1-32 chars)
- `email`: Email address (max 64 chars)
- `tier`: Subscription tier (0=Free, 1=Basic, 2=Pro, 3=Premium)
- `alerts`: Bitmask of enabled alerts (1=whale, 2=nft, 4=token, 8=swap, 16=contract)

#### update-profile

Update user profile information.

```clarity
(define-public (update-profile 
    (username (string-ascii 32))
    (email (string-ascii 64))
    (alerts uint))
  ...)
```

#### upgrade-subscription

Upgrade to a higher subscription tier.

```clarity
(define-public (upgrade-subscription (new-tier uint))
  ...)
```

### Read-Only Functions

#### get-user

```clarity
(define-read-only (get-user (who principal))
  (map-get? users who))
```

#### is-registered

```clarity
(define-read-only (is-registered (who principal))
  (is-some (map-get? users who)))
```

#### get-subscription-status

```clarity
(define-read-only (get-subscription-status (who principal))
  { registered, tier, active, ends-at, total-triggers })
```

#### get-tier-price

```clarity
(define-read-only (get-tier-price (tier uint))
  ...)
```

#### get-stats

```clarity
(define-read-only (get-stats)
  { total-users, total-revenue, version })
```

---

## Alert Manager (alert-manager-v-j4)

### Overview

Manages user alerts and tracks trigger events.

### Alert Types

| Type | Name | Description |
|------|------|-------------|
| 1 | Whale Transfer | Large STX transfers |
| 2 | Contract Deployed | New smart contracts |
| 3 | NFT Mint | NFT minting events |
| 4 | Token Launch | New SIP-010 tokens |
| 5 | Large Swap | DEX swap events |
| 6 | Address Watch | Specific address activity |

### Alert Limits by Tier

| Tier | Max Alerts |
|------|------------|
| Free | 3 |
| Basic | 10 |
| Pro | 25 |
| Premium | 999 |

### Public Functions

#### create-alert

```clarity
(define-public (create-alert 
    (alert-type uint)
    (name (string-ascii 64))
    (target-address (optional principal))
    (threshold uint))
  ...)
```

#### toggle-alert

```clarity
(define-public (toggle-alert (alert-id uint))
  ...)
```

#### update-alert

```clarity
(define-public (update-alert 
    (alert-id uint)
    (name (string-ascii 64))
    (threshold uint))
  ...)
```

#### delete-alert

```clarity
(define-public (delete-alert (alert-id uint))
  ...)
```

#### trigger-alert

```clarity
(define-public (trigger-alert (alert-id uint))
  ...)
```

### Read-Only Functions

#### get-alert

```clarity
(define-read-only (get-alert (alert-id uint))
  ...)
```

#### get-user-alert-count

```clarity
(define-read-only (get-user-alert-count (user principal))
  ...)
```

#### get-stats

```clarity
(define-read-only (get-stats)
  { total-alerts, total-triggers, next-id, version })
```

---

## Fee Vault (fee-vault-v-j4)

### Overview

Handles subscription payments, platform fees, and referral rewards.

### Fee Structure

| Parameter | Value |
|-----------|-------|
| Platform Fee | 10% |
| Referral Bonus | 5% |

### Subscription Prices

| Tier | Price (STX) |
|------|-------------|
| Free | 0 |
| Basic | 0.01 |
| Pro | 0.05 |
| Premium | 0.20 |

### Public Functions

#### collect-subscription-fee

```clarity
(define-public (collect-subscription-fee 
    (tier uint) 
    (referrer (optional principal)))
  ...)
```

#### claim-referral-earnings

```clarity
(define-public (claim-referral-earnings)
  ...)
```

#### withdraw-to-treasury

```clarity
(define-public (withdraw-to-treasury (amount uint))
  ...)
```

### Read-Only Functions

#### get-subscription-price

```clarity
(define-read-only (get-subscription-price (tier uint))
  ...)
```

#### get-referral-earnings

```clarity
(define-read-only (get-referral-earnings (referrer principal))
  ...)
```

#### get-vault-stats

```clarity
(define-read-only (get-vault-stats)
  { total-collected, total-fees, total-subscriptions, 
    total-referral-paid, contract-balance, tier-revenue, version })
```

---

## Reputation Badges (reputation-badges-v-j4)

### Overview

SIP-009 compliant NFT badges for achievements.

### Badge Types

| ID | Name | Description | Max Supply |
|----|------|-------------|------------|
| 1 | Early Adopter | First 100 users | 100 |
| 2 | Whale Watcher | Detected 10+ whale transfers | Unlimited |
| 3 | Alert Master | Created 25+ alerts | Unlimited |
| 4 | Power User | Pro or Premium subscriber | Unlimited |
| 5 | Referral Champion | Referred 5+ users | Unlimited |
| 6 | Year One | Active for 1 year | Unlimited |
| 7 | Community Builder | Active in governance | Unlimited |
| 8 | Bug Hunter | Reported valid bugs | Unlimited |
| 9 | StackPulse OG | Original beta tester | 50 |

### SIP-009 Functions

```clarity
(define-read-only (get-last-token-id) (response uint uint))
(define-read-only (get-token-uri (token-id uint)) (response (optional (string-ascii 256)) uint))
(define-read-only (get-owner (token-id uint)) (response (optional principal) uint))
(define-public (transfer (token-id uint) (sender principal) (recipient principal)) (response bool uint))
```

### Public Functions

#### mint-badge

```clarity
(define-public (mint-badge (recipient principal) (badge-type uint))
  ...)
```

#### add-authorized-minter

```clarity
(define-public (add-authorized-minter (minter principal))
  ...)
```

### Read-Only Functions

#### has-badge

```clarity
(define-read-only (has-badge (user principal) (badge-type uint))
  ...)
```

#### get-badge-data

```clarity
(define-read-only (get-badge-data (token-id uint))
  { badge-type, name, recipient, minted-at })
```

---

## Integration Examples

### Register User (JavaScript)

```javascript
import { openContractCall } from '@stacks/connect';
import { stringAsciiCV, uintCV } from '@stacks/transactions';

await openContractCall({
  contractAddress: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N',
  contractName: 'stackpulse-v-j4',
  functionName: 'register-and-subscribe',
  functionArgs: [
    stringAsciiCV('username'),
    stringAsciiCV('user@email.com'),
    uintCV(1), // Basic tier
    uintCV(31) // All alerts enabled
  ],
  onFinish: (data) => {
    const txId = data.txId;
    // Save txId or show success UI here.
  }
});
```

### Create Alert

```javascript
await openContractCall({
  contractAddress: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N',
  contractName: 'alert-manager-v-j4',
  functionName: 'create-alert',
  functionArgs: [
    uintCV(1), // Whale transfer
    stringAsciiCV('Whale Watch'),
    noneCV(), // No target address
    uintCV(10000000000) // 10,000 STX threshold
  ],
  onFinish: (data) => {
    const txId = data.txId;
    // Save txId or show success UI here.
  }
});
```

### Read User Data

```javascript
const response = await fetch(
  `https://api.mainnet.hiro.so/v2/contracts/call-read/SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N/stackpulse-v-j4/get-user`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: userAddress,
      arguments: [cvToHex(principalCV(userAddress))]
    })
  }
);
```

### Integration Note

Track tx IDs for write calls in your app telemetry so users can jump directly to explorer traces when support follow-up is needed.
Record the contract version suffix with every tx ID so replay evidence maps to the right deployment.
