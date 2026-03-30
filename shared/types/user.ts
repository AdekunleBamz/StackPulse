/**
 * User type definitions
 */

export enum UserTier {
  Free = 0,
  Basic = 1,
  Pro = 2,
  Premium = 3,
}

export const UserTierNames: Record<UserTier, string> = {
  [UserTier.Free]: 'Free',
  [UserTier.Basic]: 'Basic',
  [UserTier.Pro]: 'Pro',
  [UserTier.Premium]: 'Premium',
};

export interface UserTierLimit {
  maxAlerts: number;
  maxWebhooks: number;
  rateLimitPerMinute: number;
}

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
