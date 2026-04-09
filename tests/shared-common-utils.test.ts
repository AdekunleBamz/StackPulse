import { afterEach, describe, expect, it, vi } from 'vitest';
import { clamp, debounce, generateId, isValidStacksAddress } from '../shared/utils/common';

afterEach(() => {
  vi.useRealTimers();
});

describe('shared/common isValidStacksAddress', () => {
  it('accepts a valid mainnet address', () => {
    expect(isValidStacksAddress('SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9')).toBe(true);
  });

  it('accepts valid addresses with surrounding whitespace', () => {
    expect(isValidStacksAddress('  SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9  ')).toBe(true);
  });

  it('rejects lowercase addresses', () => {
    expect(isValidStacksAddress('sp3k8bc0ppevcv7nz6qsrwpq2je9e5b6n3pa0kbr9')).toBe(false);
  });

  it('accepts a valid testnet address', () => {
    expect(isValidStacksAddress('ST3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9')).toBe(true);
  });

  it('accepts a valid devnet-style SN address', () => {
    expect(isValidStacksAddress('SN3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9')).toBe(true);
  });

  it('rejects addresses with unsupported network prefix', () => {
    expect(isValidStacksAddress('SM3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9')).toBe(false);
  });

  it('rejects non-string address inputs', () => {
    expect(isValidStacksAddress(12 as unknown as string)).toBe(false);
  });

  it('rejects too-short stack addresses', () => {
    expect(isValidStacksAddress('SP123')).toBe(false);
  });
});

describe('shared/common object helpers', () => {
  it('picks requested keys from objects', () => {
    expect(pick({ one: 1, two: 2 }, ['one'])).toEqual({ one: 1 });
  });

  it('skips missing keys when picking objects', () => {
    expect(pick({ one: 1 }, ['two' as never])).toEqual({});
  });

  it('omits requested keys from objects', () => {
    expect(omit({ one: 1, two: 2 }, ['two'])).toEqual({ one: 1 });
  });

  it('keeps objects unchanged when omitting missing keys', () => {
    expect(omit({ one: 1 }, ['two' as never])).toEqual({ one: 1 });
  });

  it('groups values by a derived key', () => {
    const grouped = groupBy(['alpha', 'alert'], value => value[0]);
    expect(grouped.get('a')).toEqual(['alpha', 'alert']);
  });

  it('returns an empty map for empty groups', () => {
    expect(groupBy([], value => String(value)).size).toBe(0);
  });

  it('maps object values while preserving keys', () => {
    expect(mapValues({ one: 1, two: 2 }, value => value * 2)).toEqual({ one: 2, two: 4 });
  });

  it('passes keys while mapping object values', () => {
    expect(mapValues({ one: 1 }, (_value, key) => key)).toEqual({ one: 'one' });
  });
});

describe('shared/common generateId', () => {
  it('uses eight characters by default', () => {
    expect(generateId()).toHaveLength(8);
  });

  it('floors decimal lengths', () => {
    expect(generateId(5.9)).toHaveLength(5);
  });

  it('never returns an empty id', () => {
    expect(generateId(0)).toHaveLength(1);
  });

  it('falls back to minimum length for non-finite values', () => {
    expect(generateId(Number.NaN)).toHaveLength(1);
  });

  it('caps very large id lengths to keep generation bounded', () => {
    expect(generateId(500)).toHaveLength(128);
  });
});

describe('shared/common clamp', () => {
  it('handles reversed bounds', () => {
    expect(clamp(5, 10, 0)).toBe(5);
  });

  it('keeps values already inside bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('caps values above the upper bound', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('raises values below the lower bound', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('falls back to lower bound for non-finite values', () => {
    expect(clamp(Number.NaN, 0, 10)).toBe(0);
  });
});

describe('shared/common debounce', () => {
  it('keeps only the last call arguments', () => {
    vi.useFakeTimers();
    const handler = vi.fn();
    const debounced = debounce(handler, 20);

    debounced('first');
    debounced('second');

    vi.advanceTimersByTime(19);
    expect(handler).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith('second');
  });

  it('treats non-finite waits as immediate', () => {
    vi.useFakeTimers();
    const handler = vi.fn();
    const debounced = debounce(handler, Number.POSITIVE_INFINITY);

    debounced('now');
    vi.advanceTimersByTime(0);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith('now');
  });
});

describe('shared/common debounce', () => {
  it('keeps only the last call arguments', () => {
    vi.useFakeTimers();
    const handler = vi.fn();
    const debounced = debounce(handler, 20);

    debounced('first');
    debounced('second');

    vi.advanceTimersByTime(19);
    expect(handler).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith('second');
  });
});
