/**
 * Tier Service
 * Manages user account tiers and limits
 */

export enum UserTier {
  FREE = 0,
  BASIC = 1,
  PRO = 2,
  PREMIUM = 3,
}

export interface TierLimits {
  maxAlerts: number;
  maxWebhooks: number;
  rateLimit: number;
  priorityNotifications: boolean;
}

export const TIER_LIMITS: Record<UserTier, TierLimits> = {
  [UserTier.FREE]: {
    maxAlerts: 3,
    maxWebhooks: 0,
    rateLimit: 100,
    priorityNotifications: false
  },
  [UserTier.BASIC]: {
    maxAlerts: 10,
    maxWebhooks: 1,
    rateLimit: 300,
    priorityNotifications: false
  },
  [UserTier.PRO]: {
    maxAlerts: 25,
    maxWebhooks: 5,
    rateLimit: 1000,
    priorityNotifications: true
  },
  [UserTier.PREMIUM]: {
    maxAlerts: 999,
    maxWebhooks: 20,
    rateLimit: 5000,
    priorityNotifications: true
  }
};

const tierCache = new Map<string, UserTier>();

function isValidTier(tier: number): tier is UserTier {
  return Number.isInteger(tier) && tier >= UserTier.FREE && tier <= UserTier.EXCHANGE;
}

export function getTierLimits(tier: number): TierLimits {
  return TIER_LIMITS[tier as UserTier] ?? TIER_LIMITS[UserTier.FREE];
}

export function getUserTier(address: string): UserTier {
  return tierCache.get(address) ?? UserTier.FREE;
}

export function setUserTier(address: string, tier: UserTier): void {
  tierCache.set(address, isValidTier(tier) ? tier : UserTier.FREE);
}

export default {
  UserTier,
  TIER_LIMITS,
  getTierLimits,
  getUserTier,
  setUserTier
};
