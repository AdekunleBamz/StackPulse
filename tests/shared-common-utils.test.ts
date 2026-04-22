import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clamp,
  debounce,
  endOfDay,
  generateId,
  groupBy,
  isExpiredDate,
  isSameDate,
  isValidStacksAddress,
  mapValues,
  omit,
  pick,
  retryWithBackoff,
  sleep,
  startOfDay,
  throttle,
} from '../shared/utils/common';

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
});

describe('shared/common object helpers', () => {
  it('picks requested keys from objects', () => {
    expect(pick({ one: 1, two: 2 }, ['one'])).toEqual({ one: 1 });
  });

  it('omits requested keys from objects', () => {
    expect(omit({ one: 1, two: 2 }, ['two'])).toEqual({ one: 1 });
  });

  it('groups values by a derived key', () => {
    const grouped = groupBy(['alpha', 'alert'], value => value[0]);
    expect(grouped.get('a')).toEqual(['alpha', 'alert']);
  });

  it('maps object values while preserving keys', () => {
    expect(mapValues({ one: 1, two: 2 }, value => value * 2)).toEqual({ one: 2, two: 4 });
  });
});

describe('shared/common generateId', () => {
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

  it('treats negative waits as immediate', () => {
    vi.useFakeTimers();
    const handler = vi.fn();
    const debounced = debounce(handler, -10);

    debounced('instant');
    vi.advanceTimersByTime(0);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith('instant');
  });

  it('preserves caller context when invoking debounced functions', () => {
    vi.useFakeTimers();
    const calls: number[] = [];
    const target = {
      value: 7,
      handler(this: { value: number }) {
        calls.push(this.value);
      },
    };
    const debounced = debounce(target.handler, 5);

    debounced.call(target);
    vi.advanceTimersByTime(5);

    expect(calls).toEqual([7]);
  });
});

describe('shared/common sleep', () => {
  it('treats negative durations as zero-delay', async () => {
    vi.useFakeTimers();
    const done = vi.fn();

    void sleep(-50).then(done);
    vi.advanceTimersByTime(0);
    await vi.runAllTimersAsync();

    expect(done).toHaveBeenCalledTimes(1);
  });

  it('treats non-finite durations as zero-delay', async () => {
    vi.useFakeTimers();
    const done = vi.fn();

    void sleep(Number.POSITIVE_INFINITY).then(done);
    vi.advanceTimersByTime(0);
    await vi.runAllTimersAsync();

    expect(done).toHaveBeenCalledTimes(1);
  });
});

describe('shared/common date helpers', () => {
  it('matches dates that fall on the same calendar day', () => {
    expect(isSameDate(new Date(2024, 0, 2, 1), new Date(2024, 0, 2, 23))).toBe(true);
  });

  it('separates dates on different calendar days', () => {
    expect(isSameDate(new Date(2024, 0, 2, 23), new Date(2024, 0, 3, 1))).toBe(false);
  });

  it('returns the start of a calendar day', () => {
    expect(startOfDay(new Date('2024-01-02T12:34:56')).getHours()).toBe(0);
  });

  it('returns the end of a calendar day', () => {
    expect(endOfDay(new Date('2024-01-02T12:34:56')).getHours()).toBe(23);
  });
});

describe('shared/common retryWithBackoff', () => {
  it('normalizes non-finite maxAttempts to a safe default', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    await expect(retryWithBackoff(fn, Number.NaN, 1)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('shared/common throttle', () => {
  it('preserves caller context when executing throttled callbacks', () => {
    vi.useFakeTimers();
    const calls: number[] = [];
    const target = {
      value: 11,
      handler(this: { value: number }) {
        calls.push(this.value);
      },
    };
    const throttled = throttle(target.handler, 10);

    throttled.call(target);
    expect(calls).toEqual([11]);
  });
});
