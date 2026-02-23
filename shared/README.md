# StackPulse Shared

Shared types, constants, and utilities for StackPulse frontend and server.

## Contents

### Types (`types/`)

- `alerts.ts` - Alert type definitions
- `user.ts` - User type definitions

### Constants (`constants/`)

- `index.ts` - Application constants

### Utils (`utils/`)

- `format.ts` - Formatting utilities

## Usage

```typescript
// Import types
import { Alert, AlertType } from '@stackpulse/shared/types';

// Import constants
import { API_URLS, ALERT_TYPES } from '@stackpulse/shared/constants';

// Import utilities
import { formatStxAmount, truncateAddress } from '@stackpulse/shared/utils';
```

## Publishing

To publish the shared package:

```bash
cd shared
npm publish
```
