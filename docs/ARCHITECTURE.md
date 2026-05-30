# StackPulse Architecture

This document describes the high-level architecture of the StackPulse ecosystem, focused on real-time blockchain monitoring and user-defined alerts.

## Component Overview

### 1. Ingestion Layer (Chainhooks)
- **Whale Watcher**: Monitors large STX transfers.
- **Contract Watcher**: Monitors new contract deployments.
- **Activity Watcher**: Monitors NFT mints and token launches.
- **Protocol Watcher**: Monitors DEX swaps and pool activity.

### 2. Processing Layer (Server)
- **Inbound Registry**: Validates and routes chainhook payloads.
- **Alert Engine**: Matches events against user-defined thresholds and addresses.
- **Notification Service**: Delivers alerts via Webhooks, Discord, and Telegram with exponential backoff retries.
- **WebSocket Gateway**: Pushes real-time "Network Pulse" metrics to connected frontend clients.

### 3. State Layer (Database & Cache)
- **User State**: Manages tiers, settings, and registered alerts.
- **History Store**: Persistent log of triggered alerts for auditing.
- **LRU Cache**: High-performance caching for frequently accessed contract data and user settings.

### 4. Presentation Layer (Frontend)
- **Dashboard**: Real-time management of active alerts and triggers.
- **Live Stats**: Visual representation of the global network pulse.
- **History**: Searchable, paginated log of all blockchain event matches.

## Data Flow Lifecycle

1. **Blockchain Event**: A transaction is confirmed on the Stacks blockchain.
2. **Chainhook Trigger**: Hiro Chainhook identifies a matching pattern and POSTs to the server.
3. **Validation**: Server verifies signatures and schema.
4. **Matching**: Alert engine compares event data (e.g., amount > 10,000 STX) against active user alerts.
5. **Dispatch**: Notification service sends asynchronous payloads to configured providers.
6. **Live Update**: WebSocket gateway broadcasts the event to active dashboard users.

7. **Postmortem Loop**: Operations review alert misses and noisy triggers to tune matching rules and provider retry thresholds.
8. **Replay Safety**: Event consumers should stay idempotent so controlled replay windows can be run without duplicating user-facing alerts.
9. **Evidence Capture**: Release owners should record replay window bounds and provider retry counts for later incident comparison.
