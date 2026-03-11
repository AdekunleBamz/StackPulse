/**
 * Formatting utilities for display
 */

/**
 * Format STX amount with proper decimals
 */
export function formatStxAmount(microStx: number | string): string {
  const amount = typeof microStx === 'string' ? parseFloat(microStx) : microStx;
  const stx = amount / 1000000;
  
  if (stx >= 1000000) {
    return `${(stx / 1000000).toFixed(2)}M STX`;
  }
  if (stx >= 1000) {
    return `${(stx / 1000).toFixed(2)}K STX`;
  }
  return `${stx.toFixed(6)} STX`;
}

/**
 * Format number with thousand separators
 */
export function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  return n.toLocaleString('en-US');
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format timestamp to relative time
 */
export function formatRelativeTime(timestamp: number | Date): string {
  const now = new Date().getTime();
  const time = typeof timestamp === 'number' ? timestamp : timestamp.getTime();
  const diff = now - time;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  
  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

/**
 * Format date to readable string
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
 * Format date with time
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
 * Truncate address for display
 */
export function truncateAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  if (!address || address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Truncate string with ellipsis
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
}

/**
 * Format file size
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
 * Format duration in milliseconds to human readable
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
 * Parse STX amount from display to microSTX
 */
export function parseStxAmount(amount: string): number {
  const cleaned = amount.replace(/[^\d.]/g, '');
  const stx = parseFloat(cleaned);
  if (isNaN(stx)) return 0;
  return Math.floor(stx * 1000000);
}

/**
 * Format wallet balance
 */
export function formatBalance(balance: number | string, decimals: number = 6): string {
  const bal = typeof balance === 'string' ? parseFloat(balance) : balance;
  return bal.toFixed(decimals);
}

/**
 * Format transaction ID
 */
export function formatTxId(txId: string): string {
  return truncateAddress(txId, 8, 8);
}
