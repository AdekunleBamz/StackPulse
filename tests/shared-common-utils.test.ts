import { afterEach, describe, expect, it, vi } from 'vitest';
import { clamp, debounce, generateId, isValidStacksAddress, sleep } from '../shared/utils/common';

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

  it('rejects addresses with unsupported network prefix', () => {
    expect(isValidStacksAddress('SM3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9')).toBe(false);
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
});
