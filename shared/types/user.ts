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

/**
 * Represents a registered StackPulse user.
 */
export interface User {
  /** The user's Stacks wallet address */
  address: string;
  /** The user's subscription tier level */
  tier: UserTier;
  /** Unix timestamp when the user registered */
  createdAt: number;
  /** Unix timestamp of the user's last activity */
  lastActiveAt?: number;
  /** Total number of alerts configured by this user */
  alertCount: number;
  /** Optional subscription identifier */
  subscriptionId?: string;
  /** Unix timestamp when the subscription expires */
  subscriptionExpiresAt?: number;
}

/**
 * Extended user profile information for display purposes.
 */
export interface UserProfile {
  /** The user's Stacks wallet address */
  address: string;
  /** Optional display name for the user */
  displayName?: string;
  /** Optional URL to the user's avatar image */
  avatarUrl?: string;
  /** Optional email address for notifications */
  email?: string;
  /** User's notification channel preferences */
  notificationPreferences: NotificationPreferences;
}

/**
 * User preferences for receiving notifications.
 */
export interface NotificationPreferences {
  /** Whether email notifications are enabled */
  email: boolean;
  /** Whether webhook notifications are enabled */
  webhook: boolean;
  /** Whether in-app notifications are enabled */
  inApp: boolean;
  /** Whether push notifications are enabled */
  push: boolean;
  /** Array of alert type IDs the user wants to be notified about */
  alertTypes: readonly number[];
}

/**
 * Request payload for creating a new user.
 */
export interface CreateUserRequest {
  /** The user's Stacks wallet address (required) */
  address: string;
  /** Optional display name for the user */
  displayName?: string;
}

/**
 * Request payload for updating a user's profile.
 */
export interface UpdateUserRequest {
  /** Updated display name */
  displayName?: string;
  /** Updated avatar URL */
  avatarUrl?: string;
  /** Updated email address */
  email?: string;
  /** Updated notification preferences */
  notificationPreferences?: Partial<NotificationPreferences>;
}

/**
 * Represents a user's subscription.
 */
export interface Subscription {
  /** Unique subscription identifier */
  id: string;
  /** The subscribed user's wallet address */
  userAddress: string;
  /** The subscription tier level */
  tier: UserTier;
  /** Unix timestamp when the subscription started */
  startedAt: number;
  /** Unix timestamp when the subscription expires */
  expiresAt: number;
  /** Whether the subscription auto-renews */
  autoRenew: boolean;
}
