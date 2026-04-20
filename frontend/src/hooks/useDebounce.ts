import { useState, useEffect, useRef } from 'react';

const DEBOUNCE_DEFAULT_DELAY_MS = 500;

/**
 * A hook that debounces a value by delaying updates until after the specified delay.
 * Useful for rate-limiting expensive operations like API calls or filtering.
 *
 * @template T - The type of the value to debounce.
 * @param value - The value to debounce.
 * @param delay - The debounce delay in milliseconds (default: 500).
 * @returns The debounced value, which updates after the delay has elapsed.
 *
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 300);
 * // debouncedSearch will only update 300ms after the user stops typing
 * ```
 */
export function useDebounce<T>(value: T, delay: number = DEBOUNCE_DEFAULT_DELAY_MS): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(() => value);
  const safeDelay = Number.isFinite(delay) ? Math.max(0, delay) : 0;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, safeDelay);

    return () => clearTimeout(handler);
  }, [safeDelay, value]);

  return debouncedValue;
}

/**
 * Extended debounce hook that also exposes an `isPending` flag.
 * `isPending` is true while the debounce timer is running (i.e. the value has
 * changed but the debounced output has not yet updated).
 *
 * @template T - The type of the value to debounce.
 * @param value - The value to debounce.
 * @param delay - The debounce delay in milliseconds (default: 500).
 * @returns An object with `debouncedValue` and `isPending`.
 */
export function useDebounceWithPending<T>(value: T, delay: number = DEBOUNCE_DEFAULT_DELAY_MS): { debouncedValue: T; isPending: boolean } {
  const [debouncedValue, setDebouncedValue] = useState<T>(() => value);
  const [isPending, setIsPending] = useState(false);
  const safeDelay = Number.isFinite(delay) ? Math.max(0, delay) : 0;
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setIsPending(true);
    const handler = setTimeout(() => {
      setDebouncedValue(value);
      setIsPending(false);
    }, safeDelay);

    return () => {
      clearTimeout(handler);
    };
  }, [safeDelay, value]);

  return { debouncedValue, isPending };
}

export default useDebounce;
