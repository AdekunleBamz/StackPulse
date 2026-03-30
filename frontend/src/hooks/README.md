# Frontend Hooks

Custom React hooks for data fetching, browser state, and live updates.

## Hooks in this folder

- `useAlerts.ts`: load, create, delete, and refresh user alerts
- `useDebounce.ts`: debounce rapidly changing values
- `useLocalStorage.ts`: state synchronized to `localStorage`
- `useMediaQuery.ts`: responsive state helpers plus mobile/tablet/desktop shortcuts
- `useUser.ts`: load and refresh user profile data
- `useWebSocket.ts`: manage live socket connections and messages

## Export note

`index.ts` currently re-exports `useLocalStorage`, `useMediaQuery`, and `useDebounce`. Import `useAlerts`, `useUser`, and `useWebSocket` directly until they are promoted to the shared hook surface.

## Working rules

- Keep hooks single-purpose.
- Clean up timers, listeners, and socket connections.
- Return stable, well-typed shapes so components stay simple.
- When reconnecting sockets, apply jittered delays to avoid synchronized reconnect spikes across many clients.
