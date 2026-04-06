/**
 * User type definitions
 */

/**
 * Subscription tier levels for StackPulse users.
 * Higher tiers get increased rate limits and feature access.
 */
export enum UserTier {
  /** Free tier with basic features and limited alerts */
  Free = 0,
  /** Basic tier with expanded features */
  Basic = 1,
  /** Pro tier with advanced features */
  Pro = 2,
  /** Premium tier with unlimited access */
  Premium = 3,
}

/**
 * Human-readable names for each subscription tier.
 */
export const UserTierNames: Record<UserTier, string> = {
  [UserTier.Free]: 'Free',
  [UserTier.Basic]: 'Basic',
  [UserTier.Pro]: 'Pro',
  [UserTier.Premium]: 'Premium',
};

/**
 * Rate and feature limits applied per subscription tier.
 */
export interface UserTierLimit {
  maxAlerts: number;
  maxWebhooks: number;
  rateLimitPerMinute: number;
}

/**
 * Tier-specific limits for alerts, webhooks, and rate limiting.
 */
export const UserTierLimits: Record<UserTier, UserTierLimit> = {
  [UserTier.Free]: {
    maxAlerts: 3,
    maxWebhooks: 1,
    rateLimitPerMinute: 10,
  },
  [UserTier.Basic]: {
    maxAlerts: 10,
    maxWebhooks: 3,
    rateLimitPerMinute: 30,
  },
  [UserTier.Pro]: {
    maxAlerts: 25,
    maxWebhooks: 10,
    rateLimitPerMinute: 60,
  },
  [UserTier.Premium]: {
    maxAlerts: 999,
    maxWebhooks: 999,
    rateLimitPerMinute: 100,
  },
};

export interface User {
  address: string;
  tier: UserTier;
  createdAt: number;
  lastActiveAt?: number;
  alertCount: number;
  subscriptionId?: string;
  subscriptionExpiresAt?: number;
}

export interface UserProfile {
  address: string;
  displayName?: string;
  avatarUrl?: string;
  email?: string;
  notificationPreferences: NotificationPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  webhook: boolean;
  inApp: boolean;
  push: boolean;
  alertTypes: readonly number[];
}

export interface CreateUserRequest {
  address: string;
  displayName?: string;
}

export interface UpdateUserRequest {
  displayName?: string;
  avatarUrl?: string;
  email?: string;
  notificationPreferences?: Partial<NotificationPreferences>;
}

export interface Subscription {
  id: string;
  userAddress: string;
  tier: UserTier;
  startedAt: number;
  expiresAt: number;
  autoRenew: boolean;
}
