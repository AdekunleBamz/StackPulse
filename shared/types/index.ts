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

export type UserTier = 'Free' | 'Basic' | 'Pro' | 'Premium';

export interface TierLimits {
  maxAlerts: number;
  features: string[];
  webhookSupport: boolean;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'alert' | 'badge' | 'subscription' | 'system';
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

export default {
  Alert,
  User,
  Notification,
  ApiResponse,
  PaginatedResponse,
};
