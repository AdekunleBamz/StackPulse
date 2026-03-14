# Frontend Hooks

Custom React hooks for the StackPulse application.

## Core Hooks

- `useAlerts`: Manage alert configuration and history.
- `useStxBalance`: Real-time monitoring of Stacks wallet balances.
- `useWebSocket`: Type-safe WebSocket integration for live updates.

## Guidelines

- Hooks should be focused on a single responsibility.
- Implement proper cleanup in `useEffect` when necessary.
- Provide comprehensive TypeScript interfaces for hook return values.
