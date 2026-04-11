import { useState, useEffect } from 'react';
import logger from '@/lib/logger';

/**
 * useLocalStorage hook
 * Persist state in localStorage
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Get stored value or initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
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
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      logger.error('Error writing to localStorage:', error);
    }
  }, [key, storedValue]);

  // Re-hydrate state when the storage key changes.
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (!item) {
        setStoredValue(initialValue);
        return;
      }
      const parsed = JSON.parse(item) as T | undefined;
      setStoredValue(parsed === undefined ? initialValue : parsed);
    } catch (error) {
      logger.error('Error hydrating localStorage key:', error);
      setStoredValue(initialValue);
    }
  }, [initialValue, key]);

  // Sync state when localStorage changes in other tabs/windows.
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== key) return;
      try {
        if (event.newValue === null) {
          setStoredValue(initialValue);
          return;
        }
        const parsed = JSON.parse(event.newValue) as T | undefined;
        setStoredValue(parsed === undefined ? initialValue : parsed);
      } catch (error) {
        logger.error('Error syncing localStorage event:', error);
        setStoredValue(initialValue);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [initialValue, key]);

  return [storedValue, setStoredValue];
}

export default useLocalStorage;
