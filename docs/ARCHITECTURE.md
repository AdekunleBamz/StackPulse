# StackPulse Architecture

StackPulse is split across contracts, chainhooks, a backend ingestion API, a shared TypeScript package, and a Next.js client.

## Component map

- `contracts/`: on-chain source of truth for subscriptions, alerts, fees, and badges
- `chainhooks/`: event selectors that forward blockchain activity to backend webhooks
- `server/`: ingestion endpoints, state mutation, analytics, and notification fan-out
- `shared/`: shared constants, types, and format helpers for backend + frontend
- `frontend/`: wallet UX, alert management, history, and analytics screens
