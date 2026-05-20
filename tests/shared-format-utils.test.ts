import { describe, expect, it } from 'vitest';
import { formatNumber, formatPercent, formatStxAmount } from '../shared/utils/format';

describe('shared/format formatStxAmount', () => {
  it('formats million-scale STX amounts', () => {
    expect(formatStxAmount('2000000000000')).toBe('2.00M STX');
  });
});

describe('shared/format formatNumber', () => {
  it('formats numeric strings with separators', () => {
    expect(formatNumber('1,234.5')).toBe('1,234.5');
  });

  it('returns zero for invalid number values', () => {
    expect(formatNumber('not-a-number')).toBe('0');
  });
});

describe('shared/format formatPercent', () => {
  it('formats percentages with default decimals', () => {
    expect(formatPercent(12.345)).toBe('12.35%');
  });

  it('clamps negative decimal precision to integers', () => {
    expect(formatPercent(12.345, -1)).toBe('12%');
  });

  it('returns zero percent for invalid values', () => {
    expect(formatPercent(Number.NaN)).toBe('0.00%');
  });
});
