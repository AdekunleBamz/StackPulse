import { describe, expect, it } from 'vitest';
import {
  formatFileSize,
  formatNumber,
  parseStxAmount,
  formatPercent,
  formatFileSize,
  formatRelativeTime,
  formatSignedNumber,
  formatStxAmount,
  formatTime,
  truncateAddress,
  truncateString,
} from '../shared/utils/format';

describe('shared/format formatStxAmount', () => {
  it('formats zero micro-STX amounts', () => {
    expect(formatStxAmount(0)).toBe('0.000000 STX');
  });

  it('formats one whole STX amount', () => {
    expect(formatStxAmount(1_000_000)).toBe('1.000000 STX');
  });

  it('formats fractional STX amounts with six decimals', () => {
    expect(formatStxAmount(1_234_567)).toBe('1.234567 STX');
  });

  it('formats million-scale STX amounts', () => {
    expect(formatStxAmount('2000000000000')).toBe('2.00M STX');
  });

  it('handles comma-formatted and malformed microSTX strings', () => {
    expect(formatStxAmount('1,000,000')).toBe('1.000000 STX');
    expect(formatStxAmount('1.2.3')).toBe('0.000000 STX');
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

  it('formats negative numeric inputs with grouping', () => {
    expect(formatNumber(-1234)).toBe('-1,234');
  });

  it('formats decimal numeric strings with grouping', () => {
    expect(formatNumber('1234.5')).toBe('1,234.5');
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

  it('formats non-finite percentage values as zero', () => {
    expect(formatPercent(Number.NaN)).toBe('0.00%');
  });

  it('floors fractional percentage precision values', () => {
    expect(formatPercent(3.14159, 3.9)).toBe('3.142%');
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

  it('formats hour-old timestamps in hours', () => {
    expect(formatRelativeTime(Date.now() - 2 * 60 * 60 * 1000)).toBe('2h ago');
  });

  it('formats day-old timestamps in days', () => {
    expect(formatRelativeTime(Date.now() - 3 * 24 * 60 * 60 * 1000)).toBe('3d ago');
  });

  it('formats future timestamps in hours', () => {
    expect(formatRelativeTime(Date.now() + 2 * 60 * 60 * 1000)).toBe('in 2h');
  });

  it('formats month-scale past timestamps', () => {
    expect(formatRelativeTime(Date.now() - 60 * 24 * 60 * 60 * 1000)).toBe('2mo ago');
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

  it('returns an empty label for non-string addresses', () => {
    expect(truncateAddress(12 as unknown as string)).toBe('');
  });

  it('uses default truncation when start chars are non-finite', () => {
    expect(truncateAddress('SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9', Number.NaN, 4)).toBe('SP3K8B...KBR9');
  });

  it('floors decimal truncation windows', () => {
    expect(truncateAddress('SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9', 3.9, 2.9)).toBe('SP3...R9');
  });
});

describe('shared/format truncateString', () => {
  it('adds an ellipsis when trimming long text', () => {
    expect(truncateString('stackpulse-alert', 10)).toBe('stackpulse...');
  });

  it('returns only ellipsis when max length is zero', () => {
    expect(truncateString('alert', 0)).toBe('...');
  });

  it('treats non-finite max lengths as zero', () => {
    expect(truncateString('alert', Number.NaN)).toBe('...');
  });
});

describe('shared/format formatFileSize', () => {
  it('clamps negative byte counts to zero', () => {
    expect(formatFileSize(-12)).toBe('0.00 B');
  });

  it('handles non-finite byte counts safely', () => {
    expect(formatFileSize(Number.POSITIVE_INFINITY)).toBe('0.00 B');
  });

  it('formats kilobyte-scale file sizes', () => {
    expect(formatFileSize(1024)).toBe('1.00 KB');
  });

  it('formats megabyte-scale file sizes', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.00 MB');
  });
});

describe('shared/format formatDuration', () => {
  it('formats day-scale durations with hours', () => {
    expect(formatDuration(26 * 60 * 60 * 1000)).toBe('1d 2h');
  });

  it('formats minute-scale durations with seconds', () => {
    expect(formatDuration(125_000)).toBe('2m 5s');
  });

  it('formats sub-minute durations in seconds', () => {
    expect(formatDuration(45_000)).toBe('45s');
  });

  it('formats zero durations in seconds', () => {
    expect(formatDuration(0)).toBe('0s');
  });
});

describe('shared/format formatDate', () => {
  it('returns an explicit invalid marker for invalid timestamps', () => {
    expect(formatDate(new Date('invalid'))).toBe('Invalid date');
  });

  it('supports custom date formatting options', () => {
    expect(formatDate(Date.UTC(2024, 0, 2), { year: 'numeric' })).toBe('2024');
  });
});

describe('shared/format formatDateTime', () => {
  it('returns an explicit invalid marker for invalid timestamps', () => {
    expect(formatDateTime(new Date('invalid'))).toBe('Invalid date');
  });

  it('formats valid date-time values as strings', () => {
    expect(formatDateTime(Date.UTC(2024, 0, 2))).toContain('2024');
  });
});

describe('shared/format formatBalance', () => {
  it('caps decimal precision at twelve places', () => {
    expect(formatBalance(1.234567890123456, 20)).toBe('1.234567890123');
  });

  it('returns a zero balance string for invalid values', () => {
    expect(formatBalance('oops', 4)).toBe('0.0000');
  });

  it('parses whitespace-padded balance strings', () => {
    expect(formatBalance(' 1,234.5 ', 1)).toBe('1234.5');
  });

  it('clamps negative balance precision to whole numbers', () => {
    expect(formatBalance(1.6, -1)).toBe('2');
  });
});

describe('shared/format parseStxAmount', () => {
  it('parses plain STX amounts into micro-STX', () => {
    expect(parseStxAmount('2.5')).toBe(2_500_000);
  });

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

  it('returns short transaction ids unchanged', () => {
    expect(formatTxId('0x1234')).toBe('0x1234');
  });

  it('trims transaction ids before formatting', () => {
    expect(formatTxId('  0x1234567890abcdef1234567890abcdef  ')).toBe('0x123456...90abcdef');
  });

  it('returns empty transaction labels for non-string values', () => {
    expect(formatTxId(12 as unknown as string)).toBe('');
  });
});

describe('shared/format formatCompactNumber', () => {
  it('normalizes negative zero to plain zero', () => {
    expect(formatCompactNumber(-0)).toBe('0');
  });

  it('formats thousand-scale compact numbers', () => {
    expect(formatCompactNumber(1_500)).toBe('1.5K');
  });
});

describe('shared/format formatTime', () => {
  it('formats valid time values as strings', () => {
    expect(formatTime(Date.UTC(2024, 0, 2, 13, 5))).toContain(':');
  });
});

describe('shared/format formatSignedNumber', () => {
  it('adds an explicit sign for positive values', () => {
    expect(formatSignedNumber(7)).toBe('+7');
  });
});

describe('shared/format formatOrdinal', () => {
  it('falls back to 0th for non-finite inputs', () => {
    expect(formatOrdinal(Number.NaN)).toBe('0th');
  });

  it('formats common ordinal suffixes', () => {
    expect(formatOrdinal(1)).toBe('1st');
    expect(formatOrdinal(2)).toBe('2nd');
    expect(formatOrdinal(3)).toBe('3rd');
  });

  it('formats teen ordinal suffixes as th', () => {
    expect(formatOrdinal(11)).toBe('11th');
  });
});

describe('shared/format formatTxId', () => {
  it('uses the standard transaction id truncation window', () => {
    expect(formatTxId('0x1234567890abcdef1234567890abcdef')).toBe('0x123456...90abcdef');
  });
});

describe('shared/format parseStxAmount', () => {
  it('removes commas and units before parsing', () => {
    expect(parseStxAmount('1,234.567 STX')).toBe(1234567000);
  });
});

describe('shared/format formatFileSize', () => {
  it('clamps negative byte counts to zero', () => {
    expect(formatFileSize(-12)).toBe('0.00 B');
  });
});
