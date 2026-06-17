# StackPulse Server

TypeScript + Express backend for chainhook ingestion, alert persistence, metrics, health checks, and real-time notification delivery.

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
npm test
npm start
npm run register-hooks
npm run test
```

## Main responsibilities

- accept Hiro Chainhook payloads under `/api/v1/chainhooks/*`
- store user preferences and alert metadata
- expose health and stats endpoints for uptime checks
- broadcast notifications over WebSocket and internal fan-out services

## Environment highlights

```env
PORT=3000
NODE_ENV=development
CHAINHOOK_AUTH_TOKEN=your_webhook_secret
DEPLOYER_ADDRESS=your_stacks_address
LOG_LEVEL=info
REDIS_URL=redis://optional
```

## Source of truth

`src/index.ts` is the current mounted server entrypoint. The files in `src/routes/` mirror route groups and are useful for modularization work, but they are not authoritative until they are wired into the live app.

## Nearby folders

- `src/middleware/`: request guards, rate limiting, logging, validation, timeouts, and error handling
- `src/services/`: analytics, cache, db, email, health, metrics, notifications, tier logic, and websocket delivery
- `src/utils/`: logger, Stacks API helpers, and webhook signing utilities
- `data/`: local persistence artifacts
- `logs/`: runtime log output when enabled
- Include a correlation ID in alert dispatch logs to connect inbound chainhook events with downstream notification attempts.
- Preserve request ID propagation in proxy headers so API and websocket traces can be correlated across reverse-proxy boundaries.
