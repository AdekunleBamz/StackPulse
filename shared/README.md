# StackPulse Shared

Shared constants, types, and formatting helpers used by the frontend and server.

## Package name

`@stackpulse/shared`

## Exports

- `types/`: alert and user types
- `constants/`: API URLs, contract names, rate limits, tiers, feature flags, and event constants
- `utils/`: formatting helpers and common utilities
  - `format.ts`: amount, date, balance, duration, and file size formatting
  - `common.ts`: address validation, ID generation, debounce, and clamp utilities

## Common commands

```bash
npm install
npm run build
npm test
npm run test:watch
```

## Example imports

```typescript
import { API_URLS, ALERT_TYPES, TIER_NAMES } from '@stackpulse/shared/constants';
import { AlertType, UserTier } from '@stackpulse/shared/types';
import { formatStxAmount, formatRelativeTime, truncateAddress } from '@stackpulse/shared/utils';
```
- When changing shared constants, publish compatibility notes so frontend and server deployments can roll in a safe order.
- Treat exported type removals as breaking changes and coordinate semver bumps before consuming updates in app packages.
- Recheck shared formatter examples whenever display precision rules change in frontend code.
