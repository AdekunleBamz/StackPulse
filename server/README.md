# StackPulse Server

Express.js API server for StackPulse blockchain alerting platform.

## Features

- RESTful API for alert management
- WebSocket support for real-time notifications
- Chainhook integration for blockchain event listening
- Rate limiting and security middleware
- Health check endpoints

## Getting Started

### Prerequisites

- Node.js >= 18
- npm or yarn

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```env
PORT=3000
NODE_ENV=development
CHAINHOOKS_API_KEY=your_api_key
CHAINHOOK_AUTH_TOKEN=your_webhook_secret
DEPLOYER_ADDRESS=your_stacks_address
LOG_LEVEL=info
```

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

## API Endpoints

### Health

- `GET /health` - Health check
- `GET /health/ready` - Readiness check
- `GET /health/live` - Liveness check

### Alerts

- `GET /api/alerts` - List alerts
- `GET /api/alerts/:id` - Get alert
- `POST /api/alerts` - Create alert
- `PATCH /api/alerts/:id` - Update alert
- `DELETE /api/alerts/:id` - Delete alert
- `POST /api/alerts/:id/toggle` - Toggle alert

### Analytics

- `GET /api/analytics` - Get analytics data
- `GET /api/analytics/summary` - Get analytics summary

### Users

- `GET /api/users` - List users
- `GET /api/users/:address` - Get user

### Metrics

- `GET /api/metrics` - Server metrics
- `GET /api/metrics/prometheus` - Prometheus format

## WebSocket

Connect to `/ws` for real-time notifications.

## License

MIT
