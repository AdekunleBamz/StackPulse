import { useSyncExternalStore } from 'react';

const BREAKPOINT_MOBILE_MAX_PX = 640;
const BREAKPOINT_TABLET_MIN_PX = 641;
const BREAKPOINT_TABLET_MAX_PX = 1024;
const BREAKPOINT_DESKTOP_MIN_PX = 1025;
const BREAKPOINT_LARGE_SCREEN_MIN_PX = 1440;

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
export const useIsMobile = () => useMediaQuery(`(max-width: ${BREAKPOINT_MOBILE_MAX_PX}px)`);

/**
 * Hook to check if the viewport is tablet-sized (641px-1024px).
 * @returns True if the viewport width is between 641px and 1024px.
 */
export const useIsTablet = () => useMediaQuery(`(min-width: ${BREAKPOINT_TABLET_MIN_PX}px) and (max-width: ${BREAKPOINT_TABLET_MAX_PX}px)`);

/**
 * Hook to check if the viewport is desktop-sized (>1024px).
 * @returns True if the viewport width is greater than 1024px.
 */
export const useIsDesktop = () => useMediaQuery(`(min-width: ${BREAKPOINT_DESKTOP_MIN_PX}px)`);

/**
 * Hook to check if the viewport is large-screen-sized (≥1440px).
 * @returns True if the viewport width is 1440px or more.
 */
export const useIsLargeScreen = () => useMediaQuery(`(min-width: ${BREAKPOINT_LARGE_SCREEN_MIN_PX}px)`);

/**
 * Hook to check if the user prefers reduced motion.
 * Useful for disabling animations for accessibility.
 * @returns True when the user has requested reduced motion.
 */
export const usePreferReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');

/**
 * Hook to check if the user's system is in dark mode.
 * @returns True when the system colour scheme is dark.
 */
export const usePrefersDarkMode = () => useMediaQuery('(prefers-color-scheme: dark)');

/**
 * Hook to detect portrait orientation.
 * @returns True when the viewport is in portrait orientation.
 */
export const useIsPortrait = () => useMediaQuery('(orientation: portrait)');

export default useMediaQuery;
