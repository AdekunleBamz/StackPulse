import { describe, expect, it } from 'vitest';
import {
  formatNumber,
  formatPercent,
  formatFileSize,
  formatDuration,
  formatBalance,
  formatTxId,
  parseStxAmount,
  formatStxAmount,
  truncateAddress,
  truncateString,
} from '../shared/utils/format';

describe('shared/format formatStxAmount', () => {
  it('formats million-scale STX amounts', () => {
    expect(formatStxAmount('2000000000000')).toBe('2.00M STX');
  });

  it('formats single-STX micro amounts', () => {
    expect(formatStxAmount(1_000_000)).toBe('1.000000 STX');
  });

  it('formats thousand-scale STX amounts', () => {
    expect(formatStxAmount(1_500_000_000)).toBe('1.50K STX');
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

  it('normalizes negative durations to zero seconds', () => {
    expect(formatDuration(-1)).toBe('0s');
  });
});

describe('shared/format parseStxAmount', () => {
  it('parses STX display values into micro-STX', () => {
    expect(parseStxAmount('1.5 STX')).toBe(1_500_000);
  });

  it('returns zero for invalid STX amount text', () => {
    expect(parseStxAmount('free')).toBe(0);
  });

  it('parses comma-separated STX amount text', () => {
    expect(parseStxAmount('1,234 STX')).toBe(1_234_000_000);
  });
});

describe('shared/format formatBalance', () => {
  it('formats numeric balances with requested decimals', () => {
    expect(formatBalance(1.23456, 2)).toBe('1.23');
  });

  it('formats string balances with separators', () => {
    expect(formatBalance('1,234.5', 1)).toBe('1234.5');
  });

  it('returns zero balance for invalid values', () => {
    expect(formatBalance('invalid', 3)).toBe('0.000');
  });
});

describe('shared/format formatTxId', () => {
  it('truncates long transaction IDs', () => {
    const txId = '0x' + 'a'.repeat(64);
    expect(formatTxId(txId)).toBe('0xaaaaaa...aaaaaaaa');
  });
});
