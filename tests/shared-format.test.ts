import { describe, expect, it } from 'vitest';

import { formatStxAmount } from '../shared/utils/format';

describe('formatStxAmount', () => {
  it('formats whole STX balances with six decimals', () => {
    expect(formatStxAmount(1_000_000)).toBe('1.000000 STX');
    expect(formatStxAmount('2500000')).toBe('2.500000 STX');
  });

  it('abbreviates large balances into thousands of STX', () => {
    expect(formatStxAmount(1_500_000_000)).toBe('1.50K STX');
  });
});
