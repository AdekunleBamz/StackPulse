# 🎨 StackPulse Frontend

The **StackPulse Frontend** is a modern, responsive Next.js 14 application providing a real-time dashboard for the StackPulse monitoring system. It handles user registration, alert configuration, and provides detailed analytics for Stacks blockchain events.

## Commands

```bash
npm ci
npm run dev
npm run build
npm run start
npm run lint
```

## Environment variables

```env
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
NEXT_PUBLIC_DEPLOYER_ADDRESS=SP...
NEXT_PUBLIC_WS_URL=wss://your-server.example/ws
```

## Important folders

- `src/app/`: route segments and page entrypoints
- `src/components/`: reusable UI building blocks
- `src/hooks/`: frontend data and browser behavior hooks
- `src/context/`: wallet context and related providers
- `public/`: static assets and site metadata

## Integration notes

- The dashboard talks to the backend for alert history and user data.
- Contract calls use the configured deployer address and current contract names.
- Keep frontend docs aligned with the backend paths in `../docs/API.md`.
- Revisit empty-state copy whenever new alert types are added so onboarding prompts stay accurate.

- Frontend ops tip: verify error boundaries after dependency and routing updates.
