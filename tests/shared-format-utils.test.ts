import { describe, expect, it } from 'vitest';
import {
  formatNumber,
  formatPercent,
  formatFileSize,
  formatRelativeTime,
  formatStxAmount,
  truncateAddress,
  truncateString,
} from '../shared/utils/format';

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

describe('shared/format formatRelativeTime', () => {
  it('describes timestamps a few minutes in the future', () => {
    expect(formatRelativeTime(Date.now() + 3 * 60 * 1000 + 5000)).toBe('in 3m');
  });
});

describe('shared/format truncateAddress', () => {
  it('omits the tail when end chars are zero', () => {
    expect(truncateAddress('SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9', 4, 0)).toBe('SP3K...');
  });
});

describe('shared/format truncateString', () => {
  it('adds an ellipsis when trimming long text', () => {
    expect(truncateString('stackpulse-alert', 10)).toBe('stackpulse...');
  });
});

describe('shared/format formatFileSize', () => {
  it('clamps negative byte counts to zero', () => {
    expect(formatFileSize(-12)).toBe('0.00 B');
  });
});
