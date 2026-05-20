import { describe, expect, it } from 'vitest';
import { formatNumber, formatStxAmount } from '../shared/utils/format';

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
