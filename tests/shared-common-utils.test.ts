import { describe, expect, it } from 'vitest';
import { clamp, isValidStacksAddress } from '../shared/utils/common';

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
});
