/**
 * Shared Utilities
 * Common utility functions used across the application.
 * 
 * This module re-exports all utilities from the individual utility files
 * to provide a single entry point for importing shared utilities.
 */

// Re-export all formatting utilities
export {
  formatStxAmount,
  formatNumber,
  formatPercent,
  formatRelativeTime,
  formatDate,
  formatDateTime,
  truncateAddress,
  truncateString,
  formatFileSize,
  formatDuration,
  formatOrdinal,
  parseStxAmount,
  formatBalance,
  formatTxId,
} from './format';

// Re-export common utilities that are not in format.ts
export {
  isValidStacksAddress,
  generateId,
  debounce,
  clamp,
} from './common';

// Default export for convenience
export { default as formatUtils } from './format';
export { default as commonUtils } from './common';