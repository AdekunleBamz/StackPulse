/**
 * Shared Utilities
 * Common utility functions used across the application
 */

/**
 * Format STX amount from micro-STX
 */
export function formatStxAmount(microStx: string | number): string {
  const amount = typeof microStx === 'string' ? Number.parseFloat(microStx) : microStx;
  const stx = (Number.isFinite(amount) ? amount : 0) / 1000000;
  return stx.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

/**
 * Truncate Stacks address for display
 */
export function truncateAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  const safeStart = Math.max(0, Math.floor(startChars));
  const safeEnd = Math.max(0, Math.floor(endChars));
  if (!address || address.length <= safeStart + safeEnd) {
    return address;
  }
  const startPart = address.slice(0, safeStart);
  const endPart = safeEnd > 0 ? address.slice(-safeEnd) : '';
  return `${startPart}...${endPart}`;
}

/**
 * Format timestamp to relative time
 */
export function formatRelativeTime(timestamp: number): string {
  if (!Number.isFinite(timestamp)) {
    return 'just now';
  }
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 0) return 'just now';
  
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
  // Mainnet: SP..., Testnet: ST...
  return /^S[PT][A-Z0-9]{38,40}$/.test(address);
}

/**
 * Generate random ID
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
 * Debounce function
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
 * Clamp number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  const lower = Math.min(min, max);
  const upper = Math.max(min, max);
  return Math.min(Math.max(value, lower), upper);
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
