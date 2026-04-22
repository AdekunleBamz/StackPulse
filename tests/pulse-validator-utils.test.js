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

  it('accepts 64-character pulse transaction ids', () => {
    expect(isValidPulseTxId('a'.repeat(64))).toBe(true);
  });

  it('accepts pulse mainnet addresses', () => {
    expect(isValidPulseAddress('SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9')).toBe(true);
  });

  it('accepts supported pulse networks', () => {
    expect(isValidPulseNetwork('mainnet')).toBe(true);
    expect(isValidPulseNetwork('testnet')).toBe(true);
  });

  it('accepts semantic pulse versions', () => {
    expect(isValidPulseVersion('1.0.0')).toBe(true);
  });

  it('accepts positive tick intervals', () => {
    expect(isValidTickInterval(1)).toBe(true);
  });

  it('accepts feed sizes at the upper bound', () => {
    expect(isValidFeedSize(1000)).toBe(true);
  });

  it('accepts non-negative retry counts', () => {
    expect(isValidRetryCount(0)).toBe(true);
  });
});
