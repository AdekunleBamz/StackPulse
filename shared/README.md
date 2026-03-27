# StackPulse Shared

Shared constants, types, and formatting helpers used by the frontend and server.

## Package name

`@stackpulse/shared`

## Exports

- `types/`: alert and user types
- `constants/`: API URLs, contract names, rate limits, tiers, feature flags, and event constants
- `utils/`: formatting helpers for amounts, dates, balances, durations, and IDs

## Common commands

```bash
npm ci
npm run build
npm test
```

## Example imports

```typescript
import { API_URLS, ALERT_TYPES, TIER_NAMES } from '@stackpulse/shared/constants';
import { AlertType, UserTier } from '@stackpulse/shared/types';
import { formatStxAmount, formatRelativeTime, truncateAddress } from '@stackpulse/shared/utils';
```
