/**
 * Shared Utilities
 * Common utility functions used across the application
 */

/**
 * Format STX amount from micro-STX
 */
export function formatStxAmount(microStx: string | number): string {
  const amount = typeof microStx === 'string' ? parseFloat(microStx) : microStx;
  const stx = amount / 1000000;
  return stx.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

/**
 * Truncate Stacks address for display
 */
export function truncateAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  if (!address || address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format timestamp to relative time
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

/**
 * Validate Stacks address
 */
export function isValidStacksAddress(address: string): boolean {
  if (!address) return false;
  // Mainnet: SP, Testnet: ST
  const validPrefix = address.startsWith('SP') || address.startsWith('ST');
  return validPrefix && address.length >= 40 && address.length <= 42;
}

/**
 * Generate random ID
 */
export function generateId(length: number = 8): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Clamp number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export default {
  formatStxAmount,
  truncateAddress,
  formatRelativeTime,
  isValidStacksAddress,
  generateId,
  debounce,
  clamp
};
