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
  // Mainnet: SP, Testnet: ST/SN — body is 38–40 uppercase base-58 characters
  return /^(SP|ST|SN)[A-Z0-9]{38,40}$/.test(normalizedAddress);
}

/**
 * Generates a random alphanumeric ID string.
 * @param length - The desired length of the ID (default: 8).
 * @returns A random ID string of the specified length.
 */
export function generateId(length: number = 8): string {
  const safeLength = Number.isFinite(length) ? Math.min(128, Math.max(1, Math.floor(length))) : 1;
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

  return function executedFunction(this: unknown, ...args: Parameters<T>) {
    const context = this;
    const later = () => {
      timeout = null;
      func.apply(context, args);
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
  if (!Number.isFinite(value)) return lower;
  return Math.min(Math.max(value, lower), upper);
}

/**
 * Creates a throttled version of a function that invokes at most once per
 * every `wait` milliseconds. The first call fires immediately; subsequent
 * calls within the window are dropped.
 * @param func - The function to throttle.
 * @param wait - The throttle window in milliseconds.
 * @returns A throttled version of the function.
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  const safeWait = Number.isFinite(wait) ? Math.max(0, wait) : 0;

  return function throttled(this: unknown, ...args: Parameters<T>) {
    const now = Date.now();
    if (now - lastCall >= safeWait) {
      lastCall = now;
      func.apply(this, args);
    }
  };
}

// Default export for convenience
export default {
  isValidStacksAddress,
  generateId,
  debounce,
  throttle,
  clamp,
};

/**
 * Returns a promise that resolves after the specified number of milliseconds.
 * Useful for adding delays in async flows or tests.
 * @param ms - The number of milliseconds to wait.
 * @returns Promise that resolves after the bounded delay completes.
 */
export function sleep(ms: number): Promise<void> {
  const safeDuration = Number.isFinite(ms) ? Math.max(0, ms) : 0;
  return new Promise((resolve) => setTimeout(resolve, safeDuration));
}

/**
 * Retries an async operation with exponential backoff on failure.
 * @param fn - The async operation to retry.
 * @param maxAttempts - Maximum number of attempts (default: 3).
 * @param baseDelayMs - Initial delay in ms before first retry (default: 200).
 * @returns The resolved value from the operation.
 * @throws The last error if all attempts fail.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelayMs: number = 200
): Promise<T> {
  const safeMaxAttempts = Number.isFinite(maxAttempts) ? Math.max(1, Math.floor(maxAttempts)) : 3;
  const safeBaseDelayMs = Number.isFinite(baseDelayMs) ? Math.max(0, baseDelayMs) : 200;
  let lastError: unknown;
  for (let attempt = 1; attempt <= safeMaxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < safeMaxAttempts) {
        await sleep(safeBaseDelayMs * 2 ** (attempt - 1));
      }
    }
  }
  throw lastError;
}

/**
 * Returns a new object containing only the specified keys from the source object.
 * @param obj - The source object.
 * @param keys - The keys to include.
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Returns a new object with the specified keys removed from the source object.
 * @param obj - The source object.
 * @param keys - The keys to exclude.
 */
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result as Omit<T, K>;
}

/**
 * Groups an array of items by the value returned from the key function.
 * @param items - The array to group.
 * @param keyFn - A function that returns a string group key for each item.
 * @returns A Map of group key → array of items in that group.
 */
export function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const result = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const group = result.get(key);
    if (group) {
      group.push(item);
    } else {
      result.set(key, [item]);
    }
  }
  return result;
}

/**
 * Creates a new object by applying a transform function to each value of the source object.
 * @param obj - The source object.
 * @param fn - A function to apply to each value.
 * @returns A new object with the same keys but transformed values.
 */
export function mapValues<T extends object, R>(
  obj: T,
  fn: (value: T[keyof T], key: keyof T) => R
): Record<string, R> {
  const result: Record<string, R> = {};
  for (const key of Object.keys(obj) as (keyof T)[]) {
    result[key as string] = fn(obj[key], key);
  }
  return result;
}

/**
 * Returns true if two dates fall on the same calendar day (ignores time).
 * @param a - First date.
 * @param b - Second date.
 */
export function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Returns a new Date set to midnight (00:00:00.000) at the start of the given date's day.
 * @param date - The reference date.
 */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns a new Date set to 23:59:59.999 at the end of the given date's day.
 * @param date - The reference date.
 */
export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Returns true if the given date is in the past relative to now.
 * Useful for checking subscription or token expiry.
 * @param date - The date to check.
 */
export function isExpiredDate(date: Date): boolean {
  return date.getTime() < Date.now();
}

export function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

export function isPositiveNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0;
}

export function isValidBlockHeight(n: unknown): boolean {
  return Number.isInteger(n) && (n as number) >= 0;
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const safeSize = Number.isFinite(size) ? Math.max(1, Math.floor(size)) : 1;
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += safeSize) {
    result.push(arr.slice(i, i + safeSize));
  }
  return result;
}

export function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

export function isValidTxId(v: unknown): boolean {
  return typeof v === 'string' && /^(0x)?[a-f0-9]{64}$/i.test(v.trim());
}

export function isValidEmail(v: unknown): boolean {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export function flatten<T>(arr: T[][]): T[] {
  return arr.flat();
}

export function hasKey<T extends object>(obj: T, key: string): key is Extract<keyof T, string> {
  return Object.prototype.hasOwnProperty.call(obj, key);
}
