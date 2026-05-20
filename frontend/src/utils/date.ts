/**
 * Date Formatting Utilities
 */

/**
 * Format a timestamp as a relative time string (e.g., "5m ago")
 */
export function formatRelativeTime(timestamp: number | string | Date): string {
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  
  return date.toLocaleDateString();
}

/**
 * Format a timestamp into a full localized string
 */
export function formatFullDate(timestamp: number | string | Date): string {
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

const dateUtils = { formatRelativeTime, formatFullDate };

export default dateUtils;
