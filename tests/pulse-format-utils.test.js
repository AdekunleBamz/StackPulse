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

  it('formats negative pulse deltas without a plus sign', () => {
    expect(formatPulseDelta(-1.234)).toBe('-1.23%');
  });

  it('formats pulse block labels', () => {
    expect(formatPulseBlock(123)).toBe('#123');
  });

  it('formats pulse transaction ids for compact display', () => {
    expect(formatPulseTxId('abcdef123456')).toBe('abcdef12...');
  });

  it('formats pulse addresses with visible ends', () => {
    expect(formatPulseAddress('SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9')).toBe('SP3K8B...KBR9');
  });
});
