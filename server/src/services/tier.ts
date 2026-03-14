/**
 * Tier Service
 * Manages user account tiers and limits
 */

export enum UserTier {
  FREE = 0,
  PRO = 1,
  WHALE = 2,
  EXCHANGE = 3
}

export interface TierLimits {
  maxAlerts: number;
  maxWebhooks: number;
  rateLimit: number;
  priorityNotifications: boolean;
}

export const TIER_LIMITS: Record<UserTier, TierLimits> = {
  [UserTier.FREE]: {
    maxAlerts: 5,
    maxWebhooks: 1,
    rateLimit: 100,
    priorityNotifications: false
  },
  [UserTier.PRO]: {
    maxAlerts: 50,
    maxWebhooks: 10,
    rateLimit: 1000,
    priorityNotifications: true
  },
  [UserTier.WHALE]: {
    maxAlerts: 500,
    maxWebhooks: 100,
    rateLimit: 5000,
    priorityNotifications: true
  },
  [UserTier.EXCHANGE]: {
    maxAlerts: 5000,
    maxWebhooks: 1000,
    rateLimit: 20000,
    priorityNotifications: true
  }
};

export function getTierLimits(tier: UserTier): TierLimits {
  return TIER_LIMITS[tier] || TIER_LIMITS[UserTier.FREE];
}

export default {
  UserTier,
  TIER_LIMITS,
  getTierLimits
};
