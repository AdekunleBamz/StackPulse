# StackPulse API Documentation

> Complete API reference for the StackPulse monitoring platform

## Table of Contents

- [Overview](#overview)
- [Base URLs](#base-urls)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Health Endpoints](#health-endpoints)
- [User Management](#user-management)
- [Alert Management](#alert-management)
- [Chainhook Endpoints](#chainhook-endpoints)
- [Error Handling](#error-handling)
- [WebSocket Events](#websocket-events)

## Overview

The StackPulse API provides programmatic access to blockchain monitoring features, user management, and alert configuration. All endpoints return JSON responses with consistent error formatting.

### Current mounted surface

The live backend routes are defined in `server/src/index.ts`.

#### Health and Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server health check |
| `GET` | `/api/v1/ping` | Keep-alive ping endpoint |
| `GET` | `/api/v1/stats` | Global event statistics |
| `GET` | `/api/v1/chainhooks/status` | Chainhook registration status |

#### User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/users` | Create new user |
| `GET` | `/api/users` | List all users (admin) |
| `GET` | `/api/users/:address` | Get user by address |
| `PUT` | `/api/users/:address` | Update user preferences |
| `DELETE` | `/api/users/:address` | Delete user |

#### Alert Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/users/:address/alerts` | Get user's alerts |
| `POST` | `/api/v1/users/:address/alerts` | Create new alert |
| `PUT` | `/api/users/:address/alerts/:alertId` | Update alert |
| `DELETE` | `/api/users/:address/alerts/:alertId` | Delete alert |

#### Chainhook Ingestion

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/chainhooks/whale-transfer` | Whale transfer events |
| `POST` | `/api/v1/chainhooks/contract-deployed` | Contract deployment events |
| `POST` | `/api/v1/chainhooks/nft-mint` | NFT mint events |
| `POST` | `/api/v1/chainhooks/token-launch` | Token launch events |
| `POST` | `/api/v1/chainhooks/large-swap-alert` | Large swap events |
| `POST` | `/api/v1/chainhooks/subscription-created` | Subscription events |
| `POST` | `/api/v1/chainhooks/alert-triggered` | Alert trigger events |
| `POST` | `/api/v1/chainhooks/fee-collected` | Fee collection events |
| `POST` | `/api/v1/chainhooks/badge-earned` | Badge earning events |
| `POST` | `/api/v1/chainhooks/new-subscription` | New subscription events |
| `POST` | `/api/v1/chainhooks/subscription-upgrade` | Subscription upgrade events |
| `POST` | `/api/v1/chainhooks/alert-created` | Alert creation events |

> **Note:** The extracted router files under `server/src/routes/` are useful module references, but the server entrypoint (`server/src/index.ts`) is the source of truth for mounted paths.

## Base URLs

| Environment | URL |
|-------------|-----|
| Production | `https://stackpulse-b8fw.onrender.com` |
| Local Development | `http://localhost:3000` |

## Authentication

### Public Endpoints
Most user-facing endpoints are public and do not require authentication.

### Chainhook Endpoints
All chainhook endpoints require Bearer token authentication via the `CHAINHOOK_AUTH_TOKEN` environment variable.

```http
Authorization: Bearer <your-chainhook-token>
```

### Example Request
```bash
curl -X POST https://stackpulse-b8fw.onrender.com/api/v1/chainhooks/whale-transfer \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"apply": [...]}'
```

## Rate Limiting

StackPulse implements tiered rate limiting to ensure fair usage:

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Public endpoints | 100 requests | per minute per IP |
| User endpoints | 60 requests | per minute per address |
| Chainhook endpoints | No limit | (authenticated) |
| Auth endpoints | 5 requests | per 15 minutes |

### Rate Limit Headers

All responses include rate limit headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706100000
```

When rate limited, responses include:

```http
Retry-After: 30
```

---

## Health Endpoints

### GET /health

Check server health status and uptime.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-24T12:00:00.000Z",
  "version": "1.0.0"
}
```

### GET /api/v1/ping

Keep-alive endpoint for preventing cold starts on serverless platforms.

**Response:**
```
pong
```

**Headers:**
```http
Cache-Control: no-store
```

### GET /api/v1/stats

Get global event statistics since server start.

**Response:**
```json
{
  "stats": {
    "whaleTransfers": 1234,
    "contractDeployments": 567,
    "nftMints": 8901,
    "tokenLaunches": 234,
    "largeSwaps": 567,
    "subscriptions": 890,
    "alertsTriggered": 1234,
    "feesCollected": 567,
    "badgesEarned": 890
  },
  "uptime": 3600.5,
  "timestamp": "2025-01-24T12:00:00.000Z"
}
```

### GET /api/v1/chainhooks/status

Get the status of registered chainhook endpoints.

**Response:**
```json
{
  "registered": 12,
  "active": 12,
  "chainhooks": [
    "whale-transfer-alert",
    "new-contract-deployed",
    "nft-mint-tracker",
    "token-launch-detector",
    "large-swap-alert",
    "user-subscription-created",
    "alert-triggered",
    "fee-collected",
    "badge-earned",
    "new-subscription",
    "subscription-upgrade",
    "alert-created"
  ]
}
```

---

## User Management

### POST /api/v1/users

Create a new user with notification preferences.

**Request Body:**
```json
{
  "address": "SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N",
  "username": "satoshi",
  "email": "user@example.com",
  "discord": "user#1234",
  "telegram": "@username",
  "enabledAlerts": ["whale", "nft", "token"]
}
```

**Validation Rules:**
- `address`: Required, valid Stacks address format
- `username`: Optional, max 50 characters
- `email`: Optional, valid email format
- `discord`: Optional, Discord tag format
- `telegram`: Optional, Telegram username format
- `enabledAlerts`: Optional, array of alert type strings

**Response (201 Created):**
```json
{
  "success": true,
  "user": {
    "address": "SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N",
    "username": "satoshi",
    "email": "user@example.com",
    "discord": "user#1234",
    "telegram": "@username",
    "enabledAlerts": ["whale", "nft", "token"],
    "createdAt": "2025-01-24T12:00:00.000Z"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Address is required"
}
```

### GET /api/users

List all registered users (admin endpoint).

**Response:**
```json
{
  "users": [
    {
      "address": "SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N",
      "username": "satoshi",
      "email": "user@example.com",
      "createdAt": "2025-01-24T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

### GET /api/users/:address

Get user profile and notification preferences.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| address | string | Stacks wallet address |

**Response:**
```json
{
  "success": true,
  "user": {
    "address": "SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N",
    "username": "satoshi",
    "email": "user@example.com",
    "enabledAlerts": ["whale", "nft", "token"],
    "discord": "user#1234",
    "telegram": "@username"
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": "User not found"
}
```

### PUT /api/users/:address

Update user notification preferences.

**Request Body:**
```json
{
  "username": "newusername",
  "email": "new@example.com",
  "discord": "newuser#5678",
  "telegram": "@newusername",
  "enabledAlerts": ["whale", "contract", "nft", "token", "swap"]
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "address": "SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N",
    "username": "newusername",
    "email": "new@example.com",
    "discord": "newuser#5678",
    "telegram": "@newusername",
    "enabledAlerts": ["whale", "contract", "nft", "token", "swap"]
  }
}
```

### DELETE /api/users/:address

Delete a user and all associated data.

**Response:**
```json
{
  "success": true
}
```

---

## Alert Management

### GET /api/v1/users/:address/alerts

Get all alerts configured by a user.

**Response:**
```json
{
  "success": true,
  "alerts": [
    {
      "id": 1706100000000,
      "type": 1,
      "name": "Whale Watch",
      "threshold": 10000000000,
      "targetAddress": null,
      "enabled": true,
      "triggerCount": 5,
      "createdAt": "2025-01-24T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### Alert Types

| Type ID | Name | Description |
|---------|------|-------------|
| 1 | Whale Transfer | Large STX transfers (>10,000 STX) |
| 2 | Contract Deployment | New contract deployments |
| 3 | NFT Mint | NFT minting events |
| 4 | Token Launch | New SIP-010 token deployments |
| 5 | Large Swap | Significant DEX swap events |
| 6 | Custom | User-defined alerts |

### POST /api/v1/users/:address/alerts

Create a new alert for a user.

**Request Body:**
```json
{
  "type": 1,
  "name": "My Whale Alert",
  "threshold": 50000000000,
  "targetAddress": "SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N",
  "txId": "0x1234567890abcdef..."
}
```

**Validation Rules:**
- `type`: Required, integer 1-6
- `name`: Required, max 100 characters
- `threshold`: Optional, numeric value in micro-STX
- `targetAddress`: Optional, valid Stacks address
- `txId`: Optional, transaction hash reference

**Response (201 Created):**
```json
{
  "success": true,
  "alert": {
    "id": 1706100000001,
    "type": 1,
    "name": "My Whale Alert",
    "threshold": 50000000000,
    "targetAddress": "SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N",
    "enabled": true,
    "triggerCount": 0,
    "createdAt": "2025-01-24T12:00:00.000Z"
  }
}
```

### PUT /api/users/:address/alerts/:alertId

Update an existing alert.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| address | string | User's Stacks address |
| alertId | number | Alert ID |

**Request Body (all fields optional):**
```json
{
  "name": "Updated Alert Name",
  "threshold": 100000000000,
  "targetAddress": "SP...",
  "enabled": false
}
```

**Response:**
```json
{
  "success": true,
  "alert": {
    "id": 1706100000001,
    "type": 1,
    "name": "Updated Alert Name",
    "threshold": 100000000000,
    "targetAddress": "SP...",
    "enabled": false,
    "triggerCount": 5,
    "createdAt": "2025-01-24T12:00:00.000Z"
  }
}
```

### DELETE /api/users/:address/alerts/:alertId

Delete an alert.

**Response:**
```json
{
  "success": true
}
```

---

## Chainhook Endpoints

These endpoints receive blockchain events from Hiro Chainhooks. All chainhook routes require authentication.

### Authentication Header
```http
Authorization: Bearer <CHAINHOOK_AUTH_TOKEN>
```

### Common Payload Structure

All chainhook endpoints receive events in this format:

```json
{
  "apply": [
    {
      "block_identifier": {
        "index": 123456,
        "hash": "0xabcdef1234567890..."
      },
      "transactions": [
        {
          "transaction_identifier": {
            "hash": "0x1234567890abcdef..."
          },
          "metadata": {
            "success": true,
            "sender": "SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N",
            "fee": 1000,
            "kind": {
              "type": "ContractDeployment",
              "data": {
                "contract_identifier": "SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.my-contract"
              }
            },
            "receipt": {
              "events": [
                {
                  "type": "SmartContractEvent",
                  "data": {
                    "value": { ... }
                  }
                }
              ]
            }
          }
        }
      ]
    }
  ],
  "rollback": [],
  "chainhook": {
    "uuid": "chainhook-uuid",
    "predicate": {
      "scope": "txid",
      "equals": "0x..."
    }
  }
}
```

### Event-Specific Endpoints

#### POST /api/v1/chainhooks/whale-transfer

Receives whale transfer events for transfers >10,000 STX.

**Processing:**
- Parses transfer amount, sender, and recipient
- Broadcasts notification to all users
- Increments global statistics

#### POST /api/v1/chainhooks/contract-deployed

Receives new contract deployment events.

**Processing:**
- Extracts contract ID, name, and deployer
- Broadcasts notification to all users
- Increments deployment statistics

#### POST /api/v1/chainhooks/nft-mint

Receives NFT mint events.

**Processing:**
- Extracts asset ID, token ID, and recipient
- Broadcasts notification to all users
- Increments mint statistics

#### POST /api/v1/chainhooks/token-launch

Receives new SIP-010 token deployment events.

**Processing:**
- Extracts token contract details
- Broadcasts notification to all users
- Increments launch statistics

#### POST /api/v1/chainhooks/large-swap-alert

Receives large DEX swap events.

**Processing:**
- Detects swaps with multiple FT transfer events
- Broadcasts notification to all users
- Increments swap statistics

#### POST /api/v1/chainhooks/subscription-created

Receives StackPulse subscription events from smart contracts.

**Processing:**
- Extracts user, tier, and price from print events
- Broadcasts personalized notification to subscriber
- Increments subscription statistics

#### POST /api/v1/chainhooks/alert-triggered

Receives alert trigger events from smart contracts.

**Processing:**
- Extracts alert ID, owner, and type from print events
- Broadcasts personalized notification to alert owner
- Increments trigger statistics

#### POST /api/v1/chainhooks/fee-collected

Receives fee collection events.

**Processing:**
- Extracts source and amount from print events
- Broadcasts notification to all users
- Increments fee statistics

#### POST /api/v1/chainhooks/badge-earned

Receives badge minting events.

**Processing:**
- Extracts recipient, badge name, and type from print events
- Broadcasts personalized notification to badge earner
- Increments badge statistics

### Async Processing

All chainhook endpoints respond immediately with `202 Accepted` to prevent Hiro timeout:

```json
{
  "status": "accepted",
  "message": "Processing async"
}
```

Events are processed in the background after the response is sent.

---

## Error Handling

All endpoints return errors in a consistent format:

```json
{
  "success": false,
  "error": "Error message description",
  "code": 400
}
```

### HTTP Status Codes

| Code | Name | Description |
|------|------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 202 | Accepted | Async processing started |
| 400 | Bad Request | Invalid parameters or request format |
| 401 | Unauthorized | Missing or invalid authentication |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Error Examples

**400 Bad Request - Invalid Address:**
```json
{
  "success": false,
  "error": "Invalid Stacks address format",
  "code": 400
}
```

**401 Unauthorized - Missing Token:**
```json
{
  "success": false,
  "error": "Missing or invalid CHAINHOOK_AUTH_TOKEN",
  "code": 401
}
```

**429 Too Many Requests:**
```json
{
  "success": false,
  "error": "Rate limit exceeded. Please try again later.",
  "code": 429,
  "retryAfter": 30
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "User not found",
  "code": 404
}
```

---

## WebSocket Events

Real-time notifications are available via WebSocket connection.

### Connection

```
wss://stackpulse-b8fw.onrender.com/ws
```

### Message Types

```typescript
interface WebSocketMessage {
  type: 'notification' | 'stats' | 'alert';
  data: Record<string, unknown>;
  timestamp: string;
}
```

### Subscription

```javascript
const ws = new WebSocket('wss://stackpulse-b8fw.onrender.com/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    address: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N',
    events: ['whale', 'nft', 'alert']
  }));
};

ws.onmessage = (event) => {
  try {
    const message = JSON.parse(event.data);
    console.log('Received:', message);
    
    if (message.type === 'notification') {
      // Handle notification
      const { title, message: text, data } = message.data;
      showNotification(title, text, data);
    }
  } catch (error) {
    console.error('Failed to parse message:', error);
  }
};
```

### Reliability Note

Clients should apply exponential backoff with jitter when reconnecting WebSocket sessions to avoid synchronized reconnect storms during outages.
Prefer recording WebSocket event timestamps in UTC ISO-8601 format so incident timelines stay comparable across regions.
Include the subscription id in support examples when it is needed to distinguish retry behavior.
