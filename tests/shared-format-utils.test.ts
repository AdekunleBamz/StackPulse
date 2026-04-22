import { describe, expect, it } from 'vitest';
import {
  formatBalance,
  formatDate,
  formatDateTime,
  formatDuration,
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

  it('formats thousand-scale STX amounts', () => {
    expect(formatStxAmount(1_500_000_000)).toBe('1.50K STX');
  });

  it('falls back to zero for invalid stx amount strings', () => {
    expect(formatStxAmount('NaN')).toBe('0.000000 STX');
  });

  it('parses numeric strings with surrounding whitespace', () => {
    expect(formatStxAmount(' 1000000 ')).toBe('1.000000 STX');
  });
});

describe('shared/format formatNumber', () => {
  it('parses comma-separated strings before formatting', () => {
    expect(formatNumber('12,345.67')).toBe('12,345.67');
  });

  it('returns zero for invalid numeric strings', () => {
    expect(formatNumber('not-a-number')).toBe('0');
  });

  it('formats numeric inputs with locale grouping', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('handles whitespace-padded numeric strings', () => {
    expect(formatNumber(' 1234 ')).toBe('1,234');
  });
});

describe('shared/format formatPercent', () => {
  it('caps decimals at six places', () => {
    expect(formatPercent(12.3456789, 9)).toBe('12.345679%');
  });

  it('clamps negative decimal precision to zero', () => {
    expect(formatPercent(12.9, -3)).toBe('13%');
  });

  it('falls back to default precision when decimals are non-finite', () => {
    expect(formatPercent(3.14159, Number.NaN)).toBe('3.14%');
  });
});

describe('shared/format formatRelativeTime', () => {
  it('describes timestamps a few minutes in the future', () => {
    expect(formatRelativeTime(Date.now() + 3 * 60 * 1000 + 5000)).toBe('in 3m');
  });

  it('uses in a moment for near-future timestamps', () => {
    expect(formatRelativeTime(Date.now() + 30 * 1000)).toBe('in a moment');
  });

  it('returns just now for very recent past timestamps', () => {
    expect(formatRelativeTime(Date.now() - 20 * 1000)).toBe('just now');
  });

  it('formats multi-week future timestamps in weeks', () => {
    expect(formatRelativeTime(Date.now() + 14 * 24 * 60 * 60 * 1000)).toBe('in 2w');
  });
});

describe('shared/format truncateAddress', () => {
  it('omits the tail when end chars are zero', () => {
    expect(truncateAddress('SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9', 4, 0)).toBe('SP3K...');
  });

  it('returns short addresses unchanged', () => {
    expect(truncateAddress('SP1234', 4, 4)).toBe('SP1234');
  });

  it('trims address input before truncation', () => {
    expect(truncateAddress('  SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9  ', 4, 4)).toBe('SP3K...KBR9');
  });
});

describe('shared/format truncateString', () => {
  it('adds an ellipsis when trimming long text', () => {
    expect(truncateString('stackpulse-alert', 10)).toBe('stackpulse...');
  });

  it('returns only ellipsis when max length is zero', () => {
    expect(truncateString('alert', 0)).toBe('...');
  });
});

describe('shared/format formatFileSize', () => {
  it('clamps negative byte counts to zero', () => {
    expect(formatFileSize(-12)).toBe('0.00 B');
  });

  it('handles non-finite byte counts safely', () => {
    expect(formatFileSize(Number.POSITIVE_INFINITY)).toBe('0.00 B');
  });
});

describe('shared/format formatDuration', () => {
  it('formats day-scale durations with hours', () => {
    expect(formatDuration(26 * 60 * 60 * 1000)).toBe('1d 2h');
  });

  it('formats minute-scale durations with seconds', () => {
    expect(formatDuration(125_000)).toBe('2m 5s');
  });
});

describe('shared/format formatDate', () => {
  it('returns an explicit invalid marker for invalid timestamps', () => {
    expect(formatDate(new Date('invalid'))).toBe('Invalid date');
  });
});

describe('shared/format formatDateTime', () => {
  it('returns an explicit invalid marker for invalid timestamps', () => {
    expect(formatDateTime(new Date('invalid'))).toBe('Invalid date');
  });
});

describe('shared/format formatBalance', () => {
  it('caps decimal precision at twelve places', () => {
    expect(formatBalance(1.234567890123456, 20)).toBe('1.234567890123');
  });

  it('returns a zero balance string for invalid values', () => {
    expect(formatBalance('oops', 4)).toBe('0.0000');
  });
});

describe('shared/format parseStxAmount', () => {
  it('removes commas and units before parsing', () => {
    expect(parseStxAmount('1,234.567 STX')).toBe(1234567000);
  });

  it('clamps negative parsed amounts to zero', () => {
    expect(parseStxAmount('-1 STX')).toBe(0);
  });

  it('returns zero for malformed decimal amounts', () => {
    expect(parseStxAmount('1.2.3')).toBe(0);
  });

  it('parses STX amounts with an explicit plus sign', () => {
    expect(parseStxAmount('+1.5 STX')).toBe(1500000);
  });
});

describe('shared/format formatTxId', () => {
  it('uses the standard transaction id truncation window', () => {
    expect(formatTxId('0x1234567890abcdef1234567890abcdef')).toBe('0x123456...90abcdef');
  });

  it('returns short transaction ids unchanged', () => {
    expect(formatTxId('0x1234')).toBe('0x1234');
  });
});
