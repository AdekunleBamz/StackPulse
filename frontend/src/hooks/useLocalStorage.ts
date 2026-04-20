import { useState, useEffect } from 'react';
import logger from '@/lib/logger';

/**
 * A hook that synchronizes state with browser localStorage.
 * Persists state across page reloads and provides a setter that updates
 * both the React state and the stored value.
 *
 * @template T - The type of the stored value.
 * @param key - The localStorage key to use for persistence.
 * @param initialValue - The value to use if no stored value exists.
 * @returns A tuple of [storedValue, setValue] where setValue updates both state and localStorage.
 *
 * @example
 * ```tsx
 * const [theme, setTheme] = useLocalStorage('theme', 'light');
 * // theme will persist across page reloads
 * setTheme('dark'); // Updates both state and localStorage
 * ```
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // Get stored value or initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined' || !key) {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (!item) {
        return initialValue;
      }
      const parsed = JSON.parse(item) as T | undefined;
      return parsed === undefined ? initialValue : parsed;
    } catch (error) {
      logger.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  // Update localStorage when value changes
  useEffect(() => {
    if (typeof window === 'undefined' || !key) {
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      logger.error('Error writing to localStorage:', error);
    }
  }, [key, storedValue]);

  const removeValue = () => {
    if (typeof window !== 'undefined' && key) {
      try {
        window.localStorage.removeItem(key);
      } catch (error) {
        logger.error('Error removing localStorage key:', error);
      }
    }
    setStoredValue(initialValue);
  };

  return [storedValue, setStoredValue, removeValue];
}

/**
 * Removes a key from localStorage and clears the associated state.
 */
export function removeLocalStorageItem(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    logger.error('Error removing localStorage key:', error);
  }
}

/**
 * A hook that synchronizes state with browser sessionStorage.
 * Works like useLocalStorage but the value is cleared when the browser tab closes.
 *
 * @template T - The type of the stored value.
 * @param key - The sessionStorage key.
 * @param initialValue - The fallback value when nothing is stored.
 * @returns A tuple of [storedValue, setValue, removeValue].
 */
export function useSessionStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined' || !key) return initialValue;
    try {
      const item = window.sessionStorage.getItem(key);
      if (!item) return initialValue;
      const parsed = JSON.parse(item) as T | undefined;
      return parsed === undefined ? initialValue : parsed;
    } catch (error) {
      logger.error('Error reading from sessionStorage:', error);
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !key) return;
    try {
      window.sessionStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      logger.error('Error writing to sessionStorage:', error);
    }
  }, [key, storedValue]);

  const removeValue = () => {
    if (typeof window !== 'undefined' && key) {
      try {
        window.sessionStorage.removeItem(key);
      } catch (error) {
        logger.error('Error removing sessionStorage key:', error);
      }
    }
    setStoredValue(initialValue);
  };

  return [storedValue, setStoredValue, removeValue];
}

export default useLocalStorage;
