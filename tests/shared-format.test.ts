import { describe, expect, it, vi } from 'vitest';

import {
  formatDate,
  formatDateTime,
  formatBalance,
  formatDuration,
  formatFileSize,
  formatNumber,
  formatPercent,
  formatRelativeTime,
  formatStxAmount,
  formatTxId,
  truncateAddress,
  truncateString,
} from '../shared/utils/format';

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

describe('formatDate', () => {
  it('returns an explicit fallback for invalid dates', () => {
    expect(formatDate(new Date('invalid'))).toBe('Invalid date');
  });
});

describe('formatDateTime', () => {
  it('returns an explicit fallback for invalid timestamps', () => {
    expect(formatDateTime(Number.NaN)).toBe('Invalid date');
  });
});

describe('truncateAddress', () => {
  it('supports custom prefix and suffix lengths', () => {
    expect(truncateAddress('SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N', 4, 6)).toBe('SP3F...MCGG6N');
  });
});

describe('truncateString', () => {
  it('returns an empty string when truncating to zero characters', () => {
    expect(truncateString('StackPulse', 0)).toBe('');
  });
});

describe('formatFileSize', () => {
  it('formats bytes into larger units when needed', () => {
    expect(formatFileSize(1536)).toBe('1.50 KB');
  });
});

describe('formatDuration', () => {
  it('formats long durations into day-hour pairs', () => {
    expect(formatDuration(90_000_000)).toBe('1d 1h');
  });
});

describe('parseStxAmount', () => {
  it('rejects negative STX inputs instead of parsing them as positive', () => {
    expect(parseStxAmount('-1.5 STX')).toBe(0);
  });

  it('parses comma-separated STX display values into micro-STX', () => {
    expect(parseStxAmount('1,234.567890 STX')).toBe(1_234_567_890);
  });
});
