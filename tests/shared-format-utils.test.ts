import { describe, expect, it } from 'vitest';
import { formatNumber, formatPercent, formatStxAmount } from '../shared/utils/format';

describe('shared/format formatStxAmount', () => {
  it('formats million-scale STX amounts', () => {
    expect(formatStxAmount('2000000000000')).toBe('2.00M STX');
  });
});

describe('shared/format formatNumber', () => {
  it('parses comma-separated strings before formatting', () => {
    expect(formatNumber('12,345.67')).toBe('12,345.67');
  });
});

describe('shared/format formatPercent', () => {
  it('caps decimals at six places', () => {
    expect(formatPercent(12.3456789, 9)).toBe('12.345679%');
  });
});
