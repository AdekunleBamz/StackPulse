import { describe, expect, it } from 'vitest';
import {
  formatPulseAddress,
  formatPulseAge,
  formatPulseBlock,
  formatPulseCategory,
  formatPulseCount,
  formatPulseDecimal,
  formatPulseDelta,
  formatPulseError,
  formatPulseFeedItem,
  formatPulseLabel,
  formatPulseMarketCap,
  formatPulseMicroStx,
  formatPulseNetwork,
  formatPulsePrice,
  formatPulseRatio,
  formatPulseStatus,
  formatPulseTxId,
  formatPulseVolume,
} from '../frontend/src/lib/pulseFormat.js';

describe('pulse format utils', () => {
  it('formats pulse prices with currency precision', () => {
    expect(formatPulsePrice('12.345')).toBe('$12.35');
  });

  it('formats positive pulse deltas with an explicit sign', () => {
    expect(formatPulseDelta(1.234)).toBe('+1.23%');
  });
});
