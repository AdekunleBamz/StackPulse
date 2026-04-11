import { describe, expect, it } from 'vitest';
import {
  formatFileSize,
  formatNumber,
  formatTxId,
  parseStxAmount,
  formatPercent,
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

  it('returns an empty string when max length is zero', () => {
    expect(truncateString('stackpulse-alert', 0)).toBe('');
  });
});

describe('shared/format formatFileSize', () => {
  it('clamps negative byte counts to zero', () => {
    expect(formatFileSize(-12)).toBe('0.00 B');
  });
});

describe('shared/format parseStxAmount', () => {
  it('removes commas and units before parsing', () => {
    expect(parseStxAmount('1,234.567 STX')).toBe(1234567000);
  });

  it('returns zero for malformed numeric strings', () => {
    expect(parseStxAmount('1.2.3 STX')).toBe(0);
    expect(parseStxAmount('abc')).toBe(0);
  });
});

describe('shared/format formatTxId', () => {
  it('uses the standard transaction id truncation window', () => {
    expect(formatTxId('0x1234567890abcdef1234567890abcdef')).toBe('0x123456...90abcdef');
  });
});
