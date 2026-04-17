import { useState, useEffect } from 'react';

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
export function useDebounce<T>(value: T, delay: number = 500): T {
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

export default useDebounce;
