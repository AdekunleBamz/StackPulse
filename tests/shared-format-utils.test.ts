import { describe, expect, it } from 'vitest';
import {
  formatNumber,
  formatPercent,
  formatFileSize,
  formatDuration,
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

describe('shared/format truncateAddress', () => {
  it('truncates long Stacks addresses', () => {
    expect(truncateAddress('SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9')).toBe('SP3K8B...KBR9');
  });

  it('returns original addresses when visible segments are disabled', () => {
    expect(truncateAddress('SP12345', 0, 0)).toBe('SP12345');
  });

  it('keeps short addresses unchanged', () => {
    expect(truncateAddress('SP123')).toBe('SP123');
  });
});

describe('shared/format truncateString', () => {
  it('truncates strings above the requested length', () => {
    expect(truncateString('StackPulse alerts', 10)).toBe('StackPulse...');
  });

  it('keeps strings within the requested length unchanged', () => {
    expect(truncateString('alerts', 10)).toBe('alerts');
  });

  it('normalizes negative string truncation lengths', () => {
    expect(truncateString('alerts', -1)).toBe('...');
  });
});

describe('shared/format formatFileSize', () => {
  it('formats zero byte values', () => {
    expect(formatFileSize(0)).toBe('0.00 B');
  });

  it('formats kilobyte values', () => {
    expect(formatFileSize(1024)).toBe('1.00 KB');
  });

  it('normalizes negative file sizes to zero', () => {
    expect(formatFileSize(-5)).toBe('0.00 B');
  });
});

describe('shared/format formatDuration', () => {
  it('formats second durations', () => {
    expect(formatDuration(10_000)).toBe('10s');
  });

  it('formats minute and second durations', () => {
    expect(formatDuration(90_000)).toBe('1m 30s');
  });

  it('formats hour and minute durations', () => {
    expect(formatDuration(3_900_000)).toBe('1h 5m');
  });
});
