/**
 * Formatting utilities for display
 */

const MICROSTX_PER_STX = 1000000;
/** Default date shape used by dashboard tables and activity lists. */
const DEFAULT_DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
};
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const MILLISECONDS_PER_SECOND = 1000;
const DAYS_PER_WEEK = 7;
const WEEKS_PER_MONTH = 4;
const MONTHS_PER_YEAR = 12;
const DAYS_PER_YEAR = 365;
const BYTES_PER_UNIT = 1024;
const FILE_SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
const STX_PER_THOUSAND = 1000;
const STX_PER_MILLION = 1000000;
const TX_ID_PREFIX_LENGTH = 8;
const TX_ID_SUFFIX_LENGTH = 8;
const DEFAULT_PERCENT_DECIMALS = 2;
const DEFAULT_BALANCE_DECIMALS = 6;

/**
 * Formats a micro-STX amount into a human-readable STX string.
 * @param microStx - The amount in micro-STX (1 STX = 1,000,000 micro-STX).
 * @returns A formatted string with appropriate units (STX, K STX, or M STX).
 * @example
 * formatStxAmount(1000000) // "1.000000 STX"
 * formatStxAmount(1500000000) // "1.50K STX"
 * formatStxAmount("2000000000000") // "2.00M STX"
 */
export function formatStxAmount(microStx: number | string): string {
  const amount = (() => {
    if (typeof microStx !== 'string') return microStx;

    const normalized = microStx.trim().replace(/,/g, '');
    if (!/^\d+(\.\d+)?$/.test(normalized)) return 0;

    return Number(normalized);
  })();
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const stx = safeAmount / MICROSTX_PER_STX;
  
  if (stx >= STX_PER_MILLION) {
    return `${(stx / STX_PER_MILLION).toFixed(2)}M STX`;
  }
  if (stx >= STX_PER_THOUSAND) {
    return `${(stx / STX_PER_THOUSAND).toFixed(2)}K STX`;
  }
  return `${stx.toFixed(6)} STX`;
}

/**
 * Formats a number with thousand separators for better readability.
 * @param num - The number or string representation to format.
 * @returns A formatted string (e.g., "1,234.56").
 */
export function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? Number.parseFloat(num.replace(/,/g, '')) : num;
  if (!Number.isFinite(n)) {
    return '0';
  }
  return n.toLocaleString('en-US');
}

/**
 * Formats a decimal value as a percentage string.
 * @param value - The value to format.
 * @param decimals - The number of decimal places to include (default: 2).
 * @returns A formatted percentage string (e.g., "12.34%").
 */
export function formatPercent(value: number, decimals: number = DEFAULT_PERCENT_DECIMALS): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  const safeDecimals = Number.isFinite(decimals)
    ? Math.max(0, Math.min(6, Math.floor(decimals)))
    : DEFAULT_PERCENT_DECIMALS;
  return `${safeValue.toFixed(safeDecimals)}%`;
}

/**
 * Formats a timestamp as a relative time string (e.g., "5m ago").
 * @param timestamp - The timestamp as a number or Date object.
 * @returns A human-readable relative time string.
 */
export function formatRelativeTime(timestamp: number | Date): string {
  const now = new Date().getTime();
  const time = typeof timestamp === 'number' ? timestamp : timestamp.getTime();
  const diff = now - time;
  const isFuture = diff < 0;
  const absDiff = Math.abs(diff);
  
  const seconds = Math.floor(absDiff / MILLISECONDS_PER_SECOND);
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const days = Math.floor(hours / HOURS_PER_DAY);
  const weeks = Math.floor(days / DAYS_PER_WEEK);
  const months = Math.floor(days / 30);
  
  if (seconds < SECONDS_PER_MINUTE) return isFuture ? 'in a moment' : 'just now';
  if (minutes < MINUTES_PER_HOUR) return isFuture ? `in ${minutes}m` : `${minutes}m ago`;
  if (hours < HOURS_PER_DAY) return isFuture ? `in ${hours}h` : `${hours}h ago`;
  if (days < DAYS_PER_WEEK) return isFuture ? `in ${days}d` : `${days}d ago`;
  if (weeks < WEEKS_PER_MONTH) return isFuture ? `in ${weeks}w` : `${weeks}w ago`;
  if (months < MONTHS_PER_YEAR) return isFuture ? `in ${months}mo` : `${months}mo ago`;
  return isFuture ? `in ${Math.floor(days / DAYS_PER_YEAR)}y` : `${Math.floor(days / DAYS_PER_YEAR)}y ago`;
}

/**
 * Formats a timestamp into a readable date string.
 * @param timestamp - The timestamp as a number or Date object.
 * @param options - Optional Intl.DateTimeFormatOptions for customization.
 * @returns A locale-specific date string.
 */
