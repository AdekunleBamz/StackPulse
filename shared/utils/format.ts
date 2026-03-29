/**
 * Formatting utilities for display
 */

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
  const amount = typeof microStx === 'string' ? parseFloat(microStx) : microStx;
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const stx = safeAmount / 1000000;
  
  if (stx >= 1000000) {
    return `${(stx / 1000000).toFixed(2)}M STX`;
  }
  if (stx >= 1000) {
    return `${(stx / 1000).toFixed(2)}K STX`;
  }
  return `${stx.toFixed(6)} STX`;
}

/**
 * Formats a number with thousand separators for better readability.
 * @param num - The number or string representation to format.
 * @returns A formatted string (e.g., "1,234.56").
 */
export function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
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
export function formatPercent(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
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
  
  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  
  if (seconds < 60) return isFuture ? 'in a moment' : 'just now';
  if (minutes < 60) return isFuture ? `in ${minutes}m` : `${minutes}m ago`;
  if (hours < 24) return isFuture ? `in ${hours}h` : `${hours}h ago`;
  if (days < 7) return isFuture ? `in ${days}d` : `${days}d ago`;
  if (weeks < 4) return isFuture ? `in ${weeks}w` : `${weeks}w ago`;
  if (months < 12) return isFuture ? `in ${months}mo` : `${months}mo ago`;
  return isFuture ? `in ${Math.floor(days / 365)}y` : `${Math.floor(days / 365)}y ago`;
}

/**
 * Formats a timestamp into a readable date string.
 * @param timestamp - The timestamp as a number or Date object.
 * @param options - Optional Intl.DateTimeFormatOptions for customization.
 * @returns A locale-specific date string.
 */
export function formatDate(timestamp: number | Date, options?: Intl.DateTimeFormatOptions): string {
  const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
  return date.toLocaleDateString('en-US', options || {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Formats a timestamp into a string with both date and time.
 * @param timestamp - The timestamp as a number or Date object.
 * @returns A locale-specific date and time string.
 */
export function formatDateTime(timestamp: number | Date): string {
  const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
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
  if (!address || address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Truncates a string to a maximum length and appends an ellipsis.
 * @param str - The string to truncate.
 * @param maxLength - The maximum length before truncation.
 * @returns The truncated string with an ellipsis if it exceeded maxLength.
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
}

/**
 * Formats a byte value into a human-readable file size string.
 * @param bytes - The number of bytes to format.
 * @returns A formatted string with appropriate units (B, KB, MB, GB, TB).
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Formats a duration in milliseconds into a human-readable string.
 * @param ms - The duration in milliseconds.
 * @returns A formatted string (e.g., "1d 2h", "5m 30s", or "10s").
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Parses a display STX amount string into micro-STX.
 * @param amount - The STX amount string (may contain commas/units).
 * @returns The amount in micro-STX as a number.
 */
export function parseStxAmount(amount: string): number {
  const cleaned = amount.replace(/[^\d.]/g, '');
  const stx = parseFloat(cleaned);
  if (isNaN(stx)) return 0;
  return Math.floor(stx * 1000000);
}

/**
 * Formats a wallet balance with a fixed number of decimals.
 * @param balance - The balance as a number or string.
 * @param decimals - The number of decimals to display (default: 6).
 * @returns A formatted balance string.
 */
export function formatBalance(balance: number | string, decimals: number = 6): string {
  const bal = typeof balance === 'string' ? parseFloat(balance) : balance;
  return bal.toFixed(decimals);
}

/**
 * Formats a transaction ID for display using truncation.
 * @param txId - The full transaction ID string.
 * @returns A truncated transaction ID string.
 */
export function formatTxId(txId: string): string {
  return truncateAddress(txId, 8, 8);
}
