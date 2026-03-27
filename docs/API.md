# StackPulse API Documentation

## Current mounted surface

The live backend routes are currently defined in `server/src/index.ts`. The list below reflects the mounted paths in this repo today.

### Health and status

- `GET /health`
- `GET /api/v1/ping`
- `GET /api/v1/stats`
- `GET /api/v1/chainhooks/status`

### Users and alerts

- `POST /api/v1/users`
- `GET /api/users`
- `GET /api/users/:address`
- `DELETE /api/users/:address`
- `GET /api/v1/users/:address/alerts`
- `POST /api/v1/users/:address/alerts`
- `DELETE /api/users/:address/alerts/:alertId`

### Chainhook ingestion

- `POST /api/v1/chainhooks/whale-transfer`
- `POST /api/v1/chainhooks/contract-deployed`
- `POST /api/v1/chainhooks/nft-mint`
- `POST /api/v1/chainhooks/token-launch`
- `POST /api/v1/chainhooks/`
- `POST /api/v1/chainhooks/subscription-created`
- `POST /api/v1/chainhooks/alert-triggered`
- `POST /api/v1/chainhooks/fee-collected`
- `POST /api/v1/chainhooks/badge-earned`
- `POST /api/v1/chainhooks/new-subscription`
- `POST /api/v1/chainhooks/subscription-upgrade`
- `POST /api/v1/chainhooks/alert-created`

The extracted router files under `server/src/routes/` are useful module references, but they are not the source of truth for mounted paths until they are wired into the server entrypoint.

## Base URLs

- **Production**: `https://stackpulse-b8fw.onrender.com`
- **Local Development**: `http://localhost:3000`

## Authentication

Most endpoints are public. Chainhook endpoints use Bearer token authentication configured via `CHAINHOOK_AUTH_TOKEN` environment variable.

```
Authorization: Bearer <your-token>
```

---

## Endpoints

### Health Check

#### GET /health

Check server health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-24T12:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

---

### Statistics

#### GET /api/stats

Get global event statistics.

**Response:**
```json
{
  "whaleTransfers": 1234,
  "contractDeployments": 567,
  "nftMints": 8901,
  "tokenLaunches": 234,
  "largeSwaps": 567,
  "subscriptions": 890,
  "alertsTriggered": 1234,
  "feesCollected": 567,
  "badgesEarned": 890
}
```

---

### Users

#### GET /api/users/:address

Get user profile and preferences.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| address | string | Stacks wallet address |

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N",
    "username": "satoshi",
    "email": "user@example.com",
    "enabledAlerts": ["whale", "nft", "token"],
    "discord": "user#1234",
    "telegram": "@username"
  }
}
```

#### PUT /api/users/:address

Update user notification preferences.

**Request Body:**
```json
{
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
  "message": "Preferences updated successfully"
}
```

#### DELETE /api/users/:address

Delete user preferences.

**Response:**
```json
{
  "success": true,
  "message": "User preferences deleted"
}
```

---

### Alerts

#### GET /api/users/:address/alerts

Get user's configured alerts.

**Response:**
```json
{
  "success": true,
  "alerts": [
    {
      "id": 1,
      "type": 1,
      "name": "Whale Watch",
      "enabled": true,
      "threshold": 10000000000,
      "triggerCount": 5
    }
  ]
}
```

#### POST /api/users/:address/alerts

Create a new alert (server-side tracking).

**Request Body:**
```json
{
  "type": 1,
  "name": "My Whale Alert",
  "threshold": 50000000000,
  "targetAddress": "SP...",
  "txId": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "alert": {
    "id": 42,
    "type": 1,
    "name": "My Whale Alert",
    "enabled": true
  }
}
```

---

### Notifications

#### GET /api/notifications

Get recent notifications.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | number | 20 | Max notifications to return |
| type | string | - | Filter by notification type |

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": "abc123",
      "type": "whale",
      "title": "🐋 Whale Transfer Detected",
      "message": "10,000 STX transferred",
      "txHash": "0x...",
      "blockHeight": 123456,
      "timestamp": "2025-01-24T12:00:00.000Z"
    }
  ]
}
```

---

## Chainhook Endpoints

These endpoints receive blockchain events from Hiro Chainhooks.

### POST /api/chainhooks/whale-transfer

Receive whale transfer events (>10,000 STX).

### POST /api/chainhooks/contract-deployed

Receive new contract deployment events.

### POST /api/chainhooks/nft-mint

Receive NFT mint events.

### POST /api/chainhooks/token-launch

Receive new SIP-010 token deployment events.

### POST /api/v1/chainhooks/

Receive large DEX swap events.

### POST /api/chainhooks/subscription-created

Receive StackPulse subscription events.

### POST /api/chainhooks/alert-triggered

Receive alert trigger events.

### POST /api/chainhooks/fee-collected

Receive fee collection events.

### POST /api/chainhooks/badge-earned

Receive badge minting events.

**Common Chainhook Payload Structure:**
```json
{
  "apply": [
    {
      "block_identifier": {
        "index": 123456,
        "hash": "0x..."
      },
      "transactions": [
        {
          "transaction_identifier": { "hash": "0x..." },
          "metadata": {
            "success": true,
            "sender": "SP...",
            "fee": 1000,
            "receipt": {
              "events": [...]
            }
          }
        }
      ]
    }
  ],
  "chainhook": {
    "uuid": "chainhook-id",
    "predicate": {}
  }
}
```

---

## Error Responses

All endpoints return errors in a consistent format:

```json
{
  "success": false,
  "error": "Error message description",
  "code": 400
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing or invalid auth |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |

---

## Rate Limiting

- **Public endpoints**: 100 requests per minute per IP
- **Chainhook endpoints**: No rate limiting (authenticated)
- **User endpoints**: 60 requests per minute per address

---

## WebSocket Events (Future)

Real-time notifications via WebSocket at `wss://stackpulse-b8fw.onrender.com/ws`

### Event Types

```typescript
interface WebSocketMessage {
  type: 'notification' | 'stats' | 'alert';
  data: any;
}
```

### Subscribe to Events

```javascript
const ws = new WebSocket('wss://stackpulse-b8fw.onrender.com/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    address: 'SP...',
    events: ['whale', 'nft', 'alert']
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```
