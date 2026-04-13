/**
 * Shared Status and Type Constants
 */

export const ALERT_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  TRIGGERED: 'triggered',
  DISABLED: 'disabled',
} as const;

export type AlertStatus = typeof ALERT_STATUS[keyof typeof ALERT_STATUS];

export const SUBSCRIPTION_TIER = {
  FREE: 0,
  BASIC: 1,
  PRO: 2,
  ENTERPRISE: 3,
} as const;

export type SubscriptionTier = typeof SUBSCRIPTION_TIER[keyof typeof SUBSCRIPTION_TIER];

export const NETWORK_STATUS = {
  ONLINE: 'online',
  DEGRADED: 'degraded',
  MAINTENANCE: 'maintenance',
  OFFLINE: 'offline',
} as const;

export type NetworkStatus = typeof NETWORK_STATUS[keyof typeof NETWORK_STATUS];
