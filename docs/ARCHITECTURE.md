# StackPulse Architecture

StackPulse is split across contracts, chainhooks, a backend ingestion API, a shared TypeScript package, and a Next.js client.

## Component map

- `contracts/`: on-chain source of truth for subscriptions, alerts, fees, and badges
- `chainhooks/`: event selectors that forward blockchain activity to backend webhooks
- `server/`: ingestion endpoints, state mutation, analytics, and notification fan-out
- `shared/`: shared constants, types, and format helpers for backend + frontend
- `frontend/`: wallet UX, alert management, history, and analytics screens

## Event flow

1. A chainhook rule matches a Stacks event and POSTs payload data to the backend.
2. The backend validates the webhook signature and normalizes payload details.
3. Matching alert records are updated, then notifications are emitted to clients.
4. The frontend fetches current state and listens to live updates where available.

## Trust boundaries

- Chainhooks are treated as external input and must pass auth + payload checks.
- Smart contracts are authoritative for subscription state; backend state is derivative.
- Frontend toggles and dashboards should tolerate backend latency and retry safely.

## Reliability notes

- Webhook handlers should acknowledge quickly and avoid long blocking operations.
- Downstream notifications are best-effort and should not block persistence writes.
- Health endpoints should report dependency status separately from process liveness.

## Observability surfaces

- `/health` for process and dependency health snapshots.
- `/api/v1/stats` for event counters used by dashboards and quick verification.
- Structured server logs for webhook validation, routing, and processing failures.

## Deployment split

- Contracts are deployed with Clarinet plans under `deployments/`.
- Backend and frontend are independently deployable and communicate over HTTP/WebSocket.
- Chainhook registration ties manifest webhook targets to the currently deployed backend.
