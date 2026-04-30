import { useState, useEffect } from 'react';

/**
 * useDebounce hook
 * Debounce a value
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
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
