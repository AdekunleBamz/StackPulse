import { describe, expect, it } from 'vitest';
import { chunk, clamp, flatten, isValidStacksAddress, unique } from '../shared/utils/common';

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
