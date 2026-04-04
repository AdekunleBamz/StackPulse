import { describe, expect, it, vi } from 'vitest';

import { formatNumber, formatStxAmount } from '../shared/utils/format';

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

describe('formatNumber', () => {
  it('falls back to zero for invalid numeric input', () => {
    expect(formatNumber('not-a-number')).toBe('0');
  });
});
