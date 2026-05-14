import { useSyncExternalStore } from 'react';

/**
 * A hook that tracks whether a CSS media query matches the current viewport.
 * Uses useSyncExternalStore for optimal React 18 compatibility.
 *
 * @param query - The CSS media query string to track (e.g., '(max-width: 768px)').
 * @returns True if the media query currently matches, false otherwise.
 *
 * @example
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 640px)');
 * // isMobile will be true when the viewport is 640px or narrower
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = (onStoreChange: () => void) => {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const mediaQuery = window.matchMedia(query);
    const listener = () => onStoreChange();
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', listener);
    } else {
      mediaQuery.addListener(listener);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', listener);
      } else {
        mediaQuery.removeListener(listener);
      }
    };
  };

  const getSnapshot = () => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia(query).matches;
  };

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/**
 * Hook to check if the viewport is mobile-sized (≤640px).
 * @returns True if the viewport width is 640px or less.
 */
export const useIsMobile = () => useMediaQuery('(max-width: 640px)');

/**
 * Hook to check if the viewport is tablet-sized (641px-1024px).
 * @returns True if the viewport width is between 641px and 1024px.
 */
export const useIsTablet = () => useMediaQuery('(min-width: 641px) and (max-width: 1024px)');

/**
 * Hook to check if the viewport is desktop-sized (≥1025px).
 * @returns True if the viewport width is 1025px or more.
 */
export const useIsDesktop = () => useMediaQuery('(min-width: 1025px)');

export default useMediaQuery;