export function formatDate(timestamp: number | Date, options?: Intl.DateTimeFormatOptions): string {
  const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }
  return date.toLocaleDateString('en-US', options || DEFAULT_DATE_FORMAT_OPTIONS);
}

/**
 * Formats a timestamp into a string with both date and time.
 * @param timestamp - The timestamp as a number or Date object.
 * @returns A locale-specific date and time string.
 */
export function formatDateTime(timestamp: number | Date): string {
  const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Truncates a Stacks address for display.
 * @param address - The full Stacks address.
 * @param startChars - Number of characters to keep at the start (default: 6).
 * @param endChars - Number of characters to keep at the end (default: 4).
 * @returns A truncated address string (e.g., "SP123...4567").
 */
export function truncateAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  const safeStart = Number.isFinite(startChars) ? Math.max(0, Math.floor(startChars)) : 6;
  const safeEnd = Number.isFinite(endChars) ? Math.max(0, Math.floor(endChars)) : 4;
  if (!address || safeStart + safeEnd <= 0 || address.length <= safeStart + safeEnd) {
    return address;
  }
  const tail = safeEnd > 0 ? address.slice(-safeEnd) : '';
  return `${address.slice(0, safeStart)}...${tail}`;
}

/**
 * Truncates a string to a maximum length and appends an ellipsis.
 * @param str - The string to truncate.
 * @param maxLength - The maximum length before truncation.
 * @returns The truncated string with an ellipsis if it exceeded maxLength.
 */
export function truncateString(str: string, maxLength: number): string {
  const safeMaxLength = Number.isFinite(maxLength) ? Math.max(0, Math.floor(maxLength)) : 0;
  if (str.length <= safeMaxLength) return str;
  return `${str.slice(0, safeMaxLength)}...`;
}

/**
 * Formats a byte value into a human-readable file size string.
 * @param bytes - The number of bytes to format.
 * @returns A formatted string with appropriate units (B, KB, MB, GB, TB).
 */
export function formatFileSize(bytes: number): string {
  let size = Number.isFinite(bytes) ? Math.max(0, bytes) : 0;
  let unitIndex = 0;
  
  while (size >= BYTES_PER_UNIT && unitIndex < FILE_SIZE_UNITS.length - 1) {
    size /= BYTES_PER_UNIT;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${FILE_SIZE_UNITS[unitIndex]}`;
}

/**
 * Formats a duration in milliseconds into a human-readable string.
 * @param ms - The duration in milliseconds.
 * @returns A formatted string (e.g., "1d 2h", "5m 30s", or "10s").
 */
export function formatDuration(ms: number): string {
  const safeMs = Number.isFinite(ms) ? Math.max(0, ms) : 0;
  const seconds = Math.floor(safeMs / MILLISECONDS_PER_SECOND);
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const days = Math.floor(hours / HOURS_PER_DAY);
  
  if (days > 0) return `${days}d ${hours % HOURS_PER_DAY}h`;
  if (hours > 0) return `${hours}h ${minutes % MINUTES_PER_HOUR}m`;
  if (minutes > 0) return `${minutes}m ${seconds % SECONDS_PER_MINUTE}s`;
  return `${seconds}s`;
}

/**
 * Parses a display STX amount string into micro-STX.
 * @param amount - The STX amount string (may contain commas/units).
 * @returns The amount in micro-STX as a number.
 */
export function parseStxAmount(amount: string): number {
  const cleaned = amount
    .trim()
    .replace(/,/g, '')
    .replace(/\s*stx$/i, '')
    .trim();
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return 0;
  const stx = Number(cleaned);
  if (!Number.isFinite(stx)) return 0;
  return Math.max(0, Math.floor(stx * MICROSTX_PER_STX));
}

/**
 * Formats a wallet balance with a fixed number of decimals.
 * @param balance - The balance as a number or string.
 * @param decimals - The number of decimals to display (default: 6).
 * @returns A formatted balance string.
 */
export function formatBalance(balance: number | string, decimals: number = DEFAULT_BALANCE_DECIMALS): string {
  const bal = typeof balance === 'string' ? Number.parseFloat(balance.replace(/,/g, '')) : balance;
  const safeDecimals = Number.isFinite(decimals)
    ? Math.max(0, Math.min(12, Math.floor(decimals)))
    : DEFAULT_BALANCE_DECIMALS;
  if (!Number.isFinite(bal)) {
    return (0).toFixed(safeDecimals);
  }
  return bal.toFixed(safeDecimals);
}

/**
 * Formats a transaction ID for display using truncation.
 * @param txId - The full transaction ID string.
 * @returns A truncated transaction ID string.
 */
export function formatTxId(txId: string): string {
  return truncateAddress(txId, TX_ID_PREFIX_LENGTH, TX_ID_SUFFIX_LENGTH);
}
