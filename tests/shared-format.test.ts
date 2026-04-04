import { describe, expect, it, vi } from 'vitest';

import { formatNumber, formatPercent, formatStxAmount } from '../shared/utils/format';

describe('formatStxAmount', () => {
  it('formats whole STX balances with six decimals', () => {
    expect(formatStxAmount(1_000_000)).toBe('1.000000 STX');
    expect(formatStxAmount('2500000')).toBe('2.500000 STX');
  });

  it('abbreviates large balances into thousands of STX', () => {
    expect(formatStxAmount(1_500_000_000)).toBe('1.50K STX');
  });

  it('abbreviates very large balances into millions of STX', () => {
    expect(formatStxAmount('2000000000000')).toBe('2.00M STX');
  });
});

describe('formatPercent', () => {
  it('clamps requested decimals into a safe range', () => {
    expect(formatPercent(12.3456789, 10)).toBe('12.345679%');
  });
});

describe('formatRelativeTime', () => {
  it('falls back gracefully for invalid dates', () => {
    expect(formatRelativeTime(new Date('invalid'))).toBe('just now');
  });

  it('formats future timestamps with relative labels', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-04T12:00:00Z'));

    expect(formatRelativeTime(Date.parse('2026-04-04T12:05:00Z'))).toBe('in 5m');

    vi.useRealTimers();
  });
});

describe('formatPercent', () => {
  it('clamps requested decimals into a safe range', () => {
    expect(formatPercent(12.3456789, 10)).toBe('12.345679%');
  });
});
