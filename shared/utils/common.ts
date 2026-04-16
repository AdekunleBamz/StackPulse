/**
 * Common Utility Functions
 * General-purpose utilities used across the application.
 */

/**
 * Validates whether a string is a valid Stacks address.
 * Mainnet addresses start with 'SP', testnet addresses start with 'ST'.
 * @param address - The Stacks address to validate.
 * @returns True if the address is valid, false otherwise.
 */
export function isValidStacksAddress(address: string): boolean {
  const normalizedAddress = typeof address === 'string' ? address.trim() : '';
  if (!normalizedAddress) return false;
  // Mainnet: SP..., Testnet: ST... (c32check encodes to exactly 41 characters)
  return /^S[PT][A-Z0-9]{39}$/.test(normalizedAddress);
}

/**
 * Generates a random alphanumeric ID string.
 * @param length - The desired length of the ID (default: 8).
 * @returns A random ID string of the specified length.
 */
export function generateId(length: number = 8): string {
  const safeLength = Math.max(1, Math.floor(length));
  let id = '';
  while (id.length < safeLength) {
    id += Math.random().toString(36).slice(2);
  }
  return id.slice(0, safeLength);
}

/**
 * Creates a debounced version of a function that delays invocation
 * until after a specified wait time has elapsed since the last call.
 * @param func - The function to debounce.
 * @param wait - The number of milliseconds to delay.
 * @returns A debounced version of the function.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const safeWait = Number.isFinite(wait) ? Math.max(0, wait) : 0;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, safeWait);
  };
}

/**
 * Clamps a number between a minimum and maximum value.
 * @param value - The value to clamp.
 * @param min - The minimum boundary.
 * @param max - The maximum boundary.
 * @returns The clamped value.
 */
export function clamp(value: number, min: number, max: number): number {
  const lower = Math.min(min, max);
  const upper = Math.max(min, max);
  return Math.min(Math.max(value, lower), upper);
}

// Default export for convenience
export default {
  isValidStacksAddress,
  generateId,
  debounce,
  clamp,
};

/**
 * Returns a promise that resolves after the specified number of milliseconds.
 * Useful for adding delays in async flows or tests.
 * @param ms - The number of milliseconds to wait.
 */
export function sleep(ms: number): Promise<void> {
  const safeDuration = Number.isFinite(ms) ? Math.max(0, ms) : 0;
  return new Promise((resolve) => setTimeout(resolve, safeDuration));
}
