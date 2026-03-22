# StackPulse Architecture

StackPulse is a modular monitoring system for the Stacks blockchain. It consists of several interconnected components that handle event ingestion, processing, and visualization.

## Component Overview

### 1. Smart Contracts (`contracts/`)
Written in Clarity, these contracts manage:
- **Registry**: Manages user registrations and alert settings.
- **Fees**: Handles subscription and service fees.
- **Badges**: Reputation system for active monitors.

### 2. Hiro Chainhooks (`chainhooks/`)
Manifest files that define the logic for filtering Stacks blockchain events. These hooks send real-time webhooks to the ingestion server.

### 3. Ingestion Server (`server/`)
An Express-based TypeScript server that:
- Listens for Hiro Chainhook events.
- Authenticates and validates incoming data.
- Stores alert history.
- Dispatches notifications via WebSockets and external APIs.

### 4. Frontend Application (`frontend/`)
A Next.js 14+ dashboard that provides:
- Real-time event monitoring.
- Alert configuration UI.
- Historical data visualization.
- User profile and reputation management.

### 5. Shared Package (`shared/`)
Common TypeScript types, constants, and utility functions used by both the server and frontend to ensure type safety and consistency.

## Data Flow

1. **Stacks Node** produces a block or transaction.
2. **Hiro Chainhook** matches a predefined filter.
3. **Webhook** is sent to the `server/`.
4. **Server** processes the event and notifies connected **Frontend** clients.
