/**
 * Shared Types
 * Common type definitions used across the application
 */

// Alert Types
export interface Alert {
  id: string;
  name: string;
  userAddress: string;
  alertType: number;
  threshold?: number;
  targetAddress?: string;
  webhookUrl?: string;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
  triggerCount: number;
}

// User Types
export interface User {
  address: string;
  displayName?: string;
  tier: number;
  createdAt: number;
  alertCount: number;
  badgeCount: number;
}

// Notification Types
export type NotificationType = 'alert' | 'badge' | 'subscription' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  userAddress?: string;
  timestamp: number;
  read: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination Types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
