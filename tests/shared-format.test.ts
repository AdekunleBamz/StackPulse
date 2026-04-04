import { describe, expect, it } from 'vitest';

import { formatNumber, formatPercent, formatStxAmount } from '../shared/utils/format';

describe('formatStxAmount', () => {
  it('formats whole STX balances with six decimals', () => {
    expect(formatStxAmount(1_000_000)).toBe('1.000000 STX');
    expect(formatStxAmount('2500000')).toBe('2.500000 STX');
  });
});

describe('formatPercent', () => {
  it('clamps requested decimals into a safe range', () => {
    expect(formatPercent(12.3456789, 10)).toBe('12.345679%');
  });
});
