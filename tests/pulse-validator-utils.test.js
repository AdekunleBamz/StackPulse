import { describe, expect, it } from 'vitest';
import {
  isValidAlertCooldown,
  isValidBlockHeight,
  isValidCacheTTL,
  isValidChartPoints,
  isValidFeedSize,
  isValidPageSize,
  isValidPulseAddress,
  isValidPulseContractAddress,
  isValidPulseDelta,
  isValidPulseNetwork,
  isValidPulsePrice,
  isValidPulseStatus,
  isValidPulseTxId,
  isValidPulseVersion,
  isValidReconnectDelay,
  isValidRetryCount,
  isValidStaleThreshold,
  isValidTickInterval,
} from '../frontend/src/lib/pulseValidators.js';

describe('pulse validator utils', () => {
  it('accepts non-negative pulse prices', () => {
    expect(isValidPulsePrice('12.5')).toBe(true);
  });

  it('rejects negative pulse prices', () => {
    expect(isValidPulsePrice('-1')).toBe(false);
  });

  it('accepts non-negative block heights', () => {
    expect(isValidBlockHeight(0)).toBe(true);
  });
});
