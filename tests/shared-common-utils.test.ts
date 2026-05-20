import { describe, expect, it } from 'vitest';
import { chunk, clamp, flatten, groupBy, hasKey, isNonEmptyString, isPositiveNumber, isValidBlockHeight, isValidStacksAddress, isValidTxId, mapValues, omit, pick, unique } from '../shared/utils/common';

describe('shared/common isValidStacksAddress', () => {
  it('accepts a valid mainnet address', () => {
    expect(isValidStacksAddress('SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9')).toBe(true);
  });
});

describe('shared/common clamp', () => {
  it('clamps values above the upper bound', () => {
    expect(clamp(12, 0, 10)).toBe(10);
  });

  it('clamps values below the lower bound', () => {
    expect(clamp(-2, 0, 10)).toBe(0);
  });

  it('supports reversed clamp bounds', () => {
    expect(clamp(8, 10, 0)).toBe(8);
  });

  it('returns the lower bound for non-finite values', () => {
    expect(clamp(Number.NaN, 2, 5)).toBe(2);
  });
});

describe('shared/common chunk', () => {
  it('splits arrays into requested chunk sizes', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('normalizes invalid chunk sizes to one', () => {
    expect(chunk([1, 2], 0)).toEqual([[1], [2]]);
  });
});

describe('shared/common unique', () => {
  it('removes duplicate primitive values', () => {
    expect(unique(['whale', 'swap', 'whale'])).toEqual(['whale', 'swap']);
  });
});

describe('shared/common flatten', () => {
  it('flattens nested arrays by one level', () => {
    expect(flatten([[1, 2], [3]])).toEqual([1, 2, 3]);
  });
});

describe('shared/common groupBy', () => {
  it('groups items by a derived key', () => {
    const grouped = groupBy(['whale', 'swap', 'watch'], item => item[0]);
    expect(grouped.get('w')).toEqual(['whale', 'watch']);
  });

  it('returns an empty map for empty inputs', () => {
    expect(groupBy([], String).size).toBe(0);
  });
});

describe('shared/common pick', () => {
  it('selects requested object keys', () => {
    expect(pick({ id: 'a1', type: 'whale', ignored: true }, ['id', 'type'])).toEqual({
      id: 'a1',
      type: 'whale',
    });
  });
});

describe('shared/common omit', () => {
  it('removes requested object keys', () => {
    expect(omit({ id: 'a1', secret: 'hidden', type: 'whale' }, ['secret'])).toEqual({
      id: 'a1',
      type: 'whale',
    });
  });
});

describe('shared/common mapValues', () => {
  it('transforms object values while preserving keys', () => {
    expect(mapValues({ a: 1, b: 2 }, value => Number(value) * 2)).toEqual({ a: 2, b: 4 });
  });
});

describe('shared/common hasKey', () => {
  it('detects own object keys', () => {
    expect(hasKey({ txId: '0x1' }, 'txId')).toBe(true);
  });

  it('rejects inherited object keys', () => {
    expect(hasKey({}, 'toString')).toBe(false);
  });
});

describe('shared/common isNonEmptyString', () => {
  it('accepts strings with non-whitespace content', () => {
    expect(isNonEmptyString(' stackpulse ')).toBe(true);
  });

  it('rejects whitespace-only strings', () => {
    expect(isNonEmptyString('   ')).toBe(false);
  });
});

describe('shared/common isPositiveNumber', () => {
  it('accepts finite positive numbers', () => {
    expect(isPositiveNumber(1)).toBe(true);
  });

  it('rejects zero as a positive number', () => {
    expect(isPositiveNumber(0)).toBe(false);
  });
});

describe('shared/common isValidBlockHeight', () => {
  it('accepts non-negative integer block heights', () => {
    expect(isValidBlockHeight(123)).toBe(true);
  });

  it('rejects fractional block heights', () => {
    expect(isValidBlockHeight(1.5)).toBe(false);
  });
});

describe('shared/common isValidTxId', () => {
  it('accepts 64-character hex transaction ids', () => {
    expect(isValidTxId('a'.repeat(64))).toBe(true);
  });

  it('accepts transaction ids with 0x prefixes', () => {
    expect(isValidTxId(`0x${'b'.repeat(64)}`)).toBe(true);
  });
});
