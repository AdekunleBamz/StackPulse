import { describe, expect, it } from 'vitest';
import { generateId, isValidStacksAddress } from '../shared/utils/common';

describe('shared/common isValidStacksAddress', () => {
  it('accepts a valid mainnet address', () => {
    expect(isValidStacksAddress('SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9')).toBe(true);
  });

  it('rejects lowercase addresses', () => {
    expect(isValidStacksAddress('sp3k8bc0ppevcv7nz6qsrwpq2je9e5b6n3pa0kbr9')).toBe(false);
  });

  it('accepts a valid testnet address', () => {
    expect(isValidStacksAddress('ST3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9')).toBe(true);
  });
});

describe('shared/common generateId', () => {
  it('floors decimal lengths', () => {
    expect(generateId(5.9)).toHaveLength(5);
  });

  it('never returns an empty id', () => {
    expect(generateId(0)).toHaveLength(1);
  });
});
