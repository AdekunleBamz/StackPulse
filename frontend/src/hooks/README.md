# Frontend Hooks

Custom React hooks for data fetching, browser state, and live updates.

## Hooks in this folder

- `useAlerts.ts`: load, create, delete, and refresh user alerts
- `useDebounce.ts`: debounce rapidly changing values
- `useLocalStorage.ts`: state synchronized to `localStorage`
- `useMediaQuery.ts`: responsive state helpers plus mobile/tablet/desktop shortcuts
- `useUser.ts`: load and refresh user profile data
- `useWebSocket.ts`: manage live socket connections and messages

## Exports

All hooks are exported from `index.ts`:

```typescript
import { 
  useAlerts, 
  useDebounce, 
  useLocalStorage, 
  useMediaQuery, 
  useIsMobile, 
  useIsTablet, 
  useIsDesktop,
  useUser, 
  useWebSocket 
} from '@/hooks';
```

## Working rules

- Keep hooks single-purpose.
- Clean up timers, listeners, and socket connections.
- Return stable, well-typed shapes so components stay simple.
- When reconnecting sockets, apply jittered delays to avoid synchronized reconnect spikes across many clients.
- For long-lived callbacks in hooks, prefer refs or stable dependencies so reconnection handlers do not close over stale state.
- Document stale-data thresholds whenever a hook exposes cached API results.
- Reconfirm hook cleanup behavior whenever polling intervals are made configurable.
